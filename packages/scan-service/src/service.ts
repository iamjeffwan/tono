import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  claimRoleChangeResponseSchema,
  completeRoleChangeRequestSchema,
  createApplySessionRequestSchema,
  createApplySessionResponseSchema,
  createScanSessionRequestSchema,
  createScanSessionResponseSchema,
  getScanSessionResponseSchema,
  roleChangeRequestSchema,
  roleChangeViewSchema,
  scanResultSchema,
  submitRoleChangeResponseSchema,
  type ApplyRejectionCode,
  type RoleChangeRequest,
  type CreateApplySessionResponse,
  type CreateScanSessionRequest,
  type CreateScanSessionResponse,
  type GetScanSessionResponse,
  type ScanResult,
  type ScanSessionStatus,
  type UploadScanResultResponse,
} from '@design-system-guardrails/scan-contract'
import { paletteSteps, scaleVariables } from './palette.js'
import type { ScanSessionStore, StoredRoleChange, StoredScanSession } from './store.js'

const DEFAULT_TOKEN_TTL_MS = 10 * 60 * 1000
const CLAIM_TIMEOUT_MS = 60 * 1000
const WAITING_HEARTBEAT_MS = 10 * 1000
const DEFAULT_CLI_PACKAGE = '@design-guardrails/cli'

export type ScanServiceOptions = {
  store: ScanSessionStore
  now?: () => Date
  tokenTtlMs?: number
  cliPackageName?: string
}

export class ScanServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ScanServiceError'
  }
}

export class ScanService {
  private readonly now: () => Date
  private readonly tokenTtlMs: number
  private readonly cliPackageName: string

  constructor(private readonly options: ScanServiceOptions) {
    this.now = options.now ?? (() => new Date())
    this.tokenTtlMs = options.tokenTtlMs ?? DEFAULT_TOKEN_TTL_MS
    this.cliPackageName = options.cliPackageName ?? DEFAULT_CLI_PACKAGE
  }

  createSession(input: CreateScanSessionRequest, serverUrl = 'http://127.0.0.1:3001'): CreateScanSessionResponse {
    const request = createScanSessionRequestSchema.parse(input)
    const createdAt = this.now()
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(createdAt.getTime() + this.tokenTtlMs)
    const sessionId = `scan_${randomBytes(12).toString('hex')}`

    const session: StoredScanSession = {
      id: sessionId,
      projectId: request.projectId,
      tokenHash: hashToken(token),
      tokenExpiresAt: expiresAt.toISOString(),
      status: 'waiting_cli',
      createdAt: createdAt.toISOString(),
      tokenUsedAt: null,
      result: null,
      error: null,
    }
    this.options.store.create(session)

    return createScanSessionResponseSchema.parse({
      sessionId,
      token,
      expiresAt: expiresAt.toISOString(),
      command: `npx ${this.cliPackageName} scan --session ${sessionId} --token ${token} --server ${serverUrl}`,
    })
  }

  getSession(sessionId: string): GetScanSessionResponse {
    const session = this.getRequiredSession(sessionId)
    this.expireIfNeeded(session)
    const parsed = scanResultSchema.safeParse(session.result)
    return getScanSessionResponseSchema.parse({
      sessionId: session.id,
      status: session.status,
      result: parsed.success ? parsed.data : null,
      error: session.result && !parsed.success ? { code: 'RESULT_VERSION_UNSUPPORTED', message: 'Stored result uses an older protocol. Create a new scan.' } : session.error,
    })
  }

  uploadResult(
    sessionId: string,
    token: string,
    result: unknown,
  ): UploadScanResultResponse {
    const session = this.getRequiredSession(sessionId)
    const now = this.now()

    if (new Date(session.tokenExpiresAt).getTime() <= now.getTime()) {
      this.expireIfNeeded(session)
      throw new ScanServiceError(
        'SCAN_SESSION_EXPIRED',
        410,
        'The scan session or upload token has expired.',
      )
    }

    if (session.tokenUsedAt) {
      throw new ScanServiceError(
        'SCAN_TOKEN_ALREADY_USED',
        409,
        'The upload token has already been used.',
      )
    }

    if (!safeEqual(hashToken(token), session.tokenHash)) {
      throw new ScanServiceError(
        'SCAN_TOKEN_INVALID',
        401,
        'The upload token is invalid.',
      )
    }

    const parsedResult = scanResultSchema.safeParse(result)
    if (!parsedResult.success) {
      throw new ScanServiceError(
        'SCAN_RESULT_INVALID',
        400,
        'The scan result does not match the scan contract.',
      )
    }

    session.status = 'completed'
    session.tokenUsedAt = now.toISOString()
    session.result = parsedResult.data
    session.error = null
    this.options.store.update(session)

    return { accepted: true, status: 'completed' }
  }

  createApplySession(input: unknown, serverUrl = 'http://127.0.0.1:3001'): CreateApplySessionResponse {
    const request = createApplySessionRequestSchema.parse(input)
    const scan = this.getRequiredSession(request.scanSessionId)
    this.expireIfNeeded(scan)
    const themeConfirmed = scan.result?.theme.status === 'located' && scan.result.theme.path === request.themePath
    if (scan.status !== 'completed' || !themeConfirmed) {
      throw new ScanServiceError('THEME_UNCONFIRMED', 409, 'Confirm the located theme before writing role changes.')
    }
    const token = randomBytes(32).toString('base64url')
    const applyId = `apply_${randomBytes(12).toString('hex')}`
    this.options.store.createApply({
      id: applyId, projectId: scan.projectId, scanSessionId: scan.id, themePath: request.themePath,
      tokenHash: hashToken(token), createdAt: this.now().toISOString(), waitingUntil: null,
    })
    return createApplySessionResponseSchema.parse({
      applyId, token, themePath: request.themePath,
      command: `npx ${this.cliPackageName} apply --session ${scan.id} --apply ${applyId} --token ${token} --theme ${request.themePath} --server ${serverUrl}`,
    })
  }

  submitRoleChange(applyId: string, input: unknown) {
    const request = roleChangeRequestSchema.parse(input)
    this.getRequiredApply(applyId)
    if (!paletteSteps.has(request.step)) {
      return submitRoleChangeResponseSchema.parse({ changeId: `change_${randomBytes(12).toString('hex')}`, status: 'rejected', reason: 'STEP_UNKNOWN' })
    }
    const changeId = `change_${randomBytes(12).toString('hex')}`
    this.options.store.insertChange({
      id: changeId, applyId, kind: 'role', role: request.role, mode: request.mode, step: request.step,
      status: 'waiting', reason: null, claimToken: null, claimedAt: null, createdAt: this.now().toISOString(), position: 0,
    })
    return this.viewChange(applyId, changeId)
  }

  submitScale(applyId: string) {
    this.getRequiredApply(applyId)
    const changeId = `change_${randomBytes(12).toString('hex')}`
    this.options.store.insertChange({
      id: changeId, applyId, kind: 'scale', role: '', mode: 'light', step: '',
      status: 'waiting', reason: null, claimToken: null, claimedAt: null, createdAt: this.now().toISOString(), position: 0,
    })
    return this.viewChange(applyId, changeId)
  }

  getRoleChange(applyId: string, changeId: string) {
    this.getRequiredApply(applyId)
    return this.viewChange(applyId, changeId)
  }

  claimRoleChange(applyId: string, token: string) {
    const apply = this.authorizeApply(applyId, token)
    const now = this.now()
    this.options.store.markApplyWaiting(apply.id, new Date(now.getTime() + WAITING_HEARTBEAT_MS).toISOString())
    this.options.store.releaseStaleClaims(apply.id, new Date(now.getTime() - CLAIM_TIMEOUT_MS).toISOString())
    const claimToken = randomBytes(32).toString('base64url')
    const change = this.options.store.claimNext(apply.id, claimToken, now.toISOString())
    return claimRoleChangeResponseSchema.parse({ change: change ? claimedChange(change, claimToken) : null })
  }

  completeRoleChange(applyId: string, changeId: string, token: string, input: unknown) {
    this.authorizeApply(applyId, token)
    const request = completeRoleChangeRequestSchema.parse(input)
    const completed = this.options.store.completeChange(applyId, changeId, request.claimToken, request.status, request.reason)
    if (!completed) throw new ScanServiceError('CLAIM_SUPERSEDED', 409, 'The claim is no longer current.')
    return this.viewChange(applyId, changeId)
  }

  private viewChange(applyId: string, changeId: string) {
    const change = this.options.store.getChange(applyId, changeId)
    if (!change) throw new ScanServiceError('ROLE_CHANGE_NOT_FOUND', 404, 'The role change was not found.')
    return roleChangeViewSchema.parse(viewedChange(change))
  }

  private authorizeApply(applyId: string, token: string) {
    const apply = this.getRequiredApply(applyId)
    if (!safeEqual(hashToken(token), apply.tokenHash)) {
      throw new ScanServiceError('SCAN_TOKEN_INVALID', 401, 'The upload token is invalid.')
    }
    return apply
  }

  private getRequiredApply(applyId: string) {
    const apply = this.options.store.getApply(applyId)
    if (!apply) throw new ScanServiceError('APPLY_SESSION_NOT_FOUND', 404, 'The apply session was not found.')
    return apply
  }

  private getRequiredSession(sessionId: string) {
    const session = this.options.store.get(sessionId)
    if (!session) {
      throw new ScanServiceError(
        'SCAN_SESSION_NOT_FOUND',
        404,
        'The scan session was not found.',
      )
    }
    return session
  }

  private expireIfNeeded(session: StoredScanSession) {
    if (
      session.status !== 'completed' &&
      new Date(session.tokenExpiresAt).getTime() <= this.now().getTime()
    ) {
      session.status = 'expired'
      session.error = {
        code: 'SCAN_SESSION_EXPIRED',
        message: 'The scan session or upload token has expired.',
      }
      this.options.store.update(session)
    }
  }
}

function publicStatus(change: StoredRoleChange) {
  return change.status === 'claimed' ? 'waiting' : change.status
}

function viewedChange(change: StoredRoleChange) {
  const shared = {
    changeId: change.id,
    status: publicStatus(change),
    reason: change.reason as ApplyRejectionCode | null,
  }
  if (change.kind === 'scale') return { kind: 'scale' as const, ...shared }
  return {
    kind: 'role' as const, ...shared,
    role: change.role as RoleChangeRequest['role'],
    mode: change.mode,
    step: change.step,
  }
}

function claimedChange(change: StoredRoleChange, claimToken: string) {
  if (change.kind === 'scale') {
    return { kind: 'scale' as const, changeId: change.id, claimToken, variables: scaleVariables }
  }
  return { kind: 'role' as const, changeId: change.id, claimToken, role: change.role, mode: change.mode, step: change.step }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export type { ScanResult, ScanSessionStatus }

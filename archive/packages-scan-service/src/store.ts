import Database from 'better-sqlite3'
import type { ScanResult, ScanSessionStatus } from '@design-system/scan-contract'

export type StoredScanSession = {
  id: string
  projectId: string
  tokenHash: string
  tokenExpiresAt: string
  status: ScanSessionStatus
  createdAt: string
  tokenUsedAt: string | null
  result: ScanResult | null
  error: { code: string; message: string } | null
}

export type StoredApplySession = {
  id: string
  projectId: string
  scanSessionId: string
  themePath: string
  tokenHash: string
  createdAt: string
  waitingUntil: string | null
}

export type StoredRoleChange = {
  id: string
  applyId: string
  kind: 'role' | 'scale'
  role: string
  mode: 'light' | 'dark'
  step: string
  status: 'waiting' | 'claimed' | 'written' | 'rejected'
  reason: string | null
  claimToken: string | null
  claimedAt: string | null
  createdAt: string
  position: number
}

export interface ScanSessionStore {
  create(session: StoredScanSession): void
  get(id: string): StoredScanSession | null
  update(session: StoredScanSession): void
  createApply(session: StoredApplySession): void
  getApply(id: string): StoredApplySession | null
  markApplyWaiting(id: string, until: string): void
  insertChange(change: StoredRoleChange): void
  listChanges(applyId: string): StoredRoleChange[]
  getChange(applyId: string, changeId: string): StoredRoleChange | null
  claimNext(applyId: string, claimToken: string, claimedAt: string): StoredRoleChange | null
  releaseStaleClaims(applyId: string, claimedBefore: string): void
  completeChange(applyId: string, changeId: string, claimToken: string, status: 'written' | 'rejected', reason: string | null): boolean
}

export class InMemoryScanSessionStore implements ScanSessionStore {
  private readonly sessions = new Map<string, StoredScanSession>()
  private readonly applies = new Map<string, StoredApplySession>()
  private readonly changes: StoredRoleChange[] = []
  private position = 0

  create(session: StoredScanSession) {
    this.sessions.set(session.id, structuredClone(session))
  }

  get(id: string) {
    const session = this.sessions.get(id)
    return session ? structuredClone(session) : null
  }

  update(session: StoredScanSession) {
    if (!this.sessions.has(session.id)) {
      throw new Error(`Unknown scan session: ${session.id}`)
    }
    this.sessions.set(session.id, structuredClone(session))
  }

  createApply(session: StoredApplySession) {
    this.applies.set(session.id, structuredClone(session))
  }

  getApply(id: string) {
    const session = this.applies.get(id)
    return session ? structuredClone(session) : null
  }

  markApplyWaiting(id: string, until: string) {
    const session = this.applies.get(id)
    if (!session) throw new Error(`Unknown apply session: ${id}`)
    session.waitingUntil = until
  }

  insertChange(change: StoredRoleChange) {
    this.changes.push({ ...structuredClone(change), position: ++this.position })
  }

  listChanges(applyId: string) {
    return this.changes.filter((change) => change.applyId === applyId).map((change) => structuredClone(change))
  }

  getChange(applyId: string, changeId: string) {
    const change = this.changes.find((item) => item.applyId === applyId && item.id === changeId)
    return change ? structuredClone(change) : null
  }

  claimNext(applyId: string, claimToken: string, claimedAt: string) {
    const change = this.changes
      .filter((item) => item.applyId === applyId && item.status === 'waiting')
      .sort((left, right) => left.position - right.position)[0]
    if (!change) return null
    change.status = 'claimed'
    change.claimToken = claimToken
    change.claimedAt = claimedAt
    return structuredClone(change)
  }

  releaseStaleClaims(applyId: string, claimedBefore: string) {
    for (const change of this.changes) {
      if (change.applyId === applyId && change.status === 'claimed' && change.claimedAt && change.claimedAt <= claimedBefore) {
        change.status = 'waiting'
        change.claimToken = null
        change.claimedAt = null
      }
    }
  }

  completeChange(applyId: string, changeId: string, claimToken: string, status: 'written' | 'rejected', reason: string | null) {
    const change = this.changes.find((item) => item.applyId === applyId && item.id === changeId && item.status === 'claimed' && item.claimToken === claimToken)
    if (!change) return false
    change.status = status
    change.reason = reason
    change.claimToken = null
    return true
  }
}

type ApplyRow = {
  id: string
  project_id: string
  scan_session_id: string
  theme_path: string
  token_hash: string
  created_at: string
  waiting_until: string | null
}

type ChangeRow = {
  id: string
  apply_id: string
  kind: 'role' | 'scale' | null
  role: string
  mode: 'light' | 'dark'
  step: string
  status: StoredRoleChange['status']
  reason: string | null
  claim_token: string | null
  claimed_at: string | null
  created_at: string
  position: number
}

type SessionRow = {
  id: string
  project_id: string
  token_hash: string
  token_expires_at: string
  status: ScanSessionStatus
  created_at: string
  token_used_at: string | null
  result_json: string | null
  error_json: string | null
}

export class SqliteScanSessionStore implements ScanSessionStore {
  private readonly database: Database.Database

  constructor(filePath: string) {
    this.database = new Database(filePath)
    this.database.pragma('journal_mode = WAL')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS apply_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        scan_session_id TEXT NOT NULL,
        theme_path TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        waiting_until TEXT
      );
      CREATE TABLE IF NOT EXISTS role_changes (
        id TEXT NOT NULL,
        apply_id TEXT NOT NULL,
        kind TEXT,
        role TEXT,
        mode TEXT,
        step TEXT,
        status TEXT NOT NULL,
        reason TEXT,
        claim_token TEXT,
        claimed_at TEXT,
        created_at TEXT NOT NULL,
        position INTEGER PRIMARY KEY AUTOINCREMENT
      );
      CREATE TABLE IF NOT EXISTS scan_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_expires_at TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        token_used_at TEXT,
        result_json TEXT,
        error_json TEXT
      )
    `)
    this.ensureChangeKind()
  }

  create(session: StoredScanSession) {
    this.database
      .prepare(
        `INSERT INTO scan_sessions
          (id, project_id, token_hash, token_expires_at, status, created_at, token_used_at, result_json, error_json)
         VALUES (@id, @projectId, @tokenHash, @tokenExpiresAt, @status, @createdAt, @tokenUsedAt, @resultJson, @errorJson)`,
      )
      .run(this.toRowParams(session))
  }

  get(id: string) {
    const row = this.database
      .prepare('SELECT * FROM scan_sessions WHERE id = ?')
      .get(id) as SessionRow | undefined
    return row ? this.fromRow(row) : null
  }

  update(session: StoredScanSession) {
    const result = this.database
      .prepare(
        `UPDATE scan_sessions SET
          project_id = @projectId,
          token_hash = @tokenHash,
          token_expires_at = @tokenExpiresAt,
          status = @status,
          created_at = @createdAt,
          token_used_at = @tokenUsedAt,
          result_json = @resultJson,
          error_json = @errorJson
         WHERE id = @id`,
      )
      .run(this.toRowParams(session))

    if (result.changes !== 1) {
      throw new Error(`Unknown scan session: ${session.id}`)
    }
  }

  createApply(session: StoredApplySession) {
    this.database.prepare(
      `INSERT INTO apply_sessions
        (id, project_id, scan_session_id, theme_path, token_hash, created_at, waiting_until)
       VALUES (@id, @projectId, @scanSessionId, @themePath, @tokenHash, @createdAt, @waitingUntil)`,
    ).run(session)
  }

  getApply(id: string) {
    const row = this.database.prepare('SELECT * FROM apply_sessions WHERE id = ?').get(id) as ApplyRow | undefined
    return row ? {
      id: row.id, projectId: row.project_id, scanSessionId: row.scan_session_id, themePath: row.theme_path,
      tokenHash: row.token_hash, createdAt: row.created_at, waitingUntil: row.waiting_until,
    } : null
  }

  markApplyWaiting(id: string, until: string) {
    const result = this.database.prepare('UPDATE apply_sessions SET waiting_until = ? WHERE id = ?').run(until, id)
    if (result.changes !== 1) throw new Error(`Unknown apply session: ${id}`)
  }

  insertChange(change: StoredRoleChange) {
    this.database.prepare(
      `INSERT INTO role_changes
        (id, apply_id, kind, role, mode, step, status, reason, claim_token, claimed_at, created_at)
       VALUES (@id, @applyId, @kind, @role, @mode, @step, @status, @reason, @claimToken, @claimedAt, @createdAt)`,
    ).run(change)
  }

  listChanges(applyId: string) {
    return (this.database.prepare('SELECT * FROM role_changes WHERE apply_id = ? ORDER BY position').all(applyId) as ChangeRow[])
      .map((row) => this.changeFromRow(row))
  }

  getChange(applyId: string, changeId: string) {
    const row = this.database.prepare('SELECT * FROM role_changes WHERE apply_id = ? AND id = ?').get(applyId, changeId) as ChangeRow | undefined
    return row ? this.changeFromRow(row) : null
  }

  claimNext(applyId: string, claimToken: string, claimedAt: string) {
    return this.database.transaction(() => {
      const row = this.database.prepare(
        `SELECT * FROM role_changes WHERE apply_id = ? AND status = 'waiting' ORDER BY position LIMIT 1`,
      ).get(applyId) as ChangeRow | undefined
      if (!row) return null
      this.database.prepare(
        `UPDATE role_changes SET status = 'claimed', claim_token = ?, claimed_at = ? WHERE id = ? AND status = 'waiting'`,
      ).run(claimToken, claimedAt, row.id)
      return this.getChange(applyId, row.id)
    })()
  }

  releaseStaleClaims(applyId: string, claimedBefore: string) {
    this.database.prepare(
      `UPDATE role_changes
       SET status = 'waiting', claim_token = NULL, claimed_at = NULL
       WHERE apply_id = ? AND status = 'claimed' AND claimed_at <= ?`,
    ).run(applyId, claimedBefore)
  }

  completeChange(applyId: string, changeId: string, claimToken: string, status: 'written' | 'rejected', reason: string | null) {
    const result = this.database.prepare(
      `UPDATE role_changes SET status = ?, reason = ?, claim_token = NULL
       WHERE apply_id = ? AND id = ? AND status = 'claimed' AND claim_token = ?`,
    ).run(status, reason, applyId, changeId, claimToken)
    return result.changes === 1
  }

  close() {
    this.database.close()
  }

  private toRowParams(session: StoredScanSession) {
    return {
      id: session.id,
      projectId: session.projectId,
      tokenHash: session.tokenHash,
      tokenExpiresAt: session.tokenExpiresAt,
      status: session.status,
      createdAt: session.createdAt,
      tokenUsedAt: session.tokenUsedAt,
      resultJson: session.result ? JSON.stringify(session.result) : null,
      errorJson: session.error ? JSON.stringify(session.error) : null,
    }
  }

  private ensureChangeKind() {
    const columns = this.database.prepare('PRAGMA table_info(role_changes)').all() as Array<{ name: string }>
    if (columns.length === 0 || columns.some((column) => column.name === 'kind')) return
    this.database.exec('ALTER TABLE role_changes ADD COLUMN kind TEXT')
    this.database.exec(`UPDATE role_changes SET kind = 'role' WHERE kind IS NULL`)
  }

  private changeFromRow(row: ChangeRow): StoredRoleChange {
    return {
      id: row.id, applyId: row.apply_id, kind: row.kind === 'scale' ? 'scale' : 'role',
      role: row.role, mode: row.mode, step: row.step,
      status: row.status, reason: row.reason, claimToken: row.claim_token, claimedAt: row.claimed_at,
      createdAt: row.created_at, position: row.position,
    }
  }

  private fromRow(row: SessionRow): StoredScanSession {
    return {
      id: row.id,
      projectId: row.project_id,
      tokenHash: row.token_hash,
      tokenExpiresAt: row.token_expires_at,
      status: row.status,
      createdAt: row.created_at,
      tokenUsedAt: row.token_used_at,
      result: row.result_json ? JSON.parse(row.result_json) as ScanResult : null,
      error: row.error_json
        ? JSON.parse(row.error_json) as StoredScanSession['error']
        : null,
    }
  }
}

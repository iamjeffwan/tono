import { describe, expect, it } from 'vitest'
import { ScanService, ScanServiceError } from './service.js'
import { InMemoryScanSessionStore } from './store.js'
import { validScanResult as result } from './test-utils.js'

describe('role changes', () => {
  function readyService() {
    const service = new ScanService({ store: new InMemoryScanSessionStore(), now: () => new Date('2026-09-24T12:00:00.000Z') })
    const scan = service.createSession({ projectId: 'project_123' })
    service.uploadResult(scan.sessionId, scan.token, result)
    const apply = service.createApplySession({ scanSessionId: scan.sessionId, themePath: 'src/index.css' })
    return { service, apply }
  }

  it('queues confirmed theme changes in submission order and rejects an unknown step immediately', () => {
    const { service, apply } = readyService()
    const first = service.submitRoleChange(apply.applyId, { role: 'primary', mode: 'light', step: 'blue-600' })
    const second = service.submitRoleChange(apply.applyId, { role: 'border', mode: 'dark', step: 'white-10' })
    expect(service.submitRoleChange(apply.applyId, { role: 'primary', mode: 'light', step: 'not-a-real-600' })).toMatchObject({ status: 'rejected', reason: 'STEP_UNKNOWN' })
    const claimed = service.claimRoleChange(apply.applyId, apply.token)
    expect(claimed.change).toMatchObject({ changeId: first.changeId, step: 'blue-600' })
    expect(service.claimRoleChange(apply.applyId, apply.token).change?.changeId).toBe(second.changeId)
    expect(service.claimRoleChange(apply.applyId, apply.token).change).toBeNull()
  })

  it('queues one scale write after a color change and returns the ladder variables', () => {
    const { service, apply } = readyService()
    const color = service.submitRoleChange(apply.applyId, { role: 'primary', mode: 'light', step: 'blue-600' })
    const scale = service.submitScale(apply.applyId)
    expect(service.getRoleChange(apply.applyId, scale.changeId)).toMatchObject({ kind: 'scale', status: 'waiting' })
    expect(service.claimRoleChange(apply.applyId, apply.token).change).toMatchObject({ kind: 'role', changeId: color.changeId })
    const claimed = service.claimRoleChange(apply.applyId, apply.token).change
    expect(claimed).toMatchObject({ kind: 'scale', changeId: scale.changeId })
    if (claimed?.kind !== 'scale') throw new Error('expected a scale claim')
    expect(claimed.variables).toContainEqual({ name: 'spacing', value: 'initial' })
    expect(claimed.variables).toContainEqual({ name: 'spacing-4', value: '16px' })
    expect(claimed.variables).toContainEqual({ name: 'radius-lg', value: '12px' })
    expect(claimed.variables.some((variable) => variable.name.startsWith('color-'))).toBe(false)
  })

  it('rejects a stale claim after the change is claimed again', () => {
    let now = new Date('2026-09-24T12:00:00.000Z')
    const service = new ScanService({ store: new InMemoryScanSessionStore(), now: () => now })
    const scan = service.createSession({ projectId: 'project_123' })
    service.uploadResult(scan.sessionId, scan.token, result)
    const apply = service.createApplySession({ scanSessionId: scan.sessionId, themePath: 'src/index.css' })
    const change = service.submitRoleChange(apply.applyId, { role: 'primary', mode: 'light', step: 'blue-600' })
    const first = service.claimRoleChange(apply.applyId, apply.token).change!
    now = new Date('2026-09-24T12:01:01.000Z')
    const second = service.claimRoleChange(apply.applyId, apply.token).change!
    expect(second.changeId).toBe(change.changeId)
    expect(() => service.completeRoleChange(apply.applyId, change.changeId, apply.token, { claimToken: first.claimToken, status: 'written', reason: null })).toThrowError(ScanServiceError)
    expect(service.completeRoleChange(apply.applyId, change.changeId, apply.token, { claimToken: second.claimToken, status: 'written', reason: null }).status).toBe('written')
  })

  it('requires the confirmed theme path and the apply token', () => {
    const { service, apply } = readyService()
    expect(() => service.createApplySession({ scanSessionId: apply.applyId, themePath: 'src/other.css' })).toThrowError(ScanServiceError)
    expect(() => service.claimRoleChange(apply.applyId, 'wrong-token')).toThrowError(ScanServiceError)
  })
})

describe('ScanService', () => {
  it('does not disguise old saved results as a current protocol result', () => {
    const store = new InMemoryScanSessionStore()
    const service = new ScanService({ store })
    const created = service.createSession({ projectId: 'p' })
    service.uploadResult(created.sessionId, created.token, result)
    const stored = store.get(created.sessionId)!
    // 模拟旧数据库内容；线上保留历史记录但明确要求重新扫描。
    Object.assign(stored.result!, { schemaVersion: 1 })
    store.update(stored)
    expect(service.getSession(created.sessionId)).toMatchObject({
      status: 'completed', result: null, error: { code: 'RESULT_VERSION_UNSUPPORTED' },
    })
  })
  it('creates a waiting task with an expiring upload token', () => {
    const service = new ScanService({
      store: new InMemoryScanSessionStore(),
      now: () => new Date('2026-09-24T12:00:00.000Z'),
    })

    const created = service.createSession({ projectId: 'project_123' })

    expect(created.sessionId).toMatch(/^scan_[a-f0-9]{24}$/)
    expect(created.command).toContain(created.sessionId)
    expect(created.command).toContain(created.token)
    expect(created.expiresAt).toBe('2026-09-24T12:10:00.000Z')
    expect(service.getSession(created.sessionId).status).toBe('waiting_cli')
  })

  it('accepts a valid result once and rejects reuse of the token', () => {
    const service = new ScanService({ store: new InMemoryScanSessionStore() })
    const created = service.createSession({ projectId: 'project_123' })

    expect(service.uploadResult(created.sessionId, created.token, result)).toEqual({
      accepted: true,
      status: 'completed',
    })
    expect(service.getSession(created.sessionId).result).toEqual(result)

    expect(() => service.uploadResult(created.sessionId, created.token, result)).toThrowError(
      new ScanServiceError(
        'SCAN_TOKEN_ALREADY_USED',
        409,
        'The upload token has already been used.',
      ),
    )
  })

  it('rejects invalid tokens and invalid results', () => {
    const service = new ScanService({ store: new InMemoryScanSessionStore() })
    const created = service.createSession({ projectId: 'project_123' })

    expect(() => service.uploadResult(created.sessionId, 'wrong', result)).toThrowError(
      /upload token is invalid/,
    )
    expect(() => service.uploadResult(created.sessionId, created.token, {})).toThrowError(
      /scan result does not match/,
    )
  })

  it('expires a task before accepting an upload', () => {
    let current = new Date('2026-09-24T12:00:00.000Z')
    const service = new ScanService({
      store: new InMemoryScanSessionStore(),
      now: () => current,
      tokenTtlMs: 1_000,
    })
    const created = service.createSession({ projectId: 'project_123' })
    current = new Date('2026-09-24T12:00:02.000Z')

    expect(() => service.uploadResult(created.sessionId, created.token, result)).toThrowError(
      /expired/,
    )
    expect(service.getSession(created.sessionId).status).toBe('expired')
  })
})

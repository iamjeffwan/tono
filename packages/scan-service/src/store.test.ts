import { mkdir, mkdtemp } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SqliteScanSessionStore } from './store.js'

describe('SqliteScanSessionStore', () => {
  it('keeps a task after opening a new store for the same database', async () => {
    await mkdir('artifacts', { recursive: true })
    const directory = await mkdtemp(path.resolve('artifacts', 'scan-service-'))
    const databasePath = path.join(directory, 'sessions.sqlite')
    const first = new SqliteScanSessionStore(databasePath)

    first.create({
      id: 'scan_persisted',
      projectId: 'project_123',
      tokenHash: 'hash',
      tokenExpiresAt: '2026-09-24T12:10:00.000Z',
      status: 'waiting_cli',
      createdAt: '2026-09-24T12:00:00.000Z',
      tokenUsedAt: null,
      result: null,
      error: null,
    })
    first.close()

    const second = new SqliteScanSessionStore(databasePath)
    expect(second.get('scan_persisted')?.projectId).toBe('project_123')
    second.createApply({
      id: 'apply_persisted', projectId: 'project_123', scanSessionId: 'scan_persisted', themePath: 'src/index.css',
      tokenHash: 'hash', createdAt: '2026-09-24T12:00:00.000Z', waitingUntil: null,
    })
    second.insertChange({
      id: 'change_persisted', applyId: 'apply_persisted', kind: 'role', role: 'primary', mode: 'light', step: 'blue-600',
      status: 'waiting', reason: null, claimToken: null, claimedAt: null, createdAt: '2026-09-24T12:00:00.000Z', position: 0,
    })
    second.close()
    const third = new SqliteScanSessionStore(databasePath)
    expect(third.claimNext('apply_persisted', 'claim', '2026-09-24T12:00:01.000Z')?.id).toBe('change_persisted')
    third.close()
  })
})

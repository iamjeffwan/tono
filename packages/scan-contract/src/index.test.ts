import { describe, expect, it } from 'vitest'
import { scanResultSchema, getScanSessionResponseSchema, createScanSessionResponseSchema, roleChangeRequestSchema, roleChangeViewSchema, claimRoleChangeResponseSchema, completeRoleChangeRequestSchema } from './index.js'

const officialBoxes = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring', 'radius',
]

const minimal = {
  schemaVersion: 2,
  cliVersion: '0.1.0',
  tailwind: { status: 'not_installed', version: null },
  theme: { status: 'not_found', path: null, source: null },
  shadcn: { status: 'not_checked' },
  componentLibraries: [],
  support: { status: 'needs_action', blockingIssues: ['样式框架未安装'], warnings: [] },
  warnings: [],
}

describe('scan contract', () => {
  it('accepts missing dependencies and theme without inventing framework or lint facts', () => {
    expect(scanResultSchema.parse(minimal)).toEqual(minimal)
  })
  it('rejects obsolete fields, old schema, and arbitrary uploaded source', () => {
    for (const extra of [{ framework: { name: 'react' } }, { eslint: {} }, { source: 'private' }, { schemaVersion: 1 }]) {
      expect(scanResultSchema.safeParse({ ...minimal, ...extra }).success).toBe(false)
    }
  })
  it.each(['C:\\secret\\index.css', 'C:index.css', '../index.css', 'src/../../index.css', '/tmp/index.css', '//host/file.css', 'src\\..\\file.css'])('rejects out-of-project path %s', (path) => {
    expect(scanResultSchema.safeParse({ ...minimal, theme: { status: 'located', source: 'official_query', path } }).success).toBe(false)
  })
  it('accepts actual theme paths without claiming they are imported everywhere', () => {
    expect(scanResultSchema.safeParse({ ...minimal, theme: { status: 'located', source: 'official_query', path: 'src/theme.css' } }).success).toBe(true)
    expect(scanResultSchema.safeParse({ ...minimal, theme: { status: 'located', source: 'official_query', path: null } }).success).toBe(false)
    expect(scanResultSchema.safeParse({ ...minimal, tailwind: { status: 'installed', version: null } }).success).toBe(false)
  })
  it('accepts a used shadcn appearance with the shared box names and rejects an installed-component inventory', () => {
    const used = { ...minimal, shadcn: { status: 'used', appearance: 'base-nova', boxes: officialBoxes } }
    expect(scanResultSchema.parse(used).shadcn).toEqual({ status: 'used', appearance: 'base-nova', boxes: officialBoxes })
    expect(scanResultSchema.parse({ ...minimal, shadcn: { status: 'used', appearance: 'custom-look', boxes: null } }).shadcn).toEqual({
      status: 'used', appearance: 'custom-look', boxes: null,
    })
    expect(scanResultSchema.safeParse({ ...minimal, shadcn: { status: 'not_used' } }).success).toBe(true)
    expect(scanResultSchema.safeParse({ ...minimal, shadcn: { status: 'query_failed' } }).success).toBe(true)
    for (const shadcn of [
      { status: 'used', appearance: 'base-nova', boxes: officialBoxes.slice(0, -1) },
      { status: 'used', appearance: 'base-nova', boxes: [...officialBoxes, 'warning'] },
      { status: 'configured', cssEntry: 'src/index.css', components: ['button'], preset: 'base-nova' },
      { status: 'used', appearance: 'base-nova', boxes: officialBoxes, components: ['button'] },
    ]) {
      expect(scanResultSchema.safeParse({ ...minimal, shadcn }).success).toBe(false)
    }
  })
  it('accepts waiting tasks, rejects unimplemented running state', () => {
    const task = { sessionId: 'scan_123', status: 'waiting_cli', result: null, error: null }
    expect(getScanSessionResponseSchema.parse(task)).toEqual(task)
    expect(getScanSessionResponseSchema.safeParse({ ...task, status: 'running' }).success).toBe(false)
  })
  it('requires an offset-aware expiration time', () => {
    expect(createScanSessionResponseSchema.safeParse({ sessionId: 'scan_123', token: 'token', expiresAt: '2026-09-24T12:00:00', command: 'example' }).success).toBe(false)
  })
  it('accepts a color role change and rejects radius or an unnamed step', () => {
    expect(roleChangeRequestSchema.parse({ role: 'primary', mode: 'light', step: 'blue-600' })).toEqual({ role: 'primary', mode: 'light', step: 'blue-600' })
    expect(roleChangeRequestSchema.safeParse({ role: 'radius', mode: 'light', step: 'blue-600' }).success).toBe(false)
    expect(roleChangeRequestSchema.safeParse({ role: 'primary', mode: 'light', step: 'not a step' }).success).toBe(false)
    expect(completeRoleChangeRequestSchema.safeParse({ claimToken: 'claim', status: 'written', reason: null }).success).toBe(true)
    expect(completeRoleChangeRequestSchema.safeParse({ claimToken: 'claim', status: 'written', reason: 'BOX_MISSING' }).success).toBe(false)
    expect(completeRoleChangeRequestSchema.safeParse({ claimToken: 'claim', status: 'rejected', reason: null }).success).toBe(false)
  })
  it('accepts a scale write without a color role and rejects a role view missing its step', () => {
    expect(roleChangeViewSchema.parse({ kind: 'scale', changeId: 'change_1', status: 'waiting', reason: null })).toMatchObject({ kind: 'scale' })
    expect(claimRoleChangeResponseSchema.parse({
      change: { kind: 'scale', changeId: 'change_1', claimToken: 'claim', variables: [{ name: 'spacing-4', value: '16px' }] },
    }).change).toMatchObject({ kind: 'scale' })
    expect(roleChangeViewSchema.safeParse({ kind: 'role', changeId: 'change_1', status: 'waiting', reason: null }).success).toBe(false)
    expect(claimRoleChangeResponseSchema.safeParse({
      change: { kind: 'scale', changeId: 'change_1', claimToken: 'claim', variables: [] },
    }).success).toBe(false)
  })
})

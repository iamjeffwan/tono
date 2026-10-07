import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFile, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createScanHttpApp, InMemoryScanSessionStore, ScanService } from '@design-system-guardrails/scan-service'
import { createApplySessionResponseSchema, type ScanResult } from '@design-system-guardrails/scan-contract'
import { runApply } from './loop.js'
import { mkdir } from 'node:fs/promises'

const exec = promisify(execFile)
const root = process.cwd()
const binary = path.join(root, 'packages/cli/dist/main.js')
const installed = {
  schemaVersion: 2, cliVersion: '0.1.0',
  tailwind: { status: 'installed', version: '4.3.3' },
  theme: { status: 'located', path: 'src/index.css', source: 'official_query' },
  shadcn: { status: 'used', appearance: 'base-nova', boxes: null },
  componentLibraries: [], support: { status: 'partially_supported', blockingIssues: [], warnings: [] }, warnings: [],
} as ScanResult
const theme = `@theme {
  --color-neutral-900: oklch(20.5% 0 none);
}
:root { --primary: var(--color-neutral-900); }
.dark { --primary: var(--color-neutral-200); }
@theme inline {
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
}
`

async function serviceContext() {
  const service = new ScanService({ store: new InMemoryScanSessionStore() })
  const app = await createScanHttpApp({ service })
  const server = await app.listen({ host: '127.0.0.1', port: 0 })
  const scan = service.createSession({ projectId: 'apply_test' })
  service.uploadResult(scan.sessionId, scan.token, installed)
  const response = await fetch(`${server}/api/apply-sessions`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scanSessionId: scan.sessionId, themePath: 'src/index.css' }),
  })
  const apply = createApplySessionResponseSchema.parse(await response.json())
  const directory = await mkdtemp(path.join(root, 'artifacts', 'apply-'))
  await mkdir(path.join(directory, '.git'), { recursive: true })
  await mkdir(path.join(directory, 'src'), { recursive: true })
  await writeFile(path.join(directory, 'package.json'), JSON.stringify({ name: 'apply-fixture', dependencies: { tailwindcss: '4.3.3' } }))
  await symlink(path.join(root, '..', 'lint-shadcn-tailwind-test', 'node_modules'), path.join(directory, 'node_modules'), 'junction')
  await copyFile(path.join(root, '..', 'lint-shadcn-tailwind-test', 'components.json'), path.join(directory, 'components.json'))
  await writeFile(path.join(directory, 'src/index.css'), theme)
  return { app, server, scan, apply, directory, file: path.join(directory, 'src/index.css') }
}

describe('apply loop', () => {
  it('writes one claimed change through the built command and restores an existing step without rewriting it', async () => {
    await mkdir(path.join(root, 'artifacts'), { recursive: true })
    await exec(process.execPath, ['scripts/build.mjs'], { cwd: path.join(root, 'packages/cli') })
    const ctx = await serviceContext()
    await fetch(`${ctx.server}/api/apply-sessions/${ctx.apply.applyId}/changes`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'primary', mode: 'light', step: 'blue-600' }),
    })
    await exec(process.execPath, [binary, 'apply', '--session', ctx.scan.sessionId, '--apply', ctx.apply.applyId,
      '--token', ctx.apply.token, '--theme', 'src/index.css', '--server', ctx.server, '--cwd', ctx.directory, '--once'])
    const changed = await readFile(ctx.file, 'utf8')
    expect(changed).toContain('--primary: var(--color-blue-600);')
    expect(changed).toContain('--color-blue-600:')
    await fetch(`${ctx.server}/api/apply-sessions/${ctx.apply.applyId}/changes`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'primary', mode: 'light', step: 'neutral-900' }),
    })
    await exec(process.execPath, [binary, 'apply', '--session', ctx.scan.sessionId, '--apply', ctx.apply.applyId,
      '--token', ctx.apply.token, '--theme', 'src/index.css', '--server', ctx.server, '--cwd', ctx.directory, '--once'])
    const restored = await readFile(ctx.file, 'utf8')
    expect(restored).toContain('--primary: var(--color-neutral-900);')
    expect(restored.match(/--color-neutral-900:/g)).toHaveLength(1)
    expect(restored).toContain('oklch(20.5% 0 none)')
    const submitted = await fetch(`${ctx.server}/api/apply-sessions/${ctx.apply.applyId}/scale`, { method: 'POST' })
    expect(submitted.status).toBe(202)
    await exec(process.execPath, [binary, 'apply', '--session', ctx.scan.sessionId, '--apply', ctx.apply.applyId,
      '--token', ctx.apply.token, '--theme', 'src/index.css', '--server', ctx.server, '--cwd', ctx.directory, '--once'])
    const scaled = await readFile(ctx.file, 'utf8')
    expect(scaled).toContain('--spacing: initial;')
    expect(scaled).toContain('--spacing-4: 16px;')
    expect(scaled).toContain('--text-sm: 14px;')
    expect(scaled).toContain('--font-weight-medium: 500;')
    expect(scaled).toContain('--radius-lg: 12px;')
    expect(scaled).not.toContain('--radius-lg: var(--radius)')
    expect(scaled).toContain('--primary: var(--color-neutral-900);')
    expect(scaled).toContain('oklch(20.5% 0 none)')
    await ctx.app.close()
  })

  it('does not write when the confirmed path differs or leaves the project', async () => {
    const directory = await mkdtemp(path.join(root, 'artifacts', 'apply-reject-'))
    await mkdir(path.join(directory, 'src'), { recursive: true })
    const outside = path.join(directory, '..', 'outside.css')
    await writeFile(outside, theme)
    await expect(runApply({
      sessionId: 'scan_test', applyId: 'apply_test', token: 'token-token-token', theme: '../outside.css', server: 'http://127.0.0.1:9', directory, once: true,
    }, { detector: async () => ({ ...installed, theme: { status: 'located', path: '../outside.css', source: 'official_query' } }) })).rejects.toThrow('主题文件')
    expect(await readFile(outside, 'utf8')).toBe(theme)
    await expect(runApply({
      sessionId: 'scan_test', applyId: 'apply_test', token: 'token-token-token', theme: 'src/other.css', server: 'http://127.0.0.1:9', directory, once: true,
    }, { detector: async () => installed })).rejects.toThrow('主题文件')
  })
})

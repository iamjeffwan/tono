import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { satisfies } from 'semver'
import {
  claimRoleChangeResponseSchema,
  completeRoleChangeRequestSchema,
  roleChangeViewSchema,
  type ApplyRejectionCode,
} from '@design-system-guardrails/scan-contract'
import { CliError } from '../errors.js'
import { isInside } from '../detect/project.js'
import type { Detector } from '../runner.js'
import type { Fetch } from '../transport.js'
import { writeTheme } from './theme-edit.js'

const require = createRequire(import.meta.url)
const palette = new Map((JSON.parse(readFileSync(
  require.resolve('@design-system-guardrails/design-system/palette.json'), 'utf8',
)) as { steps: Array<{ name: string; value: string }> }).steps.map((step) => [step.name, step.value]))

export type ApplyOptions = {
  sessionId: string
  applyId: string
  token: string
  theme: string
  server: string
  directory?: string
  timeoutMs?: number
  intervalMs?: number
  once?: boolean
}
type ApplyDependencies = { detector: Detector; fetch?: Fetch; log?: (message: string) => void; sleep?: (ms: number) => Promise<void> }

export async function runApply(options: ApplyOptions, dependencies: ApplyDependencies) {
  const log = dependencies.log ?? (() => {})
  const request = dependencies.fetch ?? fetch
  const directory = await realpath(path.resolve(options.directory ?? process.cwd()))
  const detected = await dependencies.detector({ projectDirectory: directory })
  const tailwindReady = detected.tailwind.status === 'installed' && satisfies(detected.tailwind.version, '>=4.0.0 <5.0.0')
  const themeReady = detected.theme.status === 'located' && detected.theme.path === options.theme
  if (!tailwindReady || detected.support.status === 'unsupported' || !themeReady) {
    throw new CliError('THEME_UNCONFIRMED', '主题文件尚未确认，或项目不满足写入条件。')
  }
  const themeFile = await confirmedTheme(directory, options.theme)
  log(`已确认主题文件：${options.theme}`)
  do {
    const claimed = await claim(request, options)
    if (!claimed) {
      if (options.once) return
      await (dependencies.sleep ?? delay)(options.intervalMs ?? 2000)
      continue
    }
    const result = claimed.kind === 'scale'
      ? await writeTheme(themeFile, { variables: claimed.variables }).catch(() => ({ status: 'rejected' as const, reason: 'WRITE_FAILED' as const }))
      : await writeRole(themeFile, claimed)
    await report(request, options, claimed.changeId, claimed.claimToken, result)
    log(result.status === 'written'
      ? claimed.kind === 'scale' ? '已写入尺寸阶梯' : `已写回 ${claimed.mode} ${claimed.role} → ${claimed.step}`
      : `未改动：${result.reason}`)
  } while (!options.once)
}

async function writeRole(file: string, claimed: { role: string; mode: 'light' | 'dark'; step: string }) {
  const value = palette.get(claimed.step)
  if (!value) return { status: 'rejected' as const, reason: 'STEP_UNKNOWN' as const }
  return writeTheme(file, { ...claimed, value }).catch(() => ({ status: 'rejected' as const, reason: 'WRITE_FAILED' as const }))
}

async function confirmedTheme(root: string, relativePath: string) {
  const file = await realpath(path.resolve(root, relativePath))
  if (!isInside(root, file) || !(await stat(file)).isFile()) throw new CliError('THEME_UNCONFIRMED', '确认的主题文件不在项目目录内。')
  return file
}

async function claim(request: Fetch, options: ApplyOptions) {
  const response = await request(`${options.server}/api/apply-sessions/${encodeURIComponent(options.applyId)}/claim`, {
    method: 'POST', headers: { authorization: `Bearer ${options.token}` }, redirect: 'error', signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
  })
  if (!response.ok) { await response.body?.cancel(); throw new CliError('NETWORK_ERROR', '无法取走语义改动。') }
  const body = claimRoleChangeResponseSchema.parse(await response.json())
  return body.change
}

async function report(request: Fetch, options: ApplyOptions, changeId: string, claimToken: string, result: { status: 'written' } | { status: 'rejected'; reason: ApplyRejectionCode }) {
  const payload = completeRoleChangeRequestSchema.parse({ claimToken, status: result.status, reason: result.status === 'rejected' ? result.reason : null })
  const response = await request(`${options.server}/api/apply-sessions/${encodeURIComponent(options.applyId)}/changes/${encodeURIComponent(changeId)}/result`, {
    method: 'POST', headers: { authorization: `Bearer ${options.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
  })
  if (!response.ok) { await response.body?.cancel(); throw new CliError('NETWORK_ERROR', '写回结果没有送到服务。') }
  roleChangeViewSchema.parse(await response.json())
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

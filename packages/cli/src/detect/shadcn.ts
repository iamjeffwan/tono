import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { officialShadcnBoxNames, type ScanResult } from '@design-system-guardrails/scan-contract'

const execute = promisify(execFile)
const outputSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('missing') }),
  z.strictObject({ status: z.literal('invalid') }),
  z.strictObject({ status: z.literal('valid'), style: z.string().min(1) }),
])
// shadcn@4.21.0 的 schema.json 把 style 列为这些值。运行时 rawConfigSchema 只要求它是字符串，
// 所以名单外的外观仍能通过结构校验，再由这里决定不附默认盒子。
const officialStyles = new Set([
  'default', 'new-york',
  'radix-vega', 'radix-nova', 'radix-maia', 'radix-lyra', 'radix-mira', 'radix-luma', 'radix-sera', 'radix-rhea',
  'base-vega', 'base-nova', 'base-maia', 'base-lyra', 'base-mira', 'base-luma', 'base-sera', 'base-rhea',
  'aria-vega', 'aria-nova', 'aria-maia', 'aria-lyra', 'aria-mira', 'aria-luma', 'aria-sera', 'aria-rhea',
])
const workerFile = fileURLToPath(new URL('./shadcn-config-worker.js', import.meta.url))
type OfficialOutput = z.infer<typeof outputSchema>
export type ShadcnQuery = (root: string) => Promise<OfficialOutput>
const failed = (): { shadcn: ScanResult['shadcn']; warnings: ScanResult['warnings'] } => ({
  shadcn: { status: 'query_failed' },
  warnings: [{ code: 'SHADCN_QUERY_FAILED', message: '官方 shadcn 配置查询失败或未能通过官方校验，不能据此判断没有使用。', severity: 'error' }],
})

export function shadcnFromOfficial(found: OfficialOutput): { shadcn: ScanResult['shadcn']; warnings: ScanResult['warnings'] } {
  if (found.status === 'missing') return { shadcn: { status: 'not_used' }, warnings: [] }
  if (found.status !== 'valid') return failed()
  if (!officialStyles.has(found.style)) {
    return {
      shadcn: { status: 'used', appearance: found.style, boxes: null },
      warnings: [{ code: 'SHADCN_STYLE_UNLISTED', message: '外观不在官方名单内，未附上默认盒子。', severity: 'warning' }],
    }
  }
  return { shadcn: { status: 'used', appearance: found.style, boxes: [...officialShadcnBoxNames] }, warnings: [] }
}

export const officialShadcnQuery: ShadcnQuery = async root => {
  const { stdout } = await execute(process.execPath, [workerFile, root], {
    cwd: root, timeout: 20_000, maxBuffer: 64 * 1024, windowsHide: true,
  })
  return outputSchema.parse(JSON.parse(stdout))
}

export async function findShadcn(root: string, query: ShadcnQuery = officialShadcnQuery) {
  try { return shadcnFromOfficial(await query(root)) }
  catch { return failed() }
}

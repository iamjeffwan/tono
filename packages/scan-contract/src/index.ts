import { z } from 'zod'

const relativePath = z.string().min(1).refine((value) =>
  !/^[\\/]/.test(value) && !/[:\u0000-\u001f]/.test(value) &&
  !value.split(/[\\/]/).some((part) => part === '..' || part === '' || part === '.'),
  { message: 'Path must be relative to the detected project root.' },
)

// 只保留现有三个接口真正能够产生的任务状态。
export const scanSessionStatusSchema = z.enum(['waiting_cli', 'completed', 'expired'])
export const supportStatusSchema = z.enum(['supported', 'partially_supported', 'unsupported', 'needs_action'])

export const tailwindResultSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('installed'), version: z.string().min(1) }),
  z.strictObject({ status: z.enum(['not_installed', 'unknown', 'not_checked']), version: z.null() }),
])
export const themeResultSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('located'), path: relativePath, source: z.enum(['official_query', 'user_confirmed']) }),
  z.strictObject({ status: z.enum(['not_found', 'query_failed', 'not_checked']), path: z.null(), source: z.null() }),
])
// 官方主题文档 Theme Tokens 表。各官方外观共用这一份名字，浅色和深色不分成两份。
export const officialShadcnBoxNames = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring', 'radius',
] as const
const officialBoxListSchema = z.array(z.string()).refine(
  (values) => values.length === officialShadcnBoxNames.length && values.every((name, index) => name === officialShadcnBoxNames[index]),
  { message: 'Box names must be the shared official theme token list.' },
)
export const shadcnResultSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('used'),
    appearance: z.string().min(1),
    // null：配置通过官方校验，但外观不在官方名单内，因此不附上默认盒子。
    boxes: z.union([z.null(), officialBoxListSchema]),
  }),
  z.strictObject({ status: z.enum(['not_used', 'query_failed', 'not_checked']) }),
])
export const componentLibrarySchema = z.strictObject({
  name: z.string().min(1),
  status: z.enum(['detected', 'candidate', 'unsupported']),
  evidence: z.array(z.string().min(1)).min(1),
})
export const supportResultSchema = z.strictObject({
  status: supportStatusSchema,
  blockingIssues: z.array(z.string().min(1)),
  warnings: z.array(z.string().min(1)),
})
export const scanWarningSchema = z.strictObject({
  code: z.string().min(1), message: z.string().min(1), severity: z.enum(['warning', 'error']),
})
export const scanResultSchema = z.strictObject({
  schemaVersion: z.literal(2),
  cliVersion: z.string().min(1),
  tailwind: tailwindResultSchema,
  theme: themeResultSchema,
  shadcn: shadcnResultSchema,
  componentLibraries: z.array(componentLibrarySchema),
  support: supportResultSchema,
  warnings: z.array(scanWarningSchema),
})

export const createScanSessionRequestSchema = z.strictObject({ projectId: z.string().min(1) })
export const createScanSessionResponseSchema = z.strictObject({
  sessionId: z.string().min(1), token: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }), command: z.string().min(1),
})
export const uploadScanResultRequestSchema = z.strictObject({ result: scanResultSchema })
export const uploadScanResultResponseSchema = z.strictObject({ accepted: z.literal(true), status: z.literal('completed') })
export const scanSessionErrorSchema = z.strictObject({ code: z.string().min(1), message: z.string().min(1) })
export const getScanSessionResponseSchema = z.strictObject({
  sessionId: z.string().min(1), status: scanSessionStatusSchema,
  result: scanResultSchema.nullable(), error: scanSessionErrorSchema.nullable(),
})
export const colorRoleNames = officialShadcnBoxNames.filter((name) => name !== 'radius')
const stepName = z.string().regex(/^(?:[a-z]+(?:-[a-z]+)*-\d{2,3}|black|white|white-10|white-15)$/)
export const roleChangeRequestSchema = z.strictObject({
  role: z.enum(colorRoleNames),
  mode: z.enum(['light', 'dark']),
  step: stepName,
})
export const scaleVariableSchema = z.strictObject({
  name: z.string().regex(/^[a-z]+(?:-[a-z0-9]+)*(?:--[a-z]+(?:-[a-z0-9]+)*)?$/),
  value: z.string().min(1).max(240),
})
export const applyRejectionCodeSchema = z.enum([
  'THEME_UNCONFIRMED', 'BOX_MISSING', 'STEP_UNKNOWN', 'TARGET_AMBIGUOUS', 'WRITE_FAILED',
])
export const roleChangeStatusSchema = z.enum(['waiting', 'written', 'rejected'])
export const createApplySessionRequestSchema = z.strictObject({
  scanSessionId: z.string().min(1),
  themePath: relativePath,
})
export const createApplySessionResponseSchema = z.strictObject({
  applyId: z.string().min(1),
  token: z.string().min(1),
  themePath: relativePath,
  command: z.string().min(1),
})
export const submitRoleChangeResponseSchema = z.strictObject({
  changeId: z.string().min(1),
  status: roleChangeStatusSchema,
  reason: applyRejectionCodeSchema.nullable(),
})
const changeStatusFields = {
  changeId: z.string().min(1),
  status: roleChangeStatusSchema,
  reason: applyRejectionCodeSchema.nullable(),
}
export const roleChangeViewSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('role'),
    ...changeStatusFields,
    role: roleChangeRequestSchema.shape.role,
    mode: roleChangeRequestSchema.shape.mode,
    step: roleChangeRequestSchema.shape.step,
  }),
  z.strictObject({ kind: z.literal('scale'), ...changeStatusFields }),
])
export const claimRoleChangeResponseSchema = z.strictObject({
  change: z.discriminatedUnion('kind', [
    z.strictObject({
      kind: z.literal('role'),
      changeId: z.string().min(1),
      claimToken: z.string().min(1),
      role: roleChangeRequestSchema.shape.role,
      mode: roleChangeRequestSchema.shape.mode,
      step: roleChangeRequestSchema.shape.step,
    }),
    z.strictObject({
      kind: z.literal('scale'),
      changeId: z.string().min(1),
      claimToken: z.string().min(1),
      variables: z.array(scaleVariableSchema).min(1),
    }),
  ]).nullable(),
})
export const completeRoleChangeRequestSchema = z.strictObject({
  claimToken: z.string().min(1),
  status: z.enum(['written', 'rejected']),
  reason: applyRejectionCodeSchema.nullable(),
}).refine((value) => (value.status === 'rejected') === (value.reason !== null), {
  message: 'A rejected change needs exactly one reason.',
})

export type ScanSessionStatus = z.infer<typeof scanSessionStatusSchema>
export type ScanResult = z.infer<typeof scanResultSchema>
export type RoleChangeRequest = z.infer<typeof roleChangeRequestSchema>
export type ScaleVariable = z.infer<typeof scaleVariableSchema>
export type ApplyRejectionCode = z.infer<typeof applyRejectionCodeSchema>
export type CreateApplySessionResponse = z.infer<typeof createApplySessionResponseSchema>
export type CreateScanSessionRequest = z.infer<typeof createScanSessionRequestSchema>
export type CreateScanSessionResponse = z.infer<typeof createScanSessionResponseSchema>
export type UploadScanResultRequest = z.infer<typeof uploadScanResultRequestSchema>
export type UploadScanResultResponse = z.infer<typeof uploadScanResultResponseSchema>
export type GetScanSessionResponse = z.infer<typeof getScanSessionResponseSchema>

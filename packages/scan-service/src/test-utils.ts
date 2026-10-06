import { officialShadcnBoxNames, scanResultSchema } from '@design-system-guardrails/scan-contract'

export const validScanResult = scanResultSchema.parse({
  schemaVersion: 2,
  cliVersion: '0.1.0',
  tailwind: { version: '4.3.3', status: 'installed' },
  theme: { path: 'src/index.css', source: 'official_query', status: 'located' },
  shadcn: { status: 'used', appearance: 'base-nova', boxes: [...officialShadcnBoxNames] },
  componentLibraries: [],
  support: { status: 'supported', blockingIssues: [], warnings: [] },
  warnings: [],
})

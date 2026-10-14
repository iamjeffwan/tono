import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const palette = JSON.parse(readFileSync(require.resolve('@design-system/tokens/palette.json'), 'utf8')) as {
  steps: Array<{ name: string; value: string }>
}
const scale = JSON.parse(readFileSync(require.resolve('@design-system/tokens/scale.json'), 'utf8')) as {
  variables: Array<{ name: string; value: string }>
}

export const paletteSteps = new Map(palette.steps.map((step) => [step.name, step.value]))
export const scaleVariables = scale.variables

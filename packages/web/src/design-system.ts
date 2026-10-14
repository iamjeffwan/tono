import paletteJson from '@design-system/tokens/palette.json'
import scaleJson from '@design-system/tokens/scale.json'

export type PaletteStep = {
  name: string
  value: string
}

export type ScaleVariable = {
  name: string
  value: string
}

export function readInitialPalette(): PaletteStep[] {
  return paletteJson.steps.map((step) => ({
    name: step.name,
    value: step.value,
  }))
}

export function readInitialScale(): ScaleVariable[] {
  return scaleJson.variables.map((variable) => ({
    name: variable.name,
    value: variable.value,
  }))
}

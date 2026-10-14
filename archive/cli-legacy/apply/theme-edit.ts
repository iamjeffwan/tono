import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ApplyRejectionCode } from '@design-system/scan-contract'

export type ThemeEdit = { role: string; mode: 'light' | 'dark'; step: string; value: string }
export type ThemeScaleEdit = { variables: Array<{ name: string; value: string }> }
export type ThemeEditResult = { status: 'written' } | { status: 'rejected'; reason: ApplyRejectionCode }

type Block = { open: number; close: number; body: string }

const declaration = (name: string) => new RegExp(`(^|\\n)([ \\t]*--${name}\\s*:\\s*)([^;\\n]*)(;)`)

export function editTheme(css: string, change: ThemeEdit): { css: string; result: ThemeEditResult } {
  const theme = uniqueBlock(css, (header) => header === '@theme')
  const root = uniqueBlock(css, (header) => header === ':root')
  const dark = uniqueBlock(css, (header) => header === '.dark')
  if (!theme || !root || !dark) return { css, result: { status: 'rejected', reason: 'TARGET_AMBIGUOUS' } }
  const target = change.mode === 'light' ? root : dark
  const current = declaration(escapeName(change.role)).exec(target.body)
  if (!current) return { css, result: { status: 'rejected', reason: 'BOX_MISSING' } }
  const variable = `--color-${change.step}`
  const replacedBody = `${target.body.slice(0, current.index + current[1].length)}${current[2]}var(${variable})${current[4]}${target.body.slice(current.index + current[0].length)}`
  let next = `${css.slice(0, target.open)}${replacedBody}${css.slice(target.close)}`
  const refreshedTheme = uniqueBlock(next, (header) => header === '@theme')
  if (!refreshedTheme || declaration(escapeName(variable.slice(2))).test(refreshedTheme.body)) {
    return { css: next, result: { status: 'written' } }
  }
  const addition = `\n  ${variable}: ${change.value};\n`
  next = `${next.slice(0, refreshedTheme.close)}${addition}${next.slice(refreshedTheme.close)}`
  return { css: next, result: { status: 'written' } }
}

const radiusNames = new Set(['radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-2xl', 'radius-3xl', 'radius-4xl'])

export function editScale(css: string, change: ThemeScaleEdit): { css: string; result: ThemeEditResult } {
  if (!scaleTargets(css)) return { css, result: { status: 'rejected', reason: 'TARGET_AMBIGUOUS' } }
  let next = css
  for (const variable of change.variables) {
    const blocks = scaleTargets(next)
    if (!blocks) return { css, result: { status: 'rejected', reason: 'TARGET_AMBIGUOUS' } }
    const target = radiusNames.has(variable.name) ? blocks.inline : blocks.theme
    const names = declarationsIn(target.body)
    if (!names) return { css, result: { status: 'rejected', reason: 'TARGET_AMBIGUOUS' } }
    const found = names.get(variable.name)
    if (found) {
      if (!radiusNames.has(variable.name)) continue
      const start = target.open + found.start
      next = `${next.slice(0, start)}--${variable.name}: ${variable.value};${next.slice(start + found.length)}`
      continue
    }
    const addition = `\n  --${variable.name}: ${variable.value};\n`
    next = `${next.slice(0, target.close)}${addition}${next.slice(target.close)}`
  }
  return { css: next, result: { status: 'written' } }
}

function scaleTargets(css: string) {
  const theme = uniqueBlock(css, (header) => header === '@theme')
  const root = uniqueBlock(css, (header) => header === ':root')
  const dark = uniqueBlock(css, (header) => header === '.dark')
  const inline = uniqueBlock(css, (header) => header === '@theme inline')
  return theme && root && dark && inline ? { theme, inline } : null
}

export async function writeTheme(file: string, change: ThemeEdit | ThemeScaleEdit): Promise<ThemeEditResult> {
  const original = await readFile(file, 'utf8')
  const edited = 'variables' in change ? editScale(original, change) : editTheme(original, change)
  if (edited.result.status !== 'written' || edited.css === original) return edited.result
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`)
  try {
    await writeFile(temporary, edited.css, 'utf8')
    await rename(temporary, file)
  } catch {
    await rm(temporary, { force: true })
    return { status: 'rejected', reason: 'WRITE_FAILED' }
  }
  return { status: 'written' }
}

function uniqueBlock(css: string, matches: (header: string) => boolean): Block | null {
  const blocks = topLevelBlocks(css)
  if (!blocks) return null
  let found: Block | null = null
  for (const block of blocks) {
    const header = css.slice(block.header, block.open - 1).replace(/\s+/g, ' ').trim()
    if (!matches(header)) continue
    if (found) return null
    found = block
  }
  return found
}

function topLevelBlocks(css: string): Array<Block & { header: number }> | null {
  const blocks: Array<Block & { header: number }> = []
  let depth = 0
  let statement = 0
  let open = -1
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index]
    if (char === '"' || char === "'") {
      const quote = char
      index += 1
      while (index < css.length && css[index] !== quote) {
        if (css[index] === '\\') index += 1
        index += 1
      }
      continue
    }
    if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2)
      index = end === -1 ? css.length : end + 1
      continue
    }
    if (char === '{') {
      if (depth === 0) {
        open = index + 1
        blocks.push({ header: statement, open, close: -1, body: '' })
      }
      depth += 1
    } else if (char === ';' && depth === 0) {
      statement = index + 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0 && open !== -1) {
        const block = blocks[blocks.length - 1]
        if (block) {
          block.close = index
          block.body = css.slice(block.open, index)
        }
        statement = index + 1
        open = -1
      }
      if (depth < 0) return null
    }
  }
  return depth === 0 ? blocks : null
}

function escapeName(name: string) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function declarationsIn(body: string) {
  const names = new Map<string, { start: number; length: number }>()
  const pattern = /(^|\n)([ \t]*)(--[A-Za-z0-9-]+)\s*:\s*[^;\n]*;/g
  for (const match of body.matchAll(pattern)) {
    const name = match[3].slice(2)
    if (names.has(name)) return null
    const indent = match[1].length + match[2].length
    names.set(name, { start: match.index + indent, length: match[0].length - indent })
  }
  return names
}

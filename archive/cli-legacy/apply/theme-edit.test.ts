import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { editScale, editTheme, writeTheme } from './theme-edit.js'

const theme = `@import "tailwindcss";

@theme {
  --color-neutral-900: oklch(20.5% 0 none);
}

:root {
  --primary: var(--color-neutral-900);
}

.dark {
  --primary: var(--color-neutral-200);
}

@theme inline {
  --color-primary: var(--primary);
}
`

const sampleScale = [
  { name: 'spacing', value: 'initial' },
  { name: 'spacing-4', value: '16px' },
  { name: 'text-sm', value: '14px' },
  { name: 'font-weight-medium', value: '500' },
  { name: 'shadow-sm', value: '0 1px 2px rgb(0 0 0 / 0.06)' },
  { name: 'radius-lg', value: '12px' },
]

describe('theme scale edits', () => {
  const styled = `${theme.slice(0, theme.lastIndexOf('@theme inline {'))}@theme inline {
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
  --font-sans: 'Geist Variable', sans-serif;
}
`

  it('appends missing scale variables and replaces only the radius lines', () => {
    const edited = editScale(styled, { variables: sampleScale })
    expect(edited.result).toEqual({ status: 'written' })
    expect(edited.css).toContain('--spacing: initial;')
    expect(edited.css).toContain('--spacing-4: 16px;')
    expect(edited.css).toContain('--text-sm: 14px;')
    expect(edited.css).toContain('--radius-lg: 12px;')
    expect(edited.css).not.toContain('--radius-lg: var(--radius)')
    expect(edited.css).toContain("--font-sans: 'Geist Variable', sans-serif;")
    expect(edited.css).toContain('--primary: var(--color-neutral-900);')
    const again = editScale(edited.css, { variables: [{ name: 'spacing-4', value: '99px' }, { name: 'radius-lg', value: '12px' }] })
    expect(again.css.match(/--spacing-4:/g)).toHaveLength(1)
    expect(again.css).toContain('--spacing-4: 16px;')
    expect(again.css).not.toContain('99px')
  })

  it('leaves the file untouched when a theme block is duplicated', () => {
    const doubled = styled.replace('@theme {', '@theme {\n}\n@theme {')
    expect(editScale(doubled, { variables: sampleScale })).toEqual({ css: doubled, result: { status: 'rejected', reason: 'TARGET_AMBIGUOUS' } })
  })
})

describe('theme role edits', () => {
  it('points a role at a new step and appends that step once', () => {
    const edited = editTheme(theme, { role: 'primary', mode: 'light', step: 'blue-600', value: 'oklch(54.6% 0.245 262.881)' })
    expect(edited.result).toEqual({ status: 'written' })
    expect(edited.css).toContain('--primary: var(--color-blue-600);')
    expect(edited.css).toContain('--color-blue-600: oklch(54.6% 0.245 262.881);')
    expect(edited.css).not.toContain('--color-primary: var(--color-blue-600)')
    const again = editTheme(edited.css, { role: 'primary', mode: 'light', step: 'neutral-900', value: 'changed' })
    expect(again.css.match(/--color-neutral-900:/g)).toHaveLength(1)
    expect(again.css).toContain('--color-neutral-900: oklch(20.5% 0 none);')
    expect(again.css).not.toContain('changed')
  })

  it('leaves the file untouched when the role or a required block is absent', () => {
    expect(editTheme(theme, { role: 'missing', mode: 'dark', step: 'blue-600', value: 'x' }).result).toEqual({ status: 'rejected', reason: 'BOX_MISSING' })
    const doubled = theme.replace(':root {', ':root {\n}\n:root {')
    expect(editTheme(doubled, { role: 'primary', mode: 'light', step: 'blue-600', value: 'x' })).toEqual({ css: doubled, result: { status: 'rejected', reason: 'TARGET_AMBIGUOUS' } })
  })

  it('replaces the original only after the temporary file is written', async () => {
    await mkdir('artifacts', { recursive: true })
    const directory = await mkdtemp(path.join('artifacts', 'theme-edit-'))
    const file = path.join(directory, 'index.css')
    await writeFile(file, theme)
    await expect(writeTheme(file, { role: 'primary', mode: 'dark', step: 'white-10', value: 'oklch(1 0 0 / 10%)' })).resolves.toEqual({ status: 'written' })
    const saved = await readFile(file, 'utf8')
    expect(saved).toContain('--primary: var(--color-white-10);')
    expect(saved).toContain('--color-white-10: oklch(1 0 0 / 10%);')
  })
})

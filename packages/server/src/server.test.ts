import { describe, expect, it } from 'vitest'
import { generateSecurityToken } from './security.js'
import { extractThemeTokens } from './css-parser.js'

describe('Server Security Token (安全令牌)', () => {
  it('应生成 6 位全大写字母/数字的安全令牌', () => {
    const token = generateSecurityToken()

    expect(token).toBeDefined()
    expect(token.length).toBe(6)
    // 正则检查是否全为十六进制大写字符
    expect(token).toMatch(/^[0-9A-F]{6}$/)
  })
})

describe('PostCSS CSS Parser (主题变量解析器)', () => {
  it('应准确提取 :root 和 .dark 下的 CSS 变量', () => {
    const sampleCss = `
      :root {
        --background: #ffffff;
        --primary: #000000;
      }
      .dark {
        --background: #09090b;
        --primary: #ffffff;
      }
    `

    const { light, dark } = extractThemeTokens(sampleCss)

    expect(light['--background']).toBe('#ffffff')
    expect(light['--primary']).toBe('#000000')

    expect(dark['--background']).toBe('#09090b')
    expect(dark['--primary']).toBe('#ffffff')
  })
})

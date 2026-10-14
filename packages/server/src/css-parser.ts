import postcss, { Rule } from 'postcss'

export interface ThemeTokens {
  light: Record<string, string>
  dark: Record<string, string>
}

/**
 * 主函数：解析 CSS 文本内容，提取 :root（浅色）与 .dark（暗色）模式下的所有主题变量
 * @param cssContent CSS 文件的纯文本源码
 */
export function extractThemeTokens(cssContent: string): ThemeTokens {
  const rootAst = postcss.parse(cssContent)

  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}

  // 遍历所有的规则节点
  rootAst.walkRules((rule) => {
    // 1. 匹配 :root 选择器
    if (rule.selector === ':root' || rule.selector.includes(':root')) {
      const vars = extractCustomProperties(rule)
      Object.assign(light, vars)
    }

    // 2. 匹配 .dark
    if (rule.selector === '.dark' || rule.selector.includes('.dark')) {
      const vars = extractCustomProperties(rule)
      Object.assign(dark, vars)
    }
  })

  return { light, dark }
}

/**
 * 辅助函数：从一个 PostCSS 规则节点中提取所有以 -- 开头的 CSS 自定义变量
 */
function extractCustomProperties(rule: Rule): Record<string, string> {
  const properties: Record<string, string> = {}
  rule.walkDecls((decl) => {
    if (decl.prop.startsWith('--')) {
      properties[decl.prop] = decl.value
    }
  })
  return properties
}

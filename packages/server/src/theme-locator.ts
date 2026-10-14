import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { project } from '@shadcn/lint'

// 高频默认样式入口候选列表
const CANDIDATE_PATHS = [
  'src/index.css',
  'src/globals.css',
  'src/app/globals.css',
  'app/globals.css',
  'src/styles.css',
]

/**
 * 辅助函数：校验一个文件是否存在，且内容确实包含 Tailwind 入口特征
 */
async function isTailwindThemeFile(absoluteFilePath: string): Promise<boolean> {
  try {
    const content = await readFile(absoluteFilePath, 'utf-8')
    // 检查是否包含 @import "tailwindcss" 或 @import 'tailwindcss'
    return content.includes("@import 'tailwindcss'") || content.includes('@import "tailwindcss"')
  } catch {
    return false
  }
}

/**
 * 自动探测目标项目的主题样式入口文件
 * @param projectRoot 目标项目绝对根路径
 * @returns 相对路径 （如 'src/index.css'），若未找到则返回 null
 */
export async function findThemeFile(projectRoot: string): Promise<string | null> {
  const root = path.resolve(projectRoot)

  // 1. 尝试调用官方API
  try {
    const probedPath = project.themeFileFor(root)
    if (probedPath) {
      const absoluteProbedPath = path.resolve(root, probedPath)
      const rel = path.relative(root, absoluteProbedPath)

      // 检查：确保文件位于项目内部且内容包含 Tailwind 特征
      if (
        !rel.startsWith('..') &&
        !path.isAbsolute(rel) &&
        (await isTailwindThemeFile(absoluteProbedPath))
      ) {
        // 统一转换为正斜杠路径返回（避免 Windows 下出现反斜杠）
        return rel.replace(/\\/g, '/')
      }
    }
  } catch {}

  // 2. 遍历候选路径 + 特征校验
  for (const candidate of CANDIDATE_PATHS) {
    const absoluteCandidatePath = path.join(root, candidate)
    if (await isTailwindThemeFile(absoluteCandidatePath)) {
      return candidate
    }
  }

  return null
}

import path from 'node:path'
import { cosmiconfig } from 'cosmiconfig'
import { rawConfigSchema } from 'shadcn/schema'

// 与官方 getRawConfig 相同：searchPlaces 只有 components.json。
// 不能传 stopDir。cosmiconfig 9 看见 stopDir 会改用 global 搜索，从而读到 %APPDATA%\components\Config。
// searchStrategy none 只查看传入的项目根目录。标准输出只有结论和外观名。
try {
  const root = process.argv[2]
  if (!root || !path.isAbsolute(root)) throw new Error('Root required')
  const found = await cosmiconfig('components', {
    searchPlaces: ['components.json'],
    searchStrategy: 'none',
  }).search(root)
  if (!found) {
    process.stdout.write(JSON.stringify({ status: 'missing' }))
  } else {
    const parsed = rawConfigSchema.safeParse(found.config)
    const style = parsed.success ? parsed.data.style : ''
    process.stdout.write(JSON.stringify(
      parsed.success && style.length > 0 ? { status: 'valid', style } : { status: 'invalid' },
    ))
  }
} catch {
  process.exitCode = 1
}

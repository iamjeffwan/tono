import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { findThemeFile } from './theme-locator.js'
import { extractThemeTokens } from './css-parser.js'
import { generateSecurityToken, createSecurityMiddleware } from './security.js'

export interface ServerOptions {
  port?: number
  token?: string
  projectRoot?: string
}

/**
 * 启动本地设计体系开发服务
 * @param options 端口与安全令牌配置
 */
export function startServer({
  port = 3001,
  token = generateSecurityToken(),
  projectRoot = process.cwd(),
}: ServerOptions = {}) {
  const app = new Hono()
  const targetProjectRoot = path.resolve(projectRoot)

  // 安全 token 中间件
  app.use('/*', createSecurityMiddleware(token))

  // 托管前端静态产物（路径指向 apps/web/dist)
  app.use('/*', serveStatic({ root: './apps/web/dist' }))

  // 健康检查
  app.get('/api/health', (Context) => {
    return Context.json({ status: 'ok', message: 'Hono 本地服务已就绪' })
  })

  // 获取目标项目的主题变量数据
  app.get('/api/tokens', async (c) => {
    // 优先使用启动时绑定的 targetProjectRoot, 同时也支持 query 参数临时指定
    const finalRoot = path.resolve(c.req.query('root') ?? targetProjectRoot)

    // 1. 探测主题文件路径
    const themeRelativePath = await findThemeFile(finalRoot)
    if (!themeRelativePath) {
      return c.json(
        {
          success: false,
          error: '未能在目标项目中找到 Tailwind CSS 主题入口文件 （如 src/index.css）',
        },
        404,
      )
    }

    // 2. 读取 CSS 主题文件内容
    const absoluteCssPath = path.join(finalRoot, themeRelativePath)
    const cssContent = await readFile(absoluteCssPath, 'utf-8')

    // 3. AST 解析并提取变量
    const tokens = extractThemeTokens(cssContent)

    return c.json({
      success: true,
      projectRoot: finalRoot,
      themePath: themeRelativePath,
      tokens,
    })
  })

  // 启动服务并等待真正就绪后，resolve 返回
  return new Promise<{ server: ReturnType<typeof serve>; port: number; token: string }>(
    (resolve) => {
      const server = serve(
        {
          fetch: app.fetch,
          port,
        },
        () => {
          console.log(`本地服务运行在: http://127.0.0.1:${port}`)
          console.log(`本地安全令牌: ${token}`)
          resolve({ server, port, token })
        },
      )
    },
  )
}

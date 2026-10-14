import crypto from 'node:crypto'
import { Context, type Next } from 'hono'

/**
 * 生成 6 位随机安全码
 */
export function generateSecurityToken(): string {
  // 大写字母和数字的组合
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

/**
 * Hono security 中间件：检查请求是否携带正确的 token
 */
export function createSecurityMiddleware(expectedToken: string) {
  return async (c: Context, next: Next) => {
    // 静态前端网页放行，只对 /api/ 接口执行鉴权
    if (!c.req.path.startsWith('/api')) {
      return next()
    }

    // 从 Header (x-token) 或 URL query （?token=...) 中获取凭据
    const clientToken = c.req.header('x-token') || c.req.query('token')

    if (!clientToken || clientToken !== expectedToken) {
      return c.json(
        {
          success: false,
          error: '无效或缺失安全凭据（Unauthorized）',
        },
        401,
      )
    }

    await next()
  }
}

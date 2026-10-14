import { cac } from 'cac'
import open from 'open'
import { findAvailablePort } from './port.js'
import path from 'node:path'
import { startServer } from '@tono/server'
import { generateSecurityToken } from '@tono/server/security'

export const cli = cac('tono')

cli
  .command('[root]', '启动 Tono 开发工具')
  .option('--port <port>', '指定服务监听端口')
  .action(async (root, options) => {
    const projectRoot = path.resolve(root || process.cwd())

    // 探测可用端口
    const desiredPort = options.port ? Number(options.port) : 3001
    const port = await findAvailablePort(desiredPort)

    // 生成本次的安全令牌
    const token = generateSecurityToken()

    await startServer({ port, token, projectRoot })

    const url = `http://127.0.0.1:${port}/?token=${token}`
    console.log(`Tono 本地设计体系工作台已就绪：${url}`)

    // 自动唤起浏览器
    await open(url)
  })

cli.help()
cli.version('0.1.0')

cli.parse()

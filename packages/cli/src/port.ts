import net from 'node:net'

/**
 * 探测制定端口是否空闲，若被占用则自动 +1 递归查找
 */
export async function findAvailablePort(startPort = 3001): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    // 尝试监听端口
    server.listen(startPort, () => {
      // 监听成功，说明端口空闲。立即关闭测试 server 并返回该端口
      server.close(() => {
        resolve(startPort)
      })
    })

    // 监听错误
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // 端口被占用，递归检测下一个端口
        resolve(findAvailablePort(startPort + 1))
      } else {
        reject(err)
      }
    })
  })
}

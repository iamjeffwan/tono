import { describe, expect, it } from 'vitest'
import { findAvailablePort } from './port.js'

describe('CLI Port Detector (端口探测器)', () => {
  it('应成功返回指定端口或空闲端口号', async () => {
    const port = await findAvailablePort(3001)

    // 断言：返回的端口应当是一个有效的数字且 >= 3001
    expect(typeof port).toBe('number')
    expect(port).toBeGreaterThanOrEqual(3001)
  })
})

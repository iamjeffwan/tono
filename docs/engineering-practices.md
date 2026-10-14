# 本地工具成熟工程实践手册 (Engineering Best Practices)

本文档记录本项目在开发过程中积累、核对并确认采用的工业级成熟编码与架构规范（主要对齐 Vite、UnoCSS 等顶级开源项目）。任何后续代码指导与方案设计均须严格对齐本文档。

---

## 1. 配置与参数模式：ES6 参数解构默认值 (Options Normalization)

- **核心原则**：严禁在函数体内部到处散落 `||` 或 `??` 兜底打补丁。
- **成熟做法**：
  在函数签名入口处，直接使用 ES6 原生解构为所有可选参数赋予默认值。
  ```ts
  // ✅ 工业级成熟做法：入口处一次性锁定默认值，函数体内干干净净
  export async function startServer({
    port = 3001,
    token = generateSecurityToken(),
    projectRoot = process.cwd(),
  }: ServerOptions = {}) {
    // 函数体内部直接使用，100% 确定有值，无任何冗余判断
  }

  // ❌ 业余做法：函数内部到处写或语句兜底，存在 0 / false 等 Falsy 判定漏洞
  export function startServer(options: ServerOptions = {}) {
    const port = options.port || 3001
    const token = options.token || generateSecurityToken()
  }
  ```

---

## 2. 模块化与包依赖：Monorepo 标准工作区引用 (Workspace Packages)

- **核心原则**：严禁在 Monorepo 内部跨多层级使用脆弱的相对路径（如 `../../../apps/server`）。
- **成熟做法**：
  每一个子包都拥有独立且规范的 `package.json` 和包名（Package Name）。跨包调用通过 `workspace:*` 依赖进行语义化导入。
  ```ts
  // ✅ 工业级成熟做法 (参考 @unocss/cli 引用 @unocss/inspector)
  import { startServer } from '@design-system/server'

  // ❌ 业余做法：容易被文件目录微调破坏的相对路径地狱
  import { startServer } from '../../../apps/server/src/index.js'
  ```

---

## 3. 模块架构职责：纯库导出 vs 唯一指挥官 (Single Responsibility)

- **核心原则**：服务端模块（Server）纯粹作为能力库，绝不自执行；命令行模块（CLI）作为唯一总指挥官。
- **成熟做法**：
  - `server/src/index.ts` 只做 `export function startServer`，不保留任何 `if (process.argv...)` 自执行逻辑，杜绝模块被导入时的意外副作用；
  - `cli/src/main.ts` 作为唯一入口，统一负责参数解析、端口探测、启动服务与打开浏览器。

---

## 4. 异步时序：网络监听回调与 Promise 闭环 (Async Readiness)

- **核心原则**：凡是涉及底层网络套接字监听的操作，必须保证以 Promise 形式并在底层真正 `listen` 成功后才 resolve。
- **成熟做法**：
  必须等待底层 HTTP 服务器成功绑定端口的回调触发后，再放行 CLI 去调用 `open(url)`，杜绝浏览器弹开瞬间因端口尚未就绪导致的 `ERR_CONNECTION_REFUSED`。

---

## 5. 本地开发安全：一次性短命令牌与首屏痕迹抹除 (Security Gate & Cleanup)

- **核心原则**：防范外部恶意网页的跨站请求伪造（CSRF）与偷窥，且不留多余负担。
- **成熟做法**（对齐 UnoCSS）：
  1. 服务启动时生成 6 位随机安全码；
  2. CLI 首次打开网页带上 `?token=XXX`；
  3. 服务端仅对 `/api` 接口校验请求头 `x-token` 或 `token` 参数；
  4. 前端网页加载后立即通过 `window.history.replaceState` 抹平地址栏中的 Token 参数，不留历史记录，内存接管后续 API 请求头。

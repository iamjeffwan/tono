# HANDOFF - Tono 项目交接与开发指导文档

> **致接棒的 AI 编程助手**：  
> 请务必在开始任何对话与编码前，**完整通读本文档以及根目录的 `AGENTS.md`**！  
> 本文档是整个项目的上下文交接核心，包含了架构蓝图、已交付能力、代码守则以及极其重要的**教学互动规范**。

---

## 1. 项目概况与品牌定义 (Overview & Branding)

- **项目名称**：`Tono`（读音：`/ˈtoʊnoʊ/`，源于拉丁语/意语/西语，意为“色调、调性”）
- **项目定位**：面向 **Tailwind CSS v4** 与 **shadcn/ui** 的纯本地极轻量设计体系工作台（Local DevTool）。
- **对标产品**：Vite、UnoCSS 等具备极佳开发体验与极速启动特性的现代开发工具。
- **仓库地址**：`https://github.com/iamjeffwan/tono.git`
- **本地路径**：`F:\tono`
- **核心形态**：开发者在任意前端项目根目录下运行 `npx tono` 或 `tono`，CLI 会自动探测空闲端口、生成单次安全令牌（Security Token）、启动本地 Hono 独立微服务并自动唤起浏览器，展示可视化设计体系编辑与实时预览面板。

---

## 2. 整体架构与目录结构 (Architecture & Layout)

本项目彻底弃用了早期过于沉重的 TanStack Start / SQLite / 会话缓存方案，采用 **UnoCSS 风格的扁平 Monorepo 架构**：

```text
tono/
  ├── packages/
  │     ├── cli/         # @tono/cli：CAC 命令行入口、原生端口自增探测、自动唤起浏览器
  │     ├── server/      # @tono/server：Hono 极简本地 HTTP API 服务、安全鉴权、PostCSS AST 解析与写回
  │     └── web/         # @tono/web：React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui 可视化工作台 SPA
  ├── archive/           # 归档的历史旧代码（已废弃的扫码与旧版服务端）
  ├── docs/              # 架构决策与工程实践沉淀
  │     ├── engineering-practices.md  # 顶级开源工程模式沉淀
  │     └── ...
  ├── AGENTS.md          # 核心教学与协作守则（AI 指导最高准则）
  ├── HANDOFF.md         # 本交接文档
  └── package.json       # Monorepo 根配置 (workspaces: ["packages/*"])
```

### 技术栈选型（严禁引入无意义的沉重依赖）：
- **CLI**：`cac`（Evan You 出品的极轻量命令行框架） + `open`（自动唤起浏览器） + `node:net` 原生端口自增探测器（对齐 Vite 源码实现）。
- **Server**：`hono` + `@hono/node-server`（轻量、冷启动极快、零原生编译依赖） + `postcss`（精准 AST 级 CSS 自定义属性提取与写回） + `@shadcn/lint`（主题路径嗅探）。
- **Web SPA**：`React 19` + `Vite 8` + `Tailwind CSS v4` + `shadcn/ui` + `lucide-react`。
- **测试框架**：`Vitest 3`。

---

## 3. 当前开发进度：Phase 1 已经完成的能力 (Completed Deliverables)

Phase 1 已经全部编写并通过单测，代码状态处于 **100% 绿灯（Green / Pass）**：

1. **原生端口探测器** (`packages/cli/src/port.ts`)：
   - 采用 Vite 原生实现，基于 Node.js `node:net` 监听与 `EADDRINUSE` 错误递归 `+1` 探测，无外部第三方依赖。
   - 对应测试：`packages/cli/src/port.test.ts`。
2. **UnoCSS 风格临时安全令牌** (`packages/server/src/security.ts`)：
   - 每次服务启动自动通过 `node:crypto` 生成 6 位大写十六进制安全令牌（`generateSecurityToken`）。
   - 提供 Hono 中间件（`createSecurityMiddleware`），静态网页直接放行，所有 `/api/*` 请求强制校验 `x-token` 请求头或 `?token=` 参数，阻断本地跨域恶意攻击。
3. **本地开发服务** (`packages/server/src/index.ts`)：
   - 导出 `startServer({ port = 3001, token = generateSecurityToken(), projectRoot = process.cwd() }: ServerOptions = {})`。
   - 遵循规范的 ES6 解构默认值，当 `server.listen` 成功触发回调后才安全 resolve。
4. **Tailwind v4 主题文件嗅探器** (`packages/server/src/theme-locator.ts`)：
   - 两阶段探测：第一阶段调用 `@shadcn/lint` 的 `project.themeFileFor(root)` 并进行防路径遍历边界安全校验；第二阶段候选路径（`src/index.css`, `src/globals.css` 等）遍历并验证 `@import "tailwindcss"` 特征标记。
5. **PostCSS AST 主题变量解析器** (`packages/server/src/css-parser.ts`)：
   - 能够解析 CSS 源码，精准提取 `:root`（浅色模式）与 `.dark`（暗色模式）的所有以 `--` 开头的 CSS 变量键值对。
   - 对应测试：`packages/server/src/server.test.ts`。
6. **CLI 主入口** (`packages/cli/src/main.ts`)：
   - 串联 CAC、端口探测、Token 生成、Server 启动、携带 `?token=${token}` 并自动调用 `open(url)` 唤起用户默认浏览器。

---

## 4. 核心教学与协作守则（对 AI 助手的强制性约束）

> **⚠️ 绝对红线（Non-Negotiable Constraints）**：
> 1. **用户是初学者，90% 的代码必须由用户亲手键入**。**严禁 AI 替用户直接生成/覆写业务代码文件**（除非用户明确发出“帮我写”或“写”的指令）。
> 2. **一次只推进一个微步骤（One Step at a Time）**：绝不允许一次性抛出一大堆文件修改或长篇代码片段。
> 3. **双语专业术语标注**：所有出现的专业词汇、API、组件、属性名，必须使用“英文（中文通俗解释）”格式。例如：`State`（状态）、`Props`（组件属性）、`AST`（抽象语法树）、`Hook`（钩子函数）。
> 4. **命令行逐行拆解**：给出的任何 PowerShell / Bash 命令，必须逐行拆解解释每一个参数的实际作用，杜绝“黑盒运行”。
> 5. **代码组织遵循“报纸法则（Newspaper Metaphor）”**：指导用户编写代码时，结构必须是：
>    - 顶部：类型定义（Types/Interfaces）与常量配置；
>    - 中部：对外导出的核心主函数（Main Export）；
>    - 底部：被调用的私有辅助细节函数（Helper/Utility Functions）。
> 6. **拒绝玩具模式，必须对标顶级开源**：
>    - 凡是遇到架构和模式选择，主动参考 Vite、UnoCSS 的官方实现（参见 `docs/engineering-practices.md`）。
>    - 绝不使用脆弱的 `||` 假值 fallback，强制使用 ES6 解构参数默认值。
>    - 绝不在 Monorepo 内部使用深度相对路径（`../../../`），强制通过 npm workspace 包名解析（如 `@tono/server`）。
> 7. **全链路透明与时序图前置**：在进入任何前后端联动之前，必须先把完整的数据流向、状态保存在哪、URL 携带什么、时序逻辑清晰透明地交代给用户。

---

## 5. 下一阶段任务：Phase 2 核心待办 (Next Steps: Phase 2 Roadmap)

新对话开启后，直接进入 **Phase 2（可视化前端工作台与双向联动）** 的构建：

1. **Step 2.1：Server 端暴露主题读取与写回 API** (`packages/server`)
   - `GET /api/theme`：调用 `theme-locator` 找到路径，读取并调用 `css-parser` 提取 `:root` 与 `.dark` 变量字典，以 JSON 返回。
   - `POST /api/theme`：接收前端修改后的 CSS 变量字典，使用 PostCSS 遍历修改 AST 并精准格式化写回原 CSS 文件。
2. **Step 2.2：Web 端安全凭据接收与擦除** (`packages/web`)
   - 页面加载时从 `window.location.search` 提取 `token`，存储在客户端内存状态中。
   - 立即通过 `window.history.replaceState({}, '', window.location.pathname)` 擦除 URL 上的 Token，避免分享泄露和视觉杂乱。
   - 配置前端 Axios / Fetch / TanStack Query 拦截器，自动将 Token 挂载到 `x-token` Header。
3. **Step 2.3：设计体系实时预览（0 延迟热生效）**
   - 借鉴 Chrome DevTools 原理：当用户在调色盘调节颜色或滑块调节圆角时，前端直接通过 `document.documentElement.style.setProperty('--primary', hex)` 注入当前 DOM，实现极致丝滑的 0 毫秒实时预览。
4. **Step 2.4：集成 `@shadcn/lint` 规则校验面板**
   - 展示项目的 `@shadcn/lint` 运行结果，提示任意值（Arbitrary values）和未注册原始色（Raw colors）的使用情况，辅助用户一键规范化。

---

## 6. 常用验证与开发命令 (Quick Commands)

在根目录 `F:\tono` 下：
- **运行单元测试**：`npm test`（当前包含端口探测与 CSS 解析，全部 PASS）
- **本地启动服务**：`npm run dev:server`（开发模式启动 Hono 服务）
- **本地启动前端**：`npm run dev:web`（开发模式启动 Vite 前端工作台）
- **构建 CLI**：`npm run build:cli`

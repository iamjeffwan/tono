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

### 技术栈选型：
- **CLI**：`cac` + `open` + `node:net` 原生端口自增探测器（对齐 Vite 源码实现）。
- **Server**：`hono` + `@hono/node-server` + `postcss` + `@shadcn/lint`。
- **Web SPA**：`React 19` + `Vite 8` + `Tailwind CSS v4` + `shadcn/ui` + `lucide-react`。
- **测试框架**：`Vitest 3`。

---

## 3. 当前开发进度：Phase 1 已经完成的能力 (Completed Deliverables)

Phase 1 已经全部编写并通过单测，代码状态处于 **100% 绿灯（Green / Pass）**：

1. **原生端口探测器** (`packages/cli/src/port.ts`)：测试通过。
2. **UnoCSS 风格临时安全令牌** (`packages/server/src/security.ts`)：测试通过。
3. **本地开发服务** (`packages/server/src/index.ts`)：服务启动与端口监听已打通。
4. **Tailwind v4 主题文件嗅探器** (`packages/server/src/theme-locator.ts`)：两阶段安全探测。
5. **PostCSS AST 主题变量解析器** (`packages/server/src/css-parser.ts`)：提取 `:root` 与 `.dark` 变量，测试通过。
6. **CLI 主入口** (`packages/cli/src/main.ts`)：串联端口、令牌、Server 启动与浏览器自动打开。

---

## 4. ⚠️ 结对编程与教学守则（AI 助手必读，严防教条化）

> ### 核心认知纠偏：
> 用户是一名初学者。不要把“严禁代写代码”理解为“只给思路让用户自己凭空写代码”。
> **严禁当甩手掌柜！初学者无法凭空写出生产级代码。**
> 
> 正确的合作方式是 **“教练出图纸，学员来施工”**：
> 1. **提供完整代码图纸**：AI 必须在聊天回复中，直接给出编写完整、组织优雅（报纸法则）、注释清晰的**代码范本（Code Snippet）**，并明确指明写在哪个文件的哪个位置。
> 2. **“不代写”的真正所指**：AI **不要通过后台自动化工具直接静默修改或创建用户的本地文件**。必须把代码打在对话框里，由用户在 VS Code 里亲自新建、复制或敲入，由用户在终端运行命令。
> 3. **保姆级原理解释**：代码给出后，必须逐段解释其原理，出现的专业名词必须标注英文原名及中文释义（例如：`Middleware`（中间件））。
> 4. **逐行命令拆解**：给出的任何终端命令，必须逐行拆解参数。
> 5. **单步闭环**：一步给一个目标与验收命令（如 `npm test`），用户反馈成功后再进入下一步。

---

## 5. 下一阶段任务：Phase 2 核心待办 (Next Steps: Phase 2 Roadmap)

新对话开启后，直接进入 **Phase 2（可视化前端工作台与双向联动）** 的构建：

1. **Step 2.1：Server 端暴露主题读取与写回 API** (`packages/server`)
   - `GET /api/theme`：调用 `theme-locator` 找到路径，读取并调用 `css-parser` 提取 `:root` 与 `.dark` 变量字典，以 JSON 返回。
   - `POST /api/theme`：接收前端修改后的 CSS 变量字典，使用 PostCSS 遍历修改 AST 并精准格式化写回原 CSS 文件。
2. **Step 2.2：Web 端安全凭据接收与擦除** (`packages/web`)
   - 页面加载时从 `window.location.search` 提取 `token`，存储在客户端内存状态中。
   - 立即通过 `window.history.replaceState({}, '', window.location.pathname)` 擦除 URL 上的 Token。
   - 配置前端网络请求，自动将 Token 挂载到 `x-token` Header。
3. **Step 2.3：设计体系实时预览（0 延迟热生效）**
   - 当用户在调色盘调节颜色或滑块调节圆角时，前端直接通过 `document.documentElement.style.setProperty` 注入当前 DOM，实现极致丝滑的 0 毫秒实时预览。
4. **Step 2.4：集成 `@shadcn/lint` 规则校验面板**
   - 展示项目的 `@shadcn/lint` 运行结果，提示任意值（Arbitrary values）和未注册原始色（Raw colors）的使用情况。

---

## 6. 常用验证与开发命令 (Quick Commands)

在根目录 `F:\tono` 下：
- **运行单元测试**：`npm test`（当前包含端口探测与 CSS 解析，全部 PASS）
- **本地启动服务**：`npm run dev:server`（开发模式启动 Hono 服务）
- **本地启动前端**：`npm run dev:web`（开发模式启动 Vite 前端工作台）
- **构建 CLI**：`npm run build:cli`

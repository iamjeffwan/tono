# 技术决策记录

这里只记录本项目已确认的技术选择。官方支持某种做法，不等于要求所有项目采用；项目选择与官方事实分别说明。

## 本地文件保存体系，网页负责编辑

状态：2026-10-12 用户确认产品方向；文档已整理，新实现未开始。

依据：本次讨论确认“体系在项目内部靠文件保存，本地编辑网页修改”；流程见 docs/phases/03-web/product-flow.md（当前产品流程）。此前运行时远程主题研究不作为当前产品方向。

选择：开发阶段在本地启动工具，网页读取和编辑体系，本地服务处理保存与检查。下一项目通过文件复制或导入复用；普通应用运行不依赖编辑服务。启动入口可以是命令，但每次保存不再要求单独执行写回命令。

取舍：项目文件便于保留、审查与复用；需要设计文件冲突、失败恢复和已有项目接入。独立体系文件加生成主题是首选提议，具体格式、命名与保存机制未定，不在本次文档整理中落实。

验证：第一阶段文档整理完成。文件读回、主题接入、检查与第二项目复用留到对应阶段验证。

重评条件：明确需要跨项目共同维护、远程协作或运行时远程主题时，再比较新需求及文件保存方式的边界。

## 本地工具架构采用 CLI + 本地 Server + Vite SPA 纯静态前端

状态：2026-10-13 用户确认架构方案。

项目依据：工具定位为纯本地开发辅助工具（Local DevTool），用户通过命令启动后打开本地网页，完成主题变量管理与规则生成。纯富客户端交互，不需要 SSR（服务端渲染）与 SEO。

行业标杆参考依据：
- `rogden/tailwind-config-viewer`（~2.2k ⭐）：CLI 启动本地 Node 服务并托管静态网页展示主题配置；
- `unocss/unocss` 的 `packages/inspector`（~19k+ ⭐）：轻量服务 + 极精致的静态 DevTool 纯客户端界面；
- `webpack/webpack-bundle-analyzer`（~12.7k ⭐）：工业级本地分析工具启动器与浏览器自动打开范式。

选择：
1. 命令行入口（CLI）：使用轻量命令行解析工具解析参数，自动寻找空闲端口，使用 `open`（跨平台打开工具）唤起系统浏览器；
2. 本地服务（Server）：使用轻量 Node 服务（如 `Hono`），负责托管构建产物并提供精简的文件读取、保存和规则生成 API；
3. 前端界面（Web）：纯 `Vite` 构建的 `React` SPA（单页应用），结合 `Tailwind CSS` 与 `shadcn/ui`，利用客户端内存草稿与 DOM 样式动态修改实现 0 延迟实时预览。

取舍：相比全栈框架方案，前后端边界更加清晰，分发包体积更小，冷启动达到毫秒级，无 SSR 心智负担；前后端通过精简的本地接口打通。

## 代码检查规则采用 @shadcn/lint 体系

状态：2026-10-13 确认。

依据：调研报告 docs/research/shadcn-lint-capability-audit.md。本项目核心场景是 Tailwind CSS v4 与 React 组件开发，绝大部分业务样式写在 TSX/JSX 的 `className` 中，不写裸 CSS 文件。

选择：生成针对 `@shadcn/lint`（面向 Tailwind v4 的 ESLint 规则插件）的配置，约束业务代码中的 `no-arbitrary-values`（禁止任意值）与 `no-raw-colors`（禁止原始颜色），强制使用项目已定义的主题语义。

取舍：`Stylelint` 仅针对裸 CSS 文件；本项目主要守卫的是业务组件中的 Tailwind 工具类与内联样式，因此选用 `@shadcn/lint` 最为契合。

## 历史：新开发采用全栈框架的本地服务能力（已废弃）

状态：2026-10-12 曾作为调研方案；2026-10-13 被上方“CLI + 本地 Server + Vite SPA”成熟轻量架构替代。保留记录备查。


## 网页使用声明式路由

状态：历史决定，2026-10-10 核对；2026-10-12 被上方新开发方向替代。以下说明旧代码为何采用此方式，不约束新实现。

项目依据：docs/phases/03-web/organization-routing.md（组织路由说明）；apps/web/src/main.tsx（网页入口）已使用 BrowserRouter（浏览器路由容器），应用通过组件声明页面。

官方依据：node_modules/react-router/docs/start/modes.md（路由模式说明）及 start/declarative（声明式模式文档）；.agents/skills/react-router/references/declarative-mode.md（官方声明式模式参考）。

选择：继续声明式路由；服务端状态继续由 TanStack Query（查询库）管理。路由模式是项目选择，不是官方唯一最佳方案。

取舍：保持现有页面结构和学习路径；当前不使用数据路由或框架模式特有的取数机制。

重评条件：需求明确需要当前模式无法合理提供的路由能力，或有实际验证证明当前方案不适合。重评时比较迁移收益、成本与对应版本官方依据。

## 项目地址与组织地址并列

状态：2026-10-10 确认的历史页面约定。2026-10-12 转为本地工具后，最终页面与地址留到第二阶段重新确认；下文只描述旧代码。原决定替代此前在项目地址中同时保留组织编号的推断。

项目依据：用户确认参考 Supabase Studio 的地址分工；项目归属继续由 apps/web/src/workspace.ts（工作区示例数据）中 Project（项目类型）的 organizationId（所属组织编号）表示。

参考依据：固定提交 1b27761bec80372daf9646cfa309a12e9ff5454b 中，组织项目列表是 apps/studio/pages/org/[slug]/index.tsx，项目主页是 apps/studio/pages/project/[ref]/index.tsx。项目卡片默认进入 `/project/${projectRef}`。事实摘录见 docs/phases/03-web/supabase-source-guide.md（参考源码阅读指南）。这是参考项目的页面结构，不是路由库的官方要求。

选择：组织列表使用 `/organizations`，组织项目列表使用 `/org/:organizationId`，项目页面使用 `/project/:projectId` 及其子页面。

取舍：项目地址只携带项目编号，避免地址中的组织编号与项目数据互相矛盾。地址不再直接展示项目所属组织，需要时从项目数据读取。

验证结果：2026-10-10 已在 apps/web/src/App.tsx（应用入口）使用并列地址。组织卡片进入 /org/:organizationId，项目链接进入 /project/:projectId。点击、直接打开、刷新和浏览器历史均已核对。结构说明见 docs/phases/03-web/web-architecture.md（网页架构）。

重评条件：产品明确要求地址本身展示组织归属，或项目编号不能独立定位项目。

## 使用 Prettier 统一格式

状态：2026-10-10 确定配置，尚未安装。

项目依据：仓库当前没有格式化工具。apps/web（网页）和 packages/cli（命令行）的现有代码普遍不写分号；命令行使用单引号，网页中由 shadcn 生成的代码多用双引号。

官方依据：https://prettier.io/docs/install 与 https://prettier.io/docs/configuration（访问日期 2026-10-10）。当前版本是 3.9.9，要求作为本地开发依赖精确安装。配置放在项目内，不使用全局安装。

参考依据：固定提交 1b27761 的 prettier.config.mjs 使用 semi（分号）为 false、singleQuote（单引号）为 true、printWidth（参考行宽）为 100。它另外启用 SQL 和导入排序插件；当前仓库没有这两项需求。

选择：在仓库根目录安装 prettier@3.9.9，使用 .prettierrc.json。采用不写分号、单引号、两格缩进、参考行宽 100、换行使用 lf。尾随逗号保持 Prettier 3 的默认值 all。

取舍：格式化后，网页里现有的双引号会变成单引号。不复制 Supabase 的 trailingComma: es5，因为 Prettier 3 已把 all 作为默认值。

验证结果：待安装和配置文件创建后，用 prettier . --check 验证。

重评条件：编辑器或检查工具与这组选项产生持续冲突，或仓库决定改用另一个格式化工具。

## 后续记录格式

每项写清：日期、问题、版本和模式、官方章节、项目推断、最终选择、取舍、验证结果、重评条件。新提议先标为待验证，不覆盖已有决定。

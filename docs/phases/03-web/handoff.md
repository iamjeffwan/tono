# 阶段三网页：交接

## 当前交接：2026-10-12

用户已确认改为本地设计体系编辑工具，并采用 `TanStack Start`（全栈框架）重新开发。当前第一阶段“整理新方向”已完成，仅更新文档，未安装新依赖或修改业务代码。接下来是第二阶段“框架骨架”，等待用户开始当前一步。

先读 `product-flow.md`（当前产品流程）、`implementation-plan.md`（六阶段计划）和 docs/technical-decisions.md（技术决策记录）。框架与官方技能资料见 docs/research/tanstack-start-migration.md（迁移资料）。以下“历史交接”保留此前教学过程，不能作为当前实现指令。

本地服务与编辑网页属于同一个工具。启动时确定目标项目，网页读取文件、编辑草稿、提交保存与检查；不要求用户为每次保存再执行应用命令。体系以项目文件为保存依据，普通项目运行不依赖编辑工具。

文件命名、体系与生成样式是否分开、保存与恢复细节、导入冲突处理、最终地址和导航都尚待确定。组织和项目页面只是当前旧代码，不自动成为本地工具的必需结构。侧栏调整另行教学，不在文档整理阶段实现。

服务端入口与新读写流程由用户重新编写；现有检测、主题处理、校验和测试按需要核对复用，既有代码保留至对应阶段验收。框架使用官方技能；页面与布局分工仍先读 `Supabase`（参考平台）固定提交中的新实现。它已有双框架入口，不能再认为该提交只有旧页面路由。

用户主要手工写代码。每一步先解释用途、数据来源、运行位置、状态位置与完成标准；新库、组件和命令先说明，命令解释每个参数。阶段结束统一验证。只有明确要求代写时才修改业务代码。

## 历史交接：2026-10-10 及以前

这份文档给接手的助手。用户大约手工写百分之九十的代码。助手是技术负责人，一次只教当前一步。

最新网页方向：支持多个组织，每个组织多个项目；组织层管理项目，项目层显示主页、设计体系和检查入口。继续布局和导航工作前，读同目录的 `web-architecture.md`（网页架构）、`organization-routing.md`（组织路由说明）、`supabase-lessons.md`（Supabase 做法记录）和 `supabase-source-guide.md`（参考源码阅读指南）。用户已要求引入页面路由，此约定替代下文“不加路由库”。

讨论或实现主页、项目切换、设计体系、语义入口及命令行接入前，先读同目录的 `product-flow.md`（产品流程说明）。这是 2026 年 10 月 9 日确认的新方向；本文件和旧方案中的扫描任务、单独写回通道、独立语义页面描述，不再作为目标交互。现有接口和原型仍按旧流程运行，新方向尚未实现。

## 用户

用户正在学这个项目，按初学者对待。讲解用完整句子，先讲这个函数做什么，再讲数据从哪来、状态放在哪、签名、验收。

用户常问的点要主动讲清楚：

- 一个名字为什么长这样，两个看起来重复的词是不是设计错了。
- 请求正文为什么是字符串，`Content-Type: application/json` 又是什么。
- 页面、协议包、本机服务这三层各自负责什么。
- 创建写回和提交阶梯、提交语义是三件不同的事。
- 控制台自己的外观和用户正在编辑的阶梯、语义为什么必须分开。

用户提问时只回答所问的问题。用户要求看传输过程时可以用图。不要一次铺开整章方案。

## 名称怎么讲

提到组件时，先写英文名，紧接着用中文括号写中文名，让用户逐渐熟悉英文名称。引用代码里的组件时保留实际大小写，例如 `Button`（按钮）、`Separator`（分隔线）。

讲样式类名、属性或其他英文术语时，也在同一处补上中文解释。解释要说明当前场景里的作用，例如 `items-center`（在当前横向排列中让子元素垂直居中），不要只翻译单词。

## 教法

- 用户先说想做的事和大致结果，助手判断当前这一步的范围，补充用户没考虑到的地方，再讲用途、数据来源、状态位置、函数或组件签名，以及写完后怎么验收。
- 按阶段推进和验收，不在每个类型、文件或小改动后安排一轮验收。阶段开始说明目标、需要用户写的内容和完成标准；阶段内连续指导，不逐项索要确认。阶段完成后统一检查，或用户提出疑问、明确要求检查时针对性检查。
- 用户说“已完成”时，默认继续当前阶段的下一项指导，不自动运行检查；阶段整体完成时再验收。
- 定位代码时使用实际文件名，例如 `App.tsx`（应用入口文件）、`nav-main.tsx`（主导航文件），不要只说“应用组件”“主导航组件”。解释组件概念时仍使用英文名加中文解释。
- 必须完成的条件提前写清楚；用于理解的示例和练习明确标为可选，不把它们临时升级成阻塞项。同名项目示例是可选练习，不影响后续开发。
- 以当前开发任务为主，逐渐引入参考源码的设计。每次只附与当前任务有关的源码位置和简短解释，用户按需阅读，不要求先阅读大段源码。
- 不生成整个 `apps/web`，不贴完整页面。
- 用户卡住时，只补那一个函数或那一段，并留下周围代码给用户写。
- 默认把函数讲到用户能自己敲出来。用户明确说「我不会写这一段，请你补上」时才写入文件。
- 不提交，除非用户明确要求。不改 `node_modules`。不做规则包，不改测试项目里的组件类名。
- `demos/design-system` 继续只做接口测试。

## 已经定下的技术约束

技术栈只用 React 19、Vite、TypeScript、TanStack Query v5、shadcn/ui。不要加 react-i18next、路由库或另一套状态库。

网页包名是 `@design-system/web`。初始数据的包名是 `@design-system/tokens`，文件夹仍是 `packages/design-system`。协议包是 `@design-system/scan-contract`。本机服务的包名仍是 `@design-system-guardrails/scan-service`，不要顺手改掉。

控制台用 `apps/web/src/index.css` 里自己的固定主题。用户正在编辑的阶梯和语义只影响预览，不写进这套主题。

开发时页面请求写 `/api/...`。Vite 代理到 `http://127.0.0.1:3001`。地址不要写进页面代码。

## 三层怎么分工

- `packages/scan-contract` 规定请求和响应的字段。
- `packages/scan-service/src/http.ts` 已经接好下面这些路径。
- `apps/web/src/api.ts` 只负责调用，不另写一套字段。

页面用的六个调用：

| 函数 | 作用 |
|---|---|
| `createScanSession` | 登记一次扫描，返回编号、令牌、过期时间和命令 |
| `getScanSession` | 读取这次扫描的进度和结果 |
| `createApplySession` | 打开一条写回通道，指定要写的主题文件，本身不带颜色或尺寸 |
| `submitScale` | 往这条通道提交一整份阶梯 |
| `submitRoleChange` | 往这条通道提交一个语义盒子的一个明暗指向 |
| `getRoleChange` | 读取某一件改动是等待、已写入还是未写入 |

创建扫描、读取扫描、创建写回、两次提交、读取改动进度，这六个调用都不带 `Authorization`。令牌交给命令行，用在上传扫描结果、领取改动、回报写回结果。那三处不进 `api.ts`。

## 当前进度

教学顺序是 1 脚手架、2 五个控件、3 读取初始数据、4 请求函数、5 应用壳。这和 `implementation-plan.md` 里的步骤编号不同。继续按教学顺序，不要跳回方案里的第 3 步把壳重做一遍。

已经完成：

1. `apps/web` 已建好。根脚本是 `dev:web`。根 `tsconfig.json` 排除了 `apps/web`。
2. Tailwind 4 和 shadcn 已接入，组件库是 Base UI，预设是 Nova。五个控件能在页面上渲染。样式来自 `apps/web/src/index.css`。
3. `apps/web/src/design-system.ts` 已从 `@design-system/tokens/palette.json` 和 `scale.json` 读取初值，并用 `map` 复制每一项。`App` 里用两个 `<pre>` 把结果打出来。网页类型检查已通过。
4. `apps/web/src/api.ts` 已有 `fetchJson`、`createScanSession`、`getScanSession`、`createApplySession`、`submitScale`。协议包已导出 `CreateApplySessionRequest`、`SubmitRoleChangeResponse`、`RoleChangeView`。

还没做：

- `submitRoleChange(applyId, body)`，路径是 `POST /api/apply-sessions/${applyId}/changes`，请求体是 `RoleChangeRequest`。
- `getRoleChange(applyId, changeId)`，路径是 `GET /api/apply-sessions/${applyId}/changes/${changeId}`。
- `src/main.tsx` 还没有 `QueryClientProvider`。查询封装留到请求函数验收之后。

第 4 步剩余验收：网页源码没有 `127.0.0.1:3001`，`api.ts` 没有 `Authorization`，`npm exec --workspace @design-system/web -- tsc -b --pretty false` 通过，页面没有发出请求。

通过后进入第 5 步应用壳：照 `demos/wireframe/index.html` 搭侧栏和两个画面，用组件状态记录当前画面，不接接口。没有写回通道时不能进入体系。

## 下一步

以上进度中的旧记录以本节更新为准：六个请求函数和查询上下文已完成，页面尚未调用接口。

2026-10-10：声明式路由和页面骨架已接通。组织列表、按组织筛选的项目列表、项目主页、设计体系和检查入口可以沿地址切换。当前结构见 `web-architecture.md`（网页架构）。`AppLayout`（应用布局）和 `OrganizationLayout`（组织布局）仍只有 `Outlet`（子页面显示位置）。侧栏中的团队、示例项目和底部账号仍是占位。

阶段验收结果：点击跳转、直接打开已声明地址、刷新、前进和后退均符合当前路由。`npm exec --workspace @design-system/web -- tsc -b --pretty false` 仍有两处既有未使用导入：`app-sidebar.tsx` 的 `BoxesIcon`，`project-layout.tsx` 的 `BreadcrumbLink`。不存在的组织或项目不会进入 404 页面。

停在这里，等用户提出接下来想做的事，再只教当前这一小步。

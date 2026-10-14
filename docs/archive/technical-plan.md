# 技术方案

2026-10-12：本文全部为历史方案。当前技术方向见 docs/technical-decisions.md（技术决策记录），当前流程和计划见同目录 `product-flow.md`（产品流程）及 `implementation-plan.md`（六阶段计划）。下文“本机服务不换框架”“不加路由库”和旧接口状态均不约束新开发。

产品流程已在 2026 年 10 月 9 日调整。涉及项目接入、主题读取、语义入口和应用命令时，先读同目录的 `product-flow.md`（产品流程说明）。下文保留此前技术方案，尚未按新流程重新设计接口和状态；不要把现有方案视为新流程已经实现。

## 技术栈

| 层 | 选择 |
|---|---|
| 页面 | React 19、Vite、TypeScript，放在 `apps/web` |
| 服务端状态 | TanStack Query v5 |
| 控件 | shadcn/ui：侧栏、按钮、输入框、卡片、徽章 |
| 本机服务 | 现有 Fastify，不换框架 |
| 协议 | `@design-system/scan-contract` |

不加路由库、状态库和 react-i18next。两个画面用组件状态切换。文案直接写中文。

## 控制台和预览分开

`apps/web` 自己有一份固定的 Tailwind 主题，只服务 shadcn 控件。用户在页面上改的阶梯和语义指向，不写进这份主题。

预览是一块独立区域。按钮、卡片、输入框的颜色、间距、字号、字重、圆角和阴影，用当前草稿写成这块区域的 CSS 变量。预览不使用控制台的 `bg-primary` 或 `p-4`，避免阶梯草稿把侧栏一起改掉。

## 数据从哪来

色板初值是 `packages/design-system/palette.json`。档名按第一个连字符拆成色相行，例如 `red-50` 到 `red-950`。`black`、`white`、`white-10`、`white-15` 单独一行。

尺寸初值是 `packages/design-system/scale.json` 的整份 `variables`。页面展示并允许改值，不增删变量名。

语义初值新增 `packages/design-system/roles.json`，内容与 `demos/design-system/roles.js` 的默认对齐相同，并从这个包导出。`primary` 的浅色初值是 `neutral-900`。设计稿里的 `blue-600` 只表示测试项目里已经写回过的结果，页面不把这个值写死。`radius` 不进入语义列表。

页面不读取用户项目的主题文件，也不读取测试仓库。

## 页面状态

TanStack Query 只放服务端数据：

- 扫描任务：创建后按 `sessionId` 查询。状态是 `waiting_cli`、`completed`、`expired`。等待时每 2 秒重新查询，完成或过期后停止。
- 写回结果：提交后按 `applyId` 和 `changeId` 查询。状态是 `waiting`、`written`、`rejected`。`waiting` 时每 2 秒重新查询。

其余放在组件状态里：项目编号、当前画面、阶梯草稿、选中的盒子、正在编辑的浅色或深色、预览的明暗、已确认的写回通道编号。

## 接口

开发时 Vite 把 `/api` 代理到 `http://127.0.0.1:3001`。浏览器只请求自己的源。

已有接口，页面直接用：

| 动作 | 请求 |
|---|---|
| 创建扫描 | `POST /api/scan-sessions`，体是 `{ projectId }` |
| 查询扫描 | `GET /api/scan-sessions/:sessionId` |
| 确认主题并创建写回通道 | `POST /api/apply-sessions`，体是 `{ scanSessionId, themePath }` |
| 提交一个指向 | `POST /api/apply-sessions/:applyId/changes`，体是 `{ role, mode, step }` |
| 查询一件写回 | `GET /api/apply-sessions/:applyId/changes/:changeId` |

结果字段用协议里的原名：`tailwind`、`theme`、`shadcn`、`support`。主题路径取 `result.theme.status === 'located'` 时的 `path`。演示结果沿用结果里已有的标记，页面不另造一种状态。

## 整份阶梯要存下来

现在 `POST /api/apply-sessions/:applyId/scale` 不看请求体。命令行来取时，服务总是返回 `scale.json`。页面上改过的值到不了主题文件。

改成：

- 请求体可以带 `{ variables }`。变量用现有的 `scaleVariableSchema`。
- 名字集合必须和 `scale.json` 完全相同。少一个、多一个或重复，请求直接拒绝，不产生一件写回。
- 值可以不同。服务把这一份变量和这件写回一起存下来。
- 请求体省略 `variables` 时，仍保存当时的 `scale.json`。`demos/design-system` 的测试按钮可以继续不带变量。
- 命令行领取时返回存下来的那一份，不再临时读文件。命令行写入逻辑不变。

SQLite 的 `role_changes` 增加可空的 `variables` 文本列，里面是 JSON。旧行读出来是空，领取时按 `scale.json` 处理。角色行保持空。

## 预览怎么反映草稿

浅色和深色只决定预览读哪一边的指向。深色给预览根节点加上 `dark` 这个类名，用来切换草稿里的指向，不切换控制台主题。

点色板只改当前盒子、当前明暗下的档名，并立刻反映到预览。写文件只发生在「写回当前指向」或「写入整份阶梯」之后，由项目目录里留着的命令行完成。

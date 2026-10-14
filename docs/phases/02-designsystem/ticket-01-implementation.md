# 语义指向写回：实现步骤

工单正文见同目录 `ticket-01.md`。这份说明只写怎么做。

现有 `scan` 是一次检测、一次上传、然后退出。它的上传令牌十分钟有效，而且成功后不能再用。写回不能借这条令牌一直询问，所以另开一条写回通道。检测结论仍然复用现有扫描。

## 数据放在哪

基础阶梯继续以 `demos/design-system/base.js` 为来源。命令行和服务不读这个浏览器脚本。把颜色档抽成一份 JSON，放到 `packages/design-system/palette.json`：每一项是档名和颜色值，例如 `blue-600` 对 `oklch(54.6% 0.245 262.881)`，包含 `white-10`、`white-15`。演示页改成读同一份数据，避免两处各写一遍。

32 个盒子名继续用 `@design-system/scan-contract` 里的 `officialShadcnBoxNames`。写回接受其中除 `radius` 以外的名字。

## 协议

在 `packages/scan-contract/src/index.ts` 增加写回数据，不改扫描结果的第二版：

```ts
role: 官方盒子名，排除 radius
mode: light | dark
step: 调色板里的档名
status: waiting | written | rejected
```

一件改动在服务里还有编号、所属写回通道、提交时间和拒绝原因。拒绝原因只允许这几个固定码：`THEME_UNCONFIRMED`、`BOX_MISSING`、`STEP_UNKNOWN`、`TARGET_AMBIGUOUS`、`WRITE_FAILED`。

## 服务

`packages/scan-service` 增加一张写回表，不把改动塞进 `scan_sessions`。一行记录通道编号、项目编号、已确认的主题相对路径、令牌哈希、是否还有命令行在等待。另一张表按提交顺序保存改动。

接口沿用现有 Fastify 应用，仍只听本机：

| 调用方 | 方法与路径 | 作用 |
|---|---|---|
| 网页 | `POST /api/apply-sessions` | 传入扫描任务编号和用户确认的主题相对路径，返回通道编号、令牌和要复制的命令 |
| 网页 | `POST /api/apply-sessions/:id/changes` | 提交 `role`、`mode`、`step` |
| 网页 | `GET /api/apply-sessions/:id/changes/:changeId` | 查询 `waiting`、`written`、`rejected` |
| 命令行 | `POST /api/apply-sessions/:id/claim` | 取走最早一件等待中的改动；没有时返回空 |
| 命令行 | `POST /api/apply-sessions/:id/changes/:changeId/result` | 回写 `written` 或 `rejected` 加原因码 |

命令行这两个接口带 `Authorization: Bearer`。令牌只存哈希。网页查询不带令牌，和现在查询扫描结果一样，只在本机使用。

`claim` 用数据库事务把那一件从 `waiting` 改成处理中，避免两条命令取走同一件。处理中超过一分钟没有回写，就退回 `waiting`。回写必须带上服务签发的处理编号，旧的回写不能覆盖新的一次取走。

提交时只校验形状和档名是否在调色板里。盒子在不在文件里，由命令行打开文件后判断。未知档名直接拒绝，不进入队列。

## 命令行

`packages/cli/src/main.ts` 增加 `apply`。`scan` 和 `retry` 保持原样。

```text
design-guardrails apply --session <扫描编号> --apply <通道编号> --token <令牌> --theme <相对路径> --server <地址> --cwd <项目目录>
```

启动顺序：

1. 用现有 `createProjectDetector` 做一次检测。Tailwind 不是已安装的第四版、主题没有定位到、项目不是单应用，就退出。
2. `--theme` 必须和这次检测定位到的相对路径相同。相同才表示用户确认了官方查询的候选文件。不同就退出，退出码用现有的参数错误码。
3. 进入循环。每 2 秒调用一次 `claim`，单次请求超时 15 秒，和现有上传超时一样。连续失败就在终端提示，继续询问，不退出。
4. 取到一件就写文件，然后回写结果。用户结束进程后循环停止。

## 文件怎么改

只打开 `--theme` 指向的那一个文件。路径先做 `realpath`，必须仍在项目目录内，并且是普通文件。

用 `@tailwindcss/postcss` 里的 CSS 解析器把文件解析成语法树，按大括号配对找到三块：

- 顶层 `@theme`，不接受 `@theme inline`。
- 顶层 `:root`。
- 顶层 `.dark`。浅色改 `:root`，深色改 `.dark`。

同一块出现两次，或三块缺一块，就回写 `TARGET_AMBIGUOUS`，文件一个字节都不动。

盒子那一行必须是这一块里现成的 `--盒子名`。没有就回写 `BOX_MISSING`。有就整行替换成 `--primary: var(--color-blue-600);` 这种形式，保留原来的缩进和分号。

色档按 `--color-档名` 在 `@theme` 里查找。没有就把调色板里的值追加到这块结束前。已有就跳过，不比较、不改写原来的值。

写入用临时文件加替换。先把完整结果写到同目录的临时文件，再替换原文件。替换没有完成时删除临时文件，原文件保持旧内容，并回写 `WRITE_FAILED`。

## 测试页怎么接

`demos/design-system/roles.html` 继续在浏览器里改预览。页面上加一个写回动作：把当前盒子、当前浅色或深色、当前档名提交到上面的接口。提交前把通道编号和令牌存在这台浏览器里。

页面每 2 秒查询这一件。`written` 后，由 `F:\lint-shadcn-tailwind-test` 里已开着的 Vite 看到 `src/index.css` 变化并刷新。演示页不读取测试仓库的文件。

正式语义页以后调用同一组接口。这一单不实现阶段一工单三的接入网页。

## 验证

服务测试用现有的内存存储覆盖：提交、按顺序取走、重复取走、回写、未知档名、令牌错误。

命令行测试用临时目录里的一份小 CSS。覆盖改到新档并补上 `@theme`、改回已有档且不重写该档、缺盒子、两段 `:root`、路径跑到项目目录外。

最后在 `F:\lint-shadcn-tailwind-test` 上跑真实命令：浅色 `primary` 改到 `blue-600`，按钮变成蓝；改回 `neutral-900`，按钮恢复近黑。

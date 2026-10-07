# 尺寸阶梯写入主题：实现步骤

工单正文见同目录 `ticket-02.md`。这份说明只写怎么做。

颜色写回的 `apply` 命令、写回通道和本机服务继续用。这一单只增加一种改动：整份尺寸阶梯。扫描命令保持一次检测就退出。

## 数据放在哪

基础阶梯继续以 `demos/design-system/base.js` 为来源。命令行和服务不读这个浏览器脚本。

把间距、字号、字重、阴影抽成 `packages/design-system/scale.json`。每一项是主题变量名和值，例如 `spacing-4` 对 `16px`，`text-sm` 对 `14px`，`text-sm--line-height` 对 `1.5`。字号的行高跟在对应字号后面。

圆角不按阶梯原名进这份数据。阶梯名是 `0`、`4`、`8`、`12`、`16`，类名要的是 `sm`、`md`、`lg`、`xl`、`2xl`。在 JSON 里直接写成类名变量：

```json
{ "name": "radius-lg", "value": "12px" }
```

对应关系按工单正文：`sm→4px`、`md→8px`、`lg→12px`、`xl→16px`、`2xl→16px`。另加 `radius-3xl`、`radius-4xl`，值都是 `16px`，用来替换 `@theme inline` 里已有的两行。阶梯上的 `0` 不写入。

间距的第一项是 `spacing`，值是 `initial`。它不是阶梯上的一档，是关掉默认倍数的那一行。

`palette.json` 保持只放颜色，不把尺寸混进去。

## 协议

在 `packages/scan-contract/src/index.ts` 增加第二种改动，不改扫描结果的第二版，也不改颜色改动的形状。

颜色改动继续是 `role`、`mode`、`step`。尺寸改动是：

```ts
kind: 'scale'
```

服务拿到 `kind: 'scale'` 后，自己用 `scale.json` 填上变量名和值。页面不提交 CSS，也不提交整份 JSON。

一件改动仍然有编号、所属通道、提交时间和状态：`waiting`、`written`、`rejected`。拒绝原因继续用现有的码。尺寸改动用得到的是 `TARGET_AMBIGUOUS` 和 `WRITE_FAILED`。

## 服务

写回表增加一列，区分颜色改动和尺寸改动。旧的颜色行读出来仍是颜色改动。

| 调用方 | 方法与路径 | 作用 |
|---|---|---|
| 网页 | `POST /api/apply-sessions/:id/scale` | 提交一次整份写入，不带令牌 |
| 命令行 | `POST /api/apply-sessions/:id/claim` | 颜色和尺寸共用。取走最早一件等待中的改动 |
| 命令行 | `POST /api/apply-sessions/:id/changes/:changeId/result` | 回写方式不变 |

`claim` 的返回里带上 `kind`。颜色改动仍带 `role`、`mode`、`step`。尺寸改动带变量名和值的列表，值来自服务读到的 `scale.json`。

处理中超过一分钟没有回写，仍退回 `waiting`。回写仍要带服务签发的处理编号。

## 命令行

`apply` 的启动检查不变：Tailwind 是已安装的第四版，主题路径与检测结果一致，项目是单应用。

循环里取到颜色改动，走现有的 `editTheme`。取到尺寸改动，走新的写入。两条都不改组件文件。

## 文件怎么改

只打开 `--theme` 指向的那一个文件。路径检查和临时文件替换沿用颜色写回。

用现有的块查找找到唯一的普通 `@theme` 和唯一的 `@theme inline`。`:root` 和 `.dark` 也必须各有一块，缺一块或重复就回写 `TARGET_AMBIGUOUS`，避免在一份不完整的主题上继续写。

普通 `@theme` 里按变量名查找：

- 没有 `--spacing` 时，追加 `--spacing: initial`。已经有 `--spacing` 就不改它的值。
- `--spacing-4`、`--text-sm`、`--text-sm--line-height`、`--font-weight-medium`、`--shadow-sm` 同样：没有才追加，已有不改值。
- 不比较、不重写已经在里面的 `--color-*`。

`@theme inline` 里按变量名查找圆角那七行：`--radius-sm`、`--radius-md`、`--radius-lg`、`--radius-xl`、`--radius-2xl`、`--radius-3xl`、`--radius-4xl`。

- 行在，就把整行换成 `--radius-lg: 12px;` 这种形式，保留原来的缩进和分号。
- 行不在，就追加到这块结束前。

颜色登记、`--font-sans`、`--font-heading` 不在这七个名字里，保持原样。`:root` 里的 `--radius` 不改。

同一块里同一个变量出现两次，回写 `TARGET_AMBIGUOUS`，文件一个字节都不动。

## 阶梯页怎么接

`demos/design-system/index.html` 增加一个动作「写入主题」。点击后向 `/api/apply-sessions/:id/scale` 提交一次。通道编号的填法和语义页相同，令牌留空。

页面每 2 秒查询这一件。`written` 后，由测试仓库里已开着的 Vite 看到 `src/index.css` 变化并刷新。阶梯页不读取测试仓库的文件。

语义页的「写回当前指向」保持只提交颜色。

## 验证

服务测试覆盖：提交一次尺寸写入、和颜色改动排在同一队列里按顺序取走、回写、未知路径。

命令行测试用临时目录里的一份小 CSS，形状与测试仓库相同：普通 `@theme` 里已有颜色，`@theme inline` 里有 `--radius-lg: var(--radius)`。覆盖：

- 补上 `--spacing: initial` 和缺的尺寸档。
- 把 `--radius-lg` 从 `var(--radius)` 换成 `12px`。
- 已有的 `--spacing-4` 和 `--color-blue-600` 不被重写。
- 两段普通 `@theme` 时文件不变。

最后在 `F:\lint-shadcn-tailwind-test` 上跑真实命令。写入后看 `src/index.css`，并在 http://127.0.0.1:5173/ 上看按钮圆角和字号。浅色 `primary` 仍指向 `blue-600`。

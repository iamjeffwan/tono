# shadcn 外观与默认盒子

- 调查日期：2026-09-29
- 资料：shadcn 官方主题文档、`components.json` 的官方 schema、官方 `base-nova` 登记库，以及登记条目格式说明。
- 范围：安装时选定的外观会带来哪些盒子，后来添加组件会不会再增加盒子。

## 1. 安装时先选定一套外观

`components.json` 里的 `style` 记录所选外观。官方 schema 把 `base-nova` 列为允许值之一，同组还有 `base-vega`、`radix-nova` 等。

测试项目写的是 `base-nova`。`base` 表示组件使用 Base UI，`nova` 表示这套外观。按钮从 `@base-ui/react/button` 引入。

官方主题文档说明：这些语义名字写在项目全局样式的 `:root` 和 `.dark` 里，组件默认使用它们。改这些名字里的值，就可以改外观，不用改组件上的类名。

来源：

- 主题文档：https://ui.shadcn.com/docs/theming
- 配置 schema：https://ui.shadcn.com/schema.json

## 2. 官方公布的默认盒子名单

主题文档中的 Theme Tokens 表给出当前这批名字：

| 名字 | 文档中的用途 |
|---|---|
| `background` / `foreground` | 页面背景和默认文字 |
| `card` / `card-foreground` | 卡片等抬起的表面 |
| `popover` / `popover-foreground` | 弹出层 |
| `primary` / `primary-foreground` | 主要操作 |
| `secondary` / `secondary-foreground` | 次要操作 |
| `muted` / `muted-foreground` | 弱化的表面和文字 |
| `accent` / `accent-foreground` | 悬停、焦点等交互表面 |
| `destructive` | 危险操作 |
| `border` | 边框 |
| `input` | 输入框边框 |
| `ring` | 焦点环 |
| `chart-1` … `chart-5` | 图表配色 |
| `sidebar`、`sidebar-foreground`、`sidebar-primary`、`sidebar-primary-foreground`、`sidebar-accent`、`sidebar-accent-foreground`、`sidebar-border`、`sidebar-ring` | 侧栏 |
| `radius` | 圆角底数。文档同时说明由它算出 `radius-sm`、`radius-md` 等 |

浅色写在 `:root`，深色用同一批名字写在 `.dark`。测试项目的 `src/index.css` 与这张表一致。图表和侧栏的盒子在对应组件尚未安装时已经存在。

这张表是各外观共用的默认名字。本次没有逐套比较 `base-vega` 等其他外观的颜色数字。数字可以随外观和基础色变化，名字以这张官方表为准。

## 3. 现在的官方组件不会另加盒子

官方 `base-nova` 登记库中，`button`、`chart` 等界面组件条目没有 `cssVars`。`chart` 的单独登记文件也没有 `cssVars`。因此按今天的官方组件，添加按钮或图表不会往全局样式里写入名单以外的新盒子。

登记格式仍然允许某个条目携带 `cssVars`，分成 `theme`、`light`、`dark`。添加该条目时，命令可以把这些变量写入同一份全局样式。当前官方界面组件没有使用这个字段。第三方登记或以后的新组件可以使用。

主题文档另有一节，说明项目可以自己增加 `--warning` 这类名字，并在 `@theme inline` 里登记。那不属于这张默认名单。

来源：

- 登记库：https://ui.shadcn.com/r/styles/base-nova/registry.json
- 图表示例：https://ui.shadcn.com/r/styles/base-nova/chart.json
- 条目格式：https://ui.shadcn.com/docs/registry/registry-item-json

## 4. 对照时怎么用这张名单

拿外观对应的官方名单，到全局样式的 `:root` 和 `.dark` 里找同名盒子。名单上的名字算这套外观的默认盒子。名单以外的名字，例如项目后来加的 `--warning`，不算在内。

当前官方组件库会用到的默认盒子，就是主题文档这张表。它不保证将来每一个新组件都不再增加名字。那种情况要等新组件真的写入文件后再单独看，不放进这一次的默认名单。

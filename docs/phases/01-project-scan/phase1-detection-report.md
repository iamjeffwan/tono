# 阶段一检测技术汇报

日期：2026-10-06。范围是已经实现的项目接入检测：单应用判断、Tailwind 安装版本、主题文件、shadcn 外观与默认盒子，以及据此得出的支持性结论。命令行传输、任务服务和结果协议不在这份汇报里。

阶段一没有运行代码检查，也没有解析样式或源码。成熟库负责读取官方配置和比较版本。项目范围、失败时怎么表述、以及能不能进入设计体系配置，由我们自己的代码决定。

## 实际使用的轮子

| 检测内容 | 成熟轮子 | 锁定版本 | 它负责的部分 |
|---|---|---|---|
| 工作区目录是否匹配 | `minimatch` | `^10.2.6` | 按 npm `workspaces` 和 pnpm `packages` 的通配规则判断目录 |
| 读取 pnpm 工作区文件 | `yaml` | `^2.9.1` | 解析 `pnpm-workspace.yaml` |
| 安装版本是不是具体版本、是不是第四版 | `semver` | `^7.8.5` | `valid` 拒绝 `^4` 这种范围；`satisfies` 判断 `>=4.0.0 <5.0.0` |
| 主题文件在哪 | `@shadcn/lint` | `0.2.0` | 实验接口 `project.themeFileFor` |
| 项目根目录有没有合法的 `components.json` | `cosmiconfig` | `9.0.0` | 只在传入的项目根目录查找 `components.json` |
| 这份配置算不算 shadcn 官方配置 | `shadcn` | `4.21.0` | `shadcn/schema` 里的 `rawConfigSchema` |

版本来自 `packages/cli/package.json`。`@shadcn/lint`、`cosmiconfig`、`shadcn` 三个是固定版本，避免官方结构一变，检测结果跟着变。

## 各项怎么用

### 单应用

从指定目录向上找 `package.json`。工作区声明用 `minimatch` 对照，pnpm 的工作区文件用 `yaml` 读取。文件里只有 `onlyBuiltDependencies`、没有 `packages` 时，仍视为单应用。识别到多包仓库后停止，不再查版本和主题。结论写明目前只支持单应用。

没有为 npm、pnpm、Yarn 各写一套依赖求解器，也不把锁文件里的版本当成已经安装的版本。

### Tailwind 安装版本

读取目标项目 `node_modules/tailwindcss/package.json`，并用 `realpath` 穿过 pnpm 常见的符号链接。包名必须是 `tailwindcss`，版本必须是 `semver` 承认的具体版本。`package.json` 里的依赖范围不算已安装。

父目录或本工具自己装的 Tailwind 不算用户项目的依赖。发现 Yarn Plug'n'Play 的 `.pnp.cjs` 时记为版本无法确认，不借工具自己的安装冒充。Node 自带的 `createRequire` 只用于做这个排除。

### 主题文件

在独立子进程里调用 `@shadcn/lint@0.2.0` 的 `project.themeFileFor`。传入的是项目 `package.json` 的路径，用来定位项目，不是拿这个文件去跑规则。子进程不加载 ESLint，也不读取源码做检查。每次新进程，避免官方查询缓存把上一次的「没有主题」留下来。

返回的路径必须落在项目内部，再改成相对路径。官方查询有警告时仍可能改用自动发现的文件，这时保留警告，不假装配置里的路径存在。查到路径只说明官方查询选中了它，不说明全项目都引用了它。

这个接口官方标为实验性，1.0 前结构可能变化，所以版本锁定在 `0.2.0`。

### shadcn、外观和默认盒子

另一个子进程用 `cosmiconfig@9.0.0` 查找配置，搜索位置只有 `components.json`，策略是 `none`，因此只看项目根目录。不能设置 `stopDir`：`cosmiconfig` 9 见到它会改走全局搜索，从而读到用户目录里的配置。那份全局配置不算项目在使用 shadcn。

找到文件后，用 `shadcn@4.21.0` 的 `rawConfigSchema` 校验。没有文件是「未使用」。校验失败或进程失败是「查询失败」，不能说成没使用。

通过校验后读取 `style`。`shadcn@4.21.0` 的 `schema.json` 列出的官方外观才会附上默认盒子；运行时的 schema 只要求 `style` 是字符串，所以名单外的外观仍算已使用，但不附盒子。基础色不读取。

默认盒子不是这两个库返回的。32 个名字来自官方主题文档的 Theme Tokens 表，写在我们的共享协议里。各官方外观共用这一份，浅色和深色不拆开。已安装组件不查询，也不运行 `shadcn info`。

### 支持性结论

没有再引入库。`semver` 仍用来确认第四版。我们的代码把上面的事实收成三项：能否按第四版生成主题、主题文件是否已定位并仍须确认、语义角色按默认盒子预填还是走基础体系。缺必需事实时是 `needs_action`，三项都满足时是 `partially_supported`。

## 调查过、阶段一没有用的轮子

`docs/research/ticket-05-detection-tools.md` 对照过这些官方能力。阶段一的实现没有依赖它们：

| 工具 | 当初准备用来做什么 | 没有用的原因 |
|---|---|---|
| `fast-glob` | 按模式找候选文件 | 主题路径改由官方查询返回，不再自己扫目录 |
| `PostCSS` | 解析样式，识别 `@theme` 和 `@import` | 不自行判断哪个文件是主题 |
| TypeScript 编译器接口、`typescript-estree`、`get-tsconfig` | 追踪源码是否引用主题 | 已决定不做全项目引用审计 |
| ESLint 的 `loadESLint`、`calculateConfigForFile` | 确认检查器配置能否加载 | 缺少检查器不阻止进入主题配置，阶段一不探测它 |

## 结果边界

子进程只向主进程返回约定好的短结论。插件原始报错、配置正文和绝对路径不进入上传结果。上传前用 `zod` 按共享协议第二版校验，未知字段拒绝接收。`zod` 是结果边界，不是检测轮子。

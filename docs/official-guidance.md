# 官方资料与使用规则

本文件是项目的来源白名单和使用约定，不是官方文档的摘录。官方资料作为技术依据，第三方技能仅允许下文用户选定的两项，用于辅助工程实践。

## 已允许的第三方辅助技能

- .agents/skills/react-best-practices/SKILL.md（组件性能实践）：来自 https://github.com/vercel-labs/agent-skills ，由 Vercel（技能维护组织）维护，并非界面库官方技能。组件开发和性能检查时按需读取，只使用适合当前项目的规则。
- .agents/skills/vite/SKILL.md（构建工具实践）：来自 https://github.com/antfu/skills ，由 Anthony Fu（技能维护者）整理，并非构建工具官方技能。构建配置、插件和打包任务按需读取，版本敏感细节再核对官方文档。

两项均由用户明确选择，安装范围仅限本项目。建议若与对应版本官方行为冲突，以官方依据为准；第三方偏好与项目选择分开说明，不自动引入框架、替换查询库或升级依赖。

## 从版本开始

每次技术选型先读取 apps/web/package.json（网页依赖声明）、package-lock.json（依赖锁定文件）和实际安装版本。三者不一致时说明差异，不自行升级或重新安装。

2026-10-10 核查时：界面库实际安装 19.3.0，依赖声明为 ^19.2.8；路由库实际安装 7.18.4；查询库实际安装 5.104.1；构建工具实际安装 8.3.3，声明为 ^8.3.0。该快照只记录本次观察，后续以重新读取为准。

## 官方来源

2026-10-12：新开发已选择 `TanStack Start`（全栈框架）。网页、主题和查询分工仍先读参考平台固定提交；框架接口与运行边界用下面的维护者资料补充。用户已允许使用其官方技能，本次不安装技能或新依赖。

- 框架资料：https://tanstack.com/start/latest/docs/framework/react/ 。按任务读取从零构建、服务端函数、运行位置、单页模式、查询库整合和本地运行章节。
- 路由资料：https://tanstack.com/router/latest/docs/ 。新框架使用它自己的路由库，框架入口按框架文档，导航、动态参数和文件路由按路由文档。
- 官方技能：维护者仓库 https://github.com/TanStack/router 中的框架入口、核心和专题技能。优先使用实际安装包随版本发布的技能；当前核对路径、技能版本差异和来源见 docs/research/tanstack-start-migration.md（迁移资料）。
- 安装或同步前先解释 `TanStack Intent`（官方技能发现与加载工具）的用途、修改范围、版本和命令参数。它不是框架运行必需依赖，阅读资料不要求先安装它。

| 技术 | 资料入口 | 使用方式 |
| --- | --- | --- |
| React（界面库） | https://react.dev/learn 和 https://react.dev/reference/react；https://github.com/facebook/react 与 https://github.com/reactjs/react.dev | 学习文档和参考文档为日常依据；版本敏感行为查对应版本发布记录或源码。官方文档仓库的维护、研究技能本次不安装。 |
| React Router（路由库） | https://reactrouter.com/ 和 https://github.com/remix-run/react-router | 已下载对应 7.18.4 标签的官方技能。优先读取 node_modules/react-router/docs（安装包官方文档）；核对文档模式标记。 |
| TanStack Query（服务端状态库） | https://tanstack.com/query/v5/docs/framework/react/overview 和 https://github.com/TanStack/query | 使用第五版文档；细节核对安装版本源码和发布记录。本次未在官方查询库仓库或当前安装包发现应用开发技能，不安装第三方替代品。 |
| Vite（构建工具） | https://vite.dev/guide/、https://vite.dev/config/ 和 https://github.com/vitejs/vite | 当前为第八版，先确认网站文档适用版本；不一致时使用对应版本官方仓库文档。本次未在官方仓库发现适用技能。 |
| TypeScript（类型语言） | https://www.typescriptlang.org/docs/ 和 https://github.com/microsoft/TypeScript | 涉及类型、编译器设置时使用官方文档，核对实际编译器版本。 |

`TanStack Intent`（官方技能发现工具）的资料入口：https://tanstack.com/intent/latest/docs/getting-started/quick-start-consumers 。工具本身官方，不代表任意包提供的技能都官方。2026-10-10 尚未发现的记录不是当前结论；2026-10-12 已核对框架与路由官方技能，按本文件的新入口使用，本阶段仍不安装。

其他已使用库的问题需找到对应维护者的官方资料后再指导。社区文章、示例项目和第三方技能不作为上述技术的官方规范依据；获准的辅助技能可以提供明确标注来源的工程建议。官方仓库中的未采纳提案或讨论只作为背景，不视为稳定规则。

## 每次怎样指导

1. 读取当前任务、已有决定和相关代码，确认版本、路由模式与用户当前学习阶段。
2. 直接读取白名单中与任务有关的官方章节；有本地对应版本文档时优先使用。不要只依据搜索摘要。
3. 给一个首选方案，附官方章节与适用条件；跨库组合或目录组织没有官方定论时标明“项目推断”，解释理由。
4. 讲清当前一步的用途、数据来源、状态位置及完成标准，再让用户实现。只在用户要求时补写功能代码。
5. 新证据要求改变决定时，说明原方案是否仍然正确、新方案收益与迁移代价，完成相关验证后更新记录。

链接白名单和技能属于行为约束，不能从技术上屏蔽模型训练知识。检查建议是否附真实出处、版本是否匹配、推断是否标明，才能判断规则是否得到执行。

技能保存在 .agents/skills（本项目技能目录）。新会话以 F:\lint 为工作目录；支持项目技能发现的客户端可自动加载，其他客户端应先读取根指导文件，再按其中路径读取官方技能。官方技能保持原文，项目教学要求在根指导文件中说明。

# 阶段三：体系网页

状态：2026-10-12 已完成新方向整理。目标是项目文件保存体系、本地网页编辑、本地服务读写与检查；新框架和新流程尚未实现。

当前产品方向见同目录的 `product-flow.md`（产品流程说明）。已经接通的页面、地址和布局见 `web-architecture.md`（网页架构）。从 Supabase 固定提交确认的做法见 `supabase-lessons.md`（Supabase 做法记录）。继续工作时先读 `handoff.md`（交接说明），按用户提出的当前一小步推进。

当前教学顺序见 `implementation-plan.md`（六阶段计划），当前交接见 `handoff.md`（交接说明）。采用 `TanStack Start`（全栈框架）重新开发，使用维护者的官方技能和参考平台固定提交中的新框架源码。资料见 docs/research/tanstack-start-migration.md（迁移资料）。

文件命名、保存与恢复机制、复用细节和最终导航仍待对应阶段讨论。下面是此前阶段范围，仅作历史记录。

## 历史阶段范围

此前围绕两个主要画面：

1. 主页。创建或选择项目空间，先说明接入用途，再给出初始化命令，展示本地检测回传的结果。
2. 设计体系。选择现有主题或产品提供的主题作为起点，编辑阶梯和语义，整理迁移关系，生成待应用版本，再通过命令行写回。

技术栈：React 19、Vite、TypeScript、TanStack Query v5、shadcn/ui。不加 react-i18next。

`technical-plan.md`（技术方案）和 `implementation-plan.md`（实现方案）保留此前设计，后续需要按新流程调整。现有低保真稿和三种原型也是旧流程参考。`demos/design-system`（接口演示目录）继续只做接口测试。

依赖：阶段一的扫描接口，阶段二的写回接口。规则包、正式检查和偏移报告不在这一阶段。

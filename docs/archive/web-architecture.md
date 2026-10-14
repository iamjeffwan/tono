# 网页架构

2026-10-12：本文描述仍在仓库中的旧代码，不是新本地工具的目标架构。组织管理和旧地址不自动沿用；新页面范围在第二阶段确认。当前方向见 `product-flow.md`（产品流程），开发顺序见 `implementation-plan.md`（六阶段计划）。

这份文档记录 2026-10-10 已经搭好的网页骨架。它描述当前代码，不描述尚未实现的产品流程。产品流程见同目录的 `product-flow.md`（产品流程说明），路由取舍见 `organization-routing.md`（组织路由说明）。

## 现在能做什么

网页可以在多个组织之间切换，并进入某个组织下的项目。一个组织有多个项目，项目属于哪个组织由数据中的 `organizationId`（所属组织编号）表示。地址里只携带当前这一层需要的编号。

示例数据放在 `apps/web/src/workspace.ts`（工作区示例数据）：

| 组织 | 编号 | 项目 |
| --- | --- | --- |
| Organization 1 | `org-1` | Project 1（`proj-1`）、Project 2（`proj-2`） |
| Organization 2 | `org-2` | Project 3（`proj-3`） |

这些记录是临时数组，还没有保存到服务，也不能在页面上创建。

## 地址

路由使用 React Router 7 的声明式模式。`BrowserRouter`（浏览器路由容器）在 `apps/web/src/main.tsx`（网页入口文件）里包住应用，`Routes`（路由匹配容器）和 `Route`（单条路由声明）写在 `apps/web/src/App.tsx`（应用入口文件）。

| 地址 | 页面 | 布局 |
| --- | --- | --- |
| `/` | 重定向到 `/organizations` | 无 |
| `/organizations` | `OrganizationsPage`（组织列表页面） | `AppLayout`（应用布局） |
| `/org/:organizationId` | `ProjectsPage`（组织项目列表页面） | `AppLayout`，再套 `OrganizationLayout`（组织布局） |
| `/project/:projectId` | `HomePage`（项目主页） | `ProjectLayout`（项目布局） |
| `/project/:projectId/system` | `SystemPage`（设计体系页面） | `ProjectLayout` |
| `/project/:projectId/lint` | `LintPage`（检查入口页面） | `ProjectLayout` |
| 其他地址 | `404 Not Found` | 无 |

冒号开头的部分是动态参数，实际访问时替换成编号。例如 `/org/org-1` 和 `/project/proj-2/system`。

项目地址与组织地址并列。从项目地址不能直接看出它属于哪个组织；需要时用项目编号到 `projects` 里读取 `organizationId`。

## 布局怎么套

`AppLayout` 和 `OrganizationLayout` 目前只渲染 `Outlet`（子页面显示位置），还没有自己的顶栏或组织导航。组织列表和项目列表因此直接出现在页面上。

`ProjectLayout` 负责项目侧栏和内容区。侧栏保持不动，匹配到的项目页面显示在它的 `Outlet` 中。`/project/:projectId` 没有再加路径段时，由 `index`（默认子路由）显示项目主页。

当前组织和当前项目由地址决定。页面不另外保存一份“当前页面编号”。

## 数据怎么进页面

组织列表读取 `organizations`，每个组织交给 `OrganizationCard`（组织卡片）。卡片里的 `Link`（导航链接）指向 `/org/${organization.id}`。

项目列表先用 `useParams`（读取路由参数）取出地址中的 `organizationId`，再用 `filter`（按条件保留数组元素）留下 `project.organizationId` 相同的项目。项目名称包在 `Link` 中，指向 `/project/${proj.id}`。

项目侧栏在 `apps/web/src/components/app-sidebar.tsx`（应用侧栏文件）里读取 `projectId`（项目编号）。三条导航分别指向当前项目的主页、设计体系和检查入口，所以切换项目后侧栏地址会跟着变。这三条使用 `NavLink`（可标记当前页面的导航链接）。主页带有 `end`（只在地址完全匹配时算作当前页），避免进入子页面时主页仍显示为当前页。

## 还没有做的部分

- 地址格式匹配但组织和项目编号不存在时，`OrganizationLayout` 或 `ProjectLayout` 显示 `NotFoundPage`（找不到页面）。真实组织没有项目时仍显示空的项目列表。
- `AppLayout` 和 `OrganizationLayout` 还没有实际的共享界面。
- 项目侧栏中的团队、Projects 示例项和底部账号是模板占位，不读取 `workspace.ts`。
- 三个项目页面只有标题，没有初始化、设计编辑或检查功能。
- 网页尚未通过这些页面调用扫描或写回接口。

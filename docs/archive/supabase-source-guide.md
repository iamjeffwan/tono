# 组织和项目页面：源码阅读笔记

这份笔记只保存已经读过的源码摘录，不是完整的页面结构清单。已经确认并且会继续遵守的做法记在 `supabase-lessons.md`（Supabase 做法记录）。每次指导网页结构、页面分工、导航或数据读取时，都要重新读取固定提交中与当前步骤对应的文件；笔记里没有摘录，不代表源码中没有对应实现。

核对日期：2026 年 10 月 9 日。统一使用固定提交 `1b27761bec80372daf9646cfa309a12e9ff5454b`（本次阅读的源码版本），避免以后主分支变化导致对不上。

2026-10-12 更正：本文摘录主要来自 `Next.js Pages Router`（旧页面框架）路径；固定提交同时包含 `TanStack Start`（新全栈框架）实现。新路径见 docs/research/tanstack-start-migration.md（迁移资料），本笔记不能据此判断新实现不存在。我们继续学习对应源码的页面与布局分工。下面路径均属于外部源码仓库，不是本地待创建文件。

## 1. 地址如何找到组织项目列表

文件：apps/studio/pages/org/[slug]/index.tsx（组织项目列表页面）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/pages/org/%5Bslug%5D/index.tsx)。

`[slug]`（组织地址标识的占位段）表示这里不是固定名称。组织地址不同，仍使用同一个页面组件。

```tsx
ProjectsPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Projects">
      <PageLayout title="Projects">{page}</PageLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
```

这是原文节选。`ProjectsPage`（项目列表页面）负责内容；`DefaultLayout`（公共布局）负责外壳；`OrganizationLayout`（组织布局）负责组织页面的共同处理；`PageLayout`（页面布局）接收标题和内容。`getLayout`（给页面添加外层布局的函数）把它们组合起来。

## 2. 项目列表的数据为什么属于当前组织

文件：apps/studio/components/interfaces/Home/ProjectList/ProjectList.tsx（项目列表组件）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/components/interfaces/Home/ProjectList/ProjectList.tsx)。

原文节选：

```tsx
const organization = organization_ ?? selectedOrganization
const slug = organization?.slug ?? urlSlug
```

`organization_`（外部传入的组织）优先，其次使用 `selectedOrganization`（当前选中的组织）。组织地址标识最终作为 `useOrgProjectsInfiniteQuery`（分页查询组织项目的函数）的参数。结果再交给每个项目卡片。

这里值得学习的是：列表必须知道自己查询哪个组织。它不是先把所有项目显示出来，再只改变顶部的组织名称。

## 3. 点击卡片如何进入项目

文件：apps/studio/components/interfaces/Home/ProjectList/ProjectCard.tsx（项目卡片组件）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/components/interfaces/Home/ProjectList/ProjectCard.tsx)。

以下是原文中两处独立节选：

```tsx
const { name, ref: projectRef } = project
```

```tsx
linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
```

`name`（项目显示名称）用于显示，`projectRef`（项目引用标识）用于生成地址。`linkHref`（卡片跳转地址）传给 `CardButton`（可点击卡片组件）；没有外部覆盖地址时，就进入项目主页。

因此，切换项目的关键动作是导航到新地址，不只是修改某个组件内部的选中状态。注意：这份源码的项目地址没有包含组织地址段，不能把“数据属于组织”理解成“地址一定必须嵌套在组织下面”。

## 4. 项目主页怎样选择自己的布局

文件：apps/studio/pages/project/[ref]/index.tsx（项目主页）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/pages/project/%5Bref%5D/index.tsx)。

原文节选：

```tsx
HomePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)
```

`HomePage`（主页组件）的内容只是 `ProjectHome`（项目主页内容组件）。它与组织列表共用公共布局，再增加 `ProjectLayoutWithAuth`（带身份验证的项目布局）。业务上的上下级关系，不意味着项目主页必须塞进组织列表组件内部。

谁调用这个布局函数？文件 apps/studio/pages/_app.tsx（应用入口）中有下面两处原文节选。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/pages/_app.tsx)。

```tsx
const getLayout = Component.getLayout ?? ((page) => page)
```

```tsx
{getLayout(<Component {...pageProps} />)}
```

`Component`（当前路由对应的页面组件）提供布局函数；没有提供时，就直接显示页面。这是该项目自己的布局约定，不是我们必须照抄的路由写法。

## 5. 顶栏和侧栏在哪里统一安排

文件：apps/studio/components/layouts/DefaultLayout.tsx（公共布局组件）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/components/layouts/DefaultLayout.tsx)。

以下是两处独立原文节选：

```tsx
<LayoutHeader headerTitle={headerTitle} backToDashboardURL={backToDashboardURL} />
```

```tsx
<main id="main" tabIndex={-1} className="h-full overflow-y-auto outline-hidden">
  {children}
</main>
```

`LayoutHeader`（顶栏组件）和侧栏由公共布局安排，`children`（传入的页面内容）放在主内容区。这样更换页面内容时，不用在每个页面里重新写顶栏和侧栏。

读这个文件时先找顶栏、侧栏和页面内容位置，暂时跳过移动端、可调整面板、通知等细节。

## 6. 选择另一个组织时发生什么

文件：apps/studio/components/layouts/AppLayout/OrgCommandItem.tsx（组织选择项组件）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/components/layouts/AppLayout/OrgCommandItem.tsx)。

原文节选：

```tsx
const href = hasRouteSlug ? routePathname.replace('[slug]', org.slug) : `/org/${org.slug}`
```

`href`（目标地址）的规则是：如果当前在带组织标识的页面，替换组织标识；否则去目标组织的项目列表。`onClose`（关闭下拉菜单的函数）只负责收起菜单，真正的页面切换靠链接完成。

## 7. 选择另一个项目时发生什么

文件：apps/studio/components/layouts/AppLayout/ProjectDropdown.tsx（项目下拉切换器）。[查看固定版本原文](https://github.com/supabase/supabase/blob/1b27761bec80372daf9646cfa309a12e9ff5454b/apps/studio/components/layouts/AppLayout/ProjectDropdown.tsx)。

原文节选：

```tsx
getItemHref: (project: { ref: string }) => {
  const sanitizedRoute = sanitizeRoute(router.route, router.query)
  return sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
},
```

`getItemHref`（生成选项目标地址的函数）先通过 `sanitizeRoute`（整理可复用路由的函数）处理当前地址，再替换项目标识；不能得到可复用地址时退回项目主页。不要理解为所有项目子页面都能无条件保留。

我们第一版可以更简单：切换项目一律回到目标项目主页。这是我们的建议，不是上述源码的完整行为。

## 对我们当前开发的启发

已核实的源码事实是：组织列表和项目主页有独立地址，页面选择自己的布局，卡片和切换器都生成导航地址，组织项目查询明确携带组织标识。

我们的建议是：先确定组织、项目及归属关系，再建立组织列表和项目工作区的路由与布局。当前地址决定正在查看哪个组织和项目；不要再额外维护一份可能与地址不一致的当前项目状态。菜单是否展开、表单输入内容，仍然是组件自己的界面状态。

这份笔记不决定具体路由库，不包含权限、计费或成员系统的实现。正式开发继续按一次一小步进行，暂不复制整套控制台。

## 第一次只读这一段

先打开第 3 节的项目卡片文件，在文件里搜索 `linkHref`（卡片跳转地址）。本次只理解下面这段已经引用过的表达式：

```tsx
linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
```

问号和冒号组成条件表达式：提供了 `rewriteHref`（外部指定的替代地址）就使用它，否则用项目标识拼出项目主页地址。这里没有调用接口，也没有修改项目数据，只是把目标地址交给卡片。

读懂的标准是：能说明显示名称和项目标识为什么分开，以及两个同名项目为什么仍能跳到各自的主页。暂时不需要读卡片里的状态提示、菜单和权限。

接着才读第 4 节，追踪这个地址落到哪个页面、页面外面包了什么布局。我们自己的对应设计见同目录的 `organization-routing.md`（组织路由说明）。

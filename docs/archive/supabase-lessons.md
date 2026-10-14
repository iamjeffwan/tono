# 从 Supabase 源码确认的做法

这份文档记录已经在固定提交里核对过、并且会继续遵守的做法。它不是源码摘录。指导具体页面、地址或数据读取时，仍要读取固定提交里对应的文件；`supabase-source-guide.md`（参考源码阅读指南）里的摘录不能代替源码。

统一使用提交 `1b27761bec80372daf9646cfa309a12e9ff5454b`。下面的路径都属于这个外部仓库。Supabase 的组件底层是 Radix UI（基础交互组件），我们的 shadcn 预设是 `base-nova`，底层是 Base UI。学习他们的修改位置和原因，不把他们的组件源码原样复制过来。

## 组件默认行为不合适时，修改复制进项目的那一份

shadcn 组件复制进项目后，就由项目自己维护。某个默认行为与页面结构冲突时，Supabase 修改共享组件本身，并在改动旁写明原因。页面从 `ui`（他们的共享组件包）导入修改后的组件，不在每个使用处再补一层定位或样式。

固定提交里的 `packages/ui/src/components/shadcn/ui/sidebar.tsx` 把桌面侧栏从：

```tsx
fixed inset-y-0 h-svh
```

改成：

```tsx
'absolute top-0 h-full', // sidebar custom changes - We have also removed 'fixed', and 'h-svh'
```

`fixed`（固定定位）和 `h-svh`（等于窗口高度）会让侧栏从浏览器窗口顶部开始，并盖住窗口顶部的顶栏。`absolute top-0 h-full`（相对所在区域定位，高度等于该区域）让侧栏只填满顶栏下面的区域。顶栏放在 `apps/studio/components/layouts/DefaultLayout.tsx`（公共布局）的上半部分，侧栏放在它下面的内容区。

同一提交的共享组件里还有同类修改：

| 文件 | 源码中的说明 |
| --- | --- |
| `alert.tsx` | 保持 Studio 的紧凑间距；上游 shadcn 使用 `mb-4` |
| `dialog.tsx` | 限制标题宽度，给关闭按钮留出位置 |
| `sonner.tsx` | 调整提示层的点击和字体，使它与应用其余部分一致 |
| `badge.tsx` | 调整次要徽章的可见性，并转发引用以便显示提示 |
| `select.tsx` | 避免翻译工具处理纯文本时导致页面崩溃 |
| `table.tsx` | 调整悬停样式的优先级和标题行间距 |

我们的对应位置是 `apps/web/src/components/ui/`（已经复制进来的基础组件）。侧栏与顶栏冲突时，修改这里的 `sidebar.tsx`，不要在 `AppLayout`（应用布局）或每个页面上用变换、层级或额外高度类绕开它。

## 固定提交已有新框架路径

2026-10-12 重新核对：这个固定提交同时包含旧页面框架和 `TanStack Start`（全栈框架）的实现，不是只有旧路由。apps/studio/package.json（包配置）和 scripts/dispatch.js（启动分派程序）提供双入口；vite.config.ts（构建配置）接入新框架并启用单页模式。

新路由 routes/project/$ref/index.tsx（项目主页路由）继续导入原页面和项目布局，routes/_app.tsx（公共布局路由）组织共享布局。router.tsx（路由入口）继续整合查询库。我们学习这些分工，框架接口按官方对应版本核对；不复制其旧框架兼容层。核对路径与适用范围见 docs/research/tanstack-start-migration.md（迁移资料）。

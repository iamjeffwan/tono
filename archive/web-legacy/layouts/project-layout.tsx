import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useParams, Outlet } from 'react-router'
import { projects } from '@/workspace.ts'
import { NotFoundPage } from '@/pages/not-found.tsx'

export function ProjectLayout() {
  const { projectId } = useParams()
  const project = projects.find((item) => item.id === projectId)

  if (!project) {
    return <NotFoundPage />
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

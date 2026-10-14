import { Outlet, useParams } from 'react-router'
import { organizations, projects } from '@/workspace.ts'

export function AppLayout() {
  const { organizationId, projectId } = useParams()
  const project = projects.find((item) => item.id === projectId)
  const organization = organizations.find(
    (item) => item.id === (organizationId ?? project?.organizationId),
  )
  return (
    <>
      <div className="flex h-svh transform flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          {organization && <span>Organization: {organization.name}</span>}
          {project && <span>Project: {project.name}</span>}
        </header>
        <Outlet />
      </div>
    </>
  )
}

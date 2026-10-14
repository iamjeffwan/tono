import { useParams, Outlet } from 'react-router'
import { organizations } from '@/workspace.ts'
import { NotFoundPage } from '@/pages/not-found.tsx'

export function OrganizationLayout() {
  const { organizationId } = useParams()
  const organization = organizations.find((item) => item.id === organizationId)

  if (!organization) {
    return <NotFoundPage />
  }

  return <Outlet />
}

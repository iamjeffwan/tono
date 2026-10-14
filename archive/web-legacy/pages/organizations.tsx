import { OrganizationCard } from '@/components/organization-card'
import { organizations } from '@/workspace.ts'

export function OrganizationsPage() {
  return (
    <div>
      <h1>Organizations</h1>
      {organizations.map((org) => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  )
}

import { Link } from 'react-router'
import type { Organization } from '@/workspace.ts'

export function OrganizationCard({ organization }: { organization: Organization }) {
  return <Link to={`/org/${organization.id}`}>{organization.name}</Link>
}

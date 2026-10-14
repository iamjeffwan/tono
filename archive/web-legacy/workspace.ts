export type Organization = {
  id: string
  name: string
}

export type Project = {
  id: string
  organizationId: string
  name: string
}

export const organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Organization 1',
  },
  {
    id: 'org-2',
    name: 'Organization 2',
  },
]

export const projects: Project[] = [
  {
    id: 'proj-1',
    organizationId: 'org-1',
    name: 'Project 1',
  },
  {
    id: 'proj-2',
    organizationId: 'org-1',
    name: 'Project 2',
  },
  {
    id: 'proj-3',
    organizationId: 'org-2',
    name: 'Project 3',
  },
]

import { useParams } from 'react-router'
import { projects } from '@/workspace.ts'
import { Link } from 'react-router'

export function ProjectsPage() {
  const { organizationId } = useParams()
  const orgProjects = projects.filter((proj) => proj.organizationId === organizationId)

  return (
    <div>
      <h1>Projects</h1>
      {orgProjects.map((proj) => (
        <div key={proj.id}>
          <h2>
            <Link to={`/project/${proj.id}`}>{proj.name}</Link>
          </h2>
        </div>
      ))}
    </div>
  )
}

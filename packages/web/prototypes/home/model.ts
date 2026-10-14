import { useState } from 'react'

export type Scenario = 'waiting' | 'completed' | 'missing' | 'expired'
export type Draft = { source: 'existing' | 'provided'; color: string; radius: number; spacing: number; mapping: '' | 'primary' | 'keep' }
export type Version = { number: number; draft: Draft; outcome: 'pending' | 'applied' | 'conflict' }
type Project = { id: string; name: string; scenario: Scenario; attempt: number; draft: Draft; versions: Version[] }
const initialDraft = (): Draft => ({ source: 'existing', color: '#2563eb', radius: 8, spacing: 16, mapping: '' })
export function useDemo() {
  const [projects, setProjects] = useState<Project[]>([])
  const [active, setActive] = useState('')
  const [page, setPage] = useState<'home' | 'design'>('home')
  const project = projects.find(item => item.id === active)
  function update(changes: Partial<Project>) { setProjects(items => items.map(item => item.id === active ? { ...item, ...changes } : item)) }
  function create(name: string) {
    if (!name.trim()) return
    const id = `demo-${crypto.randomUUID().slice(0, 8)}`
    setProjects(items => [...items, { id, name: name.trim(), scenario: 'waiting', attempt: 1, draft: initialDraft(), versions: [] }])
    setActive(id); setPage('home')
  }
  function switchProject(id: string) { setActive(id); setPage('home') }
  function choose(scenario: Scenario) {
    update({ scenario, draft: { ...initialDraft(), source: scenario === 'missing' ? 'provided' : 'existing' }, versions: [] })
    setPage('home')
  }
  function edit(changes: Partial<Draft>) { if (project) update({ draft: { ...project.draft, ...changes } }) }
  function source(source: Draft['source']) { edit({ ...initialDraft(), source, color: source === 'provided' ? '#1d4ed8' : '#2563eb', mapping: '' }) }
  function generate() {
    if (!project) return
    const version: Version = { number: project.versions.length + 1, draft: { ...project.draft }, outcome: 'pending' }
    update({ versions: [...project.versions, version] })
  }
  function outcome(value: Version['outcome']) {
    if (project) update({ versions: project.versions.map((version, i) => i === project.versions.length - 1 ? { ...version, outcome: value } : version) })
  }
  return { projects, project, page, setPage, create, switchProject, choose, edit, source, generate, outcome,
    renew: () => project && update({ scenario: 'waiting', attempt: project.attempt + 1 }),
    reset: () => { setProjects([]); setActive(''); setPage('home') } }
}
export type Demo = ReturnType<typeof useDemo>

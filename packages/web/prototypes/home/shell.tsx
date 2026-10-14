import { useState } from 'react'
import { House, ListChecks, PanelLeft, SwatchBook, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Guided } from './guided'
import { Workbench } from './workbench'
import { Checklist } from './checklist'
import { Design } from './design'
import { ScenarioControls, useDemo } from './shared'

export function Stage({ index }: { index: number }) {
  const demo = useDemo()
  const [collapsed, setCollapsed] = useState(false)
  const View = [Guided, Workbench, Checklist][index]
  const ready = !!demo.project && ['completed', 'missing'].includes(demo.project.scenario)
  const switcher = <label className="project-switcher"><span>项目空间</span><select aria-label="切换项目空间" value={demo.project?.id ?? ''} onChange={e => demo.switchProject(e.target.value)}><option value="">＋ 创建项目空间</option>{demo.projects.map(project => <option key={project.id} value={project.id}>{project.name} · {project.id.slice(-4)}</option>)}</select></label>
  return <div className={`prototype-shell ${collapsed ? 'sidebar-collapsed' : ''}`}><a className="skip-link" href="#main-content">跳到主页内容</a><aside className="context-sidebar" aria-label="项目导航"><div className="brand"><span className="brand-icon"><Layers size={18} aria-hidden="true" /></span><span>设计体系<span className="brand-subtitle">项目工作空间</span></span></div>{switcher}<div className="context-navigation"><button className={demo.page === 'home' ? 'nav-selected' : ''} onClick={() => demo.setPage('home')} aria-label="主页"><House size={17} aria-hidden="true" /><span>主页</span></button><button className={demo.page === 'design' ? 'nav-selected' : ''} disabled={!ready} onClick={() => demo.setPage('design')} aria-label="设计体系"><SwatchBook size={17} aria-hidden="true" /><span>设计体系</span></button><div><ListChecks size={17} aria-hidden="true" /><span>Lint（检查）· 待开发</span></div></div><div className="sidebar-bottom"><span className="dot" />初始化后进入设计体系</div></aside><div className="prototype-body"><header className="context-header"><Button variant="ghost" size="icon" aria-label={collapsed ? '展开侧栏' : '收起侧栏'} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}><PanelLeft aria-hidden="true" /></Button><span className="header-divider" /><span>{demo.page === 'home' ? '主页' : '设计体系'}</span><span className="header-trailing">设计探索 / {index + 1}</span></header><div className="mobile-projects">{switcher}<Button variant="outline" onClick={() => demo.setPage('home')}>主页</Button><Button variant="outline" disabled={!ready} onClick={() => demo.setPage('design')}>设计体系</Button></div><ScenarioControls demo={demo} /><main id="main-content">{demo.page === 'home' ? <View demo={demo} /> : <Design demo={demo} />}</main></div></div>
}

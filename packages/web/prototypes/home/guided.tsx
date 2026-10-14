import { Check } from 'lucide-react'
import { ApplyContent, ProjectForm, ResultContent, ScanContent, Status } from './shared'
import type { Demo } from './shared'
export function Guided({ demo }: { demo: Demo }) {
  const step = !demo.project ? 0 : ['completed', 'missing'].includes(demo.project.scenario) ? 2 : 1
  return <div className="guided"><div className="page-intro"><span className="eyebrow">从项目开始</span><h1>{demo.project ? demo.project.name : '给设计一个空间。'}</h1><p>连接本地项目，在熟悉的主题上继续，或从一套完整的体系开始。</p></div><ol className="step-track">{['创建空间', '本地接入', '开始设计'].map((title, i) => <li key={title} className={step === i ? 'current' : ''} aria-current={step === i ? 'step' : undefined}><span>{step > i ? <Check size={14} aria-hidden="true" /> : `0${i + 1}`}</span>{title}</li>)}</ol><section className="guided-card"><div className="section-top"><h2>{step === 0 ? '创建你的第一个项目空间' : step === 1 ? '连接本地项目' : '项目已经准备好'}</h2><Status demo={demo} /></div>{step === 0 ? <ProjectForm demo={demo} /> : step === 1 ? <><ScanContent demo={demo} /><ResultContent demo={demo} /></> : <><ResultContent demo={demo} /><div className="section-divider" /><ApplyContent demo={demo} /></>}</section><p className="bottom-note">先了解，再连接。每一次主题修改，都由你确认。</p></div>
}

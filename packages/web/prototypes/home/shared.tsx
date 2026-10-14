import { useId, useState } from 'react'
import { ArrowUpRight, Check, Copy, FileCode2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Demo, Scenario } from './model'
export type { Demo } from './model'
export { useDemo } from './model'

export function Status({ demo }: { demo: Demo }) {
  const labels = { waiting: '等待本地接入', completed: '已关联 · 检测完成', missing: '已关联 · 尚无主题', expired: '初始化命令已过期' }
  return <span className="status"><span className="dot" />{demo.project ? labels[demo.project.scenario] : '尚未创建空间'}</span>
}
export function ScenarioControls({ demo }: { demo: Demo }) {
  const id = useId()
  return <div className="scenario-bar"><span><span className="prototype-tag">交互原型</span>模拟数据 · 命令不可执行 · 刷新重置</span><label htmlFor={id}>模拟检测结果<select id={id} disabled={!demo.project} value={demo.project?.scenario ?? 'waiting'} onChange={e => demo.choose(e.target.value as Scenario)}><option value="waiting">等待本地接入</option><option value="completed">找到现有主题</option><option value="missing">未找到主题</option><option value="expired">命令过期</option></select></label><Button variant="ghost" size="sm" onClick={demo.reset}>重置演示</Button></div>
}
export function ProjectForm({ demo }: { demo: Demo }) {
  const id = useId()
  const [name, setName] = useState('')
  return <form className="project-form" onSubmit={e => { e.preventDefault(); demo.create(name) }}><label htmlFor={id}>项目空间名称</label><p className="muted" id={`${id}-hint`}>用你熟悉的名字组织设计，例如「品牌官网」。不需要填写本地目录。</p><div className="input-action"><Input id={id} value={name} onChange={e => setName(e.target.value)} required maxLength={60} pattern=".*\S.*" placeholder="例如 品牌官网" aria-describedby={`${id}-hint`} /><Button type="submit">创建项目空间<ArrowUpRight aria-hidden="true" /></Button></div></form>
}
export function TrustContent() {
  return <div className="trust-content"><h3>先了解接入会做什么</h3><p>识别项目的样式环境，把现有主题带到这里，作为设计调整的起点。</p><ul><li><strong>在你的电脑上检测</strong><span>读取样式配置、主题变量和值，核对可识别的引用。</span></li><li><strong>只回传检测信息</strong><span>版本、主题路径、变量与引用摘要发送到关联服务；不上传整个项目源码。本轮模拟本机服务。</span></li><li><strong>现在不替换主题</strong><span>初始化关联项目并保存结果快照；应用设计时还需要另一条命令和你的确认。</span></li></ul><details><summary>命令如何工作</summary><p><code>npx</code>（下载或复用缓存并执行工具）运行我们的 <code>CLI</code>（命令行工具）。空间编号负责关联结果，临时凭据用于授权；项目名称只用于显示。</p><p>原型中的命令参数是流程示意，尚未实现。工具源码与发布包链接将在真实接入时提供，本轮不伪造可用链接。</p></details></div>
}
export function Command({ command, title }: { command: string; title: string }) {
  const [copied, setCopied] = useState('')
  const [failed, setFailed] = useState(false)
  async function copy() { try { await navigator.clipboard.writeText(command); setCopied(command); setFailed(false) } catch { setFailed(true) } }
  return <div className="command-box"><div className="command-heading"><span><Terminal size={15} aria-hidden="true" />{title}</span><Button variant="ghost" size="sm" onClick={copy}>{copied === command ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied === command ? '已复制' : '复制命令'}</Button></div><code>{command}</code><p className="command-note" role="status">{failed ? '复制失败，请手动选中命令复制。' : '仅用于体验流程的示例命令，请勿执行。'}</p></div>
}
export function ScanContent({ demo }: { demo: Demo }) {
  const project = demo.project
  if (!project) return <ProjectForm demo={demo} />
  if (project.scenario === 'expired') return <div className="notice"><strong>初始化命令已过期</strong><p>项目空间还在，重新生成命令即可。</p><Button onClick={demo.renew}>重新生成初始化命令</Button></div>
  return <><TrustContent /><div className="section-divider" /><h3 className="minor-title">在本地项目目录执行初始化</h3><p className="muted">先在终端进入要关联的项目目录，再运行命令。空间：{project.name}</p><Command title="初始化命令" command={`npx @design-guardrails/cli init --project ${project.id} --token DEMO_ONLY_${project.attempt} --server http://127.0.0.1:3001`} />{project.scenario === 'waiting' && <p className="inline-note" role="status">等待本地命令完成，结果会同时显示在终端和这里。</p>}</>
}
export function ResultContent({ demo }: { demo: Demo }) {
  const project = demo.project
  if (!project || project.scenario === 'waiting' || project.scenario === 'expired') return <div className="empty-content result-empty"><FileCode2 size={30} strokeWidth={1.2} aria-hidden="true" /><div><strong>{project ? '等待本地项目接入' : '先给项目一个空间'}</strong><p>关联完成后，这里会显示环境与主题信息。</p></div>{project?.scenario === 'waiting' && <Button variant="outline" onClick={() => demo.choose('completed')}>模拟初始化完成</Button>}</div>
  return <><div className="result-heading"><span className="small-label">本地检测回传</span><span className="verified"><Check size={14} aria-hidden="true" />模拟结果</span></div><dl className="facts"><div><dt>项目空间</dt><dd>{project.name}</dd></div><div><dt>关联目录</dt><dd><code>~/projects/website</code>（示例目录）</dd></div><div><dt>Tailwind（样式工具）</dt><dd>4.3.3 · 已识别</dd></div><div><dt>主题文件</dt><dd>{project.scenario === 'missing' ? '未发现，可在应用时创建' : <code>src/styles/theme.css</code>}</dd></div><div><dt>shadcn/ui（组件库）</dt><dd>已使用 · 可适配语义</dd></div><div><dt>主题读取</dt><dd>{project.scenario === 'missing' ? '无现有变量' : '6 项定义 · 5 项确认被使用 · 1 项待核对'}</dd></div></dl><details className="terminal-result"><summary>查看终端结果示意</summary><pre>{`✓ 项目空间已关联：${project.name}\n✓ 样式环境已识别\n${project.scenario === 'missing' ? '· 未发现主题，可从产品主题开始' : '✓ 主题定义已读取，引用仍需核对'}\n✓ 检测结果已回传网页`}</pre></details><p className="fine-print">原型数据不代表已读取你的文件，也不代表已经完成全项目引用检查。</p></>
}
export function ApplyContent({ demo }: { demo: Demo }) {
  const ready = demo.project && ['completed', 'missing'].includes(demo.project.scenario)
  return <div className="apply-content"><p className="muted">{ready ? '接下来选择现有主题或产品主题，调整阶梯与语义。编辑只影响预览。' : '完成初始化后，就可以选择设计起点。'}</p><Button disabled={!ready} onClick={() => demo.setPage('design')}>进入设计体系<ArrowUpRight aria-hidden="true" /></Button></div>
}

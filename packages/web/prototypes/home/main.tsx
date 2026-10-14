import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Stage } from './shell'
import '@/index.css'
import './prototype.css'
import './picker.css'

const variants = [{ name: '逐步引导' }, { name: '双栏工作台' }, { name: '紧凑清单' }]
function initialVariant() {
  const value = Number(new URLSearchParams(location.search).get('v'))
  return Number.isInteger(value) && value >= 1 && value <= variants.length ? value - 1 : 0
}
function Prototype() {
  const [index, setIndex] = useState(initialVariant)
  const [replay, setReplay] = useState(0)
  const picker = useRef<HTMLElement>(null)
  const highlight = useRef<HTMLSpanElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  function select(value: number) { setIndex(value); setReplay(count => count + 1) }
  useLayoutEffect(() => {
    const update = () => {
      const button = buttons.current[index]
      if (button && highlight.current) {
        highlight.current.style.width = `${button.offsetWidth}px`
        highlight.current.style.transform = `translateX(${button.offsetLeft}px)`
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [index])
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => picker.current?.setAttribute('data-ready', '')) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [])
  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('v', String(index + 1))
    history.replaceState(null, '', url)
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (target instanceof HTMLElement && (target.closest('input, textarea, select, [contenteditable="true"]') || target.isContentEditable)) return
      let next: number | undefined
      if (/^[1-3]$/.test(event.key)) next = Number(event.key) - 1
      else if (event.key === 'ArrowRight') next = (index + 1) % variants.length
      else if (event.key === 'ArrowLeft') next = (index + variants.length - 1) % variants.length
      else if (event.key.toLowerCase() === 'r') { event.preventDefault(); setReplay(value => value + 1); return }
      if (next !== undefined) { event.preventDefault(); select(next) }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [index])
  return <><Stage key={`${index}-${replay}`} index={index} />
    <nav className="proto-picker" aria-label="Prototype variants" ref={picker}><span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />{variants.map((variant, i) => <button key={variant.name} className="proto-picker-item" aria-label={variant.name} data-active={i === index ? '' : undefined} aria-current={i === index ? 'true' : undefined} ref={element => { buttons.current[i] = element }} onClick={() => select(i)}>{variant.name.split('').join('\u2060')}</button>)}</nav>
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><Prototype /></StrictMode>)

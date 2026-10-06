import { describe, expect, it } from 'vitest'
import { officialShadcnBoxNames, type ScanResult } from '@design-system-guardrails/scan-contract'
import { ProjectIssue } from './project.js'
import { concludeSupport, supportForProjectIssue } from './support.js'

const boxes = [...officialShadcnBoxNames]
const installed = { status: 'installed', version: '4.3.3' } as const
const located = { status: 'located', path: 'src/index.css', source: 'official_query' } as const
const used = { status: 'used', appearance: 'base-nova', boxes } as const
const confirm = '请确认 src/index.css 是要接入的主题文件。此路径未经过全项目引用审计。'
const preset = '外观 base-nova 将按默认盒子预填语义角色。'
const baseSystem = '未使用 shadcn，语义角色按基础体系配置。'

function conclude(
  tailwind: ScanResult['tailwind'],
  theme: ScanResult['theme'],
  shadcn: ScanResult['shadcn'],
) {
  return concludeSupport({ tailwind, theme, shadcn })
}

describe('support conclusion', () => {
  it('lets a fourth-major project with an official appearance continue after theme confirmation', () => {
    expect(conclude(installed, located, used)).toEqual({
      status: 'partially_supported', blockingIssues: [], warnings: [confirm, preset],
    })
  })

  it('lets an unused shadcn project continue on the base system', () => {
    expect(conclude(installed, located, { status: 'not_used' })).toEqual({
      status: 'partially_supported', blockingIssues: [], warnings: [confirm, baseSystem],
    })
  })

  it('asks for a theme file when none was located', () => {
    expect(conclude(installed, { status: 'not_found', path: null, source: null }, { status: 'not_used' })).toEqual({
      status: 'needs_action',
      blockingIssues: [],
      warnings: ['尚未定位主题文件，请确认要接入的文件。', baseSystem],
    })
  })

  it('keeps a failed theme query separate from a missing theme', () => {
    expect(conclude(installed, { status: 'query_failed', path: null, source: null }, used).blockingIssues)
      .toContain('主题查询失败，还不能写入主题文件。')
  })

  it('refuses to choose a preset when shadcn cannot be confirmed or the appearance is unlisted', () => {
    expect(conclude(installed, located, { status: 'query_failed' })).toEqual({
      status: 'needs_action',
      blockingIssues: ['未能确认是否使用 shadcn，不能选择语义预设。'],
      warnings: [confirm],
    })
    expect(conclude(installed, located, { status: 'used', appearance: 'brand-custom', boxes: null }).blockingIssues)
      .toEqual(['外观 brand-custom 不在官方名单内，不能按默认盒子预填，也不能当作未使用。'])
  })

  it('blocks generation until the installed version is a fourth major release', () => {
    expect(conclude({ status: 'not_installed', version: null }, located, used).blockingIssues)
      .toEqual(['项目尚未安装样式框架。'])
    expect(conclude({ status: 'unknown', version: null }, located, used).blockingIssues)
      .toEqual(['无法确认项目实际安装的样式框架版本。'])
    expect(conclude({ status: 'installed', version: '3.4.17' }, located, used).blockingIssues)
      .toEqual(['当前安装版本不属于受支持的第四版稳定版本。'])
  })

  it('states that only a single application is supported', () => {
    expect(supportForProjectIssue(new ProjectIssue('MONOREPO_UNSUPPORTED', '检测到多包仓库，当前阶段暂不支持，已停止后续查询。')))
      .toEqual({
        status: 'unsupported',
        blockingIssues: ['目前只支持单应用。检测到多包仓库，已停止后续查询。'],
        warnings: [],
      })
    expect(supportForProjectIssue(new ProjectIssue('PROJECT_NOT_FOUND', '未找到项目包清单，请指定项目目录。')).status)
      .toBe('needs_action')
  })
})

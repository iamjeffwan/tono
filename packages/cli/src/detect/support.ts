import { satisfies } from 'semver'
import type { ScanResult } from '@design-system-guardrails/scan-contract'
import { ProjectIssue } from './project.js'

type Support = ScanResult['support']

export function supportForProjectIssue(issue: ProjectIssue): Support {
  if (issue.code === 'MONOREPO_UNSUPPORTED') {
    return {
      status: 'unsupported',
      blockingIssues: ['目前只支持单应用。检测到多包仓库，已停止后续查询。'],
      warnings: [],
    }
  }
  return { status: 'needs_action', blockingIssues: [issue.message], warnings: [] }
}

export function concludeSupport(input: Pick<ScanResult, 'tailwind' | 'theme' | 'shadcn'>): Support {
  const blockingIssues: string[] = []
  const warnings: string[] = []
  const tailwindReady = input.tailwind.status === 'installed' && satisfies(input.tailwind.version, '>=4.0.0 <5.0.0')
  if (!tailwindReady) {
    blockingIssues.push(input.tailwind.status === 'not_installed'
      ? '项目尚未安装样式框架。'
      : input.tailwind.status === 'installed'
        ? '当前安装版本不属于受支持的第四版稳定版本。'
        : '无法确认项目实际安装的样式框架版本。')
  }
  if (input.theme.status === 'located') {
    warnings.push(`请确认 ${input.theme.path} 是要接入的主题文件。此路径未经过全项目引用审计。`)
  } else if (input.theme.status === 'not_found') {
    warnings.push('尚未定位主题文件，请确认要接入的文件。')
  } else {
    blockingIssues.push('主题查询失败，还不能写入主题文件。')
  }
  let presetReady = false
  if (input.shadcn.status === 'used' && input.shadcn.boxes !== null) {
    presetReady = true
    warnings.push(`外观 ${input.shadcn.appearance} 将按默认盒子预填语义角色。`)
  } else if (input.shadcn.status === 'not_used') warnings.push('未使用 shadcn，语义角色按基础体系配置。')
  else if (input.shadcn.status === 'used') {
    blockingIssues.push(`外观 ${input.shadcn.appearance} 不在官方名单内，不能按默认盒子预填，也不能当作未使用。`)
  } else blockingIssues.push('未能确认是否使用 shadcn，不能选择语义预设。')
  return {
    status: tailwindReady && input.theme.status === 'located' && (presetReady || input.shadcn.status === 'not_used')
      ? 'partially_supported' : 'needs_action',
    blockingIssues, warnings,
  }
}

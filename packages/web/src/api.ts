import type {
  CreateApplySessionRequest,
  CreateApplySessionResponse,
  CreateScanSessionRequest,
  CreateScanSessionResponse,
  GetScanSessionResponse,
  RoleChangeRequest,
  RoleChangeView,
  SubmitRoleChangeResponse,
} from '@design-system/scan-contract'

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

// 创建扫描
export function createScanSession(
  body: CreateScanSessionRequest,
): Promise<CreateScanSessionResponse> {
  return fetchJson('/api/scan-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// 读取扫描
export function getScanSession(sessionId: string): Promise<GetScanSessionResponse> {
  return fetchJson(`/api/scan-sessions/${sessionId}`)
}

// 创建写回
export function createApplySession(
  body: CreateApplySessionRequest,
): Promise<CreateApplySessionResponse> {
  return fetchJson('/api/apply-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// 提交scale
export function submitScale(applyId: string): Promise<SubmitRoleChangeResponse> {
  return fetchJson(`/api/apply-sessions/${applyId}/scale`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
}

// 提交role change
export function submitRoleChange(
  applyId: string,
  body: RoleChangeRequest,
): Promise<SubmitRoleChangeResponse> {
  return fetchJson(`/api/apply-sessions/${applyId}/changes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// 读取改动
export function getRoleChange(applyId: string, changeId: string): Promise<RoleChangeView> {
  return fetchJson(`/api/apply-sessions/${applyId}/changes/${changeId}`)
}

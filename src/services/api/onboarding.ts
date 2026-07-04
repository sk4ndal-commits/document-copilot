import { apiFetch } from './client'

export interface SlotState {
  slot_id: string
  doc_type: string
  label: string
  required: boolean
  status: 'pending' | 'uploading' | 'validating' | 'ready' | 'error'
  filename?: string
  result?: {
    is_valid: boolean
    errors: string[]
    extracted_info: Record<string, unknown>
  }
}

export interface SessionSummary {
  id: string
  client_name: string
  created_at: string
  slot_summary: { total: number; ready: number; errors: number }
}

export interface SessionDetail {
  id: string
  client_name: string
  created_at: string
  slots: SlotState[]
}

export async function createSession(clientName: string): Promise<{ id: string }> {
  const res = await apiFetch('/api/onboarding/sessions', {
    method: 'POST',
    body: JSON.stringify({ client_name: clientName }),
    headers: { 'Content-Type': 'application/json' },
  })
  return res.json()
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await apiFetch('/api/onboarding/sessions')
  if (!res.ok) return []
  return res.json()
}

export async function fetchSession(sessionId: string): Promise<SessionDetail> {
  const res = await apiFetch(`/api/onboarding/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Session not found')
  return res.json()
}

export async function updateSlot(
  sessionId: string,
  slotId: string,
  patch: Partial<SlotState>,
): Promise<void> {
  await apiFetch(`/api/onboarding/sessions/${sessionId}/slots/${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    headers: { 'Content-Type': 'application/json' },
  })
}

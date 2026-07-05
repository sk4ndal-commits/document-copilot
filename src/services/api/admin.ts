import { apiFetch } from './client'

export interface AdminStatus {
  data_sources: { name: string; connected: boolean }[]
  last_sync: string
}

export interface AdminMetrics {
  validation_activity: number
  ai_usage_tokens: number
  storage_bytes: number
  avg_satisfaction?: number
  no_result_count: number
}

export interface User {
  id: string
  username: string
  roles: string[]
}

export async function fetchAdminStatus(): Promise<AdminStatus> {
  const res = await apiFetch('/api/admin/status')
  if (!res.ok) throw new Error('Failed to fetch admin status')
  return res.json()
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await apiFetch('/api/admin/metrics')
  if (!res.ok) throw new Error('Failed to fetch admin metrics')
  return res.json()
}

export async function fetchAdminUsers(): Promise<User[]> {
  const res = await apiFetch('/api/admin/users')
  if (!res.ok) throw new Error('Failed to fetch admin users')
  return res.json()
}

export async function fetchComplianceIssues(): Promise<string[]> {
  const res = await apiFetch('/api/admin/compliance-issues')
  if (!res.ok) return []
  return res.json()
}

export interface ValidationHistoryEntry {
  id: string
  session_id: string | null
  doc_type: string | null
  filename: string | null
  is_valid: boolean
  missing_fields: string[] | null
  extracted_info: Record<string, unknown> | null
  created_at: string
}

export async function fetchValidationHistory(): Promise<ValidationHistoryEntry[]> {
  const res = await apiFetch('/api/admin/validation-history')
  if (!res.ok) return []
  return res.json()
}

export async function createCategory(name: string, color?: string): Promise<any> {
  const res = await apiFetch('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to create category')
  return res.json()
}

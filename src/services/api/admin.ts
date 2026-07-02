import { apiFetch } from './client'

export interface AdminStatus {
  data_sources: { name: string; connected: boolean }[]
  last_sync: string
}

export interface AdminMetrics {
  search_activity: number
  ai_usage_tokens: number
  storage_bytes: number
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

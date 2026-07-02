import { useState, useEffect } from 'react'
import { fetchAdminStatus, fetchAdminMetrics, fetchAdminUsers, AdminStatus, AdminMetrics, User } from '../services/api'

export default function AdminPage() {
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAdminStatus(), fetchAdminMetrics(), fetchAdminUsers()])
      .then(([s, m, u]) => {
        setStatus(s)
        setMetrics(m)
        setUsers(u)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) return <div className="max-w-[600px] mx-auto">Loading admin data...</div>

  return (
    <div className="max-w-[600px] mx-auto">
      <h2 className="text-xl font-bold mb-6">Admin Portal</h2>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Dashboard Metrics</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 border border-border rounded-md p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Search Activity</p>
            <p className="text-lg font-semibold text-gray-900">{metrics?.search_activity}</p>
          </div>
          <div className="bg-gray-50 border border-border rounded-md p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">AI Usage (Tokens)</p>
            <p className="text-lg font-semibold text-gray-900">{metrics?.ai_usage_tokens}</p>
          </div>
          <div className="bg-gray-50 border border-border rounded-md p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Document Storage</p>
            <p className="text-lg font-semibold text-gray-900">{formatBytes(metrics?.storage_bytes || 0)}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Data Sources</h3>
        {status?.data_sources.map(ds => (
          <div key={ds.name} className="flex items-center gap-2 mb-2 text-sm text-gray-700">
            <span className="text-green-600 font-bold">{ds.connected ? '✓' : '✗'}</span>
            <span>{ds.name} {ds.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        ))}
        <p className="text-[10px] text-gray-500 mt-2">Last Sync: {status?.last_sync}</p>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Users &amp; Permissions</h3>
        {users.map(user => (
          <div key={user.id} className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-700 flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              {user.username} ({user.roles.join(', ')})
            </span>
            <button className="bg-transparent border border-border rounded-sm px-4 py-0.5 text-[10px] text-gray-700 transition-all duration-150 hover:bg-gray-100 hover:border-gray-400">
              Manage Roles
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}

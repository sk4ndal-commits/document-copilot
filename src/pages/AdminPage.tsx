import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchAdminStatus, fetchAdminMetrics, fetchAdminUsers, fetchComplianceIssues, createCategory, AdminStatus, AdminMetrics, User } from '../services/api'
import { fetchCategories } from '../services/api/documents'

export default function AdminPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [gaps, setGaps] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [newCatName, setNewCatName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAdminStatus(), 
      fetchAdminMetrics(), 
      fetchAdminUsers(), 
      fetchComplianceIssues(),
      fetchCategories()
    ])
      .then(([s, m, u, g, c]) => {
        setStatus(s)
        setMetrics(m)
        setUsers(u)
        setGaps(g)
        setCategories(c)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreateCategory = async () => {
    if (!newCatName) return
    try {
      const cat = await createCategory(newCatName)
      setCategories(prev => [...prev, cat])
      setNewCatName('')
    } catch (err) {
      alert('Failed to create category')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) return <div className="max-w-[800px] mx-auto p-8">Loading admin data...</div>

  return (
    <div className="max-w-[800px] mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['overview', 'categories', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white shadow-sm text-brand' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <section className="mb-8">
            <h3 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider">Dashboard Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Validation Activity</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.validation_activity}</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-brand">
                  {metrics?.avg_satisfaction ? `${(metrics.avg_satisfaction * 100).toFixed(0)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">No Result Rate</p>
                <p className="text-2xl font-bold text-red-500">
                  {metrics?.validation_activity ? ((metrics.no_result_count / metrics.validation_activity) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{formatBytes(metrics?.storage_bytes || 0)}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider">Compliance Issues</h3>
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm min-h-[200px]">
                {gaps.length > 0 ? (
                  <ul className="space-y-3">
                    {gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-gray-700 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start">
                        <span className="mr-2">❓</span> {gap}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-4xl mb-2">🎉</span>
                    <p className="text-sm">No knowledge gaps detected!</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider">Document Registry</h3>
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                {status?.data_sources.map(ds => (
                  <div key={ds.name} className="flex justify-between items-center py-3 border-b last:border-0 border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${ds.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium text-gray-700">{ds.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${ds.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {ds.connected ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 mt-4 text-center">Last Sync: {status?.last_sync}</p>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <section className="bg-white border border-border rounded-xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-bold mb-4">Manage Categories</h3>
            <div className="flex gap-3 mb-6">
              <input 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="New category name..."
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
              <button 
                onClick={handleCreateCategory}
                disabled={!newCatName.trim()}
                className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Category
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 border border-border rounded-xl bg-gray-50 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white border border-border flex items-center justify-center text-lg">
                      {cat.icon || '📁'}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Users & Permissions</h3>
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.roles.join(', ')}</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-gray-700 hover:bg-white hover:border-brand hover:text-brand transition-all">
                    Edit Roles
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

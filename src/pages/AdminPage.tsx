import styles from './AdminPage.module.css'
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

  if (loading) return <div className={styles.container}>Loading admin data...</div>

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Admin Portal</h2>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Dashboard Metrics</h3>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Search Activity</p>
            <p className={styles.metricValue}>{metrics?.search_activity}</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>AI Usage (Estimated Tokens)</p>
            <p className={styles.metricValue}>{metrics?.ai_usage_tokens}</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Document Storage</p>
            <p className={styles.metricValue}>{formatBytes(metrics?.storage_bytes || 0)}</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Data Sources</h3>
        {status?.data_sources.map(ds => (
          <div key={ds.name} className={styles.dataSourceRow}>
            <span className={styles.checkmark}>{ds.connected ? '✓' : '✗'}</span>
            <span>{ds.name} {ds.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        ))}
        <p className={styles.syncNote}>Last Sync: {status?.last_sync}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Users &amp; Permissions</h3>
        {users.map(user => (
          <div key={user.id} className={styles.userRow}>
            <span className={styles.userLabel}>
              <span className={styles.checkmark}>✓</span>
              {user.username} ({user.roles.join(', ')})
            </span>
            <button className={styles.manageBtn}>Manage Roles</button>
          </div>
        ))}
      </section>
    </div>
  )
}

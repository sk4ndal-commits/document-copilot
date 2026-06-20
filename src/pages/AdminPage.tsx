import styles from './AdminPage.module.css'

interface DataSource {
  name: string
  connected: boolean
}

const dataSources: DataSource[] = [
  { name: 'SharePoint', connected: true },
  { name: 'Network Drive', connected: true },
  { name: 'Confluence', connected: true },
]

const userGroups = ['Engineering', 'Sales', 'HR', 'Management']

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Admin Area</h2>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Data Sources</h3>
        {dataSources.map(ds => (
          <div key={ds.name} className={styles.dataSourceRow}>
            <span className={styles.checkmark}>✓</span>
            <span>{ds.name} Connected</span>
          </div>
        ))}
        <p className={styles.syncNote}>Last Sync: 2 minutes ago</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Users &amp; Permissions</h3>
        {userGroups.map(g => (
          <div key={g} className={styles.userRow}>
            <span className={styles.userLabel}>
              <span className={styles.checkmark}>✓</span>
              {g}
            </span>
            <button className={styles.manageBtn}>Manage</button>
          </div>
        ))}
      </section>
    </div>
  )
}

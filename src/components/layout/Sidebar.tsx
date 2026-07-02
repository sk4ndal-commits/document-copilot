import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'
import { useAuth } from '../../services/api/auth'

const knowledgeBases = [
  'Quality Management',
  'Service Manuals',
  'HR Policies',
  'Sales Documentation',
  'Contracts',
  'ISO Documents',
]

export default function Sidebar() {
  const { logout, user } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <p className={styles.sectionLabel}>Knowledge Bases</p>
      <ul className={styles.navList}>
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            All
          </NavLink>
        </li>
        {knowledgeBases.map(kb => (
          <li key={kb}>
            <button className={styles.navItem}>• {kb}</button>
          </li>
        ))}
      </ul>
      <hr className={styles.divider} />
      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
        }
      >
        Document Center
      </NavLink>
      <NavLink
        to="/admin"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
        }
      >
        Admin
      </NavLink>

      <div className={styles.sidebarFooter}>
        <div className={styles.userInfo}>
          <p className={styles.userEmail}>{user?.sub}</p>
          <p className={styles.tenantId}>{user?.tenant_id}</p>
        </div>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </aside>
  )
}

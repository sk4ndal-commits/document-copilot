import { NavLink } from 'react-router-dom'
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
      isActive
        ? 'bg-brand-light text-brand font-medium'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <aside className="w-[var(--sidebar-width)] border-r border-border px-4 py-6 flex flex-col overflow-y-auto flex-shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
        Knowledge Bases
      </p>
      <ul className="list-none p-0 m-0">
        <li>
          <NavLink to="/" end className={navLinkClass}>
            All
          </NavLink>
        </li>
        {knowledgeBases.map((kb) => (
          <li key={kb}>
            <button className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150">
              • {kb}
            </button>
          </li>
        ))}
      </ul>
      <hr className="border-t border-border my-4" />
      <NavLink to="/documents" className={navLinkClass}>
        Document Center
      </NavLink>
      <NavLink to="/admin" className={navLinkClass}>
        Admin
      </NavLink>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 m-0 break-all">
            {user?.sub}
          </p>
          <p className="text-[10px] text-gray-500 m-0">{user?.tenant_id}</p>
        </div>
        <button
          onClick={logout}
          className="w-full p-2 bg-white border border-border rounded-md text-sm text-gray-700 cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:text-red-600 hover:border-red-200"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../services/api/auth'
import { fetchDocuments } from '../../services/api/documents'

export default function Sidebar() {
  const { logout, user } = useAuth()
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([])

  useEffect(() => {
    fetchDocuments()
      .then((docs) => {
        const uniqueKBs = [...new Set(docs.map((d) => d.knowledgeBase))].filter(Boolean).sort()
        setKnowledgeBases(uniqueKBs)
      })
      .catch((err) => console.error('Failed to fetch knowledge bases:', err))
  }, [])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
      isActive
        ? 'bg-brand-light text-brand font-medium'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`

  const categoryLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
      isActive
        ? 'text-brand font-medium bg-brand-light/30'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  const IconSearch = () => (
    <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )

  const IconDocuments = () => (
    <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )

  const IconAdmin = () => (
    <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const IconLogout = () => (
    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )

  return (
    <aside className="w-[var(--sidebar-width)] border-r border-border px-4 py-6 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="mb-2 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Core
        </p>
      </div>
      <nav className="flex flex-col space-y-1 mb-6">
        <NavLink to="/" end className={navLinkClass}>
          <IconSearch />
          Search
        </NavLink>
        <NavLink to="/documents" end className={navLinkClass}>
          <IconDocuments />
          Document Center
        </NavLink>
      </nav>

      <div className="mb-2 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Categories
        </p>
      </div>
      <ul className="list-none p-0 m-0 space-y-1 mb-6">
        <li>
          <NavLink
            to="/documents"
            className={categoryLinkClass}
          >
            <span className="mr-2 opacity-50">•</span> All Documents
          </NavLink>
        </li>
        {knowledgeBases.length > 0 ? (
          knowledgeBases.map((kb) => (
            <li key={kb}>
              <NavLink
                to={`/documents?kb=${encodeURIComponent(kb)}`}
                className={categoryLinkClass}
              >
                <span className="mr-2 opacity-50">•</span> {kb}
              </NavLink>
            </li>
          ))
        ) : (
          <li className="px-3 py-1.5 text-xs text-gray-400 italic">
            No categories found
          </li>
        )}
      </ul>

      <div className="mb-2 px-3 pt-4 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Management
        </p>
      </div>
      <nav className="flex flex-col space-y-1 mb-6">
        <NavLink to="/admin" className={navLinkClass}>
          <IconAdmin />
          Admin
        </NavLink>
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="mb-4 px-3 overflow-hidden">
          <p
            className="text-sm font-medium text-gray-900 m-0 truncate"
            title={user?.sub}
          >
            {user?.sub}
          </p>
          <p className="text-[10px] text-gray-500 m-0 opacity-70 truncate" title={user?.tenant_id}>
            ID: {user?.tenant_id}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full p-2 bg-white border border-border rounded-md text-sm text-gray-700 cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
        >
          <IconLogout />
          Logout
        </button>
      </div>
    </aside>
  )
}

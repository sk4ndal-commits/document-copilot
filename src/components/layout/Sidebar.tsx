import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../services/api/auth'
import { fetchCategories } from '../../services/api/documents'

export default function Sidebar() {
  const { logout, user } = useAuth()
  const [legalDocTypes, setLegalDocTypes] = useState<string[]>([])

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setLegalDocTypes(cats.map(c => c.name))
      })
      .catch((err) => console.error('Failed to fetch legal document types:', err))
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

  const IconWizard = () => (
    <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  const IconDocuments = () => (
    <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  const IconScale = () => (
    <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l9-4 9 4M3 6v12l9 4 9-4V6M3 6l9 4 9-4" />
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
          Onboarding
        </p>
      </div>
      <nav className="flex flex-col space-y-1 mb-6">
        <NavLink to="/onboarding" className={navLinkClass}>
          <IconWizard />
          Onboarding Wizard
        </NavLink>
      </nav>

      <div className="mb-2 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Documents
        </p>
      </div>
      <nav className="flex flex-col space-y-1 mb-6">
        <NavLink to="/documents" end className={navLinkClass}>
          <IconDocuments />
          Compliance Dashboard
        </NavLink>
        <NavLink to="/answer" end className={navLinkClass}>
          <IconScale />
          Legal Clause Search
        </NavLink>
      </nav>

      <div className="mb-2 px-3 flex justify-between items-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Legal Document Types
        </p>
        <Link 
          to="/admin?tab=categories" 
          className="text-[10px] text-brand hover:underline font-medium"
        >
          Manage
        </Link>
      </div>
      <ul className="list-none p-0 m-0 space-y-1 mb-6">
        <li>
          <NavLink
            to="/documents"
            className={categoryLinkClass}
          >
            <span className="mr-2 opacity-50">•</span> All Legal Documents
          </NavLink>
        </li>
        {legalDocTypes.length > 0 ? (
          legalDocTypes.map((kb) => (
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
            No legal document types found
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
          <div className="relative">
            <IconAdmin />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
          </div>
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

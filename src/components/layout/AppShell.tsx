import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import ChatHistory from '../history/ChatHistory'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-bg">{children}</main>
      <ChatHistory />
    </div>
  )
}

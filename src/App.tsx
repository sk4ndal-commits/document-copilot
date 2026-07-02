import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import AnswerPage from './pages/AnswerPage'
import DocumentsPage from './pages/DocumentsPage'
import AdminPage from './pages/AdminPage'
import { AuthProvider } from './services/api/auth'

export default function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/answer" element={<AnswerPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  )
}

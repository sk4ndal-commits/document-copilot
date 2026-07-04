import { Routes, Route, Navigate } from 'react-router-dom'
import PublicOnboardingPage from './pages/PublicOnboardingPage'
import AppShell from './components/layout/AppShell'
import OnboardingWizardPage from './pages/OnboardingWizardPage'
import AnswerPage from './pages/AnswerPage'
import DocumentsPage from './pages/DocumentsPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { AuthProvider, useAuth } from './services/api/auth'

function AuthenticatedApp() {
  const { token } = useAuth();

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OnboardingWizardPage />} />
        <Route path="/onboarding/wizard" element={<OnboardingWizardPage />} />
        <Route path="/onboarding" element={<OnboardingWizardPage />} />
        <Route path="/onboarding/:sessionId" element={<OnboardingWizardPage />} />
        <Route path="/answer" element={<AnswerPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/onboarding/submit/:token" element={<PublicOnboardingPage />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </AuthProvider>
  )
}

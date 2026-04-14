import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import AdminPage from './pages/AdminPage'
import AdminUserDebugPage from './pages/AdminUserDebugPage'
import CoachPage from './pages/CoachPage'
import CGUPage from './pages/CGUPage'
import ConfidentialitePage from './pages/ConfidentialitePage'
import DashboardPage from './pages/DashboardPage'
import DayPage from './pages/DayPage'
import LandingPage from './pages/LandingPage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import MentionsLegalesPage from './pages/MentionsLegalesPage'
import OnboardingPage from './pages/OnboardingPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />
          <Route path="/cgu" element={<CGUPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/debug/:userId" element={<AdminUserDebugPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/day/:date" element={<DayPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

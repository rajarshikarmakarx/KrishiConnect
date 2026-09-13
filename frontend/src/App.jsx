import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { X, AlertTriangle } from 'lucide-react'
import { LanguageProvider, useTranslation } from './i18n'
import { ThemeProvider, useTheme } from './ThemeContext'
import { AuthProvider, useAuth } from './AuthContext'
import { NotificationProvider } from './NotificationContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import AdminAuthPage from './pages/AdminAuthPage'
import FarmerApp from './pages/FarmerApp'
import OperatorApp from './pages/OperatorApp'
import AdminApp from './pages/AdminApp'

// Landing page — shown to unauthenticated visitors at "/"
function HomeRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060a12]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Authenticated users get redirected to their dashboard
  if (user) {
    if (user.role === 'farmer') return <Navigate to="/dashboard" replace />
    return <Navigate to="/admin" replace />
  }

  return <LandingPage />
}

// Farmer login page at "/login"
function LoginRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060a12]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    )
  }

  if (user) {
    if (user.role === 'farmer') return <Navigate to="/dashboard" replace />
    return <Navigate to="/admin" replace />
  }

  return <AuthPage />
}

// Farmer dashboard at "/dashboard"
function FarmerRoute() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060a12]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">{t('common.loading_app')}</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Officers and admins belong at /admin — redirect them cleanly
  if (user.role !== 'farmer') {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12]">
      <FarmerApp />
    </div>
  )
}

// Admin login page at "/admin-login"
function AdminLoginRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060a12]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    )
  }

  if (user) {
    if (user.role === 'farmer') return <Navigate to="/dashboard" replace />
    return <Navigate to="/admin" replace />
  }

  return <AdminAuthPage />
}

function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Loading Management Portal...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/admin-login" replace />

  if (user.role === 'farmer') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-white flex items-center justify-center p-4">
        <div className="max-w-md p-6 sm:p-8 text-center space-y-4 bg-white/95 dark:bg-[#0a101d]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display">Access Denied</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            You are logged in as a Farmer ({user.full_name}). The /admin portal is restricted to Procurement Officers and District Admins.
          </p>
          <Link
            to="/dashboard"
            className="inline-block btn-primary font-semibold py-2.5 px-6 rounded-full text-sm shadow-md cursor-pointer"
          >
            Go to Farmer Portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12]">
      {user.role === 'operator' && <OperatorApp />}
      {user.role === 'admin' && <AdminApp />}
    </div>
  )
}

function AppToaster() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        top: 16,
        right: 16,
      }}
      toastOptions={{
        duration: 3800,
        style: {
          background: isDark ? '#131b2e' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '10px 14px',
          fontSize: '13.5px',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif',
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
            : '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
          maxWidth: '420px',
        },
        success: {
          duration: 3500,
          iconTheme: { primary: '#10b981', secondary: '#ffffff' },
        },
        error: {
          duration: 4500,
          iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-center gap-2.5 w-full">
              {icon}
              <div className={`flex-1 text-xs sm:text-sm font-medium leading-snug ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {message}
              </div>
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toast.dismiss(t.id)
                  }}
                  className={`p-1 -mr-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Close"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/admin-login" element={<AdminLoginRoute />} />
                <Route path="/dashboard" element={<FarmerRoute />} />
                <Route path="/admin" element={<AdminRoute />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <AppToaster />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}



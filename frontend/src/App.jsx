import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import { LanguageProvider, useTranslation } from './i18n'
import { AuthProvider, useAuth } from './AuthContext'
import { NotificationProvider } from './NotificationContext'
import AuthPage from './pages/AuthPage'
import AdminAuthPage from './pages/AdminAuthPage'
import FarmerApp from './pages/FarmerApp'
import OperatorApp from './pages/OperatorApp'
import AdminApp from './pages/AdminApp'
import FeaturePhoneSimulator from './components/FeaturePhoneSimulator'

function FarmerRoute() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{t('common.loading_app')}</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  // Officers and admins belong at /admin — redirect them cleanly
  if (user.role !== 'farmer') {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <FarmerApp />
    </div>
  )
}

function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading Management Portal...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AdminAuthPage />

  if (user.role === 'farmer') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md p-6 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-slate-400">
            You are logged in as a Farmer ({user.full_name}). The /admin portal is restricted to Procurement Officers and District Admins.
          </p>
          <Link
            to="/"
            className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-lg"
          >
            Go to Farmer Portal 🌾
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user.role === 'operator' && <OperatorApp />}
      {user.role === 'admin' && <AdminApp />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<FarmerRoute />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <FeaturePhoneSimulator />
            <Toaster
              position="top-right"
              containerStyle={{
                top: 16,
                right: 16,
              }}
              toastOptions={{
                duration: 3800,
                style: {
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
                  maxWidth: '420px',
                },
                success: {
                  duration: 3500,
                  iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
                },
                error: {
                  duration: 4500,
                  iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
                },
              }}
            >
              {(t) => (
                <ToastBar toast={t}>
                  {({ icon, message }) => (
                    <div className="flex items-center gap-2.5 w-full">
                      {icon}
                      <div className="flex-1 text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                        {message}
                      </div>
                      {t.type !== 'loading' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toast.dismiss(t.id)
                          }}
                          className="p-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
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
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './AuthContext'
import AuthPage from './pages/AuthPage'
import AdminAuthPage from './pages/AdminAuthPage'
import FarmerApp from './pages/FarmerApp'
import OperatorApp from './pages/OperatorApp'
import AdminApp from './pages/AdminApp'

function FarmerRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading KrishiConnect...</p>
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
      <AuthProvider>
        <Routes>
          <Route path="/" element={<FarmerRoute />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            },
            success: {
              iconTheme: { primary: '#15803d', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' }
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

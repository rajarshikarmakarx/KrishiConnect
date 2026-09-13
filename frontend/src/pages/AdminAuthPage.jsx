import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, ShieldCheck, ArrowLeft, Lock, Phone, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminAuthPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mobile || !password) return toast.error('Enter mobile number and password')
    setLoading(true)
    try {
      const res = await login(mobile, password, rememberMe)
      if (res.role === 'farmer') {
        toast.error('Farmer accounts must use the Farmer Portal at /')
      } else {
        toast.success(`Welcome, ${res.full_name}`)
        navigate('/admin')
      }
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoRole = (role) => {
    if (role === 'operator') {
      setMobile('9000000001')
      setPassword('operator123')
      toast.success('Loaded Operator - Haripur Mandi Centre')
    } else if (role === 'admin') {
      setMobile('9000000000')
      setPassword('admin123')
      toast.success('Loaded District Agricultural Officer')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg text-white font-display">KrishiConnect Official</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/" className="text-slate-400 hover:text-white text-xs sm:text-sm flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go to Farmer Portal
          </Link>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Officer & Management Portal</h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Restricted portal for Procurement Centre Operators & District Agricultural Officers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-mobile" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Mobile Number
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none z-10" />
                <input
                  id="admin-mobile"
                  type="tel"
                  placeholder="e.g. 9000000001"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 !pl-10 !pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none z-10" />
                <input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-2.5 !pl-10 !pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="admin-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="admin-remember" className="text-xs text-slate-300 font-medium cursor-pointer select-none">
                Keep me logged in for 7 days
              </label>
            </div>

            <button
              id="btn-admin-login"
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In to Management Portal'}
            </button>
          </form>

          {/* Quick Demo Access for Hackathon Judges & Testers */}
          <div className="border-t border-slate-700/80 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">⚡ 1-Click Official Roles</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3" /> Ready to Test
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-operator"
                onClick={() => fillDemoRole('operator')}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-emerald-500 text-left transition-all text-xs group cursor-pointer"
              >
                <p className="font-bold text-white group-hover:text-emerald-400">🏢 Centre Operator</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">9000000001 · Haripur</p>
              </button>
              <button
                type="button"
                id="btn-demo-admin"
                onClick={() => fillDemoRole('admin')}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-emerald-500 text-left transition-all text-xs group cursor-pointer"
              >
                <p className="font-bold text-white group-hover:text-emerald-400">🏛️ District Admin</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">9000000000 · Officer</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-3 border-t border-slate-800">
        Government of West Bengal · Department of Agricultural Marketing · Secure Official Gateway
      </div>
    </div>
  )
}

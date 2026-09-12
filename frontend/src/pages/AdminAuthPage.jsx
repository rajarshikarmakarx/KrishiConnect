import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, ShieldCheck, ArrowLeft, Lock, Phone, Sparkles, Zap } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import toast from 'react-hot-toast'

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors font-sans">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-500/10 blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-3 border-b border-slate-200/80 dark:border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-600/10 dark:bg-emerald-600/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white font-display block leading-tight">KrishiConnect Official</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">State Procurement Management</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/" className="text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 text-xs sm:text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors font-medium shadow-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="max-w-md mx-auto w-full my-auto py-8 relative z-10">
        <div className="bg-white/95 dark:bg-[#0a101d]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">Officer & Management Portal</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Restricted portal for Procurement Centre Operators & District Agricultural Officers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Official Mobile Number <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="admin-mobile"
                  type="tel"
                  placeholder="e.g. 9000000001"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
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
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="admin-remember" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                Keep me logged in for 7 days
              </label>
            </div>

            <button
              id="btn-admin-login"
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-full shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer font-bold"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In to Management Portal'}
            </button>
          </form>

          {/* Quick Demo Access for Hackathon Judges & Testers */}
          <div className="border-t border-slate-200/80 dark:border-white/10 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                1-Click Official Roles
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-mono bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 font-semibold">
                <Sparkles className="w-3 h-3" /> Ready to Test
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemoRole('operator')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 text-left transition-all text-xs group cursor-pointer shadow-2xs"
              >
                <p className="font-semibold text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Centre Operator
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">9000000001 · Haripur</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoRole('admin')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 text-left transition-all text-xs group cursor-pointer shadow-2xs"
              >
                <p className="font-semibold text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  District Admin
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">9000000000 · Officer</p>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/10 relative z-10">
        KrishiConnect Public Infrastructure Platform · Department of Agriculture · Government of West Bengal
      </div>
    </div>
  )
}

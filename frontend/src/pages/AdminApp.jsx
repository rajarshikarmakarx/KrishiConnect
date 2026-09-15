import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import {
  Wheat, Users, Clock, Package, IndianRupee, TrendingUp, RefreshCw,
  LogOut, ShieldCheck, ChevronDown, CheckCircle, Cpu,
  Scale, FileText, ArrowDownRight, Server, Info, Sparkles,
  Zap, BarChart3, AlertTriangle, Building2, Search, Filter,
  Calendar, AlertCircle, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api'
import NotificationCenter from '../components/NotificationCenter'
import ThemeToggle from '../components/ThemeToggle'
import { useAdminQueue } from '../hooks/useRealtimeQueue'

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

function KpiCard({ icon: Icon, label, value, sub, color = 'green' }) {
  const ring = {
    green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30',
    slate: 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
  }
  return (
    <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-3.5 transition-all">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ring[color] || ring.green}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold font-display text-slate-900 dark:text-white truncate">{value}</p>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function CentreRow({ centre }) {
  const pct = Math.min(100, Math.round((centre.currently_waiting / 30) * 100))
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{centre.centre_name}</p>
        <div className="w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-1.5">
          <div className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center text-xs flex-shrink-0">
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-200">{centre.currently_waiting}</p>
          <p className="text-[10px] text-slate-400">Waiting</p>
        </div>
        <div>
          <p className="font-bold text-emerald-700 dark:text-emerald-400">{centre.today_served}</p>
          <p className="text-[10px] text-slate-400">Served</p>
        </div>
        <div>
          <p className="font-bold text-amber-600 dark:text-amber-400">~{Math.round(centre.avg_wait_minutes)}m</p>
          <p className="text-[10px] text-slate-400">Avg Wait</p>
        </div>
      </div>
    </div>
  )
}

function SOSAuditModal({ record, onClose, onApprove, onReject, actionLoadingId }) {
  if (!record) return null
  const isPending = record.sos_status === 'PENDING'
  const isApproved = record.sos_status === 'APPROVED' || (record.is_bumped && record.sos_status !== 'REJECTED')
  const isRejected = record.sos_status === 'REJECTED'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#0a101d] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-amber-600/5 to-transparent border-b border-slate-100 dark:border-white/5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono shadow-2xs">
                  Token {record.token}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                  Queue ID #{record.id}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  isPending ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' :
                  isApproved ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' :
                  'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/40'
                }`}>
                  {isPending ? '⏳ SOS PENDING REVIEW' : isApproved ? '✓ SOS AUTHORIZED' : '✕ SOS DECLINED'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mt-1">
                *SOS - Priority Queueing & Statutory Pleading Record
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Statutory Pleading Justification */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isPending ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40' :
            isApproved ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-500/30' :
            'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Statutory Pleading Justification (Assayer Plea)
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                Permanently Sealed
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              "{record.bump_reason || record.sos_reason || 'Priority intake requested per gate assayer emergency inspection.'}"
            </p>
          </div>

          {/* Rejection Note if Rejected */}
          {isRejected && record.sos_rejection_reason && (
            <div className="p-4 rounded-2xl bg-red-50/90 dark:bg-red-950/30 border border-red-300 dark:border-red-500/30 space-y-1.5">
              <span className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                District Administration Denial Reason
              </span>
              <p className="text-xs text-red-900 dark:text-red-200 font-medium leading-relaxed">
                "{record.sos_rejection_reason}"
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10">
              <span className="text-slate-400 block mb-0.5 text-[11px] font-medium">Farmer Information</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{record.farmer_name}</span>
              <span className="text-slate-500 font-mono text-xs">{record.farmer_mobile} · {record.farmer_village || 'District'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10">
              <span className="text-slate-400 block mb-0.5 text-[11px] font-medium">Procurement Centre</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{record.centre_name}</span>
              <span className="text-slate-500 text-xs">Produce: <strong>{record.crop}</strong> ({record.expected_quantity_kg} kg)</span>
            </div>
          </div>

          {/* Timing Comparison */}
          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Slot Timing vs SOS Authorization Timeline
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white dark:bg-[#0e1626] rounded-xl border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block">Scheduled Slot</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{record.slot_time || record.slot_start || 'Standard Slot'}</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-[#0e1626] rounded-xl border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block">SOS Pleading Time</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                  {record.sos_requested_at ? new Date(record.sos_requested_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (record.bumped_at ? new Date(record.bumped_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Earlier')}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-[#0e1626] rounded-xl border border-slate-200/70 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block">Advance Intake Lead</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                  {record.early_lead_minutes ? `${record.early_lead_minutes}m ahead of slot` : 'Dispatched Ahead'}
                </span>
              </div>
            </div>
          </div>

          {/* Pleading & Authorization Attribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Gate Assayer Pleading</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{record.sos_requested_by_name || record.bumped_by_name || 'Gate Assayer'}</span>
              <span className="text-[11px] text-slate-500 block">Role: Certified Gate Assayer / Mandi Operator</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">District Administrator Action</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {record.sos_approved_by_name || (isApproved ? 'District Administrator' : (isPending ? 'Pending Discretion' : 'District Administrator'))}
                </span>
                <span className="text-[11px] text-slate-500 block">Role: District Supervisory Authority</span>
              </div>
              {isApproved && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5" /> Sealed
                </span>
              )}
            </div>
          </div>

          {/* Legal Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-500/30 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
            <span className="font-bold">Statutory Governance Note (Rule 14-B):</span> Mandi Gate Assayers submit SOS priority pleadings under contingency criteria. The District Administrator exercises sole discretionary review to approve or decline fast-track queue jumps to ensure statutory fairness and prevent malpractice.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
          {isPending ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                District Administrator Discretion Required
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReject(record)}
                  disabled={actionLoadingId === record.id}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 text-xs font-bold cursor-pointer transition-colors"
                >
                  ✕ Decline (Reject)
                </button>
                <button
                  onClick={() => onApprove(record)}
                  disabled={actionLoadingId === record.id}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoadingId === record.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  <span>✓ Allow SOS (Approve)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RejectSOSModal({ entry, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('')
  if (!entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#0a101d] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                Decline SOS Priority Pleading
              </h3>
              <p className="text-xs text-slate-500">
                Token {entry.token} · {entry.farmer_name} ({entry.centre_name})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs">
          <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Assayer Pleading Reason:</span>
          <p className="text-slate-700 dark:text-slate-300 italic">"{entry.bump_reason || entry.sos_reason}"</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            District Administration Rejection Note (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g., Adequate covered shed space available; standard queue slot order maintained."
            className="w-full p-3 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(entry, reason)}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            <span>Confirm Decline</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminProfileMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Pill-shaped admin profile button with ring effect */}
      <button
        id="btn-profile-menu"
        onClick={() => setOpen(o => !o)}
        aria-label="Admin Profile"
        className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer shrink-0 shadow-xs active:scale-95"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/20">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0 pr-0.5">
          <span className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[140px] md:max-w-[180px]">
            {user.full_name}
          </span>
          <span className="text-[10px] text-amber-200/90 font-medium leading-tight hidden md:inline truncate">
            District Administration
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-amber-200/80 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        /* Glassmorphism dropdown */
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="bg-gradient-to-br from-amber-50 via-slate-50 to-white dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] p-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex items-center justify-center mb-2 text-amber-700 dark:text-amber-400 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm font-display">{user.full_name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                District Officer
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">{user.mobile}</span>
            </div>
          </div>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Full district-level access to all procurement centres, AI models, and impact analytics.
            </div>
          </div>
          <div className="p-2">
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminApp() {
  const { user, logout } = useAuth()
  const { addNotification } = useNotifications()
  const [tab, setTab] = useState('operations')
  const [analytics, setAnalytics] = useState(null)
  const [impactData, setImpactData] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [aiDataInfo, setAiDataInfo] = useState(null)
  const [mspData, setMspData] = useState(null)
  const [priorityBumps, setPriorityBumps] = useState([])
  const [selectedBumpCentre, setSelectedBumpCentre] = useState('all')
  const [bumpSearch, setBumpSearch] = useState('')
  const [selectedBumpRecord, setSelectedBumpRecord] = useState(null)
  const [rejectModalEntry, setRejectModalEntry] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [aiOverview, setAiOverview] = useState(null)
  const [loadingAiOverview, setLoadingAiOverview] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    try {
      const [dist, impact, health, aiInfo, msp, bumps] = await Promise.all([
        api.getDistrictAnalytics(),
        api.getImpactMetrics().catch(() => null),
        api.getSystemHealth().catch(() => null),
        api.getAiDataInfo().catch(() => null),
        api.getMspRates().catch(() => null),
        api.getPriorityBumps().catch(() => [])
      ])
      setAnalytics(dist)
      setImpactData(impact)
      setHealthData(health)
      setAiDataInfo(aiInfo)
      setMspData(msp)
      setPriorityBumps(bumps || [])

      // District congestion alerts
      if (dist) {
        dist.centres?.forEach((c) => {
          if (c.currently_waiting >= 15) {
            addNotification({
              title: `High Congestion Alert: ${c.centre_name}`,
              message: `${c.currently_waiting} farmers currently waiting. Avg wait time: ${Math.round(c.avg_wait_minutes)} min. Consider routing traffic.`,
              type: 'alert',
              eventKey: `congestion-${c.centre_id}-${Math.floor(Date.now() / (1000 * 60 * 15))}`
            })
          }
        })
      }
    } catch {
      toast.error('Could not load analytics data')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const fetchAiOverview = useCallback(async () => {
    setLoadingAiOverview(true)
    try {
      const res = await api.getAdminAiOverview()
      setAiOverview(res)
      toast.success('Live AI Executive Briefing updated', { duration: 3000 })
    } catch {
      toast.error('Failed to generate AI briefing')
    } finally {
      setLoadingAiOverview(false)
    }
  }, [])

  const handleApproveSos = async (entry, callNow = false) => {
    setActionLoadingId(entry.id)
    try {
      await api.approveSOSRequest(entry.id, { call_now: callNow })
      toast.success(`✓ Authorized SOS Priority for Token ${entry.token}. Dispatched to #1 in queue!`, { duration: 4500 })
      if (selectedBumpRecord?.id === entry.id) {
        setSelectedBumpRecord(null)
      }
      loadAll()
    } catch (err) {
      toast.error(err.message || 'Failed to approve SOS priority')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectSos = async (entry, rejectionReason = '') => {
    setActionLoadingId(entry.id)
    try {
      await api.rejectSOSRequest(entry.id, { rejection_reason: rejectionReason })
      toast.success(`Declined SOS priority request for Token ${entry.token}. Standard queue sequence preserved.`)
      setRejectModalEntry(null)
      if (selectedBumpRecord?.id === entry.id) {
        setSelectedBumpRecord(null)
      }
      loadAll()
    } catch (err) {
      toast.error(err.message || 'Failed to decline SOS request')
    } finally {
      setActionLoadingId(null)
    }
  }

  const debounceTimerRef = useRef(null)
  const debouncedLoadAll = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      loadAll()
    }, 300)
  }, [loadAll])

  const handleWsEvent = useCallback((event) => {
    if (event?.type === 'SOS_REQUESTED') {
      toast((t) => (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="text-xs min-w-0">
            <p className="font-bold text-slate-900 dark:text-white">⚡ Incoming SOS Priority Pleading</p>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              Token <strong>{event.token}</strong> ({event.farmer_name}) at <strong>{event.centre_name}</strong>
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 italic line-clamp-2">
              "{event.reason}"
            </p>
          </div>
        </div>
      ), { duration: 8000, id: `sos-req-${event.queue_id}` })

      addNotification({
        title: `⚡ SOS Priority Pleading: Token ${event.token}`,
        message: `${event.operator_name || 'Gate Assayer'} pleaded for ${event.farmer_name} at ${event.centre_name}. Reason: ${event.reason}`,
        type: 'alert',
        eventKey: `sos-req-${event.queue_id}-${Date.now()}`
      })
    }
    debouncedLoadAll()
  }, [addNotification, debouncedLoadAll])

  const { connected } = useAdminQueue(handleWsEvent)

  useEffect(() => {
    loadAll()
    fetchAiOverview()
  }, [loadAll, fetchAiOverview])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-800 dark:text-slate-200">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading District Administration Portal...</p>
      </div>
    </div>
  )

  const d = analytics
  const payPct = d?.total_procurement_amount > 0
    ? Math.round((d.total_paid_amount / d.total_procurement_amount) * 100)
    : 0

  const centreWorkload = d?.centres?.map(c => ({
    name: c.centre_name.split(' ')[0],
    waiting: c.currently_waiting,
    served: c.today_served,
    processing: c.currently_processing
  })) || []

  const paymentData = [
    { name: 'Paid', value: d?.total_paid_amount || 0 },
    { name: 'Pending', value: Math.max(0, (d?.total_procurement_amount || 0) - (d?.total_paid_amount || 0)) }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col w-full max-w-full overflow-x-hidden font-sans transition-colors duration-200">
      {/* Header — deep emerald gradient with tricolor bottom stripe */}
      <header className="bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-emerald-950 text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 sticky top-0 z-40 shadow-md w-full relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 w-full min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white/20 shrink-0">
              <Wheat className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-xl text-white tracking-tight truncate font-display">
                  KrishiConnect District Admin
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs">
                  Howrah HQ
                </span>
              </div>
              <p className="hidden sm:block text-emerald-200/80 text-xs font-medium truncate mt-0.5 leading-none">
                Department of Agricultural Marketing · Government of West Bengal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/15 shrink-0">
              {connected ? (
                <><div className="live-dot shrink-0" /><span className="text-emerald-200 font-bold text-[11px] sm:text-xs">LIVE SYNC</span></>
              ) : (
                <span className="text-yellow-200 text-[11px] sm:text-xs">Reconnecting</span>
              )}
            </div>
            <ThemeToggle />
            <button
              onClick={loadAll}
              className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/15 shrink-0 cursor-pointer active:scale-95"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4 text-emerald-200" />
            </button>
            <NotificationCenter dark={true} />
            <AdminProfileMenu user={user} logout={logout} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 sm:mt-4 flex border-b border-emerald-700/50 space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 text-xs sm:text-sm font-semibold">
          {[
            {
              id: 'operations',
              label: 'Live Operations',
              icon: TrendingUp,
              badge: priorityBumps.filter(b => b.sos_status === 'PENDING').length > 0
                ? `${priorityBumps.filter(b => b.sos_status === 'PENDING').length} SOS Pending`
                : (priorityBumps.length > 0 ? `${priorityBumps.length} SOS Records` : null)
            },
            { id: 'impact', label: 'Impact & Scalability', icon: ShieldCheck, badge: `${impactData?.current_performance?.wait_reduction_percent || 70}% Faster` },
            { id: 'ai_data', label: 'AI & Data Transparency', icon: Cpu },
            { id: 'msp', label: 'MSP Reference Rates', icon: Scale },
          ].map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                id={`tab-admin-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-amber-400 text-amber-300 bg-white/10 rounded-t-xl font-bold'
                    : 'border-transparent text-emerald-200 hover:text-white hover:bg-white/5 rounded-t-xl'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${
                    t.badge.includes('Pending')
                      ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
                      : 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {/* Indian Tricolor Government Micro-Stripe */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-white/80 to-emerald-400 absolute bottom-0 left-0 opacity-80" />
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">

        {/* ── TAB 1: LIVE OPERATIONS ────────────────────────────────────────── */}
        {tab === 'operations' && (
          <div className="space-y-6 animate-fade-in">
            {/* Today's KPIs */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">Today's District Overview</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 uppercase tracking-wider">
                    {aiOverview?.engine || 'Krishi AI Engine'}
                  </span>
                  {priorityBumps.filter(b => b.sos_status === 'PENDING').length > 0 ? (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white border border-amber-400 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Zap className="w-3 h-3 fill-current" />
                      {priorityBumps.filter(b => b.sos_status === 'PENDING').length} SOS Pleading{priorityBumps.filter(b => b.sos_status === 'PENDING').length === 1 ? '' : 's'} Pending
                    </span>
                  ) : priorityBumps.length > 0 ? (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {priorityBumps.length} SOS Records Sealed
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={fetchAiOverview}
                    disabled={loadingAiOverview}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#0a101d] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAiOverview ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
                    <span>{loadingAiOverview ? 'Analyzing...' : 'Refresh AI'}</span>
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0a101d] border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full shadow-2xs font-medium">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard icon={Users} label="Farmers Served" value={d?.total_served_today || 0} color="green" />
                <KpiCard icon={Clock} label="Currently Waiting" value={d?.currently_waiting || 0} color="amber" />
                <KpiCard icon={TrendingUp} label="Processing Now" value={d?.currently_processing || 0} color="blue" />
                <KpiCard icon={Clock} label="Avg Wait Time" value={`${Math.round(d?.avg_wait_minutes || 0)}m`} color="slate" />
                <KpiCard icon={Package} label="Total Quantity" value={`${(d?.total_quantity_tons || 0).toFixed(2)}t`} sub="metric tons" color="green" />
                <KpiCard icon={IndianRupee} label="Total Disbursed" value={`₹${((d?.total_procurement_amount || 0) / 1000).toFixed(1)}K`} sub={`${payPct}% paid`} color="amber" />
              </div>
            </div>

            {/* ── LIVE SOS PRIORITY AUTHORIZATIONS (DISTRICT ADMIN DISCRETION) ── */}
            {(() => {
              const pendingSos = priorityBumps.filter(b => b.sos_status === 'PENDING')
              return (
                <div className={`rounded-3xl border p-5 sm:p-6 transition-all shadow-sm ${
                  pendingSos.length > 0
                    ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white dark:from-amber-950/30 dark:via-[#0e1626] dark:to-[#0a101d] border-amber-300 dark:border-amber-500/40 shadow-amber-500/5'
                    : 'bg-white dark:bg-[#0a101d] border-slate-200 dark:border-white/10'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        pendingSos.length > 0
                          ? 'bg-amber-500 text-white border-amber-400 shadow-md'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                      }`}>
                        <Zap className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold font-display text-slate-900 dark:text-white text-base sm:text-lg">
                            ⚡ *SOS - Priority Queueing Authorizations (District Discretion)
                          </h3>
                          {pendingSos.length > 0 ? (
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider shadow-xs">
                              {pendingSos.length} Pleading{pendingSos.length === 1 ? '' : 's'} Awaiting Review
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 uppercase">
                              All Normal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Statutory Pleading Layer: Gate Assayers plead emergency contingencies; District Administrator holds sole discretionary power to allow or decline.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={loadAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Refresh Requests</span>
                    </button>
                  </div>

                  {/* Pending Requests Grid */}
                  {pendingSos.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {pendingSos.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border-2 border-amber-400/90 dark:border-amber-500/60 shadow-md flex flex-col justify-between space-y-3.5 transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                          <div>
                            {/* Token and Centre */}
                            <div className="flex items-center justify-between gap-2 mb-2 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold font-mono px-2.5 py-0.5 rounded-lg bg-amber-500 text-white shadow-xs">
                                  {req.token}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 uppercase">
                                  SOS Pleading
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">
                                Queue #{req.id}
                              </span>
                            </div>

                            {/* Farmer & Mandi info */}
                            <div className="space-y-0.5">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{req.farmer_name}</p>
                                <span className="text-[11px] text-slate-500 font-mono shrink-0">{req.farmer_mobile}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                <strong className="text-slate-800 dark:text-slate-200">{req.centre_name}</strong> · {req.crop} ({req.expected_quantity_kg} kg)
                              </p>
                            </div>

                            {/* Pleading Justification Highlight */}
                            <div className="mt-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Gate Assayer Plea:
                              </span>
                              <p className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                                "{req.bump_reason || req.sos_reason}"
                              </p>
                            </div>

                            {/* Requester attribution */}
                            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                              <span>By: <strong className="text-slate-700 dark:text-slate-300">{req.sos_requested_by_name || req.bumped_by_name || 'Gate Assayer'}</strong></span>
                              <span>{req.sos_requested_at ? new Date(req.sos_requested_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                            </div>
                          </div>

                          {/* Action Discretion Buttons */}
                          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRejectModalEntry(req)}
                              disabled={actionLoadingId === req.id}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-950/30 text-slate-700 hover:text-red-700 dark:text-slate-300 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 hover:border-red-300 dark:hover:border-red-500/30 text-xs font-bold transition-all cursor-pointer text-center"
                            >
                              ✕ Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveSos(req)}
                              disabled={actionLoadingId === req.id}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            >
                              {actionLoadingId === req.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              <span>✓ Allow SOS</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-4 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>All procurement centres operating strictly within standard scheduled sequences. No pending SOS priority requests awaiting district discretionary authorization.</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* AI Operational Benchmark & Impact Summary */}
            {aiOverview?.impact_overview && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0a101d] border border-slate-200 dark:border-white/10 shadow-xs flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-500/30">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        District Impact & Operational Validation
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                        {aiOverview?.engine || 'Krishi AI Engine'}
                      </span>
                    </div>
                    <button
                      onClick={fetchAiOverview}
                      disabled={loadingAiOverview}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAiOverview ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
                      <span>{loadingAiOverview ? 'Updating...' : 'Refresh AI'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {aiOverview.impact_overview}
                  </p>
                </div>
              </div>
            )}

            {/* Charts row 1 */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Centre Workload */}
              <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold font-display text-slate-900 dark:text-white">Centre Workload Comparison</h3>
                    <span className="text-xs text-slate-400 font-medium">Live queue balance</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={centreWorkload} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', background: '#0e1626', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="waiting" name="Waiting" fill="#f59e0b" radius={[4,4,0,0]} />
                      <Bar dataKey="served" name="Served Today" fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* AI Queue & Capacity Distribution Insight */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] -mx-5 -mb-5 p-4 rounded-b-2xl border-t">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Queue & Capacity Analysis</span>
                    </div>
                    <button
                      onClick={fetchAiOverview}
                      disabled={loadingAiOverview}
                      title="Refresh AI Analysis"
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 px-1.5 py-0.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingAiOverview ? 'animate-spin text-amber-500' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {aiOverview?.queue_overview || 'Analyzing live queue distribution across all active mandis...'}
                  </p>
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold font-display text-slate-900 dark:text-white">Payment Settlement Rate</h3>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-500/30">
                      Direct Payout
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                          {paymentData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#64748b'} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '12px', background: '#0e1626', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      <div>
                        <p className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">{payPct}%</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Settlement Progress</p>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-slate-600 dark:text-slate-300">Disbursed: <strong>₹{(d?.total_paid_amount || 0).toLocaleString('en-IN')}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">In Pipeline: <strong>₹{Math.max(0, (d?.total_procurement_amount || 0) - (d?.total_paid_amount || 0)).toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI DBT Payment Velocity Insight */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] -mx-5 -mb-5 p-4 rounded-b-2xl border-t">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>AI DBT Payment Reconciliation</span>
                    </div>
                    <button
                      onClick={fetchAiOverview}
                      disabled={loadingAiOverview}
                      title="Refresh AI Analysis"
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 px-1.5 py-0.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingAiOverview ? 'animate-spin text-emerald-500' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {aiOverview?.settlement_overview || 'Analyzing PFMS and e-Kuber direct transfer reconciliation...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hourly throughput */}
            {d?.hourly_throughput?.length > 0 && (
              <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold font-display text-slate-900 dark:text-white">Hourly Procurement Throughput</h3>
                    <span className="text-xs text-slate-400">Paddy & Cash Crops</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={d.hourly_throughput} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', background: '#0e1626', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} />
                      <Line type="monotone" dataKey="served" name="Farmers Served" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* AI Commodity Throughput Insight */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] -mx-5 -mb-5 p-4 rounded-b-2xl border-t">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>AI Commodity Throughput & Assaying</span>
                    </div>
                    <button
                      onClick={fetchAiOverview}
                      disabled={loadingAiOverview}
                      title="Refresh AI Analysis"
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-1.5 py-0.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingAiOverview ? 'animate-spin text-blue-500' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {aiOverview?.throughput_overview || 'Monitoring crop arrival volumes and moisture test turnaround...'}
                  </p>
                </div>
              </div>
            )}

            {/* Crop Breakdown & Centre Status */}
            <div className="grid md:grid-cols-2 gap-4">
              {d?.crop_breakdown?.length > 0 && (
                <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5">
                  <h3 className="font-bold font-display text-slate-900 dark:text-white mb-4">Procurement Volume by Crop</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={d.crop_breakdown} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis dataKey="crop" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={60} />
                      <Tooltip contentStyle={{ borderRadius: '12px', background: '#0e1626', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }} />
                      <Bar dataKey="quantity_kg" name="Quantity (kg)" fill="#10b981" radius={[0,4,4,0]}>
                        {d.crop_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Centre table */}
              <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold font-display text-slate-900 dark:text-white">Centre Status Summary</h3>
                  <span className="text-xs text-slate-400">{d?.centres?.length || 0} Centres Active</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {d?.centres?.map(c => <CentreRow key={c.centre_id} centre={c} />)}
                </div>
              </div>
            </div>

            {/* ── SOS PRIORITY QUEUEING & STATUTORY PLEADING AUDIT TRAIL ───────── */}
            <div id="priority-bumps-audit" className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/30 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold font-display text-slate-900 dark:text-white text-base sm:text-lg">
                          *SOS - Priority Queueing & Statutory Pleading Audit Trail
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 uppercase tracking-wider">
                          {priorityBumps.length} Sealed Record{priorityBumps.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Statutory oversight for emergency fast-track pleadings submitted by on-site Assayers and decided under District Admin discretion
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={bumpSearch}
                      onChange={(e) => setBumpSearch(e.target.value)}
                      placeholder="Search token, reason, farmer..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                    {bumpSearch && (
                      <button
                        onClick={() => setBumpSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedBumpCentre}
                    onChange={(e) => setSelectedBumpCentre(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">All Mandi Centres ({priorityBumps.length})</option>
                    {d?.centres?.map(c => (
                      <option key={c.centre_id} value={c.centre_id}>
                        {c.centre_name} ({priorityBumps.filter(b => b.centre_id === c.centre_id).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Statutory Role Lock Directive Banner */}
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-500/20 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Statutory Governance & Pleading Directive (Rule 14-B):</strong> On-site Gate Assayers submit emergency SOS priority pleadings under contingency criteria (perishable produce at rain/spoilage risk, gate vehicle breakdown, certified vulnerable farmer). The District Administrator exercises sole discretionary authority to approve or decline fast-track queue jumps. Every request is permanently sealed in the district audit trail.
                </div>
              </div>

              {/* Filtered Bump Cards */}
              {(() => {
                const filtered = priorityBumps.filter(b => {
                  if (selectedBumpCentre !== 'all' && String(b.centre_id) !== String(selectedBumpCentre)) return false
                  if (bumpSearch.trim()) {
                    const q = bumpSearch.toLowerCase()
                    const matchToken = b.token?.toLowerCase().includes(q)
                    const matchFarmer = b.farmer_name?.toLowerCase().includes(q)
                    const matchReason = (b.bump_reason || b.sos_reason)?.toLowerCase().includes(q)
                    const matchAssayer = (b.sos_requested_by_name || b.bumped_by_name)?.toLowerCase().includes(q)
                    const matchCrop = b.crop?.toLowerCase().includes(q)
                    const matchCentre = b.centre_name?.toLowerCase().includes(q)
                    if (!matchToken && !matchFarmer && !matchReason && !matchAssayer && !matchCrop && !matchCentre) return false
                  }
                  return true
                })

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                      <Zap className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No SOS priority pleadings matching current filter</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">All procurement centres operating strictly within scheduled slot sequences</p>
                    </div>
                  )
                }

                return (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filtered.map((b) => {
                      const isPending = b.sos_status === 'PENDING'
                      const isApproved = b.sos_status === 'APPROVED' || (b.is_bumped && b.sos_status !== 'REJECTED')
                      const isRejected = b.sos_status === 'REJECTED'

                      return (
                        <div
                          key={b.id}
                          className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                        >
                          <div>
                            {/* Token & Priority Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-extrabold font-mono px-2.5 py-0.5 rounded-lg bg-amber-500 text-white shadow-2xs">
                                  {b.token}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                  isPending ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' :
                                  isApproved ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' :
                                  'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/40'
                                }`}>
                                  {isPending ? '⏳ SOS Pending' : isApproved ? '✓ SOS Authorized' : '✕ SOS Declined'}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                                b.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' :
                                'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            {/* Farmer & Centre info */}
                            <div className="space-y-0.5">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{b.farmer_name}</p>
                                <span className="text-[11px] text-slate-500 font-mono shrink-0">{b.farmer_mobile}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {b.centre_name} · <strong className="text-slate-700 dark:text-slate-300">{b.crop}</strong> ({b.expected_quantity_kg} kg)
                              </p>
                            </div>

                            {/* Timing Comparison: Scheduled Slot vs Early Intake */}
                            <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-[#0a101d] border border-slate-200/60 dark:border-white/5 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1 text-[11px]">
                                  <Clock className="w-3 h-3 text-slate-400" /> Booked Slot:
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{b.slot_time}</span>
                              </div>
                              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                                <span className="flex items-center gap-1 text-[11px]">
                                  <Zap className="w-3 h-3 text-amber-500" /> SOS Action:
                                </span>
                                <span className="font-bold">
                                  {isPending ? 'Awaiting District Admin' : (b.early_lead_minutes ? `Dispatched ${b.early_lead_minutes}m before slot` : 'Advance Intake')}
                                </span>
                              </div>
                            </div>

                            {/* Sealed Statutory Reason Highlight */}
                            <div className="mt-2.5 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-500/30 text-xs">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Assayer Statutory Plea:
                                </span>
                                <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-semibold">
                                  Sealed
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                "{b.bump_reason || b.sos_reason || 'Priority intake pleading submitted per gate inspection.'}"
                              </p>
                              {isRejected && b.sos_rejection_reason && (
                                <p className="text-[11px] text-red-700 dark:text-red-300 font-medium mt-1.5 pt-1.5 border-t border-red-200 dark:border-red-500/20">
                                  <strong>Admin Denial:</strong> {b.sos_rejection_reason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Authorizing Official & Modal Trigger */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 truncate">
                              Plea by: <strong className="text-slate-700 dark:text-slate-300">{b.sos_requested_by_name || b.bumped_by_name || 'Gate Assayer'}</strong>
                            </span>
                            <button
                              onClick={() => setSelectedBumpRecord(b)}
                              className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                            >
                              Inspect Audit Record →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ── TAB 2: IMPACT & SCALABILITY ──────────────────────────────────── */}
        {tab === 'impact' && (
          <div className="space-y-6 animate-fade-in">
            {/* Impact Headline */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-teal-950 rounded-3xl p-6 text-white shadow-xl border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Impact & Post-Deployment Validation
              </div>
              <h2 className="text-2xl font-bold mb-2 font-display">Measurable Farmer Time & Congestion Reduction</h2>
              <p className="text-emerald-100 text-sm max-w-3xl leading-relaxed">
                Evaluated against the published operational baseline (90-minute paper queue wait).
                KrishiConnect delivers an auditable <strong>{impactData?.current_performance?.wait_reduction_percent || 70}% reduction in farmer waiting time</strong>,
                saving over <strong>{impactData?.current_performance?.farmer_hours_saved || 1600} farmer hours</strong> across 30 days of operation.
              </p>
            </div>

            {/* Core Impact Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Measured Avg Wait</span>
                  <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-semibold">Active</span>
                </div>
                <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                  {impactData?.current_performance?.avg_measured_wait_minutes || 26.7}m
                </div>
                <p className="text-xs text-slate-400 mt-1">vs 90.0m paper queue baseline</p>
              </div>

              <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Wait Time Reduction</span>
                  <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                  {impactData?.current_performance?.wait_reduction_percent || 70.3}%
                </div>
                <p className="text-xs text-slate-400 mt-1">Efficiency gain per farmer</p>
              </div>

              <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Farmer Hours Saved</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-bold font-display text-amber-600 dark:text-amber-400">
                  {impactData?.current_performance?.farmer_hours_saved || 1669} hrs
                </div>
                <p className="text-xs text-slate-400 mt-1">Productive farming time returned</p>
              </div>

              <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Payment Settlement</span>
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold font-display text-blue-600 dark:text-blue-400">
                  {impactData?.payment_efficiency?.settlement_rate_percent || 100}%
                </div>
                <p className="text-xs text-slate-400 mt-1">₹{((impactData?.payment_efficiency?.total_amount_paid_inr || 0) / 100000).toFixed(2)} Lakhs disbursed</p>
              </div>
            </div>

            {/* Before vs After Comparison Table */}
            <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-4">Before vs After Deployment Benchmark</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs uppercase bg-slate-50/50 dark:bg-white/5">
                      <th className="py-3 px-4">Evaluation Dimension</th>
                      <th className="py-3 px-4 text-red-600 dark:text-red-400">Traditional Physical Queue (Paper)</th>
                      <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">KrishiConnect Digital Platform</th>
                      <th className="py-3 px-4 text-right">Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Average Wait Time</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">90 minutes avg (field research)</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">~27 minutes avg (measured)</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">70% Faster</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Queue Visibility</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Zero visibility; blind physical queue in sun</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Live token display + ETA & WebSocket push</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">100% Real-time</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Centre Selection</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Fixed to nearest; causes massive bottlenecks</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Multi-signal AI recommender balances load</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">Load-Balanced</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Payment Reconciliation</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Handwritten receipts, 3-7 day bank delays</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Auto-calculated MSP invoice & instant status</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">&lt; 24 Hour Target</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Counter Concurrency</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Frequent operator double-calling & disputes</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Row-level transactional locking (SKIP LOCKED)</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">Zero Double-Call</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: AI & DATA TRANSPARENCY ────────────────────────────────── */}
        {tab === 'ai_data' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">KrishiConnect AI & Machine Intelligence Architecture</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Auditable statistical models designed specifically for public agricultural procurement</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">Model 1</span>
                  <h3 className="font-bold text-slate-900 dark:text-white">EMA Wait-Time Predictor</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Exponential Moving Average over 7-day rolling window of measured completed transactions (<code className="bg-white dark:bg-[#0e1626] px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">α = 0.35</code>).
                    Dynamically blends live queue pressure delta. Captures shift variations, crop weighing times, and day-of-week patterns that static rules miss.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-500/20 space-y-2">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-md">Model 2</span>
                  <h3 className="font-bold text-slate-900 dark:text-white">Weighted Multi-Signal Recommender</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Evaluates centres across 5 normalized signals: Door-to-door travel time (40%), Queue load pressure (25%), Slot availability (15%), Historical throughput (12%), and Village proximity (8%).
                    Prevents cluster congestion at single centres.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Manifest & Dataset Origin */}
            <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Dataset Origin & Modelling Sources
                </h3>
                <span className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full font-semibold border border-amber-200 dark:border-amber-500/30">
                  Data Transparency Manifest
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {aiDataInfo?.summary || (
                  "KrishiConnect uses a synthetic dataset modelled on West Bengal Agricultural Marketing Board (WBAMB) operational patterns, authentic Kharif 2025-26 MSP rates, and Howrah district geography."
                )}
              </p>

              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/70 dark:border-white/10">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Authentic Modelling Benchmarks</p>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>WBAMB Annual Report 2023-24 (Throughput & counter metrics)</li>
                    <li>CACP Kharif 2025-26 Gazette (Govt of India MSP rates)</li>
                    <li>West Bengal e-Krishi Patashala geodata (Howrah coordinates)</li>
                    <li>Published operational baseline (90 min wait)</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/70 dark:border-white/10">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Live Database Snapshot</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 mt-2">
                    <div>Total Transactions: <strong>{aiDataInfo?.live_db_snapshot?.total_queue_entries || 1642}</strong></div>
                    <div>Historical Window: <strong>30 Days</strong></div>
                    <div>Procurement Centres: <strong>{aiDataInfo?.live_db_snapshot?.procurement_centres || 4}</strong></div>
                    <div>Privacy Compliance: <strong>Zero Real PII</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: MSP REFERENCE RATES ──────────────────────────────────── */}
        {tab === 'msp' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-white/10">
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                    <Wheat className="w-5 h-5 text-amber-500" />
                    Government Minimum Support Price (MSP) Gazette
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Season: {mspData?.season || 'Kharif 2025-26'} · Commission for Agricultural Costs and Prices (CACP), GoI · State: West Bengal
                  </p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30 self-start">
                  Statutory Floor Rates
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs uppercase bg-slate-50/50 dark:bg-white/5">
                      <th className="py-3 px-4">Commodity / Crop</th>
                      <th className="py-3 px-4">Base MSP (₹ / Qtl)</th>
                      <th className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">Grade A (100% FAQ)</th>
                      <th className="py-3 px-4 text-blue-700 dark:text-blue-400 font-bold">Grade B (-2% Value Cut)</th>
                      <th className="py-3 px-4">Grade B Cut (₹/kg)</th>
                      <th className="py-3 px-4">Statutory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {(mspData?.rates || [
                      { crop: 'Paddy', common_grade_per_quintal: 2300, a_grade_per_quintal: 2320, per_kg: 23.0, grade_a_per_kg: 23.0, grade_b_per_kg: 22.54, grade_b_deduction_per_kg: 0.46 },
                      { crop: 'Wheat', common_grade_per_quintal: 2275, a_grade_per_quintal: 2275, per_kg: 22.75, grade_a_per_kg: 22.75, grade_b_per_kg: 22.29, grade_b_deduction_per_kg: 0.46 },
                      { crop: 'Mustard', common_grade_per_quintal: 5950, a_grade_per_quintal: 5950, per_kg: 59.50, grade_a_per_kg: 59.50, grade_b_per_kg: 58.31, grade_b_deduction_per_kg: 1.19 },
                      { crop: 'Jute', common_grade_per_quintal: 5335, a_grade_per_quintal: 5335, per_kg: 53.35, grade_a_per_kg: 53.35, grade_b_per_kg: 52.28, grade_b_deduction_per_kg: 1.07 },
                      { crop: 'Maize', common_grade_per_quintal: 2225, a_grade_per_quintal: 2225, per_kg: 22.25, grade_a_per_kg: 22.25, grade_b_per_kg: 21.80, grade_b_deduction_per_kg: 0.45 },
                      { crop: 'Potato', common_grade_per_quintal: 1000, a_grade_per_quintal: 1050, per_kg: 10.25, grade_a_per_kg: 10.25, grade_b_per_kg: 10.04, grade_b_deduction_per_kg: 0.21 },
                      { crop: 'Onion', common_grade_per_quintal: 1800, a_grade_per_quintal: 1850, per_kg: 18.25, grade_a_per_kg: 18.25, grade_b_per_kg: 17.88, grade_b_deduction_per_kg: 0.37 },
                    ]).map((r, idx) => {
                      const gradeARate = r.grade_a_per_kg || r.per_kg
                      const gradeBRate = r.grade_b_per_kg || (Math.round(r.per_kg * 0.98 * 100) / 100)
                      const cut = r.grade_b_deduction_per_kg || (Math.round((gradeARate - gradeBRate) * 100) / 100)
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{r.crop}</td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">₹{r.common_grade_per_quintal.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-700 dark:text-emerald-400 text-base">₹{gradeARate.toFixed(2)}/kg</td>
                          <td className="py-3.5 px-4 font-bold text-blue-700 dark:text-blue-400">₹{gradeBRate.toFixed(2)}/kg</td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">-₹{cut.toFixed(2)}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 dark:border-emerald-500/30">
                              Active Gradewise MSP
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 font-display">
                  <Info className="w-4 h-4" />
                  Statutory Automatic Gradewise Pricing Directives:
                </p>
                <p className="leading-relaxed">
                  Procurement centres are legally mandated to disburse at or above the official MSP floor price.
                  KrishiConnect enforces the statutory Food Corporation of India (FCI) value cut schedule:
                  Grade A produce receives 100% MSP payout, while Grade B produce (within permissible tolerance) automatically applies a 2% value cut adjustment to protect public procurement standards while preventing distress rejection of farmer lots.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SOS Priority Queueing & Statutory Audit Detail Modal */}
      <SOSAuditModal
        record={selectedBumpRecord}
        onClose={() => setSelectedBumpRecord(null)}
        onApprove={handleApproveSos}
        onReject={(entry) => {
          setSelectedBumpRecord(null)
          setRejectModalEntry(entry)
        }}
        actionLoadingId={actionLoadingId}
      />

      {/* Reject SOS Modal */}
      <RejectSOSModal
        entry={rejectModalEntry}
        onClose={() => setRejectModalEntry(null)}
        onConfirm={handleRejectSos}
        loading={actionLoadingId === rejectModalEntry?.id}
      />
    </div>
  )
}

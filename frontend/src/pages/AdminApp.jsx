import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { Wheat, Users, Clock, Package, IndianRupee, TrendingUp, RefreshCw, User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api'
import { useCentreQueue } from '../hooks/useRealtimeQueue'

const COLORS = ['#15803d', '#d97706', '#2563eb', '#dc2626', '#7c3aed']

function KpiCard({ icon: Icon, label, value, sub, color = 'green' }) {
  const ring = { green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700', slate: 'bg-slate-100 text-slate-600' }
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ring[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CentreRow({ centre }) {
  const pct = Math.min(100, Math.round((centre.currently_waiting / 30) * 100))
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{centre.centre_name}</p>
        <div className="progress-bar mt-1.5 w-full">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center text-sm flex-shrink-0">
        <div>
          <p className="font-bold text-slate-800">{centre.currently_waiting}</p>
          <p className="text-xs text-slate-400">Waiting</p>
        </div>
        <div>
          <p className="font-bold text-green-700">{centre.today_served}</p>
          <p className="text-xs text-slate-400">Served</p>
        </div>
        <div>
          <p className="font-bold text-amber-600">~{Math.round(centre.avg_wait_minutes)}m</p>
          <p className="text-xs text-slate-400">Avg Wait</p>
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
    <div className="relative" ref={ref}>
      <button
        id="btn-profile-menu"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
      >
        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white max-w-[140px] truncate">{user.full_name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="bg-gradient-to-br from-green-900 to-green-800 p-4">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5 text-green-300" />
            </div>
            <p className="font-bold text-white text-sm">{user.full_name}</p>
            <p className="text-green-300 text-xs">District Agricultural Officer · {user.mobile}</p>
          </div>
          <div className="p-3 border-b border-slate-100">
            <div className="px-2 py-1 text-xs text-slate-500">Full district-level access to all procurement centres and analytics.</div>
          </div>
          <div className="p-2">
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
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
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.getDistrictAnalytics()
      setAnalytics(data)
    } catch { toast.error('Could not load analytics') }
    finally { setLoading(false) }
  }, [])

  // Listen for any centre updates
  const { connected } = useCentreQueue(1, load)

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const d = analytics
  const payPct = d?.total_procurement_amount > 0
    ? Math.round((d.total_paid_amount / d.total_procurement_amount) * 100)
    : 0

  const centreWorkload = d?.centres.map(c => ({
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="gov-header text-white px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wheat className="w-5 h-5 text-green-300" />
              <h1 className="font-bold text-lg">KrishiFlow District Dashboard</h1>
            </div>
            <p className="text-green-300 text-xs">Howrah District · All Procurement Centres</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {connected ? <><div className="live-dot" /><span className="text-green-200">LIVE</span></> : <span className="text-yellow-200">Reconnecting</span>}
            </div>
            <button onClick={load} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-green-200" />
            </button>
            <AdminProfileMenu user={user} logout={logout} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Today's KPIs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">Today's Overview</h2>
            <span className="text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Users} label="Farmers Served" value={d?.total_served_today} color="green" />
            <KpiCard icon={Clock} label="Currently Waiting" value={d?.currently_waiting} color="amber" />
            <KpiCard icon={TrendingUp} label="Processing Now" value={d?.currently_processing} color="blue" />
            <KpiCard icon={Clock} label="Avg Wait" value={`${Math.round(d?.avg_wait_minutes || 0)} min`} color="slate" />
            <KpiCard icon={Package} label="Total Quantity" value={`${(d?.total_quantity_tons || 0).toFixed(2)}t`} sub="metric tons" color="green" />
            <KpiCard icon={IndianRupee} label="Total Disbursed" value={`₹${((d?.total_procurement_amount || 0) / 1000).toFixed(1)}K`} sub={`${payPct}% paid`} color="amber" />
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Centre Workload */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4">Centre Workload Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={centreWorkload} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="waiting" name="Waiting" fill="#d97706" radius={[4,4,0,0]} />
                <Bar dataKey="served" name="Served Today" fill="#15803d" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4">Payment Settlement</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {paymentData.map((_, i) => <Cell key={i} fill={i === 0 ? '#15803d' : '#e2e8f0'} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '12px', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-green-700">{payPct}%</p>
                  <p className="text-sm text-slate-500">Paid</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-700" />
                    <span className="text-slate-600">Paid: ₹{(d?.total_paid_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <span className="text-slate-600">Pending: ₹{Math.max(0, (d?.total_procurement_amount || 0) - (d?.total_paid_amount || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly throughput */}
        {d?.hourly_throughput?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4">Hourly Procurement Throughput</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={d.hourly_throughput} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Line type="monotone" dataKey="served" name="Farmers Served" stroke="#15803d" strokeWidth={2.5} dot={{ fill: '#15803d', strokeWidth: 0, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Crop Breakdown */}
        {d?.crop_breakdown?.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-4">Procurement by Crop</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.crop_breakdown} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis dataKey="crop" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={60} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 13 }} />
                  <Bar dataKey="quantity_kg" name="Quantity (kg)" fill="#15803d" radius={[0,4,4,0]}>
                    {d.crop_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Centre table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-4">Centre Status</h3>
              <div className="divide-y divide-slate-100">
                {d?.centres.map(c => <CentreRow key={c.centre_id} centre={c} />)}
              </div>
            </div>
          </div>
        )}

        {/* Centres summary table fallback */}
        {!d?.crop_breakdown?.length && d?.centres?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4">Centre Status</h3>
            <div className="divide-y divide-slate-100">
              {d.centres.map(c => <CentreRow key={c.centre_id} centre={c} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

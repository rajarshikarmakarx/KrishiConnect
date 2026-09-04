import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { Wheat, Users, CheckCircle, Clock, X, Wifi, WifiOff, IndianRupee, User, LogOut, Building2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { useCentreQueue } from '../hooks/useRealtimeQueue'

function StatCard({ label, value, color = 'slate' }) {
  const colors = { slate: 'text-slate-800', green: 'text-green-700', orange: 'text-orange-600', red: 'text-red-600' }
  return (
    <div className="stat-card text-center">
      <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">{label}</div>
    </div>
  )
}

function OperatorProfileMenu({ user, logout, centreName }) {
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
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white max-w-[120px] truncate">{user.full_name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white text-sm">{user.full_name}</p>
            <p className="text-slate-300 text-xs">Procurement Officer · {user.mobile}</p>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{centreName || 'Assigned Centre'}</span>
            </div>
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

function CounterCard({ counter, onComplete, onStart }) {
  const hasEntry = !!counter.current_token
  return (
    <div className={`rounded-2xl border p-4 ${hasEntry ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-slate-600">{counter.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${hasEntry ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
          {hasEntry ? 'BUSY' : 'FREE'}
        </span>
      </div>
      {hasEntry ? (
        <div>
          <div className="token-display text-3xl font-bold text-orange-800 mb-1">{counter.current_token}</div>
          <p className="text-xs text-slate-500 mb-3 truncate">{counter.current_farmer_name}</p>
          <div className="flex gap-2">
            {counter.current_entry_status === 'CALLED' && (
              <button id={`btn-start-${counter.id}`} onClick={() => onStart(counter.current_queue_entry_id)}
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg font-semibold transition-colors">
                Start
              </button>
            )}
            <button id={`btn-complete-${counter.id}`} onClick={() => onComplete(counter.current_queue_entry_id, counter.current_token)}
              className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg font-semibold transition-colors">
              Complete ✓
            </button>
          </div>
        </div>
      ) : (
        <div className="text-slate-400 text-sm text-center py-2">No farmer assigned</div>
      )}
    </div>
  )
}

function CompleteModal({ queueId, token, onClose, onSuccess }) {
  const [acceptedQty, setAcceptedQty] = useState('')
  const [rate, setRate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const total = acceptedQty && rate ? (parseFloat(acceptedQty) * parseFloat(rate)).toFixed(2) : null

  const handleSubmit = async () => {
    if (!acceptedQty || !rate) return toast.error('Enter quantity and rate')
    setLoading(true)
    try {
      await api.completeProcurement(queueId, {
        accepted_quantity_kg: parseFloat(acceptedQty),
        rate_per_kg: parseFloat(rate),
        notes
      })
      toast.success(`✅ Token ${token} completed. Payment initiated.`)
      onSuccess()
    } catch (e) { toast.error(e.message || 'Failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Complete Procurement</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center">
            <span className="token-display text-3xl font-bold text-green-800 bg-green-50 px-4 py-2 rounded-xl inline-block">{token}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Accepted Quantity (kg) *</label>
            <input id="accepted-qty" type="number" placeholder="e.g. 242" value={acceptedQty} onChange={e => setAcceptedQty(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rate per kg (₹) *</label>
            <input id="rate-per-kg" type="number" placeholder="e.g. 23" value={rate} onChange={e => setRate(e.target.value)} className="input-field" />
          </div>
          {total && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-2xl font-bold text-green-700">₹{parseFloat(total).toLocaleString('en-IN')}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input id="proc-notes" type="text" placeholder="Any remarks" value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
          </div>
          <button id="btn-confirm-complete" onClick={handleSubmit} disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Complete & Generate Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OperatorApp() {
  const { user, logout } = useAuth()
  const centreId = user?.assigned_centre_id || 1
  const [queue, setQueue] = useState(null)
  const [centreDetail, setCentreDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [callingNext, setCallingNext] = useState(false)
  const [completeModal, setCompleteModal] = useState(null)
  const [payingId, setPayingId] = useState(null)

  const loadQueue = useCallback(async () => {
    try {
      const [q, c] = await Promise.all([
        api.getCentreQueue(centreId),
        api.getCentre(centreId)
      ])
      setQueue(q)
      setCentreDetail(c)
    } catch (e) { toast.error('Could not load queue') }
    finally { setLoading(false) }
  }, [centreId])

  const { connected, reconnecting } = useCentreQueue(centreId, loadQueue)

  useEffect(() => { loadQueue() }, [loadQueue])

  const handleCallNext = async () => {
    setCallingNext(true)
    try {
      const res = await api.callNext(centreId)
      if (res.token) {
        toast.success(`🔔 Called ${res.token} → ${res.counter}`)
        await loadQueue()
      } else {
        toast('No farmers waiting in queue', { icon: 'ℹ️' })
      }
    } catch (e) { toast.error(e.message || 'Failed to call next') }
    finally { setCallingNext(false) }
  }

  const handleStart = async (queueId) => {
    try {
      await api.startProcessing(queueId)
      toast.success('Processing started')
      await loadQueue()
    } catch (e) { toast.error(e.message) }
  }

  const handleCompleteSuccess = async () => {
    setCompleteModal(null)
    await loadQueue()
  }

  const handleMarkPaid = async (paymentId) => {
    setPayingId(paymentId)
    try {
      await api.markPaid(paymentId)
      toast.success('✅ Payment marked as Paid')
      await loadQueue()
    } catch (e) { toast.error(e.message) }
    finally { setPayingId(null) }
  }

  const waiting = queue?.entries.filter(e => e.status === 'WAITING') || []
  const processing = queue?.entries.filter(e => ['CALLED', 'PROCESSING'].includes(e.status)) || []

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="gov-header text-white px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wheat className="w-5 h-5 text-green-300" />
              <h1 className="font-bold text-lg">{queue?.centre_name || 'Procurement Centre'}</h1>
            </div>
            <p className="text-green-300 text-xs">Procurement Officer Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {reconnecting ? <><WifiOff className="w-3.5 h-3.5 text-yellow-300" /><span className="text-yellow-200">Reconnecting</span></>
                : <><div className="live-dot" /><span className="text-green-200">LIVE</span></>}
            </div>
            <OperatorProfileMenu user={user} logout={logout} centreName={queue?.centre_name} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Waiting" value={queue?.waiting_count || 0} color="slate" />
          <StatCard label="Processing" value={queue?.processing_count || 0} color="orange" />
          <StatCard label="Completed" value={queue?.completed_count || 0} color="green" />
          <StatCard label="Cancelled" value={queue?.cancelled_count || 0} color="red" />
        </div>

        {/* Active Counters */}
        {centreDetail?.counters?.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-3">Active Counters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {centreDetail.counters.filter(c => c.is_active).map(counter => {
                const activeEntry = processing.find(e => e.counter_id === counter.id)
                return (
                  <CounterCard
                    key={counter.id}
                    counter={{
                      ...counter,
                      current_token: activeEntry?.token || counter.current_token,
                      current_farmer_name: activeEntry?.farmer_name || counter.current_farmer_name,
                      current_queue_entry_id: activeEntry?.id || counter.current_queue_entry_id,
                      current_entry_status: activeEntry?.status
                    }}
                    onComplete={(id, token) => setCompleteModal({ queueId: id, token })}
                    onStart={handleStart}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Call Next */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900">Next in Queue</h2>
              <p className="text-sm text-slate-500">{waiting.length} farmer(s) waiting</p>
            </div>
            <button
              id="btn-call-next"
              onClick={handleCallNext}
              disabled={callingNext || waiting.length === 0}
              className="btn-saffron flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {callingNext ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📣'}
              Call Next Farmer
            </button>
          </div>

          {waiting.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No farmers waiting</p>
            </div>
          ) : (
            <div className="space-y-1">
              {waiting.slice(0, 8).map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs w-4 font-mono">{i + 1}</span>
                    <span className="token-display font-bold text-slate-800">{entry.token}</span>
                    <span className="text-slate-600 text-sm">{entry.farmer_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{entry.crop}</span>
                    <span className="text-slate-400 text-xs">{entry.expected_quantity_kg} kg</span>
                    <button
                      id={`btn-call-${entry.id}`}
                      onClick={async () => { try { await api.callSpecific(entry.id); toast.success(`Called ${entry.token}`); loadQueue() } catch(e){toast.error(e.message)} }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold transition-colors"
                    >Call</button>
                    <button
                      id={`btn-cancel-${entry.id}`}
                      onClick={async () => { if(!confirm('Cancel this entry?')) return; try { await api.cancelBooking(entry.id); toast.success('Cancelled'); loadQueue() } catch(e){toast.error(e.message)} }}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg transition-colors"
                    ><X className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              {waiting.length > 8 && <p className="text-xs text-center text-slate-400 pt-2">+{waiting.length - 8} more farmers waiting</p>}
            </div>
          )}
        </div>

        {/* Completed with pending payment */}
        <PaymentPanel centreId={centreId} onPay={handleMarkPaid} payingId={payingId} />
      </div>

      {completeModal && (
        <CompleteModal
          queueId={completeModal.queueId}
          token={completeModal.token}
          onClose={() => setCompleteModal(null)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  )
}

function PaymentPanel({ centreId, onPay, payingId }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    const load = async () => {
      try {
        const q = await api.getCentreQueue(centreId)
        const completed = q.entries.filter(e => e.status === 'COMPLETED')
        const withProc = await Promise.all(
          completed.slice(0, 5).map(async e => {
            try { const p = await api.getProcurement(e.id); return { entry: e, proc: p } }
            catch { return null }
          })
        )
        setItems(withProc.filter(Boolean).filter(i => i.proc?.payment?.status === 'PROCESSING'))
      } catch {}
    }
    load()
  }, [centreId, payingId])

  if (!items.length) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
        <IndianRupee className="w-4 h-4 text-amber-600" />
        Pending Payments
      </h2>
      <div className="space-y-2">
        {items.map(({ entry, proc }) => (
          <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-xl border border-amber-100">
            <div>
              <span className="token-display font-bold text-slate-700 mr-2">{entry.token}</span>
              <span className="text-slate-600 text-sm">{entry.farmer_name}</span>
              <span className="text-slate-500 text-xs ml-2">₹{proc.payment?.amount?.toLocaleString('en-IN')}</span>
            </div>
            <button
              id={`btn-pay-${proc.payment?.id}`}
              onClick={() => onPay(proc.payment?.id)}
              disabled={payingId === proc.payment?.id}
              className="btn-primary py-1.5 px-4 text-xs"
            >
              {payingId === proc.payment?.id ? '...' : 'Mark Paid ✅'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

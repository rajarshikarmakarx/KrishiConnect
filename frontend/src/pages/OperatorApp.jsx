import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { Wheat, Users, CheckCircle, Clock, X, Wifi, WifiOff, IndianRupee, User, LogOut, Building2, ChevronDown, Scale, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { useCentreQueue } from '../hooks/useRealtimeQueue'

const MSP_RATES = {
  'Paddy': 23.00,
  'Wheat': 22.75,
  'Mustard': 59.50,
  'Jute': 53.35,
  'Maize': 22.25,
  'Potato': 10.25,
  'Onion': 18.25
}

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
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
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
    <div className={`rounded-2xl border p-4 transition-all ${hasEntry ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-slate-600">{counter.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${hasEntry ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
          {hasEntry ? 'BUSY' : 'FREE'}
        </span>
      </div>
      {hasEntry ? (
        <div>
          <div className="token-display text-3xl font-bold text-orange-800 mb-1">{counter.current_token}</div>
          <p className="text-xs text-slate-600 mb-1 truncate font-medium">{counter.current_farmer_name}</p>
          {counter.current_crop && (
            <p className="text-[11px] text-slate-500 mb-3">
              {counter.current_crop} · {counter.current_expected_qty} kg expected
            </p>
          )}
          <div className="flex gap-2">
            {counter.current_entry_status === 'CALLED' && (
              <button
                id={`btn-start-${counter.id}`}
                onClick={() => onStart(counter.current_queue_entry_id)}
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg font-semibold transition-colors"
              >
                Start
              </button>
            )}
            <button
              id={`btn-complete-${counter.id}`}
              onClick={() => onComplete(counter.current_queue_entry_id, counter.current_token, counter.current_crop, counter.current_expected_qty)}
              className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg font-semibold transition-colors"
            >
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

function CompleteModal({ queueId, token, crop, expectedQty, onClose, onSuccess }) {
  const mspRate = crop && MSP_RATES[crop] ? MSP_RATES[crop] : (MSP_RATES['Paddy'] || 23.00)
  const [acceptedQty, setAcceptedQty] = useState(expectedQty ? String(expectedQty) : '')
  const [rate, setRate] = useState(String(mspRate))
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
    } catch (e) {
      toast.error(e.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Complete Procurement</h3>
            {crop && <p className="text-xs text-slate-500">{crop} Procurement</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center">
            <span className="token-display text-3xl font-bold text-green-800 bg-green-50 px-4 py-2 rounded-xl inline-block">{token}</span>
          </div>

          {/* MSP Rate Helper Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Govt MSP ({crop || 'Crop'}): <strong>₹{mspRate.toFixed(2)}/kg</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setRate(String(mspRate))}
              className="text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded font-bold transition-colors"
            >
              Apply MSP
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Accepted Quantity (kg) *</label>
            <input
              id="accepted-qty"
              type="number"
              step="0.1"
              placeholder="e.g. 242"
              value={acceptedQty}
              onChange={e => setAcceptedQty(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rate per kg (₹) *</label>
            <input
              id="rate-per-kg"
              type="number"
              step="0.01"
              placeholder="e.g. 23"
              value={rate}
              onChange={e => setRate(e.target.value)}
              className="input-field"
            />
          </div>
          {total && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Payout Amount</p>
              <p className="text-2xl font-bold text-green-700">₹{parseFloat(total).toLocaleString('en-IN')}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input
              id="proc-notes"
              type="text"
              placeholder="Grade, moisture, or weighing notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            id="btn-confirm-complete"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Complete & Generate Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CancelConfirmModal({ entry, onClose, onConfirm, loading }) {
  if (!entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-scale-in">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Queue Booking?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will remove the farmer from the active queue and cancel their token.
            </p>
          </div>

          {/* Farmer & Token Preview */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Token Number</span>
              <span className="token-display font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 text-sm">
                {entry.token}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Farmer Name</span>
              <span className="font-semibold text-slate-800">{entry.farmer_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Crop & Quantity</span>
              <span className="text-slate-700 font-medium">{entry.crop} · {entry.expected_quantity_kg} kg</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
            >
              Keep in Queue
            </button>
            <button
              type="button"
              id="btn-confirm-cancel-entry"
              onClick={() => onConfirm(entry.id)}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Yes, Cancel Booking'
              )}
            </button>
          </div>
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
  const [callingId, setCallingId] = useState(null)
  const [completeModal, setCompleteModal] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [payingId, setPayingId] = useState(null)

  const loadQueue = useCallback(async () => {
    try {
      const [q, c] = await Promise.all([
        api.getCentreQueue(centreId),
        api.getCentre(centreId)
      ])
      setQueue(q)
      setCentreDetail(c)
    } catch (e) {
      toast.error('Could not load queue')
    } finally {
      setLoading(false)
    }
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
    } catch (e) {
      toast.error(e.message || 'Failed to call next')
    } finally {
      setCallingNext(false)
    }
  }

  const handleCallSpecific = async (entry) => {
    setCallingId(entry.id)
    try {
      const res = await api.callSpecific(entry.id)
      toast.success(`🔔 Called ${res.token} → ${res.counter || 'counter'}`)
      await loadQueue()
    } catch (e) {
      toast.error(e.message || 'Could not call farmer')
    } finally {
      setCallingId(null)
    }
  }

  const handleConfirmCancel = async (queueId) => {
    setCancelling(true)
    try {
      await api.cancelBooking(queueId)
      toast.success('✅ Booking cancelled successfully')
      setCancelModal(null)
      await loadQueue()
    } catch (e) {
      toast.error(e.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleStart = async (queueId) => {
    try {
      await api.startProcessing(queueId)
      toast.success('Processing started')
      await loadQueue()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleCompleteSuccess = async () => {
    setCompleteModal(null)
    await loadQueue()
  }

  const handleMarkPaid = async (paymentId, token, amount) => {
    setPayingId(paymentId)
    try {
      await api.markPaid(paymentId)
      toast.success(`🏛️ Govt Payment of ₹${amount?.toLocaleString('en-IN')} for ${token} completed & disbursed!`, {
        duration: 6000,
        icon: '✅'
      })
      await loadQueue()
    } catch (e) {
      toast.error(e.message || 'Failed to disburse payment')
    } finally {
      setPayingId(null)
    }
  }

  const waiting = queue?.entries.filter(e => e.status === 'WAITING') || []
  const processing = queue?.entries.filter(e => ['CALLED', 'PROCESSING'].includes(e.status)) || []

  const activeCounters = centreDetail?.counters?.filter(c => c.is_active) || []
  const occupiedCount = activeCounters.filter(c => processing.some(e => e.counter_id === c.id)).length
  const allCountersOccupied = activeCounters.length > 0 && occupiedCount >= activeCounters.length

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="gov-header text-white px-4 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wheat className="w-5 h-5 text-green-300" />
              <h1 className="font-bold text-lg">{queue?.centre_name || 'Procurement Centre'}</h1>
            </div>
            <p className="text-green-300 text-xs">Procurement Officer Dashboard · Real-time Counter Manager</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              {reconnecting ? (
                <><WifiOff className="w-3.5 h-3.5 text-yellow-300" /><span className="text-yellow-200">Reconnecting</span></>
              ) : (
                <><div className="live-dot" /><span className="text-green-200 font-semibold">LIVE</span></>
              )}
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
        {activeCounters.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900">Active Procurement Counters</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                allCountersOccupied
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {occupiedCount} of {activeCounters.length} Counters Occupied
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeCounters.map(counter => {
                const activeEntry = processing.find(e => e.counter_id === counter.id)
                return (
                  <CounterCard
                    key={counter.id}
                    counter={{
                      ...counter,
                      current_token: activeEntry?.token || counter.current_token,
                      current_farmer_name: activeEntry?.farmer_name || counter.current_farmer_name,
                      current_queue_entry_id: activeEntry?.id || counter.current_queue_entry_id,
                      current_entry_status: activeEntry?.status,
                      current_crop: activeEntry?.crop,
                      current_expected_qty: activeEntry?.expected_quantity_kg
                    }}
                    onComplete={(id, token, crop, expectedQty) => setCompleteModal({ queueId: id, token, crop, expectedQty })}
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
              <p className="text-sm text-slate-500">
                {waiting.length} farmer(s) waiting
                {allCountersOccupied && <span className="text-amber-600 font-medium ml-2">· All counters busy</span>}
              </p>
            </div>
            <button
              id="btn-call-next"
              onClick={handleCallNext}
              disabled={callingNext || waiting.length === 0 || allCountersOccupied}
              title={allCountersOccupied ? "Cannot call: All counters are occupied" : "Call the next waiting farmer"}
              className="btn-saffron flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {callingNext ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📣'}
              {allCountersOccupied ? 'All Counters Busy' : 'Call Next Farmer'}
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
                    <span className="text-slate-700 text-sm font-medium">{entry.farmer_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">{entry.crop}</span>
                    <span className="text-slate-500 text-xs">{entry.expected_quantity_kg} kg</span>
                    <button
                      id={`btn-call-${entry.id}`}
                      onClick={() => handleCallSpecific(entry)}
                      disabled={callingId === entry.id || allCountersOccupied}
                      title={allCountersOccupied ? "All counters occupied" : `Call ${entry.token}`}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {callingId === entry.id ? (
                        <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Call'
                      )}
                    </button>
                    <button
                      id={`btn-cancel-${entry.id}`}
                      onClick={() => setCancelModal(entry)}
                      title="Cancel this booking"
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {waiting.length > 8 && <p className="text-xs text-center text-slate-400 pt-2 font-medium">+{waiting.length - 8} more farmers waiting</p>}
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
          crop={completeModal.crop}
          expectedQty={completeModal.expectedQty}
          onClose={() => setCompleteModal(null)}
          onSuccess={handleCompleteSuccess}
        />
      )}

      {cancelModal && (
        <CancelConfirmModal
          entry={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={handleConfirmCancel}
          loading={cancelling}
        />
      )}
    </div>
  )
}

function PaymentPanel({ centreId, onPay, payingId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getPendingPayments(centreId)
      setItems(data || [])
    } catch {} finally {
      setLoading(false)
    }
  }, [centreId])

  useEffect(() => {
    load()
  }, [load, payingId])

  useCentreQueue(centreId, load)

  if (!items.length) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-600" />
          Direct Benefit Transfer (DBT) Payout Settlement
        </h2>
        <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
          {items.length} Pending Disbursal
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Authorise instant government payment credit to farmer bank accounts via PFMS / e-Kuber gateway.
      </p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.payment_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-xl border border-emerald-200 transition-colors gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="token-display font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-emerald-300 text-sm">
                  {item.token}
                </span>
                <span className="text-slate-800 font-semibold text-sm">{item.farmer_name}</span>
                <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                  {item.crop} · {item.accepted_quantity_kg} kg @ ₹{item.rate_per_kg}/kg
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Procurement verified · Direct payout due: <strong className="text-emerald-800 text-sm font-bold">₹{item.amount?.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <button
              id={`btn-pay-${item.payment_id}`}
              onClick={() => onPay(item.payment_id, item.token, item.amount)}
              disabled={payingId === item.payment_id}
              className="btn-primary py-2 px-4 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-emerald-700 hover:bg-emerald-800"
            >
              {payingId === item.payment_id ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '🏛️ Confirm Govt Payment Disbursal'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

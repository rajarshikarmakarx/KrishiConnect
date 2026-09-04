import { useState, useEffect, useCallback } from 'react'
import { Ticket, Clock, Users, Wifi, WifiOff, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useCentreQueue } from '../../hooks/useRealtimeQueue'

function QueueRow({ entry, isYou, isCurrent }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-all ${
      isYou ? 'bg-green-50 border border-green-200' :
      isCurrent ? 'bg-orange-50 border border-orange-200' :
      'hover:bg-slate-50'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`token-display font-bold text-sm ${isYou ? 'text-green-700' : isCurrent ? 'text-orange-700' : 'text-slate-600'}`}>
          {entry.token}
        </span>
        {isYou && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">YOU</span>}
        {isCurrent && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">NOW</span>}
      </div>
      <span className={`text-xs font-medium ${
        entry.status === 'PROCESSING' ? 'text-orange-600' :
        entry.status === 'CALLED' ? 'text-blue-600' : 'text-slate-400'
      }`}>{entry.status}</span>
    </div>
  )
}

export default function LiveQueueScreen({ queueStatus: initialStatus, onRefresh }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(initialStatus?.notification)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getMyActiveQueue()
      if (data) {
        setStatus(data)
        if (data.notification && data.notification !== notification) {
          setNotification(data.notification)
          toast(data.notification, { duration: 8000, icon: '🔔' })
        }
      }
      if (onRefresh) onRefresh()
    } catch {} finally {
      setLoading(false)
    }
  }, [notification, onRefresh])

  const { connected, reconnecting } = useCentreQueue(
    status?.queue_entry?.centre_id,
    useCallback(() => { refresh() }, [refresh])
  )

  useEffect(() => {
    if (initialStatus?.notification) {
      toast(initialStatus.notification, { duration: 8000, icon: '🔔' })
    }
  }, [])

  if (!status) return null

  const { queue_entry: entry, farmers_ahead, estimated_wait_minutes, currently_serving_token } = status
  const eta = Math.round(estimated_wait_minutes)
  const isActive = ['WAITING', 'CALLED', 'PROCESSING'].includes(entry.status)

  // Get surrounding queue entries for display
  const centreEntries = []

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Notification banner */}
      {notification && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-amber-800 text-sm font-medium">{notification}</p>
        </div>
      )}

      {/* Main queue card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Centre header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{entry.centre_name}</h2>
            <div className="flex items-center gap-1.5 text-xs">
              {reconnecting ? (
                <><WifiOff className="w-3.5 h-3.5 text-yellow-300" /><span className="text-yellow-200">Reconnecting...</span></>
              ) : (
                <><div className="live-dot" /><span className="text-green-200">LIVE</span></>
              )}
            </div>
          </div>
          <p className="text-green-300 text-xs mt-0.5">{entry.slot_start_time} – {entry.slot_end_time} · {entry.crop}</p>
        </div>

        <div className="p-5">
          {/* Token display */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Your Token</p>
              <p className="token-display text-4xl font-bold text-green-800">{entry.token}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                entry.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                entry.status === 'CALLED' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>{entry.status}</span>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Serving Now</p>
              <p className="token-display text-4xl font-bold text-slate-700">{currently_serving_token || '—'}</p>
              <p className="text-xs text-slate-400 mt-1">At counter</p>
            </div>
          </div>

          {/* Stats row */}
          {entry.status === 'WAITING' && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Users className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xl font-bold text-slate-800">{farmers_ahead}</p>
                  <p className="text-xs text-slate-500">farmers ahead</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xl font-bold text-amber-700">~{eta} min</p>
                  <p className="text-xs text-slate-500">estimated wait</p>
                </div>
              </div>
            </div>
          )}

          {entry.status === 'CALLED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-blue-800 font-bold text-lg">🔔 Your turn!</p>
              <p className="text-blue-600 text-sm mt-1">Please proceed to {entry.counter_label || 'the counter'}</p>
            </div>
          )}

          {entry.status === 'PROCESSING' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-orange-800 font-bold text-lg">⚙️ Processing your procurement</p>
              <p className="text-orange-600 text-sm mt-1">Please wait at {entry.counter_label || 'the counter'}</p>
            </div>
          )}

          <button
            id="btn-refresh-queue"
            onClick={refresh}
            disabled={loading}
            className="w-full py-2 text-sm text-slate-500 hover:text-green-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : null}
            {connected ? '🟢 Queue updates automatically' : '🟡 Reconnecting...'}
          </button>
        </div>
      </div>
    </div>
  )
}

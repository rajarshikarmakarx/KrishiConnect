import { useState, useEffect, useCallback } from 'react'
import { Ticket, Clock, Users, Wifi, WifiOff, Bell, Sparkles } from 'lucide-react'
import api from '../../api'
import { useTranslation } from '../../i18n'
import { useCentreQueue } from '../../hooks/useRealtimeQueue'
import CompletionConfirmation from './CompletionConfirmation'

export default function LiveQueueScreen({ queueStatus: initialStatus, onRefresh }) {
  const { t, translateCrop } = useTranslation()
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(initialStatus?.notification)

  // Sync prop updates into internal state
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus)
      if (initialStatus.notification && initialStatus.notification !== notification) {
        setNotification(initialStatus.notification)
      }
    }
  }, [initialStatus, notification])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getMyActiveQueue()
      if (data) {
        setStatus(data)
        if (data.notification && data.notification !== notification) {
          setNotification(data.notification)
        }
      }
      if (onRefresh) onRefresh()
    } catch {} finally {
      setLoading(false)
    }
  }, [notification, onRefresh])

  // Live polling heartbeat during active processing or called status
  useEffect(() => {
    const entryStatus = status?.queue_entry?.status
    if (entryStatus === 'CALLED' || entryStatus === 'PROCESSING') {
      const interval = setInterval(() => {
        refresh()
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [status?.queue_entry?.status, refresh])

  const { connected, reconnecting } = useCentreQueue(
    status?.queue_entry?.centre_id,
    useCallback(() => { refresh() }, [refresh])
  )

  if (!status) return null

  // If completed, transition directly to completion confirmation
  if (status.queue_entry?.status === 'COMPLETED') {
    return <CompletionConfirmation queueEntry={status.queue_entry} />
  }

  const { queue_entry: entry, farmers_ahead, estimated_wait_minutes, currently_serving_token } = status
  const eta = Math.round(estimated_wait_minutes)

  const getStatusBadgeText = (st) => {
    switch (st) {
      case 'WAITING':
        return t('queue.status_waiting')
      case 'CALLED':
        return t('queue.status_called')
      case 'PROCESSING':
        return t('queue.status_processing')
      case 'DEFERRED_SUN_DRYING':
        return t('queue.sun_drying_grace_badge')
      case 'REJECTED':
        return t('queue.status_rejected')
      case 'COMPLETED':
        return t('queue.status_completed')
      case 'CANCELLED':
        return t('queue.status_cancelled')
      default:
        return st
    }
  }

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
                <><WifiOff className="w-3.5 h-3.5 text-yellow-300" /><span className="text-yellow-200">{t('common.reconnecting')}</span></>
              ) : (
                <><div className="live-dot" /><span className="text-green-200">{t('common.live')}</span></>
              )}
            </div>
          </div>
          <p className="text-green-300 text-xs mt-0.5">{entry.slot_start_time} – {entry.slot_end_time} · {translateCrop(entry.crop)}</p>
        </div>

        <div className="p-5">
          {/* Token display */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-[11px] sm:text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">{t('queue.your_token')}</p>
              <p className="token-display text-2xl sm:text-4xl font-bold text-green-800 truncate">{entry.token}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                entry.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                entry.status === 'CALLED' ? 'bg-blue-100 text-blue-700' :
                entry.status === 'PROCESSING' ? 'bg-orange-100 text-orange-700' :
                entry.status === 'DEFERRED_SUN_DRYING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                entry.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-300' :
                'bg-slate-100 text-slate-700'
              }`}>{getStatusBadgeText(entry.status)}</span>
            </div>
            <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('queue.serving_now')}</p>
              <p className="token-display text-2xl sm:text-4xl font-bold text-slate-700 truncate">{currently_serving_token || '—'}</p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">{t('queue.at_counter')}</p>
            </div>
          </div>

          {/* Stats row */}
          {entry.status === 'WAITING' && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Users className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xl font-bold text-slate-800">{farmers_ahead}</p>
                  <p className="text-xs text-slate-500">{t('queue.farmers_ahead')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100/60">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl font-bold text-amber-700">~{eta} {t('common.min')}</p>
                    <span className="text-[9px] bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> {t('queue.ai_ema')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{t('queue.estimated_wait')}</p>
                </div>
              </div>
            </div>
          )}

          {entry.status === 'CALLED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center animate-pulse">
              <p className="text-blue-800 font-bold text-lg">{t('queue.your_turn')}</p>
              <p className="text-blue-600 text-sm mt-1">
                {t('queue.proceed_to_counter', { counter: entry.counter_label || t('queue.default_counter') })}
              </p>
            </div>
          )}

          {entry.status === 'PROCESSING' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-orange-800 font-bold text-lg">{t('queue.processing_procurement')}</p>
              <p className="text-orange-600 text-sm mt-1">
                {t('queue.weighing_and_grading', { counter: entry.counter_label || t('queue.default_counter') })}
              </p>
            </div>
          )}

          {entry.status === 'DEFERRED_SUN_DRYING' && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-1">
                <span>{t('queue.sun_drying_grace_title')}</span>
              </div>
              <p className="text-amber-900 text-xs sm:text-sm">
                {t('queue.sun_drying_grace_desc', { moisture: entry.assay_record?.moisture_percentage ?? '18+' })}
              </p>
            </div>
          )}

          {entry.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800 font-bold text-base mb-1">
                <span>{t('queue.lot_rejected_title')}</span>
              </div>
              <p className="text-red-900 text-xs sm:text-sm">
                {entry.assay_record?.rejection_reason || t('queue.lot_rejected_default_desc')}
              </p>
            </div>
          )}

          <button
            id="btn-refresh-queue"
            onClick={refresh}
            disabled={loading}
            className="w-full py-2 text-sm text-slate-500 hover:text-green-700 transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
          >
            {loading ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : null}
            {connected ? t('queue.live_auto_updating') : t('queue.reconnecting_status')}
          </button>
        </div>
      </div>
    </div>
  )
}

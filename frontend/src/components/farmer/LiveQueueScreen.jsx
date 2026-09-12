import { useState, useEffect, useCallback } from 'react'
import { Ticket, Clock, Users, Wifi, WifiOff, Bell, Sparkles, Zap } from 'lucide-react'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useTranslation } from '../../i18n'
import { useCentreQueue } from '../../hooks/useRealtimeQueue'
import CompletionConfirmation from './CompletionConfirmation'
import MandiRouteMap from './MandiRouteMap'

export default function LiveQueueScreen({ queueStatus: initialStatus, onRefresh }) {
  const { user } = useAuth()
  const { t, translateCrop, translateCentreName, translateCounter, formatTimeSlot, formatNumber } = useTranslation()
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
      {/* Priority Bump Notification Banner */}
      {entry?.is_bumped && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <p className="text-amber-900 dark:text-amber-200 text-sm font-bold">Fast-Track Priority Authorized by Gate Assayer</p>
            <p className="text-amber-800/90 dark:text-amber-300/90 text-xs mt-0.5">
              Reason: <span className="font-semibold">{entry.bump_reason}</span>
            </p>
          </div>
        </div>
      )}

      {/* General Notification banner */}
      {notification && !entry?.is_bumped && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-amber-800 text-sm font-medium">{notification}</p>
        </div>
      )}

      {/* Main queue card */}
      <div className="bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all">
        {/* Centre header */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/10 dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] px-5 py-4 border-b border-emerald-100/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 dark:text-white font-display">{translateCentreName(entry.centre_name)}</h2>
            <div className="flex items-center gap-1.5 text-xs">
              {reconnecting ? (
                <><WifiOff className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-700 dark:text-amber-300 font-semibold">{t('common.reconnecting')}</span></>
              ) : (
                <><div className="live-dot shrink-0" /><span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t('common.live')}</span></>
              )}
            </div>
          </div>
          <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-0.5 font-medium">{formatTimeSlot(entry.slot_start_time, entry.slot_end_time)} · {translateCrop(entry.crop)}</p>
        </div>

        <div className="p-5">
          {/* Token display */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div className="text-center p-3.5 sm:p-5 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-3xl border border-emerald-200/80 dark:border-emerald-500/20 shadow-2xs">
              <p className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">{t('queue.your_token')}</p>
              <p className="token-display text-2xl sm:text-4xl font-black font-display text-emerald-700 dark:text-emerald-400 truncate">{entry.token}</p>
              <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border ${
                entry.status === 'WAITING' ? 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' :
                entry.status === 'CALLED' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30' :
                entry.status === 'PROCESSING' ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30' :
                entry.status === 'DEFERRED_SUN_DRYING' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' :
                entry.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/30' :
                'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>{getStatusBadgeText(entry.status)}</span>
              {entry.is_bumped && (
                <div className="mt-2 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                    <Zap className="w-2.5 h-2.5 fill-current text-amber-600 dark:text-amber-400" />
                    Priority Bumped
                  </span>
                </div>
              )}
            </div>
            <div className="text-center p-3.5 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('queue.serving_now')}</p>
              <p className="token-display text-2xl sm:text-4xl font-black font-display text-slate-900 dark:text-slate-100 truncate">{currently_serving_token || '—'}</p>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{t('queue.at_counter')}</p>
            </div>
          </div>

          {/* Stats row */}
          {entry.status === 'WAITING' && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-white/10">
                <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-xl sm:text-2xl font-black font-display text-slate-800 dark:text-slate-100">{formatNumber(farmers_ahead)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('queue.farmers_ahead')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-white/10">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl sm:text-2xl font-black font-display text-amber-600 dark:text-amber-400">~{formatNumber(eta)} {t('common.min')}</p>
                    <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> {t('queue.ai_ema')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('queue.estimated_wait')}</p>
                </div>
              </div>
            </div>
          )}

          {entry.status === 'CALLED' && (
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-4 mb-4 text-center animate-pulse">
              <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">{t('queue.your_turn')}</p>
              <p className="text-blue-600/80 dark:text-blue-300 text-sm mt-1">
                {t('queue.proceed_to_counter', { counter: translateCounter(entry.counter_label) })}
              </p>
            </div>
          )}

          {entry.status === 'PROCESSING' && (
            <div className="bg-orange-500/10 border border-orange-500/25 rounded-2xl p-4 mb-4 text-center">
              <p className="text-orange-600 dark:text-orange-400 font-bold text-lg">{t('queue.processing_procurement')}</p>
              <p className="text-orange-600/80 dark:text-orange-300 text-sm mt-1">
                {t('queue.weighing_and_grading', { counter: translateCounter(entry.counter_label) })}
              </p>
            </div>
          )}

          {entry.status === 'DEFERRED_SUN_DRYING' && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-base mb-1">
                <span>{t('queue.sun_drying_grace_title')}</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm leading-relaxed">
                {t('queue.sun_drying_grace_desc', { moisture: formatNumber(entry.assay_record?.moisture_percentage) || '18+' })}
              </p>
            </div>
          )}

          {entry.status === 'REJECTED' && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-base mb-1">
                <span>{t('queue.lot_rejected_title')}</span>
              </div>
              <p className="text-red-800 dark:text-red-300 text-xs sm:text-sm leading-relaxed">
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

      {/* Mandi Route & Navigation Window */}
      <MandiRouteMap
        centre={entry}
        farmerVillage={user?.village}
        farmerDistrict={user?.district}
        defaultExpanded={false}
      />
    </div>
  )
}


import { CheckCircle, MapPin, Clock } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useAuth } from '../../AuthContext'
import MandiRouteMap from './MandiRouteMap'

export default function BookingToken({ entry, onContinue }) {
  const { user } = useAuth()
  const { t, translateCrop, translateCentreName, formatTimeSlot, formatNumber } = useTranslation()

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/10 dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] px-5 py-6 text-center border-b border-emerald-100/80 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-700 dark:text-emerald-400 shadow-inner">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-xl text-slate-900 dark:text-white font-display">{t('token.booking_confirmed')}</h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 uppercase tracking-wider font-bold">{t('token.your_queue_token')}</p>
          <div className="token-display text-4xl sm:text-7xl font-black font-display text-emerald-700 dark:text-emerald-400 mb-5 py-5 px-3 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-3xl border border-emerald-200/80 dark:border-emerald-500/25 truncate shadow-inner">
            {entry.token}
          </div>
          <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 mb-6">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-900 dark:text-slate-200">{translateCentreName(entry.centre_name)}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>{formatTimeSlot(entry.slot_start_time, entry.slot_end_time)}</span>
            </div>
            <p><span className="font-semibold text-slate-900 dark:text-slate-200">{translateCrop(entry.crop)}</span> · {formatNumber(entry.expected_quantity_kg)} {t('common.kg')}</p>
          </div>
          <button id="btn-view-queue" onClick={onContinue} className="btn-primary w-full cursor-pointer rounded-full py-3.5 font-bold shadow-lg shadow-emerald-700/20">{t('token.view_live_queue')}</button>
        </div>
      </div>

      {/* Interactive Mandi Routing Window */}
      <MandiRouteMap
        centre={entry}
        farmerVillage={user?.village}
        farmerDistrict={user?.district}
        defaultExpanded={true}
      />
    </div>
  )
}


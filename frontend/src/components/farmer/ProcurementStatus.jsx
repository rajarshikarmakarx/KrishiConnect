import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, IndianRupee } from 'lucide-react'
import api from '../../api'
import { useTranslation } from '../../i18n'
import { useCentreQueue } from '../../hooks/useRealtimeQueue'

export default function ProcurementStatus({ queueEntry }) {
  const { t, translateCrop, formatNumber } = useTranslation()
  const [proc, setProc] = useState(null)

  const load = useCallback(() => {
    if (queueEntry?.id) {
      api.getProcurement(queueEntry.id).then(setProc).catch(() => {})
    }
  }, [queueEntry?.id])

  useEffect(() => {
    load()
  }, [load])

  useCentreQueue(queueEntry?.centre_id, load)

  if (!proc) return null

  const steps = [
    { label: t('procurement.step_booked'), done: true },
    { label: t('procurement.step_waiting'), done: true },
    { label: t('procurement.step_called'), done: ['CALLED','PROCESSING','COMPLETED'].includes(queueEntry.status) },
    { label: t('procurement.step_processing'), done: ['PROCESSING','COMPLETED'].includes(queueEntry.status) },
    { label: t('procurement.step_completed'), done: queueEntry.status === 'COMPLETED' },
  ]

  const isPaid = proc.payment?.status === 'PAID'

  return (
    <div className="bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
        <h3 className="font-bold text-slate-900 dark:text-white font-display">{t('procurement.title')}</h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Progress steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${step.done ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-transparent'}`}>
                {step.done && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              {i < steps.length - 1 && (
                <div className={`absolute h-0.5 w-full ${step.done ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`} style={{display:'none'}} />
              )}
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 text-center leading-tight">{step.label}</p>
            </div>
          ))}
        </div>

        {/* Procurement details */}
        {proc.accepted_quantity_kg && (
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 space-y-2 text-sm border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('procurement.crop')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{translateCrop(proc.crop)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('procurement.expected')}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(proc.expected_quantity_kg)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('procurement.accepted')}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(proc.accepted_quantity_kg)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('procurement.rate')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{formatNumber(proc.rate_per_kg)} {t('common.per_kg')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/70 dark:border-slate-800 pt-2.5 mt-2.5">
              <span className="font-bold text-slate-900 dark:text-slate-100">{t('procurement.total_amount')}</span>
              <span className="font-black font-display text-emerald-600 dark:text-emerald-400 text-lg">₹{formatNumber(proc.total_amount?.toLocaleString('en-IN'))}</span>
            </div>
          </div>
        )}

        {/* Payment status */}
        {proc.payment && (
          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            isPaid
              ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/30'
              : 'bg-amber-500/10 dark:bg-amber-950/25 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <IndianRupee className={`w-5 h-5 ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">₹{formatNumber(proc.payment.amount?.toLocaleString('en-IN'))}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('procurement.payment')}</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isPaid
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
            }`}>
              {isPaid ? t('procurement.paid_badge') : t('procurement.processing_badge')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

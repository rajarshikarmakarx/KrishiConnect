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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">{t('procurement.title')}</h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Progress steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${step.done ? 'bg-green-600 border-green-600' : 'border-slate-300 bg-white'}`}>
                {step.done && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              {i < steps.length - 1 && (
                <div className={`absolute h-0.5 w-full ${step.done ? 'bg-green-600' : 'bg-slate-200'}`} style={{display:'none'}} />
              )}
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 text-center leading-tight">{step.label}</p>
            </div>
          ))}
        </div>

        {/* Procurement details */}
        {proc.accepted_quantity_kg && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('procurement.crop')}</span>
              <span className="font-medium">{translateCrop(proc.crop)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('procurement.expected')}</span>
              <span className="font-medium">{formatNumber(proc.expected_quantity_kg)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('procurement.accepted')}</span>
              <span className="font-medium">{formatNumber(proc.accepted_quantity_kg)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('procurement.rate')}</span>
              <span className="font-medium">₹{formatNumber(proc.rate_per_kg)} {t('common.per_kg')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
              <span className="font-bold text-slate-800">{t('procurement.total_amount')}</span>
              <span className="font-bold text-green-700 text-base">₹{formatNumber(proc.total_amount?.toLocaleString('en-IN'))}</span>
            </div>
          </div>
        )}

        {/* Payment status */}
        {proc.payment && (
          <div className={`flex items-center justify-between p-4 rounded-xl border ${isPaid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2">
              <IndianRupee className={`w-5 h-5 ${isPaid ? 'text-green-600' : 'text-amber-600'}`} />
              <div>
                <p className="font-bold text-slate-900">₹{formatNumber(proc.payment.amount?.toLocaleString('en-IN'))}</p>
                <p className="text-xs text-slate-500">{t('procurement.payment')}</p>
              </div>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isPaid ? t('procurement.paid_badge') : t('procurement.processing_badge')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

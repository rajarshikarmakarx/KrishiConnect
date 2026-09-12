import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, IndianRupee, Download, Calendar, MapPin, ShieldCheck, Printer, FileCheck, Sparkles, RefreshCw, AlertCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useTranslation } from '../../i18n'
import { useCentreQueue } from '../../hooks/useRealtimeQueue'
import PrintInvoiceModal from './PrintInvoiceModal'

export default function CompletionConfirmation({ queueEntry }) {
  const { user } = useAuth()
  const { t, translateCrop, translateCentreName, formatNumber } = useTranslation()
  const [proc, setProc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const isFirstLoadRef = useRef(true)
  const prevPaidStatusRef = useRef(false)

  const loadProcurement = useCallback(async () => {
    if (!queueEntry?.id) return
    try {
      setLoading(true)
      setError(null)
      const data = await api.getProcurement(queueEntry.id)
      if (data) {
        setProc(data)
        const currentlyPaid = data.payment?.status === 'PAID'
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false
          prevPaidStatusRef.current = currentlyPaid
        } else if (currentlyPaid && !prevPaidStatusRef.current) {
          prevPaidStatusRef.current = true
          toast.success(t('toasts.dbt_settled_toast', { token: queueEntry.token }), {
            id: `dbt-settled-${queueEntry.id}`,
            duration: 4000,
          })
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load procurement')
    } finally {
      setLoading(false)
    }
  }, [queueEntry?.id, queueEntry?.token, t])

  useEffect(() => {
    loadProcurement()
  }, [loadProcurement])

  // Real-time synchronization via Centre WebSocket channel
  useCentreQueue(queueEntry?.centre_id, loadProcurement)

  // 3. Fallback polling every 2s until payment is confirmed PAID
  useEffect(() => {
    const isPaid = proc?.payment?.status === 'PAID'
    if (isPaid || !queueEntry?.id) return

    const pollTimer = setInterval(() => {
      loadProcurement()
    }, 2000)

    return () => clearInterval(pollTimer)
  }, [proc?.payment?.status, queueEntry?.id, loadProcurement])

  // Fallback values in case network request is in flight
  const displayCrop = proc?.crop || queueEntry?.crop || 'Paddy'
  const displayExpectedQty = proc?.expected_quantity_kg || queueEntry?.expected_quantity_kg || 200
  const displayAcceptedQty = proc?.accepted_quantity_kg || queueEntry?.expected_quantity_kg || 200
  const displayRate = proc?.rate_per_kg || 23.0
  const displayTotal = proc?.total_amount || (displayAcceptedQty * displayRate)
  const isPaid = proc?.payment?.status === 'PAID'

  const dbtRefNumber = proc?.payment?.id
    ? `WB-DBT-2025-${String(proc.payment.id).padStart(6, '0')}`
    : `WB-DBT-2025-${String(queueEntry.id).padStart(6, '0')}`

  const handlePrint = () => {
    window.print()
  }

  const completedDateFormatted = queueEntry.completed_at
    ? new Date(queueEntry.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : t('common.today')

  return (
    <div className="bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden animate-fade-in print:border-none print:shadow-none transition-all">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/10 dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] px-6 py-6 text-center border-b border-emerald-100/80 dark:border-white/10">
        <div className="flex justify-center mb-3">
          <div className="bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 backdrop-blur-md rounded-2xl p-3.5 text-emerald-700 dark:text-emerald-400 shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 tracking-tight text-slate-900 dark:text-white font-display">{t('completion.title')}</h2>
        <p className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium">
          {t('common.gov_dept')} · {t('common.gov_title')}
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Token & Centre Info */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">{t('completion.token_number')}</p>
              <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-slate-100 token-display">{queueEntry.token}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">{t('completion.procurement_centre')}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{translateCentreName(queueEntry.centre_name)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{t('completion.completed_on', { date: completedDateFormatted })}</span>
            </div>
            {loading && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" /> {t('completion.live_syncing')}
              </span>
            )}
          </div>
        </div>

        {/* Procurement Summary */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3.5 flex items-center justify-between text-sm">
            <span>{t('completion.invoice_title')}</span>
            <span className="text-[11px] bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">{t('completion.official_receipt')}</span>
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('completion.commodity_crop')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{translateCrop(displayCrop)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('completion.expected_quantity')}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(displayExpectedQty)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('completion.verified_accepted_qty')}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(displayAcceptedQty)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('completion.statutory_msp_rate')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{formatNumber(displayRate.toFixed(2))} {t('common.per_kg')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/70 dark:border-slate-800 pt-3 mt-3">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{t('completion.total_payout_amount')}</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-black font-display text-emerald-600 dark:text-emerald-400 text-2xl">
                  {formatNumber(displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Assay Certificate */}
        {(proc?.assay_record || queueEntry?.assay_record || proc?.grade) && (
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>{t('completion.quality_cert_title')}</span>
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {proc?.assay_record?.grade || proc?.grade || queueEntry?.assay_record?.grade || 'Grade A (FAQ)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('completion.moisture')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatNumber(proc?.assay_record?.moisture_percentage ?? queueEntry?.assay_record?.moisture_percentage ?? 13.5)}%
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('completion.moisture_standard')}</p>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('completion.foreign_chaff')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatNumber(proc?.assay_record?.chaff_percentage ?? queueEntry?.assay_record?.chaff_percentage ?? 0.5)}%
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('completion.chaff_standard')}</p>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('completion.damaged_grain')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatNumber(proc?.assay_record?.damaged_grains_percentage ?? queueEntry?.assay_record?.damaged_grains_percentage ?? 0.0)}%
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">{t('completion.damaged_standard')}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 text-center">
              {t('completion.safety_compliance')}
            </p>
          </div>
        )}

        {/* Payment Status & Govt DBT Confirmation Card */}
        <div className={`rounded-2xl p-5 border shadow-sm transition-all duration-500 ${
          isPaid
            ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/30'
            : 'bg-amber-500/10 dark:bg-amber-950/25 border-amber-500/30'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-2.5 mt-0.5 ${isPaid ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                {isPaid ? <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> : <IndianRupee className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xl">
                    ₹{formatNumber((proc?.payment?.amount || displayTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
                  </p>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isPaid ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-500 text-white animate-pulse'
                  }`}>
                    {isPaid ? (
                      <>
                        <Sparkles className="w-3 h-3" />
                        {t('completion.direct_payout_settled')}
                      </>
                    ) : (
                      t('completion.payout_in_pipeline')
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {isPaid ? t('completion.dbt_credited') : t('completion.payment_processing')}
                </p>
              </div>
            </div>
            {!isPaid && (
              <button
                onClick={loadProcurement}
                disabled={loading}
                className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-medium bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title={t('common.sync')}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{t('common.sync')}</span>
              </button>
            )}
          </div>

          {isPaid ? (
            <div className="mt-4 pt-3.5 border-t border-emerald-200/80 dark:border-emerald-700/30 space-y-2 text-xs animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-emerald-900 dark:text-emerald-200 gap-1 bg-white/80 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700/40">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {t('completion.dbt_ref_id')}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{dbtRefNumber}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 px-1 pt-1">
                <span>{t('completion.disbursed_via')}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {proc?.payment?.paid_at
                    ? new Date(proc.payment.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                    : t('common.just_now')}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 p-2 rounded-lg font-medium text-center">
                {t('completion.treasury_notice')}
              </p>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700/30 text-xs text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{t('completion.officer_issuing_notice')}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {(proc?.notes || queueEntry.notes) && (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">{t('completion.notes_heading')}</p>
            <p className="text-slate-600 dark:text-slate-400">{proc?.notes || queueEntry.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex print:hidden">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="w-full btn-primary font-bold py-3.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-emerald-700/20 cursor-pointer active:scale-[0.99]"
          >
            <FileText className="w-4 h-4" />
            <span>{t('invoice.view_invoice_btn')}</span>
          </button>
        </div>

        {/* Form 'J' Official Printable Invoice Modal */}
        <PrintInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          queueEntry={queueEntry}
          procurement={proc}
          farmer={user}
        />
      </div>
    </div>
  )
}

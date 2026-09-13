import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CheckCircle,
  IndianRupee,
  Calendar,
  ShieldCheck,
  FileCheck,
  Sparkles,
  RefreshCw,
  FileText,
  Info,
  Award
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useTranslation } from '../../i18n'
import { useCentreQueue } from '../../hooks/useRealtimeQueue'
import PrintInvoiceModal from './PrintInvoiceModal'
import QualityStandardsModal from './QualityStandardsModal'

export default function CompletionConfirmation({ queueEntry }) {
  const { user } = useAuth()
  const { t, translateCrop, translateCentreName, formatNumber } = useTranslation()
  const [proc, setProc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showStandardsModal, setShowStandardsModal] = useState(false)
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

  // Fallback polling every 2s until payment is confirmed PAID
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

  const assignedGrade = proc?.assay_record?.grade || proc?.grade || queueEntry?.assay_record?.grade || 'Grade A'
  const isGradeB = assignedGrade.includes('Grade B') || assignedGrade === 'Grade B'
  const isGradeC = assignedGrade.includes('Grade C') || assignedGrade === 'Grade C'
  const baseRate = proc?.base_rate_per_kg || (isGradeB ? Math.round((displayRate / 0.98) * 100) / 100 : isGradeC ? Math.round((displayRate / 0.90) * 100) / 100 : displayRate)
  const discountPct = proc?.discount_percentage ?? (isGradeB ? 2.0 : isGradeC ? 10.0 : 0.0)

  const dbtRefNumber = proc?.payment?.id
    ? `WB-DBT-2025-${String(proc.payment.id).padStart(6, '0')}`
    : `WB-DBT-2025-${String(queueEntry.id).padStart(6, '0')}`

  const completedDateFormatted = queueEntry.completed_at
    ? new Date(queueEntry.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : t('common.today')

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0a101d] dark:to-[#060a12] rounded-3xl border-2 border-emerald-300 dark:border-emerald-600/40 shadow-xl overflow-hidden animate-fade-in print:border-none print:shadow-none">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 px-6 py-6 text-center text-white relative">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 backdrop-blur-md rounded-full p-3.5 border border-white/30 shadow-inner">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black mb-1 tracking-tight font-display">{t('completion.title')}</h2>
        <p className="text-emerald-100 text-xs sm:text-sm font-medium">
          {t('common.gov_dept')} · {t('common.gov_title')}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Token & Centre Info */}
        <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-4 border border-emerald-200/80 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">{t('completion.token_number')}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white token-display font-mono">{queueEntry.token}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">{t('completion.procurement_centre')}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{translateCentreName(queueEntry.centre_name)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('completion.completed_on', { date: completedDateFormatted })}</span>
            </div>
            {loading && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" /> {t('completion.live_syncing')}
              </span>
            )}
          </div>
        </div>

        {/* Procurement Summary */}
        <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-5 border border-emerald-200/80 dark:border-white/10 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3.5 flex items-center justify-between text-sm font-display">
            <span>{t('completion.invoice_title')}</span>
            <span className="text-[11px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">{t('completion.official_receipt')}</span>
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
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatNumber(displayAcceptedQty)} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Base Statutory MSP</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{formatNumber(baseRate.toFixed(2))} {t('common.per_kg')}</span>
            </div>
            {discountPct > 0 && (
              <div className="flex justify-between text-blue-700 dark:text-blue-400 font-medium">
                <span>Quality Adjustment ({assignedGrade})</span>
                <span className="font-bold">-{discountPct}% (-₹{formatNumber((baseRate - displayRate).toFixed(2))}/kg)</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">{t('completion.statutory_msp_rate')}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{formatNumber(displayRate.toFixed(2))} {t('common.per_kg')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-3">
              <span className="font-bold text-slate-900 dark:text-white text-base">{t('completion.total_payout_amount')}</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-2xl font-mono">
                  {formatNumber(displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Assay Certificate */}
        {(proc?.assay_record || queueEntry?.assay_record || proc?.grade) && (
          <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 font-display">
                <span>{t('completion.quality_cert_title')}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  id="btn-view-quality-standards"
                  onClick={() => setShowStandardsModal(true)}
                  className="text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                  title={t('completion.view_standards_tooltip')}
                >
                  <Info className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>{t('completion.view_standards_btn')}</span>
                </button>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/40">
                  {proc?.assay_record?.grade || proc?.grade || queueEntry?.assay_record?.grade || 'Grade A (FAQ)'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('completion.moisture')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {formatNumber(proc?.assay_record?.moisture_percentage ?? queueEntry?.assay_record?.moisture_percentage ?? 13.5)}%
                </p>
                <p className="text-[9px] text-slate-400">{t('completion.moisture_standard')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('completion.foreign_chaff')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {formatNumber(proc?.assay_record?.chaff_percentage ?? queueEntry?.assay_record?.chaff_percentage ?? 0.5)}%
                </p>
                <p className="text-[9px] text-slate-400">{t('completion.chaff_standard')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('completion.damaged_grain')}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {formatNumber(proc?.assay_record?.damaged_grains_percentage ?? queueEntry?.assay_record?.damaged_grains_percentage ?? 0.0)}%
                </p>
                <p className="text-[9px] text-slate-400">{t('completion.damaged_standard')}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex-wrap gap-2">
              <p className="flex-1">
                {t('completion.safety_compliance')}
              </p>
              <button
                onClick={() => setShowStandardsModal(true)}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold underline cursor-pointer text-[11px] shrink-0"
              >
                {t('completion.view_standards_btn')} →
              </button>
            </div>
          </div>
        )}

        {/* Payment Status & Govt DBT Confirmation Card */}
        {proc === null ? (
          <div className="rounded-2xl p-5 border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 animate-pulse h-24" />
        ) : (
          <div className={`rounded-2xl p-5 border-2 shadow-sm transition-all duration-500 ${
            isPaid
              ? 'bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/50 ring-2 ring-emerald-200 dark:ring-emerald-500/20 shadow-emerald-100 dark:shadow-none'
              : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/50'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2.5 mt-0.5 ${isPaid ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'}`}>
                  {isPaid ? <ShieldCheck className="w-6 h-6 text-emerald-700 dark:text-emerald-400" /> : <IndianRupee className="w-6 h-6 text-amber-700 dark:text-amber-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-slate-900 dark:text-white text-xl font-mono">
                      ₹{formatNumber((proc?.payment?.amount || displayTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
                    </p>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isPaid ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-500 text-white shadow-xs'
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
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    {isPaid ? t('completion.dbt_credited') : t('completion.payment_processing')}
                  </p>
                </div>
              </div>
              {!isPaid && (
                <button
                  onClick={loadProcurement}
                  disabled={loading}
                  className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 flex items-center gap-1 font-medium bg-amber-100/70 dark:bg-amber-900/50 hover:bg-amber-200/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title={t('common.sync')}
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>{t('common.sync')}</span>
                </button>
              )}
            </div>

            {isPaid ? (
              <div className="mt-4 pt-3.5 border-t border-emerald-200/80 dark:border-emerald-500/30 space-y-2 text-xs animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-emerald-900 dark:text-emerald-200 gap-1 bg-white/80 dark:bg-[#0a101d] p-2.5 rounded-xl border border-emerald-200 dark:border-white/10">
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
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 p-2 rounded-lg font-medium text-center">
                  {t('completion.treasury_notice')}
                </p>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{t('completion.officer_issuing_notice')}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {(proc?.notes || queueEntry.notes) && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3.5 border border-slate-200 dark:border-white/10 text-xs space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">{t('completion.notes_heading')}</p>
            <p className="text-slate-600 dark:text-slate-400">{proc?.notes || queueEntry.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex print:hidden">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99] font-display"
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

        {/* Official Statutory Agmark Quality Standards Modal */}
        {showStandardsModal && (
          <QualityStandardsModal
            isOpen={showStandardsModal}
            onClose={() => setShowStandardsModal(false)}
            initialCrop={displayCrop}
          />
        )}
      </div>
    </div>
  )
}

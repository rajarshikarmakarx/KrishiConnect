import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, IndianRupee, Download, Calendar, MapPin, ShieldCheck, Printer, FileCheck, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useCentreQueue, useFarmerNotifications } from '../../hooks/useRealtimeQueue'

export default function CompletionConfirmation({ queueEntry }) {
  const { user } = useAuth()
  const [proc, setProc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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
        if (currentlyPaid && !prevPaidStatusRef.current) {
          prevPaidStatusRef.current = true
          toast.success(`🏛️ Govt Direct Benefit Transfer (DBT) Payout Settled for Token ${queueEntry.token}!`, {
            id: `dbt-settled-${queueEntry.id}`,
            duration: 8000,
            icon: '💰'
          })
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load procurement')
    } finally {
      setLoading(false)
    }
  }, [queueEntry?.id, queueEntry?.token])

  useEffect(() => {
    loadProcurement()
  }, [loadProcurement])

  // 1. Real-time synchronization via Centre WebSocket channel
  useCentreQueue(queueEntry?.centre_id, loadProcurement)

  // 2. Real-time synchronization via Farmer personal WebSocket channel
  const farmerId = user?.id || queueEntry?.farmer_id
  const token = localStorage.getItem('krishi_token')
  useFarmerNotifications(
    farmerId,
    token,
    useCallback((data) => {
      if (data.type === 'PAYMENT_PAID' || data.type === 'COMPLETED') {
        loadProcurement()
      }
    }, [loadProcurement])
  )

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

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 shadow-xl overflow-hidden animate-fade-in print:border-none print:shadow-none">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 px-6 py-6 text-center text-white relative">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 backdrop-blur-md rounded-full p-3.5 border border-white/30 shadow-inner">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black mb-1 tracking-tight">Procurement Completed & Verified!</h2>
        <p className="text-green-100 text-xs sm:text-sm font-medium">Department of Agricultural Marketing · Govt of West Bengal</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Token & Centre Info */}
        <div className="bg-white rounded-2xl p-4 border border-green-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Token Number</p>
              <p className="text-3xl font-bold text-slate-900 token-display">{queueEntry.token}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium mb-0.5">Procurement Centre</p>
              <p className="font-bold text-slate-800 text-sm">{queueEntry.centre_name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Completed on {queueEntry.completed_at ? new Date(queueEntry.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}</span>
            </div>
            {loading && (
              <span className="flex items-center gap-1 text-[11px] text-green-700 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" /> Live syncing...
              </span>
            )}
          </div>
        </div>

        {/* Procurement Summary */}
        <div className="bg-white rounded-2xl p-5 border border-green-200/80 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3.5 flex items-center justify-between text-sm">
            <span>Procurement Invoice & Weight Slip</span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Official Receipt</span>
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Commodity Crop</span>
              <span className="font-bold text-slate-900">{displayCrop}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Quantity</span>
              <span className="font-medium text-slate-700">{displayExpectedQty} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verified Accepted Quantity</span>
              <span className="font-bold text-green-700">{displayAcceptedQty} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Govt Statutory MSP Rate</span>
              <span className="font-semibold text-slate-800">₹{displayRate.toFixed(2)} / kg</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
              <span className="font-bold text-slate-900 text-base">Total Payout Amount</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-green-700" />
                <span className="font-extrabold text-green-700 text-2xl">
                  {displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status & Govt DBT Confirmation Card */}
        <div className={`rounded-2xl p-5 border-2 shadow-sm transition-all duration-500 ${
          isPaid
            ? 'bg-emerald-50/95 border-emerald-400 ring-2 ring-emerald-200 shadow-emerald-100'
            : 'bg-amber-50/90 border-amber-300'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-2.5 mt-0.5 ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isPaid ? <ShieldCheck className="w-6 h-6 text-emerald-700" /> : <IndianRupee className="w-6 h-6 text-amber-700" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-slate-900 text-xl">
                    ₹{(proc?.payment?.amount || displayTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isPaid ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-500 text-white animate-pulse'
                  }`}>
                    {isPaid ? (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Direct Payout Settled
                      </>
                    ) : (
                      '⏳ Payout In Pipeline'
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {isPaid ? 'Direct Benefit Transfer (DBT) Credited' : 'Government Payment Processing'}
                </p>
              </div>
            </div>
            {!isPaid && (
              <button
                onClick={loadProcurement}
                disabled={loading}
                className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-medium bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-1 rounded-lg transition-colors"
                title="Check payment status"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}
          </div>

          {isPaid ? (
            <div className="mt-4 pt-3.5 border-t border-emerald-200/80 space-y-2 text-xs animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-emerald-900 gap-1 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  DBT Reference ID:
                </span>
                <span className="font-mono font-bold text-slate-900">{dbtRefNumber}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 px-1 pt-1">
                <span>Disbursed via PFMS / e-Kuber</span>
                <span className="font-medium text-slate-800">
                  {proc?.payment?.paid_at
                    ? new Date(proc.payment.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Just now'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded-lg font-medium text-center">
                🏛️ The payment has been authorized from the Government treasury and disbursed to your Aadhaar-linked bank account.
              </p>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-800 text-center flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Procurement confirmed. Procurement Officer is issuing your direct payment settlement shortly.</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {(proc?.notes || queueEntry.notes) && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-700">Procurement Notes / Grading</p>
            <p className="text-slate-600">{proc?.notes || queueEntry.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-md"
          >
            <Printer className="w-4 h-4" />
            Print / Save Official Receipt
          </button>
        </div>
      </div>
    </div>
  )
}

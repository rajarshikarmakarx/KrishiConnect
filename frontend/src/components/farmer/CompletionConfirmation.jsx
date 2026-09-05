import { useState, useEffect } from 'react'
import { CheckCircle, IndianRupee, Download, Calendar, MapPin } from 'lucide-react'
import api from '../../api'

export default function CompletionConfirmation({ queueEntry }) {
  const [proc, setProc] = useState(null)

  useEffect(() => {
    if (queueEntry?.id) {
      api.getProcurement(queueEntry.id).then(setProc).catch(() => {})
    }
  }, [queueEntry?.id])

  if (!proc || !proc.accepted_quantity_kg) return null

  const isPaid = proc.payment?.status === 'PAID'

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg overflow-hidden">
      {/* Success Header */}
      <div className="bg-green-600 px-6 py-5 text-center">
        <div className="flex justify-center mb-2">
          <div className="bg-white rounded-full p-3">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Procurement Complete!</h2>
        <p className="text-green-100 text-sm">Your crops have been successfully processed</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Token & Centre Info */}
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Token Number</p>
              <p className="text-2xl font-bold text-slate-900">{queueEntry.token}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Centre</p>
              <p className="font-semibold text-slate-700 text-sm">{queueEntry.centre_name}</p>
            </div>
          </div>
          {queueEntry.completed_at && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>Completed on {new Date(queueEntry.completed_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Procurement Summary */}
        <div className="bg-white rounded-xl p-5 border border-green-100">
          <h3 className="font-bold text-slate-900 mb-3">Procurement Details</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Crop</span>
              <span className="font-semibold text-slate-900">{proc.crop}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Quantity</span>
              <span className="font-medium text-slate-700">{proc.expected_quantity_kg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Accepted Quantity</span>
              <span className="font-semibold text-green-700">{proc.accepted_quantity_kg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rate per kg</span>
              <span className="font-medium text-slate-700">₹{proc.rate_per_kg}/kg</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
              <span className="font-bold text-slate-900 text-base">Total Amount</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700 text-xl">
                  {proc.total_amount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className={`rounded-xl p-5 border-2 ${isPaid ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                <IndianRupee className={`w-6 h-6 ${isPaid ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">₹{proc.payment?.amount?.toLocaleString('en-IN')}</p>
                <p className="text-sm text-slate-600">Payment Status</p>
              </div>
            </div>
            <div className={`text-center px-4 py-2 rounded-full font-bold ${isPaid ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>
              {isPaid ? '✅ PAID' : '⏳ Processing'}
            </div>
          </div>
          {isPaid && proc.payment?.paid_at && (
            <p className="text-xs text-slate-500 mt-3 text-center">
              Payment credited on {new Date(proc.payment.paid_at).toLocaleString()}
            </p>
          )}
          {!isPaid && (
            <p className="text-xs text-amber-700 mt-3 text-center">
              Your payment is being processed. You will receive it shortly.
            </p>
          )}
        </div>

        {/* Notes */}
        {proc.notes && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-900 mb-1">Notes</p>
            <p className="text-sm text-blue-700">{proc.notes}</p>
          </div>
        )}

        {/* Download Receipt Button */}
        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Download className="w-5 h-5" />
          Download Receipt
        </button>
      </div>
    </div>
  )
}

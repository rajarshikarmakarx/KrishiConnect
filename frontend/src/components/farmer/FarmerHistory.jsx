import { useState, useEffect } from 'react'
import { Calendar, MapPin, CheckCircle, FileText, Loader2 } from 'lucide-react'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useTranslation } from '../../i18n'
import PrintInvoiceModal from './PrintInvoiceModal'

export default function FarmerHistory() {
  const { user } = useAuth()
  const { t, translateCrop, translateCentreName, formatNumber } = useTranslation()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoiceEntry, setSelectedInvoiceEntry] = useState(null)
  // Full procurement data (with payment, assay, accepted qty, rate) for the invoice
  const [selectedProcurement, setSelectedProcurement] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  useEffect(() => {
    api.getMyQueue().then(data => {
      setEntries(data.filter(e => ['COMPLETED', 'CANCELLED', 'REJECTED', 'DEFERRED_SUN_DRYING'].includes(e.status)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Fetch full procurement details (accepted qty, real rate, payment, assay)
  // before opening the invoice so numbers match what the operator actually entered.
  const openInvoice = async (entry) => {
    setLoadingInvoice(true)
    setSelectedInvoiceEntry(entry)
    try {
      const proc = await api.getProcurement(entry.id)
      setSelectedProcurement(proc || null)
    } catch {
      setSelectedProcurement(null)
    } finally {
      setLoadingInvoice(false)
    }
  }

  const closeInvoice = () => {
    setSelectedInvoiceEntry(null)
    setSelectedProcurement(null)
  }

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
    </div>
  )

  if (!entries.length) return (
    <div className="text-center py-16 text-slate-500">
      <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p className="font-medium">{t('history.empty_title')}</p>
    </div>
  )

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED':
        return t('queue.status_completed')
      case 'DEFERRED_SUN_DRYING':
        return t('queue.status_deferred')
      case 'REJECTED':
        return t('queue.status_rejected')
      case 'CANCELLED':
        return t('queue.status_cancelled')
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{t('history.title')}</h2>
      {entries.map(entry => (
        <div key={entry.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="token-display font-bold text-slate-700">{entry.token}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  entry.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  entry.status === 'DEFERRED_SUN_DRYING' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-600'
                }`}>{getStatusLabel(entry.status)}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{translateCentreName(entry.centre_name)}</span>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              {new Date(entry.booked_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-50 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-600 font-medium">
                {translateCrop(entry.crop)} · {formatNumber(entry.expected_quantity_kg)} {t('common.kg')}
              </span>
              {entry.assay_record && (
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  🔬 {entry.assay_record.grade} ({formatNumber(entry.assay_record.moisture_percentage)}%)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {entry.status === 'COMPLETED' && (
                <button
                  onClick={() => openInvoice(entry)}
                  disabled={loadingInvoice && selectedInvoiceEntry?.id === entry.id}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-lg border border-green-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  {loadingInvoice && selectedInvoiceEntry?.id === entry.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <FileText className="w-3.5 h-3.5" />
                  }
                  <span>{t('invoice.view_invoice_btn')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Invoice Modal for selected completed history entry */}
      {selectedInvoiceEntry && !loadingInvoice && (
        <PrintInvoiceModal
          isOpen={!!selectedInvoiceEntry}
          onClose={closeInvoice}
          queueEntry={selectedInvoiceEntry}
          procurement={selectedProcurement}
          farmer={user}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Calendar, MapPin, CheckCircle, FileText, Scale } from 'lucide-react'
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

  useEffect(() => {
    api.getMyQueue().then(data => {
      setEntries(data.filter(e => ['COMPLETED', 'CANCELLED', 'REJECTED', 'DEFERRED_SUN_DRYING'].includes(e.status)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-3xl border border-slate-200/60 dark:border-slate-800" />)}
    </div>
  )

  if (!entries.length) return (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
      <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
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
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">{t('history.title')}</h2>
      {entries.map(entry => (
        <div key={entry.id} className="bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="token-display font-black text-slate-800 dark:text-slate-100 text-lg">{entry.token}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  entry.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                  entry.status === 'DEFERRED_SUN_DRYING' ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                  'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                }`}>{getStatusLabel(entry.status)}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{translateCentreName(entry.centre_name)}</span>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500 dark:text-slate-400 font-medium">
              {new Date(entry.booked_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {translateCrop(entry.crop)} · {formatNumber(entry.expected_quantity_kg)} {t('common.kg')}
              </span>
              {entry.assay_record && (
                <span className="text-[11px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 border border-slate-200/60 dark:border-slate-700">
                  <Scale className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>{entry.assay_record.grade} ({formatNumber(entry.assay_record.moisture_percentage)}%)</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {entry.status === 'COMPLETED' && (
                <button
                  onClick={() => setSelectedInvoiceEntry(entry)}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('invoice.view_invoice_btn')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Invoice Modal for selected completed history entry */}
      {selectedInvoiceEntry && (
        <PrintInvoiceModal
          isOpen={!!selectedInvoiceEntry}
          onClose={() => setSelectedInvoiceEntry(null)}
          queueEntry={selectedInvoiceEntry}
          procurement={null}
          farmer={user}
        />
      )}
    </div>
  )
}

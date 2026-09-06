import { useState, useEffect } from 'react'
import { Calendar, MapPin, CheckCircle } from 'lucide-react'
import api from '../../api'
import { useTranslation } from '../../i18n'

export default function FarmerHistory() {
  const { t, translateCrop } = useTranslation()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyQueue().then(data => {
      setEntries(data.filter(e => ['COMPLETED', 'CANCELLED', 'REJECTED', 'DEFERRED_SUN_DRYING'].includes(e.status)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
    </div>
  )

  if (!entries.length) return (
    <div className="text-center py-16 text-slate-500">
      <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p className="font-medium">{t('history.empty')}</p>
    </div>
  )

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED':
        return t('history.status_completed')
      case 'DEFERRED_SUN_DRYING':
        return t('history.status_sun_drying')
      case 'REJECTED':
        return t('history.status_rejected')
      case 'CANCELLED':
        return t('history.status_cancelled')
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{t('history.title')}</h2>
      {entries.map(entry => (
        <div key={entry.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="token-display font-bold text-slate-700">{entry.token}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  entry.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  entry.status === 'DEFERRED_SUN_DRYING' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-600'
                }`}>{getStatusLabel(entry.status)}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{entry.centre_name}</span>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              {new Date(entry.booked_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">
                {translateCrop(entry.crop)} · {entry.expected_quantity_kg} {t('common.kg')}
              </span>
              {entry.assay_record && (
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  🔬 {entry.assay_record.grade} ({entry.assay_record.moisture_percentage}%)
                </span>
              )}
            </div>
            {entry.status === 'COMPLETED' && (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

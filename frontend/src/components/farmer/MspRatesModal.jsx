import { useState, useEffect } from 'react'
import { Wheat, X, Scale, Info, ShieldCheck } from 'lucide-react'
import api from '../../api'
import { useTranslation } from '../../i18n'

const DEFAULT_RATES = [
  { crop: 'Paddy', common_grade_per_quintal: 2300, a_grade_per_quintal: 2320, per_kg: 23.0 },
  { crop: 'Wheat', common_grade_per_quintal: 2275, a_grade_per_quintal: 2275, per_kg: 22.75 },
  { crop: 'Mustard', common_grade_per_quintal: 5950, a_grade_per_quintal: 5950, per_kg: 59.50 },
  { crop: 'Jute', common_grade_per_quintal: 5335, a_grade_per_quintal: 5335, per_kg: 53.35 },
  { crop: 'Maize', common_grade_per_quintal: 2225, a_grade_per_quintal: 2225, per_kg: 22.25 },
  { crop: 'Potato', common_grade_per_quintal: 1000, a_grade_per_quintal: 1050, per_kg: 10.25 },
  { crop: 'Onion', common_grade_per_quintal: 1800, a_grade_per_quintal: 1850, per_kg: 18.25 },
]

export default function MspRatesModal({ onClose }) {
  const { t, translateCrop, formatNumber } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMspRates()
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const rates = data?.rates || DEFAULT_RATES

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0a101d] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/80 dark:border-white/10 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/10 dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] p-5 flex items-start justify-between flex-shrink-0 border-b border-emerald-100/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">{t('msp.title')}</h3>
            </div>
            <p className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              {data?.season || t('msp.kharif_season')} · {t('msp.wb_mandated')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold">{t('msp.guarantee_title')}</p>
              <p className="text-emerald-700 dark:text-emerald-300/80">{t('msp.guarantee_desc')}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {rates.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{translateCrop(r.crop)}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    ₹{formatNumber(r.common_grade_per_quintal.toLocaleString('en-IN'))} {t('msp.per_quintal')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{formatNumber(r.per_kg.toFixed(2))}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{t('common.per_kg')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {t('msp.faq_standards_title')}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
              {t('msp.faq_standards_desc')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-primary py-2.5 px-6 rounded-full text-sm font-bold shadow-lg shadow-emerald-700/20 cursor-pointer"
          >
            {t('msp.got_it')}
          </button>
        </div>
      </div>
    </div>
  )
}

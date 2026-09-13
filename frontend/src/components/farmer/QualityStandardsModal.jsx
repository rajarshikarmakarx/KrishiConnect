import React, { useState, useEffect } from 'react'
import {
  X,
  Scale,
  ShieldCheck,
  Droplets,
  AlertTriangle,
  Sun,
  CheckCircle2,
  Info,
  Layers,
  Wheat,
  FileCheck2,
  Sparkles,
  BookOpen,
  Award
} from 'lucide-react'
import api from '../../api'
import { useTranslation } from '../../i18n'

const FALLBACK_DATA = {
  season: 'Kharif 2025-26 & RMS 2026-27',
  authority: 'Directorate of Marketing & Inspection (DMI) & WB State Agricultural Marketing Board',
  grading_tiers: [
    {
      grade: 'Grade A',
      tier_title: 'Grade I (Premium / Choice)',
      label: 'Grade A / Grade I (Premium / Choice)',
      payout_percentage: '100%',
      moisture_threshold: '≤ 14.0%',
      chaff_threshold: '≤ 1.0%',
      damaged_threshold: '≤ 1.0%',
      foreign_matter_chaff: 'Extremely Low (≤ 0.5% - 1.0%)',
      damaged_discolored: 'Negligible (≤ 1.0%)',
      typical_market_destination: 'Premium retail food, export quality, milling.',
      status: 'APPROVED',
      color: 'emerald',
      description: 'Fair Average Quality (FAQ) certified produce. Premium lot quality entitled to 100% statutory MSP floor price without deductions.'
    },
    {
      grade: 'Grade B',
      tier_title: 'Grade II (Standard)',
      label: 'Grade B / Grade II (Standard)',
      payout_percentage: '98%',
      moisture_threshold: '14.1% - 17.0%',
      chaff_threshold: '≤ 1.5%',
      damaged_threshold: '≤ 3.0%',
      foreign_matter_chaff: 'Low (≤ 1.5%)',
      damaged_discolored: 'Low (≤ 2.0% - 3.0%)',
      typical_market_destination: 'Standard consumer distribution, general food processing.',
      status: 'APPROVED',
      color: 'blue',
      description: 'Permissible quality produce within statutory tolerance limits. Accepted with standard 2% moisture adjustment.'
    },
    {
      grade: 'Grade C',
      tier_title: 'Grade III & IV (Utility)',
      label: 'Grade C / Grade III & IV (Utility)',
      payout_percentage: '90%',
      moisture_threshold: '17.1% - 19.9%',
      chaff_threshold: '≤ 3.0%',
      damaged_threshold: '≤ 5.0%',
      foreign_matter_chaff: 'Moderate (≤ 2.0% - 3.0%)',
      damaged_discolored: 'Moderate (≤ 4.0% - 5.0%)',
      typical_market_destination: 'Commercial blending, industrial processing.',
      status: 'DEFERRED_SUN_DRYING',
      color: 'amber',
      description: 'Marginal high moisture lot. Entitled to statutory 2.5-hour mandi courtyard sun-drying grace period before mandatory re-assaying.'
    },
    {
      grade: 'Rejected',
      tier_title: 'Sample Grade / Rejected',
      label: 'Sample Grade / Rejected',
      payout_percentage: '0%',
      moisture_threshold: '≥ 20.0%',
      chaff_threshold: '> 3.0%',
      damaged_threshold: '> 5.0%',
      foreign_matter_chaff: 'High (> 3.0%)',
      damaged_discolored: 'High (> 5.0%)',
      typical_market_destination: 'Animal feed, biofuel extraction, or rejected due to toxins/odor.',
      status: 'REJECTED',
      color: 'red',
      description: 'Excessive moisture and spoilage hazard. Intake blocked by safety guards to prevent Aspergillus flavus fungal rot in central silos.'
    }
  ],
  crop_standards: [
    {
      crop: 'Paddy',
      faq_moisture_max: 14.0,
      permissible_moisture_max: 17.0,
      max_foreign_chaff: 1.5,
      max_damaged_grains: 2.0,
      min_purity_percentage: 97.0,
      special_parameter: 'Max 3.0% immature/shrivelled grains',
      notes: 'Covers Aman, Aus, and Boro paddy. Grains must be clean, free from weeds, chaff, and mud.'
    },
    {
      crop: 'Wheat',
      faq_moisture_max: 12.0,
      permissible_moisture_max: 12.0,
      max_foreign_chaff: 0.75,
      max_damaged_grains: 2.0,
      min_purity_percentage: 98.0,
      special_parameter: 'Max 1.0% weevilled grains',
      notes: 'Sound, mature wheat kernels. Free from karnal bunt, smut, and live insect infestation.'
    },
    {
      crop: 'Mustard',
      faq_moisture_max: 8.0,
      permissible_moisture_max: 9.0,
      max_foreign_chaff: 2.0,
      max_damaged_grains: 1.5,
      min_purity_percentage: 97.0,
      special_parameter: 'Min 38.0% oil content, 0% Argemone',
      notes: 'Black and yellow mustard seeds. Thoroughly dried, zero contamination with toxic Argemone mexicana.'
    },
    {
      crop: 'Jute',
      faq_moisture_max: 18.0,
      permissible_moisture_max: 20.0,
      max_foreign_chaff: 1.0,
      max_damaged_grains: 3.0,
      min_purity_percentage: 95.0,
      special_parameter: 'TD-5 / W-5 grade tensile strength',
      notes: 'Raw tossa and white jute. Cleanly retted, free from root-cuttings, mud, and specks.'
    },
    {
      crop: 'Maize',
      faq_moisture_max: 14.0,
      permissible_moisture_max: 16.0,
      max_foreign_chaff: 1.5,
      max_damaged_grains: 3.0,
      min_purity_percentage: 97.0,
      special_parameter: 'Max 2.0% broken kernels',
      notes: 'Yellow and white corn. Free from cob particles, mold, and insect tunneling.'
    },
    {
      crop: 'Potato',
      faq_moisture_max: 0.0,
      permissible_moisture_max: 0.0,
      max_foreign_chaff: 1.0,
      max_damaged_grains: 3.0,
      min_purity_percentage: 96.0,
      special_parameter: 'Min 45 mm tuber diameter, 0% soft rot',
      notes: 'Jyoti and Chandramukhi varieties. Clean surface, firm tubers without greening or late blight.'
    },
    {
      crop: 'Onion',
      faq_moisture_max: 0.0,
      permissible_moisture_max: 0.0,
      max_foreign_chaff: 1.0,
      max_damaged_grains: 2.0,
      min_purity_percentage: 96.0,
      special_parameter: 'Neck thickness < 15 mm, 0% sprouting',
      notes: 'Sukh Sagar variety. Well-cured with intact outer papery dry skins, free from doubles and bolters.'
    }
  ],
  statutory_rules: [
    {
      rule_id: 'SEC-24A',
      title: 'Moisture Safe Storage Guard',
      description: 'Government silos strictly prohibit intake of produce with moisture ≥20.0% to prevent fungal aflatoxin contamination and grain rot.'
    },
    {
      rule_id: 'SEC-18B',
      title: 'Courtyard Sun-Drying Grace Rights',
      description: 'Farmers whose lot exhibits 17.1% - 19.9% moisture are entitled by law to a 2.5-hour free mandi yard sun-drying window before any refusal.'
    },
    {
      rule_id: 'SEC-12C',
      title: 'Digital Meter Calibration Standard',
      description: 'All moisture meters and weighbridges at procurement counters must be calibrated per ISO 712 and Legal Metrology standards.'
    }
  ]
}

export default function QualityStandardsModal({ isOpen = true, onClose, initialCrop = 'Paddy' }) {
  const { t, translateCrop, formatNumber } = useTranslation()
  const [data, setData] = useState(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tiers') // 'tiers' | 'crops' | 'rules'
  const [selectedCrop, setSelectedCrop] = useState(initialCrop || 'Paddy')

  useEffect(() => {
    if (initialCrop) {
      setSelectedCrop(initialCrop)
    }
  }, [initialCrop])

  useEffect(() => {
    let mounted = true
    api.getQualityStandards()
      .then(res => {
        if (mounted && res && res.grading_tiers) {
          setData(res)
        }
      })
      .catch(() => {
        // Keep fallback data if API fails
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (!isOpen) return null

  const cropStandardsList = data.crop_standards || FALLBACK_DATA.crop_standards
  const currentCropSpec = cropStandardsList.find(c => c.crop.toLowerCase() === selectedCrop.toLowerCase()) || cropStandardsList[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#0a101d] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 z-10 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-emerald-900 p-5 text-white flex items-start justify-between flex-shrink-0 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-amber-300 shadow-inner shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight font-display">
                  {t('quality_standards.modal_title')}
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold px-2 py-0.5 rounded-full uppercase">
                  Agmark FAQ
                </span>
              </div>
              <p className="text-emerald-200/90 text-xs mt-0.5 font-medium">
                {t('quality_standards.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/5 px-4 pt-2 gap-2 flex-shrink-0 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tiers')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tiers'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('quality_standards.tab_grading_tiers')}</span>
          </button>
          <button
            onClick={() => setActiveTab('crops')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'crops'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Wheat className="w-4 h-4" />
            <span>{t('quality_standards.tab_crop_standards')}</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('quality_standards.tab_safety_rules')}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
          {/* TAB 1: Grading Tiers */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              {/* Statutory Farmer Rights Banner */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm font-display">{t('quality_standards.farmer_rights_title')}</p>
                  <p className="text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    {t('quality_standards.farmer_rights_desc')}
                  </p>
                </div>
              </div>

              {/* Agmark 3-Parameter Composite Average Formula Callout */}
              <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200 shadow-xs">
                <Scale className="w-5 h-5 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm font-display">
                      {t('quality_standards.composite_formula_title') || 'Agmark Composite 3-Parameter Grading'}
                    </p>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                      Average Rule
                    </span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-300 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    {t('quality_standards.composite_formula_desc') || 'Final Grade is determined by taking the combined average tier of Moisture %, Foreign Matter / Chaff %, and Damaged / Discolored Kernels % evaluated against statutory Agmark standards.'}
                  </p>
                </div>
              </div>

              {/* Official AGMARK Standards Comparison Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0e1626] shadow-xs">
                <div className="bg-slate-100 dark:bg-white/5 px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-display">
                    <Award className="w-4 h-4 text-amber-500" />
                    AGMARK Standards Reference Matrix
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    DMI / FCI Norms
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <th className="p-3">Grading Tier</th>
                        <th className="p-3">Moisture (%)</th>
                        <th className="p-3">Foreign Matter / Chaff (%)</th>
                        <th className="p-3">Damaged / Discolored (%)</th>
                        <th className="p-3">Typical Market Destination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {/* Grade I */}
                      <tr className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                        <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          <div className="font-extrabold text-xs">Grade I</div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">(Premium / Choice)</div>
                        </td>
                        <td className="p-3 font-black text-emerald-800 dark:text-emerald-300 whitespace-nowrap">≤ 14.0%</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">Extremely Low (≤ 0.5% - 1.0%)</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">Negligible (≤ 1.0%)</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">Premium retail food, export quality, milling.</td>
                      </tr>
                      {/* Grade II */}
                      <tr className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                        <td className="p-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                          <div className="font-extrabold text-xs">Grade II</div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">(Standard)</div>
                        </td>
                        <td className="p-3 font-black text-blue-800 dark:text-blue-300 whitespace-nowrap">14.1% - 17.0%</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">Low (≤ 1.5%)</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">Low (≤ 2.0% - 3.0%)</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">Standard consumer distribution, general food processing.</td>
                      </tr>
                      {/* Grade III & IV */}
                      <tr className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                        <td className="p-3 font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          <div className="font-extrabold text-xs">Grade III & IV</div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">(Utility)</div>
                        </td>
                        <td className="p-3 font-black text-amber-800 dark:text-amber-300 whitespace-nowrap">17.1% - 19.9%</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">Moderate (≤ 2.0% - 3.0%)</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">Moderate (≤ 4.0% - 5.0%)</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">Commercial blending, industrial processing.</td>
                      </tr>
                      {/* Sample Grade / Rejected */}
                      <tr className="hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-colors">
                        <td className="p-3 font-bold text-red-700 dark:text-red-400 whitespace-nowrap">
                          <div className="font-extrabold text-xs">Sample Grade</div>
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">/ Rejected</div>
                        </td>
                        <td className="p-3 font-black text-red-800 dark:text-red-300 whitespace-nowrap">≥ 20.0%</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">High (&gt; 3.0%)</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">High (&gt; 5.0%)</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">Animal feed, biofuel extraction, or rejected due to toxins/odor.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                {/* Grade A Card */}
                <div className="bg-white dark:bg-[#0e1626] rounded-2xl border-2 border-emerald-300 dark:border-emerald-500/40 p-4 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black text-sm flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                        I
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">Grade I (Premium / Choice)</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            Grade A
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {t('quality_standards.badge_faq')} · 100% MSP Payout
                        </span>
                      </div>
                    </div>
                    <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-xs">
                      100% Rate
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {t('quality_standards.grade_a_desc')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-2.5 border border-emerald-100 dark:border-emerald-500/20">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.moisture')}</p>
                      <p className="font-black text-emerald-900 dark:text-emerald-300 text-sm">≤ 14.0%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.foreign_chaff')}</p>
                      <p className="font-black text-emerald-900 dark:text-emerald-300 text-sm">≤ 1.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Extremely Low</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.damaged_grain')}</p>
                      <p className="font-black text-emerald-900 dark:text-emerald-300 text-sm">≤ 1.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Negligible</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                      Destination:
                    </span>
                    <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                      Premium retail food, export quality, milling.
                    </span>
                  </div>
                </div>

                {/* Grade B Card */}
                <div className="bg-white dark:bg-[#0e1626] rounded-2xl border-2 border-blue-200 dark:border-blue-500/40 p-4 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-black text-sm flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
                        II
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">Grade II (Standard)</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            Grade B
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                          {t('quality_standards.badge_permissible')} · 98% Standard Payout
                        </span>
                      </div>
                    </div>
                    <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-xs">
                      98% Rate
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {t('quality_standards.grade_b_desc')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-blue-50/60 dark:bg-blue-950/30 rounded-xl p-2.5 border border-blue-100 dark:border-blue-500/20">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.moisture')}</p>
                      <p className="font-black text-blue-900 dark:text-blue-300 text-sm">14.1% - 17.0%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.foreign_chaff')}</p>
                      <p className="font-black text-blue-900 dark:text-blue-300 text-sm">≤ 1.5%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Low</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.damaged_grain')}</p>
                      <p className="font-black text-blue-900 dark:text-blue-300 text-sm">≤ 3.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Low (≤ 2.0% - 3.0%)</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                      Destination:
                    </span>
                    <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                      Standard consumer distribution, general food processing.
                    </span>
                  </div>
                </div>

                {/* Grade C Card */}
                <div className="bg-white dark:bg-[#0e1626] rounded-2xl border-2 border-amber-200 dark:border-amber-500/40 p-4 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-sm flex items-center justify-center border border-amber-200 dark:border-amber-500/30">
                        III/IV
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">Grade III & IV (Utility)</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            Grade C
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          {t('quality_standards.badge_deferral')} · 2.5h Yard Sun-Drying Grace
                        </span>
                      </div>
                    </div>
                    <span className="bg-amber-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                      <Sun className="w-3 h-3" /> 2.5h Grace
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {t('quality_standards.grade_c_desc')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-amber-50/60 dark:bg-amber-950/30 rounded-xl p-2.5 border border-amber-100 dark:border-amber-500/20">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.moisture')}</p>
                      <p className="font-black text-amber-900 dark:text-amber-300 text-sm">17.1% - 19.9%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.foreign_chaff')}</p>
                      <p className="font-black text-amber-900 dark:text-amber-300 text-sm">≤ 3.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Moderate (≤ 2.0% - 3.0%)</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.damaged_grain')}</p>
                      <p className="font-black text-amber-900 dark:text-amber-300 text-sm">≤ 5.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Moderate (≤ 4.0% - 5.0%)</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                      Destination:
                    </span>
                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                      Commercial blending, industrial processing.
                    </span>
                  </div>
                </div>

                {/* Rejected Card */}
                <div className="bg-white dark:bg-[#0e1626] rounded-2xl border-2 border-red-200 dark:border-red-500/40 p-4 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 font-black text-sm flex items-center justify-center border border-red-200 dark:border-red-500/30">
                        ✕
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">Sample Grade / Rejected</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                            Rejected
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                          {t('quality_standards.badge_rejection')} · Silo Rot Hazard Guard
                        </span>
                      </div>
                    </div>
                    <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-xs">
                      Blocked
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {t('quality_standards.grade_rej_desc')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-red-50/60 dark:bg-red-950/30 rounded-xl p-2.5 border border-red-100 dark:border-red-500/20">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.moisture')}</p>
                      <p className="font-black text-red-900 dark:text-red-300 text-sm">≥ 20.0%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.foreign_chaff')}</p>
                      <p className="font-black text-red-900 dark:text-red-300 text-sm">&gt; 3.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">High (&gt; 3.0%)</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.damaged_grain')}</p>
                      <p className="font-black text-red-900 dark:text-red-300 text-sm">&gt; 5.0%</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">High (&gt; 5.0%)</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                      Destination:
                    </span>
                    <span className="text-[11px] font-medium text-red-800 dark:text-red-300">
                      Animal feed, biofuel extraction, or rejected due to toxins/odor.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Crop-Specific FAQ Standards */}
          {activeTab === 'crops' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('quality_standards.select_crop_label')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cropStandardsList.map(c => {
                    const isSelected = c.crop.toLowerCase() === selectedCrop.toLowerCase()
                    return (
                      <button
                        key={c.crop}
                        onClick={() => setSelectedCrop(c.crop)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
                        }`}
                      >
                        <Wheat className="w-3.5 h-3.5" />
                        <span>{translateCrop(c.crop)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {currentCropSpec && (
                <div className="bg-slate-50 dark:bg-[#0e1626] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 font-display">
                        <span>{translateCrop(currentCropSpec.crop)}</span>
                        <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                          Agmark FAQ
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentCropSpec.notes}</p>
                    </div>
                  </div>

                  {/* Grid of specifications */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('quality_standards.param_faq_moisture')}</p>
                      <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
                        {currentCropSpec.faq_moisture_max > 0 ? `≤ ${formatNumber(currentCropSpec.faq_moisture_max)}%` : '0.0% Dry'}
                      </p>
                      <p className="text-[9px] text-slate-400">100% MSP Standard</p>
                    </div>

                    <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('quality_standards.param_permissible_moisture')}</p>
                      <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                        {currentCropSpec.permissible_moisture_max > 0 ? `≤ ${formatNumber(currentCropSpec.permissible_moisture_max)}%` : '0.0% Max'}
                      </p>
                      <p className="text-[9px] text-slate-400">Upper Gate Tolerance</p>
                    </div>

                    <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('quality_standards.param_foreign_chaff')}</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        ≤ {formatNumber(currentCropSpec.max_foreign_chaff)}%
                      </p>
                      <p className="text-[9px] text-slate-400">Max Insoluble / Chaff</p>
                    </div>

                    <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('quality_standards.param_damaged_grain')}</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        ≤ {formatNumber(currentCropSpec.max_damaged_grains)}%
                      </p>
                      <p className="text-[9px] text-slate-400">Max Defect / Discolored</p>
                    </div>

                    <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('quality_standards.param_min_purity')}</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                        ≥ {formatNumber(currentCropSpec.min_purity_percentage)}%
                      </p>
                      <p className="text-[9px] text-slate-400">Sound Grain Kernel Purity</p>
                    </div>

                    <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('quality_standards.param_special')}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-2">
                        {currentCropSpec.special_parameter}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Statutory Rules & Rights */}
          {activeTab === 'rules' && (
            <div className="space-y-3.5">
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm font-display">Government of India Gazette Legal Protections</p>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    Mandated under the Essential Commodities & Agricultural Produce Grading and Marking Act.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {(data.statutory_rules || FALLBACK_DATA.statutory_rules).map(rule => (
                  <div
                    key={rule.rule_id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] shadow-2xs space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                        {rule.rule_id}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-display">{rule.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-[#060a12] p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate pr-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Statutory Gazette Standard · Directorate of Marketing & Inspection</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
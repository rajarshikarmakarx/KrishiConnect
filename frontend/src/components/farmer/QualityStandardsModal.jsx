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
  Award,
  Edit3,
  Save,
  RotateCcw,
  Building2,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  Plus,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useAuth } from '../../AuthContext'
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

export default function QualityStandardsModal({
  isOpen = true,
  onClose,
  initialCrop = 'Paddy',
  centreId = null,
  centreName = null,
  isEditable = false
}) {
  const { user } = useAuth()
  const { t, translateCrop, formatNumber } = useTranslation()
  const [data, setData] = useState(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tiers') // 'tiers' | 'crops' | 'rules'
  const [selectedCrop, setSelectedCrop] = useState(initialCrop || 'Paddy')

  // Allow officer mode if isEditable prop is true, or user is operator/admin, or explicitly toggled
  const [officerMode, setOfficerMode] = useState(Boolean(isEditable || user?.role === 'operator' || user?.role === 'admin'))
  const canEdit = Boolean(officerMode || isEditable || user?.role === 'operator' || user?.role === 'admin')

  const [isEditing, setIsEditing] = useState(Boolean(isEditable || user?.role === 'operator' || user?.role === 'admin'))
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const startEditing = () => {
    setEditForm(JSON.parse(JSON.stringify(data)))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  useEffect(() => {
    if (initialCrop) {
      setSelectedCrop(initialCrop)
    }
  }, [initialCrop])

  // Keep officerMode in sync if props change
  useEffect(() => {
    if (isEditable || user?.role === 'operator' || user?.role === 'admin') {
      setOfficerMode(true)
    }
  }, [isEditable, user?.role])

  const loadStandards = () => {
    setLoading(true)
    const targetId = centreId || user?.assigned_centre_id
    const fetcher = targetId
      ? api.getCentreQualityStandards(targetId)
      : api.getQualityStandards()

    fetcher
      .then(res => {
        if (res && res.grading_tiers) {
          setData(res)
          setEditForm(JSON.parse(JSON.stringify(res)))
        }
      })
      .catch(() => {
        // Fallback data if offline
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadStandards()
  }, [centreId, user?.assigned_centre_id])

  useEffect(() => {
    if (data && (!editForm || !editForm.statutory_rules)) {
      setEditForm(JSON.parse(JSON.stringify(data)))
    }
  }, [data])

  const handleSave = async () => {
    const targetCentreId = centreId || user?.assigned_centre_id || 1
    setSaving(true)
    try {
      const payloadRules = editForm?.statutory_rules || data.statutory_rules
      const updated = await api.updateCentreQualityStandards(targetCentreId, {
        grading_tiers: editForm?.grading_tiers || data.grading_tiers,
        crop_standards: editForm?.crop_standards || data.crop_standards,
        statutory_rules: payloadRules,
        infrastructure_notes: editForm?.infrastructure_notes || data.infrastructure_notes,
      })
      setData(updated)
      setEditForm(JSON.parse(JSON.stringify(updated)))
      toast.success('Mandi quality standards & rules saved successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update quality standards')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const targetCentreId = centreId || user?.assigned_centre_id || 1
    if (!window.confirm('Reset this centre to state-level statutory Agmark standards?')) return
    setResetting(true)
    try {
      const resetData = await api.resetCentreQualityStandards(targetCentreId)
      setData(resetData)
      setEditForm(JSON.parse(JSON.stringify(resetData)))
      toast.success('Reset to statutory Agmark norms!')
    } catch (err) {
      toast.error(err.message || 'Failed to reset standards')
    } finally {
      setResetting(false)
    }
  }

  if (!isOpen) return null

  const activeData = isEditing && editForm ? editForm : data
  const cropStandardsList = activeData.crop_standards || FALLBACK_DATA.crop_standards
  const currentCropSpec = cropStandardsList.find(c => c.crop.toLowerCase() === selectedCrop.toLowerCase()) || cropStandardsList[0]

  // Helpers to update editForm fields
  const updateCropField = (cropName, field, value) => {
    setEditForm(prev => {
      const updatedList = prev.crop_standards.map(c => {
        if (c.crop.toLowerCase() === cropName.toLowerCase()) {
          return { ...c, [field]: value }
        }
        return c
      })
      return { ...prev, crop_standards: updatedList }
    })
  }

  const updateTierField = (index, field, value) => {
    setEditForm(prev => {
      const updatedTiers = [...prev.grading_tiers]
      updatedTiers[index] = { ...updatedTiers[index], [field]: value }
      return { ...prev, grading_tiers: updatedTiers }
    })
  }

  const updateRuleField = (index, field, value) => {
    setEditForm(prev => {
      const base = prev || JSON.parse(JSON.stringify(data))
      const updatedRules = [...(base?.statutory_rules || FALLBACK_DATA.statutory_rules)]
      updatedRules[index] = { ...updatedRules[index], [field]: value }
      return { ...base, statutory_rules: updatedRules }
    })
  }

  const handleAddRule = () => {
    setEditForm(prev => {
      const base = prev || JSON.parse(JSON.stringify(data))
      const existingRules = base?.statutory_rules || FALLBACK_DATA.statutory_rules || []
      const nextNum = existingRules.length + 1
      const ruleId = `RULE-${String(nextNum).padStart(2, '0')}`
      const newRule = {
        rule_id: ruleId,
        title: 'New Mandi Protocol / Grace Guideline',
        description: 'Specify details for this local procurement rule, courtyard drying guideline, or moisture meter protocol.'
      }
      return {
        ...base,
        statutory_rules: [...existingRules, newRule]
      }
    })
    toast.success('New rule added. Customize its details below.', { icon: '➕' })
  }

  const handleRemoveRule = (indexToRemove) => {
    setEditForm(prev => {
      const base = prev || JSON.parse(JSON.stringify(data))
      const existingRules = base?.statutory_rules || FALLBACK_DATA.statutory_rules || []
      const updatedRules = existingRules.filter((_, idx) => idx !== indexToRemove)
      return {
        ...base,
        statutory_rules: updatedRules
      }
    })
    toast('Rule crossed and removed.', { icon: '❌' })
  }

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
                  {canEdit && (centreName || data.centre_name)
                    ? `${centreName || data.centre_name} Mandi Standards`
                    : t('quality_standards.modal_title')}
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold px-2 py-0.5 rounded-full uppercase">
                  {canEdit ? 'Officer Desk' : 'Agmark FAQ'}
                </span>
                <button
                  type="button"
                  onClick={() => setOfficerMode(o => !o)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                    canEdit
                      ? 'bg-amber-400/30 text-amber-200 border-amber-400/50'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/20'
                  }`}
                  title="Toggle Officer Edit / Rule Management Mode"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{canEdit ? '⚙️ Officer Mode: Active' : 'Enable Officer Edit Mode'}</span>
                </button>
              </div>
              <p className="text-emerald-200/90 text-xs mt-0.5 font-medium">
                {isEditable
                  ? 'Decentralized mandi configuration accommodating local infrastructure readiness & drying capacity'
                  : t('quality_standards.modal_subtitle')}
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

        {/* Officer Toolbar: Edit Toggle & Mandi Decentralization Controls */}
        {isEditable && (
          <div className="bg-slate-100 dark:bg-[#0e1626] px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                {isEditing ? 'Editing mandi standards for this centre:' : 'Decentralized mandi specifications:'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    id="btn-edit-mandi-standards"
                    onClick={startEditing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Mandi Rules</span>
                  </button>
                  {data.is_customized && (
                    <button
                      id="btn-reset-standards"
                      onClick={handleReset}
                      disabled={resetting}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold transition-colors cursor-pointer"
                      title="Restore statutory state Agmark baseline"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>{resetting ? 'Resetting...' : 'Reset to Agmark Norms'}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    id="btn-save-mandi-standards"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Centre Standards'}</span>
                  </button>
                  <button
                    id="btn-cancel-edit-standards"
                    onClick={cancelEditing}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Infrastructure Notes Banner (When Editing or Available) */}
        {isEditing && (
          <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 border-b border-amber-200/80 dark:border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 mb-1 text-amber-900 dark:text-amber-300 font-bold">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Mandi Infrastructure Readiness & Notes:</span>
            </div>
            <input
              type="text"
              value={editForm?.infrastructure_notes || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, infrastructure_notes: e.target.value }))}
              placeholder="e.g. Equipped with calibrated digital moisture meter, 50-quintal drying yard, winnowing fan..."
              className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#0a101d] border border-amber-300 dark:border-amber-500/40 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

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

              {/* Edit Mode Tier Controls */}
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-display">
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      Configure Grading Tiers & MSP Slabs ({centreName || data.centre_name || 'Centre'})
                    </h4>
                  </div>
                  {(editForm?.grading_tiers || data.grading_tiers || FALLBACK_DATA.grading_tiers).map((tier, idx) => (
                    <div
                      key={tier.grade || idx}
                      className="bg-slate-50 dark:bg-[#0e1626] rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-display flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            tier.color === 'emerald' ? 'bg-emerald-500' :
                            tier.color === 'blue' ? 'bg-blue-500' :
                            tier.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {tier.tier_title || tier.label || tier.grade}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-500">Payout:</label>
                          <input
                            type="text"
                            value={tier.payout_percentage}
                            onChange={(e) => updateTierField(idx, 'payout_percentage', e.target.value)}
                            className="w-20 text-xs font-bold p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d] text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Moisture Range</label>
                          <input
                            type="text"
                            value={tier.moisture_threshold}
                            onChange={(e) => updateTierField(idx, 'moisture_threshold', e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chaff / Foreign Matter</label>
                          <input
                            type="text"
                            value={tier.foreign_matter_chaff || tier.chaff_threshold || ''}
                            onChange={(e) => updateTierField(idx, 'foreign_matter_chaff', e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Damaged / Discolored</label>
                          <input
                            type="text"
                            value={tier.damaged_discolored || tier.damaged_threshold || ''}
                            onChange={(e) => updateTierField(idx, 'damaged_discolored', e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Operational Mandi Notes / Protocol</label>
                        <textarea
                          rows={2}
                          value={tier.description}
                          onChange={(e) => updateTierField(idx, 'description', e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Official AGMARK Standards Comparison Table */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0e1626] shadow-xs">
                    <div className="bg-slate-100 dark:bg-white/5 px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-display">
                        <Award className="w-4 h-4 text-amber-500" />
                        AGMARK Standards Reference Matrix
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        {data.is_customized ? 'Mandi Adjusted' : 'DMI / FCI Norms'}
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
                          {(activeData.grading_tiers || FALLBACK_DATA.grading_tiers).map((tier, idx) => (
                            <tr key={tier.grade || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 font-bold whitespace-nowrap">
                                <div className={`font-extrabold text-xs ${
                                  tier.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' :
                                  tier.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                                  tier.color === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
                                }`}>
                                  {tier.tier_title?.split('(')[0]?.trim() || tier.grade}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  {tier.tier_title?.includes('(') ? `(${tier.tier_title.split('(')[1]}` : `(${tier.payout_percentage} MSP)`}
                                </div>
                              </td>
                              <td className="p-3 font-black whitespace-nowrap">{tier.moisture_threshold}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{tier.foreign_matter_chaff || tier.chaff_threshold}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{tier.damaged_discolored || tier.damaged_threshold}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">{tier.typical_market_destination || tier.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(activeData.grading_tiers || FALLBACK_DATA.grading_tiers).map((tier, idx) => {
                      const borderColor =
                        tier.color === 'emerald' ? 'border-emerald-300 dark:border-emerald-500/40' :
                        tier.color === 'blue' ? 'border-blue-200 dark:border-blue-500/40' :
                        tier.color === 'amber' ? 'border-amber-200 dark:border-amber-500/40' : 'border-red-200 dark:border-red-500/40'
                      const bgBadge =
                        tier.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' :
                        tier.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' :
                        tier.color === 'amber' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/30'
                      const pillBadge =
                        tier.color === 'emerald' ? 'bg-emerald-600 text-white' :
                        tier.color === 'blue' ? 'bg-blue-600 text-white' :
                        tier.color === 'amber' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'

                      return (
                        <div key={tier.grade || idx} className={`bg-white dark:bg-[#0e1626] rounded-2xl border-2 ${borderColor} p-4 shadow-xs relative overflow-hidden`}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center border ${bgBadge}`}>
                                {idx === 0 ? 'I' : idx === 1 ? 'II' : idx === 2 ? 'III' : '✕'}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm font-display">
                                    {tier.tier_title || tier.label}
                                  </h4>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bgBadge}`}>
                                    {tier.grade}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  {tier.payout_percentage} MSP Payout Slabs
                                </span>
                              </div>
                            </div>
                            <span className={`${pillBadge} font-black text-xs px-2.5 py-1 rounded-full shadow-xs`}>
                              {tier.payout_percentage} Rate
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                            {tier.description}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 border border-slate-200 dark:border-white/10">
                            <div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.moisture')}</p>
                              <p className="font-black text-slate-900 dark:text-white text-sm">{tier.moisture_threshold}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.foreign_chaff')}</p>
                              <p className="font-black text-slate-900 dark:text-white text-sm">{tier.chaff_threshold || '≤ 1.0%'}</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">{tier.foreign_matter_chaff}</span>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('completion.damaged_grain')}</p>
                              <p className="font-black text-slate-900 dark:text-white text-sm">{tier.damaged_threshold || '≤ 1.0%'}</p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">{tier.damaged_discolored}</span>
                            </div>
                          </div>
                          {tier.typical_market_destination && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                                Destination:
                              </span>
                              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                {tier.typical_market_destination}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
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
                          {isEditing ? 'Mandi Norm Editor' : 'Agmark FAQ'}
                        </span>
                      </h4>
                      {!isEditing && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentCropSpec.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* If Editing: Interactive input grid */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            {t('quality_standards.param_faq_moisture')} (% Max)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={currentCropSpec.faq_moisture_max}
                            onChange={(e) => updateCropField(currentCropSpec.crop, 'faq_moisture_max', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-black text-emerald-700 dark:text-emerald-400 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Full 100% statutory MSP intake threshold</span>
                        </div>

                        <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            {t('quality_standards.param_permissible_moisture')} (% Max)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={currentCropSpec.permissible_moisture_max}
                            onChange={(e) => updateCropField(currentCropSpec.crop, 'permissible_moisture_max', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-black text-blue-600 dark:text-blue-400 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Upper gate intake tolerance before rejection</span>
                        </div>

                        <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            {t('quality_standards.param_foreign_chaff')} (% Max)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={currentCropSpec.max_foreign_chaff}
                            onChange={(e) => updateCropField(currentCropSpec.crop, 'max_foreign_chaff', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-black text-slate-800 dark:text-slate-200 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Max dirt, chaff, and insoluble foreign matter</span>
                        </div>

                        <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            {t('quality_standards.param_damaged_grain')} (% Max)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={currentCropSpec.max_damaged_grains}
                            onChange={(e) => updateCropField(currentCropSpec.crop, 'max_damaged_grains', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-black text-slate-800 dark:text-slate-200 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Max insect-damaged, discolored, or broken grains</span>
                        </div>

                        <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            {t('quality_standards.param_min_purity')} (% Min)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={currentCropSpec.min_purity_percentage}
                            onChange={(e) => updateCropField(currentCropSpec.crop, 'min_purity_percentage', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm font-black text-emerald-600 dark:text-emerald-400 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Minimum sound kernel purity</span>
                        </div>

                        <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                            {t('quality_standards.param_special')}
                          </label>
                          <input
                            type="text"
                            value={currentCropSpec.special_parameter || ''}
                            onChange={(e) => updateCropField(currentCropSpec.crop, 'special_parameter', e.target.value)}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                            placeholder="e.g. Max 3.0% shrivelled grains"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Specific varietal statutory parameter</span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#0a101d] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                          Mandi Notes & Local Assaying Guidelines
                        </label>
                        <textarea
                          rows={2}
                          value={currentCropSpec.notes || ''}
                          onChange={(e) => updateCropField(currentCropSpec.crop, 'notes', e.target.value)}
                          placeholder="Enter instructions for assayer desk and local drying court..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Read-Only Grid of specifications */
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Statutory Rules & Rights */}
          {activeTab === 'rules' && (
            <div className="space-y-3.5">
              {/* Officer Direct Action Banner */}
              {canEdit ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400/80 dark:border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Mandi Rules Editor
                      </span>
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        {canEdit ? 'Customizable Mandi Rules Active' : 'Statutory Defaults'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1">
                      Use the red <strong>Cross (✕)</strong> button on each card to remove a rule, or click <strong>+ Add New Mandi Rule</strong> below.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="btn-add-rule-top"
                      onClick={handleAddRule}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Add Rule</span>
                    </button>
                    <button
                      type="button"
                      id="btn-save-rules-top"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Rules'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm font-display">Government of India Gazette Legal Protections</p>
                      <button
                        type="button"
                        onClick={() => setOfficerMode(true)}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                      >
                        ⚙️ Enable Rules Editor
                      </button>
                    </div>
                    <p className="text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                      Mandated under the Essential Commodities & Agricultural Produce Grading and Marking Act.
                    </p>
                  </div>
                </div>
              )}

              {/* Rules List */}
              <div className="space-y-3">
                {((canEdit && editForm?.statutory_rules)
                  ? editForm.statutory_rules
                  : (data?.statutory_rules || FALLBACK_DATA.statutory_rules || [])
                ).map((rule, idx) => (
                  <div
                    key={rule.rule_id || idx}
                    className="p-4 rounded-2xl border-2 border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0e1626] shadow-sm space-y-3 relative group transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {canEdit ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="text"
                            value={rule.rule_id || ''}
                            onChange={(e) => updateRuleField(idx, 'rule_id', e.target.value)}
                            placeholder="RULE-ID"
                            className="w-24 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold border border-slate-300 dark:border-slate-700 uppercase"
                            title="Rule Identifier"
                          />
                          <input
                            type="text"
                            value={rule.title || ''}
                            onChange={(e) => updateRuleField(idx, 'title', e.target.value)}
                            placeholder="Enter Rule Title..."
                            className="flex-1 text-xs sm:text-sm font-bold p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                            {rule.rule_id}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-display truncate">
                            {rule.title}
                          </h4>
                        </div>
                      )}

                      {/* Explicit CROSS & REMOVE button */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 font-bold text-xs transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
                          title="Cross out & remove this rule"
                          aria-label="Cross and remove rule"
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                          <span>Cross & Remove</span>
                        </button>
                      )}
                    </div>

                    {canEdit ? (
                      <textarea
                        rows={2}
                        value={rule.description || ''}
                        onChange={(e) => updateRuleField(idx, 'description', e.target.value)}
                        placeholder="Detailed rule description, grace allowances, procedures..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a101d] text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:outline-none leading-relaxed"
                      />
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {rule.description}
                      </p>
                    )}
                  </div>
                ))}

                {/* Empty State */}
                {canEdit && (editForm?.statutory_rules || []).length === 0 && (
                  <div className="text-center py-8 px-4 text-xs text-slate-400 border-2 border-dashed border-slate-300 dark:border-white/15 rounded-3xl space-y-2">
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">All rules have been removed.</p>
                    <p>Click the button below to add your custom mandi protocol or grace rule.</p>
                  </div>
                )}

                {/* Primary Add New Rule Action Button */}
                {canEdit && (
                  <button
                    type="button"
                    id="btn-add-mandi-rule-bottom"
                    onClick={handleAddRule}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-emerald-500 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    <span>+ Add New Mandi Rule</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-[#060a12] p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate pr-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              {canEdit && (centreName || data.centre_name)
                ? `Mandi Protocol · ${centreName || data.centre_name}`
                : 'Statutory Gazette Standard · Directorate of Marketing & Inspection'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Mandi Rules'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
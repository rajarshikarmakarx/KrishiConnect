import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import {
  Wheat, Users, CheckCircle, Clock, X, Wifi, WifiOff,
  IndianRupee, User, LogOut, Building2, ChevronDown, Scale,
  Sparkles, AlertCircle, ShieldCheck, Droplets, Sun, AlertTriangle,
  Zap, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import NotificationCenter from '../components/NotificationCenter'
import ThemeToggle from '../components/ThemeToggle'
import { useCentreQueue } from '../hooks/useRealtimeQueue'

const MSP_RATES = {
  'Paddy': 23.00,
  'Wheat': 22.75,
  'Mustard': 59.50,
  'Jute': 53.35,
  'Maize': 22.25,
  'Potato': 10.25,
  'Onion': 18.25
}

function StatCard({ label, value, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-800 dark:text-slate-200',
    green: 'text-emerald-700 dark:text-emerald-400',
    orange: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400'
  }
  return (
    <div className="bg-white dark:bg-[#0a101d] rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm text-center transition-all">
      <div className={`text-2xl sm:text-3xl font-bold font-display ${colors[color]}`}>{value}</div>
      <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider">{label}</div>
    </div>
  )
}

function OperatorProfileMenu({ user, logout, centreName }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        id="btn-profile-menu"
        onClick={() => setOpen(o => !o)}
        aria-label="Operator Profile"
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 cursor-pointer shrink-0 active:scale-95 shadow-xs"
      >
        <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left leading-none min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white max-w-[140px] md:max-w-[180px] lg:max-w-[220px] truncate">
            {user.full_name}
          </span>
          <span className="text-[10px] text-emerald-200/90 font-medium hidden md:inline truncate mt-0.5">
            Procurement Officer
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#0e1626] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-2 shadow-inner">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white text-sm font-display">{user.full_name}</p>
            <p className="text-slate-300 text-xs">Procurement Officer · {user.mobile}</p>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{centreName || 'Assigned Centre'}</span>
            </div>
          </div>
          <div className="p-2">
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CounterCard({ counter, onComplete, onStart }) {
  const hasEntry = !!counter.current_token
  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      hasEntry
        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 shadow-sm'
        : 'bg-white dark:bg-[#0a101d] border-slate-200 dark:border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{counter.label}</span>
        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
          hasEntry
            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
        }`}>
          {hasEntry ? 'BUSY' : 'FREE'}
        </span>
      </div>
      {hasEntry ? (
        <div>
          <div className="token-display text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-300 mb-1">{counter.current_token}</div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mb-1 truncate font-semibold">{counter.current_farmer_name}</p>
          {counter.current_crop && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {counter.current_crop} · {counter.current_expected_qty != null ? (Math.round(Number(counter.current_expected_qty) * 10) / 10) : ''} kg expected
            </p>
          )}
          {counter.current_assay && (
            <div className="mb-3 text-[10px] font-bold bg-white dark:bg-[#0e1626] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between text-slate-700 dark:text-slate-300 shadow-2xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <ShieldCheck className="w-3 h-3" /> {counter.current_assay.grade}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{counter.current_assay.moisture_percentage}% moisture</span>
            </div>
          )}
          <div className="flex gap-2 mt-1">
            {counter.current_entry_status === 'CALLED' && (
              <button
                id={`btn-start-${counter.id}`}
                onClick={() => onStart(counter.current_queue_entry_id)}
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Start
              </button>
            )}
            <button
              id={`btn-complete-${counter.id}`}
              onClick={() => onComplete(
                counter.current_queue_entry_id,
                counter.current_token,
                counter.current_crop,
                counter.current_expected_qty,
                counter.current_farmer_name,
                counter.current_assay
              )}
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Intake & Complete ✓
            </button>
          </div>
        </div>
      ) : (
        <div className="text-slate-400 dark:text-slate-600 text-xs sm:text-sm text-center py-3">No farmer assigned</div>
      )}
    </div>
  )
}

function CompleteModal({ queueId, token, crop, expectedQty, farmerName, initialAssay, onClose, onSuccess }) {
  const mspRate = crop && MSP_RATES[crop] ? MSP_RATES[crop] : (MSP_RATES['Paddy'] || 23.00)
  const formattedQty = expectedQty != null ? String(Math.round(Number(expectedQty) * 10) / 10) : ''
  const [acceptedQty, setAcceptedQty] = useState(formattedQty)
  const [moisture, setMoisture] = useState(initialAssay?.moisture_percentage ?? 13.5)
  const [chaff, setChaff] = useState(initialAssay?.chaff_percentage ?? 0.5)
  const [damaged, setDamaged] = useState(initialAssay?.damaged_grains_percentage ?? 0.0)
  const [notes, setNotes] = useState(initialAssay?.notes || '')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isManualOverride, setIsManualOverride] = useState(false)

  const numMoisture = parseFloat(moisture) || 0
  const numChaff = parseFloat(chaff) || 0
  const numDamaged = parseFloat(damaged) || 0

  // 1. Evaluate Moisture Tier
  let tierMoisture = 1
  if (numMoisture <= 14.0) tierMoisture = 1
  else if (numMoisture <= 17.0) tierMoisture = 2
  else if (numMoisture < 20.0) tierMoisture = 3
  else tierMoisture = 4

  // 2. Evaluate Foreign Matter / Chaff Tier
  let tierChaff = 1
  if (numChaff <= 1.0) tierChaff = 1
  else if (numChaff <= 1.5) tierChaff = 2
  else if (numChaff <= 3.0) tierChaff = 3
  else tierChaff = 4

  // 3. Evaluate Damaged / Discolored Kernels Tier
  let tierDamaged = 1
  if (numDamaged <= 1.0) tierDamaged = 1
  else if (numDamaged <= 3.0) tierDamaged = 2
  else if (numDamaged <= 5.0) tierDamaged = 3
  else tierDamaged = 4

  // Composite 3-Parameter Average Tier
  const avgTier = (tierMoisture + tierChaff + tierDamaged) / 3.0

  const isSpoiled = numMoisture >= 20.0 || numChaff > 3.0 || numDamaged > 5.0 || avgTier > 3.4
  const isMarginal = !isSpoiled && (numMoisture > 17.0 || avgTier > 2.4)
  const isGradeB = !isSpoiled && !isMarginal && avgTier > 1.0
  const isGradeA = !isSpoiled && !isMarginal && !isGradeB

  let gradeLabel = 'Grade A · FAQ Standard (Grade I Premium)'
  let gradeBadgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
  let suggestedRate = mspRate
  let discountPercent = 0
  let gradeDesc = 'Excellent produce quality! Meets Govt Fair Average Quality (FAQ) Grade I norms for full statutory MSP.'

  if (isSpoiled) {
    if (numMoisture >= 20.0) {
      gradeLabel = `Rejected · Silo Spoilage Hazard (${numMoisture.toFixed(1)}% Moisture)`
      gradeDesc = '⚠️ Severe Spoilage Risk: Moisture (≥20.0%) exceeds safe silo storage limits. Direct intake blocked to prevent fungal aflatoxin rot.'
    } else if (numChaff > 3.0) {
      gradeLabel = `Rejected · Sample Grade (${numChaff.toFixed(1)}% Foreign Chaff)`
      gradeDesc = '⚠️ Sample Grade: Foreign matter / chaff exceeds permissible statutory threshold (3.0%). Produce rejected for direct procurement.'
    } else if (numDamaged > 5.0) {
      gradeLabel = `Rejected · Sample Grade (${numDamaged.toFixed(1)}% Damaged Kernels)`
      gradeDesc = '⚠️ Sample Grade: Damaged/discolored grains exceed permissible statutory threshold (5.0%). Produce rejected for direct procurement.'
    } else {
      gradeLabel = `Rejected · Sample Grade (Average Tier ${avgTier.toFixed(2)})`
      gradeDesc = '⚠️ Sample Grade Rejection: Composite 3-parameter quality score exceeds permissible commercial thresholds.'
    }
    gradeBadgeColor = 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border-red-300 dark:border-red-500/30'
    suggestedRate = 0
    discountPercent = 100
  } else if (isMarginal) {
    gradeLabel = numMoisture > 17.0
      ? `Grade C / High Moisture (${numMoisture.toFixed(1)}%) · Sun-Drying Needed`
      : `Grade C / Utility (Grade III & IV) · 10% Value Cut`
    gradeBadgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
    suggestedRate = Math.round(mspRate * 0.90 * 100) / 100
    discountPercent = 10
    gradeDesc = numMoisture > 17.0
      ? 'Moisture is marginal (17.1-19.9%). Mandi courtyard sun-drying grace (2.5h) or 10% Grade C value cut recommended.'
      : 'Composite quality evaluated as Grade III & IV Utility. Blending or 10% value cut applies.'
  } else if (isGradeB) {
    gradeLabel = 'Grade B · Permissible Standard (Grade II)'
    gradeBadgeColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-500/30'
    suggestedRate = Math.round(mspRate * 0.98 * 100) / 100
    discountPercent = 2
    gradeDesc = 'Composite Agmark score within permissible Grade II limits. Approved with statutory 2% value cut.'
  }

  const [rate, setRate] = useState(String(suggestedRate))

  // Automatic Gradewise Pricing Model: Keep rate synchronized with assigned grade in real time
  useEffect(() => {
    if (!isManualOverride) {
      setRate(String(suggestedRate))
    }
  }, [suggestedRate, isManualOverride])

  const total = acceptedQty && rate && !isSpoiled ? (parseFloat(acceptedQty) * parseFloat(rate)).toFixed(2) : null

  const handleSubmit = async () => {
    if (isSpoiled) {
      return toast.error('Intake Prohibited: Produce fails Agmark quality thresholds. Please reject lot or grant sun-drying grace.')
    }
    if (!acceptedQty || !rate) return toast.error('Enter accepted quantity and rate')
    setLoading(true)
    try {
      await api.completeProcurement(queueId, {
        accepted_quantity_kg: parseFloat(acceptedQty),
        rate_per_kg: parseFloat(rate),
        moisture_percentage: numMoisture,
        chaff_percentage: parseFloat(chaff) || 0,
        damaged_grains_percentage: parseFloat(damaged) || 0,
        notes: notes || undefined
      })
      toast.success(`Token ${token} verified (${gradeLabel.split('·')[0].trim()}) & completed! Payment initiated.`, { duration: 3500 })
      onSuccess()
    } catch (e) {
      toast.error(e.message || 'Failed to complete procurement')
    } finally {
      setLoading(false)
    }
  }

  const handleQualityAction = async (actionType) => {
    setActionLoading(true)
    try {
      await api.recordQualityAction(queueId, {
        action: actionType,
        moisture_percentage: numMoisture,
        chaff_percentage: parseFloat(chaff) || 0,
        damaged_grains_percentage: parseFloat(damaged) || 0,
        notes: notes || undefined
      })
      if (actionType === 'REJECT') {
        const rejDetail = numMoisture >= 20.0 ? `${numMoisture.toFixed(1)}% moisture` : numChaff > 3.0 ? `${numChaff.toFixed(1)}% chaff` : numDamaged > 5.0 ? `${numDamaged.toFixed(1)}% damaged` : 'defect limits exceeded'
        toast.error(`Token ${token} produce rejected (${rejDetail}). Farmer notified.`, { duration: 4000 })
      } else {
        toast.success(`Token ${token} granted 2.5h sun-drying grace. Farmer notified.`, { duration: 4000, icon: '☀️' })
      }
      onSuccess()
    } catch (e) {
      toast.error(e.message || 'Failed to record quality decision')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0a101d] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in border border-slate-100 dark:border-white/10">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="token-display text-2xl font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
              {token}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm font-display">{crop || 'Produce'} Intake & Quality Assay</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{farmerName ? `Farmer: ${farmerName}` : 'Counter Inspection & Weighbridge'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Section 1: Gate Quality & Digital Moisture Assay */}
          <div className="bg-slate-50/80 dark:bg-white/5 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 1. Digital Moisture & Quality Assay
              </span>
              <span className="text-[11px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                Agmark / Mandi Norms
              </span>
            </div>

            {/* Moisture Slider & Inputs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="moisture-val" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Moisture Content Percentage:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="moisture-val"
                    type="number"
                    step="0.1"
                    min="5"
                    max="30"
                    value={moisture}
                    onChange={e => setMoisture(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center text-sm font-extrabold text-blue-900 dark:text-blue-200 bg-white dark:bg-[#0e1626] border border-blue-300 dark:border-blue-500/40 rounded-lg py-0.5"
                  />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">%</span>
                </div>
              </div>
              <input
                id="moisture-slider"
                type="range"
                min="8.0"
                max="25.0"
                step="0.1"
                value={moisture}
                onChange={e => setMoisture(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-white/10 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>8% Dry</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">14% Max FAQ</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">17% Max Grade B</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">20%+ Spoilage Risk</span>
              </div>
            </div>

            {/* Impurities & Foreign Matter Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Foreign Chaff / Insoluble (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={chaff}
                  onChange={e => setChaff(parseFloat(e.target.value) || 0)}
                  className="input-field text-xs py-1.5"
                  placeholder="e.g. 0.5"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Damaged / Discolored (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={damaged}
                  onChange={e => setDamaged(parseFloat(e.target.value) || 0)}
                  className="input-field text-xs py-1.5"
                  placeholder="e.g. 0.0"
                />
              </div>
            </div>

            {/* Live Assayer Grade Status Banner */}
            <div className={`rounded-xl p-3 border text-xs flex items-start gap-2.5 transition-all ${gradeBadgeColor}`}>
              <div className="mt-0.5">
                {isSpoiled ? <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" /> : isMarginal ? <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm">{gradeLabel}</p>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                  {gradeDesc}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for High Moisture / Rejection */}
            {(isMarginal || isSpoiled) && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQualityAction('SUN_DRYING_DEFERRAL')}
                  disabled={actionLoading}
                  className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5" />
                  Grant 2.5h Yard Drying
                </button>
                <button
                  type="button"
                  onClick={() => handleQualityAction('REJECT')}
                  disabled={actionLoading}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject Produce Lot
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Weighbridge & Payment Settlement */}
          <div className="bg-slate-50/80 dark:bg-white/5 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 2. Weighbridge & Payout Disbursal
              </span>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                Govt MSP: ₹{mspRate.toFixed(2)}/kg
              </span>
            </div>

            {/* Automatic Gradewise Pricing Breakdown */}
            <div className="bg-white dark:bg-[#0e1626] rounded-xl p-3 border border-slate-200 dark:border-white/10 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-display">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Automatic Gradewise Pricing
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${gradeBadgeColor}`}>
                  {isGradeB
                    ? 'Grade B: -2% Statutory Value Cut'
                    : isMarginal
                    ? 'Grade C: -10% Sun-Drying Grace'
                    : isGradeA
                    ? 'Grade A: 100% Full MSP'
                    : 'Intake Blocked'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-white/5">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Base Mandi MSP</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{mspRate.toFixed(2)}/kg</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Grade Adjustment</span>
                  <span className={`font-bold ${isGradeB ? 'text-blue-600 dark:text-blue-400' : isMarginal ? 'text-amber-600 dark:text-amber-400' : isSpoiled ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {isGradeB
                      ? `-2% (-₹${(mspRate - suggestedRate).toFixed(2)})`
                      : isMarginal
                      ? `-10% (-₹${(mspRate - suggestedRate).toFixed(2)})`
                      : isSpoiled
                      ? 'Rejection (₹0.00)'
                      : '0% (Full Rate)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Mandated Rate</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{suggestedRate.toFixed(2)}/kg</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Accepted Weight (kg) *</label>
                <input
                  id="accepted-qty"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 242.5"
                  value={acceptedQty}
                  onChange={e => setAcceptedQty(e.target.value)}
                  className="input-field font-semibold"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Rate (₹/kg) {isManualOverride ? '(Manual)' : '(Auto)'} *
                  </label>
                  {isManualOverride ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualOverride(false)
                        setRate(String(suggestedRate))
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      Reset to Auto
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Gradewise Linked
                    </span>
                  )}
                </div>
                <input
                  id="rate-per-kg"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 23.00"
                  value={rate}
                  onChange={e => {
                    setRate(e.target.value)
                    setIsManualOverride(true)
                  }}
                  className="input-field font-semibold"
                />
              </div>
            </div>

            {total && !isSpoiled && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-extrabold">Total Direct Benefit Transfer (DBT)</p>
                  <p className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">₹{parseFloat(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  <p>{acceptedQty} kg @ ₹{parseFloat(rate).toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Direct to Bank A/C</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assayer / Inspection Remarks</label>
              <input
                id="proc-notes"
                type="text"
                placeholder="e.g. FAQ standard passed, clean sample"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Complete Submission Button */}
          <div>
            {isSpoiled ? (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-center text-xs text-red-800 dark:text-red-300 font-bold">
                🚫 Procurement blocked: Moisture ({numMoisture.toFixed(1)}%) is above the 20% safe storage limit. Please reject the lot or send for sun-drying.
              </div>
            ) : (
              <button
                id="btn-confirm-complete"
                onClick={handleSubmit}
                disabled={loading || actionLoading || !acceptedQty || !rate}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg shadow-emerald-700/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '✅ Approve Produce & Disburse Payment'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CancelConfirmModal({ entry, onClose, onConfirm, loading }) {
  if (!entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0a101d] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-white/10 animate-scale-in">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-500/30 shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Cancel Queue Booking?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              This will remove the farmer from the active queue and cancel their token.
            </p>
          </div>

          {/* Farmer & Token Preview */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3.5 border border-slate-200/70 dark:border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Token Number</span>
              <span className="token-display font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0e1626] px-2.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-sm">
                {entry.token}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Farmer Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.farmer_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Crop & Quantity</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{entry.crop} · {entry.expected_quantity_kg != null ? (Math.round(Number(entry.expected_quantity_kg) * 10) / 10) : ''} kg</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Keep in Queue
            </button>
            <button
              type="button"
              id="btn-confirm-cancel-entry"
              onClick={() => onConfirm(entry.id)}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Yes, Cancel Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const STATUTORY_BUMP_PRESETS = [
  "Perishable produce at spoilage risk (high ambient moisture / rain threat)",
  "Elderly, disabled, or women farmer special queue accommodation",
  "Tractor / logistics vehicle overheating or breakdown outside gate",
  "Sun-Drying yard re-inspection following completed grace period",
  "Statutory administrative order / priority lot inspection",
  "Other statutory ground (specify custom justification below)"
]

function BumpPriorityModal({ entry, allCountersOccupied, onClose, onSuccess }) {
  const [selectedPreset, setSelectedPreset] = useState(STATUTORY_BUMP_PRESETS[0])
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  const isRemarksValid = customReason.trim().length >= 5
  const effectiveReason = selectedPreset.startsWith('Other')
    ? customReason.trim()
    : `${selectedPreset} — ${customReason.trim()}`

  const handleConfirm = async () => {
    if (!isRemarksValid) {
      return toast.error('Additional Assayer Remarks are required (minimum 5 characters).')
    }
    setLoading(true)
    try {
      await api.bumpQueueEntry(entry.id, {
        reason: effectiveReason,
        priority_level: 1,
        call_now: true
      })
      if (!allCountersOccupied) {
        toast.success(`Token ${entry.token} priority-bumped and called to counter!`, { duration: 4000 })
      } else {
        toast.success(`Token ${entry.token} priority-bumped to #1 in queue!`, { duration: 4000 })
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Failed to authorize priority bump')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-800 animate-fade-in space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gate Assayer Priority Bump & Call</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {allCountersOccupied 
                  ? 'Statutory priority authorization (#1 in queue · all counters currently busy)'
                  : 'Statutory priority authorization & immediate counter call'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Info Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="token-display text-xl font-black text-amber-800 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-500/30">
              {entry.token}
            </span>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">{entry.farmer_name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{entry.crop} · {entry.expected_quantity_kg != null ? (Math.round(Number(entry.expected_quantity_kg) * 10) / 10) : ''} kg</div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            Waiting in Queue
          </span>
        </div>

        {/* Statutory Preset Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Statutory Reason Preset <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="w-full text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {STATUTORY_BUMP_PRESETS.map((preset, idx) => (
              <option key={idx} value={preset}>{preset}</option>
            ))}
          </select>
        </div>

        {/* Additional Assayer Remarks (Required for all reasons) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Additional Assayer Remarks <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {customReason.trim().length}/5 chars min
            </span>
          </div>
          <textarea
            rows={2}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Enter mandatory inspection notes, vehicle number, or reason details..."
            className={`w-full text-xs sm:text-sm bg-white dark:bg-slate-800 border rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 transition-colors ${
              isRemarksValid
                ? 'border-slate-300 dark:border-slate-700 focus:border-amber-500'
                : 'border-amber-400 dark:border-amber-500/60 focus:border-amber-500'
            }`}
          />
          {!isRemarksValid && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
              * Additional remarks are required for all statutory bump authorizations (minimum 5 characters).
            </p>
          )}
        </div>

        {/* Legal Immutability Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300/80 dark:border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
            <strong>Permanent Statutory Audit Lock:</strong> Once authorized, this reason is sealed in state procurement records and <u>CANNOT</u> be modified, edited, or cleared by anyone (including District Admin).
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-bump"
            onClick={handleConfirm}
            disabled={loading || !isRemarksValid}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              allCountersOccupied ? 'Authorize Priority Bump (#1 in Queue)' : 'Authorize Bump & Call'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function BumpAuditViewModal({ entry, onClose }) {
  if (!entry) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 animate-fade-in space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Statutory Priority Bump Audit</h3>
              <p className="text-[11px] text-slate-400">Official Gate Assayer Record</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Token Number</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{entry.token}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Farmer Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.farmer_name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Authorized By</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.bumped_by_name || 'Gate Assayer'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Timestamp</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {entry.bumped_at ? new Date(entry.bumped_at).toLocaleString('en-IN') : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Immutable Statutory Reason:</span>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">
              {entry.bump_reason || 'Priority lot intake authorized per assayer inspection.'}
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300/60 dark:border-emerald-500/20 rounded-2xl p-2.5 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
            Audit status: Legally sealed and tamper-proof.
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function PaymentPanel({ centreId, onPay, payingId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getPendingPayments(centreId)
      setItems(data || [])
    } catch {} finally {
      setLoading(false)
    }
  }, [centreId])

  useEffect(() => {
    load()
  }, [load, payingId])

  useCentreQueue(centreId, load)

  if (!items.length) return null

  return (
    <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Direct Benefit Transfer (DBT) Payout Settlement
        </h2>
        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
          {items.length} Pending Disbursal
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Authorise instant government payment credit to farmer bank accounts via PFMS / e-Kuber gateway.
      </p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.payment_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-500/30 transition-colors gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="token-display font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0e1626] px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/40 text-sm">
                  {item.token}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{item.farmer_name}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0e1626] px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 font-medium">
                  {item.crop} · {item.accepted_quantity_kg} kg @ ₹{item.rate_per_kg}/kg
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Procurement verified · Direct payout due: <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">₹{item.amount?.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <button
              id={`btn-pay-${item.payment_id}`}
              onClick={() => onPay(item.payment_id, item.token, item.amount)}
              disabled={payingId === item.payment_id}
              className="btn-primary py-2 px-4 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
            >
              {payingId === item.payment_id ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '🏛️ Confirm Govt Payment Disbursal'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OperatorApp() {
  const { user, logout } = useAuth()
  const { addNotification } = useNotifications()
  const centreId = user?.assigned_centre_id || 1
  const [queue, setQueue] = useState(null)
  const [centreDetail, setCentreDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [callingNext, setCallingNext] = useState(false)
  const [callingId, setCallingId] = useState(null)
  const [completeModal, setCompleteModal] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [bumpModal, setBumpModal] = useState(null)
  const [auditModal, setAuditModal] = useState(null)

  const loadQueue = useCallback(async () => {
    try {
      const [q, c] = await Promise.all([
        api.getCentreQueue(centreId),
        api.getCentre(centreId)
      ])
      setQueue(q)
      setCentreDetail(c)
    } catch (e) {
      toast.error('Could not load queue')
    } finally {
      setLoading(false)
    }
  }, [centreId])

  const debounceTimerRef = useRef(null)
  const debouncedLoadQueue = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      loadQueue()
    }, 250)
  }, [loadQueue])

  const { connected, reconnecting } = useCentreQueue(centreId, debouncedLoadQueue)

  useEffect(() => { loadQueue() }, [loadQueue])

  const handleCallNext = async () => {
    setCallingNext(true)
    try {
      const res = await api.callNext(centreId)
      if (res.token) {
        toast.success(`🔔 Called ${res.token} → ${res.counter}`)
        addNotification({
          title: `Called Token ${res.token}`,
          message: `Farmer called to ${res.counter || 'Counter'}. Digital moisture testing & weighbridge inspection active.`,
          type: 'queue',
          eventKey: `call-${res.token}-${Date.now()}`
        })
        await loadQueue()
      } else {
        toast('No farmers waiting in queue', { icon: 'ℹ️' })
      }
    } catch (e) {
      toast.error(e.message || 'Failed to call next')
    } finally {
      setCallingNext(false)
    }
  }

  const handleCallSpecific = async (entry) => {
    setCallingId(entry.id)
    try {
      const res = await api.callSpecific(entry.id)
      toast.success(`🔔 Called ${res.token} → ${res.counter || 'counter'}`)
      addNotification({
        title: `Called Token ${res.token}`,
        message: `Farmer ${entry.farmer_name} called to ${res.counter || 'Counter'} for produce inspection.`,
        type: 'queue',
        eventKey: `call-spec-${entry.id}-${Date.now()}`
      })
      await loadQueue()
    } catch (e) {
      toast.error(e.message || 'Could not call farmer')
    } finally {
      setCallingId(null)
    }
  }

  const handleConfirmCancel = async (queueId) => {
    setCancelling(true)
    try {
      await api.cancelBooking(queueId)
      toast.success('✅ Booking cancelled successfully')
      addNotification({
        title: 'Queue Booking Cancelled',
        message: `Queue entry #${queueId} was removed from the active queue.`,
        type: 'alert',
        eventKey: `cancel-${queueId}-${Date.now()}`
      })
      setCancelModal(null)
      await loadQueue()
    } catch (e) {
      toast.error(e.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleStart = async (queueId) => {
    try {
      await api.startProcessing(queueId)
      toast.success('Processing started')
      addNotification({
        title: 'Intake Processing Started',
        message: `Sample assay and weight capture initiated for Queue Entry #${queueId}.`,
        type: 'info',
        eventKey: `start-${queueId}-${Date.now()}`
      })
      await loadQueue()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleCompleteSuccess = async () => {
    setCompleteModal(null)
    addNotification({
      title: 'Procurement Intake Certified',
      message: `Produce quality certified and procurement recorded. DBT payment queued for disbursal.`,
      type: 'success',
      eventKey: `completed-op-${Date.now()}`
    })
    await loadQueue()
  }

  const handleMarkPaid = async (paymentId, token, amount) => {
    setPayingId(paymentId)
    try {
      await api.markPaid(paymentId)
      toast.success(`Govt Payment of ₹${amount?.toLocaleString('en-IN')} for ${token} completed & disbursed!`, {
        duration: 3800,
      })
      addNotification({
        title: 'DBT Payment Disbursed',
        message: `₹${amount?.toLocaleString('en-IN')} disbursed to farmer for Token ${token}.`,
        type: 'payment',
        eventKey: `paid-${paymentId}-${Date.now()}`
      })
      await loadQueue()
    } catch (e) {
      toast.error(e.message || 'Failed to disburse payment')
    } finally {
      setPayingId(null)
    }
  }

  const waiting = queue?.entries.filter(e => e.status === 'WAITING') || []
  const processing = queue?.entries.filter(e => ['CALLED', 'PROCESSING'].includes(e.status)) || []

  const activeCounters = centreDetail?.counters?.filter(c => c.is_active) || []
  const occupiedCount = activeCounters.filter(c => processing.some(e => e.counter_id === c.id)).length
  const allCountersOccupied = activeCounters.length > 0 && occupiedCount >= activeCounters.length

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-800 dark:text-slate-200">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 w-full max-w-full overflow-x-hidden flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="gov-header text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-md w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 w-full min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/15 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/25 shadow-inner backdrop-blur-sm shrink-0">
              <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-xl text-white tracking-tight truncate font-display">
                  {queue?.centre_name || 'Procurement Centre'}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Officer Desk
                </span>
              </div>
              <p className="hidden sm:block text-emerald-200/90 text-xs font-medium truncate mt-1 leading-none">
                Real-time Counter Manager & Gate Assayer Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/15 shrink-0">
              {reconnecting ? (
                <><WifiOff className="w-3.5 h-3.5 text-yellow-300 shrink-0" /><span className="text-yellow-200 hidden sm:inline">Reconnecting</span></>
              ) : (
                <><div className="live-dot shrink-0" /><span className="text-emerald-200 font-bold text-[11px] sm:text-xs">LIVE</span></>
              )}
            </div>
            <ThemeToggle />
            <NotificationCenter dark={true} />
            <OperatorProfileMenu user={user} logout={logout} centreName={queue?.centre_name} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Waiting" value={queue?.waiting_count || 0} color="slate" />
          <StatCard label="Processing" value={queue?.processing_count || 0} color="orange" />
          <StatCard label="Completed" value={queue?.completed_count || 0} color="green" />
          <StatCard label="Cancelled" value={queue?.cancelled_count || 0} color="red" />
        </div>

        {/* Active Counters */}
        {activeCounters.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold font-display text-slate-900 dark:text-white">Active Procurement Counters</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                allCountersOccupied
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
              }`}>
                {occupiedCount} of {activeCounters.length} Counters Occupied
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeCounters.map(counter => {
                const activeEntry = processing.find(e => e.counter_id === counter.id)
                return (
                  <CounterCard
                    key={counter.id}
                    counter={{
                      ...counter,
                      current_token: activeEntry?.token || counter.current_token,
                      current_farmer_name: activeEntry?.farmer_name || counter.current_farmer_name,
                      current_queue_entry_id: activeEntry?.id || counter.current_queue_entry_id,
                      current_entry_status: activeEntry?.status,
                      current_crop: activeEntry?.crop,
                      current_expected_qty: activeEntry?.expected_quantity_kg
                    }}
                    onComplete={(id, token, crop, expectedQty) => setCompleteModal({ queueId: id, token, crop, expectedQty })}
                    onStart={handleStart}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Call Next */}
        <div className="bg-white dark:bg-[#0a101d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold font-display text-slate-900 dark:text-white">Next in Queue</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {waiting.length} farmer(s) waiting
                {allCountersOccupied && <span className="text-amber-600 dark:text-amber-400 font-medium ml-2">· All counters busy</span>}
              </p>
            </div>
            <button
              id="btn-call-next"
              onClick={handleCallNext}
              disabled={callingNext || waiting.length === 0 || allCountersOccupied}
              title={allCountersOccupied ? "Cannot call: All counters are occupied" : "Call the next waiting farmer"}
              className="btn-saffron flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {callingNext ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📣'}
              {allCountersOccupied ? 'All Counters Busy' : 'Call Next Farmer'}
            </button>
          </div>

          {waiting.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-600">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No farmers waiting</p>
            </div>
          ) : (
            <div className="space-y-1">
              {waiting.slice(0, 8).map((entry, i) => (
                <div key={entry.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                  entry.is_bumped
                    ? 'bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 dark:text-slate-500 text-xs w-4 font-mono">{i + 1}</span>
                    <span className="token-display font-bold text-slate-800 dark:text-slate-200">{entry.token}</span>
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{entry.farmer_name}</span>
                    {entry.is_bumped && (
                      <button
                        type="button"
                        onClick={() => setAuditModal(entry)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors shrink-0 cursor-pointer"
                        title={`Bumped by ${entry.bumped_by_name || 'Gate Assayer'}: ${entry.bump_reason}. Click to view immutable audit seal.`}
                      >
                        <span>⚡ BUMPED</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">{entry.crop}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{entry.expected_quantity_kg != null ? (Math.round(Number(entry.expected_quantity_kg) * 10) / 10) : ''} kg</span>
                    {entry.is_bumped ? (
                      <button
                        id={`btn-call-${entry.id}`}
                        onClick={() => handleCallSpecific(entry)}
                        disabled={callingId === entry.id || allCountersOccupied}
                        title={allCountersOccupied ? "All counters occupied" : `Call ${entry.token}`}
                        className="text-xs bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                      >
                        {callingId === entry.id ? (
                          <div className="w-3 h-3 border-2 border-blue-700 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Call'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        id={`btn-bump-call-${entry.id}`}
                        onClick={() => setBumpModal(entry)}
                        title="Authorize statutory priority bump & call to counter"
                        className="text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        Bump & Call
                      </button>
                    )}
                    <button
                      id={`btn-cancel-${entry.id}`}
                      onClick={() => setCancelModal(entry)}
                      title="Cancel this booking"
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {waiting.length > 8 && <p className="text-xs text-center text-slate-400 dark:text-slate-500 pt-2 font-medium">+{waiting.length - 8} more farmers waiting</p>}
            </div>
          )}
        </div>

        {/* Completed with pending payment */}
        <PaymentPanel centreId={centreId} onPay={handleMarkPaid} payingId={payingId} />
      </div>

      {completeModal && (
        <CompleteModal
          queueId={completeModal.queueId}
          token={completeModal.token}
          crop={completeModal.crop}
          expectedQty={completeModal.expectedQty}
          farmerName={completeModal.farmerName}
          initialAssay={completeModal.initialAssay}
          onClose={() => setCompleteModal(null)}
          onSuccess={handleCompleteSuccess}
        />
      )}

      {cancelModal && (
        <CancelConfirmModal
          entry={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={handleConfirmCancel}
          loading={cancelling}
        />
      )}

      {bumpModal && (
        <BumpPriorityModal
          entry={bumpModal}
          allCountersOccupied={allCountersOccupied}
          onClose={() => setBumpModal(null)}
          onSuccess={async () => {
            setBumpModal(null)
            await loadQueue()
          }}
        />
      )}

      {auditModal && (
        <BumpAuditViewModal
          entry={auditModal}
          onClose={() => setAuditModal(null)}
        />
      )}
    </div>
  )
}

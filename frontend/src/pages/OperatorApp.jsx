import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import { Wheat, Users, CheckCircle, Clock, X, Wifi, WifiOff, IndianRupee, User, LogOut, Building2, ChevronDown, Scale, Sparkles, AlertCircle, ShieldCheck, Droplets, Sun, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import NotificationCenter from '../components/NotificationCenter'
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
  const colors = { slate: 'text-slate-800', green: 'text-green-700', orange: 'text-orange-600', red: 'text-red-600' }
  return (
    <div className="stat-card text-center">
      <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">{label}</div>
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
          <span className="text-[10px] text-green-200/90 font-medium hidden md:inline truncate mt-0.5">
            Procurement Officer
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-2 shadow-inner">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white text-sm">{user.full_name}</p>
            <p className="text-slate-300 text-xs">Procurement Officer · {user.mobile}</p>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{centreName || 'Assigned Centre'}</span>
            </div>
          </div>
          <div className="p-2">
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium cursor-pointer"
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
    <div className={`rounded-2xl border p-4 transition-all ${hasEntry ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-slate-600">{counter.label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${hasEntry ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
          {hasEntry ? 'BUSY' : 'FREE'}
        </span>
      </div>
      {hasEntry ? (
        <div>
          <div className="token-display text-3xl font-bold text-orange-800 mb-1">{counter.current_token}</div>
          <p className="text-xs text-slate-600 mb-1 truncate font-medium">{counter.current_farmer_name}</p>
          {counter.current_crop && (
            <p className="text-[11px] text-slate-500 mb-2">
              {counter.current_crop} · {counter.current_expected_qty != null ? (Math.round(Number(counter.current_expected_qty) * 10) / 10) : ''} kg expected
            </p>
          )}
          {counter.current_assay && (
            <div className="mb-3 text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 flex items-center justify-between text-slate-700 shadow-xs">
              <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                <ShieldCheck className="w-3 h-3" /> {counter.current_assay.grade}
              </span>
              <span className="text-blue-700 font-semibold">{counter.current_assay.moisture_percentage}% moisture</span>
            </div>
          )}
          <div className="flex gap-2 mt-1">
            {counter.current_entry_status === 'CALLED' && (
              <button
                id={`btn-start-${counter.id}`}
                onClick={() => onStart(counter.current_queue_entry_id)}
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg font-semibold transition-colors"
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
              className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg font-semibold transition-colors"
            >
              Intake & Complete ✓
            </button>
          </div>
        </div>
      ) : (
        <div className="text-slate-400 text-sm text-center py-2">No farmer assigned</div>
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
  const isSpoiled = numMoisture >= 20.0
  const isMarginal = numMoisture > 17.0 && numMoisture < 20.0
  const isGradeB = (numMoisture > 14.0 && numMoisture <= 17.0) || chaff > 1.5 || damaged > 2.0
  const isGradeA = numMoisture <= 14.0 && chaff <= 1.5 && damaged <= 2.0

  let gradeLabel = 'Grade A (FAQ Standard)'
  let gradeBadgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-300'
  let suggestedRate = mspRate
  let discountPercent = 0

  if (isSpoiled) {
    gradeLabel = 'Rejected · Silo Spoilage Hazard (≥20% Moisture)'
    gradeBadgeColor = 'bg-red-50 text-red-900 border-red-300'
    suggestedRate = 0
    discountPercent = 100
  } else if (isMarginal) {
    gradeLabel = 'Grade C / High Moisture (17.1-19.9%) · Sun-Drying Needed'
    gradeBadgeColor = 'bg-amber-50 text-amber-900 border-amber-300'
    suggestedRate = Math.round(mspRate * 0.90 * 100) / 100
    discountPercent = 10
  } else if (isGradeB) {
    gradeLabel = 'Grade B · Permissible Standard'
    gradeBadgeColor = 'bg-blue-50 text-blue-900 border-blue-300'
    suggestedRate = Math.round(mspRate * 0.98 * 100) / 100
    discountPercent = 2
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
      return toast.error('Intake Prohibited: Produce moisture exceeds 20.0% safety threshold. Please reject or grant sun-drying grace.')
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
        toast.error(`Token ${token} produce rejected (${numMoisture.toFixed(1)}% moisture). Farmer notified.`, { duration: 4000 })
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in border border-slate-100">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="token-display text-2xl font-black text-green-800 bg-green-50 px-3 py-1 rounded-xl border border-green-200">
              {token}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{crop || 'Produce'} Intake & Quality Assay</h3>
              <p className="text-xs text-slate-500">{farmerName ? `Farmer: ${farmerName}` : 'Counter Inspection & Weighbridge'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Section 1: Gate Quality & Digital Moisture Assay */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-600" /> 1. Digital Moisture & Quality Assay
              </span>
              <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Agmark / Mandi Norms
              </span>
            </div>

            {/* Moisture Slider & Inputs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="moisture-val" className="text-xs font-medium text-slate-700">
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
                    className="w-16 text-center text-sm font-extrabold text-blue-900 bg-white border border-blue-300 rounded-lg py-0.5"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
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
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>8% Dry</span>
                <span className="text-emerald-600 font-semibold">14% Max FAQ</span>
                <span className="text-amber-600 font-semibold">17% Max Grade B</span>
                <span className="text-red-600 font-semibold">20%+ Spoilage Risk</span>
              </div>
            </div>

            {/* Impurities & Foreign Matter Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">Foreign Chaff / Insoluble (%)</label>
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
                <label className="block text-xs text-slate-600 font-medium mb-1">Damaged / Discolored (%)</label>
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
                {isSpoiled ? <AlertCircle className="w-4 h-4 text-red-600" /> : isMarginal ? <Sun className="w-4 h-4 text-amber-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm">{gradeLabel}</p>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {isSpoiled
                    ? "⚠️ Severe Spoilage Risk: Moisture (≥20.0%) exceeds safety threshold. Direct silo procurement blocked to prevent fungal aflatoxin."
                    : isMarginal
                    ? "Moisture is slightly above FAQ limit (17-20%). Granting 2.5h yard drying grace or Grade C valuation is recommended."
                    : isGradeB
                    ? "Moisture within permissible limit (14-17%). Approved for intake at standard rate."
                    : "Excellent produce quality! Meets Govt Fair Average Quality (FAQ) norms for full statutory MSP."}
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
                  className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-200"
                >
                  <Sun className="w-3.5 h-3.5" />
                  Grant 2.5h Yard Drying
                </button>
                <button
                  type="button"
                  onClick={() => handleQualityAction('REJECT')}
                  disabled={actionLoading}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-200"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject Produce Lot
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Weighbridge & Payment Settlement */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" /> 2. Weighbridge & Payout Disbursal
              </span>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                Govt MSP: ₹{mspRate.toFixed(2)}/kg
              </span>
            </div>

            {/* Automatic Gradewise Pricing Breakdown */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Automatic Gradewise Pricing
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 block">Base Mandi MSP</span>
                  <span className="font-bold text-slate-800">₹{mspRate.toFixed(2)}/kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Grade Adjustment</span>
                  <span className={`font-bold ${isGradeB ? 'text-blue-700' : isMarginal ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {isGradeB
                      ? `-2% (-₹${(mspRate - suggestedRate).toFixed(2)})`
                      : isMarginal
                      ? `-10% (-₹${(mspRate - suggestedRate).toFixed(2)})`
                      : '0% (Full Rate)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mandated Rate</span>
                  <span className="font-extrabold text-emerald-700">₹{suggestedRate.toFixed(2)}/kg</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accepted Weight (kg) *</label>
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
                  <label className="text-xs font-semibold text-slate-700">
                    Rate (₹/kg) {isManualOverride ? '(Manual)' : '(Auto)'} *
                  </label>
                  {isManualOverride ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualOverride(false)
                        setRate(String(suggestedRate))
                      }}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      Reset to Auto
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-bold">
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
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-800 uppercase tracking-wider font-extrabold">Total Direct Benefit Transfer (DBT)</p>
                  <p className="text-2xl font-black text-emerald-700">₹{parseFloat(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right text-[11px] text-emerald-700 font-medium">
                  <p>{acceptedQty} kg @ ₹{parseFloat(rate).toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Direct to Bank A/C</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assayer / Inspection Remarks</label>
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-xs text-red-800 font-bold">
                🚫 Procurement blocked: Moisture ({numMoisture.toFixed(1)}%) is above the 20% safe storage limit. Please reject the lot or send for sun-drying.
              </div>
            ) : (
              <button
                id="btn-confirm-complete"
                onClick={handleSubmit}
                disabled={loading || actionLoading || !acceptedQty || !rate}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg shadow-green-700/20 disabled:opacity-50"
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-scale-in">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Queue Booking?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will remove the farmer from the active queue and cancel their token.
            </p>
          </div>

          {/* Farmer & Token Preview */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Token Number</span>
              <span className="token-display font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 text-sm">
                {entry.token}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Farmer Name</span>
              <span className="font-semibold text-slate-800">{entry.farmer_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Crop & Quantity</span>
              <span className="text-slate-700 font-medium">{entry.crop} · {entry.expected_quantity_kg != null ? (Math.round(Number(entry.expected_quantity_kg) * 10) / 10) : ''} kg</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
            >
              Keep in Queue
            </button>
            <button
              type="button"
              id="btn-confirm-cancel-entry"
              onClick={() => onConfirm(entry.id)}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-200 disabled:opacity-50"
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

  const { connected, reconnecting } = useCentreQueue(centreId, loadQueue)

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
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="gov-header text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-md w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 w-full min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/15 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/25 shadow-inner backdrop-blur-sm shrink-0">
              <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-xl text-white tracking-tight truncate">
                  {queue?.centre_name || 'Procurement Centre'}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Officer Desk
                </span>
              </div>
              <p className="hidden sm:block text-green-200/90 text-xs font-medium truncate mt-1 leading-none">
                Real-time Counter Manager & Gate Assayer Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/15 shrink-0">
              {reconnecting ? (
                <><WifiOff className="w-3.5 h-3.5 text-yellow-300 shrink-0" /><span className="text-yellow-200 hidden sm:inline">Reconnecting</span></>
              ) : (
                <><div className="live-dot shrink-0" /><span className="text-green-200 font-bold text-[11px] sm:text-xs">LIVE</span></>
              )}
            </div>
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
              <h2 className="font-bold text-slate-900">Active Procurement Counters</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                allCountersOccupied
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-green-50 text-green-700 border-green-200'
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900">Next in Queue</h2>
              <p className="text-sm text-slate-500">
                {waiting.length} farmer(s) waiting
                {allCountersOccupied && <span className="text-amber-600 font-medium ml-2">· All counters busy</span>}
              </p>
            </div>
            <button
              id="btn-call-next"
              onClick={handleCallNext}
              disabled={callingNext || waiting.length === 0 || allCountersOccupied}
              title={allCountersOccupied ? "Cannot call: All counters are occupied" : "Call the next waiting farmer"}
              className="btn-saffron flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {callingNext ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📣'}
              {allCountersOccupied ? 'All Counters Busy' : 'Call Next Farmer'}
            </button>
          </div>

          {waiting.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No farmers waiting</p>
            </div>
          ) : (
            <div className="space-y-1">
              {waiting.slice(0, 8).map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs w-4 font-mono">{i + 1}</span>
                    <span className="token-display font-bold text-slate-800">{entry.token}</span>
                    <span className="text-slate-700 text-sm font-medium">{entry.farmer_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">{entry.crop}</span>
                    <span className="text-slate-500 text-xs">{entry.expected_quantity_kg != null ? (Math.round(Number(entry.expected_quantity_kg) * 10) / 10) : ''} kg</span>
                    <button
                      id={`btn-call-${entry.id}`}
                      onClick={() => handleCallSpecific(entry)}
                      disabled={callingId === entry.id || allCountersOccupied}
                      title={allCountersOccupied ? "All counters occupied" : `Call ${entry.token}`}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {callingId === entry.id ? (
                        <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Call'
                      )}
                    </button>
                    <button
                      id={`btn-cancel-${entry.id}`}
                      onClick={() => setCancelModal(entry)}
                      title="Cancel this booking"
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {waiting.length > 8 && <p className="text-xs text-center text-slate-400 pt-2 font-medium">+{waiting.length - 8} more farmers waiting</p>}
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-600" />
          Direct Benefit Transfer (DBT) Payout Settlement
        </h2>
        <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
          {items.length} Pending Disbursal
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Authorise instant government payment credit to farmer bank accounts via PFMS / e-Kuber gateway.
      </p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.payment_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-xl border border-emerald-200 transition-colors gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="token-display font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-emerald-300 text-sm">
                  {item.token}
                </span>
                <span className="text-slate-800 font-semibold text-sm">{item.farmer_name}</span>
                <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                  {item.crop} · {item.accepted_quantity_kg} kg @ ₹{item.rate_per_kg}/kg
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Procurement verified · Direct payout due: <strong className="text-emerald-800 text-sm font-bold">₹{item.amount?.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <button
              id={`btn-pay-${item.payment_id}`}
              onClick={() => onPay(item.payment_id, item.token, item.amount)}
              disabled={payingId === item.payment_id}
              className="btn-primary py-2 px-4 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-emerald-700 hover:bg-emerald-800"
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

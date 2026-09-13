import { useState, useEffect } from 'react'
import { X, Wheat, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useTranslation } from '../../i18n'

const CROPS = ['Paddy', 'Wheat', 'Mustard', 'Jute', 'Potato', 'Onion']

export default function SlotBookingModal({
  centre,
  onClose,
  onSuccess,
  onGoToQueue,
  activeQueueToken,
  initialCrop,
  initialQty
}) {
  const { t, translateCrop, translateCentreName, formatTimeSlot, formatNumber } = useTranslation()
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [crop, setCrop] = useState(initialCrop || 'Paddy')
  const [qty, setQty] = useState(initialQty ? String(initialQty) : '')
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [activeError, setActiveError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (initialCrop) setCrop(initialCrop)
    if (initialQty) setQty(String(initialQty))
  }, [initialCrop, initialQty])

  useEffect(() => {
    api.getSlots(centre.id).then(data => {
      setSlots(data)
      const available = data.find(s => !s.is_full)
      if (available) setSelectedSlot(available)
    }).catch(() => toast.error(t('toasts.could_not_load_slots'))).finally(() => setLoadingSlots(false))
  }, [centre.id, t])

  const handleBook = async () => {
    if (!selectedSlot) return toast.error(t('toasts.select_time_slot'))
    if (!qty || parseFloat(qty) <= 0) return toast.error(t('toasts.enter_expected_qty'))
    setLoading(true)
    setActiveError(null)
    try {
      const entry = await api.bookSlot({
        centre_id: centre.id,
        slot_id: selectedSlot.id,
        crop,
        expected_quantity_kg: parseFloat(qty)
      })
      onSuccess(entry)
    } catch (e) {
      const msg = e.message || t('toasts.booking_failed')
      if (msg.includes('active booking')) {
        setActiveError(msg)
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelActive = async () => {
    if (!activeQueueToken?.queue_entry?.id) return
    setCancelling(true)
    try {
      await api.cancelBooking(activeQueueToken.queue_entry.id)
      toast.success(t('toasts.previous_booking_cancelled'))
      setActiveError(null)
      onGoToQueue?.(true) // refresh queue state
    } catch (e) {
      toast.error(t('toasts.could_not_cancel_booking'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0a101d] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-md border-b border-slate-100 dark:border-white/10 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white font-display">{t('booking.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{translateCentreName(centre.name)}</p>
          </div>
          <button id="close-booking-modal" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Active Booking Notice if triggered */}
          {activeError && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">{t('booking.active_booking_detected')}</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{activeError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { onClose(); onGoToQueue?.(); }}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('booking.view_active_token')}
                </button>
                {activeQueueToken && (
                  <button
                    onClick={handleCancelActive}
                    disabled={cancelling}
                    className="py-2 px-3 bg-white dark:bg-[#0e1626] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {cancelling ? t('booking.cancelling') : t('booking.cancel_and_rebook')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Crop selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('booking.select_crop')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROPS.map(c => (
                <button
                  key={c}
                  id={`crop-${c.toLowerCase()}`}
                  type="button"
                  onClick={() => setCrop(c)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                    crop === c
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-[#0e1626] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/40'
                  }`}
                >{translateCrop(c)}</button>
              ))}
            </div>
          </div>

          {/* Expected quantity */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('booking.expected_quantity_kg')}</label>
            <input
              id="input-quantity"
              type="number"
              min="1"
              max="5000"
              placeholder={t('booking.qty_placeholder')}
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('booking.select_time_slot')}
            </label>
            {loadingSlots ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    id={`slot-${slot.id}`}
                    type="button"
                    onClick={() => !slot.is_full && setSelectedSlot(slot)}
                    disabled={slot.is_full}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      slot.is_full
                        ? 'bg-slate-50 dark:bg-[#0e1626]/50 border-slate-100 dark:border-white/5 opacity-50 cursor-not-allowed'
                        : selectedSlot?.id === slot.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-500/20'
                        : 'bg-white dark:bg-[#0e1626] border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/40 cursor-pointer'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {formatTimeSlot(slot.start_time, slot.end_time)}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      slot.is_full
                        ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                        : slot.available < 5
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {slot.is_full ? t('common.full') : t('common.slots_left', { count: formatNumber(slot.available) })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            id="btn-confirm-booking"
            type="button"
            onClick={handleBook}
            disabled={loading || !selectedSlot || !qty}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold py-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('booking.confirm_and_book')}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { X, Wheat, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useTranslation } from '../../i18n'

const CROPS = ['Paddy', 'Wheat', 'Mustard', 'Jute', 'Potato', 'Onion']

export default function SlotBookingModal({ centre, onClose, onSuccess, onGoToQueue, activeQueueToken }) {
  const { t, translateCrop } = useTranslation()
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [crop, setCrop] = useState('Paddy')
  const [qty, setQty] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [activeError, setActiveError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <h2 className="font-bold text-slate-900">{t('booking.title')}</h2>
            <p className="text-sm text-slate-500">{centre.name}</p>
          </div>
          <button id="close-booking-modal" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Active Booking Notice if triggered */}
          {activeError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">{t('booking.active_booking_detected')}</h4>
                  <p className="text-xs text-amber-700 mt-0.5">{activeError}</p>
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
                    className="py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {cancelling ? t('booking.cancelling') : t('booking.cancel_and_rebook')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Crop selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-green-700" /> {t('booking.select_crop')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROPS.map(c => (
                <button
                  key={c}
                  id={`crop-${c.toLowerCase()}`}
                  type="button"
                  onClick={() => setCrop(c)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                    crop === c ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
                  }`}
                >{translateCrop(c)}</button>
              ))}
            </div>
          </div>

          {/* Expected quantity */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('booking.expected_quantity_kg')}</label>
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
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-700" /> {t('booking.select_time_slot')}
            </label>
            {loadingSlots ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
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
                      slot.is_full ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' :
                      selectedSlot?.id === slot.id ? 'bg-green-50 border-green-500 ring-2 ring-green-100' :
                      'bg-white border-slate-200 hover:border-green-300 cursor-pointer'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">
                        {slot.start_time} – {slot.end_time}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      slot.is_full ? 'bg-red-100 text-red-600' :
                      slot.available < 5 ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {slot.is_full ? t('common.full') : t('common.slots_left', { count: slot.available })}
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
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('booking.confirm_and_book')}
          </button>
        </div>
      </div>
    </div>
  )
}

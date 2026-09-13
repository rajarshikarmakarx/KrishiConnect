import { useState, useEffect } from 'react'
import { X, Wheat, Calendar, Clock, AlertTriangle, Mic, MicOff, Sparkles, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useTranslation } from '../../i18n'

const CROPS = ['Paddy', 'Wheat', 'Mustard', 'Jute', 'Potato', 'Onion']

export default function SlotBookingModal({ centre, onClose, onSuccess, onGoToQueue, activeQueueToken }) {
  const { t, language, translateCrop, translateCentreName, formatTimeSlot, formatNumber } = useTranslation()
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [crop, setCrop] = useState('Paddy')
  const [qty, setQty] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [activeError, setActiveError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Voice AI Booking State
  const [isListening, setIsListening] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [voiceAutoFilled, setVoiceAutoFilled] = useState(false)
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState('')

  useEffect(() => {
    api.getSlots(centre.id).then(data => {
      setSlots(data)
      const available = data.find(s => !s.is_full)
      if (available) setSelectedSlot(available)
    }).catch(() => toast.error(t('toasts.could_not_load_slots'))).finally(() => setLoadingSlots(false))
  }, [centre.id, t])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (window._krishiSpeechRec) {
        try { window._krishiSpeechRec.stop() } catch {}
        window._krishiSpeechRec = null
      }
    }
  }, [])

  const toggleVoiceBooking = () => {
    if (isListening) {
      if (window._krishiSpeechRec) {
        try { window._krishiSpeechRec.stop() } catch {}
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error(
        language === 'bn' ? 'আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই (Chrome/Edge ব্যবহার করুন)।' :
        language === 'hi' ? 'आपके ब्राउज़र में वॉइस सपोर्ट नहीं है (Chrome/Edge इस्तेमाल करें)।' :
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      )
      return
    }

    const recognition = new SpeechRecognition()
    window._krishiSpeechRec = recognition
    recognition.continuous = false
    recognition.interimResults = false

    const localeMap = { bn: 'bn-IN', hi: 'hi-IN', en: 'en-IN' }
    recognition.lang = localeMap[language] || 'en-IN'

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceAutoFilled(false)
    }

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      setLastVoiceTranscript(transcript)
      setIsListening(false)
      setIsProcessingVoice(true)

      try {
        const res = await api.getVoiceIntent(transcript, language || 'en', centre.id)
        if (res.auto_filled) {
          if (res.crop && CROPS.includes(res.crop)) {
            setCrop(res.crop)
          }
          if (res.quantity && res.quantity > 0) {
            setQty(String(res.quantity))
          }
          // Match slot timing if recognized
          if (res.slot && slots.length > 0) {
            const matched = slots.find(s => {
              if (s.is_full) return false
              if (res.slot === 'morning') {
                return s.start_time.startsWith('08') || s.start_time.startsWith('09') || s.start_time.startsWith('10')
              }
              if (res.slot === 'afternoon') {
                return s.start_time.startsWith('12') || s.start_time.startsWith('13') || s.start_time.startsWith('14')
              }
              return false
            })
            if (matched) setSelectedSlot(matched)
          }

          setVoiceAutoFilled(true)
          toast.success(
            language === 'bn' ? `ভয়েস এআই দিয়ে পূরণ সম্পন্ন! (${res.crop || ''} ${res.quantity ? res.quantity + ' কেজি' : ''})` :
            language === 'hi' ? `वॉइस एआई से फॉर्म भर दिया गया! (${res.crop || ''} ${res.quantity ? res.quantity + ' किग्रा' : ''})` :
            `Auto-filled via Voice AI (${res.crop || ''} ${res.quantity ? res.quantity + ' kg' : ''})`,
            { icon: '✨' }
          )
        } else {
          toast(
            language === 'bn' ? `শুনলাম: "${transcript}" (ফসলের নাম ও পরিমাণ স্পষ্ট করে বলুন)` :
            language === 'hi' ? `सुना: "${transcript}" (कृपया फसल और मात्रा दोबारा बोलें)` :
            `Heard: "${transcript}" (Please specify crop name and quantity clearly)`,
            { icon: '🎙️' }
          )
        }
      } catch (err) {
        toast.error(err.message || 'Voice intent processing failed')
      } finally {
        setIsProcessingVoice(false)
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error !== 'no-speech') {
        toast.error(`Mic error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (err) {
      setIsListening(false)
    }
  }

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
        expected_quantity_kg: parseFloat(qty),
        lang: language || 'bn'
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
      <div className="relative bg-white dark:bg-[#0a101d] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white font-display text-lg">{t('booking.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{translateCentreName(centre.name)}</p>
          </div>
          <button id="close-booking-modal" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Active Booking Notice if triggered */}
          {activeError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">{t('booking.active_booking_detected')}</h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{activeError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { onClose(); onGoToQueue?.(); }}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {t('booking.view_active_token')}
                </button>
                {activeQueueToken && (
                  <button
                    onClick={handleCancelActive}
                    disabled={cancelling}
                    className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {cancelling ? t('booking.cancelling') : t('booking.cancel_and_rebook')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Voice AI Smart Assistant Banner */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
            isListening
              ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
              : voiceAutoFilled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 shadow-sm'
              : 'bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-emerald-500/20 dark:border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                type="button"
                onClick={toggleVoiceBooking}
                disabled={isProcessingVoice}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                    : isProcessingVoice
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/25 hover:scale-105 active:scale-95'
                }`}
                title="Click to speak booking"
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60 pointer-events-none" />
                )}
                {isProcessingVoice ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-6 h-6 relative z-10" />
                ) : (
                  <Mic className="w-6 h-6 relative z-10" />
                )}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {language === 'bn' ? 'ভয়েস এআই বুকিং (মুখে বলুন)' : language === 'hi' ? 'वॉइस एआई बुकिंग (बोलकर भरें)' : 'Voice AI Booking'}
                  </span>
                  {voiceAutoFilled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Auto-filled via Voice AI
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                  {isListening
                    ? (language === 'bn' ? '🎙️ শুনছি... বলুন (যেমন: ৫০ কুইন্টাল ধান সকালে)' : language === 'hi' ? '🎙️ सुन रहा हूँ... बोलिए (जैसे: 20 क्विंटल गेहूँ)' : '🎙️ Listening... speak crop, quantity & slot')
                    : isProcessingVoice
                    ? (language === 'bn' ? '⚡ এআই দিয়ে ফর্ম পূরণ করা হচ্ছে...' : language === 'hi' ? '⚡ एআই से फॉर्म भरा जा रहा है...' : '⚡ Processing voice intent via Groq Llama...')
                    : lastVoiceTranscript
                    ? `"${lastVoiceTranscript}"`
                    : (language === 'bn' ? 'মাইকে ট্যাপ করে বাংলায় কথা বলুন' : language === 'hi' ? 'माइक दबाकर बोलें' : 'Tap circular mic to speak your booking')}
                </p>
              </div>
            </div>
          </div>

          {/* Crop selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('booking.select_crop')} <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROPS.map(c => (
                <button
                  key={c}
                  id={`crop-${c.toLowerCase()}`}
                  type="button"
                  onClick={() => setCrop(c)}
                  className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    crop === c ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >{translateCrop(c)}</button>
              ))}
            </div>
          </div>

          {/* Expected quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('booking.expected_quantity_kg')} <span className="text-red-500 font-bold">*</span>
              </label>
              {voiceAutoFilled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> Auto-filled via Voice AI
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="input-quantity"
                type="number"
                min="1"
                max="5000"
                placeholder={t('booking.qty_placeholder')}
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={toggleVoiceBooking}
                disabled={isProcessingVoice}
                className={`absolute right-2 p-2 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
                title="Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Time slots */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('booking.select_time_slot')} <span className="text-red-500 font-bold">*</span>
            </label>
            {loadingSlots ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
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
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                      slot.is_full ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed' :
                      selectedSlot?.id === slot.id ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white' :
                      'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 cursor-pointer'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {formatTimeSlot(slot.start_time, slot.end_time)}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      slot.is_full ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                      slot.available < 5 ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
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
            className="w-full btn-primary py-3.5 rounded-full font-bold shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('booking.confirm_and_book')}
          </button>
        </div>
      </div>
    </div>
  )
}

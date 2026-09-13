import { useState, useEffect } from 'react'
import {
  X, Wheat, Calendar, Clock, AlertTriangle, Mic, MicOff,
  Sparkles, CheckCircle2, Volume2, VolumeX, AlertCircle
} from 'lucide-react'
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
  const { t, language, translateCrop, translateCentreName, formatTimeSlot, formatNumber } = useTranslation()
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [crop, setCrop] = useState(initialCrop || 'Paddy')
  const [qty, setQty] = useState(initialQty ? String(initialQty) : '')
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [activeError, setActiveError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Voice AI Booking State
  const [speechLang, setSpeechLang] = useState(language || 'bn')
  const [isListening, setIsListening] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [voiceAutoFilled, setVoiceAutoFilled] = useState(false)
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState('')
  const [voiceFeedback, setVoiceFeedback] = useState(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Keep speechLang in sync if app language changes
  useEffect(() => {
    if (language) setSpeechLang(language)
  }, [language])

  useEffect(() => {
    if (initialCrop) setCrop(initialCrop)
    if (initialQty) setQty(String(initialQty))
  }, [initialCrop, initialQty])

  useEffect(() => {
    api.getSlots(centre.id).then(data => {
      setSlots(data || [])
      const available = (data || []).find(s => !s.is_full)
      if (available) setSelectedSlot(available)
    }).catch(() => toast.error(t('toasts.could_not_load_slots'))).finally(() => setLoadingSlots(false))
  }, [centre.id, t])

  // Cleanup speech recognition and audio on unmount
  useEffect(() => {
    return () => {
      if (window._krishiSpeechRec) {
        try { window._krishiSpeechRec.abort() } catch {}
        window._krishiSpeechRec = null
      }
      if (window._krishiSlotAudio) {
        try { window._krishiSlotAudio.pause() } catch {}
        window._krishiSlotAudio = null
      }
    }
  }, [])

  const playClarificationSpeech = async (text) => {
    if (!text) return
    if (isPlayingAudio) {
      if (window._krishiSlotAudio) {
        window._krishiSlotAudio.pause()
        window._krishiSlotAudio = null
      }
      setIsPlayingAudio(false)
      return
    }

    try {
      setIsPlayingAudio(true)
      const clean = text.replace(/[*#_`~•\n|<>\-–—]/g, ' ').slice(0, 250).trim()
      const langCode = speechLang || language || 'bn'
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const ttsUrl = `${apiBase}/ai/tts?text=${encodeURIComponent(clean)}&lang=${langCode}`

      if (window._krishiSlotAudio) {
        try { window._krishiSlotAudio.pause() } catch {}
      }
      const audio = new Audio(ttsUrl)
      window._krishiSlotAudio = audio
      audio.onended = () => setIsPlayingAudio(false)
      audio.onerror = () => setIsPlayingAudio(false)
      await audio.play()
    } catch {
      setIsPlayingAudio(false)
    }
  }

  // Core NLP processing handler (used by both SpeechRecognition and quick sample chips)
  const handleProcessTranscript = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) return
    const cleanTranscript = transcriptText.trim()
    setLastVoiceTranscript(cleanTranscript)
    setIsListening(false)
    setIsProcessingVoice(true)

    try {
      const context = {
        nearest_mandi: centre?.name || 'Singur Mandi',
        registered_crop: crop || 'Paddy'
      }

      // Detect language script automatically if Bengali or Hindi characters are present
      let targetLang = speechLang || language || 'bn'
      if (/[\u0980-\u09FF]/.test(cleanTranscript)) targetLang = 'bn'
      else if (/[\u0900-\u097F]/.test(cleanTranscript)) targetLang = 'hi'

      const res = await api.getVoiceIntent(cleanTranscript, targetLang, centre?.id, context)
      if (res && res.booking_intent_detected !== false) {
        setVoiceFeedback(res)

        const extracted = res.extracted_data || {}
        const rawCrop = extracted.crop || res.crop || ''

        // Multilingual & Case-insensitive Crop Mapping
        const cropMap = {
          paddy: 'Paddy', rice: 'Paddy', dhan: 'Paddy', ধান: 'Paddy', धान: 'Paddy',
          wheat: 'Wheat', gom: 'Wheat', গম: 'Wheat', gehun: 'Wheat', गेहूँ: 'Wheat', गेहूं: 'Wheat',
          mustard: 'Mustard', sarisha: 'Mustard', সরিষা: 'Mustard', sarson: 'Mustard', सरसों: 'Mustard',
          jute: 'Jute', pat: 'Jute', পাট: 'Jute', patsan: 'Jute', पटसन: 'Jute',
          potato: 'Potato', alu: 'Potato', আলু: 'Potato', aalu: 'Potato', आलू: 'Potato',
          onion: 'Onion', peyaj: 'Onion', পেঁয়াজ: 'Onion', pyaz: 'Onion', प्याज़: 'Onion', प्याज: 'Onion'
        }
        const lowerRaw = rawCrop.toLowerCase().trim()
        const matchedCrop = CROPS.find(c => c.toLowerCase() === lowerRaw) || cropMap[lowerRaw]
        if (matchedCrop) {
          setCrop(matchedCrop)
        }

        // Convert quintals to kg for the numeric input field (1 quintal = 100 kg)
        let qtyInKg = null
        if (typeof extracted.quantity_quintals === 'number' && extracted.quantity_quintals > 0) {
          qtyInKg = Math.round(extracted.quantity_quintals * 100)
        } else if (typeof res.quantity === 'number' && res.quantity > 0) {
          qtyInKg = Math.round(res.quantity)
        } else if (extracted.quantity_quintals) {
          qtyInKg = Math.round(parseFloat(extracted.quantity_quintals) * 100)
        }
        if (qtyInKg && qtyInKg > 0) {
          setQty(String(qtyInKg))
        }

        // Match exact preferred time (e.g. "10:00", "14:00") or slot window (MORNING / AFTERNOON)
        const prefTime = extracted.preferred_time
        const slotWindow = (extracted.slot_window || res.slot || '').toUpperCase()
        let matched = null

        if (prefTime && slots.length > 0) {
          const prefHour = prefTime.slice(0, 2)
          matched = slots.find(s => !s.is_full && s.start_time.startsWith(prefHour))
        }

        if (!matched && slots.length > 0) {
          if (slotWindow.includes('AFTERNOON') || slotWindow === 'AFTERNOON') {
            matched = slots.find(s => !s.is_full && parseInt(s.start_time.slice(0, 2), 10) >= 12)
          } else if (slotWindow.includes('MORNING') || slotWindow === 'MORNING') {
            matched = slots.find(s => !s.is_full && parseInt(s.start_time.slice(0, 2), 10) < 12)
          }
        }

        // Guaranteed fallback to first available slot if none matched so slot is never empty
        if (!matched && slots.length > 0) {
          matched = slots.find(s => !s.is_full) || slots[0]
        }

        if (matched) {
          setSelectedSlot(matched)
        }

        setVoiceAutoFilled(true)
        toast.success(
          targetLang === 'bn' ? `ভয়েস এআই দিয়ে পূরণ সম্পন্ন! (${matchedCrop || crop} ${qtyInKg ? qtyInKg + ' কেজি' : ''})` :
          targetLang === 'hi' ? `वॉइस एआई से फॉर्म भर दिया गया! (${matchedCrop || crop} ${qtyInKg ? qtyInKg + ' किग्रा' : ''})` :
          `Auto-filled via Voice AI (${matchedCrop || crop} ${qtyInKg ? qtyInKg + ' kg' : ''})`,
          { icon: '✨' }
        )

        // Automatically speak the confirmation aloud
        if (res.farmer_clarification_message) {
          playClarificationSpeech(res.farmer_clarification_message)
        }
      } else {
        toast(
          speechLang === 'bn' ? `শুনলাম: "${cleanTranscript}" (ফসলের নাম ও পরিমাণ স্পষ্ট করে বলুন)` :
          speechLang === 'hi' ? `सुना: "${cleanTranscript}" (कृपया फसल और मात्रा दोबारा बोलें)` :
          `Heard: "${cleanTranscript}" (Please specify crop name and quantity clearly)`,
          { icon: '🎙️' }
        )
      }
    } catch (err) {
      toast.error(err.message || 'Voice intent processing failed')
    } finally {
      setIsProcessingVoice(false)
    }
  }

  const toggleVoiceBooking = () => {
    if (isListening) {
      if (window._krishiSpeechRec) {
        try { window._krishiSpeechRec.abort() } catch {}
        window._krishiSpeechRec = null
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error(
        speechLang === 'bn' ? 'আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই (Chrome/Edge ব্যবহার করুন বা নিচের নমুনা বাটনে চাপুন)।' :
        speechLang === 'hi' ? 'आपके ब्राउज़र में वॉइस सपोर्ट नहीं है (Chrome/Edge इस्तेमाल करें या नीचे दिए गए सैंपल पर टैप करें)।' :
        'Speech recognition is not supported in this browser. Please use Chrome/Edge or tap a sample prompt below.'
      )
      return
    }

    try {
      if (window._krishiSpeechRec) {
        try { window._krishiSpeechRec.abort() } catch {}
      }
      const recognition = new SpeechRecognition()
      window._krishiSpeechRec = recognition
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      const localeMap = {
        bn: 'bn-IN',
        hi: 'hi-IN',
        en: 'en-IN',
        as: 'bn-IN',
        gu: 'gu-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        or: 'or-IN'
      }
      recognition.lang = localeMap[speechLang] || localeMap[language] || 'bn-IN'

      recognition.onstart = () => {
        setIsListening(true)
        setIsProcessingVoice(false)
        setVoiceAutoFilled(false)
        setVoiceFeedback(null)
      }

      recognition.onresult = (event) => {
        if (!event.results || !event.results[0] || !event.results[0][0]) return
        const transcript = event.results[0][0].transcript
        handleProcessTranscript(transcript)
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        if (event.error === 'not-allowed') {
          toast.error(
            speechLang === 'bn' ? 'মাইক্রোফোন অ্যাক্সেস ব্লক করা আছে। ব্রাউজারে পারমিশন অন করুন।' :
            speechLang === 'hi' ? 'माइक्रोफ़ोन अनुमति अस्वीकृत है। ब्राउज़र में अनुमति दें।' :
            'Microphone access denied. Please allow microphone permissions in browser.'
          )
        } else if (event.error === 'network') {
          toast.error('Network issue during speech recognition. Please retry.')
        } else if (event.error === 'no-speech') {
          toast(
            speechLang === 'bn' ? 'কোনো কথা শোনা যায়নি। মাইক চেপে স্পষ্ট করে বলুন।' :
            speechLang === 'hi' ? 'कोई आवाज नहीं सुनी गई। माइक दबाकर बोलें।' :
            'No speech detected. Please tap mic and speak clearly.',
            { icon: '🎙️' }
          )
        } else {
          toast.error(`Mic error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      setIsListening(false)
      toast.error('Could not start microphone: ' + (err.message || 'Error'))
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
      onGoToQueue?.(true)
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
          <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-2.5 ${
            isListening
              ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
              : voiceAutoFilled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 shadow-sm'
              : 'bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-emerald-500/20 dark:border-emerald-500/20'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  id="btn-voice-mic-main"
                  onClick={toggleVoiceBooking}
                  disabled={isProcessingVoice}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                      : isProcessingVoice
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/25 hover:scale-105 active:scale-95'
                  }`}
                  title="Click to speak your slot booking"
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
                      {speechLang === 'bn' ? 'ভয়েস এআই বুকিং' : speechLang === 'hi' ? 'वॉइस एআই बुकिंग' : 'Voice AI Booking'}
                    </span>
                    {voiceAutoFilled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Auto-filled
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                    {isListening
                      ? (speechLang === 'bn' ? '🎙️ শুনছি... বলুন (যেমন: ৫০ বস্তা ধান সকাল ১০টায়)' : speechLang === 'hi' ? '🎙️ सुन रहा हूँ... बोलिए (जैसे: 20 बोरी गेहूँ)' : '🎙️ Listening... speak crop, quantity & slot')
                      : isProcessingVoice
                      ? (speechLang === 'bn' ? '⚡ এআই দিয়ে ফর্ম পূরণ করা হচ্ছে...' : speechLang === 'hi' ? '⚡ এআই से फॉर्म भरा जा रहा है...' : '⚡ Processing voice intent via Krishi AI Engine...')
                      : lastVoiceTranscript
                      ? `"${lastVoiceTranscript}"`
                      : (speechLang === 'bn' ? 'মাইকে ট্যাপ করে বাংলায় কথা বলুন' : speechLang === 'hi' ? 'माइक दबाकर बोलें' : 'Tap mic to speak your booking')}
                  </p>
                </div>
              </div>

              {/* Language Selector Pills */}
              <div className="flex items-center gap-1 shrink-0 bg-white/70 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {[
                  { code: 'bn', label: 'বাংলা' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'en', label: 'EN' },
                ].map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSpeechLang(item.code)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      speechLang === item.code
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Sample Voice Prompts (1-Click instant voice auto-fill) */}
            <div className="pt-2 border-t border-emerald-500/10 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {speechLang === 'bn' ? '💡 নমুনা ট্যাপ করুন:' : speechLang === 'hi' ? '💡 नमूना टैप करें:' : '💡 Tap sample:'}
              </span>
              {[
                speechLang === 'bn' ? '৫০ বস্তা ধান কাল সকাল ১০টায়' : speechLang === 'hi' ? '20 बोरी गेहूँ कल सुबह 10 बजे' : '50 bags Paddy tomorrow at 10 AM',
                speechLang === 'bn' ? '২৫ কুইন্টাল আলু কাল দুপুরে' : speechLang === 'hi' ? '25 क्विंटल आलू कल दोपहर' : '25 quintal Potato tomorrow afternoon',
                speechLang === 'bn' ? 'এক গাড়ি সরিষা কাল' : speechLang === 'hi' ? 'एक गाड़ी सरसों कल' : '1 trolley Mustard tomorrow'
              ].map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleProcessTranscript(sample)}
                  disabled={isProcessingVoice}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer shadow-2xs hover:scale-102"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Vernacular Farmer Clarification Card */}
          {voiceFeedback && voiceFeedback.farmer_clarification_message && (
            <div className={`p-4 rounded-2xl border text-xs transition-all duration-300 shadow-sm ${
              voiceFeedback.has_ambiguity
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {voiceFeedback.has_ambiguity ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                        voiceFeedback.has_ambiguity
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {voiceFeedback.has_ambiguity
                          ? (speechLang === 'bn' ? '⚠️ প্রাথমিক স্লট (যাচাই করুন)' : speechLang === 'hi' ? '⚠️ प्राथमिक स्लॉट (सत्यापित करें)' : '⚠️ Tentative Booking Defaults')
                          : (speechLang === 'bn' ? '✨ স্লট বুকিং স্পষ্ট' : speechLang === 'hi' ? '✨ स्लॉट स्पष्ट' : '✨ Confirmed Booking Intent')}
                      </span>
                      {voiceFeedback.extracted_data?.quantity_quintals && (
                        <span className="text-[10px] font-semibold bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          🌾 {voiceFeedback.extracted_data.quantity_quintals} Q ({voiceFeedback.extracted_data.quantity_quintals * 100} kg)
                        </span>
                      )}
                      {selectedSlot && (
                        <span className="text-[10px] font-semibold bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-md text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ⏰ {formatTimeSlot(selectedSlot.start_time, selectedSlot.end_time)}
                        </span>
                      )}
                      {voiceFeedback.extracted_data?.mandi_name && (
                        <span className="text-[10px] font-semibold bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          📍 {voiceFeedback.extracted_data.mandi_name}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed font-medium">
                      "{voiceFeedback.farmer_clarification_message}"
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-voice-audio-playback"
                  onClick={() => playClarificationSpeech(voiceFeedback.farmer_clarification_message)}
                  className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5 font-bold text-xs ${
                    isPlayingAudio
                      ? 'bg-red-600 text-white animate-pulse'
                      : voiceFeedback.has_ambiguity
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  title={isPlayingAudio ? 'Stop audio' : 'Listen to confirmation aloud'}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>{speechLang === 'bn' ? 'থামান' : speechLang === 'hi' ? 'रोकें' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>{speechLang === 'bn' ? 'শুনুন' : speechLang === 'hi' ? 'सुनें' : 'Listen'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
                id="btn-voice-mic-input"
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

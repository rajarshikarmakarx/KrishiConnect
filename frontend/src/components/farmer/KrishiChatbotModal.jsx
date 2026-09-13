import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, X, Send, Mic, MicOff, Volume2, VolumeX,
  Bot, User, ChevronDown, CheckCircle2, RotateCcw, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api'
import { useTranslation } from '../../i18n'

// Rich visual formatter for markdown tables, headers, dividers, and bullet points
function FormattedMessage({ content }) {
  if (!content) return null

  // Clean raw HTML breaks
  const sanitized = content.replace(/<br\s*\/?>/gi, '\n')
  const lines = sanitized.split('\n')
  const elements = []
  let tableRows = []
  let inTable = false

  const renderFormattedText = (text) => {
    if (!text) return null
    // Support bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  const flushTable = (key) => {
    if (tableRows.length === 0) return null
    // Filter out separator rows like |---|---|
    const validRows = tableRows.filter(r => !r.every(cell => /^[-:\s]+$/.test(cell)))
    if (validRows.length === 0) {
      tableRows = []
      return null
    }

    const header = validRows[0]
    const body = validRows.slice(1)

    const rendered = (
      <div key={`table-${key}`} className="my-2.5 overflow-x-auto rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-1 text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-emerald-500/20 bg-emerald-100/60 dark:bg-emerald-900/40">
              {header.map((col, cIdx) => (
                <th key={cIdx} className="p-2 font-bold text-emerald-900 dark:text-emerald-200">
                  {renderFormattedText(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/10">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-emerald-500/5 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 align-top text-slate-700 dark:text-slate-300">
                    {renderFormattedText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
    return rendered
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    // Markdown Table row: | col 1 | col 2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim())
      tableRows.push(cells)
      inTable = true
      return
    } else if (inTable) {
      const tableEl = flushTable(idx)
      if (tableEl) elements.push(tableEl)
      inTable = false
    }

    // Markdown Divider: --- or ***
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${idx}`} className="my-2 border-t border-slate-200/80 dark:border-white/10" />
      )
      return
    }

    // Markdown Headings: ### or ## or #
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const title = headingMatch[2]
      elements.push(
        <div
          key={`h-${idx}`}
          className={`font-bold font-display text-emerald-800 dark:text-emerald-300 mt-2 mb-1 ${
            level <= 2 ? 'text-sm sm:text-base border-b border-emerald-500/20 pb-0.5' : 'text-xs sm:text-sm'
          }`}
        >
          {renderFormattedText(title)}
        </div>
      )
      return
    }

    // Bullet points: • or - or * or numbered 1.
    const bulletMatch = trimmed.match(/^([•\-\*]|\d+\.)\s+(.+)$/)
    if (bulletMatch) {
      elements.push(
        <div key={`b-${idx}`} className="flex items-start gap-1.5 my-1 ml-1 text-xs sm:text-sm">
          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
          <span className="flex-1 text-slate-700 dark:text-slate-200">
            {renderFormattedText(bulletMatch[2])}
          </span>
        </div>
      )
      return
    }

    // Paragraph or empty spacing
    if (!trimmed) {
      elements.push(<div key={`empty-${idx}`} className="h-1.5" />)
    } else {
      elements.push(
        <p key={`p-${idx}`} className="my-0.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {renderFormattedText(trimmed)}
        </p>
      )
    }
  })

  if (inTable && tableRows.length > 0) {
    const tableEl = flushTable('end')
    if (tableEl) elements.push(tableEl)
  }

  return <div className="space-y-0.5">{elements}</div>
}

export default function KrishiChatbotModal({ user, isOpen, onClose, onOpenBooking }) {
  const { language } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  const messagesEndRef = useRef(null)

  // Multilingual Initial Welcome & Quick Prompts
  useEffect(() => {
    const welcomeByLang = {
      bn: {
        reply: `নমস্কার ${user?.full_name ? 'কৃষক ভাই ' + user.full_name : 'কৃষক ভাই'}! আমি কৃষি সহায়ক (Krishi AI Assistant)।\n\nআমি আপনাকে পশ্চিমবঙ্গ সরকারি মান্ডির সহায়ক মূল্য (MSP), স্লট বুকিং, আর্দ্রতা পরীক্ষা ও সরাসরি DBT ব্যাঙ্ক পেমেন্ট সম্পর্কিত যেকোনো তথ্য দিতে পারি।\n\nনিচের প্রশ্নগুলোতে ট্যাপ করুন অথবা মাইক চেপে মুখে বলুন!`,
        suggestions: [
          '🌾 আজকের ধানের MSP কত?',
          '📋 স্লট বুকিং করতে কি কি কাগজ লাগে?',
          '💧 আর্দ্রতা (Moisture) সর্বোচ্চ কত চলে?',
          '💳 পেমেন্ট কতক্ষণে অ্যাকাউন্টে ঢোকে?'
        ]
      },
      hi: {
        reply: `नमस्ते ${user?.full_name ? 'किसान भाई ' + user.full_name : 'किसान भाई'}! मैं कृषि सहायक (Krishi AI Assistant) हूँ।\n\nमैं आपको सरकारी मंडी के न्यूनतम समर्थन मूल्य (MSP), स्लॉट बुकिंग, गुणवत्ता परीक्षण और DBT बैंक भुगतान संबंधी हर जानकारी तुरंत दे सकता हूँ।\n\nनीचे दिए गए प्रश्नों पर टैप करें या माइक दबाकर बोलें!`,
        suggestions: [
          '🌾 धान का MSP क्या है?',
          '📋 स्लॉट बुकिंग के लिए दस्तावेज़ क्या चाहिए?',
          '💧 नमी (Moisture) अधिकतम कितनी होनी चाहिए?',
          '💳 खाते में DBT पैसे कब आते हैं?'
        ]
      },
      en: {
        reply: `Hello ${user?.full_name ? user.full_name : 'Farmer Friend'}! I am Krishi AI Assistant.\n\nI can answer questions about statutory West Bengal MSP rates, mandi slot booking, grain moisture limits, and direct DBT bank disbursals.\n\nTap any prompt below or speak into the microphone!`,
        suggestions: [
          '🌾 What is today\'s Paddy MSP?',
          '📋 What documents are needed for booking?',
          '💧 What is the maximum moisture allowed?',
          '💳 When will the DBT payment arrive?'
        ]
      }
    }

    const initial = welcomeByLang[language] || welcomeByLang.en
    setMessages([
      {
        role: 'assistant',
        content: initial.reply,
        suggestions: initial.suggestions
      }
    ])
  }, [language, user?.full_name])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (window._krishiChatSpeechRec) {
        try { window._krishiChatSpeechRec.stop() } catch {}
        window._krishiChatSpeechRec = null
      }
    }
  }, [])

  // Send message
  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    setInput('')
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Stop active speech if any
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
    }

    try {
      // Build conversation history (excluding initial suggestions)
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await api.sendAiChat(query, language || 'en', history, user?.full_name, user?.village)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          suggestions: res.quick_suggestions || []
        }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: language === 'bn'
            ? 'দুঃখিত, সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Sorry, temporary connection issue. Please try again.',
          suggestions: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Voice speech-to-text input for chat
  const toggleVoiceInput = () => {
    if (isListening) {
      if (window._krishiChatSpeechRec) {
        try { window._krishiChatSpeechRec.stop() } catch {}
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    window._krishiChatSpeechRec = recognition
    recognition.continuous = false
    recognition.interimResults = false

    const localeMap = { bn: 'bn-IN', hi: 'hi-IN', en: 'en-IN' }
    recognition.lang = localeMap[language] || 'en-IN'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)
      if (transcript.trim()) {
        handleSend(transcript.trim())
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices()
      }
    }
    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Helper to prepare clean natural spoken text from markdown and tables
  const prepareSpeechText = (rawText) => {
    if (!rawText) return ''
    return rawText
      .replace(/<[^>]*>/g, ' ')
      .replace(/\|[\s\-:|]+\|/g, ' ')
      .replace(/\|/g, ', ')
      .replace(/^[-*_]{3,}$/gm, ' ')
      .replace(/^#{1,6}\s+/gm, ' ')
      .replace(/[*_~`]/g, '')
      .replace(/^[•\-\*]\s+/gm, '')
      .replace(/[“”]/g, '"')
      .replace(/[—–]/g, ', ')
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Stop active speech cleanly
  const stopSpeech = () => {
    window._krishiTtsCancelled = true
    if (window._krishiActiveAudio) {
      try {
        window._krishiActiveAudio.pause()
        window._krishiActiveAudio.onended = null
        window._krishiActiveAudio.onerror = null
        window._krishiActiveAudio.src = ''
      } catch {}
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel()
      } catch {}
    }
    setSpeakingIndex(null)
  }

  // Text to Speech read-aloud (supports Bengali, Hindi, and English)
  const speakText = (text, index) => {
    if (speakingIndex === index) {
      stopSpeech()
      return
    }

    stopSpeech()
    window._krishiTtsCancelled = false
    setSpeakingIndex(index)

    // Detect language of the content
    const hasBengali = /[ঀ-৿]/.test(text)
    const hasHindi = /[ऀ-ॿ]/.test(text)
    const targetLang = hasBengali ? 'bn' : hasHindi ? 'hi' : (language === 'bn' ? 'bn' : language === 'hi' ? 'hi' : 'en')

    const cleanText = prepareSpeechText(text)
    if (!cleanText) {
      setSpeakingIndex(null)
      return
    }

    // Split into natural spoken sentence chunks
    const rawSentences = cleanText.split(/([।!?.\n]+)/)
    const chunks = []
    for (let i = 0; i < rawSentences.length; i += 2) {
      const sentence = (rawSentences[i] || '').trim()
      const punc = (rawSentences[i + 1] || '').trim()
      if (sentence) {
        chunks.push(sentence + (punc ? ' ' + punc : ''))
      }
    }

    if (chunks.length === 0) {
      chunks.push(cleanText.slice(0, 160))
    }

    // 1. Check if browser has a native voice installed for this language
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []
    let matchingVoice = null

    if (targetLang === 'bn') {
      matchingVoice = voices.find(v => v.lang && (v.lang.startsWith('bn') || v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla')))
    } else if (targetLang === 'hi') {
      matchingVoice = voices.find(v => v.lang && (v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant')))
    } else {
      matchingVoice = voices.find(v => v.lang && (v.lang.startsWith('en-IN') || v.lang.startsWith('en')))
    }

    // 2. If browser has a dedicated voice, queue chunks one by one
    if (matchingVoice) {
      chunks.forEach((chunk, cIdx) => {
        const u = new SpeechSynthesisUtterance(chunk)
        u.voice = matchingVoice
        u.lang = matchingVoice.lang
        u.rate = 0.95
        if (cIdx === chunks.length - 1) {
          u.onend = () => setSpeakingIndex(null)
        }
        u.onerror = () => setSpeakingIndex(null)
        window.speechSynthesis.speak(u)
      })
      return
    }

    // 3. For Bengali and Hindi without native voices, stream via backend proxy
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    let chunkIdx = 0

    if (!window._krishiActiveAudio) {
      window._krishiActiveAudio = new Audio()
    }
    const audio = window._krishiActiveAudio

    const playChunk = () => {
      if (window._krishiTtsCancelled || chunkIdx >= chunks.length) {
        setSpeakingIndex(null)
        return
      }

      const chunk = chunks[chunkIdx]?.trim()
      if (!chunk || chunk.length < 2) {
        chunkIdx++
        playChunk()
        return
      }

      const safeText = chunk.slice(0, 180)
      audio.src = `${BASE_URL}/ai/tts?text=${encodeURIComponent(safeText)}&lang=${targetLang}`

      audio.onended = () => {
        chunkIdx++
        playChunk()
      }

      audio.onerror = () => {
        chunkIdx++
        playChunk()
      }

      audio.play().catch(() => {
        setSpeakingIndex(null)
      })
    }

    playChunk()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#0a101d] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col h-[600px] max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-emerald-900 px-5 py-4 flex items-center justify-between text-white shrink-0 border-b border-emerald-800/60">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40 ring-2 ring-white/20 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-display">
                  {language === 'bn' ? 'কৃষি সহায়ক এআই' : language === 'hi' ? 'कृषि सहायक एआई' : 'Krishi AI Sahayak'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Groq AI
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                {language === 'bn' ? '২৪x৭ সরকারি মান্ডি সহায়িকা • বিনামূল্যে' : language === 'hi' ? '24x7 सरकारी मंडी सलाहकार • निःशुल्क' : '24/7 Mandi Procurement Advisor • Free'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-emerald-200 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex items-start gap-2.5 max-w-[88%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs whitespace-pre-line'
                    : 'bg-white dark:bg-[#0e1626] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 rounded-tl-xs'
                }`}>
                  {m.role === 'user' ? m.content : <FormattedMessage content={m.content} />}

                  {/* Read Aloud button for assistant replies */}
                  {m.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        KrishiConnect Official AI
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(m.content, idx)}
                        className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer font-medium"
                      >
                        {speakingIndex === idx ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-red-500">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'শুনুন' : language === 'hi' ? 'सुनें' : 'Read aloud'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions Chips if available */}
              {m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && !loading && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 ml-9 max-w-[90%]">
                  {m.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleSend(sug)}
                      className="text-xs font-semibold py-1 px-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer shadow-2xs hover:scale-102"
                    >
                      {sug}
                    </button>
                  ))}
                  {onOpenBooking && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenBooking()
                      }}
                      className="text-xs font-semibold py-1 px-2.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer shadow-2xs hover:scale-102 flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{language === 'bn' ? 'স্লট বুক করুন' : language === 'hi' ? 'स्लॉट बुक करें' : 'Book a Slot'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/80 dark:border-white/10 rounded-tl-xs flex items-center gap-1.5 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="text-[11px] text-slate-400 font-medium ml-1">
                  {language === 'bn' ? 'উত্তর তৈরি হচ্ছে...' : 'Generating reply...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-[#0a101d] border-t border-slate-200/80 dark:border-white/10 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              }`}
              title="Speak question"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? (language === 'bn' ? 'শুনছি... কথা বলুন' : language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... speak now')
                  : (language === 'bn' ? 'বাংলা বা ইংরেজিতে প্রশ্ন করুন...' : language === 'hi' ? 'हिंदी या अंग्रेज़ी में पूछें...' : 'Ask in বাংলা, हिंदी, or English...')
              }
              disabled={loading || isListening}
              className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-700/20 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
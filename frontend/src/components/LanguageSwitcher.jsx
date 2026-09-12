import React, { useState, useRef, useEffect } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useTranslation, LANGUAGES } from '../i18n'

const SHORT_CODES = {
  en: 'EN',
  bn: 'বাং',
  hi: 'हिं',
  mr: 'मरा',
  te: 'తె',
  ta: 'த',
  gu: 'ગુ',
  kn: 'ಕ',
  ml: 'മ',
  pa: 'ਪੰ',
  or: 'ଓ',
  as: 'অ'
}

export default function LanguageSwitcher({
  variant = 'dropdown', // 'dropdown' | 'pills' | 'header'
  className = '',
  dark = false
}) {
  const { language, setLanguage } = useTranslation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  // Pills variant: compact horizontal buttons for instant selection
  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 ${className}`}>
        {LANGUAGES.map((lang) => {
          const isActive = language === lang.code
          return (
            <button
              key={lang.code}
              id={`lang-btn-${lang.code}`}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-white text-green-800 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{lang.native}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Header / Dropdown variant
  const isHeader = variant === 'header' || dark

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        id="btn-language-switcher"
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Change Language"
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-95 ${
          isHeader
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs backdrop-blur-sm'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
        } ${open ? (isHeader ? 'bg-white/25 ring-2 ring-white/30' : 'bg-slate-50 ring-2 ring-emerald-500/20') : ''}`}
      >
        <Globe className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isHeader ? 'text-green-200' : 'text-slate-500'}`} />
        <span className="sm:hidden font-bold">{SHORT_CODES[language] || currentLangObj.code.toUpperCase()}</span>
        <span className="hidden sm:inline font-medium">{currentLangObj.native}</span>
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 ${isHeader ? 'text-white/70' : 'text-slate-400'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] max-h-[70vh] overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-100 z-50 py-1.5 animate-fade-in origin-top-right divide-y divide-slate-50"
        >
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs px-3.5 py-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Language / भाषा / ভাষা
          </div>
          {LANGUAGES.map((lang) => {
            const isActive = language === lang.code
            return (
              <button
                key={lang.code}
                id={`lang-select-${lang.code}`}
                type="button"
                onClick={() => {
                  setLanguage(lang.code)
                  setOpen(false)
                }}
                className={`w-full px-3.5 py-2.5 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <p className="leading-tight font-semibold text-slate-800">{lang.native}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{lang.label}</p>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

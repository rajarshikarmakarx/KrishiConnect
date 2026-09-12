import React, { useState, useRef, useEffect } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useTranslation, LANGUAGES } from '../i18n'

const SHORT_CODES = {
  en: 'EN',
  bn: 'বাং',
  hi: 'हिं'
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
          isHeader
            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs'
            : 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs'
        } ${open ? 'bg-white/25 ring-2 ring-white/30' : ''}`}
      >
        <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
        <span className="sm:hidden font-bold">{SHORT_CODES[language] || currentLangObj.code.toUpperCase()}</span>
        <span className="hidden sm:inline text-white font-medium">{currentLangObj.native}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform text-white/70 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white/95 dark:bg-[#0a101d] text-slate-900 dark:text-white shadow-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-xl z-50 overflow-hidden py-1 animate-fade-in origin-top-right"
        >
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Select Language / ভাষা
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
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                    {lang.badge || lang.code.toUpperCase()}
                  </span>
                  <div>
                    <p className="leading-tight font-semibold">{lang.native}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{lang.label}</p>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

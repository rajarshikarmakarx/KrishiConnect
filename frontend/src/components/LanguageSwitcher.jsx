import React, { useState, useRef, useEffect } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useTranslation, LANGUAGES } from '../i18n'

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
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          isHeader
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
        } ${open ? (isHeader ? 'bg-white/25 ring-2 ring-white/30' : 'bg-slate-50 ring-2 ring-emerald-500/20') : ''}`}
      >
        <Globe className={`w-3.5 h-3.5 ${isHeader ? 'text-green-200' : 'text-slate-500'}`} />
        <span>{currentLangObj.native}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isHeader ? 'text-white/70' : 'text-slate-400'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-100 z-50 overflow-hidden py-1 animate-fade-in origin-top-right"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                    ? 'bg-emerald-50/90 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <p className="leading-tight">{lang.native}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{lang.label}</p>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

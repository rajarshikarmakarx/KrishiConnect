import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import translations from './translations'

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🌾' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
]

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_lang')
      if (saved && (saved === 'en' || saved === 'bn' || saved === 'hi')) {
        return saved
      }
    } catch {}
    return 'en'
  })

  const setLanguage = useCallback((lang) => {
    if (lang === 'en' || lang === 'bn' || lang === 'hi') {
      setLanguageState(lang)
      try {
        localStorage.setItem('krishi_lang', lang)
      } catch {}
    }
  }, [])

  // Translation function with nested key traversal and interpolation
  const t = useCallback((keyPath, params = {}) => {
    if (!keyPath || typeof keyPath !== 'string') return ''

    const keys = keyPath.split('.')

    // 1. Try current language
    let value = translations[language]
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        value = null
        break
      }
    }

    // 2. Fallback to English if not found
    if (value === null || value === undefined) {
      let fallbackValue = translations['en']
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
          fallbackValue = fallbackValue[k]
        } else {
          fallbackValue = null
          break
        }
      }
      value = fallbackValue !== null && fallbackValue !== undefined ? fallbackValue : keyPath
    }

    // 3. String interpolation: replace {param} or {{param}}
    if (typeof value === 'string' && params && typeof params === 'object') {
      let result = value
      for (const [pKey, pVal] of Object.entries(params)) {
        const regex1 = new RegExp(`\\{${pKey}\\}`, 'g')
        const regex2 = new RegExp(`\\{\\{${pKey}\\}\\}`, 'g')
        result = result.replace(regex1, String(pVal)).replace(regex2, String(pVal))
      }
      return result
    }

    return typeof value === 'string' ? value : String(value ?? keyPath)
  }, [language])

  // Crop translation helper
  const translateCrop = useCallback((cropName) => {
    if (!cropName) return ''
    const key = `crops.${cropName}`
    const translated = t(key)
    return translated === key ? cropName : translated
  }, [t])

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    languages: LANGUAGES,
    t,
    translateCrop
  }), [language, setLanguage, t, translateCrop])

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext

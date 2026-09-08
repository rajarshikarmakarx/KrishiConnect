import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import translations from './translations'
import {
  DISTRICTS_MAP,
  PLACES_MAP,
  CENTRE_SUFFIXES,
  toBengaliNumerals,
  toHindiNumerals
} from './locations'

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

  // Number / Numeral Localizer
  const formatNumber = useCallback((val) => {
    if (val === null || val === undefined || val === '') return ''
    if (language === 'bn') {
      return toBengaliNumerals(val)
    }
    if (typeof val === 'number') {
      return val.toLocaleString('en-IN')
    }
    return String(val)
  }, [language])

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
        let formattedVal = pVal
        if (language === 'bn' && typeof pVal === 'number') {
          formattedVal = toBengaliNumerals(pVal)
        }
        const regex1 = new RegExp(`\\{${pKey}\\}`, 'g')
        const regex2 = new RegExp(`\\{\\{${pKey}\\}\\}`, 'g')
        result = result.replace(regex1, String(formattedVal)).replace(regex2, String(formattedVal))
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

  // District translation helper
  const translateDistrict = useCallback((districtName) => {
    if (!districtName || typeof districtName !== 'string') return ''
    const trimmed = districtName.trim()
    if (language === 'en') return trimmed
    const entry = DISTRICTS_MAP[trimmed]
    if (entry && entry[language]) return entry[language]
    return trimmed
  }, [language])

  // Village / town translation helper
  const translateVillage = useCallback((villageName) => {
    if (!villageName || typeof villageName !== 'string') return ''
    const trimmed = villageName.trim()
    if (language === 'en') return trimmed
    const entry = PLACES_MAP[trimmed] || DISTRICTS_MAP[trimmed]
    if (entry && entry[language]) return entry[language]
    return trimmed
  }, [language])

  // Combined location string translator (e.g. "Haripur, Howrah")
  const translateLocation = useCallback((locationStr) => {
    if (!locationStr || typeof locationStr !== 'string') return ''
    if (language === 'en') return locationStr

    // Split by comma
    const parts = locationStr.split(',').map(p => p.trim())
    const translatedParts = parts.map(part => {
      const placeEntry = PLACES_MAP[part] || DISTRICTS_MAP[part]
      if (placeEntry && placeEntry[language]) {
        return placeEntry[language]
      }
      return part
    })

    return translatedParts.join(', ')
  }, [language])

  // Procurement Centre Name translator (e.g. "Haripur Procurement Centre" -> "হরিপুর ক্রয় কেন্দ্র")
  const translateCentreName = useCallback((centreName) => {
    if (!centreName || typeof centreName !== 'string') return ''
    if (language === 'en') return centreName

    let name = centreName.trim()

    // 1. Direct place check if exact match
    if (PLACES_MAP[name] && PLACES_MAP[name][language]) {
      return PLACES_MAP[name][language]
    }

    // 2. Identify suffix and prefix
    let matchedSuffix = null
    let prefix = name

    for (const suffixItem of CENTRE_SUFFIXES) {
      if (name.toLowerCase().endsWith(suffixItem.en.toLowerCase())) {
        matchedSuffix = suffixItem[language]
        prefix = name.slice(0, name.length - suffixItem.en.length).trim()
        break
      }
    }

    // Translate the prefix (location name)
    const placeEntry = PLACES_MAP[prefix] || DISTRICTS_MAP[prefix]
    const translatedPrefix = (placeEntry && placeEntry[language]) ? placeEntry[language] : prefix

    if (matchedSuffix) {
      return `${translatedPrefix} ${matchedSuffix}`
    }

    return translatedPrefix
  }, [language])

  // AI Recommendation Reason Translator
  const translateReason = useCallback((reasonStr) => {
    if (!reasonStr || typeof reasonStr !== 'string') return ''
    if (language === 'en') return reasonStr

    const trimmed = reasonStr.trim()

    // 1. Village centre
    if (/village centre/i.test(trimmed)) {
      return t('centres.reason_village_centre')
    }

    // 2. Closest to you (X km)
    const closestMatch = trimmed.match(/Closest to you\s*\(([\d.]+)\s*km\)/i)
    if (closestMatch) {
      const dist = formatNumber(closestMatch[1])
      return t('centres.reason_closest', { distance: dist })
    }

    // 3. Quickest overall trip (~Xm total)
    const quickestMatch = trimmed.match(/Quickest overall trip\s*\(~?(\d+)m\s*total\)/i)
    if (quickestMatch) {
      const mins = formatNumber(quickestMatch[1])
      return t('centres.reason_quickest', { mins })
    }

    // 4. Nearby centre (X km)
    const nearbyMatch = trimmed.match(/Nearby centre\s*\(([\d.]+)\s*km\)/i)
    if (nearbyMatch) {
      const dist = formatNumber(nearbyMatch[1])
      return t('centres.reason_nearby', { distance: dist })
    }

    // 5. District centre (X km)
    const districtMatch = trimmed.match(/District centre\s*\(([\d.]+)\s*km\)/i)
    if (districtMatch) {
      const dist = formatNumber(districtMatch[1])
      return t('centres.reason_district', { distance: dist })
    }

    // 6. Regional transit (X km)
    const regionalMatch = trimmed.match(/Regional transit\s*\(([\d.]+)\s*km\)/i)
    if (regionalMatch) {
      const dist = formatNumber(regionalMatch[1])
      return t('centres.reason_regional', { distance: dist })
    }

    // 7. Long-distance transit (X km)
    const longDistMatch = trimmed.match(/Long-distance transit\s*\(([\d.]+)\s*km\)/i)
    if (longDistMatch) {
      const dist = formatNumber(longDistMatch[1])
      return t('centres.reason_long_distance', { distance: dist })
    }

    // 8. {n} active counters operating
    const countersMatch = trimmed.match(/(\d+)\s*active counters operating/i)
    if (countersMatch) {
      const count = formatNumber(countersMatch[1])
      return t('centres.reason_counters', { count })
    }

    // 9. Short wait time
    if (/short wait time/i.test(trimmed)) {
      return t('centres.reason_short_wait')
    }

    return trimmed
  }, [language, t, formatNumber])

  // Counter label translator (e.g. "Counter 1" -> "কাউন্টার ১")
  const translateCounter = useCallback((counterLabel) => {
    if (!counterLabel) return t('queue.default_counter')
    const match = String(counterLabel).match(/counter\s*(\d+)/i)
    if (match) {
      const num = formatNumber(match[1])
      return t('queue.counter_label', { num })
    }
    return counterLabel
  }, [t, formatNumber])

  // Operator label translator (e.g. "Operator 1" -> "অপারেটর ১")
  const translateOperator = useCallback((operatorLabel) => {
    if (!operatorLabel) return ''
    const match = String(operatorLabel).match(/operator\s*(\d+)/i)
    if (match) {
      const num = formatNumber(match[1])
      return t('queue.operator_label', { num })
    }
    return operatorLabel
  }, [t, formatNumber])

  // Time slot formatter (e.g. "09:00", "10:00" -> "০৯:০০ – ১০:০০")
  const formatTimeSlot = useCallback((startTime, endTime) => {
    if (!startTime || !endTime) return ''
    if (language === 'bn') {
      return `${toBengaliNumerals(startTime)} – ${toBengaliNumerals(endTime)}`
    }
    if (language === 'hi') {
      return `${startTime} – ${endTime}`
    }
    return `${startTime} – ${endTime}`
  }, [language])

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    languages: LANGUAGES,
    t,
    formatNumber,
    translateCrop,
    translateDistrict,
    translateVillage,
    translateLocation,
    translateCentreName,
    translateReason,
    translateCounter,
    translateOperator,
    formatTimeSlot,
  }), [
    language,
    setLanguage,
    t,
    formatNumber,
    translateCrop,
    translateDistrict,
    translateVillage,
    translateLocation,
    translateCentreName,
    translateReason,
    translateCounter,
    translateOperator,
    formatTimeSlot
  ])

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

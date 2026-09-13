import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../ThemeContext'

export default function ThemeToggle({ dark = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      id="btn-theme-toggle"
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 active:scale-95 border ${
        dark
          ? 'bg-white/10 hover:bg-white/20 text-amber-200 border-white/20 shadow-xs'
          : isDark
          ? 'bg-white/10 hover:bg-white/20 text-amber-300 border-white/15 shadow-xs'
          : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-amber-300 border-emerald-700/40 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-200 -rotate-12 transition-transform duration-500 hover:rotate-0" />
        )}
      </div>
    </button>
  )
}

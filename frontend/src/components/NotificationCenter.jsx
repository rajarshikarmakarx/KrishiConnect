import React, { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, X, AlertTriangle, CheckCircle2, Clock, Sparkles, Activity, FileText } from 'lucide-react'
import { useNotifications } from '../NotificationContext'
import { useTranslation } from '../i18n'

export default function NotificationCenter({ className = '', dark = false, headerVariant = false }) {
  const { t, formatNumber } = useTranslation()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filtered notifications
  const displayedNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return t('common.time_just_now')
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime()
      const diffSec = Math.floor(diffMs / 1000)
      if (diffSec < 60) return t('common.time_just_now')
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return t('common.time_mins_ago', { min: diffMin })
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour < 24) return t('common.time_hours_ago', { hour: diffHour })
      const diffDay = Math.floor(diffHour / 24)
      return t('common.time_days_ago', { day: diffDay })
    } catch {
      return t('common.time_just_now')
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'queue':
        return <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
      case 'assay':
        return <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      case 'payment':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
      default:
        return <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
    }
  }

  const getIconBg = (type) => {
    switch (type) {
      case 'queue':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      case 'assay':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
      case 'payment':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      case 'alert':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
    }
  }

  // Check if the trigger button sits on a dark/green header
  const isDarkHeader = dark || headerVariant

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-notification-bell"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer shrink-0 border ${
          isDarkHeader
            ? 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border-white/20 shadow-xs'
            : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border-white/20 shadow-xs'
        } ${isOpen ? 'bg-white/25 text-white ring-2 ring-white/30' : ''}`}
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-white shadow-md ring-2 ring-emerald-950">
            {unreadCount > 99 ? '99+' : formatNumber(unreadCount)}
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel - Executive Glassmorphic */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 z-50 overflow-hidden transform transition-all animate-fade-in origin-top-right"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">{t('notifications.center_title')}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {t('notifications.new_count', { count: unreadCount })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title={t('notifications.mark_all_read')}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('notifications.mark_all_read')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title={t('notifications.clear_all')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          {notifications.length > 0 && (
            <div className="flex px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-xs border border-slate-200/70 dark:border-slate-700'
                    : 'hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('notifications.tab_all', { count: notifications.length })}
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-xs border border-slate-200/70 dark:border-slate-700'
                    : 'hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('notifications.tab_unread', { count: unreadCount })}
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-11 h-11 mx-auto mb-2.5 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {filter === 'unread' ? t('notifications.empty_unread_title') : t('notifications.empty_all_title')}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                  {filter === 'unread'
                    ? t('notifications.empty_unread_desc')
                    : t('notifications.empty_all_desc')}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`px-3.5 py-3 text-left transition-colors cursor-pointer group flex items-start gap-3 ${
                    n.read
                      ? 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/35 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {/* Category Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                      n.type
                    )}`}
                  >
                    {getIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          n.read
                            ? 'text-slate-700 dark:text-slate-300 font-semibold'
                            : 'text-slate-900 dark:text-slate-100 font-bold'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                        {formatTimeAgo(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  {/* Actions / Dot */}
                  <div className="shrink-0 flex items-center gap-1 self-center">
                    {!n.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                        title={t('notifications.unread_dot')}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(n.id)
                      }}
                      title={t('notifications.remove_notification')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer status */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] flex items-center justify-between font-mono text-slate-500 dark:text-slate-400">
            <span>{t('notifications.ingest_active')}</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('notifications.connected')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

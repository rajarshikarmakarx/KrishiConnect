import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const seenEventKeysRef = useRef(new Set())
  const lastUserIdRef = useRef(null)

  // Reset notifications on logout or user switch
  useEffect(() => {
    const currentUserId = user?.id || null
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId
      seenEventKeysRef.current.clear()
      if (user) {
        // Initial welcome/status notification for the active session
        const welcomeNotice = getInitialWelcomeNotice(user)
        if (welcomeNotice) {
          setNotifications([welcomeNotice])
          if (welcomeNotice.eventKey) seenEventKeysRef.current.add(welcomeNotice.eventKey)
        } else {
          setNotifications([])
        }
      } else {
        setNotifications([])
      }
    }
  }, [user])

  const addNotification = useCallback((notif) => {
    const {
      title,
      message,
      type = 'info', // 'queue' | 'assay' | 'payment' | 'alert' | 'info' | 'success'
      role = 'all',
      eventKey = null,
      link = null,
      meta = null
    } = notif

    // Deduplication check
    if (eventKey) {
      if (seenEventKeysRef.current.has(eventKey)) {
        return null // Ignore duplicate event
      }
      seenEventKeysRef.current.add(eventKey)
    }

    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title,
      message,
      type,
      role,
      eventKey,
      link,
      meta,
      timestamp: new Date().toISOString(),
      read: false
    }

    setNotifications((prev) => [newNotification, ...prev])
    return newNotification
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    )
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

function getInitialWelcomeNotice(user) {
  if (!user) return null
  const roleName =
    user.role === 'admin'
      ? 'District Agricultural Officer'
      : user.role === 'operator'
      ? 'Mandi Counter Operator'
      : 'Farmer Partner'

  return {
    id: `welcome-${user.id}-${Date.now()}`,
    title: `Welcome, ${user.full_name}`,
    message: `Connected as ${roleName}. Real-time mandi queue, quality assaying, and DBT updates are active.`,
    type: 'info',
    role: user.role,
    eventKey: `session-welcome-${user.id}`,
    timestamp: new Date().toISOString(),
    read: false
  }
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext

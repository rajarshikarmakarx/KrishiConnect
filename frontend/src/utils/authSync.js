/**
 * Cross-tab Authentication Synchronization Bus for KrishiConnect
 * Enables seamless auth session sharing across multiple browser tabs
 * while preserving the 24-hour remember-me configuration.
 */

const CHANNEL_NAME = 'krishi_auth_bus'
const STORAGE_SYNC_KEY = 'krishi_auth_sync_event'

export function createAuthBus() {
  const tabId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9) + '_' + Date.now()

  let bc = null
  const listeners = new Set()

  const notify = (data) => {
    if (!data || typeof data !== 'object') return
    if (data.fromTabId === tabId) return
    listeners.forEach((fn) => {
      try {
        fn(data)
      } catch (err) {
        console.error('AuthBus listener error:', err)
      }
    })
  }

  // Primary transport: BroadcastChannel (supported across all modern browsers)
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel(CHANNEL_NAME)
      bc.onmessage = (event) => {
        notify(event.data)
      }
    }
  } catch {
    bc = null
  }

  // Fallback transport: localStorage storage event
  const handleStorage = (e) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue)
        notify(payload)
      } catch {}
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  const subscribe = (fn) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  const postMessage = (msg) => {
    const envelope = { ...msg, fromTabId: tabId, timestamp: Date.now() }

    // 1. Send via BroadcastChannel
    if (bc) {
      try {
        bc.postMessage(envelope)
      } catch {}
    }

    // 2. Storage event fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(envelope))
        setTimeout(() => {
          try {
            if (localStorage.getItem(STORAGE_SYNC_KEY) === JSON.stringify(envelope)) {
              localStorage.removeItem(STORAGE_SYNC_KEY)
            }
          } catch {}
        }, 150)
      }
    } catch {}
  }

  const close = () => {
    listeners.clear()
    if (bc) {
      try {
        bc.close()
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }

  /**
   * Asynchronously requests active session credentials from any open sibling tab.
   * Resolves with { token, user, rememberMe } or null if timeout expires.
   */
  const requestSession = (timeoutMs = 90) => {
    return new Promise((resolve) => {
      let resolved = false

      let timer = null

      const unsubscribe = subscribe((data) => {
        if (data.type === 'SESSION_RESPONSE' && (!data.toTabId || data.toTabId === tabId)) {
          if (!resolved && data.token && data.user) {
            resolved = true
            if (timer) clearTimeout(timer)
            unsubscribe()
            resolve(data)
          }
        }
      })

      timer = setTimeout(() => {
        if (!resolved) {
          resolved = true
          unsubscribe()
          resolve(null)
        }
      }, timeoutMs)

      postMessage({ type: 'REQUEST_SESSION' })
    })
  }

  return {
    tabId,
    postMessage,
    subscribe,
    requestSession,
    close,
  }
}

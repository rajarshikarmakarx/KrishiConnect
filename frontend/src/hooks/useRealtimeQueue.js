import { useEffect, useRef, useState, useCallback } from 'react'

export function getWsBaseUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const hostname = window.location.hostname || 'localhost'
  return `${protocol}//${hostname}:8000`
}

/**
 * WebSocket hook for real-time centre queue updates
 * Connects to the centre queue channel and broadcasts updates
 */
export function useCentreQueue(centreId, onUpdate) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const reconnectTimer = useRef(null)
  const pingTimer = useRef(null)
  const mountedRef = useRef(true)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const connect = useCallback(() => {
    if (!centreId || !mountedRef.current) return

    try {
      const base = getWsBaseUrl()
      const ws = new WebSocket(`${base}/ws/centre/${centreId}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        setReconnecting(false)
        ws.send('ping')

        // Send heartbeat ping every 20 seconds
        clearInterval(pingTimer.current)
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 20000)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (onUpdateRef.current) {
            onUpdateRef.current(data)
          }
        } catch {}
      }

      ws.onclose = () => {
        clearInterval(pingTimer.current)
        if (!mountedRef.current) return
        setConnected(false)
        setReconnecting(true)
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, 2500)
      }

      ws.onerror = () => {
        ws.close()
      }

    } catch (err) {
      setReconnecting(true)
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }
  }, [centreId])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      clearInterval(pingTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { connected, reconnecting }
}

/**
 * WebSocket hook for farmer-specific notifications
 */
export function useFarmerNotifications(farmerId, token, onNotification) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const mountedRef = useRef(true)
  const onNotificationRef = useRef(onNotification)
  const pingTimer = useRef(null)
  const reconnectTimer = useRef(null)

  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  const connect = useCallback(() => {
    const activeToken = token || localStorage.getItem('krishi_token')
    if (!farmerId || !activeToken || !mountedRef.current) return

    try {
      const base = getWsBaseUrl()
      const ws = new WebSocket(`${base}/ws/farmer/${farmerId}?token=${encodeURIComponent(activeToken)}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        ws.send('ping')

        clearInterval(pingTimer.current)
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 20000)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (onNotificationRef.current) {
            onNotificationRef.current(data)
          }
        } catch {}
      }

      ws.onclose = (event) => {
        clearInterval(pingTimer.current)
        if (!mountedRef.current) return
        setConnected(false)

        // Close code 4001, 4003 or 1008 indicates authentication failure (e.g. invalid or expired token)
        if (event.code === 4001 || event.code === 4003 || event.code === 1008) {
          window.dispatchEvent(new CustomEvent('krishi:auth-expired', {
            detail: { reason: 'ws_auth_rejected', code: event.code }
          }))
          return // Stop reconnect attempts on invalid credentials
        }

        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, 2500)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }
  }, [farmerId, token])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      clearInterval(pingTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { connected }
}

/**
 * WebSocket hook for full-district admin real-time updates
 */
export function useAdminQueue(onUpdate) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const reconnectTimer = useRef(null)
  const pingTimer = useRef(null)
  const mountedRef = useRef(true)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const base = getWsBaseUrl()
      const ws = new WebSocket(`${base}/ws/admin`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        setReconnecting(false)
        ws.send('ping')

        clearInterval(pingTimer.current)
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 20000)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (onUpdateRef.current) {
            onUpdateRef.current(data)
          }
        } catch {}
      }

      ws.onclose = () => {
        clearInterval(pingTimer.current)
        if (!mountedRef.current) return
        setConnected(false)
        setReconnecting(true)
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, 2500)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch (err) {
      setReconnecting(true)
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      clearInterval(pingTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { connected, reconnecting }
}


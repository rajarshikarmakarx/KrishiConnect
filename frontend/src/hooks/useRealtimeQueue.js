import { useEffect, useRef, useState, useCallback } from 'react'

const BASE_WS = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

/**
 * WebSocket hook for real-time queue updates
 * Connects to the centre queue channel and broadcasts updates
 */
export function useCentreQueue(centreId, onUpdate) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const reconnectTimer = useRef(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!centreId || !mountedRef.current) return

    try {
      const ws = new WebSocket(`${BASE_WS}/ws/centre/${centreId}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        setReconnecting(false)
        // Send initial ping
        ws.send('ping')
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'QUEUE_CHANGED' && onUpdate) {
            onUpdate(data)
          }
        } catch {}
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        setReconnecting(true)
        // Reconnect after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }

    } catch (err) {
      setReconnecting(true)
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 5000)
    }
  }, [centreId, onUpdate])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
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

  useEffect(() => {
    if (!farmerId || !token) return
    mountedRef.current = true

    const ws = new WebSocket(`${BASE_WS}/ws/farmer/${farmerId}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true)
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data)
        if (onNotification) onNotification(data)
      } catch {}
    }

    ws.onclose = () => {
      if (mountedRef.current) setConnected(false)
    }

    return () => {
      mountedRef.current = false
      ws.close()
    }
  }, [farmerId, token])

  return { connected }
}

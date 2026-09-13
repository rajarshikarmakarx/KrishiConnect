import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api, { clearSession } from './api'
import { createAuthBus } from './utils/authSync'

const AuthContext = createContext(null)

const REMEMBER_HOURS = 24
const REMEMBER_KEY   = 'krishi_remember_until'  // epoch-ms expiry, only set when rememberMe=true

// ---------------------------------------------------------------------------
// Storage helpers — token + user live in the same store (local vs session)
// ---------------------------------------------------------------------------

export function saveSession(token, userObj, rememberMe) {
  const store = rememberMe ? localStorage : sessionStorage
  store.setItem('krishi_token', token)
  store.setItem('krishi_user', JSON.stringify(userObj))

  if (rememberMe) {
    const expiresAt = Date.now() + REMEMBER_HOURS * 60 * 60 * 1000
    localStorage.setItem(REMEMBER_KEY, expiresAt.toString())
    // Clean any tab-isolated sessionStorage duplicate
    sessionStorage.removeItem('krishi_token')
    sessionStorage.removeItem('krishi_user')
  } else {
    // Clean up any leftover remember-me stamp from a previous session
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem('krishi_token')
    localStorage.removeItem('krishi_user')
  }
}

export function readSession() {
  // Check localStorage first (remember-me path)
  const lsToken = localStorage.getItem('krishi_token')
  const lsUser  = localStorage.getItem('krishi_user')
  if (lsToken && lsUser) {
    return { token: lsToken, userStr: lsUser, store: 'local' }
  }
  // Fall back to sessionStorage (no-remember tab session path)
  const ssToken = sessionStorage.getItem('krishi_token')
  const ssUser  = sessionStorage.getItem('krishi_user')
  if (ssToken && ssUser) {
    return { token: ssToken, userStr: ssUser, store: 'session' }
  }
  return null
}

export function wipeSession() {
  localStorage.removeItem('krishi_token')
  localStorage.removeItem('krishi_user')
  localStorage.removeItem(REMEMBER_KEY)
  sessionStorage.removeItem('krishi_token')
  sessionStorage.removeItem('krishi_user')
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.exp) return false
    // +5s buffer for clock skew
    return payload.exp <= Math.floor(Date.now() / 1000) + 5
  } catch {
    return true
  }
}

/** Returns true if a remember-me session has passed its 24-hour wall-clock expiry */
export function isRememberMeExpired() {
  const raw = localStorage.getItem(REMEMBER_KEY)
  if (!raw) return false
  return Date.now() > parseInt(raw, 10)
}

function buildUserObj(data, mobile) {
  return {
    id:                  data.user_id ?? data.id,
    role:                data.role,
    full_name:           data.full_name,
    mobile:              mobile ?? data.mobile,
    assigned_centre_id:  data.assigned_centre_id ?? null,
    village:             data.village            ?? null,
    district:            data.district           ?? null,
    farmer_id:           data.farmer_id          ?? null,
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  const tokenRef = useRef(token)
  const userRef  = useRef(user)
  const busRef   = useRef(null)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let isMounted = true

    // Initialize cross-tab synchronization bus
    const bus = createAuthBus()
    busRef.current = bus

    const unsubscribeBus = bus.subscribe((msg) => {
      if (!isMounted) return

      switch (msg.type) {
        case 'REQUEST_SESSION': {
          // Another tab just opened and asked for active session
          const activeSession = readSession()
          const currentToken = tokenRef.current || activeSession?.token
          let currentUser = userRef.current
          if (!currentUser && activeSession?.userStr) {
            try { currentUser = JSON.parse(activeSession.userStr) } catch {}
          }

          if (currentToken && currentUser && !isJwtExpired(currentToken)) {
            const isRemembered = Boolean(localStorage.getItem(REMEMBER_KEY))
            bus.postMessage({
              type: 'SESSION_RESPONSE',
              toTabId: msg.fromTabId,
              token: currentToken,
              user: currentUser,
              rememberMe: isRemembered,
            })
          }
          break
        }

        case 'LOGIN': {
          if (msg.token && msg.user && !isJwtExpired(msg.token)) {
            saveSession(msg.token, msg.user, msg.rememberMe)
            setToken(msg.token)
            setUser(msg.user)
            setLoading(false)
          }
          break
        }

        case 'LOGOUT': {
          wipeSession()
          setToken(null)
          setUser(null)
          setLoading(false)
          break
        }

        case 'USER_UPDATED': {
          if (msg.user) {
            const activeSession = readSession()
            const store = activeSession?.store === 'local' ? localStorage : sessionStorage
            store.setItem('krishi_user', JSON.stringify(msg.user))
            setUser(msg.user)
          }
          break
        }

        default:
          break
      }
    })

    const verifyAndLoad = async (sessionToken, sessionUser, storeType) => {
      if (isMounted) {
        setUser(sessionUser)
        setToken(sessionToken)
      }

      // Verify with backend
      try {
        const freshUser = await api.getMe()
        if (isMounted) {
          const userObj = buildUserObj(freshUser, freshUser.mobile ?? sessionUser?.mobile)
          const writeStore = storeType === 'local' ? localStorage : sessionStorage
          writeStore.setItem('krishi_user', JSON.stringify(userObj))
          setUser(userObj)
        }
      } catch (err) {
        if (err.message && (
          err.message.includes('401') ||
          err.message.includes('token') ||
          err.message.includes('User not found') ||
          err.message.includes('Not authenticated')
        )) {
          if (isMounted) {
            setToken(null)
            setUser(null)
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    const initAuth = async () => {
      // 1. Check if session already exists in localStorage (24-hour remember-me) or sessionStorage (active tab)
      const session = readSession()

      if (session) {
        const { token: savedToken, userStr: savedUserStr, store } = session

        if (isJwtExpired(savedToken)) {
          wipeSession()
          clearSession('Token expired')
          if (isMounted) { setToken(null); setUser(null); setLoading(false) }
          return
        }

        if (store === 'local' && isRememberMeExpired()) {
          wipeSession()
          clearSession('Remember-me period expired')
          if (isMounted) { setToken(null); setUser(null); setLoading(false) }
          return
        }

        let parsedUser = null
        try {
          parsedUser = JSON.parse(savedUserStr)
        } catch {
          wipeSession()
          clearSession('Corrupted user session')
          if (isMounted) { setToken(null); setUser(null); setLoading(false) }
          return
        }

        await verifyAndLoad(savedToken, parsedUser, store)
        return
      }

      // 2. Tab is newly opened and has no local session.
      // Ask other open tabs in the same browser session if any has an active login session!
      try {
        const siblingSession = await bus.requestSession(90)
        if (siblingSession && siblingSession.token && siblingSession.user && !isJwtExpired(siblingSession.token)) {
          saveSession(siblingSession.token, siblingSession.user, siblingSession.rememberMe)
          await verifyAndLoad(
            siblingSession.token,
            siblingSession.user,
            siblingSession.rememberMe ? 'local' : 'session'
          )
          return
        }
      } catch {}

      // 3. No session found in this tab or any sibling tab
      if (isMounted) {
        setToken(null)
        setUser(null)
        setLoading(false)
      }
    }

    initAuth()

    const handleAuthExpired = () => {
      if (isMounted) {
        wipeSession()
        setToken(null)
        setUser(null)
        bus.postMessage({ type: 'LOGOUT' })
      }
    }

    window.addEventListener('krishi:auth-expired', handleAuthExpired)

    return () => {
      isMounted = false
      unsubscribeBus()
      window.removeEventListener('krishi:auth-expired', handleAuthExpired)
      bus.close()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Auth actions — all accept an optional rememberMe flag (default false)
  // ---------------------------------------------------------------------------

  const login = async (mobile, password, rememberMe = false) => {
    const data    = await api.login({ mobile, password })
    const userObj = buildUserObj(data, mobile)
    saveSession(data.access_token, userObj, rememberMe)
    setToken(data.access_token)
    setUser(userObj)
    busRef.current?.postMessage({
      type: 'LOGIN',
      token: data.access_token,
      user: userObj,
      rememberMe,
    })
    return userObj
  }

  const loginWithOtp = async (mobile, otp, rememberMe = false) => {
    const data    = await api.verifyOtp(mobile, otp)
    const userObj = buildUserObj(data, mobile)
    saveSession(data.access_token, userObj, rememberMe)
    setToken(data.access_token)
    setUser(userObj)
    busRef.current?.postMessage({
      type: 'LOGIN',
      token: data.access_token,
      user: userObj,
      rememberMe,
    })
    return userObj
  }

  const register = async (formData, rememberMe = false) => {
    const data    = await api.register(formData)
    const userObj = buildUserObj(data, formData.mobile)
    saveSession(data.access_token, userObj, rememberMe)
    setToken(data.access_token)
    setUser(userObj)
    busRef.current?.postMessage({
      type: 'LOGIN',
      token: data.access_token,
      user: userObj,
      rememberMe,
    })
    return userObj
  }

  const updateUser = (updatedUser) => {
    const session = readSession()
    const writeStore = session?.store === 'local' ? localStorage : sessionStorage
    writeStore.setItem('krishi_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    busRef.current?.postMessage({
      type: 'USER_UPDATED',
      user: updatedUser,
    })
  }

  const logout = () => {
    wipeSession()
    setToken(null)
    setUser(null)
    busRef.current?.postMessage({ type: 'LOGOUT' })
  }

  /** True when the current session is a remember-me session */
  const isRemembered = Boolean(localStorage.getItem(REMEMBER_KEY))

  return (
    <AuthContext.Provider value={{
      user,
      token,
      setUser,
      updateUser,
      loading,
      login,
      loginWithOtp,
      register,
      logout,
      isRemembered,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

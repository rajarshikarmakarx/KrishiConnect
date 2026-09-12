import { createContext, useContext, useState, useEffect } from 'react'
import api, { clearSession } from './api'

const AuthContext = createContext(null)

const REMEMBER_DAYS = 7
const REMEMBER_KEY  = 'krishi_remember_until'  // epoch-ms expiry, only set when rememberMe=true

// ---------------------------------------------------------------------------
// Storage helpers — token + user live in the same store (local vs session)
// ---------------------------------------------------------------------------

function saveSession(token, userObj, rememberMe) {
  const store = rememberMe ? localStorage : sessionStorage
  store.setItem('krishi_token', token)
  store.setItem('krishi_user', JSON.stringify(userObj))

  if (rememberMe) {
    const expiresAt = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(REMEMBER_KEY, expiresAt.toString())
  } else {
    // Clean up any leftover remember-me stamp from a previous session
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem('krishi_token')
    localStorage.removeItem('krishi_user')
  }
}

function readSession() {
  // Check localStorage first (remember-me path)
  const lsToken = localStorage.getItem('krishi_token')
  const lsUser  = localStorage.getItem('krishi_user')
  if (lsToken && lsUser) {
    return { token: lsToken, userStr: lsUser, store: 'local' }
  }
  // Fall back to sessionStorage (no-remember path)
  const ssToken = sessionStorage.getItem('krishi_token')
  const ssUser  = sessionStorage.getItem('krishi_user')
  if (ssToken && ssUser) {
    return { token: ssToken, userStr: ssUser, store: 'session' }
  }
  return null
}

function wipeSession() {
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

/** Returns true if a remember-me session has passed its 7-day wall-clock expiry */
function isRememberMeExpired() {
  const raw = localStorage.getItem(REMEMBER_KEY)
  if (!raw) return false
  return Date.now() > parseInt(raw, 10)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      const session = readSession()

      // Case 1: Nothing stored — not logged in
      if (!session) {
        if (isMounted) { setToken(null); setUser(null); setLoading(false) }
        return
      }

      const { token: savedToken, userStr: savedUserStr, store } = session

      // Case 2: JWT is expired
      if (isJwtExpired(savedToken)) {
        wipeSession()
        clearSession('Token expired')
        if (isMounted) { setToken(null); setUser(null); setLoading(false) }
        return
      }

      // Case 3: Remember-me session has passed its 7-day wall-clock limit
      if (store === 'local' && isRememberMeExpired()) {
        wipeSession()
        clearSession('Remember-me period expired')
        if (isMounted) { setToken(null); setUser(null); setLoading(false) }
        return
      }

      // Case 4: Parse stored user optimistically (instant render)
      let parsedUser = null
      try {
        parsedUser = JSON.parse(savedUserStr)
        if (isMounted) { setUser(parsedUser); setToken(savedToken) }
      } catch {
        wipeSession()
        clearSession('Corrupted user session')
        if (isMounted) { setToken(null); setUser(null); setLoading(false) }
        return
      }

      // Case 5: Verify against backend (handles server restarts / DB wipes)
      try {
        const freshUser = await api.getMe()
        if (isMounted) {
          const userObj = buildUserObj(freshUser, freshUser.mobile ?? parsedUser.mobile)
          // Write back refreshed user to whichever store is active
          const writeStore = store === 'local' ? localStorage : sessionStorage
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
          if (isMounted) { setToken(null); setUser(null) }
        }
        // Network error → keep optimistic user, don't wipe
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    verifySession()

    const handleAuthExpired = () => {
      if (isMounted) { setToken(null); setUser(null) }
    }
    window.addEventListener('krishi:auth-expired', handleAuthExpired)
    return () => {
      isMounted = false
      window.removeEventListener('krishi:auth-expired', handleAuthExpired)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function buildUserObj(data, mobile) {
    return {
      id:                  data.user_id ?? data.id,
      role:                data.role,
      full_name:           data.full_name,
      mobile,
      assigned_centre_id:  data.assigned_centre_id ?? null,
      village:             data.village            ?? null,
      district:            data.district           ?? null,
      farmer_id:           data.farmer_id          ?? null,
    }
  }

  // ---------------------------------------------------------------------------
  // Auth actions — all accept an optional rememberMe flag (default false)
  // ---------------------------------------------------------------------------

  const login = async (mobile, password, rememberMe = false) => {
    const data    = await api.login({ mobile, password })
    const userObj = buildUserObj(data, mobile)
    saveSession(data.access_token, userObj, rememberMe)
    setToken(data.access_token)
    setUser(userObj)
    return userObj
  }

  const loginWithOtp = async (mobile, otp, rememberMe = false) => {
    const data    = await api.verifyOtp(mobile, otp)
    const userObj = buildUserObj(data, mobile)
    saveSession(data.access_token, userObj, rememberMe)
    setToken(data.access_token)
    setUser(userObj)
    return userObj
  }

  const register = async (formData, rememberMe = false) => {
    const data    = await api.register(formData)
    const userObj = buildUserObj(data, formData.mobile)
    saveSession(data.access_token, userObj, rememberMe)
    setToken(data.access_token)
    setUser(userObj)
    return userObj
  }

  const logout = () => {
    wipeSession()
    setToken(null)
    setUser(null)
  }

  /** True when the current session is a remember-me session */
  const isRemembered = Boolean(localStorage.getItem(REMEMBER_KEY))

  return (
    <AuthContext.Provider value={{ user, token, setUser, loading, login, loginWithOtp, register, logout, isRemembered }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import { createContext, useContext, useState, useEffect } from 'react'
import api, { clearSession } from './api'

const AuthContext = createContext(null)

/**
 * Checks if a JWT token is expired client-side
 * Returns true if token is missing, malformed, or past its expiration timestamp.
 */
export function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.exp) return false
    // Token exp is in epoch seconds; add 5s buffer for clock skew
    return payload.exp <= Math.floor(Date.now() / 1000) + 5
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('krishi_token') || null)
  const [loading, setLoading] = useState(true)

  // Verify stored session on startup
  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      const savedToken = localStorage.getItem('krishi_token')
      const savedUserStr = localStorage.getItem('krishi_user')

      // Case 1: Incomplete or missing session
      if (!savedToken || !savedUserStr) {
        localStorage.removeItem('krishi_token')
        localStorage.removeItem('krishi_user')
        if (isMounted) {
          setToken(null)
          setUser(null)
          setLoading(false)
        }
        return
      }

      // Case 2: Expired JWT according to client clock
      if (isJwtExpired(savedToken)) {
        clearSession('Token expired')
        if (isMounted) {
          setToken(null)
          setUser(null)
          setLoading(false)
        }
        return
      }

      // Case 3: Parse optimistic user for instantaneous initial render
      let parsedUser = null
      try {
        parsedUser = JSON.parse(savedUserStr)
        if (isMounted) {
          setUser(parsedUser)
          setToken(savedToken)
        }
      } catch {
        clearSession('Corrupted user session')
        if (isMounted) {
          setToken(null)
          setUser(null)
          setLoading(false)
        }
        return
      }

      // Case 4: Verify against backend to handle server key restarts or database wipes
      try {
        const freshUser = await api.getMe()
        if (isMounted) {
          const userObj = {
            id: freshUser.id,
            role: freshUser.role,
            full_name: freshUser.full_name,
            mobile: freshUser.mobile,
            assigned_centre_id: freshUser.assigned_centre_id ?? null,
            village: freshUser.village ?? null,
            district: freshUser.district ?? null,
            farmer_id: freshUser.farmer_id ?? null,
          }
          localStorage.setItem('krishi_user', JSON.stringify(userObj))
          setUser(userObj)
        }
      } catch (err) {
        // If 401 or invalid token, clearSession() was invoked by api.js or backend rejected user
        if (err.message && (err.message.includes('401') || err.message.includes('token') || err.message.includes('User not found') || err.message.includes('Not authenticated'))) {
          if (isMounted) {
            setToken(null)
            setUser(null)
          }
        }
        // If network error (offline backend), keep optimistic parsedUser without wiping
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verifySession()

    // Listen for global auth expiration events
    const handleAuthExpired = () => {
      if (isMounted) {
        setToken(null)
        setUser(null)
      }
    }

    window.addEventListener('krishi:auth-expired', handleAuthExpired)
    return () => {
      isMounted = false
      window.removeEventListener('krishi:auth-expired', handleAuthExpired)
    }
  }, [])

  const login = async (mobile, password) => {
    const data = await api.login({ mobile, password })
    localStorage.setItem('krishi_token', data.access_token)
    setToken(data.access_token)
    const userObj = {
      id: data.user_id,
      role: data.role,
      full_name: data.full_name,
      mobile,
      assigned_centre_id: data.assigned_centre_id ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
      farmer_id: data.farmer_id ?? null,
    }
    localStorage.setItem('krishi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  const register = async (formData) => {
    const data = await api.register(formData)
    localStorage.setItem('krishi_token', data.access_token)
    setToken(data.access_token)
    const userObj = {
      id: data.user_id,
      role: data.role,
      full_name: data.full_name,
      mobile: formData.mobile,
      assigned_centre_id: data.assigned_centre_id ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
      farmer_id: data.farmer_id ?? null,
    }
    localStorage.setItem('krishi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  const loginWithOtp = async (mobile, otp) => {
    const data = await api.verifyOtp(mobile, otp)
    localStorage.setItem('krishi_token', data.access_token)
    setToken(data.access_token)
    const userObj = {
      id: data.user_id,
      role: data.role,
      full_name: data.full_name,
      mobile,
      assigned_centre_id: data.assigned_centre_id ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
      farmer_id: data.farmer_id ?? null,
    }
    localStorage.setItem('krishi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  const logout = () => {
    localStorage.removeItem('krishi_token')
    localStorage.removeItem('krishi_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, setUser, loading, login, loginWithOtp, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

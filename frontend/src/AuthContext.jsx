import { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('krishi_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (mobile, password) => {
    const data = await api.login({ mobile, password })
    localStorage.setItem('krishi_token', data.access_token)
    const userObj = {
      id: data.user_id,
      role: data.role,
      full_name: data.full_name,
      mobile,
      assigned_centre_id: data.assigned_centre_id ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
    }
    localStorage.setItem('krishi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  const register = async (formData) => {
    const data = await api.register(formData)
    localStorage.setItem('krishi_token', data.access_token)
    const userObj = {
      id: data.user_id,
      role: data.role,
      full_name: data.full_name,
      mobile: formData.mobile,
      assigned_centre_id: data.assigned_centre_id ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
    }
    localStorage.setItem('krishi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  const loginWithOtp = async (mobile, otp) => {
    const data = await api.verifyOtp(mobile, otp)
    localStorage.setItem('krishi_token', data.access_token)
    const userObj = {
      id: data.user_id,
      role: data.role,
      full_name: data.full_name,
      mobile,
      assigned_centre_id: data.assigned_centre_id ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
    }
    localStorage.setItem('krishi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  const logout = () => {
    localStorage.removeItem('krishi_token')
    localStorage.removeItem('krishi_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, loginWithOtp, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

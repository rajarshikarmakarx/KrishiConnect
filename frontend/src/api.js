import toast from 'react-hot-toast'

// API client for KrishiConnect backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('krishi_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Purge stored credentials and notify subscribers (AuthContext, UI)
 * Deduplicated toast notification via fixed id prevents notification stacking.
 */
export function clearSession(detail = 'Session expired') {
  const hadSession = !!localStorage.getItem('krishi_token') || !!localStorage.getItem('krishi_user')
  localStorage.removeItem('krishi_token')
  localStorage.removeItem('krishi_user')

  if (hadSession) {
    window.dispatchEvent(new CustomEvent('krishi:auth-expired', { detail: { message: detail } }))
    toast.error('Your session has expired. Please log in again.', {
      id: 'session-expired-toast',
      duration: 4500,
    })
  }
}

// Routes where 401 is an expected credential error on login/verification, NOT an expired session
const AUTH_CREDENTIAL_ENDPOINTS = [
  '/auth/login',
  '/auth/verify-otp',
  '/auth/register',
  '/auth/send-otp',
  '/auth/register-operator',
]

async function request(method, path, body = null, customHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...customHeaders
  }

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  try {
    const res = await fetch(`${BASE_URL}${path}`, options)
    if (res.status === 204) return null

    let data
    try {
      data = await res.json()
    } catch {
      data = {}
    }

    if (!res.ok) {
      // If 401 Unauthorized occurs on an authenticated route
      if (res.status === 401 && !AUTH_CREDENTIAL_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
        clearSession(data.detail || 'Session expired')
      }
      throw new Error(data.detail || `Error ${res.status}`)
    }
    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Connection failed: Backend service unreachable at ${BASE_URL}. Ensure backend is running.`)
    }
    throw err
  }
}

export const api = {
  // Auth
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  sendOtp: (mobile, lang = 'en') => request('POST', '/auth/send-otp', { mobile, lang }),
  verifyOtp: (mobile, otp) => request('POST', '/auth/verify-otp', { mobile, otp }),
  getSmsLogs: () => request('GET', '/auth/sms-logs'),
  getMe: () => request('GET', '/auth/me'),
  getProfile: () => request('GET', '/auth/me'),
  updateProfile: (data) => request('PUT', '/auth/profile', data),
  deleteProfile: () => request('DELETE', '/auth/profile'),

  // Centres
  getCentres: (village, district) => {
    const params = new URLSearchParams()
    if (village) params.append('village', village)
    if (district) params.append('district', district)
    const qs = params.toString()
    return request('GET', `/centres${qs ? `?${qs}` : ''}`)
  },
  getCentre: (id) => request('GET', `/centres/${id}`),
  getSlots: (centreId, date) => request('GET', `/centres/${centreId}/slots${date ? `?slot_date=${date}` : ''}`),

  // Locations
  getDistricts: () => request('GET', '/locations/districts'),
  getVillages: (district) => request('GET', `/locations/villages${district ? `?district=${encodeURIComponent(district)}` : ''}`),
  getCoordinates: (village, district) => request('GET', `/locations/coordinates?village=${encodeURIComponent(village)}${district ? `&district=${encodeURIComponent(district)}` : ''}`),
  getAllLocations: () => request('GET', '/locations'),

  // Queue
  bookSlot: (data) => request('POST', '/queue/book', data),
  getMyQueue: () => request('GET', '/queue/my'),
  getMyActiveQueue: () => request('GET', '/queue/my/active'),
  getCentreQueue: (centreId) => request('GET', `/queue/${centreId}`),

  // Queue operations (operator & assayer)
  cancelBooking: (queueId) => request('POST', `/queue/${queueId}/cancel`),
  callNext: (centreId) => request('POST', `/queue/centre/${centreId}/call-next`),
  callSpecific: (queueId) => request('POST', `/queue/${queueId}/call`),
  startProcessing: (queueId) => request('POST', `/queue/${queueId}/start`),
  completeProcurement: (queueId, data) => request('POST', `/queue/${queueId}/complete`, data),
  recordQualityAction: (queueId, data) => request('POST', `/queue/${queueId}/quality-action`, data),
  getProcurement: (queueId) => request('GET', `/queue/${queueId}/procurement`),

  // Payments
  getPayment: (paymentId) => request('GET', `/payments/${paymentId}`),
  getPendingPayments: (centreId) => request('GET', `/payments/centre/${centreId}/pending`),
  markPaid: (paymentId) => request('POST', `/payments/${paymentId}/pay`),

  // Analytics & Impact
  getCentreAnalytics: (centreId) => request('GET', `/analytics/centre/${centreId}`),
  getDistrictAnalytics: () => request('GET', '/analytics/district'),
  getSystemHealth: () => request('GET', '/analytics/system-health'),
  getImpactMetrics: () => request('GET', '/analytics/impact'),
  getEnamSurge: () => request('GET', '/analytics/enam-surge'),

  // AI & Transparency Layer
  getAiEta: (centreId) => request('GET', `/ai/eta/${centreId}`),
  getAiRecommendation: (village) => request('GET', `/ai/recommend${village ? `?village=${encodeURIComponent(village)}` : ''}`),
  getMspRates: () => request('GET', '/ai/msp-rates'),
  getAiDataInfo: () => request('GET', '/ai/data-info'),
}

export default api

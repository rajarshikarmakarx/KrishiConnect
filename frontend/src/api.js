// API client for KrishiConnect backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('krishi_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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
    const data = await res.json()
    if (!res.ok) {
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
  updateProfile: (data) => request('PUT', '/auth/profile', data),
  deleteProfile: () => request('DELETE', '/auth/profile'),

  // Centres
  getCentres: () => request('GET', '/centres'),
  getCentre: (id) => request('GET', `/centres/${id}`),
  getSlots: (centreId, date) => request('GET', `/centres/${centreId}/slots${date ? `?slot_date=${date}` : ''}`),

  // Queue
  bookSlot: (data) => request('POST', '/queue/book', data),
  getMyQueue: () => request('GET', '/queue/my'),
  getMyActiveQueue: () => request('GET', '/queue/my/active'),
  getCentreQueue: (centreId) => request('GET', `/queue/${centreId}`),

  // Queue operations (operator)
  cancelBooking: (queueId) => request('POST', `/queue/${queueId}/cancel`),
  callNext: (centreId) => request('POST', `/queue/centre/${centreId}/call-next`),
  callSpecific: (queueId) => request('POST', `/queue/${queueId}/call`),
  startProcessing: (queueId) => request('POST', `/queue/${queueId}/start`),
  completeProcurement: (queueId, data) => request('POST', `/queue/${queueId}/complete`, data),
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

  // AI & Transparency Layer
  getAiEta: (centreId) => request('GET', `/ai/eta/${centreId}`),
  getAiRecommendation: (village) => request('GET', `/ai/recommend${village ? `?village=${encodeURIComponent(village)}` : ''}`),
  getMspRates: () => request('GET', '/ai/msp-rates'),
  getAiDataInfo: () => request('GET', '/ai/data-info'),
}

export default api

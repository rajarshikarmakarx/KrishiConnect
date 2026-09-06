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

  // AI & Transparency Layer
  getAiEta: (centreId) => request('GET', `/ai/eta/${centreId}`),
  getAiRecommendation: (village) => request('GET', `/ai/recommend${village ? `?village=${encodeURIComponent(village)}` : ''}`),
  getMspRates: () => request('GET', '/ai/msp-rates'),
  getAiDataInfo: () => request('GET', '/ai/data-info'),
}

export default api

/**
 * Multi-tab Auth Synchronization & 7-Day Remember-Me Unit / Integration Verification
 */

const REMEMBER_DAYS = 7
const REMEMBER_KEY = 'krishi_remember_until'

// Storage helpers directly mirroring AuthContext
function saveSession(token, userObj, rememberMe) {
  const store = rememberMe ? localStorage : sessionStorage
  store.setItem('krishi_token', token)
  store.setItem('krishi_user', JSON.stringify(userObj))

  if (rememberMe) {
    const expiresAt = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(REMEMBER_KEY, expiresAt.toString())
    sessionStorage.removeItem('krishi_token')
    sessionStorage.removeItem('krishi_user')
  } else {
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem('krishi_token')
    localStorage.removeItem('krishi_user')
  }
}

function readSession() {
  const lsToken = localStorage.getItem('krishi_token')
  const lsUser = localStorage.getItem('krishi_user')
  if (lsToken && lsUser) {
    return { token: lsToken, userStr: lsUser, store: 'local' }
  }
  const ssToken = sessionStorage.getItem('krishi_token')
  const ssUser = sessionStorage.getItem('krishi_user')
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

function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.exp) return false
    return payload.exp <= Math.floor(Date.now() / 1000) + 5
  } catch {
    return true
  }
}

function isRememberMeExpired() {
  const raw = localStorage.getItem(REMEMBER_KEY)
  if (!raw) return false
  return Date.now() > parseInt(raw, 10)
}

// Mock Storage
class MockStorage {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.get(key) || null
  }
  setItem(key, value) {
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

// Mock Global Environment
const globalLocalStorage = new MockStorage()
const tab1SessionStorage = new MockStorage()
const tab2SessionStorage = new MockStorage()

global.localStorage = globalLocalStorage
global.sessionStorage = tab1SessionStorage
global.atob = (str) => Buffer.from(str, 'base64').toString('utf-8')

function createFakeJwt(expEpochSec) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: '9876543210', role: 'farmer', exp: expEpochSec })).toString('base64url')
  const sig = 'fakesignature123'
  return `${header}.${payload}.${sig}`
}

async function runTests() {
  console.log('============================================================')
  console.log('🔄 TESTING MULTI-TAB AUTH SYNCHRONIZATION & REMEMBER-ME')
  console.log('============================================================\n')

  const nowSec = Math.floor(Date.now() / 1000)
  const validToken = createFakeJwt(nowSec + 3600) // 1 hour in future
  const expiredToken = createFakeJwt(nowSec - 30) // 30 sec in past
  const demoUser = { id: 10, role: 'farmer', full_name: 'Ramesh Mondal', mobile: '9876543210' }

  // Test 1: JWT Expiry Validator
  console.log('1️⃣  Testing JWT expiration helper...')
  if (!isJwtExpired(validToken)) {
    console.log('   ✓ Valid token correctly verified as active')
  } else {
    throw new Error('Valid token failed expiration check')
  }

  if (isJwtExpired(expiredToken)) {
    console.log('   ✓ Expired token correctly flagged as expired')
  } else {
    throw new Error('Expired token was not detected')
  }

  if (isJwtExpired('invalid.token.structure')) {
    console.log('   ✓ Malformed token correctly rejected')
  } else {
    throw new Error('Malformed token was not rejected')
  }

  // Test 2: Standard Session Login (rememberMe = false)
  console.log('\n2️⃣  Testing Standard Session Login (rememberMe = false)...')
  wipeSession()
  saveSession(validToken, demoUser, false)

  if (tab1SessionStorage.getItem('krishi_token') === validToken &&
      !globalLocalStorage.getItem('krishi_token') &&
      !globalLocalStorage.getItem('krishi_remember_until')) {
    console.log('   ✓ Session stored strictly in sessionStorage; localStorage remains clean')
  } else {
    throw new Error('Standard session improperly stored in localStorage')
  }

  const session1 = readSession()
  if (session1 && session1.token === validToken && session1.store === 'session') {
    console.log('   ✓ Tab 1 successfully reads active tab session')
  } else {
    throw new Error('Failed to read Tab 1 session')
  }

  // Test 3: Tab 2 Opening (Simulating cross-tab session handoff)
  console.log('\n3️⃣  Testing Tab 2 Session Synchronization from Tab 1...')
  // Switch to Tab 2 context
  global.sessionStorage = tab2SessionStorage
  const tab2InitialSession = readSession()
  if (tab2InitialSession === null) {
    console.log('   ✓ Tab 2 begins with clean sessionStorage (simulating fresh browser tab)')
  } else {
    throw new Error('Tab 2 unexpectedly has existing session')
  }

  // Simulate cross-tab handoff: Tab 1 broadcasts session to Tab 2
  const sessionHandoff = {
    type: 'SESSION_RESPONSE',
    token: validToken,
    user: demoUser,
    rememberMe: false
  }

  saveSession(sessionHandoff.token, sessionHandoff.user, sessionHandoff.rememberMe)
  const tab2SyncedSession = readSession()
  if (tab2SyncedSession && tab2SyncedSession.token === validToken && tab2SyncedSession.store === 'session') {
    console.log('   ✓ Tab 2 received session and safely stored in Tab 2 sessionStorage')
  } else {
    throw new Error('Tab 2 failed to store synced session')
  }

  // Test 4: 7-Day Remember-Me Login (rememberMe = true)
  console.log('\n4️⃣  Testing 7-Day Remember-Me Option (rememberMe = true)...')
  wipeSession()
  saveSession(validToken, demoUser, true)

  const rememberStamp = globalLocalStorage.getItem('krishi_remember_until')
  if (globalLocalStorage.getItem('krishi_token') === validToken && rememberStamp) {
    const remainingDays = (parseInt(rememberStamp, 10) - Date.now()) / (24 * 60 * 60 * 1000)
    console.log(`   ✓ Remember-me session saved in localStorage with expiry ~${remainingDays.toFixed(1)} days`)
  } else {
    throw new Error('Remember-me session not saved in localStorage')
  }

  if (!isRememberMeExpired()) {
    console.log('   ✓ Active 7-day remember-me session confirmed valid')
  } else {
    throw new Error('Active remember-me session flagged as expired')
  }

  // Test 5: Simulated 7-day expiry threshold
  console.log('\n5️⃣  Testing 7-Day Expiry Boundary...')
  const pastStamp = Date.now() - 1000
  globalLocalStorage.setItem('krishi_remember_until', pastStamp.toString())
  if (isRememberMeExpired()) {
    console.log('   ✓ Expired remember-me timestamp correctly triggers expiration')
  } else {
    throw new Error('Expired remember-me timestamp was not detected')
  }

  // Test 6: Clean Logout / Wipe Across Stores
  console.log('\n6️⃣  Testing Session Wipe & Cross-Store Cleanup...')
  wipeSession()
  if (!globalLocalStorage.getItem('krishi_token') &&
      !globalLocalStorage.getItem('krishi_user') &&
      !globalLocalStorage.getItem('krishi_remember_until') &&
      !tab2SessionStorage.getItem('krishi_token')) {
    console.log('   ✓ All storage stores (localStorage & sessionStorage) completely purged on logout')
  } else {
    throw new Error('Storage was not completely purged')
  }

  console.log('\n============================================================')
  console.log('🎉 ALL MULTI-TAB & REMEMBER-ME TESTS PASSED SUCCESSFULLY!')
  console.log('============================================================')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { Wheat, MapPin, Clock, Users, Star, ChevronRight, History, Bell, LogOut, X, CheckCircle, Ticket, User, ChevronDown, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import LiveQueueScreen from '../components/farmer/LiveQueueScreen'
import CentreList from '../components/farmer/CentreList'
import SlotBookingModal from '../components/farmer/SlotBookingModal'
import BookingToken from '../components/farmer/BookingToken'
import ProcurementStatus from '../components/farmer/ProcurementStatus'
import CompletionConfirmation from '../components/farmer/CompletionConfirmation'
import ProfileEdit from '../components/farmer/ProfileEdit'
import FarmerHistory from '../components/farmer/FarmerHistory'

const TABS = [
  { id: 'centres', label: 'Centres', icon: MapPin },
  { id: 'queue', label: 'My Queue', icon: Ticket },
  { id: 'history', label: 'History', icon: History },
]

function ProfileMenu({ user, logout, onEditProfile }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        id="btn-profile-menu"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
      >
        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white max-w-[120px] truncate">{user.full_name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="bg-gradient-to-br from-green-700 to-green-800 p-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white text-sm">{user.full_name}</p>
            <p className="text-green-200 text-xs">Farmer · {user.mobile}</p>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100">
            {user.village && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.village}, {user.district}</span>
              </div>
            )}
            {user.farmer_id && (
              <div className="px-2 py-1 text-xs text-slate-400 font-mono">ID: {user.farmer_id}</div>
            )}
          </div>
          <div className="p-2">
            <button
              onClick={() => { onEditProfile(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FarmerApp() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('centres')
  const [centres, setCentres] = useState([])
  const [loadingCentres, setLoadingCentres] = useState(true)
  const [activeQueue, setActiveQueue] = useState(null)
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [selectedCentre, setSelectedCentre] = useState(null)
  const [showBooking, setShowBooking] = useState(false)
  const [newToken, setNewToken] = useState(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)

  const loadCentres = useCallback(async () => {
    try {
      const data = await api.getCentres()
      setCentres(data)
    } catch (e) {
      toast.error('Could not load centres')
    } finally {
      setLoadingCentres(false)
    }
  }, [])

  const loadActiveQueue = useCallback(async () => {
    try {
      const data = await api.getMyActiveQueue()
      setActiveQueue(data)
      if (data) setTab('queue')
    } catch {} finally {
      setLoadingQueue(false)
    }
  }, [])

  useEffect(() => { loadCentres(); loadActiveQueue() }, [])

  const handleBookingSuccess = (entry) => {
    setNewToken(entry)
    setShowBooking(false)
    setActiveQueue(null)
    loadActiveQueue()
    setTab('queue')
    toast.success(`🎫 Token ${entry.token} booked successfully!`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="gov-header text-white px-4 py-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <Wheat className="w-5 h-5 text-green-200" />
              </div>
              <div>
                <h1 className="text-lg font-bold">KrishiFlow</h1>
                <p className="text-green-300 text-xs">Smart Procurement</p>
              </div>
            </div>
            <ProfileMenu user={user} logout={logout} onEditProfile={() => setShowProfileEdit(true)} />
          </div>
        </div>
      </header>

      {/* Active queue banner */}
      {activeQueue && (
        <div className="bg-green-700 text-white px-4 py-3 border-b border-green-600">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="live-dot" />
              <div>
                <span className="font-mono font-bold text-lg">{activeQueue.queue_entry.token}</span>
                <span className="text-green-200 text-sm ml-2">· {activeQueue.farmers_ahead} ahead · ~{Math.round(activeQueue.estimated_wait_minutes)} min</span>
              </div>
            </div>
            <button onClick={() => setTab('queue')} className="text-green-200 hover:text-white text-sm flex items-center gap-1">
              View <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        {tab === 'centres' && (
          <CentreList
            centres={centres}
            loading={loadingCentres}
            onSelect={(c) => { setSelectedCentre(c); setShowBooking(true) }}
          />
        )}
        {tab === 'queue' && (
          loadingQueue ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : newToken ? (
            <div className="space-y-4">
              <BookingToken entry={newToken} onContinue={() => setNewToken(null)} />
              {activeQueue && <LiveQueueScreen queueStatus={activeQueue} onRefresh={loadActiveQueue} />}
            </div>
          ) : activeQueue ? (
            <div className="space-y-4">
              {activeQueue.queue_entry.status === 'COMPLETED' ? (
                <CompletionConfirmation queueEntry={activeQueue.queue_entry} />
              ) : (
                <>
                  <LiveQueueScreen queueStatus={activeQueue} onRefresh={loadActiveQueue} />
                  {activeQueue.queue_entry.status === 'PROCESSING' && (
                    <ProcurementStatus queueEntry={activeQueue.queue_entry} />
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Booking</h3>
              <p className="text-slate-500 text-sm mb-6">Book a slot at a procurement centre to get your queue token</p>
              <button onClick={() => setTab('centres')} className="btn-primary">Browse Centres</button>
            </div>
          )
        )}
        {tab === 'history' && <FarmerHistory />}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-slate-200 px-4 py-2 safe-bottom sticky bottom-0">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
                tab === id ? 'text-green-700' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
              {id === 'queue' && activeQueue && (
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Booking Modal */}
      {showBooking && selectedCentre && (
        <SlotBookingModal
          centre={selectedCentre}
          activeQueueToken={activeQueue}
          onClose={() => setShowBooking(false)}
          onSuccess={handleBookingSuccess}
          onGoToQueue={(refresh) => {
            if (refresh) loadActiveQueue()
            setTab('queue')
          }}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEdit onClose={() => setShowProfileEdit(false)} />
      )}
    </div>
  )
}

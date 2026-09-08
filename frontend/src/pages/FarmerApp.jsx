import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import { useTranslation } from '../i18n'
import { Wheat, MapPin, Clock, Users, Star, ChevronRight, History, Bell, LogOut, X, CheckCircle, Ticket, User, ChevronDown, Settings, Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import NotificationCenter from '../components/NotificationCenter'
import LanguageSwitcher from '../components/LanguageSwitcher'
import LiveQueueScreen from '../components/farmer/LiveQueueScreen'
import CentreList from '../components/farmer/CentreList'
import SlotBookingModal from '../components/farmer/SlotBookingModal'
import BookingToken from '../components/farmer/BookingToken'
import ProcurementStatus from '../components/farmer/ProcurementStatus'
import CompletionConfirmation from '../components/farmer/CompletionConfirmation'
import ProfileEdit from '../components/farmer/ProfileEdit'
import FarmerHistory from '../components/farmer/FarmerHistory'
import MspRatesModal from '../components/farmer/MspRatesModal'
import { useFarmerNotifications, useCentreQueue } from '../hooks/useRealtimeQueue'

function ProfileMenu({ user, logout, onEditProfile, onOpenMsp }) {
  const { t, translateLocation } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        id="btn-profile-menu"
        onClick={() => setOpen(o => !o)}
        aria-label="User Profile"
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20 cursor-pointer shrink-0"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <span className="hidden sm:inline text-sm font-medium text-white max-w-[120px] truncate">{user.full_name}</span>
        <ChevronDown className={`hidden sm:inline w-3.5 h-3.5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="bg-gradient-to-br from-green-700 to-green-800 p-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white text-sm">{user.full_name}</p>
            <p className="text-green-200 text-xs">{t('nav.farmer_role')} · {user.mobile}</p>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100">
            {user.village && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{translateLocation(`${user.village}, ${user.district}`)}</span>
              </div>
            )}
            {user.farmer_id && (
              <div className="px-2 py-1 text-xs text-slate-400 font-mono truncate">{t('nav.id_prefix')} {user.farmer_id}</div>
            )}
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => { onOpenMsp(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-green-800 hover:bg-green-50 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Scale className="w-4 h-4 text-green-700 shrink-0" />
              {t('nav.govt_msp_rates')}
            </button>
            <button
              onClick={() => { onEditProfile(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              {t('nav.edit_profile')}
            </button>
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {t('nav.sign_out')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FarmerApp() {
  const { user, logout } = useAuth()
  const { addNotification } = useNotifications()
  const { t, translateCrop, translateCentreName, formatNumber } = useTranslation()
  const [tab, setTab] = useState('centres')
  const [centres, setCentres] = useState([])
  const [loadingCentres, setLoadingCentres] = useState(true)
  const [activeQueue, setActiveQueue] = useState(null)
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [selectedCentre, setSelectedCentre] = useState(null)
  const [showBooking, setShowBooking] = useState(false)
  const [newToken, setNewToken] = useState(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showMspModal, setShowMspModal] = useState(false)

  const TABS = [
    { id: 'centres', label: t('nav.centres'), icon: MapPin },
    { id: 'queue', label: t('nav.my_queue'), icon: Ticket },
    { id: 'history', label: t('nav.history'), icon: History },
  ]

  const loadCentres = useCallback(async (overrideUser) => {
    const activeUser = overrideUser || user
    try {
      const data = await api.getCentres(activeUser?.village, activeUser?.district)
      setCentres(data)
    } catch (e) {
      toast.error(t('toasts.could_not_load_centres'))
    } finally {
      setLoadingCentres(false)
    }
  }, [user, t])

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

  // Top-level farmer notification listener
  const token = localStorage.getItem('krishi_token')
  useFarmerNotifications(
    user?.id,
    token,
    useCallback((data) => {
      if (data.type === 'PAYMENT_PAID') {
        setNewToken(null)
        toast.success(t('toasts.dbt_paid_toast'), {
          id: 'farmer-payment-paid',
          duration: 4000,
        })
        addNotification({
          title: t('notifications.dbt_paid_title'),
          message: t('notifications.dbt_paid_msg'),
          type: 'payment',
          eventKey: `payment-${data.payment_id || data.token || Date.now()}`
        })
        loadActiveQueue()
      } else if (data.type === 'COMPLETED') {
        setNewToken(null)
        toast.success(t('toasts.proc_completed_toast'), {
          id: 'farmer-proc-completed',
          duration: 3500
        })
        addNotification({
          title: t('notifications.proc_completed_title'),
          message: t('notifications.proc_completed_msg'),
          type: 'success',
          eventKey: `completed-${data.queue_id || data.token || Date.now()}`
        })
        loadActiveQueue()
      } else if (data.type === 'CALLED') {
        const counterLabel = data.counter || t('queue.default_counter')
        toast(t('toasts.turn_called_toast', { counter: counterLabel }), {
          id: 'farmer-turn-called',
          duration: 4500,
          icon: '🔔'
        })
        addNotification({
          title: t('notifications.turn_called_title'),
          message: t('notifications.turn_called_msg', { counter: counterLabel }),
          type: 'queue',
          eventKey: `called-${data.queue_id || data.token || Date.now()}`
        })
        loadActiveQueue()
      } else if (data.type === 'PROCESSING') {
        toast(t('toasts.processing_toast'), {
          id: 'farmer-processing',
          duration: 3500,
          icon: '⚙️'
        })
        addNotification({
          title: t('notifications.processing_title'),
          message: t('notifications.processing_msg'),
          type: 'info',
          eventKey: `processing-${data.queue_id || data.token || Date.now()}`
        })
        loadActiveQueue()
      } else if (data.type === 'QUALITY_DECISION') {
        if (data.status === 'DEFERRED_SUN_DRYING') {
          toast(t('toasts.sun_drying_toast'), {
            id: 'farmer-sun-drying',
            duration: 4000,
            icon: '☀️'
          })
          addNotification({
            title: t('notifications.sun_drying_title'),
            message: t('notifications.sun_drying_msg'),
            type: 'assay',
            eventKey: `deferral-${data.queue_id || data.token || Date.now()}`
          })
        } else if (data.status === 'REJECTED') {
          toast.error(t('toasts.rejected_toast'), {
            id: 'farmer-rejected',
            duration: 4500,
          })
          addNotification({
            title: t('notifications.rejection_title'),
            message: t('notifications.rejection_msg'),
            type: 'alert',
            eventKey: `rejected-${data.queue_id || data.token || Date.now()}`
          })
        }
        loadActiveQueue()
      }
    }, [loadActiveQueue, addNotification, t])
  )

  // Clear newToken if activeQueue is already completed
  useEffect(() => {
    if (activeQueue?.queue_entry?.status === 'COMPLETED' && newToken) {
      setNewToken(null)
    }
  }, [activeQueue?.queue_entry?.status, newToken])

  // Active polling fallback when procurement is being actively serviced
  useEffect(() => {
    const st = activeQueue?.queue_entry?.status
    if (st === 'CALLED' || st === 'PROCESSING') {
      const timer = setInterval(() => {
        loadActiveQueue()
      }, 2500)
      return () => clearInterval(timer)
    }
  }, [activeQueue?.queue_entry?.status, loadActiveQueue])

  // Listen to centre queue changes when active queue is present
  useCentreQueue(activeQueue?.queue_entry?.centre_id, loadActiveQueue)

  const handleBookingSuccess = (entry) => {
    setNewToken(entry)
    setShowBooking(false)
    setActiveQueue(null)
    loadActiveQueue()
    setTab('queue')
    toast.success(t('toasts.token_booked_success', { token: entry.token }))
    addNotification({
      title: t('notifications.slot_booked_title', { token: entry.token }),
      message: t('notifications.slot_booked_msg', {
        crop: translateCrop(entry.crop),
        centre: translateCentreName(entry.centre_name) || t('nav.centres')
      }),
      type: 'queue',
      eventKey: `booking-${entry.id || entry.token}`
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="gov-header text-white px-3 sm:px-4 py-3 sm:py-4 safe-bottom sticky top-0 z-30 shadow-md w-full">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                <Wheat className="w-4 h-4 sm:w-5 sm:h-5 text-green-200" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold leading-tight truncate">{t('common.app_name')}</h1>
                <p className="hidden sm:block text-green-300 text-xs truncate">{t('common.app_tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <LanguageSwitcher dark={true} />
              <button
                onClick={() => setShowMspModal(true)}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-semibold border border-amber-400/30 transition-colors cursor-pointer shrink-0"
                title={t('msp.title')}
              >
                <Scale className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">{t('nav.govt_msp_rates')}</span>
                <span className="sm:hidden font-bold">MSP</span>
              </button>
              <NotificationCenter dark={true} />
              <ProfileMenu
                user={user}
                logout={logout}
                onEditProfile={() => setShowProfileEdit(true)}
                onOpenMsp={() => setShowMspModal(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Active queue banner */}
      {activeQueue && activeQueue.queue_entry.status !== 'COMPLETED' && (
        <div className="bg-green-700 text-white px-4 py-3 border-b border-green-600 shadow-inner">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="live-dot" />
              <div>
                <span className="font-mono font-bold text-lg">{activeQueue.queue_entry.token}</span>
                <span className="text-green-200 text-sm ml-2">
                  · {formatNumber(activeQueue.farmers_ahead)} {t('queue.farmers_ahead')} · ~{formatNumber(Math.round(activeQueue.estimated_wait_minutes))} {t('common.min')}
                </span>
              </div>
            </div>
            <button onClick={() => setTab('queue')} className="text-green-200 hover:text-white text-sm font-semibold flex items-center gap-1 cursor-pointer">
              {t('common.view')} <ChevronRight className="w-4 h-4" />
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
            userLocation={user ? `${user.village || ''}${user.village && user.district ? ', ' : ''}${user.district || ''}` : null}
          />
        )}
        {tab === 'queue' && (
          loadingQueue ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeQueue?.queue_entry?.status === 'COMPLETED' ? (
            <div className="space-y-4">
              <CompletionConfirmation queueEntry={activeQueue.queue_entry} />
            </div>
          ) : newToken ? (
            <div className="space-y-4">
              <BookingToken entry={newToken} onContinue={() => setNewToken(null)} />
              {activeQueue && <LiveQueueScreen queueStatus={activeQueue} onRefresh={loadActiveQueue} />}
            </div>
          ) : activeQueue ? (
            <div className="space-y-4">
              <LiveQueueScreen queueStatus={activeQueue} onRefresh={loadActiveQueue} />
              {activeQueue.queue_entry.status === 'PROCESSING' && (
                <ProcurementStatus queueEntry={activeQueue.queue_entry} />
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('token.no_active_booking')}</h3>
              <p className="text-slate-500 text-sm mb-6">{t('token.no_active_booking_desc')}</p>
              <button onClick={() => setTab('centres')} className="btn-primary cursor-pointer">{t('token.browse_centres')}</button>
            </div>
          )
        )}
        {tab === 'history' && <FarmerHistory />}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-slate-200 px-4 py-2 safe-bottom sticky bottom-0 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors cursor-pointer ${
                tab === id ? 'text-green-700 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
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
        <ProfileEdit
          onClose={() => setShowProfileEdit(false)}
          onProfileUpdated={(updated) => loadCentres(updated)}
        />
      )}

      {/* MSP Rates Modal */}
      {showMspModal && (
        <MspRatesModal onClose={() => setShowMspModal(false)} />
      )}
    </div>
  )
}

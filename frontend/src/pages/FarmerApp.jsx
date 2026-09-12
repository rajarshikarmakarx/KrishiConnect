import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import { useTranslation } from '../i18n'
import { Wheat, MapPin, ChevronRight, History, LogOut, Ticket, User, ChevronDown, Settings, Scale, Award } from 'lucide-react'
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
import QualityStandardsModal from '../components/farmer/QualityStandardsModal'
import { useFarmerNotifications, useCentreQueue } from '../hooks/useRealtimeQueue'

function ProfileMenu({ user, logout, onEditProfile, onOpenMsp, onOpenStandards }) {
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
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 cursor-pointer shrink-0 active:scale-95 shadow-xs"
      >
        <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left leading-none min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white max-w-[140px] md:max-w-[180px] lg:max-w-[220px] truncate">
            {user.full_name}
          </span>
          <span className="text-[10px] text-green-200/90 font-medium hidden md:inline truncate mt-0.5">
            {user.village ? translateLocation(`${user.village}, ${user.district}`) : t('nav.farmer_role')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="bg-gradient-to-br from-green-700 to-green-800 p-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2 shadow-inner">
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white text-sm">{user.full_name}</p>
            <p className="text-green-200 text-xs">{t('nav.farmer_role')} · {user.mobile}</p>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100">
            {user.village && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{translateLocation(`${user.village}, ${user.district}`)}</span>
              </div>
            )}
            {user.farmer_id && (
              <div className="px-2 py-1 text-xs text-slate-400 font-mono truncate">{t('nav.id_prefix')} {user.farmer_id}</div>
            )}
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => { onOpenStandards(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
              {t('nav.govt_quality_standards')}
            </button>
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
  const [showQualityStandardsModal, setShowQualityStandardsModal] = useState(false)

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
      <header className="gov-header text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 safe-bottom sticky top-0 z-30 shadow-md w-full">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 sm:gap-6 min-w-0">
          {/* Brand & Gov Emblem */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/15 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/25 shadow-inner backdrop-blur-sm shrink-0">
              <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap leading-none select-none">
                  {t('common.app_name')}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  {t('common.gov_portal_badge')}
                </span>
              </div>
              <p className="hidden sm:block text-green-200/90 text-xs font-medium truncate mt-1 leading-none">
                {t('common.app_tagline')}
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 shrink-0">
            <LanguageSwitcher dark={true} />
            <button
              id="btn-quality-standards-header"
              onClick={() => setShowQualityStandardsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-100 text-xs font-semibold border border-emerald-400/40 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              title={t('quality_standards.modal_title')}
            >
              <Award className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="hidden sm:inline font-semibold">{t('nav.govt_quality_standards')}</span>
              <span className="sm:hidden font-bold">Agmark</span>
            </button>
            <button
              id="btn-msp-rates-header"
              onClick={() => setShowMspModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 text-xs font-semibold border border-amber-400/40 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              title={t('msp.title')}
            >
              <Scale className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline font-semibold">{t('nav.govt_msp_rates')}</span>
              <span className="sm:hidden font-bold">MSP</span>
            </button>
            <NotificationCenter dark={true} />
            <ProfileMenu
              user={user}
              logout={logout}
              onEditProfile={() => setShowProfileEdit(true)}
              onOpenMsp={() => setShowMspModal(true)}
              onOpenStandards={() => setShowQualityStandardsModal(true)}
            />
          </div>
        </div>
      </header>

      {/* Active queue banner */}
      {activeQueue && activeQueue.queue_entry.status !== 'COMPLETED' && (
        <div className="bg-green-700/95 text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 border-b border-green-600 shadow-inner w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="live-dot shrink-0" />
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono font-black text-base sm:text-lg bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {activeQueue.queue_entry.token}
                </span>
                <span className="text-green-100 text-xs sm:text-sm font-medium truncate">
                  · {formatNumber(activeQueue.farmers_ahead)} {t('queue.farmers_ahead')} · ~{formatNumber(Math.round(activeQueue.estimated_wait_minutes))} {t('common.min')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setTab('queue')}
              className="text-white hover:text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 transition-colors shrink-0"
            >
              {t('common.view')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-6">
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
      <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 safe-bottom sticky bottom-0 z-20 shadow-lg">
        <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-around">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                tab === id
                  ? 'text-green-700 font-bold bg-green-50/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {id === 'queue' && activeQueue && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white" />
                )}
              </div>
              <span className="text-xs leading-none">{label}</span>
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

      {/* Agmark Quality Standards Modal */}
      {showQualityStandardsModal && (
        <QualityStandardsModal
          isOpen={showQualityStandardsModal}
          onClose={() => setShowQualityStandardsModal(false)}
        />
      )}
    </div>
  )
}

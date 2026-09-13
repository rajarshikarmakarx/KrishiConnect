import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import { useTranslation } from '../i18n'
import {
  Wheat,
  MapPin,
  ChevronRight,
  History,
  LogOut,
  Ticket,
  User,
  ChevronDown,
  Settings,
  Scale,
  Award,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import NotificationCenter from '../components/NotificationCenter'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
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
import KrishiChatbotModal from '../components/farmer/KrishiChatbotModal'
import { useFarmerNotifications, useCentreQueue, useAdminQueue } from '../hooks/useRealtimeQueue'

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
      {/* Pill-shaped profile button with ring effect */}
      <button
        id="btn-profile-menu"
        onClick={() => setOpen(o => !o)}
        aria-label="User Profile"
        className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer shrink-0 shadow-xs active:scale-95"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/20">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0 pr-0.5">
          <span className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[140px] md:max-w-[180px]">
            {user.full_name}
          </span>
          <span className="text-[10px] text-emerald-200/90 font-medium leading-tight hidden md:inline truncate">
            {user.village ? translateLocation(`${user.village}, ${user.district}`) : t('nav.farmer_role')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-200/80 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        /* Glassmorphism dropdown */
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="bg-gradient-to-br from-emerald-50 via-slate-50 to-white dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] p-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mb-2 text-emerald-700 dark:text-emerald-400 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm font-display">{user.full_name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                {t('nav.farmer_role')}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">{user.mobile}</span>
            </div>
          </div>
          <div className="p-3 space-y-1 border-b border-slate-100 dark:border-slate-800/80">
            {user.village && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">{translateLocation(`${user.village}, ${user.district}`)}</span>
              </div>
            )}
            {user.farmer_id && (
              <div className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500 font-mono truncate">{t('nav.id_prefix')} {user.farmer_id}</div>
            )}
          </div>
          <div className="p-2 space-y-1">
            {/* Agmark Standards — opens Quality Standards modal */}
            <button
              onClick={() => { onOpenStandards(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Award className="w-4 h-4 text-emerald-500 shrink-0" />
              {t('nav.govt_quality_standards')}
            </button>
            {/* MSP Rates — opens MSP modal */}
            <button
              onClick={() => { onOpenMsp(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Scale className="w-4 h-4 text-amber-500 shrink-0" />
              {t('nav.govt_msp_rates')}
            </button>
            <button
              onClick={() => { onEditProfile(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              {t('nav.edit_profile')}
            </button>
            <button
              id="btn-logout"
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium cursor-pointer"
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
  const { user, token, logout } = useAuth()
  const { addNotification } = useNotifications()
  const { t, language, translateCrop, translateCentreName, formatNumber } = useTranslation()
  const [tab, setTab] = useState('centres')
  const [centres, setCentres] = useState([])
  const [loadingCentres, setLoadingCentres] = useState(true)
  const [activeQueue, setActiveQueue] = useState(null)
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [selectedCentre, setSelectedCentre] = useState(null)
  const [showBooking, setShowBooking] = useState(false)
  const [prefilledBooking, setPrefilledBooking] = useState({ crop: 'Paddy', qty: '' })
  const [newToken, setNewToken] = useState(null)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showMspModal, setShowMspModal] = useState(false)
  const [showQualityStandardsModal, setShowQualityStandardsModal] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)

  // Track transactions that transitioned to COMPLETED during the CURRENT login session
  const [sessionCompletedEntryId, setSessionCompletedEntryId] = useState(null)
  const activeEntryIdRef = useRef(null)

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
    } catch {
      toast.error(t('toasts.could_not_load_centres'))
    } finally {
      setLoadingCentres(false)
    }
  }, [user, t])

  const initialQueueLoadDone = useRef(false)

  const loadActiveQueue = useCallback(async () => {
    const isInitialLoad = !initialQueueLoadDone.current
    try {
      const data = await api.getMyActiveQueue()
      setActiveQueue(data)

      const entryId = data?.queue_entry?.id
      const status = data?.queue_entry?.status

      if (!data || status === 'CANCELLED') {
        if (newToken) setNewToken(null)
      }

      if (isInitialLoad) {
        if (data && status !== 'COMPLETED' && status !== 'CANCELLED') {
          activeEntryIdRef.current = entryId
          setTab('queue')
        }
      } else {
        if (status === 'COMPLETED' && (activeEntryIdRef.current === entryId || entryId === sessionCompletedEntryId)) {
          setSessionCompletedEntryId(entryId)
        } else if (status && status !== 'COMPLETED' && status !== 'CANCELLED') {
          activeEntryIdRef.current = entryId
        }
      }
    } catch {} finally {
      if (isInitialLoad) initialQueueLoadDone.current = true
      setLoadingQueue(false)
    }
  }, [sessionCompletedEntryId, newToken])

  const debounceTimerRef = useRef(null)
  const debouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      loadActiveQueue()
      loadCentres()
    }, 250)
  }, [loadActiveQueue, loadCentres])

  useEffect(() => { loadCentres(); loadActiveQueue() }, [])

  // Realtime notification listeners
  useFarmerNotifications(
    user?.id,
    token,
    useCallback((data) => {
      if (data.type === 'PAYMENT_PAID') {
        setNewToken(null)
        if (data.queue_id || activeEntryIdRef.current) {
          setSessionCompletedEntryId(data.queue_id || activeEntryIdRef.current)
        }
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
        debouncedRefresh()
      } else if (data.type === 'COMPLETED') {
        setNewToken(null)
        if (data.queue_id || activeEntryIdRef.current) {
          setSessionCompletedEntryId(data.queue_id || activeEntryIdRef.current)
        }
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
        debouncedRefresh()
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
        debouncedRefresh()
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
        debouncedRefresh()
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
        debouncedRefresh()
      } else if (data.type === 'CANCELLED') {
        setNewToken(null)
        setActiveQueue(null)
        activeEntryIdRef.current = null
        toast.error(t('notifications.booking_cancelled_msg'), {
          id: 'farmer-booking-cancelled',
          duration: 5000,
          icon: '❌'
        })
        addNotification({
          title: t('notifications.booking_cancelled_title'),
          message: t('notifications.booking_cancelled_msg'),
          type: 'alert',
          eventKey: `cancelled-${data.queue_id || data.token || Date.now()}`
        })
        debouncedRefresh()
      }
    }, [debouncedRefresh, addNotification, t])
  )

  useEffect(() => {
    if (activeQueue?.queue_entry?.status === 'COMPLETED' && newToken) {
      setNewToken(null)
    }
  }, [activeQueue?.queue_entry?.status, newToken])

  useEffect(() => {
    const st = activeQueue?.queue_entry?.status
    if (st === 'CALLED' || st === 'PROCESSING') {
      const timer = setInterval(() => {
        loadActiveQueue()
      }, 2500)
      return () => clearInterval(timer)
    }
  }, [activeQueue?.queue_entry?.status, loadActiveQueue])

  useAdminQueue(debouncedRefresh)
  useCentreQueue(activeQueue?.queue_entry?.centre_id, debouncedRefresh)

  const handleBookingSuccess = (entry) => {
    activeEntryIdRef.current = entry.id
    setNewToken(entry)
    setShowBooking(false)
    setTab('queue')
    loadActiveQueue()
    toast.success(t('toasts.booking_confirmed_toast'))
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

  const handleVoiceBooking = (crop, quantity) => {
    setPrefilledBooking({
      crop: crop || 'Paddy',
      qty: quantity ? String(quantity) : ''
    })
    const targetCentre = selectedCentre || centres[0] || null
    setSelectedCentre(targetCentre)
    setShowBooking(true)
    setShowChatbot(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col w-full max-w-full overflow-x-hidden font-sans transition-colors duration-200">
      {/* Header — deep emerald gradient with tricolor bottom stripe */}
      <header className="bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-emerald-950 text-white px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-md w-full relative">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 sm:gap-6 min-w-0">
          {/* Brand & Gov Emblem */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white/20 shrink-0">
              <Wheat className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap leading-none select-none font-display">
                  {t('common.app_name')}
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs">
                  {t('common.gov_portal_badge')}
                </span>
              </div>
              <p className="hidden sm:block text-emerald-200/80 text-xs font-medium truncate mt-0.5 leading-none">
                {t('common.app_tagline')}
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
            <LanguageSwitcher dark={true} />
            <ThemeToggle />

            {/* Agmark Quality Standards — pill button, green tint */}
            <button
              id="btn-quality-standards-header"
              onClick={() => setShowQualityStandardsModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-xs active:scale-95"
              title={t('quality_standards.modal_title')}
            >
              <Award className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Agmark Standards</span>
            </button>
            {/* Mobile Agmark button (icon only) */}
            <button
              id="btn-quality-standards-header-sm"
              onClick={() => setShowQualityStandardsModal(true)}
              className="lg:hidden flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-xs active:scale-95"
              title={t('quality_standards.modal_title')}
            >
              <Award className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="hidden sm:inline">Agmark</span>
            </button>

            {/* MSP Rates — amber pill button */}
            <button
              id="btn-msp-rates-header"
              onClick={() => setShowMspModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold border border-amber-400/40 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
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
              onOpenStandards={() => setShowQualityStandardsModal(true)}
            />
          </div>
        </div>

        {/* Indian Tricolor Government Micro-Stripe */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-white/80 to-emerald-400 absolute bottom-0 left-0 opacity-80" />
      </header>

      {/* Active queue banner — glassmorphism */}
      {activeQueue && activeQueue.queue_entry.status !== 'COMPLETED' && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-100/60 dark:from-emerald-950 dark:via-emerald-900 dark:to-slate-950 text-slate-900 dark:text-white px-4 py-3 border-b border-emerald-200/80 dark:border-emerald-500/20 shadow-xs backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20 dark:ring-emerald-400/20 shrink-0" />
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono font-bold text-base sm:text-lg tracking-wide text-emerald-900 dark:text-white bg-white/90 dark:bg-white/10 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-white/10 shadow-2xs">
                  {activeQueue.queue_entry.token}
                </span>
                <span className="text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-medium truncate">
                  · {formatNumber(activeQueue.farmers_ahead)} {t('queue.farmers_ahead')} · ~{formatNumber(Math.round(activeQueue.estimated_wait_minutes))} {t('common.min')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setTab('queue')}
              className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-white/15 transition-all flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
            >
              {t('common.view')} <ChevronRight className="w-3.5 h-3.5" />
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
            onSelect={(c) => {
              setSelectedCentre(c)
              setPrefilledBooking({ crop: 'Paddy', qty: '' })
              setShowBooking(true)
            }}
            userLocation={user ? `${user.village || ''}${user.village && user.district ? ', ' : ''}${user.district || ''}` : null}
          />
        )}
        {tab === 'queue' && (
          loadingQueue ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeQueue?.queue_entry?.status === 'COMPLETED' && sessionCompletedEntryId === activeQueue.queue_entry.id ? (
            <div className="space-y-4">
              <CompletionConfirmation queueEntry={activeQueue.queue_entry} />
            </div>
          ) : newToken ? (
            <div className="space-y-4">
              <BookingToken entry={newToken} onContinue={() => setNewToken(null)} />
              {activeQueue && activeQueue.queue_entry?.status !== 'COMPLETED' && (
                <LiveQueueScreen queueStatus={activeQueue} onRefresh={loadActiveQueue} />
              )}
            </div>
          ) : activeQueue && activeQueue.queue_entry?.status !== 'COMPLETED' ? (
            <div className="space-y-4">
              <LiveQueueScreen queueStatus={activeQueue} onRefresh={loadActiveQueue} />
              {activeQueue.queue_entry.status === 'PROCESSING' && (
                <ProcurementStatus queueEntry={activeQueue.queue_entry} />
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10">
                <Ticket className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 font-display">{t('token.no_active_booking')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">{t('token.no_active_booking_desc')}</p>
              <button onClick={() => setTab('centres')} className="btn-primary cursor-pointer font-bold">{t('token.browse_centres')}</button>
            </div>
          )
        )}
        {tab === 'history' && <FarmerHistory />}
      </main>

      {/* Floating Krishi Sahayak AI Assistant Button — multilingual, wide, animated */}
      <button
        type="button"
        id="btn-open-krishi-ai"
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-20 sm:bottom-7 right-4 sm:right-7 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-emerald-900 text-white shadow-xl shadow-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        title="Krishi AI Sahayak"
      >
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
          <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
          {/* Double pulse ring */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-emerald-950 animate-ping opacity-75" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-emerald-950" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold font-display text-white leading-tight flex items-center gap-1.5">
            {language === 'bn' ? 'কৃষি সহায়ক' : language === 'hi' ? 'कृषि सहायक' : 'Krishi AI'}
            <span className="text-[9px] font-extrabold px-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
              AI
            </span>
          </span>
          <span className="text-[10px] text-emerald-300 font-medium leading-tight">
            {language === 'bn' ? '২৪x৭ প্রশ্ন করুন' : language === 'hi' ? '24x7 सहायता' : '24/7 Advisor'}
          </span>
        </div>
      </button>

      {/* Bottom Navigation */}
      <nav className="bg-white/95 dark:bg-[#0a101d]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-4 py-2 safe-bottom sticky bottom-0 z-20 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-2xl transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                  {id === 'queue' && activeQueue && (
                    activeQueue.queue_entry?.status !== 'COMPLETED' ||
                    sessionCompletedEntryId === activeQueue.queue_entry?.id
                  ) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0a101d] animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] tracking-tight">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Slot Booking Modal */}
      {showBooking && selectedCentre && (
        <SlotBookingModal
          centre={selectedCentre}
          activeQueueToken={activeQueue}
          initialCrop={prefilledBooking.crop}
          initialQty={prefilledBooking.qty}
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

      {/* Krishi AI Chatbot Modal */}
      <KrishiChatbotModal
        user={user}
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        onOpenBooking={handleVoiceBooking}
      />
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { useNotifications } from '../NotificationContext'
import { useTranslation } from '../i18n'
import { Wheat, MapPin, Clock, Users, Star, ChevronRight, History, Bell, LogOut, X, CheckCircle, Ticket, User, ChevronDown, Settings, Scale, Award } from 'lucide-react'
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
        className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer shrink-0 shadow-xs active:scale-98"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/20">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0 pr-0.5">
          <span className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[130px]">
            {user.full_name}{!user.full_name?.includes('(You)') && user.role === 'farmer' ? ' (You)' : ''}
          </span>
          <span className="text-[10px] text-emerald-200/90 font-medium leading-tight truncate max-w-[130px]">
            {user.village ? `${user.village}, ${user.district || 'Howrah'}` : (user.district || 'West Bengal')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-200/80 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
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
            <button
              onClick={() => { onOpenMsp(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
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
          duration: 4500
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
          duration: 3500
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
            duration: 4000
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-950 via-[#0b3d27] to-emerald-950 text-white px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30 shadow-md w-full relative">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
            {/* Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white/20 shrink-0">
                <Wheat className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight font-display text-white whitespace-nowrap">
                    {t('common.app_name')}
                  </h1>
                  <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs whitespace-nowrap">
                    GOV PORTAL
                  </span>
                </div>
                <p className="hidden md:block text-emerald-200/80 text-xs font-medium truncate">
                  {t('common.app_tagline')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <LanguageSwitcher dark={true} />

              {/* Agmark Standards pill button (from Photo 3) */}
              <button
                onClick={() => setShowMspModal(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-xs"
                title="Agmark Assaying Standards"
              >
                <Award className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Agmark Standards</span>
              </button>

              {/* Govt MSP Rates pill button */}
              <button
                onClick={() => setShowMspModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold border border-amber-400/40 transition-all cursor-pointer shadow-xs shrink-0"
                title={t('msp.title')}
              >
                <Scale className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">{t('nav.govt_msp_rates')}</span>
                <span className="sm:hidden font-bold">MSP</span>
              </button>

              <ThemeToggle dark={true} />
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

        {/* Tricolor Government Micro-Stripe at bottom */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-white/80 to-emerald-400 absolute bottom-0 left-0 opacity-80" />
      </header>

      {/* Active queue banner */}
      {activeQueue && activeQueue.queue_entry.status !== 'COMPLETED' && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-100/60 dark:from-emerald-950 dark:via-emerald-900 dark:to-slate-950 text-slate-900 dark:text-white px-4 py-3 border-b border-emerald-200/80 dark:border-emerald-500/20 shadow-xs backdrop-blur-xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20 dark:ring-emerald-400/20 shrink-0" />
              <div>
                <span className="font-mono font-bold text-base sm:text-lg tracking-wide text-emerald-900 dark:text-white bg-white/90 dark:bg-white/10 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-white/10 shadow-2xs">{activeQueue.queue_entry.token}</span>
                <span className="text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm ml-2.5 font-medium">
                  · {formatNumber(activeQueue.farmers_ahead)} {t('queue.farmers_ahead')} · ~{formatNumber(Math.round(activeQueue.estimated_wait_minutes))} {t('common.min')}
                </span>
              </div>
            </div>
            <button onClick={() => setTab('queue')} className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-white/15 transition-all flex items-center gap-1 cursor-pointer shadow-2xs">
              {t('common.view')} <ChevronRight className="w-3.5 h-3.5" />
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
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
            <div className="text-center py-16 px-6 bg-white/80 dark:bg-[#0a101d]/80 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">{t('token.no_active_booking')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">{t('token.no_active_booking_desc')}</p>
              <button onClick={() => setTab('centres')} className="btn-primary rounded-full px-6 py-3 cursor-pointer shadow-md shadow-emerald-700/20">{t('token.browse_centres')}</button>
            </div>
          )
        )}
        {tab === 'history' && <FarmerHistory />}
      </main>

      {/* Bottom Nav */}
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
                  <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                  {id === 'queue' && activeQueue && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] tracking-tight">{label}</span>
              </button>
            )
          })}
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

import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useTranslation } from '../i18n'
import { Wheat, Eye, EyeOff, ArrowRight, Phone, User, ShieldCheck, Sparkles, KeyRound, RefreshCw, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'

export default function AuthPage() {
  const { login, loginWithOtp, register } = useAuth()
  const { t, language } = useTranslation()
  const [mode, setMode] = useState('otp') // 'otp' | 'password' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    mobile: '9876543210',
    village: '',
    district: '',
    farmer_id: '',
    password: 'password123'
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!form.mobile || !form.password) {
      toast.error(t('toasts.enter_mobile_password'))
      return
    }
    setLoading(true)
    try {
      await login(form.mobile, form.password, rememberMe)
      toast.success(t('toasts.welcome_back'))
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!form.mobile || form.mobile.length < 10) {
      toast.error(t('toasts.enter_valid_mobile'))
      return
    }
    setOtpSending(true)
    try {
      const res = await api.sendOtp(form.mobile, language)
      setOtpSent(true)
      if (res.sms_provider === 'TWILIO_GSM_REAL') {
        toast.success(`📱 Real SMS delivered to +91 ${form.mobile}!`, { duration: 6000 })
      } else if (res.sms_provider === 'FAST2SMS_REAL') {
        toast.success(`📱 Real SMS delivered to +91 ${form.mobile} in ${language.toUpperCase()}!`, { duration: 6000 })
      } else {
        toast.success(t('toasts.demo_otp_sent', { otp: res.otp || '123456' }), { duration: 6000 })
      }
      if (res.otp) {
        setOtpCode(res.otp)
      }
    } catch (err) {
      toast.error(err.message || t('toasts.failed_send_otp'))
    } finally {
      setOtpSending(false)
    }
  }

  const handleOtpLogin = async (e) => {
    e.preventDefault()
    if (!form.mobile || form.mobile.length < 10) {
      toast.error(t('toasts.enter_valid_mobile'))
      return
    }
    if (!otpCode) {
      toast.error(t('toasts.enter_otp'))
      return
    }
    setLoading(true)
    try {
      await loginWithOtp(form.mobile, otpCode, rememberMe)
      toast.success(t('toasts.otp_verified'))
    } catch (err) {
      toast.error(err.message || t('toasts.invalid_otp'))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.mobile || !form.village || !form.district || !form.password) {
      toast.error(t('toasts.fill_all_fields'))
      return
    }
    setLoading(true)
    try {
      await register(form, rememberMe)
      toast.success(t('toasts.registration_success'))
    } catch (err) {
      toast.error(err.message || t('toasts.registration_failed'))
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (role) => {
    if (role === 'farmer-1') {
      update('mobile', '9876543210')
      update('password', 'demo123')
      setOtpCode('123456')
      setOtpSent(true)
      toast.success(t('toasts.loaded_demo_farmer', { name: 'Ramesh Kumar' }))
    } else if (role === 'farmer-2') {
      update('mobile', '9000000002')
      update('password', 'demo1234')
      setOtpCode('123456')
      setOtpSent(true)
      toast.success(t('toasts.loaded_demo_farmer', { name: 'Suresh Ghosh' }))
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Left panel - Gov Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-950 via-[#0b3d27] to-slate-950 text-white flex-col justify-between p-8 xl:p-12 relative overflow-hidden shadow-2xl border-r border-emerald-900/40">
        {/* Background ambient accents */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-16 left-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-16 right-12 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10 xl:mb-14">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm">
                <Wheat className="w-7 h-7 text-amber-300 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-display">
                  {t('common.app_name')}
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full uppercase tracking-wider">
                    {t('common.gov_portal_badge')}
                  </span>
                </h1>
                <p className="text-emerald-200/90 text-xs font-medium tracking-wide">{t('common.app_tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher dark={true} />
            </div>
          </div>

          <div className="space-y-6 xl:space-y-8 max-w-lg">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold mb-3 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('auth.hero_badge')}</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight text-white mb-3 font-display">
                {t('auth.hero_title_1')} <br />
                <span className="text-amber-300">{t('auth.hero_title_2')}</span>
              </h2>
              <p className="text-emerald-100/90 text-sm xl:text-base leading-relaxed">
                {t('auth.hero_desc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { icon: '📍', label: t('auth.feature_geo'), desc: t('auth.feature_geo_desc') },
                { icon: '🎫', label: t('auth.feature_token'), desc: t('auth.feature_token_desc') },
                { icon: '🔬', label: t('auth.feature_assay'), desc: t('auth.feature_assay_desc') },
                { icon: '⚡', label: t('auth.feature_dbt'), desc: t('auth.feature_dbt_desc') },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-start gap-2.5">
                  <span className="text-xl xl:text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-xs xl:text-sm text-white font-display">{item.label}</p>
                    <p className="text-[11px] text-emerald-200/90 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-5 flex items-center justify-between text-xs text-emerald-300/80">
          <div>
            <p className="font-bold text-white">{t('common.gov_title')}</p>
            <p className="text-emerald-300 text-[11px]">{t('common.gov_dept')}</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{t('common.ssl_secured')}</span>
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-slate-50 dark:bg-[#060a12] min-h-screen lg:min-h-0">
        <div className="w-full max-w-md my-auto">
          {/* Mobile top branding & Language Switcher */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <Wheat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white leading-tight">{t('common.app_name')}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{t('common.app_tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a101d] rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 p-5 sm:p-8 space-y-5 transition-all">
            {/* Tab segment switcher */}
            <div className="flex bg-slate-100/90 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/60 dark:border-white/10">
              <button
                id="tab-otp"
                type="button"
                onClick={() => setMode('otp')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'otp'
                    ? 'bg-white dark:bg-[#0e1626] text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200/50 dark:border-white/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{t('auth.tab_otp')}</span>
              </button>
              <button
                id="tab-login"
                type="button"
                onClick={() => setMode('password')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'password'
                    ? 'bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-white/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{t('auth.tab_password')}</span>
              </button>
              <button
                id="tab-register"
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-white/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{t('auth.tab_register')}</span>
              </button>
            </div>

            {/* OTP Authentication Mode */}
            {mode === 'otp' && (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="otp-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('auth.mobile_label')}
                    </label>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                      {t('auth.demo_otp_hint')}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="otp-mobile"
                      type="tel"
                      placeholder={t('auth.mobile_placeholder')}
                      value={form.mobile}
                      onChange={e => update('mobile', e.target.value)}
                      className="w-full !pl-10 !pr-24 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="absolute right-2 px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 z-10 cursor-pointer"
                    >
                      {otpSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : t('auth.get_otp')}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="otp-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('auth.otp_code_label')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpCode('123456')}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> {t('auth.auto_fill_otp')}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="otp-code"
                      type="text"
                      maxLength={6}
                      placeholder={t('auth.otp_code_placeholder')}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      className="w-full !pl-10 !pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent tracking-widest font-mono text-sm font-bold transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <p className="leading-relaxed">
                    <strong>{t('auth.demo_hackathon_mode')}</strong> {t('auth.demo_hackathon_desc')}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    id="remember-otp"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remember-otp" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                    {t('auth.remember_me')}
                  </label>
                </div>

                <button
                  id="btn-otp-login"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm cursor-pointer font-bold"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{t('auth.verify_and_enter')} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Password Login Mode */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auth.mobile_label')}
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="login-mobile"
                      type="tel"
                      placeholder={t('auth.mobile_password_placeholder')}
                      value={form.mobile}
                      onChange={e => update('mobile', e.target.value)}
                      className="w-full !pl-10 !pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auth.password_label')}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder={t('auth.password_placeholder')}
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="w-full !pl-4 !pr-11 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer z-10"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    id="remember-pass"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remember-pass" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                    {t('auth.remember_me')}
                  </label>
                </div>

                <button
                  id="btn-password-login"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm cursor-pointer font-bold"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{t('auth.sign_in_portal')} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Registration Mode */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {t('auth.full_name')} *
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="reg-name"
                      type="text"
                      placeholder={t('auth.name_placeholder')}
                      value={form.full_name}
                      onChange={e => update('full_name', e.target.value)}
                      className="w-full !pl-10 !pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {t('auth.mobile_label')} *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="reg-mobile"
                      type="tel"
                      placeholder={t('auth.mobile_placeholder')}
                      value={form.mobile}
                      onChange={e => update('mobile', e.target.value)}
                      className="w-full !pl-10 !pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="reg-village" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      {t('auth.village')} *
                    </label>
                    <input
                      id="reg-village"
                      type="text"
                      placeholder={t('auth.village_placeholder')}
                      value={form.village}
                      onChange={e => update('village', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-district" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      {t('auth.district')} *
                    </label>
                    <input
                      id="reg-district"
                      type="text"
                      placeholder={t('auth.district_placeholder')}
                      value={form.district}
                      onChange={e => update('district', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {t('auth.set_password')} *
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    placeholder={t('auth.min_chars')}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1626] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all shadow-2xs"
                    required
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    id="remember-reg"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remember-reg" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                    {t('auth.remember_me')}
                  </label>
                </div>

                <button
                  id="btn-register"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm cursor-pointer font-bold"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{t('auth.complete_registration')} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Credentials Footer for Evaluation */}
            <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('auth.quick_eval_login')}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3" /> {t('auth.one_click_fill')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-demo-farmer-1"
                  onClick={() => fillDemoCredentials('farmer-1')}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-500/40 text-left transition-all text-xs group cursor-pointer"
                >
                  <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Ramesh Kumar</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">9876543210 · Amta</p>
                </button>
                <button
                  type="button"
                  id="btn-demo-farmer-2"
                  onClick={() => fillDemoCredentials('farmer-2')}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-500/40 text-left transition-all text-xs group cursor-pointer"
                >
                  <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Suresh Ghosh</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">9000000002 · Singur</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

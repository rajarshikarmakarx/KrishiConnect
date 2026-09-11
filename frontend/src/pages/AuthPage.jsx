import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useTranslation } from '../i18n'
import { Wheat, Eye, EyeOff, ArrowRight, Phone, User, ShieldCheck, Sparkles, KeyRound, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AuthPage() {
  const { login, loginWithOtp, register } = useAuth()
  const { t } = useTranslation()
  const [mode, setMode] = useState('otp') // 'otp' | 'password' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)

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
      await login(form.mobile, form.password)
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
      const res = await api.sendOtp(form.mobile)
      setOtpSent(true)
      toast.success(t('toasts.demo_otp_sent', { otp: res.otp || '123456' }))
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
      await loginWithOtp(form.mobile, otpCode)
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
      await register(form)
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* Left panel - Gov Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white flex-col justify-between p-8 xl:p-12 relative overflow-hidden shadow-2xl">
        {/* Background ambient accents */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-16 left-16 w-80 h-80 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="absolute bottom-16 right-12 w-96 h-96 rounded-full bg-amber-400/25 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10 xl:mb-14">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm">
                <Wheat className="w-7 h-7 text-green-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {t('common.app_name')}
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full">
                    {t('common.gov_portal_badge')}
                  </span>
                </h1>
                <p className="text-green-300 text-xs font-medium tracking-wide">{t('common.app_tagline')}</p>
              </div>
            </div>
            <LanguageSwitcher dark={true} />
          </div>

          <div className="space-y-6 xl:space-y-8 max-w-lg">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold mb-3 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('auth.hero_badge')}</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight text-white mb-3">
                {t('auth.hero_title_1')} <br />
                <span className="text-amber-300">{t('auth.hero_title_2')}</span>
              </h2>
              <p className="text-green-100 text-sm xl:text-base leading-relaxed opacity-90">
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
                <div key={i} className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-start gap-2.5">
                  <span className="text-xl xl:text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-xs xl:text-sm text-white">{item.label}</p>
                    <p className="text-[11px] text-green-200">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-5 flex items-center justify-between text-xs text-green-300/80">
          <div>
            <p className="font-medium text-white">{t('common.gov_title')}</p>
            <p className="text-green-300 text-[11px]">{t('common.gov_dept')}</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{t('common.ssl_secured')}</span>
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-slate-50 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md my-auto">
          {/* Mobile top branding & Language Switcher */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <Wheat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{t('common.app_name')}</h1>
                <p className="text-slate-500 text-xs">{t('common.app_tagline')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-8 space-y-5">
            {/* Tab segment switcher */}
            <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60">
              <button
                id="tab-otp"
                type="button"
                onClick={() => setMode('otp')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'otp'
                    ? 'bg-white text-green-800 shadow-sm border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
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
                    <label htmlFor="otp-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t('auth.mobile_label')}
                    </label>
                    <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
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
                      className="w-full !pl-10 !pr-24 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="absolute right-2 px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors border border-green-200 flex items-center gap-1 z-10 cursor-pointer"
                    >
                      {otpSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : t('auth.get_otp')}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="otp-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t('auth.otp_code_label')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpCode('123456')}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
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
                      className="w-full !pl-10 !pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent tracking-widest font-mono text-sm font-bold transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <p className="leading-relaxed">
                    <strong>{t('auth.demo_hackathon_mode')}</strong> {t('auth.demo_hackathon_desc')}
                  </p>
                </div>

                <button
                  id="btn-otp-login"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm cursor-pointer"
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
                  <label htmlFor="login-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className="w-full !pl-10 !pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t('auth.password_label')}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder={t('auth.password_placeholder')}
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="w-full !pl-4 !pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer z-10"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{t('auth.sign_in_with_password')} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Farmer Registration Mode */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('auth.full_name_label')}</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="reg-name"
                      type="text"
                      placeholder={t('auth.full_name_placeholder')}
                      value={form.full_name}
                      onChange={e => update('full_name', e.target.value)}
                      className="w-full !pl-10 !pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('auth.mobile_label')} *</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="reg-mobile"
                      type="tel"
                      placeholder={t('auth.mobile_placeholder')}
                      value={form.mobile}
                      onChange={e => update('mobile', e.target.value)}
                      className="w-full !pl-10 !pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="reg-village" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('auth.village_label')}</label>
                    <input
                      id="reg-village"
                      type="text"
                      placeholder={t('auth.village_placeholder')}
                      value={form.village}
                      onChange={e => update('village', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-district" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('auth.district_label')}</label>
                    <input
                      id="reg-district"
                      type="text"
                      placeholder={t('auth.district_placeholder')}
                      value={form.district}
                      onChange={e => update('district', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-farmer-id" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('auth.farmer_id_label')} <span className="text-slate-400 font-normal lowercase">{t('auth.optional')}</span>
                  </label>
                  <input
                    id="reg-farmer-id"
                    type="text"
                    placeholder="WB-2024-XXXXX"
                    value={form.farmer_id}
                    onChange={e => update('farmer_id', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('auth.register_password_label')}</label>
                  <div className="relative flex items-center">
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder={t('auth.register_password_placeholder')}
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="w-full !pl-4 !pr-11 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer z-10"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-register"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm mt-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{t('auth.register_btn')} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Fill Buttons */}
            <div className="border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('auth.demo_farmers_header')}</span>
                <span className="text-[10px] text-slate-400 font-mono">OTP: 123456</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('farmer-1')}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/60 text-left transition-all text-xs flex items-center gap-2.5 group cursor-pointer"
                >
                  <span className="text-base shrink-0">🌾</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-green-800 truncate">{t('auth.demo_farmer_1_name')}</p>
                    <p className="text-[10px] text-slate-400 font-mono">9876543210</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('farmer-2')}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/60 text-left transition-all text-xs flex items-center gap-2.5 group cursor-pointer"
                >
                  <span className="text-base shrink-0">🚜</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-green-800 truncate">{t('auth.demo_farmer_2_name')}</p>
                    <p className="text-[10px] text-slate-400 font-mono">9000000002</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Link to Officer/Admin portal */}
            <div className="text-center pt-2 border-t border-slate-100">
              <a
                href="/admin"
                className="text-xs text-slate-500 hover:text-green-700 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <span>{t('auth.mandi_officer_prompt')}</span>
                <span className="text-green-600 font-semibold underline">{t('auth.official_portal_link')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n'
import { useTheme } from '../ThemeContext'
import {
  Wheat, MapPin, Ticket, Scale, Zap, Shield, ArrowRight,
  HelpCircle, Users, User, Building2, IndianRupee, CheckCircle2,
  Menu, X, ChevronRight, Sprout, Globe, BarChart3, Check
} from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'

const NAV_LINKS = [
  { key: 'landing.nav_home', href: '#home', default: 'Home' },
  { key: 'landing.nav_features', href: '#features', default: 'Features' },
  { key: 'landing.nav_how_it_works', href: '#how-it-works', default: 'How It Works' },
  { key: 'landing.nav_contact', href: '#contact', default: 'Contact' },
]

const FEATURES = [
  {
    icon: MapPin,
    titleKey: 'landing.feature_geo_title',
    descKey: 'landing.feature_geo_desc',
    color: 'emerald',
  },
  {
    icon: Ticket,
    titleKey: 'landing.feature_token_title',
    descKey: 'landing.feature_token_desc',
    color: 'blue',
  },
  {
    icon: Scale,
    titleKey: 'landing.feature_assay_title',
    descKey: 'landing.feature_assay_desc',
    color: 'amber',
  },
  {
    icon: IndianRupee,
    titleKey: 'landing.feature_dbt_title',
    descKey: 'landing.feature_dbt_desc',
    color: 'emerald',
  },
  {
    icon: Shield,
    titleKey: 'landing.feature_secure_title',
    descKey: 'landing.feature_secure_desc',
    color: 'slate',
  },
]

const STATS = [
  { value: '5L+', labelKey: 'landing.stat_farmers', icon: Users },
  { value: '200+', labelKey: 'landing.stat_mandis', icon: Building2 },
  { value: '₹1,200Cr+', labelKey: 'landing.stat_dbt', icon: IndianRupee },
  { value: '99.8%', labelKey: 'landing.stat_success', icon: CheckCircle2 },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    titleKey: 'landing.step_1_title',
    descKey: 'landing.step_1_desc',
    icon: Sprout,
  },
  {
    step: '02',
    titleKey: 'landing.step_2_title',
    descKey: 'landing.step_2_desc',
    icon: Ticket,
  },
  {
    step: '03',
    titleKey: 'landing.step_3_title',
    descKey: 'landing.step_3_desc',
    icon: Scale,
  },
  {
    step: '04',
    titleKey: 'landing.step_4_title',
    descKey: 'landing.step_4_desc',
    icon: IndianRupee,
  },
]

const ICON_BG = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  slate: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
}

export default function LandingPage() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Track active section
      const sections = ['home', 'features', 'how-it-works', 'contact']
      for (const id of sections.reverse()) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#060a12] text-slate-900 dark:text-slate-100 font-sans">
      {/* ========================= NAVBAR ========================= */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} id="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <Wheat className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display leading-tight">
                  KrishiConnect
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-none">
                  {t('common.app_tagline') || 'Smart Agricultural Procurement'}
                </p>
              </div>
              <h1 className="sm:hidden text-lg font-bold text-slate-900 dark:text-white font-display">
                KrishiConnect
              </h1>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${activeSection === link.href.replace('#', '') ? 'active' : ''}`}
                >
                  {t(link.key) || link.default}
                </a>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <ThemeToggle />
              <Link
                to="/login"
                id="btn-nav-login"
                className="inline-flex items-center gap-2 bg-[#065f46] hover:bg-[#044e3a] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <User className="w-4 h-4" />
                <span>{t('landing.login') || 'Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-slate-100 dark:border-white/10 mt-1 pt-3 animate-fade-in">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    {t(link.key) || link.default}
                  </a>
                ))}
              </div>
              <div className="mt-3 px-4 sm:hidden">
                <LanguageSwitcher />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ========================= HERO ========================= */}
      <section id="home" className="hero-gradient pt-24 lg:pt-32 pb-16 lg:pb-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — Text Content */}
            <div className="relative z-10 animate-fade-up">
              <div className="badge-pill mb-5">
                <Sprout className="w-3.5 h-3.5" />
                <span>{t('landing.hero_badge') || 'Next-Gen MSP Assurance & Real-Time Queueing'}</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white font-display mb-5">
                {t('landing.hero_title_1') || 'Digital Mandi Intake'}{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('landing.hero_title_2') || 'Empowering Every Farmer'}
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
                {t('landing.hero_desc') || 'Transparent moisture assaying, automated Agmark grading, real-time counter routing, and instant Direct Benefit Transfer (DBT) payout — all in one platform.'}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="btn-cta-primary">
                  {t('landing.get_started') || 'Get Started'}
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
                <a href="#how-it-works" className="btn-cta-secondary">
                  <HelpCircle className="w-4.5 h-4.5" />
                  {t('landing.how_it_works_btn') || 'How It Works?'}
                </a>
              </div>
            </div>

            {/* Right — Hero Illustration with verified pill badges */}
            <div className="relative animate-fade-up animate-fade-up-delay-2 hidden lg:block">
              <div className="relative animate-float">
                <div className="p-2 rounded-[2.5rem] bg-gradient-to-b from-emerald-100/60 to-emerald-50/20 dark:from-emerald-500/10 dark:to-transparent shadow-2xl border border-emerald-200/50 dark:border-white/5">
                  <img
                    src="/hero-illustration.jpg"
                    alt="KrishiConnect Digital Mandi Procurement Centre"
                    className="w-full rounded-[2rem] shadow-lg"
                    loading="eager"
                  />
                </div>

                {/* Floating badge: Moisture Assaying */}
                <div className="absolute -left-8 top-1/4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-fade-up animate-fade-up-delay-3 min-w-[200px]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Scale className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{t('landing.feature_assay_title') || 'Moisture Assaying'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('landing.realtime_analysis') || 'Real-time Analysis'}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Floating badge: Agmark Grading */}
                <div className="absolute -right-6 top-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-fade-up animate-fade-up-delay-4 min-w-[200px]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sprout className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{t('nav.govt_quality_standards') || 'Agmark Grading'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('landing.automated_accurate') || 'Automated & Accurate'}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Floating badge: Smart Queueing */}
                <div className="absolute left-6 -bottom-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-fade-up animate-fade-up-delay-5 min-w-[190px]">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Ticket className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{t('landing.feature_token_title') || 'Smart Queueing'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('landing.fair_transparent') || 'Fair & Transparent'}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Floating badge: DBT Payout */}
                <div className="absolute -right-8 bottom-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-fade-up animate-fade-up-delay-4 min-w-[190px]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <IndianRupee className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{t('landing.feature_dbt_title') || 'DBT Payout'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('landing.instant_transfers') || 'Instant Transfers'}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile hero image */}
            <div className="lg:hidden">
              <img
                src="/hero-illustration.jpg"
                alt="KrishiConnect Digital Mandi Procurement Centre"
                className="w-full rounded-2xl shadow-lg border border-slate-200/50 dark:border-white/5"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================= FEATURES ========================= */}
      <section id="features" className="py-16 lg:py-24 bg-white dark:bg-[#060a12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-12 lg:mb-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                — {t('landing.features_subtitle') || 'Key Features'}
              </p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                {t('landing.features_title') || 'Everything You Need, In One Place'}
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md italic">
              {t('landing.features_tagline') || 'Smarter processes. Fairer markets. Stronger farmers.'}
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.titleKey}
                  className={`feature-card animate-fade-up animate-fade-up-delay-${i + 1}`}
                >
                  <div className={`w-11 h-11 rounded-xl ${ICON_BG[feature.color]} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {t(feature.titleKey)}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {t(feature.descKey)}
                  </p>
                  <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all">
                    {t('landing.learn_more') || 'Learn more'}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================= HOW IT WORKS ========================= */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-slate-50 dark:bg-[#0a101d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              — {t('landing.how_it_works_subtitle') || 'How It Works'}
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
              {t('landing.how_it_works_title') || 'From Farm to Fair Price in 4 Steps'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-lg mx-auto">
              {t('landing.how_it_works_desc') || 'A streamlined digital workflow that eliminates middlemen and ensures farmers get paid at government MSP rates.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.step}
                  className={`relative bg-white dark:bg-[#0d1527] rounded-2xl p-6 border border-slate-200 dark:border-white/8 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-up animate-fade-up-delay-${i + 1}`}
                >
                  {/* Step number */}
                  <div className="text-5xl font-extrabold text-slate-100 dark:text-white/5 absolute top-4 right-5 font-display select-none">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                      {t(item.titleKey)}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t(item.descKey)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================= STATS BAR ========================= */}
      <section className="stats-bar py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 items-center">
            {STATS.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white font-display">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{t(stat.labelKey)}</p>
                  </div>
                </div>
              )
            })}
            <div className="col-span-2 lg:col-span-1 text-right">
              <div className="inline-block relative">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 italic tracking-tight font-serif">
                  {t('landing.quote') || 'Better Markets, Brighter Futures.'}
                </p>
                <svg className="w-full h-2.5 text-emerald-600/70 -mt-0.5" viewBox="0 0 220 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7C50 2 150 2 218 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= CONTACT / CTA ========================= */}
      <section id="contact" className="py-16 lg:py-24 bg-white dark:bg-[#060a12]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            — {t('landing.cta_subtitle') || 'Get Started Today'}
          </p>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display mb-5">
            {t('landing.cta_title') || 'Ready to Transform Your Procurement Journey?'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            {t('landing.cta_desc') || "Whether you're a farmer looking for the nearest MSP centre, or a government officer managing procurement operations — KrishiConnect has you covered."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login" className="btn-cta-primary">
              {t('landing.farmer_portal') || 'Farmer Portal'}
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link to="/admin-login" className="btn-cta-secondary">
              <Building2 className="w-4.5 h-4.5" />
              {t('landing.officer_portal') || 'Officer / Admin Portal'}
            </Link>
          </div>
        </div>
      </section>

      {/* ========================= FOOTER ========================= */}
      <footer className="bg-slate-900 dark:bg-[#020617] text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Wheat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white font-display">KrishiConnect</h4>
                  <p className="text-[10px] text-slate-400 tracking-wide">{t('common.app_tagline') || 'Smart Agricultural Procurement'}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                {t('landing.footer_desc') || 'An initiative by the Department of Agricultural Marketing, Government of India. Empowering farmers with transparent, digital procurement at Minimum Support Prices.'}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-sm font-semibold text-white mb-4">{t('landing.quick_links') || 'Quick Links'}</h5>
              <div className="space-y-2.5">
                {NAV_LINKS.filter(l => l.href !== '#contact').map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {t(link.key) || link.default}
                  </a>
                ))}
              </div>
            </div>

            {/* Portals */}
            <div>
              <h5 className="text-sm font-semibold text-white mb-4">{t('landing.portals') || 'Portals'}</h5>
              <div className="space-y-2.5">
                <Link to="/login" className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  {t('landing.farmer_login') || 'Farmer Login'}
                </Link>
                <Link to="/admin-login" className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  {t('landing.officer_login') || 'Officer Login'}
                </Link>
                <a href="#" className="block text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  {t('landing.help_support') || 'Help & Support'}
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>{t('landing.copyright', { year: new Date().getFullYear() }) || `© ${new Date().getFullYear()} KrishiConnect. Department of Agricultural Marketing, Government of India.`}</p>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('landing.ssl_secured_footer') || 'SSL Secured · NIC Infrastructure'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
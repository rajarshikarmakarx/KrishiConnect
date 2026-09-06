import { useState, useEffect } from 'react'
import { User, Phone, MapPin, Save, Trash2, AlertCircle, X, Building2 } from 'lucide-react'
import api from '../../api'
import { useAuth } from '../../AuthContext'
import { useTranslation } from '../../i18n'

const DEFAULT_DISTRICTS = [
  'Howrah',
  'Hooghly',
  'Purba Bardhaman',
  'Nadia',
  'North 24 Parganas',
  'South 24 Parganas'
]

const FALLBACK_VILLAGES = {
  'Howrah': ['Haripur', 'Bagnan', 'Uluberia', 'Amta', 'Shyampur', 'Domjur', 'Panchla', 'Jagatballavpur', 'Sankrail', 'Bally'],
  'Hooghly': ['Singur', 'Tarakeswar', 'Pandua', 'Polba', 'Arambagh', 'Chinsurah', 'Chandannagar', 'Serampore', 'Haripal', 'Balagarh'],
  'Purba Bardhaman': ['Memari', 'Kalna', 'Katwa', 'Galsi', 'Jamalpur', 'Raina', 'Bardhaman Sadar', 'Monteswar', 'Bhatar'],
  'Nadia': ['Krishnanagar', 'Ranaghat', 'Shantipur', 'Chakdaha', 'Nakashipara', 'Tehatta', 'Kalyani', 'Chapra', 'Karimpur'],
  'North 24 Parganas': ['Barasat', 'Basirhat', 'Habra', 'Bongaon', 'Deganga', 'Amdanga', 'Gaighata', 'Swarupnagar', 'Baduria'],
  'South 24 Parganas': ['Baruipur', 'Diamond Harbour', 'Canning', 'Kakdwip', 'Joynagar', 'Gosaba', 'Sonarpur', 'Amtala', 'Kulpi']
}

export default function ProfileEdit({ onClose, onProfileUpdated }) {
  const { user, setUser, logout } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    mobile: user?.mobile || '',
    district: user?.district || 'Howrah',
    village: user?.village || 'Haripur'
  })
  const [districts, setDistricts] = useState(DEFAULT_DISTRICTS)
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch districts on mount
  useEffect(() => {
    async function loadDistricts() {
      try {
        const dList = await api.getDistricts()
        if (Array.isArray(dList) && dList.length > 0) {
          setDistricts(dList)
        }
      } catch (err) {
        setDistricts(DEFAULT_DISTRICTS)
      }
    }
    loadDistricts()
  }, [])

  // Update village options whenever district changes
  useEffect(() => {
    async function loadVillages() {
      if (!formData.district) return
      try {
        const vData = await api.getVillages(formData.district)
        if (Array.isArray(vData) && vData.length > 0) {
          const names = vData.map(v => typeof v === 'string' ? v : v.village)
          setVillages(names)
          // If current village not in new district's village list, pick first
          if (!names.includes(formData.village)) {
            setFormData(prev => ({ ...prev, village: names[0] || '' }))
          }
          return
        }
      } catch (e) {}

      // Fallback if API unavailable
      const fallbackList = FALLBACK_VILLAGES[formData.district] || []
      setVillages(fallbackList)
      if (fallbackList.length > 0 && !fallbackList.includes(formData.village)) {
        setFormData(prev => ({ ...prev, village: fallbackList[0] }))
      }
    }
    loadVillages()
  }, [formData.district])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updated = await api.updateProfile(formData)
      const mergedUser = { ...user, ...updated }
      setUser(mergedUser)
      localStorage.setItem('krishi_user', JSON.stringify(mergedUser))
      setSuccess(true)
      if (onProfileUpdated) {
        onProfileUpdated(mergedUser)
      }
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      await api.deleteProfile()
      logout()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('profile.title')}</h2>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <div className="bg-green-100 rounded-full p-1">
                <Save className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-green-700 font-medium">{t('profile.success')}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('profile.full_name')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  placeholder={t('profile.name_placeholder')}
                  required
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('profile.mobile')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  placeholder={t('profile.mobile_placeholder')}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            {/* District Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('profile.district')}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white cursor-pointer"
                  required
                >
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Village / Block Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('profile.village')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                {villages.length > 0 ? (
                  <select
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white cursor-pointer"
                    required
                  >
                    {villages.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                    placeholder={t('profile.village_placeholder')}
                    required
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {t('profile.village_hint')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                {loading ? t('profile.saving') : t('profile.save_btn')}
              </button>
            </div>
          </form>

          {/* Delete Account Section */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-red-600 hover:text-red-700 font-medium text-xs py-1.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('profile.delete_account')}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-900">{t('profile.delete_confirm_title')}</p>
                    <p className="text-[11px] text-red-700">{t('profile.delete_confirm_desc')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? t('profile.deleting') : t('profile.confirm_delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { MapPin, Clock, Users, Building2, ChevronRight, Star, TrendingDown, Sparkles, Navigation, AlertTriangle, Info, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useAuth } from '../../AuthContext'
import MandiRouteMap from './MandiRouteMap'

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const map = { OPEN: 'bg-green-100 text-green-700', CLOSED: 'bg-red-100 text-red-700', FULL: 'bg-orange-100 text-orange-700' }
  const labelMap = {
    OPEN: t('common.open'),
    CLOSED: t('common.closed'),
    FULL: t('common.full')
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.OPEN}`}>{labelMap[status] || status}</span>
}

function CentreCard({ centre, onSelect, onPreviewRoute, isRecommended, isLongDistance }) {
  const { t, translateCentreName, translateLocation, translateReason, formatNumber } = useTranslation()
  const eta = Math.round(centre.estimated_wait_minutes)
  const roundtripTravelMins = Math.round(centre.distance_km * 2 * 3.0)
  const totalDoorToDoor = roundtripTravelMins + eta

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm card-hover overflow-hidden transition-all ${
      isRecommended && !isLongDistance
        ? 'border-emerald-500/50 dark:border-emerald-500/50 ring-2 ring-emerald-500/10 shadow-md'
        : isLongDistance
        ? 'border-amber-200 dark:border-amber-500/30 hover:border-amber-300'
        : 'border-slate-100 dark:border-slate-800'
    }`}>
      {isRecommended && !isLongDistance && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-4 py-2 flex items-center gap-2 text-xs sm:text-sm font-bold border-b border-emerald-100 dark:border-emerald-500/20">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
          <span>{t('centres.smart_pick_badge')}</span>
          {centre.recommendation_reasons?.length > 0 && (
            <span className="ml-auto text-emerald-800 dark:text-emerald-200 font-semibold text-xs bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {translateReason(centre.recommendation_reasons[0])}
            </span>
          )}
        </div>
      )}

      {isRecommended && isLongDistance && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 px-4 py-2 flex items-center gap-2 text-xs sm:text-sm font-bold border-b border-amber-200/80 dark:border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{t('centres.nearest_regional_badge')}</span>
          <span className="ml-auto text-amber-800 dark:text-amber-200 font-semibold text-xs bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
            {t('centres.km_away', { distance: formatNumber(centre.distance_km) })}
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 font-display">
              {translateCentreName(centre.name)}
              {isRecommended && !isLongDistance && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                  {t('common.top_match')}
                </span>
              )}
              {isLongDistance && (
                <span className="text-[10px] bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {t('common.regional')}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>{translateLocation(centre.location)}</span>
              <span className={`ml-1 font-medium ${isLongDistance ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                · {t('centres.km_away', { distance: formatNumber(centre.distance_km) })}
              </span>
            </div>
          </div>
          <StatusBadge status={centre.status} />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="text-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 transition-all">
            <div className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-slate-100">{formatNumber(centre.waiting_count)}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1 font-medium">
              <Users className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" /><span>{t('common.waiting')}</span>
            </div>
          </div>
          <div className="text-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 transition-all">
            <div className="text-xl sm:text-2xl font-black font-display text-emerald-700 dark:text-emerald-400">{formatNumber(centre.active_counters)}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1 font-medium">
              <Building2 className="w-3 h-3 shrink-0 text-emerald-500" /><span>{t('common.counters')}</span>
            </div>
          </div>
          <div className="text-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 transition-all">
            <div className="text-xl sm:text-2xl font-black font-display text-amber-600 dark:text-amber-400">~{formatNumber(eta)} {t('common.min')}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1 font-medium">
              <Clock className="w-3 h-3 shrink-0 text-amber-500" /><span>{t('common.est_wait')}</span>
            </div>
          </div>
        </div>

        {/* Door-to-door trip indicator */}
        <div className={`flex items-center justify-between text-xs px-3 py-2.5 rounded-2xl mb-4 border transition-all ${
          isLongDistance
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
            : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        }`}>
          <span className="flex items-center gap-1.5 font-semibold">
            <Navigation className={`w-3.5 h-3.5 ${isLongDistance ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
            {t('centres.door_to_door_time')}
          </span>
          <span className="font-bold">
            ~{formatNumber(totalDoorToDoor)} {t('common.min')} <span className={`font-normal ${isLongDistance ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{t('centres.door_to_door_breakdown', { travel: formatNumber(roundtripTravelMins), wait: formatNumber(eta) })}</span>
          </span>
        </div>

        {centre.recommendation_reasons?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {centre.recommendation_reasons.map((r, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 font-medium ${
                  isLongDistance
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                }`}
              >
                <TrendingDown className="w-3 h-3 shrink-0" />{translateReason(r)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => onPreviewRoute?.(centre)}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200/80 dark:border-emerald-500/30 py-2 px-3.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('map.view_route')}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('map.view_route')}</span>
          </button>
          <button
            id={`btn-select-centre-${centre.id}`}
            onClick={() => onSelect(centre)}
            disabled={centre.status !== 'OPEN' || centre.available_slots_today === 0}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 rounded-full font-bold shadow-md shadow-emerald-700/20"
          >
            {t('centres.book_slot')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CentreList({ centres, loading, onSelect, userLocation }) {
  const { user } = useAuth()
  const { t, translateLocation, formatNumber } = useTranslation()
  const [previewCentre, setPreviewCentre] = useState(null)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl" />)}
    </div>
  )

  if (!centres.length) return (
    <div className="text-center py-16 text-slate-500">{t('centres.no_centres_found')}</div>
  )

  const nearbyCentres = centres.filter(c => c.distance_km < 50.0)
  const distantCentres = centres.filter(c => c.distance_km >= 50.0)
  const hasNoNearbyCentres = nearbyCentres.length === 0

  return (
    <div className="space-y-4 animate-fade-in">
      {/* If farmer has local centres nearby */}
      {!hasNoNearbyCentres && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-emerald-900 text-sm">{t('centres.ai_routing_title')}</p>
            <p className="text-emerald-700 mt-0.5">
              {t('centres.ai_routing_desc')}
            </p>
          </div>
        </div>
      )}

      {/* If farmer is in a remote location / outside district where all centres are >= 50km */}
      {hasNoNearbyCentres && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-amber-900 text-sm">
              {t('centres.no_nearby_title')}
            </h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              {t('centres.no_nearby_desc', { location: userLocation ? ` (${translateLocation(userLocation)})` : '' })}
            </p>
          </div>
        </div>
      )}

      {/* Local / Nearby Centres Section */}
      {nearbyCentres.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-900">{t('centres.nearby_heading')}</h2>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
              {t('centres.available_count', { count: formatNumber(nearbyCentres.length) })}
            </span>
          </div>

          {nearbyCentres.map((c, i) => (
            <CentreCard
              key={c.id}
              centre={c}
              onSelect={onSelect}
              onPreviewRoute={(targetCentre) => setPreviewCentre(targetCentre)}
              isRecommended={i === 0}
              isLongDistance={false}
            />
          ))}
        </div>
      )}

      {/* Distant / Regional Centres Section */}
      {distantCentres.length > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between mb-2 pt-2">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              {hasNoNearbyCentres ? t('centres.regional_available_heading') : t('centres.regional_heading')}
            </h2>
            <span className="text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full font-medium">
              {t('centres.longer_transit')}
            </span>
          </div>

          {distantCentres.map((c, i) => (
            <CentreCard
              key={c.id}
              centre={c}
              onSelect={onSelect}
              onPreviewRoute={(targetCentre) => setPreviewCentre(targetCentre)}
              isRecommended={hasNoNearbyCentres && i === 0}
              isLongDistance={true}
            />
          ))}
        </div>
      )}

      {/* Route Preview Modal */}
      {previewCentre && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setPreviewCentre(null)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white z-20 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>{t('map.mandi_route_preview')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewCentre(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <MandiRouteMap
                centre={previewCentre}
                farmerVillage={user?.village}
                farmerDistrict={user?.district}
                defaultExpanded={true}
              />
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const c = previewCentre
                    setPreviewCentre(null)
                    onSelect(c)
                  }}
                  disabled={previewCentre.status !== 'OPEN' || previewCentre.available_slots_today === 0}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {t('centres.book_slot')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

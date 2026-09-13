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
    <div className={`bg-white dark:bg-[#0a101d] rounded-2xl border shadow-sm card-hover overflow-hidden transition-all ${
      isRecommended && !isLongDistance
        ? 'border-green-400 dark:border-emerald-500/50 ring-2 ring-green-100 dark:ring-emerald-500/10 shadow-md'
        : isLongDistance
        ? 'border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50'
        : 'border-slate-100 dark:border-white/10'
    }`}>
      {isRecommended && !isLongDistance && (
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
          <Star className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
          <span className="truncate">{t('centres.smart_pick_badge')}</span>
          {centre.recommendation_reasons?.length > 0 && (
            <span className="ml-auto text-green-200 font-normal text-xs bg-black/20 px-2 py-0.5 rounded-full shrink-0">
              {translateReason(centre.recommendation_reasons[0])}
            </span>
          )}
        </div>
      )}

      {isRecommended && isLongDistance && (
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
          <span className="truncate">{t('centres.nearest_regional_badge')}</span>
          <span className="ml-auto text-amber-100 font-normal text-xs bg-black/20 px-2 py-0.5 rounded-full shrink-0">
            {t('centres.km_away', { distance: formatNumber(centre.distance_km) })}
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 flex-wrap">
              <span className="truncate">{translateCentreName(centre.name)}</span>
              {isRecommended && !isLongDistance && (
                <span className="text-[10px] bg-green-100 dark:bg-emerald-500/20 text-green-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-md border border-green-200 dark:border-emerald-500/30 shrink-0">
                  {t('common.top_match')}
                </span>
              )}
              {isLongDistance && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  {t('common.regional')}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-0.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{translateLocation(centre.location)}</span>
              <span className={`ml-1 font-medium ${isLongDistance ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                · {t('centres.km_away', { distance: formatNumber(centre.distance_km) })}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={centre.status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">{formatNumber(centre.waiting_count)}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 shrink-0" /><span>{t('common.waiting')}</span>
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-emerald-400">{formatNumber(centre.active_counters)}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" /><span>{t('common.counters')}</span>
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100/60 dark:border-amber-500/20">
            <div className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400">~{formatNumber(eta)} {t('common.min')}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 shrink-0" /><span>{t('common.est_wait')}</span>
            </div>
          </div>
        </div>

        {/* Door-to-door trip indicator */}
        <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl mb-4 border ${
          isLongDistance ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300' : 'bg-slate-50/80 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400'
        }`}>
          <span className="flex items-center gap-1.5 font-medium">
            <Navigation className={`w-3.5 h-3.5 ${isLongDistance ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
            {t('centres.door_to_door_time')}
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            ~{formatNumber(totalDoorToDoor)} {t('common.min')} <span className={`font-normal ${isLongDistance ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>{t('centres.door_to_door_breakdown', { travel: formatNumber(roundtripTravelMins), wait: formatNumber(eta) })}</span>
          </span>
        </div>

        {centre.recommendation_reasons?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {centre.recommendation_reasons.map((r, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${
                  isLongDistance
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                    : 'bg-green-50 dark:bg-emerald-950/30 text-green-700 dark:text-emerald-300 border-green-100 dark:border-emerald-500/30'
                }`}
              >
                <TrendingDown className="w-3 h-3 shrink-0" />{translateReason(r)}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10 gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => onPreviewRoute?.(centre)}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200/80 dark:border-emerald-500/30 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 sm:flex-initial"
            title={t('map.view_route')}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('map.view_route')}</span>
          </button>
          <button
            id={`btn-select-centre-${centre.id}`}
            onClick={() => onSelect(centre)}
            disabled={centre.status !== 'OPEN' || centre.available_slots_today === 0}
            className="btn-primary py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 flex-1 sm:flex-initial font-bold"
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
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5" />)}
    </div>
  )

  if (!centres.length) return (
    <div className="text-center py-16 text-slate-500 dark:text-slate-400">{t('centres.no_centres_found')}</div>
  )

  const nearbyCentres = centres.filter(c => c.distance_km < 50.0)
  const distantCentres = centres.filter(c => c.distance_km >= 50.0)
  const hasNoNearbyCentres = nearbyCentres.length === 0

  return (
    <div className="space-y-4 animate-fade-in">
      {/* If farmer has local centres nearby */}
      {!hasNoNearbyCentres && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">{t('centres.ai_routing_title')}</p>
            <p className="text-emerald-700 dark:text-emerald-300/90 mt-0.5">
              {t('centres.ai_routing_desc')}
            </p>
          </div>
        </div>
      )}

      {/* If farmer is in a remote location / outside district where all centres are >= 50km */}
      {hasNoNearbyCentres && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              {t('centres.no_nearby_title')}
            </h3>
            <p className="text-amber-800 dark:text-amber-300 text-xs mt-1 leading-relaxed">
              {t('centres.no_nearby_desc', { location: userLocation ? ` (${translateLocation(userLocation)})` : '' })}
            </p>
          </div>
        </div>
      )}

      {/* Local / Nearby Centres Section */}
      {nearbyCentres.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('centres.nearby_heading')}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full border border-slate-200/50 dark:border-white/5">
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
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              {hasNoNearbyCentres ? t('centres.regional_available_heading') : t('centres.regional_heading')}
            </h2>
            <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-full font-medium border border-amber-200/50 dark:border-amber-500/30">
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPreviewCentre(null)} />
          <div className="relative bg-white dark:bg-[#0a101d] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up border border-slate-100 dark:border-white/10">
            <div className="sticky top-0 bg-white dark:bg-[#0a101d] z-20 px-5 py-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('map.mandi_route_preview')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewCentre(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold"
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

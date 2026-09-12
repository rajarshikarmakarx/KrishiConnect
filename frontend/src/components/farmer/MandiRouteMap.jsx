import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, MapPin, Compass, Maximize2, Minimize2, ExternalLink, Sparkles, AlertCircle, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Home, Wheat, Tractor, Truck, Bike, Radio } from 'lucide-react'
import { useTranslation } from '../../i18n'
import {
  findVillageCoordinates,
  fetchRoadRoute,
  calculateTransitEstimates,
  getGoogleMapsNavigationUrl,
  calculateHaversineDistance,
  generateCurvedPolyline
} from '../../utils/geoUtils'

// Helper component to auto-fit map viewport to markers and handle container resizing
function MapBoundsSync({ origin, destination, isExpanded }) {
  const map = useMap()

  useEffect(() => {
    if (!origin || !destination) return

    const bounds = L.latLngBounds([origin, destination])
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 13,
      animate: true,
    })

    // Invalidate map size after animation/DOM layout settlement
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => clearTimeout(timer)
  }, [map, origin, destination, isExpanded])

  return null
}

export default function MandiRouteMap({
  centre,
  farmerVillage,
  farmerDistrict,
  defaultExpanded = true,
  compact = false,
  className = '',
  onClose = null,
}) {
  const { t, translateLocation, translateCentreName, formatNumber } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [useLiveGps, setUseLiveGps] = useState(false)
  const [liveCoords, setLiveCoords] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(true)

  // 1. Resolve Mandi (Destination) Coordinates
  const mandiName = centre?.name || centre?.centre_name || 'Procurement Centre'
  const mandiLocation = centre?.location || centre?.centre_location || centre?.district || ''
  const mandiDistrict = centre?.district || centre?.centre_district || 'Howrah'

  const destCoords = useMemo(() => {
    const lat = centre?.latitude || centre?.centre_latitude
    const lon = centre?.longitude || centre?.centre_longitude
    if (lat && lon && typeof lat === 'number' && typeof lon === 'number') {
      return [lat, lon]
    }
    // Fallback from locations dataset
    const found = findVillageCoordinates(mandiLocation || mandiName, mandiDistrict)
    return [found.latitude, found.longitude]
  }, [centre, mandiLocation, mandiName, mandiDistrict])

  // 2. Resolve Farmer Bio (Origin) Coordinates
  const bioLocation = useMemo(() => {
    return findVillageCoordinates(farmerVillage, farmerDistrict)
  }, [farmerVillage, farmerDistrict])

  // 3. Active Origin Coordinates (Bio vs Live GPS)
  const activeOrigin = useMemo(() => {
    if (useLiveGps && liveCoords) {
      return [liveCoords.latitude, liveCoords.longitude]
    }
    return [bioLocation.latitude, bioLocation.longitude]
  }, [useLiveGps, liveCoords, bioLocation])

  // 4. Request Live GPS location
  const handleToggleGps = useCallback(() => {
    if (useLiveGps) {
      setUseLiveGps(false)
      setGpsError(null)
      return
    }

    if (!navigator.geolocation) {
      setGpsError(t('map.gps_error'))
      return
    }

    setGpsLoading(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setUseLiveGps(true)
        setGpsLoading(false)
      },
      (err) => {
        setGpsError(t('map.gps_error'))
        setGpsLoading(false)
        setUseLiveGps(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  }, [useLiveGps, t])

  // 5. Fetch Road Route Geometry whenever origin or destination changes
  useEffect(() => {
    let isCancelled = false
    setLoadingRoute(true)

    fetchRoadRoute(activeOrigin[0], activeOrigin[1], destCoords[0], destCoords[1])
      .then((data) => {
        if (!isCancelled) {
          setRouteData(data)
          setLoadingRoute(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          const straight = calculateHaversineDistance(activeOrigin[0], activeOrigin[1], destCoords[0], destCoords[1])
          setRouteData({
            coordinates: generateCurvedPolyline(activeOrigin, destCoords),
            distanceKm: Math.round(straight * 1.25 * 10) / 10,
            durationMinutes: Math.round(((straight * 1.25) / 30) * 60),
            isRoadRoute: false,
          })
          setLoadingRoute(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activeOrigin, destCoords])

  // 6. Calculate transit times
  const distanceKm = routeData?.distanceKm || calculateHaversineDistance(activeOrigin[0], activeOrigin[1], destCoords[0], destCoords[1])
  const transitTimes = useMemo(() => calculateTransitEstimates(distanceKm), [distanceKm])

  // 7. Google Maps Deep Link URL
  const googleMapsUrl = useMemo(() => {
    return getGoogleMapsNavigationUrl(activeOrigin[0], activeOrigin[1], destCoords[0], destCoords[1])
  }, [activeOrigin, destCoords])

  // Custom Leaflet DivIcons
  const farmerIcon = useMemo(() => {
    return L.divIcon({
      className: 'pin-farmer-wrapper',
      html: `
        <div class="pin-farmer-badge" title="${farmerVillage || 'Farmer Origin'}">
          <div class="pin-farmer-pulse"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    })
  }, [farmerVillage])

  const mandiIcon = useMemo(() => {
    return L.divIcon({
      className: 'pin-mandi-wrapper',
      html: `
        <div class="pin-mandi-badge" title="${mandiName}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/></svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -19],
    })
  }, [mandiName])

  return (
    <div className={`bg-white dark:bg-[#0a101d] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/10 dark:from-[#0a101d] dark:via-[#0e1626] dark:to-[#0a101d] p-4 sm:p-4.5 border-b border-emerald-100/80 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-500/30 shadow-inner">
              <Navigation className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 dark:text-emerald-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate font-display text-slate-900 dark:text-white">
                {t('map.title')}
              </h3>
              <p className="text-emerald-700 dark:text-emerald-400 text-xs truncate mt-0.5 font-medium">
                {translateLocation(`${farmerVillage || bioLocation.village}, ${farmerDistrict || bioLocation.district}`)} ➔ {translateCentreName(mandiName)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-white/15 shadow-2xs"
              aria-label={isExpanded ? t('map.hide_route') : t('map.view_route')}
            >
              <span className="hidden sm:inline">{isExpanded ? t('map.hide_route') : t('map.view_route')}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Origin / GPS Switcher Chips */}
        {isExpanded && (
          <div className="mt-3.5 pt-3 border-t border-emerald-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">{t('map.from_location', { location: '' })}</span>
              <button
                type="button"
                onClick={() => setUseLiveGps(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                  !useLiveGps
                    ? 'bg-white dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs border-emerald-300 dark:border-emerald-500/40'
                    : 'bg-emerald-100/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-white/10 border-emerald-200/60 dark:border-white/10'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {translateLocation(`${farmerVillage || bioLocation.village}, ${farmerDistrict || bioLocation.district}`)}
                </span>
                {!useLiveGps && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={handleToggleGps}
                disabled={gpsLoading}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                  useLiveGps
                    ? 'bg-amber-400 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 font-bold shadow-xs border-amber-400 dark:border-amber-500/40'
                    : 'bg-emerald-100/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-white/10 border-emerald-200/60 dark:border-white/10'
                }`}
                title={t('map.origin_gps')}
              >
                {gpsLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-700 dark:text-amber-400" />
                ) : (
                  <Radio className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                )}
                <span>{t('map.origin_gps')}</span>
                {useLiveGps && <CheckCircle2 className="w-3 h-3 text-amber-950 dark:text-amber-300" />}
              </button>
            </div>

            {/* Distance Pill */}
            <div className="bg-white dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border border-slate-200 dark:border-white/15 ml-auto shadow-2xs">
              <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-amber-300" />
              <span>{formatNumber(distanceKm)} {t('map.km')}</span>
            </div>
          </div>
        )}
      </div>

      {/* GPS Notice / Error Alert if present */}
      {isExpanded && gpsError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Leaflet Map Window */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 h-[240px] sm:h-[300px]">
            {loadingRoute && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center gap-2 text-xs text-slate-700 font-medium">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>{t('map.calculating_route')}</span>
              </div>
            )}

            <MapContainer
              center={[(activeOrigin[0] + destCoords[0]) / 2, (activeOrigin[1] + destCoords[1]) / 2]}
              zoom={11}
              scrollWheelZoom={false}
              className="w-full h-full"
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />

              {/* Viewport Bounds Controller */}
              <MapBoundsSync
                origin={activeOrigin}
                destination={destCoords}
                isExpanded={isExpanded}
              />

              {/* Route Polyline (Glow Shadow Layer + Core Route Layer) */}
              {routeData?.coordinates && (
                <>
                  <Polyline
                    positions={routeData.coordinates}
                    pathOptions={{
                      color: '#0f172a',
                      weight: 7,
                      opacity: 0.2,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  <Polyline
                    positions={routeData.coordinates}
                    pathOptions={{
                      color: '#15803d',
                      weight: 4.5,
                      opacity: 0.9,
                      dashArray: routeData.isRoadRoute ? null : '6, 8',
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </>
              )}

              {/* Farmer Origin Marker */}
              <Marker position={activeOrigin} icon={farmerIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-emerald-600" /> {t('map.farmer_origin')}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      {useLiveGps ? t('map.gps_active') : translateLocation(`${farmerVillage || bioLocation.village}, ${farmerDistrict || bioLocation.district}`)}
                    </p>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                  <span className="font-semibold text-xs">
                    {useLiveGps ? 'Live GPS' : translateLocation(farmerVillage || bioLocation.village)}
                  </span>
                </Tooltip>
              </Marker>

              {/* Mandi Destination Marker */}
              <Marker position={destCoords} icon={mandiIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Wheat className="w-3.5 h-3.5 text-amber-600" /> {translateCentreName(mandiName)}
                    </p>
                    <p className="text-slate-600 mt-0.5">{translateLocation(mandiLocation)}</p>
                    <p className="text-[11px] text-green-700 font-medium mt-1">{t('map.operating_hours')}</p>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -19]} opacity={0.95}>
                  <span className="font-semibold text-xs">{translateCentreName(mandiName)}</span>
                </Tooltip>
              </Marker>
            </MapContainer>

            {/* Map Overlay Badge */}
            <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatNumber(distanceKm)} {t('map.km')}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-400">
                {routeData?.isRoadRoute ? t('map.live_road_route') : t('map.fallback_route')}
              </span>
            </div>
          </div>

          {/* Agricultural Transit Time Matrix */}
          <div className="bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t('map.eta')}
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('map.distance')}: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatNumber(distanceKm)} {t('map.km')}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Tractor / Trolley */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Tractor className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  ~{formatNumber(transitTimes.tractorMinutes)} {t('common.min')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  {t('map.vehicle_tractor')}
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {t('map.speed_tractor')}
                </div>
              </div>

              {/* Cargo Tempo */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ~{formatNumber(transitTimes.tempoMinutes)} {t('common.min')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  {t('map.vehicle_tempo')}
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {t('map.speed_tempo')}
                </div>
              </div>

              {/* Bike / Scooter */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                  ~{formatNumber(transitTimes.bikeMinutes)} {t('common.min')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  {t('map.vehicle_bike')}
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {t('map.speed_bike')}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Google Maps Turn-by-Turn Navigation */}
          <div className="space-y-1.5">
            <a
              id="btn-open-google-maps"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary font-bold py-3.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.99] text-sm cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{t('map.open_google_maps')}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-0.5" />
            </a>
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              {t('map.direct_nav_hint')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

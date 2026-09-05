import { useState } from 'react'
import { MapPin, Clock, Users, Building2, ChevronRight, Star, TrendingDown, Sparkles, Navigation, AlertTriangle, Info } from 'lucide-react'

function StatusBadge({ status }) {
  const map = { OPEN: 'bg-green-100 text-green-700', CLOSED: 'bg-red-100 text-red-700', FULL: 'bg-orange-100 text-orange-700' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.OPEN}`}>{status}</span>
}

function CentreCard({ centre, onSelect, isRecommended, isLongDistance }) {
  const eta = Math.round(centre.estimated_wait_minutes)
  const roundtripTravelMins = Math.round(centre.distance_km * 2 * 3.0)
  const totalDoorToDoor = roundtripTravelMins + eta

  return (
    <div className={`bg-white rounded-2xl border shadow-sm card-hover overflow-hidden transition-all ${
      isRecommended && !isLongDistance
        ? 'border-green-400 ring-2 ring-green-100 shadow-md'
        : isLongDistance
        ? 'border-amber-200 hover:border-amber-300'
        : 'border-slate-100'
    }`}>
      {isRecommended && !isLongDistance && (
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
          <span>Smart AI Pick: Best Overall Centre</span>
          {centre.recommendation_reasons?.length > 0 && (
            <span className="ml-auto text-green-200 font-normal text-xs bg-black/20 px-2 py-0.5 rounded-full">
              {centre.recommendation_reasons[0]}
            </span>
          )}
        </div>
      )}

      {isRecommended && isLongDistance && (
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-200" />
          <span>Nearest Available Regional Centre</span>
          <span className="ml-auto text-amber-100 font-normal text-xs bg-black/20 px-2 py-0.5 rounded-full">
            {centre.distance_km} km away
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {centre.name}
              {isRecommended && !isLongDistance && (
                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded-md border border-green-200">
                  TOP MATCH
                </span>
              )}
              {isLongDistance && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  REGIONAL (50+ KM)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{centre.location}</span>
              <span className={`ml-1 font-medium ${isLongDistance ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
                · {centre.distance_km} km away
              </span>
            </div>
          </div>
          <StatusBadge status={centre.status} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-800">{centre.waiting_count}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />Waiting
            </div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-green-700">{centre.active_counters}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
              <Building2 className="w-3 h-3" />Counters
            </div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <div className="text-2xl font-bold text-amber-700">~{eta}m</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />Est. Wait
            </div>
          </div>
        </div>

        {/* Door-to-door trip indicator */}
        <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl mb-4 border ${
          isLongDistance ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50/80 border-slate-100 text-slate-500'
        }`}>
          <span className="flex items-center gap-1.5 font-medium">
            <Navigation className={`w-3.5 h-3.5 ${isLongDistance ? 'text-amber-600' : 'text-blue-600'}`} />
            Door-to-Door Estimated Time:
          </span>
          <span className="font-bold">
            ~{totalDoorToDoor} min <span className={`font-normal ${isLongDistance ? 'text-amber-700' : 'text-slate-400'}`}>({roundtripTravelMins}m travel + {eta}m wait)</span>
          </span>
        </div>

        {centre.recommendation_reasons?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {centre.recommendation_reasons.map((r, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${
                  isLongDistance
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-green-50 text-green-700 border-green-100'
                }`}
              >
                <TrendingDown className="w-3 h-3" />{r}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-sm text-slate-500">{centre.available_slots_today} slots available today</span>
          <button
            id={`btn-select-centre-${centre.id}`}
            onClick={() => onSelect(centre)}
            disabled={centre.status !== 'OPEN' || centre.available_slots_today === 0}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Book Slot <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CentreList({ centres, loading, onSelect, userLocation }) {
  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl" />)}
    </div>
  )

  if (!centres.length) return (
    <div className="text-center py-16 text-slate-500">No procurement centres found</div>
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
            <p className="font-bold text-emerald-900 text-sm">Smart Queue-Aware Centre Routing</p>
            <p className="text-emerald-700 mt-0.5">
              Centres are dynamically ranked using real-time queue depth, road distance, and historical throughput to minimize your total door-to-door time.
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
              No Procurement Centres Within 50 km
            </h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              There are currently no direct procurement centres operational in your immediate vicinity{userLocation ? ` (${userLocation})` : ''}. Showing nearest available centres in adjacent districts (50+ km transit):
            </p>
          </div>
        </div>
      )}

      {/* Local / Nearby Centres Section */}
      {nearbyCentres.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-900">Nearby Procurement Centres (&lt; 50 km)</h2>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
              {nearbyCentres.length} available
            </span>
          </div>

          {nearbyCentres.map((c, i) => (
            <CentreCard
              key={c.id}
              centre={c}
              onSelect={onSelect}
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
              {hasNoNearbyCentres ? 'Available Regional Centres' : 'Other Regional Centres (50+ km away)'}
            </h2>
            <span className="text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full font-medium">
              Longer Transit
            </span>
          </div>

          {distantCentres.map((c, i) => (
            <CentreCard
              key={c.id}
              centre={c}
              onSelect={onSelect}
              isRecommended={hasNoNearbyCentres && i === 0}
              isLongDistance={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

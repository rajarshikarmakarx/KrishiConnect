import { useState } from 'react'
import { MapPin, Clock, Users, Building2, ChevronRight, Star, TrendingDown, Sparkles, Navigation, Info } from 'lucide-react'

function StatusBadge({ status }) {
  const map = { OPEN: 'bg-green-100 text-green-700', CLOSED: 'bg-red-100 text-red-700', FULL: 'bg-orange-100 text-orange-700' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.OPEN}`}>{status}</span>
}

function CentreCard({ centre, onSelect, isRecommended }) {
  const eta = Math.round(centre.estimated_wait_minutes)
  const roundtripTravelMins = Math.round(centre.distance_km * 2 * 3.0)
  const totalDoorToDoor = roundtripTravelMins + eta

  return (
    <div className={`bg-white rounded-2xl border shadow-sm card-hover overflow-hidden transition-all ${
      isRecommended ? 'border-green-400 ring-2 ring-green-100 shadow-md' : 'border-slate-100'
    }`}>
      {isRecommended && (
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
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {centre.name}
              {isRecommended && (
                <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded-md border border-green-200">
                  TOP MATCH
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{centre.location}</span>
              <span className="ml-1 text-slate-400">· {centre.distance_km} km away</span>
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
        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50/80 px-3 py-2 rounded-xl mb-4 border border-slate-100">
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            Door-to-Door Estimated Time:
          </span>
          <span className="font-bold text-slate-700">
            ~{totalDoorToDoor} min <span className="font-normal text-slate-400">({roundtripTravelMins}m travel + {eta}m wait)</span>
          </span>
        </div>

        {isRecommended && centre.recommendation_reasons?.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {centre.recommendation_reasons.map((r, i) => (
              <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-lg border border-green-100 flex items-center gap-1">
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

export default function CentreList({ centres, loading, onSelect }) {
  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl" />)}
    </div>
  )

  if (!centres.length) return (
    <div className="text-center py-16 text-slate-500">No procurement centres found</div>
  )

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Smart Recommendation Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 text-xs">
          <p className="font-bold text-emerald-900 text-sm">Smart Queue-Aware Centre Routing</p>
          <p className="text-emerald-700 mt-0.5">
            Centres are dynamically ranked using real-time queue depth, travel distance, and historical throughput to save you the most total time.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-900">Procurement Centres</h2>
        <span className="text-sm text-slate-500">{centres.length} centres nearby</span>
      </div>

      {centres.map((c, i) => (
        <CentreCard key={c.id} centre={c} onSelect={onSelect} isRecommended={i === 0} />
      ))}
    </div>
  )
}

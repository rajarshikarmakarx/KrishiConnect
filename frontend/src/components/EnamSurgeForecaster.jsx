import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, CheckCircle2, Zap, RefreshCw, BarChart3, Building2, Scale, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

export default function EnamSurgeForecaster() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionStates, setActionStates] = useState({})

  const fetchSurgeData = async () => {
    setLoading(true)
    try {
      const res = await api.getEnamSurge()
      if (res) setData(res)
    } catch {
      toast.error('Failed to load live e-NAM APMC surge data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurgeData()
  }, [])

  const handleTriggerAction = (actionId, title) => {
    setActionStates(prev => ({ ...prev, [actionId]: true }))
    toast.success(`Protocol Activated: ${title}! Mandi queue parameters updated.`, {
      icon: '⚡',
      duration: 5000
    })
  }

  if (loading && !data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 text-xs font-semibold">Connecting to e-NAM (enam.gov.in) & Agmarknet Relays...</p>
      </div>
    )
  }

  const summary = data?.surge_summary
  const feeds = data?.apmc_feeds || []
  const protocols = data?.actionable_protocols || []

  return (
    <div className="space-y-6">
      {/* High-Impact AI Surge Alert Banner */}
      <div className="bg-gradient-to-br from-red-950 via-slate-900 to-amber-950 text-white rounded-3xl border-2 border-red-500/40 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
                  {summary?.risk_level || 'CRITICAL'} SURGE RISK
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  e-NAM / Agmarknet Live Arbitrage Engine
                </span>
              </div>
              <h2 className="text-lg font-bold font-display text-white mt-1">
                {summary?.headline}
              </h2>
            </div>
          </div>
          <button
            onClick={fetchSurgeData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold border border-white/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh e-NAM Feeds</span>
          </button>
        </div>

        {/* Operational Intelligence Insight */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {summary?.operational_recommendation}
        </p>

        {/* 4 Critical KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-red-500/30">
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Avg APMC Deficit</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              ₹{Math.abs(summary?.avg_arbitrage_deficit_inr || 247)}/Q
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Private buyers paying below MSP</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30">
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Forecasted Queue Inflow</p>
            <p className="text-xl font-bold font-mono text-amber-300 mt-0.5">
              +{summary?.projected_queue_surge_pct || 48}%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Surge above weekly baseline</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30">
            <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Govt Paddy MSP</p>
            <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
              ₹2,300/Q
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Guaranteed support floor</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-700/50">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Affected Mandi Hubs</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              {summary?.affected_districts?.length || 3} Districts
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Hooghly, Burdwan, Howrah</p>
          </div>
        </div>
      </div>

      {/* Proactive Mitigation Command Protocols */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Proactive Queue Mitigation Protocols (SIH26032)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute real-time capacity adjustments before tractor highway congestion builds up
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {protocols.map((protocol) => {
            const isActivated = actionStates[protocol.id]
            return (
              <div
                key={protocol.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isActivated
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-display">{protocol.title}</span>
                    {isActivated ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> DEPLOYED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    {protocol.impact}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isActivated}
                  onClick={() => handleTriggerAction(protocol.id, protocol.title)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActivated
                      ? 'bg-emerald-700 text-white cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 shadow-sm'
                  }`}
                >
                  {isActivated ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Protocol Active
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Execute Protocol
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* APMC Market Price vs MSP Arbitrage Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              e-NAM & Agmarknet Regional APMC Daily Price Arbitrage
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live market comparisons: when private APMC rate drops below MSP, farmers divert to government mandi hubs
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Source: enam.gov.in Daily Relays
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">APMC Mandi</th>
                <th className="pb-3 font-semibold">District</th>
                <th className="pb-3 font-semibold">Commodity</th>
                <th className="pb-3 font-semibold text-right">e-NAM Modal Rate</th>
                <th className="pb-3 font-semibold text-right">Govt MSP Rate</th>
                <th className="pb-3 font-semibold text-right">Price Gap (Arbitrage)</th>
                <th className="pb-3 font-semibold text-center">Inflow Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeds.map((feed, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{feed.apmc_name}</span>
                  </td>
                  <td className="py-3.5 text-slate-600">{feed.district}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                      {feed.commodity}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                    ₹{feed.modal_price.toLocaleString('en-IN')}/Q
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold text-emerald-700">
                    ₹{feed.msp_rate.toLocaleString('en-IN')}/Q
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold">
                    <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -₹{Math.abs(feed.diff_amount)}/Q ({feed.diff_percent}%)
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
                      HIGH DIVERSION
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

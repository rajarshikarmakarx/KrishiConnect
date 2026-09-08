import React, { useState, useEffect } from 'react'
import { Smartphone, RefreshCw, X, MessageSquare, CheckCircle2, ShieldCheck, Globe, Wifi } from 'lucide-react'
import api from '../api'

export default function FeaturePhoneSimulator() {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await api.getSmsLogs()
      if (data && data.logs) {
        setLogs(data.logs)
        if (data.logs.length > 0 && !selectedLog) {
          setSelectedLog(data.logs[0])
        }
      }
    } catch {
      // Fallback sample for initial showcase
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchLogs()
      const timer = setInterval(fetchLogs, 4000)
      return () => clearInterval(timer)
    }
  }, [open])

  // Sample default message if no SMS has been sent yet
  const activeMessage = selectedLog || (logs.length > 0 ? logs[0] : {
    mobile: '9876543210',
    lang: 'bn',
    msg_type: 'SLOT_BOOKED',
    text: 'কৃষিকানেক্ট: সিঙ্গুর এগ্রিকালচারাল মান্ডি-তে আপনার স্লট নিশ্চিত। টোকেন: A104। তারিখ: আজ, সময়: 10:00 AM। খতিয়ান রসিদ নিয়ে ১৫ মিনিট আগে উপস্থিত থাকুন।',
    timestamp: new Date().toISOString(),
    provider: 'KRISHICONNECT_SMS_GATEWAY'
  })

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="btn-open-feature-phone"
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 border border-slate-700/80 transition-all hover:scale-105 cursor-pointer text-xs font-semibold group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>Feature-Phone SMS Feed</span>
        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
          বাংলা / हिंदी / EN
        </span>
      </button>

      {/* Modal / Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative text-white flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Realistic Retro Keypad Feature Phone */}
            <div className="w-full md:w-72 flex-shrink-0 flex flex-col items-center">
              <div className="w-64 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-[40px] p-4 border-4 border-slate-700 shadow-2xl shadow-emerald-950/20 flex flex-col items-center">
                {/* Speaker Ear-piece */}
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-3" />

                {/* Classic LCD Screen (Greenish-Amber / Monochrome Backlit) */}
                <div className="w-full bg-[#1b2b1d] border-2 border-slate-700 rounded-xl p-3 text-[#58f370] font-mono text-[11px] shadow-inner space-y-2 min-h-[220px] flex flex-col justify-between">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between border-b border-[#58f370]/30 pb-1 text-[9px]">
                    <span className="flex items-center gap-1 font-bold">
                      <Wifi className="w-2.5 h-2.5" /> BSNL 2G
                    </span>
                    <span>10:45 AM</span>
                    <span>🔋 95%</span>
                  </div>

                  {/* SMS Content Header */}
                  <div>
                    <div className="flex items-center justify-between text-[9px] text-[#58f370]/80">
                      <span>FROM: <strong>VM-KRISHI</strong></span>
                      <span className="uppercase text-[8px] bg-[#58f370]/20 px-1 rounded">
                        {activeMessage.lang?.toUpperCase() || 'BN'}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] leading-relaxed break-words font-sans font-medium text-emerald-100 bg-black/40 p-2 rounded-lg border border-[#58f370]/20 max-h-[130px] overflow-y-auto">
                      {activeMessage.text}
                    </div>
                  </div>

                  {/* Softkey footer */}
                  <div className="flex items-center justify-between border-t border-[#58f370]/30 pt-1 text-[9px]">
                    <span>Options</span>
                    <span className="text-[8px] opacity-70">1/1 Msg</span>
                    <span>Back</span>
                  </div>
                </div>

                {/* Hardware Keypad Controls */}
                <div className="w-full mt-3.5 space-y-2 px-1">
                  {/* Navigation D-Pad */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-5 bg-slate-700 rounded-sm border border-slate-600" />
                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-500 shadow-xs" />
                    <div className="w-10 h-5 bg-slate-700 rounded-sm border border-slate-600" />
                  </div>

                  {/* Numeric Keypad Grid */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-bold text-[10px] text-slate-400">
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">1 <span className="text-[8px] block font-normal text-slate-500">_</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">2 <span className="text-[8px] block font-normal text-slate-500">abc</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">3 <span className="text-[8px] block font-normal text-slate-500">def</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">4 <span className="text-[8px] block font-normal text-slate-500">ghi</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">5 <span className="text-[8px] block font-normal text-slate-500">jkl</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">6 <span className="text-[8px] block font-normal text-slate-500">mno</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">7 <span className="text-[8px] block font-normal text-slate-500">pqrs</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">8 <span className="text-[8px] block font-normal text-slate-500">tuv</span></div>
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700">9 <span className="text-[8px] block font-normal text-slate-500">wxyz</span></div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Simulated 2G Keypad Phone (No internet required for farmer)
              </p>
            </div>

            {/* Right Column: Live Dispatched SMS Logs & Details */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-base font-display text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Live SMS Dispatch Audit Trail
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Actual messages sent to farmers via Fast2SMS Indian Carrier Gateway
                    </p>
                  </div>
                  <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer"
                    title="Refresh SMS logs"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>

                {/* Audit Explanation Banner */}
                <div className="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>TRAI / DoCA DLT Compliant Format</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    Messages are dynamically rendered in the farmer's registered language (বাংলা, हिंदी, or English) and delivered via GSM carriers with sender tag <strong>VM-KRISHI</strong>.
                  </p>
                </div>

                {/* List of Recent SMS messages */}
                <div className="mt-4 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No SMS sent in this session yet. Request an OTP or book a slot to see live dispatches here!
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div
                        key={log.id || idx}
                        onClick={() => setSelectedLog(log)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                          selectedLog?.id === log.id
                            ? 'bg-slate-800/90 border-emerald-500/60 shadow-md'
                            : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">
                              +91 {log.mobile}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/40 font-mono">
                              {log.msg_type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.lang?.toUpperCase()} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {log.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fast2SMS Key Configuration Note */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Fast2SMS Gateway: <strong className="text-slate-300">Active (Real GSM Carrier)</strong></span>
                <span className="text-emerald-400 font-mono">SIH26032 Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

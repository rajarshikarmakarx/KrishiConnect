import { CheckCircle, MapPin, Clock } from 'lucide-react'

export default function BookingToken({ entry, onContinue }) {
  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden animate-slide-up">
      <div className="bg-green-700 text-white px-5 py-4 text-center">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-200" />
        <h2 className="font-bold text-lg">Booking Confirmed!</h2>
      </div>
      <div className="p-6 text-center">
        <p className="text-slate-500 text-sm mb-3 uppercase tracking-wider font-semibold">Your Queue Token</p>
        <div className="token-display text-7xl font-bold text-green-800 mb-4 py-4 bg-green-50 rounded-2xl border-2 border-green-200">
          {entry.token}
        </div>
        <div className="space-y-2 text-sm text-slate-600 mb-6">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{entry.centre_name}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{entry.slot_start_time} – {entry.slot_end_time}</span>
          </div>
          <p><span className="font-medium">{entry.crop}</span> · {entry.expected_quantity_kg} kg</p>
        </div>
        <button id="btn-view-queue" onClick={onContinue} className="btn-primary w-full">View Live Queue</button>
      </div>
    </div>
  )
}

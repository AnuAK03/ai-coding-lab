// frontend/src/components/SessionTimer.jsx
import { Clock } from 'lucide-react'

function formatTime(totalSeconds) {
  const h   = Math.floor(totalSeconds / 3600)
  const m   = Math.floor((totalSeconds % 3600) / 60)
  const s   = totalSeconds % 60
  const pad = n => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function SessionTimer({ elapsed, isSaving }) {
  const isLate = elapsed > 80 * 60   // turns red after 80 minutes
  return (
    <div className='flex items-center gap-3'>
      <div className={`flex items-center gap-1.5 font-mono font-semibold text-sm
                       px-3 py-1 rounded-lg
                       ${isLate ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
        <Clock size={14} />
        <span>{formatTime(elapsed)}</span>
      </div>
      {isSaving && (
        <span className='text-xs text-gray-400 animate-pulse'>Saving...</span>
      )}
    </div>
  )
}
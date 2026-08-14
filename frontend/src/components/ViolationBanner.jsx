// frontend/src/components/ViolationBanner.jsx
import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

// Human-readable messages for each violation type
const MESSAGES = {
  tab_switch:      'Tab switch detected. This has been recorded.',
  paste_attempt:   'Paste is not allowed during a session.',
  fullscreen_exit: 'Please return to fullscreen. Press F11 or click below.',
  right_click:     'Right-click is disabled during the session.',
  copy_attempt:    'Copy is disabled. Write your own code.',
  devtools_open:   'Developer tools detected. This has been logged.',
}

export default function ViolationBanner({
  violation,
  isFlagged,
  isFullscreen,
  onDismiss,
  onReEnterFullscreen,
}) {
  // Auto-dismiss non-fullscreen banners after 4 seconds
  useEffect(() => {
    if (!violation) return
    if (violation.type === 'fullscreen_exit') return  // must be manual
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [violation, onDismiss])

  if (!violation) return null

  const isFullscreenWarning = violation.type === 'fullscreen_exit'
  const isCritical          = violation.severity === 'high'

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex items-center gap-3
                     px-5 py-3 shadow-lg transition-all
                     ${isCritical || isFlagged
                         ? 'bg-red-600 text-white'
                         : 'bg-orange-500 text-white'}`}>
      <AlertTriangle size={18} className='flex-shrink-0' />

      <div className='flex-1'>
        <p className='font-semibold text-sm'>
          {MESSAGES[violation.type] || 'A violation has been recorded.'}
        </p>
        {isFlagged && (
          <p className='text-xs opacity-90 mt-0.5'>
            This session has been flagged for review by your teacher.
          </p>
        )}
      </div>

      {isFullscreenWarning && (
        <button
          onClick={onReEnterFullscreen}
          className='bg-white text-orange-600 font-semibold text-xs
                     px-3 py-1.5 rounded-lg hover:bg-orange-50 transition'
        >
          Return to Fullscreen
        </button>
      )}

      {!isFullscreenWarning && (
        <button onClick={onDismiss} className='opacity-75 hover:opacity-100'>
          <X size={16} />
        </button>
      )}
    </div>
  )
}
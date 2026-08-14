// frontend/src/hooks/useProctor.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../services/firebase'

// Violation severity map
const SEVERITY = {
  tab_switch:      'high',
  paste_attempt:   'high',
  fullscreen_exit: 'medium',
  right_click:     'low',
  copy_attempt:    'low',
  devtools_open:   'medium',
}

// Thresholds for auto-flagging
const HIGH_VIOLATION_LIMIT  = 3
const TOTAL_VIOLATION_LIMIT = 5

// FIX BUG 4: debounce window — two events within this ms window count as ONE violation
const DEBOUNCE_MS = 600

export function useProctor(sessionId) {
  const [violations,    setViolations]    = useState([])
  const [isFlagged,     setIsFlagged]     = useState(false)
  const [isFullscreen,  setIsFullscreen]  = useState(false)
  const [showBanner,    setShowBanner]    = useState(false)
  const [lastViolation, setLastViolation] = useState(null)

  // Ref so event listeners always see latest violations count
  const violationsRef   = useRef([])
  // FIX BUG 4: track last-fired timestamp per violation type to debounce
  const lastFiredRef    = useRef({})

  const logViolation = useCallback(async (type) => {
    if (!sessionId) return

    // FIX BUG 4: suppress duplicate events within DEBOUNCE_MS
    const now = Date.now()
    const lastFired = lastFiredRef.current[type] || 0
    if (now - lastFired < DEBOUNCE_MS) return
    lastFiredRef.current[type] = now

    const entry = {
      type,
      severity:  SEVERITY[type] || 'low',
      timestamp: new Date().toISOString(),
    }

    const updated = [...violationsRef.current, entry]
    violationsRef.current = updated
    setViolations(updated)
    setLastViolation(entry)
    setShowBanner(true)

    const highCount  = updated.filter(v => v.severity === 'high').length
    const totalCount = updated.length
    const shouldFlag = highCount >= HIGH_VIOLATION_LIMIT ||
                       totalCount >= TOTAL_VIOLATION_LIMIT

    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        violations: arrayUnion(entry),
        ...(shouldFlag && { flagged: true }),
      })
      if (shouldFlag) setIsFlagged(true)
    } catch (err) {
      console.warn('Violation log failed:', err)
    }
  }, [sessionId])

  const dismissBanner = useCallback(() => {
    setShowBanner(false)
  }, [])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return

    function onFullscreenChange() {
      const inFS = !!document.fullscreenElement
      setIsFullscreen(inFS)
      if (!inFS) logViolation('fullscreen_exit')
    }

    // FIX BUG 4: only use visibilitychange for tab-switch detection.
    // window blur fires simultaneously and would double-count — removed.
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        logViolation('tab_switch')
      }
    }

    function onContextMenu(e) {
      e.preventDefault()
      logViolation('right_click')
    }

    let prevWidth  = window.outerWidth
    let prevHeight = window.outerHeight
    function onResize() {
      const widthDiff  = Math.abs(window.outerWidth  - prevWidth)
      const heightDiff = Math.abs(window.outerHeight - prevHeight)
      if (widthDiff > 160 || heightDiff > 160) {
        logViolation('devtools_open')
      }
      prevWidth  = window.outerWidth
      prevHeight = window.outerHeight
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('contextmenu',      onContextMenu)
    window.addEventListener('resize',             onResize)

    enterFullscreen()

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('contextmenu',      onContextMenu)
      window.removeEventListener('resize',             onResize)
    }
  }, [sessionId, logViolation, enterFullscreen])

  return {
    violations,
    isFlagged,
    isFullscreen,
    showBanner,
    lastViolation,
    logViolation,
    dismissBanner,
    enterFullscreen,
  }
}

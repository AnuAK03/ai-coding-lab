// frontend/src/hooks/useProctor.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../services/firebase'

// Violation severity map — used for auto-flag logic
const SEVERITY = {
  tab_switch:      'high',
  paste_attempt:   'high',
  fullscreen_exit: 'medium',
  right_click:     'low',
  copy_attempt:    'low',
  devtools_open:   'medium',
}

// Thresholds for auto-flagging
const HIGH_VIOLATION_LIMIT  = 3   // 3 high-severity = flag
const TOTAL_VIOLATION_LIMIT = 5   // 5 total = flag

export function useProctor(sessionId) {
  const [violations,       setViolations]       = useState([])
  const [isFlagged,        setIsFlagged]        = useState(false)
  const [isFullscreen,     setIsFullscreen]     = useState(false)
  const [showBanner,       setShowBanner]       = useState(false)
  const [lastViolation,    setLastViolation]    = useState(null)

  // Ref so event listeners always see latest violations count
  const violationsRef = useRef([])

  // ── Log a violation ─────────────────────────────────────────
  const logViolation = useCallback(async (type) => {
    if (!sessionId) return

    const entry = {
      type,
      severity:  SEVERITY[type] || 'low',
      timestamp: new Date().toISOString(),
    }

    // Update local state
    const updated = [...violationsRef.current, entry]
    violationsRef.current = updated
    setViolations(updated)
    setLastViolation(entry)
    setShowBanner(true)

    // Check auto-flag thresholds
    const highCount  = updated.filter(v => v.severity === 'high').length
    const totalCount = updated.length
    const shouldFlag = highCount >= HIGH_VIOLATION_LIMIT ||
                       totalCount >= TOTAL_VIOLATION_LIMIT

    // Write to Firestore — arrayUnion appends without overwriting
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

  // ── Dismiss the warning banner ───────────────────────────────
  const dismissBanner = useCallback(() => {
    setShowBanner(false)
  }, [])

  // ── Fullscreen helpers ───────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }, [])

  // ── Register all event listeners ────────────────────────────
  useEffect(() => {
    if (!sessionId) return

    // 1. Fullscreen change — detect exit
    function onFullscreenChange() {
      const inFS = !!document.fullscreenElement
      setIsFullscreen(inFS)
      if (!inFS) {
        logViolation('fullscreen_exit')
      }
    }

    // 2. Tab switch / window blur — most common cheating signal
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        logViolation('tab_switch')
      }
    }

    // 3. Window blur — catches Alt+Tab, clicking taskbar
    function onWindowBlur() {
      logViolation('tab_switch')
    }

    // 4. Right-click on the whole session page
    function onContextMenu(e) {
      e.preventDefault()
      logViolation('right_click')
    }

    // 5. DevTools heuristic — fires when window shrinks significantly
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

    document.addEventListener('fullscreenchange',  onFullscreenChange)
    document.addEventListener('visibilitychange',  onVisibilityChange)
    window.addEventListener('blur',                onWindowBlur)
    document.addEventListener('contextmenu',       onContextMenu)
    window.addEventListener('resize',              onResize)

    // Enter fullscreen immediately when session starts
    enterFullscreen()

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur',               onWindowBlur)
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
    logViolation,       // called by Session.jsx for paste/copy
    dismissBanner,
    enterFullscreen,
  }
}
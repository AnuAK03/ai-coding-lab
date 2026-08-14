// frontend/src/hooks/useSession.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { runCode } from '../services/api'

function generateSessionId(studentId, programId) {
  return `${studentId}_${programId}_${Date.now()}`
}

export function useSession(user, program) {
  const [sessionId,   setSessionId]   = useState(null)
  const [code,        setCode]        = useState(program?.starterCode || '')
  const [output,      setOutput]      = useState(null)
  const [runCount,    setRunCount]    = useState(0)
  const [errors,      setErrors]      = useState([])
  const [isRunning,   setIsRunning]   = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)
  const [sessionStart,setSessionStart]= useState(null)
  const [elapsed,     setElapsed]     = useState(0)

  const codeRef    = useRef(code)
  const errorsRef  = useRef(errors)
  const runCountRef = useRef(0)
  const sessionIdRef = useRef(null)

  useEffect(() => { codeRef.current    = code     }, [code])
  useEffect(() => { errorsRef.current  = errors   }, [errors])
  useEffect(() => { runCountRef.current = runCount }, [runCount])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  // Create Firestore session doc on mount
  useEffect(() => {
    if (!user || !program) return
    async function createSession() {
      const id    = generateSessionId(user.uid, program.id)
      const start = new Date()
      setSessionId(id)
      setSessionStart(start)
      await setDoc(doc(db, 'sessions', id), {
        sessionId:    id,
        studentId:    user.uid,
        programId:    program.id,
        programTitle: program.title || '',   // store title so Dashboard shows it immediately
        startedAt:    serverTimestamp(),
        status:       'active',
        finalCode:    program?.starterCode || '',
        runAttempts:  0,
        errors:       [],
        hintsUsed:    0,
        violations:   [],
        quizScore:    0,
        flagged:      false,
        attemptNumber: 0,
      })

      // Count prior sessions for this student+program to label this attempt
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore')
        const q = query(
          collection(db, 'sessions'),
          where('studentId', '==', user.uid),
          where('programId', '==', program.id)
        )
        const snap = await getDocs(q)
        // snap includes this new doc, so attemptNumber = snap.size
        await updateDoc(doc(db, 'sessions', id), {
          attemptNumber: snap.size,
        })
      } catch (e) {
        console.warn('Could not set attemptNumber:', e)
      }
    }
    createSession()
  }, [user, program])

  // Elapsed timer — ticks every second
  useEffect(() => {
    if (!sessionStart) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStart])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(async () => {
      try {
        setIsSaving(true)
        await updateDoc(doc(db, 'sessions', sessionId), {
          finalCode:   codeRef.current,
          errors:      errorsRef.current,
          runAttempts: runCountRef.current,
        })
      } catch (err) {
        console.warn('Auto-save failed:', err)
      } finally {
        setIsSaving(false)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [sessionId])

  // codeSnapshots: array of { attempt, code, stdout, stderr, exitCode, tookMs, timestamp }
  // Kept in a ref so it never causes re-renders; written to Firestore on finalize
  const snapshotsRef = useRef([])

  // Run code handler
  const handleRun = useCallback(async () => {
    if (isRunning || !code.trim()) return
    setIsRunning(true)
    setOutput(null)
    try {
      const result = await runCode(code, 'python')
      setOutput(result)
      const nextCount = runCountRef.current + 1
      setRunCount(nextCount)

      // FEATURE: record code snapshot for every run attempt
      const snapshot = {
        attempt:   nextCount,
        code:      code,
        stdout:    result.stdout || '',
        stderr:    result.stderr || '',
        exitCode:  result.exitCode,
        tookMs:    result.tookMs,
        timestamp: new Date().toISOString(),
      }
      snapshotsRef.current = [...snapshotsRef.current, snapshot]

      if (result.stderr) {
        setErrors(prev => [...prev, {
          message:   result.stderr,
          type:      result.exitCode !== 0 ? 'runtime' : 'warning',
          timestamp: new Date().toISOString(),
          attempt:   nextCount,
        }])
      }
    } catch (err) {
      setOutput({
        stdout: '', stderr: 'Network error: Could not reach the code runner.',
        exitCode: 1, tookMs: 0,
      })
    } finally {
      setIsRunning(false)
    }
  }, [code, isRunning])

  // FIX BUG 9: write hintsUsed to Firestore immediately each time a hint is used
  const incrementHintsUsed = useCallback(async (newCount) => {
    const id = sessionIdRef.current
    if (!id) return
    try {
      await updateDoc(doc(db, 'sessions', id), { hintsUsed: newCount })
    } catch (err) {
      console.warn('Failed to save hintsUsed:', err)
    }
  }, [])

  // Save test results to Firestore so they appear in analysis later
  const saveTestResults = useCallback(async (testResults) => {
    const id = sessionIdRef.current
    if (!id || !testResults) return
    try {
      await updateDoc(doc(db, 'sessions', id), {
        lastTestResults: {
          passedCount: testResults.passedCount,
          totalCount:  testResults.totalCount,
          results:     testResults.results.map(r => ({
            label:   r.label,
            passed:  r.passed,
            input:   r.input,
            expected:r.expected,
            actual:  r.actual,
          })),
          testedAt: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.warn('Failed to save test results:', err)
    }
  }, [])

  // Final save before submit — also persists all code snapshots
  const saveAndFinalize = useCallback(async (hintsUsed = 0) => {
    if (!sessionId) return
    await updateDoc(doc(db, 'sessions', sessionId), {
      finalCode:     codeRef.current,
      errors:        errorsRef.current,
      runAttempts:   runCountRef.current,
      hintsUsed:     hintsUsed,
      timeTakenMs:   elapsed * 1000,
      status:        'quiz_pending',
      codeSnapshots: snapshotsRef.current,  // FEATURE: persist full run history
    })
  }, [sessionId, elapsed])

  return {
    sessionId, code, setCode, output, runCount, errors,
    isRunning, isSaving, elapsed,
    handleRun, saveAndFinalize,
    incrementHintsUsed,
    saveTestResults,
    codeSnapshots: snapshotsRef,  // expose ref for CodeDiffViewer
  }
}

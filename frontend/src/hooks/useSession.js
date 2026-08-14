

import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { runCode } from '../services/api'

function generateSessionId(studentId, programId) {
  return `${studentId}_${programId}_${Date.now()}`
}

export function useSession(user, program) {
  const [sessionId, setSessionId] = useState(null)
  const [code, setCode] = useState(program?.starterCode || '')
  const [output, setOutput] = useState(null)
  const [runCount, setRunCount] = useState(0)
  const [errors, setErrors] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionStart, setSessionStart] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const codeRef = useRef(code)
  const errorsRef = useRef(errors)
  useEffect(() => { codeRef.current = code }, [code])
  useEffect(() => { errorsRef.current = errors }, [errors])

  // Create Firestore session doc on mount
  useEffect(() => {
    if (!user || !program) return
    async function createSession() {
      const id = generateSessionId(user.uid, program.id)
      const start = new Date()
      setSessionId(id)
      setSessionStart(start)
      await setDoc(doc(db, 'sessions', id), {
        sessionId: id,
        studentId: user.uid,
        programId: program.id,
        startedAt: serverTimestamp(),
        status: 'active',
        finalCode: program?.starterCode || '',
        runAttempts: 0,
        errors: [],
        hintsUsed: 0,
        violations: [],
        quizScore: 0,
        flagged: false,
      })
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
          finalCode: codeRef.current,
          errors: errorsRef.current,
          runAttempts: runCount,
        })
      } catch (err) {
        console.warn('Auto-save failed:', err)
      } finally {
        setIsSaving(false)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [sessionId, runCount])

  // Run code handler
  const handleRun = useCallback(async () => {
    if (isRunning || !code.trim()) return
    setIsRunning(true)
    setOutput(null)
    try {
      const result = await runCode(code, 'python')
      setOutput(result)
      setRunCount(prev => prev + 1)
      if (result.stderr) {
        setErrors(prev => [...prev, {
          message: result.stderr,
          type: result.exitCode !== 0 ? 'runtime' : 'warning',
          timestamp: new Date().toISOString(),
          attempt: runCount + 1,
        }])
      }
    } catch (err) {
      setOutput({ stdout: '', stderr: 'Network error: Could not reach the code runner.', exitCode: 1, tookMs: 0 })
    } finally {
      setIsRunning(false)
    }
  }, [code, isRunning, runCount])

  // Final save before submit
  const saveAndFinalize = useCallback(async (hintsUsed = 0) => {
    if (!sessionId) return
    await updateDoc(doc(db, 'sessions', sessionId), {
      finalCode: codeRef.current,
      errors: errorsRef.current,
      runAttempts: runCount,
      hintsUsed: hintsUsed,
      timeTakenMs: elapsed * 1000,
      status: 'quiz_pending',
    })
  }, [sessionId, runCount, elapsed])

  return {
    sessionId, code, setCode, output, runCount, errors,
    isRunning, isSaving, elapsed, handleRun, saveAndFinalize,
  }
}
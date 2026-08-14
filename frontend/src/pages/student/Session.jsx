// frontend/src/pages/student/Session.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import Editor from '@monaco-editor/react'
import { db } from '../../services/firebase'
import { useSession } from '../../hooks/useSession'
import SessionTimer from '../../components/SessionTimer'
import { Play, Send, ChevronLeft, CheckCircle, XCircle, Terminal, Lightbulb } from 'lucide-react'
import { useProctor } from '../../hooks/useProctor'
import ViolationBanner from '../../components/ViolationBanner'
import HintPanel from '../../components/HintPanel'
import { runTests } from '../../services/api'

export default function Session() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const user = getAuth().currentUser
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [testResults, setTestResults] = useState(null)
  const [runningTests, setRunningTests] = useState(false)

  useEffect(() => {
    async function loadProgram() {
      const snap = await getDoc(doc(db, 'programs', programId))
      if (snap.exists()) setProgram({ id: snap.id, ...snap.data() })
      setLoading(false)
    }
    loadProgram()
  }, [programId])

  const {
    sessionId, code, setCode, output, runCount,
    isRunning, isSaving, elapsed, handleRun, saveAndFinalize,
  } = useSession(user, program)
  const {
    violations,
    isFlagged,
    isFullscreen,
    showBanner,
    lastViolation,
    logViolation,
    dismissBanner,
    enterFullscreen,
  } = useProctor(sessionId)


  async function handleSubmit() {
    if (!submitConfirm) {
      setSubmitConfirm(true)
      return
    }

    await saveAndFinalize(hintsUsed)

    navigate('/student/quiz', {
      state: {
        sessionId,
        program,
        studentCode: code,
        studentId: user.uid,  // Pass authenticated user ID to Quiz
      }
    })
  }

  async function handleRunTests() {
    if (!program.testCases?.length) return
    setRunningTests(true)
    setTestResults(null)
    try {
      const result = await runTests(code, program.testCases)
      setTestResults(result)
    } catch (err) {
      console.error('Test run failed:', err)
    } finally {
      setRunningTests(false)
    }
  }

  const editorOptions = {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    tabSize: 4,
    automaticLayout: true,
    contextmenu: false,
  }

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center bg-gray-900'>
      <p className='text-gray-400'>Loading session...</p>
    </div>
  )

  if (!program) return (
    <div className='min-h-screen flex items-center justify-center bg-gray-900'>
      <p className='text-red-400'>Program not found.</p>
    </div>
  )
  if (!isFullscreen) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center p-6'>
        <div className='max-w-md w-full bg-gray-800 rounded-xl p-6 text-center'>
          <h2 className='text-xl font-bold text-white mb-4'>
            Proctored Session
          </h2>

          <p className='text-gray-300 mb-6'>
            This coding session requires fullscreen mode.
            Leaving fullscreen, switching tabs, copying,
            or pasting will be recorded as violations.
          </p>

          <button
            onClick={enterFullscreen}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium'
          >
            Enter Fullscreen & Start Session
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className='h-screen flex flex-col bg-gray-900 overflow-hidden pt-14'>
      {showBanner && lastViolation && (
        <ViolationBanner
          violation={lastViolation}
          isFlagged={isFlagged}
          isFullscreen={isFullscreen}
          onDismiss={dismissBanner}
          onReEnterFullscreen={enterFullscreen}
        />
      )}
      {/* ── HEADER BAR ── */}
      <header className='flex items-center justify-between px-4 py-2.5
                         bg-gray-800 border-b border-gray-700 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <button onClick={() => navigate('/student/programs')}
            className='text-gray-400 hover:text-white transition'>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className='text-white font-semibold text-sm'>{program.title}</h1>
            <p className='text-gray-400 text-xs'>{program.language?.toUpperCase()} • {program.difficulty}</p>
          </div>
        </div>
        <SessionTimer elapsed={elapsed} isSaving={isSaving} />
        <div className='flex items-center gap-2'>
          <button onClick={handleRun} disabled={isRunning}
            className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700
                             disabled:bg-green-900 disabled:text-green-600
                             text-white text-sm font-medium px-4 py-1.5 rounded-lg transition'>
            <Play size={14} fill='currentColor' />
            {isRunning ? 'Running...' : 'Run'}
          </button>

          {program.testCases?.length > 0 && (
            <button
              onClick={handleRunTests}
              disabled={runningTests}
              className='flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700
                         disabled:bg-purple-900 disabled:text-purple-600
                         text-white text-sm font-medium px-4 py-1.5 rounded-lg transition'
            >
              {runningTests ? 'Checking...' : `Check (${program.testCases.length})`}
            </button>
          )}

          <button
            onClick={() => setShowHints(true)}
            disabled={hintsUsed >= 3}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5
    rounded-lg transition-colors
    ${hintsUsed >= 3
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
              }`}
          >
            <Lightbulb size={14} />
            {hintsUsed >= 3
              ? 'No hints'
              : `Hint (${3 - hintsUsed} left)`}
          </button>
          <button onClick={handleSubmit}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5
                              rounded-lg transition
                              ${submitConfirm
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            <Send size={14} />
            {submitConfirm ? 'Confirm Submit' : 'Submit'}
          </button>
        </div>
      </header>

      {/* ── SPLIT LAYOUT ── */}
      <div className='flex flex-1 overflow-hidden flex-col md:flex-row'>

        {/* LEFT — Monaco Editor */}
        <div className='flex flex-col w-full md:w-[55%] h-1/2 md:h-full'>
          <div className='flex items-center justify-between px-4 py-1.5
                          bg-gray-800 border-b border-gray-700'>
            <span className='text-xs text-gray-400 font-medium'>main.py</span>
            <span className='text-xs text-gray-500'>
              <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">
                Violations: {violations.length}
              </span>
            </span>
          </div>
          <div className='flex-1'>
            <Editor
              height='100%'
              language='python'
              theme='vs-dark'
              value={code}
              onChange={val => setCode(val || '')}
              options={editorOptions}
              onMount={(editor, monaco) => {
                editor.focus()

                // Block Ctrl+V — paste attempt
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
                  logViolation('paste_attempt')
                  // Do nothing — paste is suppressed
                })

                // Block Ctrl+C — copy attempt
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
                  logViolation('copy_attempt')
                  // Do nothing — copy is suppressed
                })

                // Block Ctrl+X — cut attempt (treat as copy)
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
                  logViolation('copy_attempt')
                  // Do nothing — cut is suppressed
                })

                // Intercept paste via editor API (catches right-click Paste)
                editor.onDidPaste(() => {
                  // Undo the paste immediately
                  editor.trigger('keyboard', 'undo', null)
                  logViolation('paste_attempt')
                })
              }}
            />
          </div>
        </div>

        <div className='hidden md:block w-px bg-gray-700 flex-shrink-0' />

        {/* RIGHT — Output Panel */}
        <div className='flex flex-col bg-gray-900 w-full md:w-[45%] h-1/2 md:h-full'>
          <div className='flex items-center gap-2 px-4 py-1.5 bg-gray-800 border-b border-gray-700'>
            <Terminal size={13} className='text-gray-400' />
            <span className='text-xs text-gray-400 font-medium'>Output</span>
            {output && (
              output.exitCode === 0
                ? <CheckCircle size={13} className='text-green-500 ml-auto' />
                : <XCircle size={13} className='text-red-500 ml-auto' />
            )}
          </div>
          <div className='flex-1 overflow-y-auto p-4 font-mono text-sm'>
            {!output && !isRunning && (
              <p className='text-gray-600 text-xs'>Click Run to execute your code.</p>
            )}
            {isRunning && (
              <div className='flex items-center gap-2 text-gray-400 text-xs'>
                <div className='w-3 h-3 border-2 border-gray-500 border-t-green-400
                                rounded-full animate-spin' />
                Running...
              </div>
            )}
            {output && !isRunning && (
              <div className='space-y-3'>
                <p className='text-gray-500 text-xs'>
                  Finished in {output.tookMs}ms • Exit code {output.exitCode}
                </p>
                {output.stdout && (
                  <div>
                    <p className='text-gray-500 text-xs mb-1'>stdout:</p>
                    <pre className='text-green-400 whitespace-pre-wrap text-xs leading-relaxed'>
                      {output.stdout}
                    </pre>
                  </div>
                )}
                {output.stderr && (
                  <div>
                    <p className='text-gray-500 text-xs mb-1'>stderr:</p>
                    <pre className='text-red-400 whitespace-pre-wrap text-xs leading-relaxed'>
                      {output.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {testResults && (
              <div className='mt-4 space-y-2 border-t border-gray-700 pt-4'>
                <p className='text-xs text-gray-400 font-semibold mb-2'>
                  Test cases: {testResults.passedCount} / {testResults.totalCount} passed
                </p>
                {testResults.results.map((r, i) => (
                  <div key={i}
                       className={`rounded-lg p-2.5 text-xs border
                                   ${r.passed
                                       ? 'bg-green-900/30 border-green-800'
                                       : 'bg-red-900/30 border-red-800'}`}
                  >
                    <div className='flex items-center justify-between mb-1'>
                      <span className={r.passed ? 'text-green-400' : 'text-red-400'}>
                        {r.passed ? '✓' : '✗'} {r.label}
                      </span>
                    </div>
                    {!r.passed && (
                      <div className='text-gray-400 space-y-0.5 mt-1'>
                        <p>Expected: <span className='text-gray-300'>{r.expected}</span></p>
                        <p>Got: <span className='text-gray-300'>{r.actual || '(no output)'}</span></p>
                        {r.error && <p className='text-red-400'>{r.error}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className='border-t border-gray-700 p-4 max-h-48 overflow-y-auto'>
            <p className='text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wide'>Task</p>
            <p className='text-xs text-gray-300 leading-relaxed'>{program.description}</p>
            {program.concepts?.length > 0 && (
              <div className='flex gap-1.5 mt-2 flex-wrap'>
                {program.concepts.map(c => (
                  <span key={c} className='text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full'>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showHints && (
        <HintPanel
          program={program}
          code={code}
          hintsUsed={hintsUsed}
          onHintUsed={() => setHintsUsed(prev => prev + 1)}
          onClose={() => setShowHints(false)}
        />
      )}
    </div>
  )
}
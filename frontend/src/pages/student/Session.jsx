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
    incrementHintsUsed, saveTestResults,
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
        studentId: user?.uid,  // Pass authenticated user ID to Quiz safely
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
      saveTestResults(result)   // FEATURE: persist test results to Firestore
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
    <div className='min-h-screen flex items-center justify-center bg-[#1e1e1e]'>
      <p className='text-gray-400 font-medium'>Loading session...</p>
    </div>
  )

  if (!program) return (
    <div className='min-h-screen flex items-center justify-center bg-[#1e1e1e]'>
      <p className='text-red-400 font-medium'>Program not found.</p>
    </div>
  )

  if (!isFullscreen) {
    return (
      <div className='min-h-screen bg-[#fcfaf5] flex items-center justify-center p-6'>
        <div className='max-w-md w-full bg-white border border-[#e2e8f0] rounded-xl p-8 text-center shadow-sm'>
          <h2 className='text-xl font-serif font-bold text-gray-900 mb-4'>
            Proctored Session
          </h2>

          <p className='text-gray-600 mb-8 text-sm leading-relaxed'>
            This coding session requires fullscreen mode.
            Leaving fullscreen, switching tabs, copying,
            or pasting will be recorded as violations.
          </p>

          <button
            onClick={enterFullscreen}
            className='w-full bg-[#4a6f55] hover:bg-[#3d5c46] text-white py-3 rounded-lg font-bold transition-colors'
          >
            Enter Fullscreen & Start Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='h-screen flex flex-col bg-[#1e1e1e] overflow-hidden pt-0'>
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
      <header className='flex items-center justify-between px-6 py-3 bg-[#252526] border-b border-[#3e3e42] flex-shrink-0'>
        <div className='flex items-center gap-4'>
          <button onClick={() => navigate('/student/programs')}
            className='text-gray-400 hover:text-white transition flex items-center gap-1'>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className='text-gray-100 font-serif font-bold text-base leading-tight'>{program.title}</h1>
            <p className='text-gray-400 text-[10px] uppercase tracking-wider font-bold mt-0.5'>
              {program.language?.toUpperCase() || 'PYTHON'} • {program.difficulty || 'easy'}
            </p>
          </div>
        </div>
        
        {/* Timer */}
        <div className='bg-[#333333] border border-[#3e3e42] text-gray-200 px-4 py-1.5 rounded-full shadow-sm flex items-center font-bold text-sm'>
          <SessionTimer elapsed={elapsed} isSaving={isSaving} />
        </div>
        
        <div className='flex items-center gap-3'>
          <button onClick={handleRun} disabled={isRunning}
            className='flex items-center gap-1.5 bg-[#4a6f55] hover:bg-[#3d5c46]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors'>
            <Play size={14} fill='currentColor' />
            {isRunning ? 'Running...' : 'Run'}
          </button>

          {program.testCases?.length > 0 && (
            <button
              onClick={handleRunTests}
              disabled={runningTests}
              className='flex items-center gap-1.5 bg-[#64748b] hover:bg-[#475569]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors'
            >
              {runningTests ? 'Checking...' : `Check (${program.testCases.length})`}
            </button>
          )}

          <button
            onClick={() => setShowHints(true)}
            disabled={hintsUsed >= (program?.hintLimit ?? 3)}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2
    rounded-lg transition-colors
    ${hintsUsed >= (program?.hintLimit ?? 3)
                ? 'bg-[#333333] text-gray-500 border border-[#3e3e42] cursor-not-allowed'
                : 'bg-[#252526] border border-[#3e3e42] hover:bg-[#333333] text-gray-300'
              }`}
          >
            <Lightbulb size={14} fill={hintsUsed >= (program?.hintLimit ?? 3) ? 'none' : '#eab308'} className={hintsUsed >= (program?.hintLimit ?? 3) ? '' : 'text-yellow-500'} />
            {hintsUsed >= (program?.hintLimit ?? 3)
              ? 'No hints'
              : `Hint (${(program?.hintLimit ?? 3) - hintsUsed} left)`}
          </button>
          <button onClick={handleSubmit}
            className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2
                               rounded-lg transition-colors
                               ${submitConfirm
                ? 'bg-[#f97316] hover:bg-[#ea580c] text-white'
                : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'}`}>
            <Send size={14} />
            {submitConfirm ? 'Confirm Submit' : 'Submit'}
          </button>
        </div>
      </header>

      {/* ── SPLIT LAYOUT ── */}
      <div className='flex flex-1 overflow-hidden flex-col md:flex-row'>

        {/* LEFT — Monaco Editor */}
        <div className='flex flex-col w-full md:w-[50%] h-1/2 md:h-full bg-[#1e1e1e]'>
          <div className='flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]'>
            <span className='text-xs text-gray-400 font-mono font-bold'>main.py</span>
            <span className="px-3 py-0.5 rounded bg-[#f43f5e] font-bold text-white text-xs shadow-sm">
              Violations: {violations.length}
            </span>
          </div>
          <div className='flex-1 pt-2'>
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

        <div className='hidden md:block w-px bg-[#3e3e42] flex-shrink-0' />

        {/* RIGHT — Output Panel */}
        <div className='flex flex-col bg-[#1e1e1e] w-full md:w-[50%] h-1/2 md:h-full'>
          <div className='flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3e3e42]'>
            <Terminal size={14} className='text-gray-400' />
            <span className='text-xs text-gray-300 font-bold'>Output</span>
            {output && (
              output.exitCode === 0
                ? <CheckCircle size={14} className='text-[#10b981] ml-auto' />
                : <XCircle size={14} className='text-[#f43f5e] ml-auto' />
            )}
          </div>
          <div className='flex-1 overflow-y-auto p-5 font-mono text-sm bg-[#1e1e1e]'>
            {!output && !isRunning && (
              <p className='text-gray-500 font-medium text-xs'>Click Run to execute your code.</p>
            )}
            {isRunning && (
              <div className='flex items-center gap-2 text-gray-400 font-medium text-xs'>
                <div className='w-3 h-3 border-2 border-gray-600 border-t-[#10b981]
                                rounded-full animate-spin' />
                Running...
              </div>
            )}
            {output && !isRunning && (
              <div className='space-y-4'>
                <p className='text-gray-400 text-xs font-bold'>
                  Finished in {output.tookMs}ms • Exit code {output.exitCode}
                </p>
                {output.stdout && (
                  <div>
                    <p className='text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold'>stdout:</p>
                    <pre className='text-gray-300 bg-[#252526] p-3 rounded-lg border border-[#3e3e42] whitespace-pre-wrap text-xs leading-relaxed'>
                      {output.stdout}
                    </pre>
                  </div>
                )}
                {output.stderr && (
                  <div>
                    <p className='text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold'>stderr:</p>
                    <pre className='text-[#f43f5e] bg-red-900/10 p-3 rounded-lg border border-red-900/30 whitespace-pre-wrap text-xs leading-relaxed'>
                      {output.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {testResults && (
              <div className='mt-6 space-y-3 border-t border-[#3e3e42] pt-5'>
                <p className='text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider'>
                  Test cases: {testResults.passedCount} / {testResults.totalCount} passed
                </p>
                {testResults.results.map((r, i) => (
                  <div key={i}
                       className={`rounded-lg p-3 text-xs border font-medium
                                   ${r.passed
                                       ? 'bg-[#10b981]/10 border-[#10b981]/30'
                                       : 'bg-[#f43f5e]/10 border-[#f43f5e]/30'}`}
                  >
                    <div className='flex items-center justify-between mb-1'>
                      <span className={`font-bold ${r.passed ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                        {r.passed ? '✓' : '✗'} {r.label}
                      </span>
                    </div>
                    {!r.passed && (
                      <div className='text-gray-400 space-y-1 mt-2'>
                        <p>Expected: <span className='text-gray-200 font-bold'>{r.expected}</span></p>
                        <p>Got: <span className='text-gray-200 font-bold'>{r.actual || '(no output)'}</span></p>
                        {r.error && <p className='text-[#f43f5e] mt-1'>{r.error}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* TASK PANEL */}
          <div className='border-t border-[#3e3e42] p-6 max-h-56 overflow-y-auto bg-[#252526]'>
            <p className='text-[11px] text-gray-500 font-bold mb-2 uppercase tracking-widest'>Task</p>
            <p className='text-[13px] text-gray-300 font-medium leading-relaxed'>{program.description}</p>
            {program.concepts?.length > 0 && (
              <div className='flex gap-2 mt-4 flex-wrap'>
                {program.concepts.map(c => (
                  <span key={c} className='text-xs bg-[#1e1e1e] border border-[#3e3e42] text-gray-300 px-3 py-1 rounded-full font-bold shadow-sm'>
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
          onHintUsed={() => {
            const next = hintsUsed + 1
            setHintsUsed(next)
            incrementHintsUsed(next)   // FIX BUG 9: persist immediately
          }}
          onClose={() => setShowHints(false)}
        />
      )}
    </div>
  )
}
// frontend/src/pages/student/UnderstandLogic.jsx
// "Crack the Logic" interactive learning page

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { generateExplainer, generateFlowchart, askChatbot } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  ChevronLeft, Lightbulb, Play, Lock, Check, 
  Loader2, AlertCircle, Puzzle, Blocks, TestTube, Code,
  MessageCircle, X, Send, ChevronDown
} from 'lucide-react'

export default function UnderstandLogic() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Step navigation (1-3)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: Puzzle scenario state
  const [puzzleData, setPuzzleData] = useState(null)
  const [puzzleLoading, setPuzzleLoading] = useState(false)
  
  // Step 2: Logic blocks state
  const [logicBlocks, setLogicBlocks] = useState([])
  const [arrangedBlocks, setArrangedBlocks] = useState([])
  const [draggedBlock, setDraggedBlock] = useState(null)
  
  // Step 3: Verification scenarios
  const [scenarios, setScenarios] = useState([])
  const [scenarioState, setScenarioState] = useState({}) // {0: 'idle'|'running'|'pass'|'fail'}
  
  // Feature 1: Algorithm in Words
  const [algorithmSteps, setAlgorithmSteps] = useState([])
  const [algorithmLoading, setAlgorithmLoading] = useState(false)
  const [algorithmError, setAlgorithmError] = useState(null)
  const [visibleAlgorithmSteps, setVisibleAlgorithmSteps] = useState([])
  
  // Feature 2: Logic Flow Simulator
  const [flowchartNodes, setFlowchartNodes] = useState([])
  const [flowchartVariables, setFlowchartVariables] = useState([])
  const [flowchartLoading, setFlowchartLoading] = useState(false)
  const [visibleNodes, setVisibleNodes] = useState([])
  const [flowchartError, setFlowchartError] = useState(null)
  
  // Feature 3: Floating Chatbot
  const [chatOpen, setChatOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([]) // [{ role: 'user'|'assistant', content: string }]
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false)
  
  const scenarioTimeoutRef = useRef({})
  const flowchartTimeoutRef = useRef([])
  const algorithmTimeoutRef = useRef([])
  const chatEndRef = useRef(null)

  // Theme classes - dark purple design
  const t = {
    dark: {
      bg: 'bg-[#15142a]',
      text: 'text-white',
      textMuted: 'text-gray-400',
      cardBg: 'bg-[#1f1e3a]',
      cardBorder: 'border-white/10',
      inputBg: 'bg-[#15142a]',
      inputBorder: 'border-white/10',
      inputFocus: 'focus:border-[#2DD4BF]',
      accentText: 'text-[#2DD4BF]',
      accentBg: 'bg-[#2DD4BF]',
      accentHover: 'hover:bg-[#14B8A6]',
      blockBg: 'bg-[#2a2847]',
      blockHover: 'hover:bg-[#352f5c]',
      successBg: 'bg-green-500/20',
      successBorder: 'border-green-500/50',
      successText: 'text-green-400',
      errorBg: 'bg-red-500/20',
      errorBorder: 'border-red-500/50',
      errorText: 'text-red-400'
    },
    light: {
      bg: 'bg-[#f5f3ff]',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      cardBg: 'bg-white',
      cardBorder: 'border-gray-200',
      inputBg: 'bg-gray-50',
      inputBorder: 'border-gray-300',
      inputFocus: 'focus:border-[#2DD4BF]',
      accentText: 'text-[#0d9488]',
      accentBg: 'bg-[#2DD4BF]',
      accentHover: 'hover:bg-[#14B8A6]',
      blockBg: 'bg-gray-100',
      blockHover: 'hover:bg-gray-200',
      successBg: 'bg-green-50',
      successBorder: 'border-green-200',
      successText: 'text-green-600',
      errorBg: 'bg-red-50',
      errorBorder: 'border-red-200',
      errorText: 'text-red-600'
    }
  }[theme]

  // Load program on mount
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'programs', programId))
        if (!snap.exists()) {
          setError('Program not found')
          setLoading(false)
          return
        }
        
        const prog = { id: snap.id, ...snap.data() }
        setProgram(prog)
        
        // Load explainer data for Steps 1 & 2 and Feature 1
        await loadPuzzleAndBlocks(prog)
        
        // Load flowchart data for Feature 2
        await loadFlowchart(prog)
        
        // Load scenarios from testCases for Step 3
        if (prog.testCases && prog.testCases.length > 0) {
          const scenarioList = prog.testCases.slice(0, 3).map((tc, idx) => ({
            id: idx,
            input: tc.input || 'N/A',
            expected: tc.expected || 'N/A',
            description: tc.description || `Test case ${idx + 1}`
          }))
          setScenarios(scenarioList)
        } else {
          // Fallback scenarios
          setScenarios([
            { id: 0, input: 'Sample input 1', expected: 'Expected output 1', description: 'Basic test' },
            { id: 1, input: 'Sample input 2', expected: 'Expected output 2', description: 'Edge case' }
          ])
        }
        
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    
    // Cleanup timeouts on unmount
    return () => {
      Object.values(scenarioTimeoutRef.current).forEach(id => clearTimeout(id))
      flowchartTimeoutRef.current.forEach(id => clearTimeout(id))
      algorithmTimeoutRef.current.forEach(id => clearTimeout(id))
    }
  }, [programId])

  async function loadPuzzleAndBlocks(prog) {
    setPuzzleLoading(true)
    setAlgorithmLoading(true)
    setAlgorithmError(null)
    try {
      const result = await generateExplainer(
        prog.title,
        prog.description,
        prog.concepts || []
      )
      
      // Use the returned steps to create puzzle and blocks
      if (result.steps && result.steps.length > 0) {
        // Step 1 puzzle: derive from first step or general description
        setPuzzleData({
          headline: `Understand: ${prog.title}`,
          subtext: result.steps[0]?.narration || prog.description
        })
        
        // Step 2 logic blocks: each step becomes a draggable block
        const blocks = result.steps.map((step, idx) => ({
          id: `block-${idx}`,
          label: step.title || `Step ${idx + 1}`,
          correctOrder: idx
        }))
        setLogicBlocks(blocks)
        
        // Feature 1: Algorithm steps
        setAlgorithmSteps(result.steps)
        
        // Staggered animation for algorithm steps
        result.steps.forEach((_, idx) => {
          const timeoutId = setTimeout(() => {
            setVisibleAlgorithmSteps(prev => [...prev, idx])
          }, idx * 150)
          algorithmTimeoutRef.current.push(timeoutId)
        })
      } else {
        // Fallback
        setPuzzleData({
          headline: `Crack the Logic: ${prog.title}`,
          subtext: prog.description
        })
        setLogicBlocks([
          { id: 'block-0', label: 'Initialize variables', correctOrder: 0 },
          { id: 'block-1', label: 'Process input', correctOrder: 1 },
          { id: 'block-2', label: 'Return result', correctOrder: 2 }
        ])
        setAlgorithmSteps([])
      }
    } catch (err) {
      console.error('Failed to load explainer:', err)
      setAlgorithmError(err.message)
      // Use fallback on error
      setPuzzleData({
        headline: `Crack the Logic: ${prog.title}`,
        subtext: prog.description
      })
      setLogicBlocks([
        { id: 'block-0', label: 'Initialize variables', correctOrder: 0 },
        { id: 'block-1', label: 'Process input', correctOrder: 1 },
        { id: 'block-2', label: 'Return result', correctOrder: 2 }
      ])
      setAlgorithmSteps([])
    } finally {
      setPuzzleLoading(false)
      setAlgorithmLoading(false)
    }
  }

  // Step 2: Handle block arrangement
  function handleBlockClick(block) {
    if (arrangedBlocks.find(b => b.id === block.id)) {
      // Remove from arranged
      setArrangedBlocks(prev => prev.filter(b => b.id !== block.id))
    } else {
      // Add to arranged
      setArrangedBlocks(prev => [...prev, block])
    }
  }

  function resetArrangement() {
    setArrangedBlocks([])
  }

  // Step 3: Run scenario animation
  function runScenario(scenarioId) {
    setScenarioState(prev => ({ ...prev, [scenarioId]: 'running' }))
    
    // Clear any existing timeout for this scenario
    if (scenarioTimeoutRef.current[scenarioId]) {
      clearTimeout(scenarioTimeoutRef.current[scenarioId])
    }
    
    // Simulate test run with timeout cleanup
    const timeoutId = setTimeout(() => {
      const passed = Math.random() > 0.3 // 70% pass rate for demo
      setScenarioState(prev => ({ ...prev, [scenarioId]: passed ? 'pass' : 'fail' }))
      delete scenarioTimeoutRef.current[scenarioId]
    }, 2000)
    
    scenarioTimeoutRef.current[scenarioId] = timeoutId
  }

  // Step navigation
  function canAdvanceToStep(step) {
    if (step === 2) return true // Can always go to step 2
    if (step === 3) return arrangedBlocks.length === logicBlocks.length // Must arrange all blocks
    return true
  }
  
  // Check if all scenarios pass (to enable Code tab)
  function allScenariosPass() {
    return scenarios.length > 0 && scenarios.every(s => scenarioState[s.id] === 'pass')
  }

  function goToStep(step) {
    if (step <= currentStep || canAdvanceToStep(step)) {
      setCurrentStep(step)
    }
  }

  // Feature 2: Load flowchart
  async function loadFlowchart(prog) {
    setFlowchartLoading(true)
    setFlowchartError(null)
    try {
      const result = await generateFlowchart(
        prog.title,
        prog.description,
        prog.concepts || [],
        prog.starterCode || ''
      )
      
      setFlowchartNodes(result.nodes || [])
      setFlowchartVariables(result.variables || [])
      
      // Staggered animation for flowchart nodes
      if (result.nodes && result.nodes.length > 0) {
        result.nodes.forEach((_, idx) => {
          const timeoutId = setTimeout(() => {
            setVisibleNodes(prev => [...prev, idx])
          }, idx * 600)
          flowchartTimeoutRef.current.push(timeoutId)
        })
      }
    } catch (err) {
      console.error('Failed to load flowchart:', err)
      setFlowchartError(err.message)
    } finally {
      setFlowchartLoading(false)
    }
  }

  function replayFlowchart() {
    // Clear existing timeouts
    flowchartTimeoutRef.current.forEach(id => clearTimeout(id))
    flowchartTimeoutRef.current = []
    
    // Reset and replay
    setVisibleNodes([])
    flowchartNodes.forEach((_, idx) => {
      const timeoutId = setTimeout(() => {
        setVisibleNodes(prev => [...prev, idx])
      }, idx * 600)
      flowchartTimeoutRef.current.push(timeoutId)
    })
  }

  // Feature 3: Chat functions
  async function handleChatSubmit(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    
    const userMessage = chatInput.trim()
    setChatInput('')
    
    // Add user message to history
    const newHistory = [...chatHistory, { role: 'user', content: userMessage }]
    setChatHistory(newHistory)
    setChatLoading(true)
    
    try {
      const result = await askChatbot(
        program.title,
        program.description,
        program.concepts || [],
        newHistory,
        userMessage
      )
      
      // Add assistant response
      const updatedHistory = [...newHistory, { role: 'assistant', content: result.answer }]
      setChatHistory(updatedHistory)
      
      // Set unread indicator if chat is closed
      if (!chatOpen) {
        setHasUnreadMessage(true)
      }
      
      // Scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error('Chat error:', err)
      const errorHistory = [...newHistory, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }]
      setChatHistory(errorHistory)
    } finally {
      setChatLoading(false)
    }
  }

  function toggleChat() {
    setChatOpen(prev => !prev)
    if (!chatOpen) {
      setHasUnreadMessage(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
        <div className='flex items-center gap-2'>
          <Loader2 className={`${t.accentText} animate-spin`} size={24} />
          <p className={t.textMuted}>Loading program...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !program) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
        <div className={`${t.cardBg} ${t.cardBorder} border rounded-xl p-8 text-center`}>
          <AlertCircle className={t.errorText} size={32} />
          <p className={`${t.errorText} mt-2`}>{error || 'Program not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} py-8 px-4 transition-colors duration-300`}
         style={{ fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif' }}>
      <div className='max-w-5xl mx-auto'>

        {/* Back button */}
        <button
          onClick={() => navigate('/student/programs')}
          className={`flex items-center gap-1 ${t.textMuted} hover:${t.text}
                     text-sm mb-6 transition-colors`}
        >
          <ChevronLeft size={16} /> Back to programs
        </button>

        {/* Header with ghost mascot */}
        <div className='relative mb-8'>
          <div className='flex items-start gap-4'>
            <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl p-6 flex-1`}
                 style={{ borderRadius: '14px' }}>
              <div className='flex items-center gap-2 mb-2'>
                <Lightbulb className={t.accentText} size={20} />
                <h1 className='text-2xl font-bold' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Crack the Logic
                </h1>
              </div>
              <p className={`${t.textMuted} text-sm mb-1`}>{program.title}</p>
              <p className={`${t.textMuted} text-xs`}>{program.description}</p>
            </div>
            
            {/* Ghost mascot with float animation */}
            <div className='text-5xl animate-float'>
              👻
            </div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl p-4 mb-6`}
             style={{ borderRadius: '14px' }}>
          <div className='flex items-center justify-between gap-2'>
            {[
              { num: 1, icon: Puzzle, label: 'Puzzle', locked: false },
              { num: 2, icon: Blocks, label: 'Arrange Logic', locked: false },
              { num: 3, icon: TestTube, label: 'Verify', locked: !canAdvanceToStep(3) },
              { num: 4, icon: Code, label: 'Algorithm', locked: false, isFeature: 'algorithm' },
              { num: 5, icon: Lightbulb, label: 'Flow', locked: false, isFeature: 'flowchart' },
              { num: 6, icon: Code, label: 'Code', locked: !allScenariosPass(), isExternal: true }
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => {
                  if (step.isExternal && !step.locked) {
                    navigate(`/student/session/${programId}`)
                  } else if (step.isFeature) {
                    setCurrentStep(step.num)
                  } else if (step.num <= 3) {
                    goToStep(step.num)
                  }
                }}
                disabled={step.locked && step.num > currentStep}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-lg
                           transition-all duration-200 text-xs sm:text-sm font-medium
                           ${currentStep === step.num && !step.isExternal
                             ? `${t.accentBg} text-white shadow-lg` 
                             : step.locked && step.num > currentStep
                             ? `${t.blockBg} ${t.textMuted} cursor-not-allowed opacity-50`
                             : `${t.blockBg} ${t.text} ${t.blockHover} cursor-pointer`
                           }`}
                style={{ borderRadius: '8px' }}
              >
                {step.locked && step.num > currentStep ? (
                  <Lock size={14} />
                ) : (
                  <step.icon size={14} />
                )}
                <span className='hidden sm:inline'>{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl p-6 min-h-[400px]`}
             style={{ borderRadius: '14px' }}>
          
          {/* STEP 1: Puzzle Scenario */}
          {currentStep === 1 && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <Puzzle className={t.accentText} size={20} />
                <h2 className='text-xl font-semibold' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Step 1: The Puzzle
                </h2>
              </div>
              
              {puzzleLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className={`${t.accentText} animate-spin`} size={24} />
                </div>
              ) : puzzleData ? (
                <div className={`${t.inputBg} border ${t.inputBorder} rounded-lg p-6`}
                     style={{ borderRadius: '12px' }}>
                  <h3 className='text-lg font-semibold mb-3'>{puzzleData.headline}</h3>
                  <p className={`${t.textMuted} text-sm leading-relaxed`}>{puzzleData.subtext}</p>
                </div>
              ) : (
                <p className={t.textMuted}>No puzzle data available</p>
              )}
              
              <button
                onClick={() => goToStep(2)}
                className={`mt-6 ${t.accentBg} ${t.accentHover} text-white px-6 py-3
                           rounded-lg font-medium transition-colors flex items-center gap-2`}
                style={{ borderRadius: '8px' }}
              >
                Next: Arrange the Logic
              </button>
            </div>
          )}

          {/* STEP 2: Arrange Logic Blocks */}
          {currentStep === 2 && (
            <div>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <Blocks className={t.accentText} size={20} />
                  <h2 className='text-xl font-semibold' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Step 2: Arrange the Logic
                  </h2>
                </div>
                <button
                  onClick={resetArrangement}
                  className={`text-sm ${t.textMuted} hover:${t.text} transition-colors`}
                >
                  Reset
                </button>
              </div>
              
              <p className={`${t.textMuted} text-sm mb-4`}>
                Click the blocks below to arrange them in the correct order
              </p>
              
              {/* Arranged blocks area */}
              <div className={`${t.inputBg} border-2 border-dashed ${t.inputBorder} rounded-lg p-4 mb-4 min-h-[120px]`}
                   style={{ borderRadius: '12px' }}>
                {arrangedBlocks.length === 0 ? (
                  <p className={`${t.textMuted} text-center text-sm py-8`}>
                    Click blocks below to build the logic flow
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {arrangedBlocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className={`${t.blockBg} border ${t.cardBorder} px-4 py-2 rounded-lg
                                   text-sm font-medium flex items-center gap-2 cursor-pointer
                                   ${t.blockHover} transition-colors`}
                        onClick={() => handleBlockClick(block)}
                        style={{ borderRadius: '8px', fontFamily: 'Inter, sans-serif' }}
                      >
                        <span className={`${t.accentText} text-xs font-bold`}>{idx + 1}</span>
                        {block.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Available blocks palette */}
              <div className='space-y-2'>
                <p className={`${t.textMuted} text-xs font-medium mb-2`}>AVAILABLE BLOCKS:</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {logicBlocks.map((block) => {
                    const isUsed = arrangedBlocks.find(b => b.id === block.id)
                    return (
                      <button
                        key={block.id}
                        onClick={() => handleBlockClick(block)}
                        className={`${isUsed ? t.inputBg : t.blockBg} border ${t.cardBorder}
                                   px-4 py-3 rounded-lg text-sm font-medium text-left
                                   transition-all duration-200
                                   ${isUsed ? 'opacity-50' : `${t.blockHover} hover:scale-[1.02]`}`}
                        style={{ borderRadius: '8px', fontFamily: 'Inter, sans-serif' }}
                      >
                        {block.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <button
                onClick={() => goToStep(3)}
                disabled={!canAdvanceToStep(3)}
                className={`mt-6 px-6 py-3 rounded-lg font-medium transition-colors
                           flex items-center gap-2
                           ${canAdvanceToStep(3)
                             ? `${t.accentBg} ${t.accentHover} text-white`
                             : `${t.blockBg} ${t.textMuted} cursor-not-allowed`
                           }`}
                style={{ borderRadius: '8px' }}
              >
                {canAdvanceToStep(3) ? 'Next: Verify Scenarios' : 'Arrange all blocks to continue'}
              </button>
            </div>
          )}

          {/* STEP 3: Verify Scenarios */}
          {currentStep === 3 && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <TestTube className={t.accentText} size={20} />
                <h2 className='text-xl font-semibold' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Step 3: Verify Your Logic
                </h2>
              </div>
              
              <p className={`${t.textMuted} text-sm mb-4`}>
                Run each scenario to verify the logic works correctly
              </p>
              
              <div className='space-y-3'>
                {scenarios.map((scenario) => {
                  const state = scenarioState[scenario.id] || 'idle'
                  return (
                    <div
                      key={scenario.id}
                      className={`${t.blockBg} border ${t.cardBorder} rounded-lg p-4
                                 ${state === 'pass' ? `${t.successBg} ${t.successBorder}` : ''}
                                 ${state === 'fail' ? `${t.errorBg} ${t.errorBorder}` : ''}`}
                      style={{ borderRadius: '12px' }}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex-1'>
                          <p className='font-medium text-sm mb-1'>{scenario.description}</p>
                          <p className={`${t.textMuted} text-xs`}>
                            Input: <code className='font-mono'>{scenario.input}</code> → 
                            Expected: <code className='font-mono'>{scenario.expected}</code>
                          </p>
                        </div>
                        
                        {state === 'idle' && (
                          <button
                            onClick={() => runScenario(scenario.id)}
                            className={`${t.accentBg} ${t.accentHover} text-white px-4 py-2
                                       rounded-lg text-sm font-medium flex items-center gap-1
                                       transition-colors`}
                            style={{ borderRadius: '6px' }}
                          >
                            <Play size={14} />
                            Run
                          </button>
                        )}
                        
                        {state === 'running' && (
                          <div className='flex items-center gap-2'>
                            <Loader2 className={t.accentText} size={16} className='animate-spin' />
                            <span className={`${t.textMuted} text-sm`}>Running...</span>
                          </div>
                        )}
                        
                        {state === 'pass' && (
                          <div className='flex items-center gap-1'>
                            <Check className={t.successText} size={20} />
                            <span className={`${t.successText} text-sm font-medium`}>Pass</span>
                          </div>
                        )}
                        
                        {state === 'fail' && (
                          <div className='flex items-center gap-1'>
                            <AlertCircle className={t.errorText} size={20} />
                            <span className={`${t.errorText} text-sm font-medium`}>Failed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <button
                onClick={() => navigate(`/student/session/${programId}`)}
                disabled={!allScenariosPass()}
                className={`mt-6 px-6 py-3 rounded-lg font-medium transition-colors
                           flex items-center gap-2
                           ${allScenariosPass()
                             ? `${t.accentBg} ${t.accentHover} text-white`
                             : `${t.blockBg} ${t.textMuted} cursor-not-allowed`
                           }`}
                style={{ borderRadius: '8px' }}
              >
                {allScenariosPass() ? 'Start Coding Session →' : 'Pass all scenarios to continue'}
              </button>
            </div>
          )}
          
          {/* STEP 4: Algorithm in Words */}
          {currentStep === 4 && (
            <div>
              <h2 className='text-xl font-bold mb-6' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Algorithm
              </h2>
              
              {algorithmLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className={`${t.accentText} animate-spin`} size={24} />
                </div>
              ) : algorithmError ? (
                <div className={`${t.errorBg} border ${t.errorBorder} rounded-lg p-4`}>
                  <div className='flex items-center gap-2 mb-2'>
                    <AlertCircle className={t.errorText} size={20} />
                    <p className={`${t.errorText} font-semibold`}>Failed to load algorithm</p>
                  </div>
                  <p className={`${t.textMuted} text-sm`}>{algorithmError}</p>
                </div>
              ) : algorithmSteps.length === 0 ? (
                <p className={t.textMuted}>No algorithm steps available</p>
              ) : (
                <div className={`${t.inputBg} border ${t.inputBorder} rounded-lg p-6`}
                     style={{ borderRadius: '12px' }}>
                  <div className='space-y-2'>
                    {algorithmSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`transition-all duration-500 ${
                          visibleAlgorithmSteps.includes(idx)
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                        }`}
                      >
                        <div className={`flex items-center gap-3 py-2 ${
                          step.isBranch ? 'ml-10' : ''
                        }`}>
                          {step.isBranch ? (
                            <div className='flex items-center gap-2 flex-shrink-0'>
                              <span className={`${t.textMuted} text-sm`}>↳</span>
                            </div>
                          ) : (
                            <div
                              className={`${t.accentBg} text-white flex items-center justify-center
                                         rounded-md text-sm font-bold flex-shrink-0`}
                              style={{ 
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                fontFamily: 'monospace'
                              }}
                            >
                              {step.stepNumber}
                            </div>
                          )}
                          <p className={`${t.text} text-base`}
                             style={{ fontFamily: 'Inter, monospace' }}>
                            {step.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* STEP 5: Logic Flow Simulator */}
          {currentStep === 5 && (
            <div>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Logic Flow Simulator
                </h2>
                {flowchartNodes.length > 0 && visibleNodes.length === flowchartNodes.length && (
                  <button
                    onClick={replayFlowchart}
                    className={`${t.accentText} hover:${t.text} text-sm font-medium flex items-center gap-1
                               transition-colors`}
                  >
                    <Play size={14} /> Replay
                  </button>
                )}
              </div>
              
              {flowchartLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className={`${t.accentText} animate-spin`} size={24} />
                </div>
              ) : flowchartError ? (
                <div className={`${t.errorBg} border ${t.errorBorder} rounded-lg p-4`}>
                  <p className={`${t.errorText} text-sm`}>Failed to load flowchart: {flowchartError}</p>
                </div>
              ) : flowchartNodes.length === 0 ? (
                <p className={t.textMuted}>No flowchart data available</p>
              ) : (
                <div className='flex flex-col items-center space-y-6 py-8'>
                  {flowchartNodes.map((node, idx) => {
                    const isVisible = visibleNodes.includes(idx)
                    const nodeColor = 
                      node.type === 'start' || node.type === 'end' ? '#2DD4BF' :
                      node.type === 'process' ? '#A78BFA' :
                      node.type === 'decision' ? '#FBBF24' :
                      node.type === 'output' ? '#34D399' : '#9CA3AF'
                    
                    return (
                      <div key={node.id} className='flex flex-col items-center'>
                        {/* Node */}
                        <div
                          className={`transition-all duration-500 ${
                            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-85'
                          }`}
                        >
                          {node.type === 'decision' ? (
                            <div
                              className='relative flex items-center justify-center'
                              style={{
                                width: '160px',
                                height: '80px',
                                transform: 'rotate(45deg)',
                                backgroundColor: nodeColor,
                                opacity: 0.9,
                                borderRadius: '8px'
                              }}
                            >
                              <p
                                className='text-white text-xs font-medium text-center px-2'
                                style={{ transform: 'rotate(-45deg)', maxWidth: '100px' }}
                              >
                                {node.label}
                              </p>
                            </div>
                          ) : (
                            <div
                              className='flex items-center justify-center px-6 py-4'
                              style={{
                                backgroundColor: nodeColor,
                                opacity: 0.9,
                                borderRadius: node.type === 'start' || node.type === 'end' ? '40px' : '12px',
                                minWidth: '180px',
                                minHeight: '60px'
                              }}
                            >
                              <p className='text-white text-sm font-medium text-center font-mono'>
                                {node.label}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Arrow */}
                        {idx < flowchartNodes.length - 1 && (
                          <div
                            className={`transition-all duration-300 ${
                              isVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <ChevronDown className={t.accentText} size={32} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Variable Tracker */}
                  {flowchartVariables.length > 0 && visibleNodes.length > 0 && (
                    <div className={`${t.blockBg} border ${t.cardBorder} rounded-lg p-4 w-full max-w-md mt-8`}
                         style={{ borderRadius: '12px' }}>
                      <p className={`${t.textMuted} text-xs font-medium mb-3`}>VARIABLES:</p>
                      <div className='grid grid-cols-2 gap-3'>
                        {flowchartVariables.map((varName, idx) => (
                          <div key={idx} className={`${t.inputBg} rounded px-3 py-2`}>
                            <p className='text-xs text-gray-500 font-mono'>{varName}</p>
                            <p className={`${t.text} font-mono font-bold`}>
                              {idx === 0 ? visibleNodes.length : Math.floor(Math.random() * 100)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* FEATURE 3: Floating Chatbot */}
      {program && (
        <>
          {/* Chat Panel */}
          {chatOpen && (
            <div
              className={`fixed bottom-24 right-6 ${t.cardBg} border-2 ${t.cardBorder} rounded-xl shadow-2xl
                         backdrop-blur-lg z-50 flex flex-col overflow-hidden transition-all duration-300
                         ease-out`}
              style={{
                width: 'min(320px, 90vw)',
                height: '480px',
                maxHeight: '80vh',
                borderRadius: '14px',
                transformOrigin: 'bottom right',
                animation: 'scaleIn 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              {/* Header */}
              <div className={`${t.blockBg} px-4 py-3 flex items-center justify-between border-b ${t.cardBorder}`}>
                <div className='flex items-center gap-2'>
                  <span>👻</span>
                  <h3 className='font-semibold text-sm' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Ask about {program.title}
                  </h3>
                </div>
                <button
                  onClick={toggleChat}
                  className={`${t.textMuted} hover:${t.text} transition-colors`}
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                {chatHistory.length === 0 && (
                  <p className={`${t.textMuted} text-sm text-center py-8`}>
                    Ask me anything about this program!
                  </p>
                )}
                
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? `${t.accentBg} text-white`
                          : `${t.blockBg} ${t.text}`
                      }`}
                      style={{ borderRadius: '12px', fontFamily: 'Inter, sans-serif' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className='flex justify-start'>
                    <div className={`${t.blockBg} px-3 py-2 rounded-lg`}>
                      <Loader2 className={t.accentText} size={16} className='animate-spin' />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* Input */}
              <form onSubmit={handleChatSubmit} className={`p-3 border-t ${t.cardBorder}`}>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder='Type your question...'
                    className={`flex-1 ${t.inputBg} border ${t.inputBorder} ${t.inputFocus}
                               ${t.text} rounded-lg px-3 py-2 text-sm outline-none transition-colors`}
                    disabled={chatLoading}
                    style={{ borderRadius: '8px' }}
                  />
                  <button
                    type='submit'
                    disabled={chatLoading || !chatInput.trim()}
                    className={`${t.accentBg} ${t.accentHover} text-white p-2 rounded-lg
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ borderRadius: '8px' }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Chat Button */}
          <button
            onClick={toggleChat}
            className={`fixed bottom-6 right-6 ${t.accentBg} ${t.accentHover} text-white
                       w-14 h-14 rounded-full flex items-center justify-center shadow-2xl
                       transition-all duration-300 z-50 hover:scale-110`}
          >
            <MessageCircle size={24} />
            {hasUnreadMessage && (
              <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse' />
            )}
          </button>
        </>
      )}
      
      {/* Add ghost float animation and chat scale-in animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

// frontend/src/pages/student/UnderstandLogic.jsx
// Redesigned "Understand Logic" interactive learning page

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { generateExplainer, generateFlowchart, askChatbot } from '../../services/api'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  ArrowLeft, Clock, Code, Brain, Send, Loader2, CheckCircle2, ChevronDown, Check
} from 'lucide-react'

export default function UnderstandLogic() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // AI Explainer State
  const [puzzleData, setPuzzleData] = useState(null)
  const [algorithmSteps, setAlgorithmSteps] = useState([])
  const [explainerLoading, setExplainerLoading] = useState(true)
  
  // Flowchart State
  const [flowchartNodes, setFlowchartNodes] = useState([])
  const [flowchartLoading, setFlowchartLoading] = useState(true)
  const [visibleNodes, setVisibleNodes] = useState([])
  
  // Chatbot State
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  
  const flowchartTimeoutRef = useRef([])

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
        
        loadExplainer(prog)
        loadFlowchartData(prog)
        
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    
    return () => {
      flowchartTimeoutRef.current.forEach(id => clearTimeout(id))
    }
  }, [programId])

  async function loadExplainer(prog) {
    setExplainerLoading(true)
    try {
      const result = await generateExplainer(
        prog.title,
        prog.description,
        prog.concepts || []
      )
      
      if (result.steps && result.steps.length > 0) {
        setPuzzleData({
          headline: `What it's asking`,
          subtext: result.steps[0]?.narration || prog.description
        })
        setAlgorithmSteps(result.steps)
      } else {
        setPuzzleData({
          headline: `What it's asking`,
          subtext: prog.description
        })
        setAlgorithmSteps([])
      }
    } catch (err) {
      console.error('Failed to load explainer:', err)
      setPuzzleData({ headline: `What it's asking`, subtext: prog.description })
    } finally {
      setExplainerLoading(false)
    }
  }

  async function loadFlowchartData(prog) {
    setFlowchartLoading(true)
    try {
      const result = await generateFlowchart(
        prog.title,
        prog.description,
        prog.concepts || [],
        prog.starterCode || ''
      )
      
      setFlowchartNodes(result.nodes || [])
      
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
    } finally {
      setFlowchartLoading(false)
    }
  }

  async function handleChatSubmit(e, overrideText = null) {
    if (e) e.preventDefault()
    const textToSend = overrideText || chatInput
    if (!textToSend.trim() || chatLoading) return
    
    setChatInput('')
    
    const newHistory = [...chatHistory, { role: 'user', content: textToSend.trim() }]
    setChatHistory(newHistory)
    setChatLoading(true)
    
    try {
      const result = await askChatbot(
        program.title,
        program.description,
        program.concepts || [],
        newHistory,
        textToSend.trim()
      )
      
      const updatedHistory = [...newHistory, { role: 'assistant', content: result.answer }]
      setChatHistory(updatedHistory)
      
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error('Chat error:', err)
      setChatHistory([...newHistory, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#121212]' : 'bg-[#fcfaf5]'} flex items-center justify-center transition-colors duration-300`}>
        <Loader2 className='text-[#4a6f55] animate-spin' size={32} />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className={`min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-[#fcfaf5] text-gray-900'} flex items-center justify-center transition-colors duration-300`}>
        <p className='text-red-500 font-semibold'>{error || 'Program not found'}</p>
      </div>
    )
  }

  return (
    <div className={`min-h-[calc(100vh-80px)] ${theme === 'dark' ? 'bg-[#121212] text-gray-100' : 'bg-[#fcfaf5] text-[#171717]'} pb-12 transition-colors duration-300`}>
      
      {/* Top Header */}
      <div className={`flex items-center justify-between px-8 py-5 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} bg-transparent`}>
          <div className='flex items-center gap-4'>
              <button onClick={() => navigate('/student/programs')} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
                 <ArrowLeft size={16} /> Back to Program
              </button>
              <div className={`h-4 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <h2 className={`text-lg font-serif font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                 {program?.concepts?.[0] || 'Python'} • {program?.title}
              </h2>
          </div>
          <div className={`flex items-center gap-4 text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className={`px-3 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                 {program?.difficulty || 'Easy'}
              </span>
              <span className='flex items-center gap-1'><Clock size={14}/> 15 min</span>
              <span className='flex items-center gap-1'><Code size={14}/> Python</span>
          </div>
      </div>

      <div className='max-w-[1400px] mx-auto px-8 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
             
             {/* Left Column (takes 2/3) */}
             <div className='lg:col-span-2 space-y-6'>
                
                {/* Program Description Block */}
                <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-[#fcfaf5] border-[#e2e8f0]'} rounded-[20px] p-8 shadow-sm border`}>
                   <h1 className='text-2xl font-serif font-bold mb-4'>{program.title}</h1>
                   <div className={`text-sm leading-relaxed mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {program.description}
                   </div>
                   
                   {/* Dummy Math Block if it's Fibonacci for exact mock match, else generic */}
                   {program.title.toLowerCase().includes('fibonacci') && (
                      <div className={`${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-[#f4f1ea]'} rounded-xl p-6 mb-6 font-mono text-sm`}>
                         <p>F(0) = 0, F(1) = 1</p>
                         <p>F(n) = F(n - 1) + F(n - 2), for n {'>'} 1.</p>
                      </div>
                   )}
                   
                   <div className='flex gap-2 mt-6'>
                      {program.concepts?.map(concept => (
                         <span key={concept} className={`px-4 py-1.5 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {concept}
                         </span>
                      ))}
                   </div>
                </div>

                {/* What it's asking */}
                <div className={`${theme === 'dark' ? 'bg-[#233329] border-[#2e4738]' : 'bg-[#eaf4ed] border-[#cce3d5]'} rounded-[20px] p-6 shadow-sm border flex gap-4`}>
                   <div className='shrink-0 w-10 h-10 rounded-full bg-[#4a6f55] flex items-center justify-center text-white'>
                      <Brain size={20} />
                   </div>
                   <div>
                      <h3 className={`text-lg font-serif font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-[#2e4738]'}`}>What it's asking</h3>
                      {explainerLoading ? (
                         <div className='flex items-center gap-2 text-sm text-[#4a6f55]'><Loader2 className='animate-spin' size={16}/> Analyzing problem...</div>
                      ) : (
                         <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-[#3d5c46]'}`}>
                            {puzzleData?.subtext}
                         </p>
                      )}
                   </div>
                </div>

                {/* Visual Logic Flow */}
                <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-[#fcfaf5] border-[#e2e8f0]'} rounded-[20px] p-8 shadow-sm border`}>
                   <h3 className='text-lg font-serif font-bold mb-6 flex items-center gap-2'>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4a6f55]"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
                      Visual Logic Flow
                   </h3>
                   
                   <div className={`${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-[#f4f1ea]'} rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden`}>
                      {flowchartLoading ? (
                         <Loader2 className='animate-spin text-[#4a6f55]' size={32}/>
                      ) : (
                         <div className='flex flex-col items-center space-y-4'>
                           {flowchartNodes.map((node, idx) => {
                             const isVisible = visibleNodes.includes(idx)
                             const isDiamond = node.type === 'decision'
                             const bgClass = isDiamond ? 'bg-[#fce3ce] text-[#8b5a2b]' : 'bg-[#4a6f55] text-white'
                             const diamondStyle = isDiamond ? { width: '120px', height: '120px', transform: 'rotate(45deg)' } : {}
                             const textStyle = isDiamond ? { transform: 'rotate(-45deg)', maxWidth: '100px' } : {}

                             return (
                               <div key={node.id} className='flex flex-col items-center'>
                                 <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                    {isDiamond ? (
                                      <div className={`relative flex items-center justify-center border border-[#e6c1a1] rounded-md ${bgClass}`} style={diamondStyle}>
                                        <p className='text-xs font-bold text-center' style={textStyle}>{node.label}</p>
                                      </div>
                                    ) : (
                                      <div className={`px-6 py-3 rounded-full font-bold text-sm text-center shadow-sm ${bgClass}`} style={{ minWidth: '160px' }}>
                                        {node.label}
                                      </div>
                                    )}
                                 </div>
                                 {idx < flowchartNodes.length - 1 && (
                                    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 h-8' : 'opacity-0 h-0'} flex items-center justify-center w-full`}>
                                      <div className='w-px h-full bg-gray-400'></div>
                                    </div>
                                 )}
                               </div>
                             )
                           })}
                         </div>
                      )}
                   </div>
                </div>

                {/* Algorithm Steps */}
                <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-[#fcfaf5] border-[#e2e8f0]'} rounded-[20px] p-8 shadow-sm border`}>
                   <h3 className='text-lg font-serif font-bold mb-6'>Algorithm Steps</h3>
                   {explainerLoading ? (
                      <Loader2 className='animate-spin text-[#4a6f55]' size={24}/>
                   ) : (
                      <div className='space-y-6'>
                         {algorithmSteps.map((step, idx) => (
                            <div key={idx} className='flex gap-4 items-start'>
                               <div className='shrink-0 w-8 h-8 rounded-full bg-[#4a6f55] text-white flex items-center justify-center font-bold text-sm shadow-sm'>
                                  {idx + 1}
                               </div>
                               <div>
                                  <h4 className='font-bold text-sm mb-1'>{step.title || `Step ${idx + 1}`}</h4>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{step.narration}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
             
             {/* Right Column (takes 1/3) */}
             <div className='space-y-6'>
                
                {/* Jessy AI Inline Chat */}
                <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-[#3d5c46]' : 'bg-[#f4f8f5] border-[#4a6f55]'} rounded-[20px] shadow-sm border overflow-hidden flex flex-col h-[400px]`}>
                   {/* Header */}
                   <div className='bg-[#4a6f55] px-4 py-3 flex items-center gap-2 text-white'>
                      <div className='w-6 h-6 rounded-full bg-white/20 flex items-center justify-center'>
                         <span className='text-xs'>🍃</span>
                      </div>
                      <h3 className='font-serif font-bold text-sm'>Jessy AI</h3>
                   </div>
                   
                   {/* Chat History */}
                   <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                      {chatHistory.length === 0 ? (
                         <div className={`${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} border rounded-xl p-4 text-sm shadow-sm`}>
                            Hello! Ready to understand {program.title}? Think of it like branches growing on a tree. Each new level relies on the support of the two below it.
                         </div>
                      ) : (
                         chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#e2e8f0] text-gray-800 rounded-2xl rounded-tr-sm' : `${theme === 'dark' ? 'bg-[#2a2a2a] text-gray-200' : 'bg-white text-gray-800'} border border-gray-200 rounded-2xl rounded-tl-sm`}`}>
                                  {msg.content}
                               </div>
                            </div>
                         ))
                      )}
                      
                      {chatLoading && (
                         <div className='flex justify-start'>
                            <div className={`${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-white'} px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm border border-gray-200`}>
                               <Loader2 className='animate-spin text-[#4a6f55]' size={16}/>
                            </div>
                         </div>
                      )}
                      <div ref={chatEndRef} />
                   </div>
                   
                   {/* Suggested Actions */}
                   {chatHistory.length === 0 && (
                      <div className='px-4 pb-2 flex gap-2 flex-wrap'>
                         <button onClick={() => handleChatSubmit(null, 'Why not recursion?')} className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-600 text-gray-300 hover:bg-[#333]' : 'bg-white border-[#4a6f55] text-[#4a6f55] hover:bg-[#f4f8f5]'}`}>
                            Why not recursion?
                         </button>
                         <button onClick={() => handleChatSubmit(null, 'Explain O(n) space')} className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-600 text-gray-300 hover:bg-[#333]' : 'bg-white border-[#4a6f55] text-[#4a6f55] hover:bg-[#f4f8f5]'}`}>
                            Explain O(n) space
                         </button>
                      </div>
                   )}

                   {/* Input */}
                   <form onSubmit={handleChatSubmit} className={`p-3 border-t ${theme === 'dark' ? 'border-gray-800 bg-[#1e1e1e]' : 'border-[#cce3d5] bg-white'}`}>
                      <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-[#fcfaf5]'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-full px-4 py-1.5`}>
                         <input
                            type='text'
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder='Ask a question...'
                            className='flex-1 bg-transparent border-none outline-none text-sm py-1'
                            disabled={chatLoading}
                         />
                         <button type='submit' disabled={chatLoading || !chatInput.trim()} className='text-[#4a6f55] hover:opacity-80 disabled:opacity-50 transition-opacity'>
                            <Send size={18} />
                         </button>
                      </div>
                   </form>
                </div>

                {/* Dry Run Table */}
                <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-[#fcfaf5] border-[#e2e8f0]'} rounded-[20px] p-6 shadow-sm border`}>
                   <h3 className='text-md font-serif font-bold mb-4'>Dry Run (n=4)</h3>
                   <div className={`overflow-hidden rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <table className='w-full text-sm text-left'>
                         <thead className={`${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-[#f4f1ea]'} font-bold text-xs uppercase text-gray-500`}>
                            <tr>
                               <th className='px-4 py-3'>Step (i)</th>
                               <th className='px-4 py-3'>A</th>
                               <th className='px-4 py-3'>B</th>
                               <th className='px-4 py-3'>Temp</th>
                            </tr>
                         </thead>
                         <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
                            <tr className={theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}>
                               <td className='px-4 py-3 font-medium'>Init</td>
                               <td className='px-4 py-3'>0</td>
                               <td className='px-4 py-3'>1</td>
                               <td className='px-4 py-3'>-</td>
                            </tr>
                            <tr className={theme === 'dark' ? 'bg-[#233329] border-l-4 border-[#4a6f55]' : 'bg-[#eaf4ed] border-l-4 border-[#4a6f55]'}>
                               <td className='px-4 py-3 font-medium'>2</td>
                               <td className='px-4 py-3'>1</td>
                               <td className='px-4 py-3'>1</td>
                               <td className='px-4 py-3'>1</td>
                            </tr>
                            <tr className={theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}>
                               <td className='px-4 py-3 font-medium'>3</td>
                               <td className='px-4 py-3'>1</td>
                               <td className='px-4 py-3'>2</td>
                               <td className='px-4 py-3'>2</td>
                            </tr>
                            <tr className={theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}>
                               <td className='px-4 py-3 font-medium'>4</td>
                               <td className='px-4 py-3'>2</td>
                               <td className='px-4 py-3'>3</td>
                               <td className='px-4 py-3'>3</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Logic Understood Button Block */}
                <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-[#fcfaf5] border-[#e2e8f0]'} rounded-[20px] p-6 shadow-sm border text-center flex flex-col items-center justify-center`}>
                   <div className='w-12 h-12 rounded-full bg-[#fce3ce] text-[#8b5a2b] flex items-center justify-center mb-4'>
                      <CheckCircle2 size={24} />
                   </div>
                   <h3 className='text-lg font-serif font-bold mb-2'>Logic Understood</h3>
                   <p className={`text-xs mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>You're ready to translate this mental model into Python code.</p>
                   <button 
                      onClick={() => navigate(`/student/session/${programId}`)}
                      className='w-full bg-[#4a6f55] hover:bg-[#3d5c46] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors'
                   >
                      <Code size={18} /> Enter Coding Session
                   </button>
                </div>

             </div>
             
          </div>
      </div>
    </div>
  )
}

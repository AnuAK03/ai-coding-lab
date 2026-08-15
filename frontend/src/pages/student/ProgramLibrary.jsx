// frontend/src/pages/student/ProgramLibrary.jsx
// FEATURE: tracks every program visit and shows attempt count per card

import { useEffect, useState, useCallback } from 'react'
import {
  collection, query, where, getDocs,
  doc, getDoc, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useNavigate } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import { Code2, Zap, BookOpen, Eye, RotateCcw, CheckCircle, Clock, Lock, Check } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const DIFFICULTY_COLOR = {
  dark: {
    easy:   'bg-green-500/15 text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    hard:   'bg-red-500/15 text-red-400 border-red-500/20',
  },
  light: {
    easy:   'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard:   'bg-red-100 text-red-700 border-red-200',
  }
}

export default function ProgramLibrary() {
  const [allPrograms, setAllPrograms] = useState([])
  const [loading, setLoading]     = useState(true)
  const [classId, setClassId]     = useState(null)
  
  const [selectedSubject, setSelectedSubject] = useState('All')

  const [attemptCounts, setAttemptCounts] = useState({})
  const [completedPrograms, setCompletedPrograms] = useState(new Set())
  const [activePrograms, setActivePrograms] = useState(new Set())
  const [programProgress, setProgramProgress] = useState({}) // FEATURE: track real progress %

  const user     = getAuth().currentUser
  const navigate = useNavigate()
  const { theme } = useTheme()

  // FEATURE: log a "view" event to Firestore for analytics
  const logProgramView = useCallback(async (programId) => {
    if (!user?.uid || !programId) return
    try {
      await addDoc(collection(db, 'programViews'), {
        studentId:  user.uid,
        programId,
        viewedAt:   serverTimestamp(),
      })
    } catch (e) {
      console.warn('Could not log program view:', e)
    }
  }, [user?.uid])

  useEffect(() => {
    async function loadPrograms() {
      const userSnap  = await getDoc(doc(db, 'users', user.uid))
      const userClassId = userSnap.data()?.classId
      setClassId(userClassId)

      if (!userClassId) { setLoading(false); return }

      const q = query(
        collection(db, 'programs'),
        where('active',  '==', true),
        where('classId', '==', userClassId)
      )
      const snap     = await getDocs(q)
      const programs = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      setAllPrograms(programs)

      if (programs.length > 0) {
        try {
          const sessQ = query(
            collection(db, 'sessions'),
            where('studentId', '==', user.uid)
          )
          const sessSnap = await getDocs(sessQ)

          const counts    = {}
          const completed = new Set()
          const active    = new Set()
          const progress  = {}

          sessSnap.docs.forEach(d => {
            const s   = d.data()
            const pid = s.programId
            if (!pid) return
            
            counts[pid] = (counts[pid] || 0) + 1
            if (s.status === 'complete') completed.add(pid)
            if (s.status === 'active' || s.status === 'quiz_pending') {
              active.add(pid)
              
              // Calculate real progress based on test cases passed or runs
              let pct = 0
              if (s.lastTestResults && s.lastTestResults.totalCount > 0) {
                 pct = Math.round((s.lastTestResults.passedCount / s.lastTestResults.totalCount) * 100)
              } else if (s.runAttempts > 0) {
                 pct = 10 // At least 10% for trying
              }
              // Store highest progress if multiple active sessions
              progress[pid] = Math.max(progress[pid] || 0, pct)
            }
          })

          setAttemptCounts(counts)
          setCompletedPrograms(completed)
          setActivePrograms(active)
          setProgramProgress(progress)
        } catch (e) {
          console.warn('Could not load attempt counts:', e)
        }
      }

      setLoading(false)
    }
    loadPrograms()
  }, [user.uid])

  const subjects = ['All', ...new Set(allPrograms.map(p => p.subject || 'General'))]

  const filteredPrograms = selectedSubject === 'All' 
    ? allPrograms 
    : allPrograms.filter(p => (p.subject || 'General') === selectedSubject)

  // Subdivide filtered programs
  const inProgressProgramsList = filteredPrograms.filter(p => activePrograms.has(p.id) && !completedPrograms.has(p.id))
  const completedProgramsList = filteredPrograms.filter(p => completedPrograms.has(p.id))
  const remainingProgramsList = filteredPrograms.filter(p => !activePrograms.has(p.id) && !completedPrograms.has(p.id))

  const renderInProgressCard = (prog) => {
    return (
      <div key={prog.id} className='bg-white rounded-[24px] p-6 shadow-sm border border-outline-variant/30'>
        <div className='flex gap-5 flex-col md:flex-row'>
          <div className='w-20 h-20 rounded-2xl bg-[#fbcfe8] flex items-center justify-center shrink-0'>
             <span className='font-mono font-bold text-2xl text-[#be185d]'>&#123;&#125;</span>
          </div>
          <div className='flex-1'>
             <div className='flex justify-between items-start mb-2'>
                <h3 className='font-bold text-gray-900 text-lg'>{prog.title}</h3>
                <span className='bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider'>
                  {prog.difficulty}
                </span>
             </div>
             <p className='text-sm text-gray-600 mb-4'>{prog.description}</p>
             
             {/* Tags/Parameters - Preserved from old UI */}
             <div className='flex gap-2 flex-wrap mb-5'>
                <span className={`text-xs px-2 py-1 rounded-md font-medium border ${DIFFICULTY_COLOR[theme][prog.difficulty]}`}>
                  {prog.difficulty}
                </span>
                {prog.testCases?.length > 0 && (
                  <span className='text-xs px-2 py-1 rounded-md font-medium border bg-purple-100 text-purple-700 border-purple-200'>
                    {prog.testCases.length} test{prog.testCases.length !== 1 && 's'}
                  </span>
                )}
                {prog.concepts?.map(c => (
                  <span key={c} className='text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-600 border-gray-200'>
                    {c}
                  </span>
                ))}
             </div>

             <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
                {/* Real Progress bar */}
                <div className='flex-1 w-full flex items-center gap-3'>
                   <span className='text-xs font-semibold text-gray-500 w-16'>Progress</span>
                   <div className='flex-1 h-2 bg-gray-100 rounded-full overflow-hidden'>
                     <div className='h-full bg-[#4a6f55] transition-all duration-500' style={{ width: `${programProgress[prog.id] || 0}%` }}></div>
                   </div>
                   <span className='text-xs font-bold text-gray-700'>{programProgress[prog.id] || 0}%</span>
                </div>

                
                {/* Preserved Action Buttons */}
                <div className='flex gap-3 w-full md:w-auto shrink-0'>
                   <button
                     onClick={() => {
                       logProgramView(prog.id)
                       navigate(`/student/understand/${prog.id}`)
                     }}
                     className='flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm'
                   >
                     <BookOpen size={16} /> Understand Logic
                   </button>
                   <button
                     onClick={() => {
                       logProgramView(prog.id)
                       navigate(`/student/session/${prog.id}`)
                     }}
                     className='flex-1 md:flex-none bg-[#4a6f55] hover:bg-[#3d5c46] text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm'
                   >
                     <Code2 size={16} /> Resume Coding
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRemainingCard = (prog) => {
    return (
      <div key={prog.id} className='bg-white rounded-[20px] p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between'>
        <div>
          <div className='flex gap-3 mb-3'>
             <div className='w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0'>
                <span className='font-mono font-bold text-xs text-gray-500'>&#91;&#93;</span>
             </div>
             <div>
                <h4 className='font-bold text-gray-900 text-[15px] leading-tight mb-1'>{prog.title}</h4>
                <p className='text-[13px] text-gray-500 line-clamp-2'>{prog.description}</p>
             </div>
          </div>
          {/* Tags */}
          <div className='flex gap-1.5 flex-wrap mb-4'>
             <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${DIFFICULTY_COLOR[theme][prog.difficulty]}`}>
               {prog.difficulty}
             </span>
             {prog.testCases?.length > 0 && (
               <span className='text-[10px] px-2 py-0.5 rounded-md font-medium border bg-purple-50 text-purple-700 border-purple-200'>
                 {prog.testCases.length} tests
               </span>
             )}
             {prog.concepts?.slice(0, 2).map(c => (
               <span key={c} className='text-[10px] px-2 py-0.5 rounded-md border bg-gray-50 text-gray-600 border-gray-200 truncate max-w-[100px]'>
                 {c}
               </span>
             ))}
          </div>
        </div>

        <div className='flex justify-between items-center pt-3 border-t border-gray-100'>
           <div className='flex items-center gap-1.5 text-[11px] text-gray-400 font-medium'>
              <Clock size={14} /> 2.5 hrs
           </div>
           {/* Preserved Action buttons */}
           <div className='flex gap-2'>
              <button
                onClick={() => {
                  logProgramView(prog.id)
                  navigate(`/student/understand/${prog.id}`)
                }}
                className='text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1'
              >
                <BookOpen size={12} /> Logic
              </button>
              <button
                onClick={() => {
                  logProgramView(prog.id)
                  navigate(`/student/session/${prog.id}`)
                }}
                className='text-white hover:bg-[#3d5c46] bg-[#4a6f55] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm'
              >
                <Code2 size={12} /> Start
              </button>
           </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#fcfaf5] transition-colors duration-300 flex items-center justify-center`}>
         <p className='text-gray-500'>Loading programs...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#fcfaf5] transition-colors duration-300`}>
      <main className='max-w-[1200px] mx-auto px-6 py-8'>
        
        {/* Header Section */}
        <div className='mb-8'>
           <h1 className={`text-2xl font-bold text-[#4a6f55] mb-6`}>Good afternoon, coder</h1>

           {/* Filter Pills */}
           <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide'>
              {subjects.map(subj => (
                <button 
                  key={subj} 
                  onClick={() => setSelectedSubject(subj)}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    selectedSubject === subj 
                      ? 'bg-[#4a6f55] text-white border-[#4a6f55] shadow-sm' 
                      : 'bg-white text-gray-600 border-outline-variant/50 hover:border-[#4a6f55] hover:text-[#4a6f55]'
                  }`}
                >
                  {subj}
                </button>
              ))}
           </div>
        </div>

        {allPrograms.length === 0 ? (
          <div className='bg-white rounded-2xl p-8 text-center text-gray-500 border border-outline-variant/30'>
            No programs available for your class yet. Ask your teacher to upload some.
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
             {/* Left Column */}
             <div className='lg:col-span-2 space-y-8'>
                
                {/* In Progress */}
                <div>
                  <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                     <Clock size={18} className='text-[#4a6f55]' /> In Progress
                  </h2>
                  {inProgressProgramsList.length === 0 ? (
                     <p className='text-sm text-gray-500 italic bg-white p-4 rounded-xl border border-outline-variant/30'>No programs currently in progress.</p>
                  ) : (
                     <div className='space-y-4'>
                       {inProgressProgramsList.map(prog => renderInProgressCard(prog))}
                     </div>
                  )}
                </div>

                {/* Remaining Modules */}
                <div>
                  <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                     <Lock size={18} className='text-gray-500' /> Remaining Modules
                  </h2>
                  {remainingProgramsList.length === 0 ? (
                     <p className='text-sm text-gray-500 italic bg-white p-4 rounded-xl border border-outline-variant/30'>All modules completed or in progress!</p>
                  ) : (
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                       {remainingProgramsList.map(prog => renderRemainingCard(prog))}
                     </div>
                  )}
                </div>
             </div>

             {/* Right Column */}
             <div className='space-y-6'>
                {/* Image Banner */}
                <div className='rounded-[24px] overflow-hidden relative shadow-sm h-56 group'>
                   <img 
                     src="/consistency_banner.png" 
                     alt="Consistency breeds mastery" 
                     className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700' 
                   />
                   <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent'></div>
                   <div className='absolute bottom-5 left-5 right-5'>
                      <p className='text-white font-serif italic text-lg leading-tight'>"Consistency breeds mastery."</p>
                   </div>
                </div>

                {/* Completed */}
                <div className='bg-white border border-outline-variant/30 rounded-[24px] p-6 shadow-sm'>
                   <div className='flex items-center justify-between mb-6'>
                      <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                        <CheckCircle size={20} className='text-[#4a6f55]' /> Completed
                      </h2>
                      <span className='bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-lg font-bold'>
                        {completedProgramsList.length}/{filteredPrograms.length}
                      </span>
                   </div>
                   <div className='space-y-5'>
                      {completedProgramsList.map(prog => (
                        <div key={prog.id} className='flex items-start gap-4'>
                           <div className='w-7 h-7 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5'>
                              <Check size={16} className='text-[#16a34a]' strokeWidth={3} />
                           </div>
                           <div>
                              <h4 className='text-sm font-bold text-gray-900 mb-0.5'>{prog.title}</h4>
                              <p className='text-[12px] text-gray-500 line-clamp-2 leading-relaxed'>{prog.description}</p>
                           </div>
                        </div>
                      ))}
                      {completedProgramsList.length === 0 && (
                         <p className='text-sm text-gray-500 italic'>No completed programs yet. Keep going!</p>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  )
}

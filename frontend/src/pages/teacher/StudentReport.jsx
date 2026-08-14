// frontend/src/pages/teacher/StudentReport.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import Navbar from '../../components/Navbar'
import { getAuth } from 'firebase/auth'
import {
  ChevronLeft, AlertTriangle, CheckCircle, Clock,
  Brain, TrendingUp, ShieldAlert
} from 'lucide-react'

const TIER_STYLE = {
  excellent:       'bg-green-100 text-green-700 border-green-200',
  satisfactory:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  needs_attention: 'bg-red-100 text-red-700 border-red-200',
}

const TIER_LABEL = {
  excellent:       'Excellent',
  satisfactory:    'Satisfactory',
  needs_attention: 'Needs Attention',
}

export default function StudentReport() {
  const { sessionId } = useParams()
  const navigate       = useNavigate()
  const user           = getAuth().currentUser
  const [session, setSession] = useState(null)
  const [student, setStudent] = useState(null)
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sessionSnap = await getDoc(doc(db, 'sessions', sessionId))
      if (!sessionSnap.exists()) { setLoading(false); return }

      const sessionData = sessionSnap.data()
      setSession(sessionData)

      // Load student name
      const studentSnap = await getDoc(doc(db, 'users', sessionData.studentId))
      if (studentSnap.exists()) setStudent(studentSnap.data())

      // Load program title
      const programSnap = await getDoc(doc(db, 'programs', sessionData.programId))
      if (programSnap.exists()) setProgram(programSnap.data())

      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <p className='text-gray-400'>Loading report...</p>
    </div>
  )

  if (!session) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <p className='text-red-400'>Session not found.</p>
    </div>
  )

  const report     = session.report || {}
  const tier       = report.performanceTier || 'pending'
  const violations = session.violations || []

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar user={user} role='teacher' />
      <main className='max-w-4xl mx-auto px-4 py-8'>

        {/* Back button */}
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className='flex items-center gap-1 text-gray-500 hover:text-blue-600
                     text-sm mb-6 transition-colors'
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className='flex items-start justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>
              {student?.name || 'Student'}'s Report
            </h1>
            <p className='text-gray-500 text-sm mt-0.5'>
              {program?.title || 'Unknown Program'} • {student?.rollNumber}
            </p>
          </div>
          {tier !== 'pending' && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border
                              ${TIER_STYLE[tier] || 'bg-gray-100 text-gray-700'}`}>
              {TIER_LABEL[tier] || tier}
            </span>
          )}
        </div>

        {/* Report not ready yet */}
        {session.status !== 'complete' && (
          <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6
                          flex items-center gap-3'>
            <Clock size={18} className='text-blue-500' />
            <p className='text-blue-700 text-sm'>
              Report is being generated. Status: {session.status}.
              Check back in a few minutes.
            </p>
          </div>
        )}

        {session.status === 'complete' && (
          <div className='space-y-5'>

            {/* AI Teacher Summary */}
            <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100'>
              <div className='flex items-center gap-2 mb-3'>
                <Brain size={16} className='text-blue-500' />
                <h2 className='font-semibold text-gray-800'>AI Summary</h2>
              </div>
              <p className='text-gray-600 text-sm leading-relaxed'>
                {report.teacherSummary || 'Summary not available.'}
              </p>
            </div>

            {/* Stats row */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {[
                { label: 'Quiz Score', value: `${Math.round((session.quizScore||0)*100)}%` },
                { label: 'Run Attempts', value: session.runAttempts || 0 },
                { label: 'Hints Used', value: `${session.hintsUsed || 0} / 3` },
                { label: 'Violations', value: violations.length },
              ].map(({label, value}) => (
                <div key={label}
                     className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
                  <p className='text-2xl font-bold text-gray-800'>{value}</p>
                  <p className='text-xs text-gray-500 mt-0.5'>{label}</p>
                </div>
              ))}
            </div>

            {/* DICE improvement suggestions */}
            {report.diceChanges?.length > 0 && (
              <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-2 mb-3'>
                  <TrendingUp size={16} className='text-green-500' />
                  <h2 className='font-semibold text-gray-800'>What Needs to Improve</h2>
                  <span className='text-xs text-gray-400 ml-1'>(DICE analysis)</span>
                </div>
                <div className='space-y-2'>
                  {report.diceChanges.slice(0,3).map((c, i) => (
                    <div key={i}
                         className='flex items-center gap-3 text-sm'>
                      <span className={`text-lg ${c.direction==='increase'?'text-green-500':'text-red-500'}`}>
                        {c.direction === 'increase' ? '↑' : '↓'}
                      </span>
                      <span className='text-gray-700 font-medium capitalize'>
                        {c.feature.replace(/_/g,' ')}
                      </span>
                      <span className='text-gray-400'>
                        {c.from} → {c.to}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concept strengths and weaknesses */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-2 mb-3'>
                  <CheckCircle size={15} className='text-green-500' />
                  <h3 className='font-semibold text-gray-800 text-sm'>Strong Concepts</h3>
                </div>
                <div className='flex gap-1.5 flex-wrap'>
                  {report.quizAnalysis?.strong_concepts?.length > 0
                    ? report.quizAnalysis.strong_concepts.map(c => (
                        <span key={c} className='text-xs bg-green-100 text-green-700
                                                   px-2 py-0.5 rounded-full'>{c}</span>
                      ))
                    : <p className='text-gray-400 text-xs'>None identified</p>
                  }
                </div>
              </div>
              <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-2 mb-3'>
                  <AlertTriangle size={15} className='text-red-500' />
                  <h3 className='font-semibold text-gray-800 text-sm'>Weak Concepts</h3>
                </div>
                <div className='flex gap-1.5 flex-wrap'>
                  {report.quizAnalysis?.weak_concepts?.length > 0
                    ? report.quizAnalysis.weak_concepts.map(c => (
                        <span key={c} className='text-xs bg-red-100 text-red-700
                                                   px-2 py-0.5 rounded-full'>{c}</span>
                      ))
                    : <p className='text-gray-400 text-xs'>None identified</p>
                  }
                </div>
              </div>
            </div>

            {/* Plagiarism flag */}
            {report.plagiarismFlagged && (
              <div className='bg-orange-50 border border-orange-200 rounded-xl p-4
                              flex items-start gap-3'>
                <ShieldAlert size={18} className='text-orange-500 mt-0.5' />
                <div>
                  <p className='text-orange-700 font-semibold text-sm'>
                    Plagiarism Flag
                  </p>
                  <p className='text-orange-600 text-xs mt-0.5'>
                    Code similarity: {Math.round((report.plagiarismScore||0)*100)}%
                    — review manually before taking action.
                  </p>
                </div>
              </div>
            )}

            {/* Integrity violations */}
            {violations.length > 0 && (
              <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100'>
                <h3 className='font-semibold text-gray-800 text-sm mb-3'>
                  Integrity Violations ({violations.length})
                </h3>
                <div className='space-y-1.5'>
                  {violations.map((v, i) => (
                    <div key={i} className='flex items-center gap-2 text-xs text-gray-600'>
                      <span className={`w-1.5 h-1.5 rounded-full
                                        ${v.severity==='high'?'bg-red-500':'bg-yellow-400'}`} />
                      <span className='capitalize'>{v.type?.replace(/_/g,' ')}</span>
                      <span className='text-gray-400'>{v.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

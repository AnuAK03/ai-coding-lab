// frontend/src/pages/student/MyReport.jsx
// Student sees their own completed session report (ML tier, quiz analysis, improvement areas)

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useTheme } from '../../contexts/ThemeContext'
import {
  ChevronLeft, Brain, TrendingUp, CheckCircle,
  AlertTriangle, Clock, Target, Zap, ShieldAlert,
  Award, BarChart2, BookOpen, Loader2, GitCompare
} from 'lucide-react'
import CodeDiffViewer from '../../components/CodeDiffViewer'

const TIER_INFO = {
  excellent:       { label: 'Excellent',       emoji: '🌟', bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30'  },
  satisfactory:    { label: 'Satisfactory',    emoji: '👍', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  needs_attention: { label: 'Poor',            emoji: '📚', bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30'    },
}

const IMPROVEMENT_MESSAGES = {
  quiz_score:         { up: 'Try to answer quiz questions more carefully — read each option before choosing.', down: null },
  error_count:        { down: 'Fewer errors next time — run your code in smaller chunks to catch bugs early.', up: null },
  hints_used:         { down: 'Great — try to solve more without hints!', up: 'Refer to hints only when truly stuck.' },
  run_attempts:       { down: 'Try to plan your approach before running — it builds good habits.', up: null },
  violation_count:    { down: 'Keep your integrity score clean — avoid switching tabs or copying.', up: null },
}

function improvementText(feature, direction) {
  return IMPROVEMENT_MESSAGES[feature]?.[direction] || null
}

export default function MyReport() {
  const { sessionId } = useParams()
  const navigate      = useNavigate()
  const { theme }     = useTheme()
  const [session,  setSession]  = useState(null)
  const [program,  setProgram]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'sessions', sessionId))
      if (!snap.exists()) { setLoading(false); return }
      const data = snap.data()
      setSession(data)
      if (data.programId) {
        const pSnap = await getDoc(doc(db, 'programs', data.programId))
        if (pSnap.exists()) setProgram(pSnap.data())
      }
      setLoading(false)
    }
    load()
  }, [sessionId])

  const t = {
    dark: {
      bg: 'bg-[#0F0F10]', text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]', cardBg: 'rgba(26,26,29,0.8)',
      border: 'border-white/10',
    },
    light: {
      bg: 'bg-[#FAFAFA]', text: 'text-[#171717]',
      textMuted: 'text-[#737373]', cardBg: 'rgba(255,255,255,0.8)',
      border: 'border-[#E5E5E5]',
    }
  }[theme]

  const cardStyle = {
    backgroundColor: t.cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
  }
  const card = `rounded-xl border ${t.border} p-5`

  if (loading) return (
    <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
      <Loader2 className='text-blue-400 animate-spin' size={28} />
    </div>
  )

  if (!session) return (
    <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
      <p className='text-red-400'>Session not found.</p>
    </div>
  )

  const report     = session.report || {}
  const quizScorePct = Math.round((session.quizScore || 0) * (session.quizScore <= 1.0 ? 100 : 1))
  const violations = session.violations || []
  
  // Dynamic performance tier calculation fallback
  const calculatedTier = report.performanceTier || (
    quizScorePct >= 80 && violations.length <= 1 ? 'excellent' : (quizScorePct >= 50 ? 'satisfactory' : 'needs_attention')
  )
  const tierInfo = TIER_INFO[calculatedTier] || TIER_INFO['satisfactory']

  // Dynamic DICE counterfactual recommendations fallback
  const diceChanges = (report.diceChanges && report.diceChanges.length > 0)
    ? report.diceChanges
    : [
        { feature: 'quiz_score', from: `${quizScorePct}%`, to: '85%', direction: 'increase' },
        { feature: 'hints_used', from: session.hintsUsed || 0, to: 0, direction: 'decrease' },
        { feature: 'violation_count', from: violations.length, to: 0, direction: 'decrease' },
      ].filter(c => String(c.from) !== String(c.to))

  const isSubmittedOrComplete = session.status === 'complete' || session.status === 'submitted'

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} py-10 px-4 transition-colors`}>
      <div className='max-w-3xl mx-auto'>

        {/* Back */}
        <button
          onClick={() => navigate('/student/progress')}
          className={`flex items-center gap-1 ${t.textMuted} hover:${t.text} text-sm mb-6 transition-colors`}
        >
          <ChevronLeft size={16} /> Back to Session History
        </button>

        {/* Header */}
        <div className='flex items-start justify-between mb-6 flex-wrap gap-3'>
          <div>
            <h1 className={`text-2xl font-bold ${t.text}`}>DICE Session Report</h1>
            <p className={`${t.textMuted} text-sm mt-0.5`}>
              {program?.title || session.programTitle || 'Program Evaluation'}
              {session.attemptNumber ? ` — Attempt #${session.attemptNumber}` : ''}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <span className='px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20'>
              Status: {session.status}
            </span>
            {tierInfo && (
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border
                                ${tierInfo.bg} ${tierInfo.text} ${tierInfo.border}`}>
                {tierInfo.emoji} {tierInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Program Details Card */}
        {program && (
          <div className={`${card} mb-5`} style={cardStyle}>
            <h3 className={`font-semibold ${t.text} text-base mb-2`}>Program Details</h3>
            <p className={`text-xs ${t.textMuted} leading-relaxed mb-3`}>
              {program.description || 'Practice problem.'}
            </p>
            <div className='flex flex-wrap gap-2 text-xs'>
              <span className='px-2.5 py-1 rounded bg-surface-container font-mono text-text-secondary border border-outline-variant/30'>
                Subject: {program.subject || 'Python Basics'}
              </span>
              <span className='px-2.5 py-1 rounded bg-surface-container font-mono text-text-secondary border border-outline-variant/30'>
                Difficulty: {program.difficulty || 'Easy'}
              </span>
              {program.concepts?.map(c => (
                <span key={c} className='px-2.5 py-1 rounded bg-primary/10 text-primary font-medium border border-primary/20'>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {!isSubmittedOrComplete ? (
          <div className={`${card} flex items-center gap-3 mb-5`} style={cardStyle}>
            <Clock size={18} className='text-blue-400 flex-shrink-0' />
            <p className={`${t.textMuted} text-sm`}>
              Your report is processing. Status: <strong>{session.status}</strong>.
            </p>
          </div>
        ) : (
          <div className='space-y-5'>

            {/* ── Key stats ── */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {[
                { label: 'Quiz Score',    value: `${Math.round((session.quizScore || 0) * 100)}%`, icon: Award,    color: 'text-yellow-400' },
                { label: 'Run Attempts',  value: session.runAttempts || 0,                          icon: Zap,      color: 'text-blue-400'   },
                { label: 'Hints Used',    value: `${session.hintsUsed || 0}/3`,                     icon: Brain,    color: 'text-purple-400' },
                { label: 'Time Taken',    value: session.timeTakenMs ? `${Math.round(session.timeTakenMs / 60000)}m` : '—', icon: Clock, color: 'text-green-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={card} style={cardStyle}>
                  <Icon size={16} className={`${color} mb-2`} />
                  <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── What you did well / need to work on ── */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-3'>
                  <CheckCircle size={15} className='text-green-400' />
                  <h3 className={`font-semibold ${t.text} text-sm`}>What You Did Well</h3>
                </div>
                <div className='space-y-1.5'>
                  {report.quizAnalysis?.strong_concepts?.length > 0
                    ? report.quizAnalysis.strong_concepts.map(c => (
                        <div key={c} className='flex items-center gap-2'>
                          <div className='w-1.5 h-1.5 rounded-full bg-green-400' />
                          <span className={`text-sm ${t.text} capitalize`}>{c}</span>
                        </div>
                      ))
                    : <p className={`text-xs ${t.textMuted}`}>Keep practising to build strengths</p>
                  }
                  {session.hintsUsed === 0 && (
                    <div className='flex items-center gap-2 mt-2'>
                      <div className='w-1.5 h-1.5 rounded-full bg-green-400' />
                      <span className={`text-sm ${t.text}`}>Solved without hints 🧠</span>
                    </div>
                  )}
                  {violations.length === 0 && (
                    <div className='flex items-center gap-2'>
                      <div className='w-1.5 h-1.5 rounded-full bg-green-400' />
                      <span className={`text-sm ${t.text}`}>Clean integrity record 🎯</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-3'>
                  <Target size={15} className='text-orange-400' />
                  <h3 className={`font-semibold ${t.text} text-sm`}>Focus Areas</h3>
                </div>
                <div className='space-y-1.5'>
                  {report.quizAnalysis?.weak_concepts?.length > 0
                    ? report.quizAnalysis.weak_concepts.map(c => (
                        <div key={c} className='flex items-center gap-2'>
                          <div className='w-1.5 h-1.5 rounded-full bg-orange-400' />
                          <span className={`text-sm ${t.text} capitalize`}>{c}</span>
                        </div>
                      ))
                    : <p className={`text-xs ${t.textMuted}`}>No weak concepts identified</p>
                  }
                  {report.dominantWeakness && (
                    <p className={`text-xs ${t.textMuted} mt-1`}>
                      Main area to improve: <strong className={t.text}>{report.dominantWeakness}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── DICE improvement suggestions (student-friendly language) ── */}
            {report.diceChanges?.length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <TrendingUp size={16} className='text-indigo-400' />
                  <h2 className={`font-semibold ${t.text}`}>How to Improve Next Time</h2>
                </div>
                <div className='space-y-3'>
                  {report.diceChanges.slice(0, 3).map((c, i) => {
                    const msg = improvementText(c.feature, c.direction)
                    return (
                      <div key={i}
                           className={`rounded-lg p-3 border flex items-start gap-3
                                        ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                        <span className={`text-lg flex-shrink-0 ${c.direction === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                          {c.direction === 'increase' ? '↑' : '↓'}
                        </span>
                        <div>
                          <p className={`text-sm font-medium ${t.text} capitalize`}>
                            {c.feature.replace(/_/g, ' ')}
                            <span className={`text-xs ${t.textMuted} font-normal ml-2`}>
                              ({c.from} → {c.to})
                            </span>
                          </p>
                          {msg && <p className={`text-xs ${t.textMuted} mt-0.5`}>{msg}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Error breakdown ── */}
            {report.errorTags && Object.keys(report.errorTags).length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-3'>
                  <BarChart2 size={15} className='text-red-400' />
                  <h3 className={`font-semibold ${t.text} text-sm`}>Errors by Concept</h3>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(report.errorTags)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tag, count]) => (
                      <span key={tag} className='text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full'>
                        {tag} — {count}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* ── Quiz question review ── */}
            {session.quizAnswers?.length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <BookOpen size={15} className='text-blue-400' />
                  <h3 className={`font-semibold ${t.text} text-sm`}>Quiz Review</h3>
                </div>
                <div className='space-y-2'>
                  {session.quizAnswers.map((qa, i) => (
                    <div key={i} className={`flex items-center gap-3 text-xs rounded-lg px-3 py-2.5 border
                                              ${qa.correct
                                                ? 'bg-green-500/10 border-green-500/20'
                                                : 'bg-red-500/10 border-red-500/20'}`}>
                      <span className={qa.correct ? 'text-green-400 text-base' : 'text-red-400 text-base'}>
                        {qa.correct ? '✓' : '✗'}
                      </span>
                      <span className={`${t.textMuted} flex-1`}>Q{i + 1} — concept: <strong>{qa.concept_tag}</strong></span>
                      {!qa.correct && (
                        <span className={t.textMuted}>
                          You: <span className='text-red-300'>{qa.studentAnswer}</span> |
                          Correct: <span className='text-green-300'>{qa.correctAnswer}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Code Evolution (Diff Viewer) ── */}
            {session.codeSnapshots?.length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <GitCompare size={15} className='text-blue-400' />
                  <h3 className={`font-semibold ${t.text} text-sm`}>
                    How Your Code Evolved
                  </h3>
                  <span className={`text-xs ${t.textMuted}`}>
                    ({session.codeSnapshots.length} run{session.codeSnapshots.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <CodeDiffViewer snapshots={session.codeSnapshots} />
              </div>
            )}

            {/* ── Violations ── */}
            {violations.length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-3'>
                  <ShieldAlert size={15} className='text-orange-400' />
                  <h3 className={`font-semibold ${t.text} text-sm`}>
                    Integrity Events ({violations.length})
                  </h3>
                </div>
                <p className={`text-xs ${t.textMuted} mb-3`}>
                  These events were recorded during your session and are visible to your teacher.
                </p>
                <div className='space-y-1.5'>
                  {violations.map((v, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${t.textMuted}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                         ${v.severity === 'high' ? 'bg-red-400' : v.severity === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                      <span className='capitalize'>{v.type?.replace(/_/g, ' ')}</span>
                      <span className={`${t.textMuted} opacity-60 ml-auto`}>
                        {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

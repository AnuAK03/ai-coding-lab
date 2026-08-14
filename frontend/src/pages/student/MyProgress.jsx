// frontend/src/pages/student/MyProgress.jsx
// Student self-analysis: error patterns, quiz concepts, time trends, improvement tips

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useTheme } from '../../contexts/ThemeContext'
import {
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  Brain, Target, Zap, BookOpen, BarChart2,
  ChevronRight, Loader2, Activity, Award
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, LineChart, Line, CartesianGrid
} from 'recharts'

const CONCEPT_LABELS = {
  loops: 'Loops', arrays: 'Arrays', recursion: 'Recursion',
  functions: 'Functions', pointers: 'Pointers', strings: 'Strings',
  logic: 'Logic', syntax: 'Syntax', data_types: 'Data Types', scope: 'Scope',
}

const TIER_COLOR = {
  excellent:       { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30'  },
  satisfactory:    { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  needs_attention: { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30'    },
}

function tip(concept) {
  const tips = {
    loops:      'Practice writing for/while loops with different ranges. Try nested loops for patterns.',
    arrays:     'Work on list indexing, slicing, and common operations like sort/reverse.',
    recursion:  'Start with simple recursion (factorial, fibonacci) before tree/graph problems.',
    functions:  'Focus on return values vs print, and parameter passing.',
    strings:    'Practice string slicing, methods like split/join/strip, and palindrome checks.',
    logic:      'Draw truth tables. Trace through if-else branches with different inputs.',
    syntax:     'Read error messages carefully — they point to the exact line. Use consistent indentation.',
    scope:      'Understand local vs global variables. Avoid modifying globals inside functions.',
    data_types: 'Be careful with int vs float vs string conversions. Use type() to check types.',
    pointers:   'Understand reference vs value. Be careful with mutable default arguments.',
  }
  return tips[concept] || 'Practice more problems involving this concept.'
}

export default function MyProgress({ user }) {
  const [sessions,  setSessions]  = useState([])
  const [programs,  setPrograms]  = useState({})
  const [loading,   setLoading]   = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    async function load() {
      // Fetch all programs for title lookup
      const progSnap = await getDocs(collection(db, 'programs'))
      const progMap  = {}
      progSnap.docs.forEach(d => { progMap[d.id] = { id: d.id, ...d.data() } })
      setPrograms(progMap)

      // Fetch all sessions for this student
      const q    = query(collection(db, 'sessions'), where('studentId', '==', user.uid))
      const snap = await getDocs(q)
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.startedAt?.seconds || 0) - (b.startedAt?.seconds || 0))
      setSessions(data)
      setLoading(false)
    }
    load()
  }, [user.uid])

  const t = {
    dark: {
      bg: 'bg-[#0F0F10]', text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]', cardBg: 'rgba(26,26,29,0.7)',
      border: 'border-white/10', hoverBg: 'hover:bg-white/5',
    },
    light: {
      bg: 'bg-[#FAFAFA]', text: 'text-[#171717]',
      textMuted: 'text-[#737373]', cardBg: 'rgba(255,255,255,0.7)',
      border: 'border-[#E5E5E5]', hoverBg: 'hover:bg-[#F5F5F5]',
    }
  }[theme]

  const card = `rounded-xl border ${t.border} p-5`
  const cardStyle = {
    backgroundColor: t.cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: theme === 'dark'
      ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
  }

  if (loading) return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center`}>
      <Loader2 className='text-blue-400 animate-spin' size={28} />
    </div>
  )

  // ── Compute analytics ────────────────────────────────────────
  const completed = sessions.filter(s => s.status === 'complete')
  const totalAttempts = sessions.length
  const completedCount = completed.length

  // Error concept aggregation across all sessions
  const errorTagTotals = {}
  completed.forEach(s => {
    const tags = s.report?.errorTags || {}
    Object.entries(tags).forEach(([tag, count]) => {
      errorTagTotals[tag] = (errorTagTotals[tag] || 0) + count
    })
  })

  // Quiz concept aggregation: weak vs strong
  const conceptWeak   = {}
  const conceptStrong = {}
  completed.forEach(s => {
    const qa = s.report?.quizAnalysis || {}
    ;(qa.weak_concepts   || []).forEach(c => { conceptWeak[c]   = (conceptWeak[c]   || 0) + 1 })
    ;(qa.strong_concepts || []).forEach(c => { conceptStrong[c] = (conceptStrong[c] || 0) + 1 })
  })

  // Radar data: all known concepts scored 0-10
  const allConcepts = Array.from(new Set([
    ...Object.keys(conceptWeak), ...Object.keys(conceptStrong), ...Object.keys(errorTagTotals)
  ]))
  const radarData = allConcepts.map(c => {
    const strong  = conceptStrong[c] || 0
    const weak    = conceptWeak[c]   || 0
    const errors  = errorTagTotals[c] || 0
    const total   = strong + weak + 1
    const score   = Math.max(0, Math.min(10, Math.round(((strong / total) * 10) - errors * 0.5)))
    return { concept: CONCEPT_LABELS[c] || c, score }
  })

  // Quiz score trend over time
  const scoreTrend = completed.map((s, i) => ({
    session: `S${i + 1}`,
    score:   Math.round((s.quizScore || 0) * 100),
    prog:    programs[s.programId]?.title?.split(' ')[0] || `S${i+1}`,
  }))

  // Time taken trend
  const timeTrend = completed.map((s, i) => ({
    session: `S${i + 1}`,
    minutes: Math.round((s.timeTakenMs || 0) / 60000),
  }))

  // Top 3 weakest concepts to work on
  const weaknesses = Object.entries(conceptWeak)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c)

  // Performance tier distribution
  const tierCounts = { excellent: 0, satisfactory: 0, needs_attention: 0 }
  completed.forEach(s => {
    const tier = s.report?.performanceTier
    if (tier && tierCounts[tier] !== undefined) tierCounts[tier]++
  })

  // Violations summary
  const totalViolations = sessions.reduce((sum, s) => sum + (s.violations?.length || 0), 0)
  const violationTypes  = {}
  sessions.forEach(s => {
    ;(s.violations || []).forEach(v => {
      violationTypes[v.type] = (violationTypes[v.type] || 0) + 1
    })
  })

  // Avg hints used
  const avgHints = completed.length > 0
    ? (completed.reduce((sum, s) => sum + (s.hintsUsed || 0), 0) / completed.length).toFixed(1)
    : 0

  // Avg run attempts
  const avgRuns = completed.length > 0
    ? (completed.reduce((sum, s) => sum + (s.runAttempts || 0), 0) / completed.length).toFixed(1)
    : 0

  const chartTooltipStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(26,26,29,0.95)' : 'rgba(255,255,255,0.95)',
    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: '8px',
    color: theme === 'dark' ? '#EDEDED' : '#171717',
  }

  return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-10 px-6 transition-colors`}>
      <div className='max-w-6xl mx-auto'>

        {/* Header */}
        <div className='mb-8'>
          <h1 className={`text-3xl font-bold ${t.text}`}>My Progress</h1>
          <p className={`${t.textMuted} mt-1 text-sm`}>
            A full breakdown of your coding journey — what you know, what to improve
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className={`${card} text-center py-16`} style={cardStyle}>
            <BookOpen size={40} className={`${t.textMuted} mx-auto mb-4`} strokeWidth={1.5} />
            <p className={`${t.text} font-semibold text-lg`}>No sessions yet</p>
            <p className={`${t.textMuted} text-sm mt-1`}>Complete a coding session to see your analysis here</p>
          </div>
        ) : (
          <div className='space-y-6'>

            {/* ── Overview cards ── */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {[
                { icon: Activity,  label: 'Total Attempts',     value: totalAttempts,   color: 'text-blue-400'   },
                { icon: CheckCircle,label:'Completed',          value: completedCount,  color: 'text-green-400'  },
                { icon: Zap,       label: 'Avg Run Attempts',   value: avgRuns,         color: 'text-yellow-400' },
                { icon: Brain,     label: 'Avg Hints/Session',  value: avgHints,        color: 'text-purple-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={card} style={cardStyle}>
                  <Icon size={18} className={`${color} mb-2`} />
                  <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Performance tier distribution ── */}
            {completedCount > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <Award size={16} className='text-yellow-400' />
                  <h2 className={`font-semibold ${t.text}`}>Performance Distribution</h2>
                </div>
                <div className='grid grid-cols-3 gap-3'>
                  {Object.entries(tierCounts).map(([tier, count]) => {
                    const tc = TIER_COLOR[tier] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' }
                    const pct = completedCount > 0 ? Math.round((count / completedCount) * 100) : 0
                    return (
                      <div key={tier} className={`rounded-lg p-3 border ${tc.bg} ${tc.border}`}>
                        <p className={`text-xl font-bold ${tc.text}`}>{count}</p>
                        <p className={`text-xs ${tc.text} opacity-80 capitalize mt-0.5`}>
                          {tier.replace('_', ' ')}
                        </p>
                        <div className='mt-2 h-1.5 rounded-full bg-white/10'>
                          <div
                            className={`h-full rounded-full ${tc.text.replace('text-', 'bg-')}`}
                            style={{ width: `${pct}%`, opacity: 0.6 }}
                          />
                        </div>
                        <p className={`text-xs ${t.textMuted} mt-1`}>{pct}%</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Quiz score trend + time trend ── */}
            {scoreTrend.length >= 2 && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className={card} style={cardStyle}>
                  <div className='flex items-center gap-2 mb-4'>
                    <TrendingUp size={16} className='text-green-400' />
                    <h2 className={`font-semibold ${t.text}`}>Quiz Score Trend</h2>
                  </div>
                  <ResponsiveContainer width='100%' height={180}>
                    <LineChart data={scoreTrend}>
                      <CartesianGrid strokeDasharray='3 3' stroke={theme === 'dark' ? '#2a2a2d' : '#e5e5e5'} />
                      <XAxis dataKey='prog' stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={v => [`${v}%`, 'Score']} />
                      <Line type='monotone' dataKey='score' stroke='#4ade80' strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={card} style={cardStyle}>
                  <div className='flex items-center gap-2 mb-4'>
                    <Clock size={16} className='text-blue-400' />
                    <h2 className={`font-semibold ${t.text}`}>Time Taken per Session</h2>
                  </div>
                  <ResponsiveContainer width='100%' height={180}>
                    <BarChart data={timeTrend}>
                      <XAxis dataKey='session' stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                      <YAxis stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={v => [`${v} min`, 'Time']} />
                      <Bar dataKey='minutes' fill={theme === 'dark' ? '#60a5fa' : '#3b82f6'} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Concept radar ── */}
            {radarData.length >= 3 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <Target size={16} className='text-purple-400' />
                  <h2 className={`font-semibold ${t.text}`}>Concept Strength Radar</h2>
                  <span className={`text-xs ${t.textMuted}`}>(0 = weak, 10 = strong)</span>
                </div>
                <ResponsiveContainer width='100%' height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={theme === 'dark' ? '#2a2a2d' : '#e5e5e5'} />
                    <PolarAngleAxis dataKey='concept' style={{ fontSize: 11, fill: theme === 'dark' ? '#A1A1A3' : '#737373' }} />
                    <Radar dataKey='score' stroke='#818cf8' fill='#818cf8' fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Error concept breakdown ── */}
            {Object.keys(errorTagTotals).length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <AlertTriangle size={16} className='text-red-400' />
                  <h2 className={`font-semibold ${t.text}`}>Error Breakdown by Concept</h2>
                </div>
                <div className='space-y-2'>
                  {Object.entries(errorTagTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tag, count]) => {
                      const maxCount = Math.max(...Object.values(errorTagTotals))
                      const pct = Math.round((count / maxCount) * 100)
                      return (
                        <div key={tag}>
                          <div className='flex justify-between text-xs mb-1'>
                            <span className={t.text}>{CONCEPT_LABELS[tag] || tag}</span>
                            <span className={t.textMuted}>{count} error{count !== 1 && 's'}</span>
                          </div>
                          <div className='h-2 rounded-full bg-white/10'>
                            <div
                              className='h-full rounded-full bg-red-400'
                              style={{ width: `${pct}%`, opacity: 0.7 }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* ── Quiz concept matrix ── */}
            {(Object.keys(conceptWeak).length > 0 || Object.keys(conceptStrong).length > 0) && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className={card} style={cardStyle}>
                  <div className='flex items-center gap-2 mb-3'>
                    <CheckCircle size={15} className='text-green-400' />
                    <h3 className={`font-semibold ${t.text} text-sm`}>Strong Quiz Concepts</h3>
                  </div>
                  {Object.keys(conceptStrong).length === 0 ? (
                    <p className={`text-xs ${t.textMuted}`}>Complete more sessions to see strengths</p>
                  ) : (
                    <div className='flex flex-wrap gap-2'>
                      {Object.entries(conceptStrong)
                        .sort((a, b) => b[1] - a[1])
                        .map(([c, n]) => (
                          <span key={c} className='text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full'>
                            {CONCEPT_LABELS[c] || c} ×{n}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <div className={card} style={cardStyle}>
                  <div className='flex items-center gap-2 mb-3'>
                    <AlertTriangle size={15} className='text-red-400' />
                    <h3 className={`font-semibold ${t.text} text-sm`}>Weak Quiz Concepts</h3>
                  </div>
                  {Object.keys(conceptWeak).length === 0 ? (
                    <p className={`text-xs ${t.textMuted}`}>No weak concepts identified yet</p>
                  ) : (
                    <div className='flex flex-wrap gap-2'>
                      {Object.entries(conceptWeak)
                        .sort((a, b) => b[1] - a[1])
                        .map(([c, n]) => (
                          <span key={c} className='text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full'>
                            {CONCEPT_LABELS[c] || c} ×{n}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Personalised improvement tips ── */}
            {weaknesses.length > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <Brain size={16} className='text-indigo-400' />
                  <h2 className={`font-semibold ${t.text}`}>Personalised Improvement Tips</h2>
                </div>
                <div className='space-y-3'>
                  {weaknesses.map(c => (
                    <div key={c} className={`rounded-lg p-3 border
                                              ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                      <div className='flex items-center gap-2 mb-1'>
                        <ChevronRight size={14} className='text-indigo-400' />
                        <p className={`text-sm font-medium ${t.text}`}>{CONCEPT_LABELS[c] || c}</p>
                      </div>
                      <p className={`text-xs ${t.textMuted} ml-5`}>{tip(c)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Integrity summary ── */}
            {totalViolations > 0 && (
              <div className={card} style={cardStyle}>
                <div className='flex items-center gap-2 mb-4'>
                  <BarChart2 size={16} className='text-orange-400' />
                  <h2 className={`font-semibold ${t.text}`}>Integrity Summary</h2>
                  <span className={`text-xs ${t.textMuted}`}>(visible to you and your teacher)</span>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {Object.entries(violationTypes).map(([type, count]) => (
                    <div key={type} className={`rounded-lg p-3 border
                                                 ${theme === 'dark' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-100'}`}>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{count}</p>
                      <p className={`text-xs ${t.textMuted} capitalize mt-0.5`}>
                        {type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
                {totalViolations >= 5 && (
                  <p className={`text-xs mt-3 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>
                    ⚠ High violation count detected. Sessions with 3+ high-severity violations are automatically flagged for your teacher.
                  </p>
                )}
              </div>
            )}

            {/* ── Per-session breakdown table ── */}
            <div className={card} style={cardStyle}>
              <div className='flex items-center gap-2 mb-4'>
                <Activity size={16} className='text-blue-400' />
                <h2 className={`font-semibold ${t.text}`}>All Sessions Breakdown</h2>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className={`border-b ${t.border}`}>
                      {['Program', 'Attempt', 'Status', 'Quiz', 'Runs', 'Hints', 'Time', 'Violations'].map(h => (
                        <th key={h} className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wide ${t.textMuted}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${t.border}`}>
                    {[...sessions].reverse().map(s => {
                      const prog = programs[s.programId]
                      const tier = s.report?.performanceTier
                      const tc   = tier ? TIER_COLOR[tier] : null
                      return (
                        <tr key={s.id} className={`${t.hoverBg} transition-colors`}>
                          <td className={`px-3 py-2.5 font-medium ${t.text} text-xs`}>
                            {prog?.title || '—'}
                          </td>
                          <td className={`px-3 py-2.5 ${t.textMuted} text-xs`}>
                            #{s.attemptNumber || '?'}
                          </td>
                          <td className='px-3 py-2.5'>
                            <span className={`text-xs px-2 py-0.5 rounded-full border
                                              ${tc ? `${tc.bg} ${tc.text} ${tc.border}` : `bg-white/10 ${t.textMuted}`}`}>
                              {tier ? tier.replace('_', ' ') : s.status}
                            </span>
                          </td>
                          <td className={`px-3 py-2.5 ${t.text} text-xs font-medium`}>
                            {s.quizScore != null ? `${Math.round(s.quizScore * 100)}%` : '—'}
                          </td>
                          <td className={`px-3 py-2.5 ${t.textMuted} text-xs`}>{s.runAttempts || 0}</td>
                          <td className={`px-3 py-2.5 ${t.textMuted} text-xs`}>{s.hintsUsed || 0}/3</td>
                          <td className={`px-3 py-2.5 ${t.textMuted} text-xs`}>
                            {s.timeTakenMs ? `${Math.round(s.timeTakenMs / 60000)}m` : '—'}
                          </td>
                          <td className={`px-3 py-2.5 text-xs ${(s.violations?.length || 0) > 0 ? 'text-orange-400' : t.textMuted}`}>
                            {s.violations?.length || 0}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

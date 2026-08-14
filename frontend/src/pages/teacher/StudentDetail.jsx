// frontend/src/pages/teacher/StudentDetail.jsx
// Full learning timeline for a single student — accessible by teacher.
// Route: /teacher/student/:studentId

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import {
  ChevronLeft, User, Award, Flame, Brain,
  Clock, Zap, AlertTriangle, CheckCircle,
  TrendingUp, ShieldAlert, BarChart2, Loader2,
  Target, Activity
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar
} from 'recharts'

const TIER_STYLE = {
  excellent:       { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30'  },
  satisfactory:    { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  needs_attention: { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30'    },
}

const BADGE_META = {
  first_program: { label: 'First Program', icon: '🏅' },
  no_hints:      { label: 'No Hints',      icon: '🧠' },
  perfect_quiz:  { label: 'Perfect Quiz',  icon: '⭐' },
  five_streak:   { label: '5-Day Streak',  icon: '🔥' },
  debugger:      { label: 'Debugger',      icon: '🐛' },
  speed_run:     { label: 'Speed Run',     icon: '⚡' },
  lab_complete:  { label: 'Lab Complete',  icon: '📚' },
  clean_code:    { label: 'Clean Code',    icon: '🎯' },
}

export default function StudentDetail() {
  const { studentId } = useParams()
  const navigate      = useNavigate()
  const { theme }     = useTheme()

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/student/${studentId}/timeline`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setData(await res.json())
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  // Theme
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]', text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]', cardBg: 'rgba(26,26,29,0.8)',
      border: 'border-white/10', hoverBg: 'hover:bg-white/5',
    },
    light: {
      bg: 'bg-[#FAFAFA]', text: 'text-[#171717]',
      textMuted: 'text-[#737373]', cardBg: 'rgba(255,255,255,0.8)',
      border: 'border-[#E5E5E5]', hoverBg: 'hover:bg-[#F5F5F5]',
    }
  }[theme]

  const cardStyle = {
    backgroundColor: t.cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
  }
  const card = `rounded-xl border ${t.border} p-5`

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(26,26,29,0.95)' : 'rgba(255,255,255,0.95)',
    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: '8px',
    color: theme === 'dark' ? '#EDEDED' : '#171717',
  }

  if (loading) return (
    <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
      <Loader2 className='text-blue-400 animate-spin' size={28} />
    </div>
  )

  if (error || !data) return (
    <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
      <p className='text-red-400 text-sm'>{error || 'Student not found'}</p>
    </div>
  )

  const { student, timeline, summary } = data
  const completed = timeline.filter(s => s.status === 'complete')

  // Charts: quiz score trend + run attempts trend (chronological order)
  const chartData = [...completed].reverse().map((s, i) => ({
    label:   s.programTitle?.split(' ')[0] || `S${i + 1}`,
    score:   Math.round((s.quizScore || 0) * 100),
    runs:    s.runAttempts || 0,
    time:    Math.round((s.timeTakenMs || 0) / 60000),
    errors:  s.errorCount || 0,
  }))

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} py-10 px-6 transition-colors`}>
      <div className='max-w-6xl mx-auto'>

        {/* Back */}
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className={`flex items-center gap-1 ${t.textMuted} hover:${t.text} text-sm mb-6 transition-colors`}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        {/* ── Student header ── */}
        <div className={`${card} mb-6 flex items-start justify-between flex-wrap gap-4`} style={cardStyle}>
          <div className='flex items-center gap-4'>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl
                              ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
              {student.name ? student.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <h1 className={`text-xl font-bold ${t.text}`}>{student.name || 'Unknown Student'}</h1>
              <p className={`text-sm ${t.textMuted}`}>
                {student.rollNumber} · {student.department} · Year {student.year} · {student.classId}
              </p>
              <p className={`text-xs ${t.textMuted} mt-0.5`}>{student.email}</p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='text-center'>
              <p className={`text-2xl font-bold ${t.text}`}>{student.streak}</p>
              <p className={`text-xs ${t.textMuted}`}>Day Streak</p>
            </div>
            <div className='text-center'>
              <p className={`text-2xl font-bold ${t.text}`}>{student.badges?.length || 0}</p>
              <p className={`text-xs ${t.textMuted}`}>Badges</p>
            </div>
            <div className='text-center'>
              <p className={`text-2xl font-bold ${t.text}`}>
                {student.avgScore != null ? `${Math.round(student.avgScore * 100)}%` : '—'}
              </p>
              <p className={`text-xs ${t.textMuted}`}>Avg Score</p>
            </div>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          {[
            { icon: Activity,      label: 'Total Attempts',   value: summary.totalAttempts,  color: 'text-blue-400'   },
            { icon: CheckCircle,   label: 'Completed',        value: summary.completedCount, color: 'text-green-400'  },
            { icon: ShieldAlert,   label: 'Total Violations', value: summary.totalViolations,color: 'text-orange-400' },
            { icon: AlertTriangle, label: 'Flagged Sessions', value: summary.flaggedCount,   color: 'text-red-400'    },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={card} style={cardStyle}>
              <Icon size={16} className={`${color} mb-2`} />
              <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
              <p className={`text-xs ${t.textMuted} mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Performance tier distribution ── */}
        {summary.completedCount > 0 && (
          <div className={`${card} mb-6`} style={cardStyle}>
            <div className='flex items-center gap-2 mb-4'>
              <Target size={15} className='text-purple-400' />
              <h2 className={`font-semibold ${t.text} text-sm`}>Performance Distribution</h2>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              {Object.entries(summary.tiers).map(([tier, count]) => {
                const tc = TIER_STYLE[tier] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' }
                const pct = summary.completedCount > 0 ? Math.round((count / summary.completedCount) * 100) : 0
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

        {/* ── Charts ── */}
        {chartData.length >= 2 && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div className={card} style={cardStyle}>
              <div className='flex items-center gap-2 mb-4'>
                <TrendingUp size={14} className='text-green-400' />
                <h3 className={`font-semibold ${t.text} text-sm`}>Quiz Score Trend</h3>
              </div>
              <ResponsiveContainer width='100%' height={170}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' stroke={theme === 'dark' ? '#2a2a2d' : '#e5e5e5'} />
                  <XAxis dataKey='label' stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Score']} />
                  <Line type='monotone' dataKey='score' stroke='#4ade80' strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={card} style={cardStyle}>
              <div className='flex items-center gap-2 mb-4'>
                <Zap size={14} className='text-blue-400' />
                <h3 className={`font-semibold ${t.text} text-sm`}>Run Attempts per Session</h3>
              </div>
              <ResponsiveContainer width='100%' height={170}>
                <BarChart data={chartData}>
                  <XAxis dataKey='label' stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                  <YAxis stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} style={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Runs']} />
                  <Bar dataKey='runs' fill={theme === 'dark' ? '#60a5fa' : '#3b82f6'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Badges ── */}
        {student.badges?.length > 0 && (
          <div className={`${card} mb-6`} style={cardStyle}>
            <div className='flex items-center gap-2 mb-3'>
              <Award size={14} className='text-yellow-400' />
              <h3 className={`font-semibold ${t.text} text-sm`}>Badges Earned</h3>
            </div>
            <div className='flex flex-wrap gap-2'>
              {student.badges.map(b => {
                const meta = BADGE_META[b] || { label: b, icon: '🏆' }
                return (
                  <span key={b}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                                     ${theme === 'dark' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {meta.icon} {meta.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Full session timeline ── */}
        <div className={card} style={cardStyle}>
          <div className='flex items-center gap-2 mb-4'>
            <Clock size={14} className='text-indigo-400' />
            <h2 className={`font-semibold ${t.text} text-sm`}>Full Session Timeline</h2>
            <span className={`text-xs ${t.textMuted}`}>({timeline.length} sessions)</span>
          </div>

          {timeline.length === 0 ? (
            <p className={`text-sm ${t.textMuted}`}>No sessions yet.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className={`border-b ${t.border} text-left`}>
                    {['Program', 'Attempt', 'Status / Tier', 'Quiz', 'Runs', 'Hints', 'Errors', 'Time', 'Violations', 'Actions'].map(h => (
                      <th key={h} className={`px-3 py-2.5 text-xs font-medium uppercase tracking-wide ${t.textMuted}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.border}`}>
                  {timeline.map(s => {
                    const tc = TIER_STYLE[s.performanceTier]
                    return (
                      <tr key={s.sessionId} className={`${t.hoverBg} transition-colors`}>
                        <td className={`px-3 py-2.5 font-medium ${t.text} text-xs max-w-[140px] truncate`}>
                          {s.programTitle}
                        </td>
                        <td className={`px-3 py-2.5 ${t.textMuted} text-xs`}>
                          #{s.attemptNumber}
                        </td>
                        <td className='px-3 py-2.5'>
                          {tc ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}>
                              {s.performanceTier.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full border
                                              ${theme === 'dark' ? 'bg-white/10 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {s.status}
                            </span>
                          )}
                        </td>
                        <td className={`px-3 py-2.5 ${t.text} text-xs font-medium tabular-nums`}>
                          {s.quizScore != null ? `${Math.round(s.quizScore * 100)}%` : '—'}
                        </td>
                        <td className={`px-3 py-2.5 ${t.textMuted} text-xs tabular-nums`}>{s.runAttempts}</td>
                        <td className={`px-3 py-2.5 ${t.textMuted} text-xs tabular-nums`}>{s.hintsUsed}/3</td>
                        <td className={`px-3 py-2.5 text-xs tabular-nums ${s.errorCount > 5 ? 'text-red-400' : t.textMuted}`}>
                          {s.errorCount}
                        </td>
                        <td className={`px-3 py-2.5 ${t.textMuted} text-xs tabular-nums`}>
                          {s.timeTakenMs ? `${Math.round(s.timeTakenMs / 60000)}m` : '—'}
                        </td>
                        <td className={`px-3 py-2.5 text-xs tabular-nums ${s.violationCount > 0 ? 'text-orange-400' : t.textMuted}`}>
                          {s.violationCount}
                          {s.flagged && <span className='ml-1'>⚠</span>}
                        </td>
                        <td className='px-3 py-2.5'>
                          {s.status === 'complete' && (
                            <button
                              onClick={() => navigate(`/teacher/report/${s.sessionId}`)}
                              className={`text-xs font-medium transition-colors
                                           ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                            >
                              Report
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── AI summaries (last 3 completed) ── */}
        {completed.filter(s => s.teacherSummary).length > 0 && (
          <div className={`${card} mt-6`} style={cardStyle}>
            <div className='flex items-center gap-2 mb-4'>
              <Brain size={14} className='text-blue-400' />
              <h3 className={`font-semibold ${t.text} text-sm`}>Recent AI Summaries</h3>
            </div>
            <div className='space-y-3'>
              {completed.filter(s => s.teacherSummary).slice(0, 3).map((s, i) => (
                <div key={s.sessionId}
                     className={`rounded-lg p-3 border text-xs
                                  ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                  <p className={`font-medium mb-1 ${t.textMuted}`}>
                    {s.programTitle} — Attempt #{s.attemptNumber}
                  </p>
                  <p className={`leading-relaxed ${t.text}`}>{s.teacherSummary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

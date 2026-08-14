// frontend/src/pages/student/Sessions.jsx
// Student's session history page with visual analytics

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  Clock, CheckCircle, AlertTriangle, XCircle, 
  Loader2, Code2, Calendar, Award, TrendingUp, 
  PieChart as PieChartIcon, Target
} from 'lucide-react'
import { 
  PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

export default function Sessions({ user }) {
  const [sessions, setSessions] = useState([])
  const [programs, setPrograms] = useState({}) // programId -> program object lookup
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { theme } = useTheme()

  useEffect(() => {
    async function loadSessions() {
      try {
        // 1. Fetch all programs first (for title lookup)
        const programsSnap = await getDocs(collection(db, 'programs'))
        const programsMap = {}
        programsSnap.docs.forEach(doc => {
          programsMap[doc.id] = { id: doc.id, ...doc.data() }
        })
        setPrograms(programsMap)

        // 2. Fetch all sessions for this student
        const q = query(
          collection(db, 'sessions'),
          where('studentId', '==', user.uid)
        )
        const sessionsSnap = await getDocs(q)
        
        // 3. Map and sort by startedAt descending (most recent first)
        const sessionsData = sessionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        sessionsData.sort((a, b) => {
          const aTime = a.startedAt?.seconds || 0
          const bTime = b.startedAt?.seconds || 0
          return bTime - aTime // descending
        })
        
        setSessions(sessionsData)
      } catch (err) {
        console.error('Failed to load sessions:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadSessions()
  }, [user.uid])

  // Theme classes - matching other student pages
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      cardBg: 'rgba(26, 26, 29, 0.7)',
      border: 'border-white/10',
      hoverBg: 'hover:bg-white/5'
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      border: 'border-[#E5E5E5]',
      hoverBg: 'hover:bg-[#F5F5F5]'
    }
  }[theme]

  // Status colors for charts (theme-aware)
  const statusColors = {
    complete: theme === 'dark' ? '#4ade80' : '#22c55e',
    active: theme === 'dark' ? '#60a5fa' : '#3b82f6',
    submitted: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    processing: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    pipeline_error: theme === 'dark' ? '#f87171' : '#ef4444'
  }

  // Compute analytics data
  const statusBreakdown = sessions.reduce((acc, s) => {
    const status = s.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusBreakdown).map(([status, count]) => ({
    name: status,
    value: count,
    color: statusColors[status] || (theme === 'dark' ? '#6b7280' : '#9ca3af')
  }))

  // Quiz score trend data (only completed sessions with scores)
  const completedSessions = sessions
    .filter(s => s.status === 'complete' && s.quizScore != null)
    .sort((a, b) => (a.startedAt?.seconds || 0) - (b.startedAt?.seconds || 0)) // chronological

  const scoreData = completedSessions.map((s, idx) => ({
    name: `S${idx + 1}`,
    score: Math.round((s.quizScore || 0) * 100),
    date: s.startedAt?.seconds 
      ? new Date(s.startedAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Unknown'
  }))

  // Summary stats
  const totalSessions = sessions.length
  const completedCount = sessions.filter(s => s.status === 'complete').length
  const completionRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0
  const avgQuizScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.quizScore || 0), 0) / completedSessions.length * 100)
    : 0

  // Status badge style helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return theme === 'dark' 
          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'submitted':
      case 'processing':
        return theme === 'dark'
          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'complete':
        return theme === 'dark'
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-green-100 text-green-700 border-green-200'
      case 'pipeline_error':
        return theme === 'dark'
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-red-100 text-red-700 border-red-200'
      default:
        return theme === 'dark'
          ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
          : 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock size={14} />
      case 'submitted':
      case 'processing':
        return <Loader2 size={14} className='animate-spin' />
      case 'complete':
        return <CheckCircle size={14} />
      case 'pipeline_error':
        return <XCircle size={14} />
      default:
        return <AlertTriangle size={14} />
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'Unknown'
    const date = new Date(timestamp.seconds * 1000)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center transition-colors duration-300`}>
        <div className='flex items-center gap-2'>
          <Loader2 className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} animate-spin`} size={24} />
          <p className={t.textMuted}>Loading sessions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-8 text-center`}
             style={{ backdropFilter: 'blur(20px)' }}>
          <AlertTriangle className={theme === 'dark' ? 'text-red-400' : 'text-red-500'} size={32} />
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} text-sm mt-3`}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-12 px-6 transition-colors duration-300`}>
      <div className='max-w-7xl mx-auto'>
        
        {/* Header */}
        <div className='mb-10'>
          <h1 className={`text-3xl lg:text-4xl font-bold ${t.text} leading-tight`}>
            Session History
          </h1>
          <p className={`${t.textMuted} mt-2 text-base`}>
            Your coding journey visualized
          </p>
        </div>

        {/* Empty state - no sessions at all */}
        {sessions.length === 0 ? (
          <div
            className={`rounded-2xl border ${t.border} p-12 shadow-xl text-center transition-all duration-300`}
            style={{
              backgroundColor: t.cardBg,
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              boxShadow: theme === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                : '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Code2 size={48} className={t.textMuted} strokeWidth={1.5} />
            <p className={`${t.text} text-lg font-semibold mt-4 mb-2`}>
              No sessions yet
            </p>
            <p className={`${t.textMuted} text-sm`}>
              Head to Programs to start your first lab
            </p>
          </div>
        ) : (
          <>
            {/* Analytics Cards Row */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10'>
              
              {/* Summary Stats Card */}
              <div
                className={`rounded-2xl border ${t.border} p-6 shadow-xl transition-all duration-300`}
                style={{
                  backgroundColor: t.cardBg,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  boxShadow: theme === 'dark'
                    ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className='flex items-center gap-2 mb-6'>
                  <Target size={20} className={theme === 'dark' ? 'text-purple-400' : 'text-purple-500'} />
                  <h2 className={`text-base font-bold ${t.text}`}>Summary</h2>
                </div>
                
                <div className='space-y-4'>
                  {/* Total Sessions */}
                  <div className='flex items-center gap-3'>
                    <div className={`w-12 h-12 rounded-full border-2 ${theme === 'dark' ? 'border-blue-500' : 'border-blue-600'} 
                                   flex items-center justify-center`}>
                      <Code2 size={20} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${t.text}`}>{totalSessions}</p>
                      <p className={`text-xs ${t.textMuted}`}>Total Sessions</p>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className='flex items-center gap-3'>
                    <div className={`w-12 h-12 rounded-full border-2 ${theme === 'dark' ? 'border-green-500' : 'border-green-600'} 
                                   flex items-center justify-center`}>
                      <CheckCircle size={20} className={theme === 'dark' ? 'text-green-400' : 'text-green-500'} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${t.text}`}>{completionRate}%</p>
                      <p className={`text-xs ${t.textMuted}`}>Completion Rate</p>
                    </div>
                  </div>

                  {/* Avg Quiz Score */}
                  {completedSessions.length > 0 && (
                    <div className='flex items-center gap-3'>
                      <div className={`w-12 h-12 rounded-full border-2 ${theme === 'dark' ? 'border-yellow-500' : 'border-yellow-600'} 
                                     flex items-center justify-center`}>
                        <Award size={20} className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} />
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${t.text}`}>{avgQuizScore}%</p>
                        <p className={`text-xs ${t.textMuted}`}>Avg Quiz Score</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Breakdown Pie Chart */}
              <div
                className={`rounded-2xl border ${t.border} p-6 shadow-xl transition-all duration-300`}
                style={{
                  backgroundColor: t.cardBg,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  boxShadow: theme === 'dark'
                    ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className='flex items-center gap-2 mb-4'>
                  <PieChartIcon size={20} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} />
                  <h2 className={`text-base font-bold ${t.text}`}>Status Breakdown</h2>
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? 'rgba(26, 26, 29, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: '8px',
                        color: theme === 'dark' ? '#EDEDED' : '#171717'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className='grid grid-cols-2 gap-2 mt-4'>
                  {pieData.map((entry) => (
                    <div key={entry.name} className='flex items-center gap-2'>
                      <div className='w-3 h-3 rounded-full' style={{ backgroundColor: entry.color }} />
                      <span className={`text-xs ${t.textMuted}`}>
                        {entry.name}: <span className={t.text}>{entry.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Score Trend Bar Chart */}
              <div
                className={`rounded-2xl border ${t.border} p-6 shadow-xl transition-all duration-300`}
                style={{
                  backgroundColor: t.cardBg,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  boxShadow: theme === 'dark'
                    ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className='flex items-center gap-2 mb-4'>
                  <TrendingUp size={20} className={theme === 'dark' ? 'text-green-400' : 'text-green-500'} />
                  <h2 className={`text-base font-bold ${t.text}`}>Quiz Score Trend</h2>
                </div>
                
                {scoreData.length < 2 ? (
                  <div className='flex flex-col items-center justify-center h-[200px] text-center'>
                    <TrendingUp size={32} className={t.textMuted} strokeWidth={1.5} />
                    <p className={`${t.textMuted} text-sm mt-3`}>
                      Complete more sessions to see your score trend
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={scoreData}>
                      <XAxis 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} 
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#A1A1A3' : '#737373'} 
                        style={{ fontSize: '12px' }}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 29, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#EDEDED' : '#171717'
                        }}
                        formatter={(value) => [`${value}%`, 'Score']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return payload[0].payload.date
                          }
                          return label
                        }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill={theme === 'dark' ? '#4ade80' : '#22c55e'}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* All Sessions List */}
            <div className='mt-12'>
              <h2 className={`text-lg font-bold ${t.text} mb-6`}>All Sessions</h2>
              
              <div className='space-y-3'>
                {sessions.map((session) => {
                  const program = programs[session.programId]
                  
                  return (
                    <div
                      key={session.id}
                      className={`rounded-xl border ${t.border} p-5 shadow-lg ${t.hoverBg} transition-all duration-300`}
                      style={{
                        backgroundColor: t.cardBg,
                        backdropFilter: 'blur(20px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(150%)'
                      }}
                    >
                      <div className='flex items-start justify-between gap-4 flex-wrap'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className={`text-base font-bold ${t.text} truncate`}>
                              {program?.title || 'Unknown Program'}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(session.status)}`}>
                              {getStatusIcon(session.status)}
                              {session.status}
                            </span>
                          </div>
                          
                          <div className='flex items-center gap-4 flex-wrap text-sm'>
                            <div className='flex items-center gap-1.5'>
                              <Calendar size={14} className={t.textMuted} />
                              <span className={t.textMuted}>{formatDate(session.startedAt)}</span>
                            </div>
                            
                            {session.quizScore != null && (
                              <div className='flex items-center gap-1.5'>
                                <Award size={14} className={t.textMuted} />
                                <span className={t.textMuted}>
                                  Score: <span className={t.text}>{Math.round(session.quizScore * 100)}%</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {session.status === 'complete' && session.reportId && (
                          <button
                            onClick={() => window.location.href = `/student/report/${session.reportId}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                       ${theme === 'dark' 
                                         ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30' 
                                         : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                                       }`}
                          >
                            View Report
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

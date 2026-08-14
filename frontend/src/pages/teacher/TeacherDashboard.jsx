// frontend/src/pages/teacher/TeacherDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { Users, BookOpen, AlertTriangle, CheckCircle, BarChart3, Plus, History } from 'lucide-react'

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate()
  const { theme } = useOutletContext()
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    flagged: 0,
    reportsReady: 0,
  })
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState(null)

  // Theme classes
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      textSubtle: 'text-[#737373]',
      border: 'border-white/10',
      borderSubtle: 'border-white/[0.06]',
      cardBg: 'rgba(26, 26, 29, 0.7)',
      hoverBg: 'hover:bg-white/[0.03]',
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      textSubtle: 'text-[#A3A3A3]',
      border: 'border-[#E5E5E5]',
      borderSubtle: 'border-[#F5F5F5]',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      hoverBg: 'hover:bg-[#FAFAFA]',
    }
  }[theme]

  useEffect(() => {
    async function loadStats() {
      try {
        // Count students
        const studentQ = query(collection(db, 'users'), where('role', '==', 'student'))
        const studentSnap = await getDocs(studentQ)

        // Count sessions
        const sessionSnap = await getDocs(collection(db, 'sessions'))
        const sessionsData = sessionSnap.docs.map(d => d.data())

        setStats({
          totalStudents: studentSnap.size,
          totalSessions: sessionsData.length,
          flagged:       sessionsData.filter(s => s.flagged).length,
          reportsReady:  sessionsData.filter(s => s.status === 'complete').length,
        })

        // Fetch recent sessions for the table
        try {
          const res = await fetch('/api/reports/sessions/recent')
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`)
          }
          
          const data = await res.json()
          setSessions(data.sessions || [])
          setSessionsError(null)
        } catch (e) {
          console.error('Failed to load recent sessions:', e)
          setSessionsError(e.message)
          setSessions([])
        }

      } catch (e) {
        console.error('Failed to load stats:', e)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center transition-colors duration-300`}>
        <p className={t.textMuted}>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-12 px-6 transition-colors duration-300`}>
      <div className='max-w-6xl mx-auto'>
        
        {/* Header - Compact */}
        <div className='flex items-start justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-semibold mb-1'>Teacher Dashboard</h1>
            <p className={`text-sm ${t.textMuted}`}>
              Class overview and student performance insights
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => navigate('/teacher/programs')}
              className='flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg
                         transition-all duration-200'
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                color: theme === 'dark' ? '#A5B4FC' : '#6366F1'
              }}
            >
              <Plus size={14} strokeWidth={2} /> Upload Program
            </button>
            <button
              onClick={() => navigate('/teacher/analytics')}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg
                         ${t.textMuted} transition-colors duration-200 border ${t.border}`}
              style={{
                backgroundColor: t.cardBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <BarChart3 size={14} strokeWidth={2} /> View Analytics
            </button>
          </div>
        </div>

        {/* Stat Cards - Compact Notion-style */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          {[
            { icon: Users,        label: 'Students',      value: stats.totalStudents, color: theme === 'dark' ? '#60A5FA' : '#3B82F6'   },
            { icon: BookOpen,     label: 'Sessions',      value: stats.totalSessions, color: theme === 'dark' ? '#A78BFA' : '#8B5CF6' },
            { icon: CheckCircle,  label: 'Reports Ready', value: stats.reportsReady,  color: theme === 'dark' ? '#34D399' : '#10B981'  },
            { icon: AlertTriangle,label: 'Flagged',       value: stats.flagged,       color: theme === 'dark' ? '#FB923C' : '#F97316'    },
          ].map(({ icon: Icon, label, value, color }) => (
            <div 
              key={label}
              className={`rounded-lg border ${t.border} p-4 transition-all duration-200`}
              style={{
                backgroundColor: t.cardBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Icon size={16} style={{ color }} strokeWidth={2} className='mb-3' />
              <p className='text-2xl font-semibold mb-0.5'>{value}</p>
              <p className={`text-xs uppercase tracking-wide font-medium ${t.textSubtle}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Sessions Table */}
        <div 
          className={`rounded-lg border ${t.border} overflow-hidden`}
          style={{
            backgroundColor: t.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className={`px-6 py-4 border-b ${t.borderSubtle} flex items-center gap-2`}>
            <History size={14} className={t.textMuted} />
            <h2 className='font-medium text-sm'>Recent Sessions</h2>
          </div>
          
          {sessionsError ? (
            <div className='p-6'>
              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
                <p className='text-sm text-red-400 font-medium mb-1'>
                  Failed to load sessions
                </p>
                <p className='text-xs text-red-300/60'>
                  {sessionsError}
                </p>
                <p className='text-xs text-red-300/60 mt-2'>
                  Check that the backend is running and accessible at /api/reports/sessions/recent
                </p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className={`p-6 text-center ${t.textMuted} text-sm`}>
              {stats.totalSessions > 0 
                ? 'Sessions exist but could not be loaded. Check the error above.'
                : 'No sessions yet. Reports appear here after students submit.'}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className={`border-b ${t.borderSubtle}`}>
                    {['Student ID','Program','Status','Quiz Score','Hints','Flagged',''].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide ${t.textSubtle}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.borderSubtle}`}>
                  {sessions.map(s => (
                    <tr key={s.sessionId} className={`transition-colors ${t.hoverBg}`}>
                      <td className={`px-4 py-3 font-mono text-xs ${t.textMuted}`}>
                        {s.studentId?.slice(0,8)}...
                      </td>
                      <td className={`px-4 py-3 text-xs ${t.textMuted}`}>
                        {s.programId?.slice(0,12)}...
                      </td>
                      <td className='px-4 py-3'>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                          ${s.status==='complete'
                                            ? (theme === 'dark' ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-700')
                                            : s.status==='processing'
                                            ? (theme === 'dark' ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-700')
                                            : (theme === 'dark' ? 'bg-white/10 text-[#A1A1A3]' : 'bg-gray-100 text-gray-600')}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${t.text} font-medium text-sm`}>
                        {Math.round((s.quizScore||0)*100)}%
                      </td>
                      <td className={`px-4 py-3 ${t.textMuted} text-sm`}>{s.hintsUsed}/3</td>
                      <td className='px-4 py-3'>
                        {s.flagged && (
                          <span className={`text-xs font-medium ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                            ⚠ Flagged
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {s.status === 'complete' && (
                          <button
                            onClick={() => navigate(`/teacher/report/${s.sessionId}`)}
                            className='text-xs font-medium transition-colors'
                            style={{
                              color: theme === 'dark' ? '#A5B4FC' : '#6366F1'
                            }}
                          >
                            View Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

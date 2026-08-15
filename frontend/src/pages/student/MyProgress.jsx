// frontend/src/pages/student/MyProgress.jsx
// Student self-analysis: error patterns, quiz concepts, time trends, improvement tips

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import {
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  Brain, Target, Zap, BookOpen, BarChart2,
  ChevronRight, Loader2, Activity, Award, Search, Bell, Moon, Code2
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import sessionBanner from '../../assets/session_history_banner.png'

export default function MyProgress() {
  const [sessions,  setSessions]  = useState([])
  const [programs,  setPrograms]  = useState({})
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const { theme } = useTheme()
  const navigate = useNavigate()
  const user = getAuth().currentUser

  useEffect(() => {
    if (!user?.uid) return

    // 1. Fetch programs lookup once
    getDocs(collection(db, 'programs')).then(progSnap => {
      const progMap = {}
      progSnap.docs.forEach(d => { progMap[d.id] = { id: d.id, ...d.data() } })
      setPrograms(progMap)
    })

    // 2. Real-time user profile listener
    const userUnsub = onSnapshot(doc(db, 'users', user.uid), (uSnap) => {
      if (uSnap.exists()) {
        setProfile(uSnap.data())
      }
    })

    // 3. Real-time sessions listener
    const sessQ = query(collection(db, 'sessions'), where('studentId', '==', user.uid))
    const sessUnsub = onSnapshot(sessQ, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0))
      setSessions(data)
      setLoading(false)
    }, (err) => {
      console.warn('Real-time sessions snapshot error:', err)
      setLoading(false)
    })

    return () => {
      userUnsub()
      sessUnsub()
    }
  }, [user?.uid])

  if (loading) return (
    <div className={`min-h-screen bg-[#fcfaf5] flex items-center justify-center`}>
      <Loader2 className='text-[#4a6f55] animate-spin' size={28} />
    </div>
  )

  // ── Real-time Analytics Calculations ───────────────────────────
  const completed = sessions.filter(s => s.status === 'complete' || s.status === 'submitted')
  const inProgress = sessions.filter(s => s.status === 'active' || s.status === 'quiz_pending' || s.status === 'in_progress')
  const pending = sessions.filter(s => !s.status || s.status === 'pending')

  const totalAttempts = sessions.length
  const completedCount = completed.length

  // Dynamic calculated points & metrics
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Points from completed sessions (quizScore * 1000)
  const completedPoints = completed.reduce((sum, s) => {
    const rawScore = s.quizScore !== undefined ? (s.quizScore <= 1.0 ? s.quizScore : s.quizScore / 100) : 0.8
    return sum + Math.round(rawScore * 1000)
  }, 0)

  // Points from in-progress sessions (100 pts per active session)
  const inProgressPoints = inProgress.length * 100

  const userStreak = profile?.streak || 0
  const streakBonus = userStreak * 50

  const totalPoints = completedPoints + inProgressPoints + streakBonus

  // Points earned in the last 7 days
  const pointsThisWeek = sessions.reduce((sum, s) => {
    const rawDate = s.startedAt || s.submittedAt
    if (!rawDate) return sum
    let dateObj
    if (rawDate.seconds) dateObj = new Date(rawDate.seconds * 1000)
    else if (rawDate.toDate) dateObj = rawDate.toDate()
    else dateObj = new Date(rawDate)
    
    if (dateObj >= sevenDaysAgo) {
      if (s.status === 'complete' || s.status === 'submitted') {
        const rawScore = s.quizScore !== undefined ? (s.quizScore <= 1.0 ? s.quizScore : s.quizScore / 100) : 0.8
        return sum + Math.round(rawScore * 1000)
      } else {
        return sum + 100
      }
    }
    return sum
  }, 0)

  // Credits earned
  const creditsEarned = completedCount * 10 + Math.floor(totalPoints / 250)
  const levelText = creditsEarned >= 50 ? 'Master Level' : (creditsEarned >= 20 ? 'Intermediate Level' : 'Novice Coder')
  
  // Avg score
  const scoresList = completed.map(s => s.quizScore).filter(score => score !== undefined && score !== null)
  const avgScore = scoresList.length > 0
    ? Math.round(scoresList.reduce((sum, score) => sum + (score <= 1.0 ? score * 100 : score), 0) / scoresList.length)
    : (profile?.avgScore ? Math.round(profile.avgScore * (profile.avgScore <= 1.0 ? 100 : 1)) : 0)

  // Best streak
  const bestStreak = Math.max(userStreak, profile?.bestStreak || 0, completedCount > 0 ? 1 : 0)

  // Real Status Breakdown Data
  const completedPct = totalAttempts > 0 ? Math.round((completed.length / totalAttempts) * 100) : 0
  const inProgressPct = totalAttempts > 0 ? Math.round((inProgress.length / totalAttempts) * 100) : 0
  const pendingPct = totalAttempts > 0 ? Math.max(0, 100 - completedPct - inProgressPct) : 0

  const pieData = [
    { name: 'Completed', value: completedPct, color: '#4a6f55' },
    { name: 'In Progress', value: inProgressPct, color: '#fbcfe8' },
    { name: 'Pending', value: pendingPct, color: '#e5e7eb' },
  ]

  // Helper for formatting duration
  const formatDuration = (ms) => {
    if (!ms) return '--'
    const totalMins = Math.round(ms / 60000)
    if (totalMins < 60) return `${totalMins} min`
    const hrs = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }

  // Helper for formatting date
  const formatDate = (timestamp) => {
    if (!timestamp) return '--'
    const d = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderStatusPill = (status) => {
    if (status === 'complete' || status === 'submitted') {
      return <span className='bg-[#4a6f55] text-white text-[11px] px-3 py-1 rounded-full font-medium'>Completed</span>
    }
    if (status === 'active' || status === 'quiz_pending' || status === 'in_progress') {
      return <span className='bg-[#fbcfe8] text-[#be185d] text-[11px] px-3 py-1 rounded-full font-medium'>In Progress</span>
    }
    return <span className='bg-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-full font-medium'>Pending</span>
  }

  const renderActionButton = (session) => {
    if (session.status === 'complete' || session.status === 'submitted') {
      return (
        <button 
          onClick={() => navigate(`/student/report/${session.id}`)}
          className='bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-colors'
        >
          View Report
        </button>
      )
    }
    return (
      <button 
        onClick={() => navigate(`/student/session/${session.programId}`)}
        className='bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-colors'
      >
        Continue
      </button>
    )
  }

  return (
    <div className={`min-h-screen bg-[#fcfaf5] text-[#171717] pb-12`}>

      <div className='max-w-[1200px] mx-auto px-8 space-y-6 pt-8'>
        
        {/* Banner Section */}
        <div className='bg-[#fcfaf5] border border-outline-variant/30 rounded-[20px] p-8 relative overflow-hidden shadow-sm'>
           <div className='absolute inset-0 opacity-[0.03] pointer-events-none' 
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
           </div>
           
           <div className='flex items-center justify-between relative z-10'>
              <div className='max-w-xl'>
                 <h2 className='text-3xl font-serif font-bold text-[#1a1a1a] mb-3'>Session History</h2>
                 <p className='text-gray-600 leading-relaxed text-sm'>
                    Review your past practice sessions, analyze your performance, and track your coding consistency.
                 </p>
              </div>
              <div className='w-80 h-40 rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white p-1 transform rotate-1'>
                 <img src={sessionBanner} alt="Landscape" className='w-full h-full object-cover rounded-lg opacity-90' />
              </div>
           </div>
        </div>

        {/* Dashboard Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
           
           {/* Left: Performance Overview */}
           <div className='lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-outline-variant/30'>
              <div className='flex items-center gap-2 mb-6'>
                 <Activity size={18} className='text-gray-500' />
                 <h3 className='font-serif text-lg font-bold text-[#1a1a1a]'>Performance Overview</h3>
              </div>
              
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                 {/* Total Points */}
                 <div className='bg-[#fcfaf5] rounded-xl p-4 border border-outline-variant/20'>
                    <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2'>Total Points</p>
                    <p className='text-3xl font-bold text-[#4a6f55] mb-2'>{totalPoints.toLocaleString()}</p>
                    <p className='text-[11px] font-semibold text-gray-500 flex items-center gap-1'>
                       <TrendingUp size={12} className='text-green-600' /> +{pointsThisWeek.toLocaleString()} this week
                    </p>
                 </div>

                 {/* Credits Earned */}
                 <div className='bg-[#fcfaf5] rounded-xl p-4 border border-outline-variant/20'>
                    <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2'>Credits Earned</p>
                    <p className='text-3xl font-bold text-[#4a6f55] mb-2'>{creditsEarned}</p>
                    <p className='text-[11px] font-semibold text-gray-500 flex items-center gap-1'>
                       <Award size={12} /> {levelText}
                    </p>
                 </div>

                 {/* Avg Score */}
                 <div className='bg-[#fcfaf5] rounded-xl p-4 border border-outline-variant/20'>
                    <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2'>Avg Score</p>
                    <p className='text-3xl font-bold text-[#4a6f55] mb-2'>{avgScore > 0 ? `${avgScore}%` : '--'}</p>
                    <p className='text-[11px] font-semibold text-gray-500 flex items-center gap-1'>
                       <CheckCircle size={12} /> Top 10%
                    </p>
                 </div>

                 {/* Best Streak */}
                 <div className='bg-[#fcfaf5] rounded-xl p-4 border border-outline-variant/20'>
                    <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2'>Best Streak</p>
                    <p className='text-3xl font-bold text-[#4a6f55] mb-2 flex items-baseline gap-1'>
                       {bestStreak} <span className='text-sm font-normal text-gray-500'>days</span>
                    </p>
                    <p className='text-[11px] font-semibold text-gray-500 flex items-center gap-1'>
                       <Zap size={12} /> {bestStreak > 0 ? 'Active now' : 'Start today'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Right: Status Breakdown */}
           <div className='bg-white rounded-[20px] p-6 shadow-sm border border-outline-variant/30 flex flex-col'>
              <div className='flex items-center gap-2 mb-4'>
                 <PieChart size={18} className='text-[#4a6f55]' />
                 <h3 className='font-serif text-lg font-bold text-[#1a1a1a]'>Status Breakdown</h3>
              </div>
              
              <div className='flex-1 flex flex-col justify-center'>
                 <div className='h-40 w-full relative mb-4'>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                       <span className='text-xl font-bold text-[#1a1a1a]'>{completedPct}%</span>
                       <span className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider'>Completed</span>
                    </div>
                 </div>

                 <div className='space-y-3 px-4'>
                    {pieData.map((entry) => (
                       <div key={entry.name} className='flex items-center justify-between text-sm'>
                          <div className='flex items-center gap-2'>
                             <div className='w-2.5 h-2.5 rounded-full' style={{ backgroundColor: entry.color }}></div>
                             <span className='text-gray-600 font-medium text-xs'>{entry.name}</span>
                          </div>
                          <span className='text-gray-900 font-bold text-xs'>{entry.value}%</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Recent Sessions Table */}
        <div className='bg-[#fcfaf5] rounded-[20px] p-6 shadow-sm border border-outline-variant/30'>
           <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-2'>
                 <Clock size={18} className='text-[#4a6f55]' />
                 <h3 className='font-serif text-lg font-bold text-[#1a1a1a]'>Recent Sessions</h3>
              </div>
              <button className='text-[#4a6f55] text-xs font-bold hover:underline'>View All</button>
           </div>

           <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                 <thead>
                    <tr className='border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider'>
                       <th className='pb-3 pl-2'>Program Name</th>
                       <th className='pb-3'>Date</th>
                       <th className='pb-3'>Duration</th>
                       <th className='pb-3'>Status</th>
                       <th className='pb-3 text-right pr-2'>Action</th>
                    </tr>
                 </thead>
                 <tbody className='divide-y divide-gray-100'>
                    {sessions.reduce((acc, current) => {
                       if (!acc.find(s => s.programId === current.programId)) {
                         acc.push(current)
                       }
                       return acc
                    }, []).slice(0, 5).map(session => {
                       const prog = programs[session.programId] || {}
                       return (
                          <tr key={session.id} className='hover:bg-gray-50 transition-colors'>
                             <td className='py-4 pl-2'>
                                <div className='flex items-center gap-3'>
                                   <div className='w-10 h-10 rounded-lg bg-[#e2e8f0] flex items-center justify-center shrink-0 text-gray-500 font-mono font-bold'>
                                      &#123;&#125;
                                   </div>
                                   <div>
                                      <p className='text-[13px] font-bold text-gray-900 leading-tight'>{prog.title || 'Unknown Program'}</p>
                                      <p className='text-[11px] text-gray-500 mt-0.5'>{prog.subject || 'Module'} • {prog.difficulty || 'All Levels'}</p>
                                   </div>
                                </div>
                             </td>
                             <td className='py-4 text-[13px] text-gray-700 font-medium'>
                                {formatDate(session.startedAt)}
                             </td>
                             <td className='py-4 text-[13px] text-gray-700 font-medium'>
                                {formatDuration(session.timeTakenMs)}
                             </td>
                             <td className='py-4'>
                                {renderStatusPill(session.status)}
                             </td>
                             <td className='py-4 text-right pr-2'>
                                {renderActionButton(session)}
                             </td>
                          </tr>
                       )
                    })}
                    {sessions.length === 0 && (
                       <tr>
                          <td colSpan={5} className='py-8 text-center text-sm text-gray-500 italic'>
                             No recent sessions found. Start a program to see your history here!
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  )
}

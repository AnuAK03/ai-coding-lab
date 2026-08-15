// frontend/src/pages/teacher/TeacherDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { Users, AlertTriangle, BookOpen, CheckCircle, TrendingUp, TrendingDown, ArrowUpRight, AlertCircle, PauseCircle } from 'lucide-react'

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate()
  const { theme } = useOutletContext()
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    belowAverage: 0,
    activePrograms: 0,
    completionRate: 0,
    distribution: { excel: 0, satis: 0, needs: 0 },
    monthlyData: [0, 0, 0, 0, 0, 0]
  })
  const [loading, setLoading] = useState(true)

  // Get current date
  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  const today = new Date().toLocaleDateString('en-US', dateOptions)

  useEffect(() => {
    async function loadStats() {
      try {
        // Count students
        const studentQ = query(collection(db, 'users'), where('role', '==', 'student'))
        const studentSnap = await getDocs(studentQ)
        const students = studentSnap.docs.map(d => d.data())

        let excel = 0, satis = 0, needs = 0
        students.forEach(s => {
          const score = s.avgScore || 0
          if (score >= 0.8) excel++
          else if (score >= 0.5) satis++
          else needs++
        })

        // Count active programs
        const progQ = query(collection(db, 'programs'), where('active', '==', true))
        const progSnap = await getDocs(progQ)

        // Count sessions
        const sessionSnap = await getDocs(collection(db, 'sessions'))
        const sessionsData = sessionSnap.docs.map(d => d.data())

        // Calculate completion rate
        const completedSessions = sessionsData.filter(s => s.status === 'complete').length
        const completionRate = sessionsData.length > 0 
          ? Math.round((completedSessions / sessionsData.length) * 100) 
          : 0

        // Calculate monthly completions for the first 6 months
        const monthlyCounts = [0, 0, 0, 0, 0, 0]
        sessionsData.forEach(s => {
          if (s.status === 'complete' && s.createdAt) {
            const date = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
            const m = date.getMonth()
            if (m < 6) monthlyCounts[m]++
          }
        })

        setStats({
          totalStudents: studentSnap.size,
          belowAverage: needs,
          activePrograms: progSnap.size,
          completionRate: completionRate,
          distribution: { excel, satis, needs },
          monthlyData: monthlyCounts
        })

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
      <div className='min-h-screen flex items-center justify-center bg-[#FAFAF5] transition-colors duration-300'>
        <p className='text-[#6B6B6B]'>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#FAFAF5] transition-colors duration-300 py-6 px-8'>
      <div className='max-w-[1180px] mx-auto space-y-6'>
        {/* Welcome Header */}
        <div className='mb-2'>
          <h1 className='font-headline-lg text-headline-lg tracking-tight text-[#1F1F1F] mb-0.5 leading-tight'>Welcome back, Professor.</h1>
          <p className='text-[13px] text-[#6B6B6B]'>{today}</p>
        </div>

        {/* KPI Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          {/* Total Students */}
          <div className='bg-white rounded-xl p-4 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
            <div className='flex items-start justify-between mb-3'>
              <div className='w-9 h-9 bg-[#E8F5E9] rounded-lg flex items-center justify-center'>
                <Users size={18} className='text-[#6B8E6F]' strokeWidth={2} />
              </div>
              <div className='flex items-center gap-0.5 text-[#6B8E6F] bg-[#E8F5E9] px-1.5 py-0.5 rounded-md text-[10px] font-semibold'>
                <TrendingUp size={10} strokeWidth={2.5} />
                +5%
              </div>
            </div>
            <p className='text-[11px] text-[#6B6B6B] mb-1 font-medium'>Total Students</p>
            <p className='text-[32px] font-bold text-[#1F1F1F] leading-none'>{stats.totalStudents}</p>
          </div>

          {/* Below Average */}
          <div className='bg-white rounded-xl p-4 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
            <div className='flex items-start justify-between mb-3'>
              <div className='w-9 h-9 bg-[#FFEBEE] rounded-lg flex items-center justify-center'>
                <AlertTriangle size={18} className='text-[#D32F2F]' strokeWidth={2} />
              </div>
              <div className='flex items-center gap-0.5 text-[#D32F2F] bg-[#FFEBEE] px-1.5 py-0.5 rounded-md text-[10px] font-semibold'>
                <TrendingDown size={10} strokeWidth={2.5} />
                -2
              </div>
            </div>
            <p className='text-[11px] text-[#6B6B6B] mb-1 font-medium'>Below Average</p>
            <p className='text-[32px] font-bold text-[#1F1F1F] leading-none'>{stats.belowAverage}</p>
          </div>

          {/* Active Programs */}
          <div className='bg-white rounded-xl p-4 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
            <div className='flex items-start justify-between mb-3'>
              <div className='w-9 h-9 bg-[#E0F2F1] rounded-lg flex items-center justify-center'>
                <BookOpen size={18} className='text-[#00796B]' strokeWidth={2} />
              </div>
              <div className='flex items-center gap-0.5 text-[#6B6B6B] bg-[#F5F5F5] px-1.5 py-0.5 rounded-md text-[10px] font-semibold'>
                0
              </div>
            </div>
            <p className='text-[11px] text-[#6B6B6B] mb-1 font-medium'>Active Programs</p>
            <p className='text-[32px] font-bold text-[#1F1F1F] leading-none'>{stats.activePrograms}</p>
          </div>

          {/* Completion Rate */}
          <div className='bg-white rounded-xl p-4 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
            <div className='flex items-start justify-between mb-3'>
              <div className='w-9 h-9 bg-[#E8F5E9] rounded-lg flex items-center justify-center'>
                <CheckCircle size={18} className='text-[#6B8E6F]' strokeWidth={2} />
              </div>
              <div className='flex items-center gap-0.5 text-[#6B8E6F] bg-[#E8F5E9] px-1.5 py-0.5 rounded-md text-[10px] font-semibold'>
                <TrendingUp size={10} strokeWidth={2.5} />
                +2%
              </div>
            </div>
            <p className='text-[11px] text-[#6B6B6B] mb-1 font-medium'>Completion Rate</p>
            <p className='text-[32px] font-bold text-[#1F1F1F] leading-none mb-2.5'>{stats.completionRate}%</p>
            <div className='w-full bg-[#E8E8E0] h-1.5 rounded-full overflow-hidden'>
              <div 
                className='h-full bg-[#6B8E6F] rounded-full transition-all duration-500'
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-3'>
          {/* Student Performance Donut Chart */}
          <div className='bg-white rounded-xl p-5 border border-[#E8E8E0] col-span-1 lg:col-span-2'>
            <h3 className='text-[15px] font-semibold text-[#1F1F1F] mb-5'>Student Performance</h3>
            <div className='flex flex-col items-center justify-center'>
              {/* Donut Chart */}
              <div className='relative w-40 h-40 mb-6'>
                <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                  {/* Background circle */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#E8E8E0'
                    strokeWidth='11'
                  />
                  {/* Excel segment - Green */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#6B8E6F'
                    strokeWidth='11'
                    strokeDasharray={`${(stats.distribution.excel / (stats.totalStudents || 1)) * 239} 239`}
                    strokeDashoffset='0'
                    strokeLinecap='round'
                  />
                  {/* Satisfactory segment - Light Green */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#A5D6A7'
                    strokeWidth='11'
                    strokeDasharray={`${(stats.distribution.satis / (stats.totalStudents || 1)) * 239} 239`}
                    strokeDashoffset={`-${(stats.distribution.excel / (stats.totalStudents || 1)) * 239}`}
                    strokeLinecap='round'
                  />
                  {/* Needs segment - Light Red */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#FFCDD2'
                    strokeWidth='11'
                    strokeDasharray={`${(stats.distribution.needs / (stats.totalStudents || 1)) * 239} 239`}
                    strokeDashoffset={`-${((stats.distribution.excel + stats.distribution.satis) / (stats.totalStudents || 1)) * 239}`}
                    strokeLinecap='round'
                  />
                </svg>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-[28px] font-bold text-[#1F1F1F]'>{stats.totalStudents}</span>
                  <span className='text-[11px] text-[#6B6B6B] font-medium'>Total</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className='flex items-center justify-center gap-5 text-[11px]'>
                <div className='flex items-center gap-1.5'>
                  <div className='w-2.5 h-2.5 rounded-full bg-[#6B8E6F]'></div>
                  <span className='text-[#6B6B6B] font-medium'>Excel ({Math.round((stats.distribution.excel / (stats.totalStudents || 1)) * 100)}%)</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-2.5 h-2.5 rounded-full bg-[#A5D6A7]'></div>
                  <span className='text-[#6B6B6B] font-medium'>Satis ({Math.round((stats.distribution.satis / (stats.totalStudents || 1)) * 100)}%)</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-2.5 h-2.5 rounded-full bg-[#FFCDD2]'></div>
                  <span className='text-[#6B6B6B] font-medium'>Needs ({Math.round((stats.distribution.needs / (stats.totalStudents || 1)) * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Progress Line Chart */}
          <div className='bg-white rounded-xl p-5 border border-[#E8E8E0] col-span-1 lg:col-span-3'>
            <div className='flex items-center justify-between mb-5'>
              <h3 className='text-[15px] font-semibold text-[#1F1F1F]'>Monthly Progress</h3>
              <button className='text-[11px] text-[#6B6B6B] flex items-center gap-1 font-medium hover:text-[#6B8E6F] transition-colors'>
                This Year
                <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M19 9l-7 7-7-7' />
                </svg>
              </button>
            </div>
            
            {/* Dynamic Bar Chart */}
            <div className='flex items-end justify-between h-44 pb-2 px-2'>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => {
                const count = stats.monthlyData[idx]
                const max = Math.max(...stats.monthlyData, 1) // prevent div by zero
                const heightPct = Math.round((count / max) * 100)
                return (
                  <div key={month} className='flex flex-col items-center gap-2 h-full justify-end w-full group'>
                    <span className='text-[10px] text-[#6B6B6B] opacity-0 group-hover:opacity-100 transition-opacity'>{count}</span>
                    <div 
                      className='w-1/2 md:w-8 bg-[#6B8E6F] rounded-t-sm transition-all duration-500'
                      style={{ height: `${heightPct}%`, minHeight: count > 0 ? '4px' : '0' }}
                    ></div>
                    <span className='text-[11px] text-[#6B6B6B] font-medium'>{month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Insights Section */}
        <div>
          <h3 className='text-[15px] font-semibold text-[#1F1F1F] mb-3'>Quick Insights</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {/* Insight 1 - Students Improved */}
            <div className='bg-white rounded-xl p-3.5 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
              <div className='flex items-start gap-3'>
                <div className='w-9 h-9 bg-[#E8F5E9] rounded-lg flex items-center justify-center shrink-0'>
                  <ArrowUpRight size={16} className='text-[#6B8E6F]' strokeWidth={2} />
                </div>
                <div className='flex-1'>
                  <p className='text-[13px] text-[#1F1F1F] font-medium mb-1 leading-tight'>12 students improved this week.</p>
                  <button 
                    onClick={() => navigate('/teacher/analytics')}
                    className='text-[11px] text-[#6B6B6B] hover:text-[#6B8E6F] transition-colors font-medium'
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>

            {/* Insight 2 - Weakest Concept */}
            <div className='bg-white rounded-xl p-3.5 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
              <div className='flex items-start gap-3'>
                <div className='w-9 h-9 bg-[#FFEBEE] rounded-lg flex items-center justify-center shrink-0'>
                  <AlertCircle size={16} className='text-[#D32F2F]' strokeWidth={2} />
                </div>
                <div className='flex-1'>
                  <p className='text-[13px] text-[#1F1F1F] font-medium mb-1 leading-tight'>Recursion is the weakest concept.</p>
                  <button 
                    onClick={() => navigate('/teacher/programs')}
                    className='text-[11px] text-[#6B6B6B] hover:text-[#6B8E6F] transition-colors font-medium'
                  >
                    Review curriculum
                  </button>
                </div>
              </div>
            </div>

            {/* Insight 3 - Pending Programs */}
            <div className='bg-white rounded-xl p-3.5 border border-[#E8E8E0] transition-all duration-200 hover:shadow-sm'>
              <div className='flex items-start gap-3'>
                <div className='w-9 h-9 bg-[#E0F2F1] rounded-lg flex items-center justify-center shrink-0'>
                  <PauseCircle size={16} className='text-[#00796B]' strokeWidth={2} />
                </div>
                <div className='flex-1'>
                  <p className='text-[13px] text-[#1F1F1F] font-medium mb-1 leading-tight'>8 students haven't resumed pending programs.</p>
                  <button 
                    onClick={() => navigate('/teacher/analytics')}
                    className='text-[11px] text-[#6B6B6B] hover:text-[#6B8E6F] transition-colors font-medium'
                  >
                    Send reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

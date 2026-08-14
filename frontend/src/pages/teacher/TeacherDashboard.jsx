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
    completionRate: 0
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

        // Count sessions
        const sessionSnap = await getDocs(collection(db, 'sessions'))
        const sessionsData = sessionSnap.docs.map(d => d.data())

        // Calculate completion rate
        const completedSessions = sessionsData.filter(s => s.status === 'complete').length
        const completionRate = sessionsData.length > 0 
          ? Math.round((completedSessions / sessionsData.length) * 100) 
          : 0

        // Calculate below average (students with quiz score < 70%)
        const belowAverage = sessionsData.filter(s => 
          s.status === 'complete' && (s.quizScore || 0) < 0.7
        ).length

        setStats({
          totalStudents: studentSnap.size,
          belowAverage: belowAverage,
          activePrograms: 12,
          completionRate: completionRate
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
                  {/* Excel segment (45%) - Green */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#6B8E6F'
                    strokeWidth='11'
                    strokeDasharray='107 239'
                    strokeDashoffset='0'
                    strokeLinecap='round'
                  />
                  {/* Satisfactory segment (35%) - Light Green */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#A5D6A7'
                    strokeWidth='11'
                    strokeDasharray='83 239'
                    strokeDashoffset='-107'
                    strokeLinecap='round'
                  />
                  {/* Needs segment (20%) - Light Red */}
                  <circle
                    cx='50'
                    cy='50'
                    r='38'
                    fill='none'
                    stroke='#FFCDD2'
                    strokeWidth='11'
                    strokeDasharray='48 239'
                    strokeDashoffset='-190'
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
                  <span className='text-[#6B6B6B] font-medium'>Excel (45%)</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-2.5 h-2.5 rounded-full bg-[#A5D6A7]'></div>
                  <span className='text-[#6B6B6B] font-medium'>Satis (35%)</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-2.5 h-2.5 rounded-full bg-[#FFCDD2]'></div>
                  <span className='text-[#6B6B6B] font-medium'>Needs (20%)</span>
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
            
            {/* Line Chart */}
            <div className='relative h-44'>
              <svg className='w-full h-full' viewBox='0 0 600 170' preserveAspectRatio='none'>
                {/* Grid lines */}
                <line x1='0' y1='0' x2='600' y2='0' stroke='#E8E8E0' strokeWidth='1'/>
                <line x1='0' y1='42.5' x2='600' y2='42.5' stroke='#E8E8E0' strokeWidth='1'/>
                <line x1='0' y1='85' x2='600' y2='85' stroke='#E8E8E0' strokeWidth='1'/>
                <line x1='0' y1='127.5' x2='600' y2='127.5' stroke='#E8E8E0' strokeWidth='1'/>
                <line x1='0' y1='170' x2='600' y2='170' stroke='#E8E8E0' strokeWidth='1'/>
                
                {/* Area under curve */}
                <path
                  d='M 0 135 L 100 115 L 200 85 L 300 95 L 400 55 L 500 45 L 600 15 L 600 170 L 0 170 Z'
                  fill='rgba(107, 142, 111, 0.08)'
                />
                
                {/* Line */}
                <path
                  d='M 0 135 L 100 115 L 200 85 L 300 95 L 400 55 L 500 45 L 600 15'
                  fill='none'
                  stroke='#6B8E6F'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                
                {/* Data points */}
                <circle cx='0' cy='135' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
                <circle cx='100' cy='115' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
                <circle cx='200' cy='85' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
                <circle cx='300' cy='95' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
                <circle cx='400' cy='55' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
                <circle cx='500' cy='45' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
                <circle cx='600' cy='15' r='3.5' fill='white' stroke='#6B8E6F' strokeWidth='2'/>
              </svg>
              
              {/* X-axis labels */}
              <div className='flex justify-between mt-2 text-[11px] text-[#6B6B6B] font-medium px-1'>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
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

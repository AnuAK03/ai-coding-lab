import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useNavigate } from 'react-router-dom'
import { Calendar, Download, Star, CheckCircle2, AlertTriangle, Search, Bell } from 'lucide-react'

export default function ClassAnalytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    totalStudents: 0,
    distribution: { excel: 0, satis: 0, needs: 0 },
    histogram: [0, 0, 0, 0, 0, 0, 0],
    weakConcepts: [],
    topExcel: [],
    topSatis: [],
    topNeeds: [],
    trendData: [0, 0, 0, 0, 0, 0]
  })

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const studentQ = query(collection(db, 'users'), where('role', '==', 'student'))
        const studentSnap = await getDocs(studentQ)
        const students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        let excel = 0, satis = 0, needs = 0
        const topExcel = [], topSatis = [], topNeeds = []
        const histogram = [0, 0, 0, 0, 0, 0, 0]

        students.forEach(s => {
          const score = s.avgScore || 0
          const pct = Math.round(score * 100)
          
          if (score >= 0.8) { excel++; topExcel.push(s) }
          else if (score >= 0.5) { satis++; topSatis.push(s) }
          else { needs++; topNeeds.push(s) }

          if (pct < 40) histogram[0]++
          else if (pct < 50) histogram[1]++
          else if (pct < 60) histogram[2]++
          else if (pct < 70) histogram[3]++
          else if (pct < 80) histogram[4]++
          else if (pct < 90) histogram[5]++
          else histogram[6]++
        })

        topExcel.sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
        topSatis.sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
        topNeeds.sort((a, b) => (a.avgScore || 0) - (b.avgScore || 0))

        const sessionSnap = await getDocs(collection(db, 'sessions'))
        const sessions = sessionSnap.docs.map(d => d.data())

        const conceptCounts = {}
        let totalConcepts = 0
        sessions.forEach(s => {
          if (s.status === 'complete' && s.report?.quizAnalysis?.weak_concepts) {
            s.report.quizAnalysis.weak_concepts.forEach(c => {
              conceptCounts[c] = (conceptCounts[c] || 0) + 1
              totalConcepts++
            })
          }
        })

        const weakConcepts = Object.entries(conceptCounts)
          .map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(totalConcepts, 1)) * 100) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          
        const monthlyScores = [0,0,0,0,0,0]
        const monthlyCounts = [0,0,0,0,0,0]
        sessions.forEach(s => {
          if (s.status === 'complete' && s.createdAt) {
            const date = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
            const m = date.getMonth()
            if (m < 6) {
              monthlyScores[m] += (s.quizScore || 0)
              monthlyCounts[m]++
            }
          }
        })
        const trendData = monthlyScores.map((score, idx) => monthlyCounts[idx] > 0 ? Math.round((score / monthlyCounts[idx]) * 100) : 0)

        setData({
          totalStudents: students.length,
          distribution: { excel, satis, needs },
          histogram,
          weakConcepts,
          topExcel, topSatis, topNeeds,
          trendData
        })
      } catch (e) {
        console.error('Failed to load analytics', e)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (loading) return <div className='flex-1 flex items-center justify-center min-h-screen'><p>Loading analytics...</p></div>

  return (
    <div className='min-h-[calc(100vh-64px)] bg-background text-text-primary p-xl overflow-y-auto'>
      
      {/* Header Area */}
      <div className='max-w-[1200px] mx-auto'>
        <div className='flex items-start justify-between mb-8'>
          <div>
            <h1 className='font-headline-lg text-headline-lg text-text-primary tracking-tight mb-2'>
              Deep Analytics Dashboard
            </h1>
            <p className='font-body-md text-text-secondary'>
              Comprehensive breakdown of cohort performance and concept mastery.
            </p>
          </div>
          
          <div className='flex items-center gap-3 mt-2'>
            <button className='flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-xl font-label-md text-[13px] text-text-primary shadow-sm hover:bg-surface-container transition-colors'>
              <Calendar size={16} strokeWidth={2} className='text-text-secondary' />
              Fall Semester 2024
            </button>
            <button className='flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-xl font-label-md text-[13px] text-text-primary shadow-sm hover:bg-surface-container transition-colors'>
              <Download size={16} strokeWidth={2} className='text-text-secondary' />
              Export Report
            </button>
          </div>
        </div>

        {/* Row 1: Charts */}
        <div className='grid grid-cols-12 gap-6 mb-6'>
          
          {/* Performance Distribution */}
          <div className='col-span-5 bg-white border border-outline-variant/30 rounded-3xl p-8 shadow-sm flex flex-col'>
            <h3 className='font-headline-md text-[20px] text-text-primary mb-6 pb-4 border-b border-outline-variant/30'>Performance Distribution</h3>
            
            <div className='flex-1 flex flex-col items-center justify-center relative'>
              {/* Donut Chart SVG */}
              <div className='relative w-[180px] h-[180px]'>
                <svg viewBox="0 0 100 100" className='w-full h-full transform -rotate-90'>
                  {/* Excellent (Dark Green) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#4a6f55" strokeWidth="16" 
                    strokeDasharray={`${(data.distribution.excel / Math.max(data.totalStudents, 1)) * 251} 251`} strokeDashoffset="0" />
                  {/* Satisfactory (Medium Green) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#7a9b83" strokeWidth="16" 
                    strokeDasharray={`${(data.distribution.satis / Math.max(data.totalStudents, 1)) * 251} 251`} 
                    strokeDashoffset={`-${(data.distribution.excel / Math.max(data.totalStudents, 1)) * 251}`} />
                  {/* Needs Attention (Light Green) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#d0e1d4" strokeWidth="16" 
                    strokeDasharray={`${(data.distribution.needs / Math.max(data.totalStudents, 1)) * 251} 251`} 
                    strokeDashoffset={`-${((data.distribution.excel + data.distribution.satis) / Math.max(data.totalStudents, 1)) * 251}`} />
                </svg>
                
                {/* Center Text */}
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='font-headline-lg text-[28px] text-text-primary leading-none mb-1'>{data.totalStudents}</span>
                  <span className='font-label-md text-[10px] text-text-secondary uppercase tracking-wide'>Total Students</span>
                </div>
              </div>

              {/* Legend */}
              <div className='flex items-center gap-6 mt-8'>
                <div className='flex items-center gap-2'>
                  <span className='w-2.5 h-2.5 rounded-full bg-[#4a6f55]'></span>
                  <span className='font-label-md text-[12px] text-text-secondary'>Excellent</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='w-2.5 h-2.5 rounded-full bg-[#7a9b83]'></span>
                  <span className='font-label-md text-[12px] text-text-secondary'>Satisfactory</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='w-2.5 h-2.5 rounded-full bg-[#d0e1d4]'></span>
                  <span className='font-label-md text-[12px] text-text-secondary'>Needs Attn.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Class Improvement Trend */}
          <div className='col-span-7 bg-white border border-outline-variant/30 rounded-3xl p-8 shadow-sm flex flex-col relative'>
            <div className='flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30'>
              <h3 className='font-headline-md text-[20px] text-text-primary'>Class Improvement Trend</h3>
              <span className='px-3 py-1 bg-[#ebf3ed] text-[#4a6f55] font-label-md text-[11px] rounded-full border border-[#d0e1d4]'>
                +12% vs last term
              </span>
            </div>

            <div className='flex-1 relative w-full h-[200px] mt-2 flex items-end justify-between px-4'>
              {/* Dynamic Bar Chart */}
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => {
                const avg = data.trendData[idx]
                return (
                  <div key={month} className='flex flex-col items-center gap-2 h-full justify-end w-full group'>
                    <span className='text-[11px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity'>{avg}%</span>
                    <div 
                      className='w-1/2 md:w-10 bg-[#5d7c67] rounded-t-sm transition-all duration-500 hover:bg-[#4a6f55]'
                      style={{ height: `${avg}%`, minHeight: avg > 0 ? '4px' : '0' }}
                    ></div>
                    <span className='font-label-md text-[11px] text-text-secondary'>{month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Histograms & Progress */}
        <div className='grid grid-cols-12 gap-6 mb-8'>
          
          {/* Score Distribution */}
          <div className='col-span-5 bg-white border border-outline-variant/30 rounded-3xl p-8 shadow-sm flex flex-col'>
            <h3 className='font-headline-md text-[20px] text-text-primary mb-6 pb-4 border-b border-outline-variant/30'>Score Distribution (Histogram)</h3>
            
            <div className='flex-1 flex items-end justify-between px-4 pb-6 relative h-[180px] mt-4'>
              {/* Y-Axis Labels */}
              <div className='absolute left-0 top-0 bottom-6 flex flex-col justify-between'>
                <span className='font-label-md text-[10px] text-text-secondary'>50</span>
                <span className='font-label-md text-[10px] text-text-secondary'>25</span>
                <span className='font-label-md text-[10px] text-text-secondary'>0</span>
              </div>

              {/* Bars */}
              {data.histogram.map((count, idx) => {
                const max = Math.max(...data.histogram, 1)
                const heightPct = Math.round((count / max) * 100)
                const colors = ['bg-[#e3ece5]', 'bg-[#d0e1d4]', 'bg-[#7a9b83]', 'bg-[#5d7c67]', 'bg-[#7a9b83]', 'bg-[#d0e1d4]', 'bg-[#e3ece5]']
                return (
                  <div key={idx} className={`w-[12%] ${colors[idx]} rounded-t-sm transition-all duration-500 relative group`} style={{ height: `${heightPct}%`, minHeight: count > 0 ? '4px' : '0' }}>
                    <span className='absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity'>{count}</span>
                  </div>
                )
              })}
              
              {/* X-Axis Labels */}
              <div className='absolute -bottom-2 left-6 right-0 flex justify-between pr-2'>
                <span className='font-label-md text-[10px] text-text-secondary'>&lt;40</span>
                <span className='font-label-md text-[10px] text-text-secondary ml-2'>50</span>
                <span className='font-label-md text-[10px] text-text-secondary ml-2'>60</span>
                <span className='font-label-md text-[10px] text-text-secondary ml-2'>70</span>
                <span className='font-label-md text-[10px] text-text-secondary ml-2'>80</span>
                <span className='font-label-md text-[10px] text-text-secondary ml-2'>90</span>
                <span className='font-label-md text-[10px] text-text-secondary'>100</span>
              </div>
            </div>
          </div>

          {/* Weak Concepts */}
          <div className='col-span-7 bg-white border border-outline-variant/30 rounded-3xl p-8 shadow-sm'>
            <h3 className='font-headline-md text-[20px] text-text-primary mb-6 pb-4 border-b border-outline-variant/30'>Most Common Weak Concepts</h3>
            
            <div className='flex flex-col gap-4'>
              {data.weakConcepts.length > 0 ? data.weakConcepts.map((concept, idx) => {
                const colors = ['bg-[#b04040]', 'bg-[#c95252]', 'bg-[#df8080]', 'bg-[#5d7c67]', 'bg-[#7a9b83]', 'bg-[#d0e1d4]']
                return (
                  <div key={idx} className='flex items-center gap-4'>
                    <span className='w-24 text-right font-label-md text-[13px] text-text-secondary capitalize truncate' title={concept.name}>{concept.name.replace('_', ' ')}</span>
                    <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                      <div className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${concept.pct}%` }}></div>
                    </div>
                    <span className='w-10 font-label-md text-[13px] text-text-secondary'>{concept.pct}%</span>
                  </div>
                )
              }) : <p className='text-[13px] text-text-secondary'>No concepts analysed yet.</p>}
            </div>
          </div>
        </div>

        {/* Row 3: Student Categorization */}
        <div>
          <h2 className='font-headline-lg text-[24px] text-text-primary mb-6'>Student Categorization</h2>
          
          <div className='grid grid-cols-3 gap-6'>
            
            {/* Excellent Column */}
            <div className='bg-white border border-outline-variant/30 rounded-3xl flex flex-col overflow-hidden shadow-sm'>
              <div className='p-4 bg-[#f8faf8] border-b border-outline-variant/20 flex items-center justify-between m-2 rounded-2xl'>
                <div className='flex items-center gap-2'>
                  <Star size={18} strokeWidth={2} className='text-[#5d7c67]' />
                  <span className='font-headline-sm text-[16px] text-[#2c4033]'>Excellent</span>
                </div>
                <span className='px-2 py-0.5 bg-[#e3ece5] text-[#386667] font-label-md text-[11px] rounded-md'>&gt;90%</span>
              </div>
              <div className='p-6 flex-1'>
                <div className='flex flex-col gap-5'>
                  {data.topExcel.length > 0 ? data.topExcel.slice(0, 3).map((student, idx) => (
                    <div key={idx} className='flex items-center justify-between'>
                      <span className='font-mono text-[12px] text-text-secondary w-12'>{student.rollNumber || `R-${(idx+1).toString().padStart(3,'0')}`}</span>
                      <span className='font-body-md text-[14px] text-text-primary flex-1 truncate pr-2'>{student.name || 'Unknown'}</span>
                      <span className='font-label-md text-[13px] text-text-primary font-bold'>{Math.round((student.avgScore || 0) * 100)}%</span>
                    </div>
                  )) : <p className='text-[13px] text-text-secondary'>No students in this tier.</p>}
                </div>
              </div>
              <div className='p-4 text-center border-t border-outline-variant/20 mt-auto'>
                <button className='font-label-md text-[12px] text-text-secondary hover:text-text-primary transition-colors'>
                  View All {data.distribution.excel} Students
                </button>
              </div>
            </div>

            {/* Satisfactory Column */}
            <div className='bg-white border border-outline-variant/30 rounded-3xl flex flex-col overflow-hidden shadow-sm'>
              <div className='p-4 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between m-2 rounded-2xl'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 size={18} strokeWidth={2} className='text-[#4b6a71]' />
                  <span className='font-headline-sm text-[16px] text-[#2c3d42]'>Satisfactory</span>
                </div>
                <span className='px-2 py-0.5 bg-[#dce4de] text-text-primary font-label-md text-[11px] rounded-md'>60-89%</span>
              </div>
              <div className='p-6 flex-1'>
                <div className='flex flex-col gap-5'>
                  {data.topSatis.length > 0 ? data.topSatis.slice(0, 3).map((student, idx) => (
                    <div key={idx} className='flex items-center justify-between'>
                      <span className='font-mono text-[12px] text-text-secondary w-12'>{student.rollNumber || `R-${(idx+1).toString().padStart(3,'0')}`}</span>
                      <span className='font-body-md text-[14px] text-text-primary flex-1 truncate pr-2'>{student.name || 'Unknown'}</span>
                      <span className='font-label-md text-[13px] text-text-primary font-bold'>{Math.round((student.avgScore || 0) * 100)}%</span>
                    </div>
                  )) : <p className='text-[13px] text-text-secondary'>No students in this tier.</p>}
                </div>
              </div>
              <div className='p-4 text-center border-t border-outline-variant/20 mt-auto'>
                <button className='font-label-md text-[12px] text-text-secondary hover:text-text-primary transition-colors'>
                  View All {data.distribution.satis} Students
                </button>
              </div>
            </div>

            {/* Needs Attention Column */}
            <div className='bg-[#fef5f5] border border-error/30 rounded-3xl flex flex-col overflow-hidden shadow-sm relative'>
              {/* Red tinted background layer */}
              <div className='absolute inset-0 bg-[#fef5f5] pointer-events-none'></div>
              
              <div className='p-4 bg-[#fbeaea] border-b border-error/20 flex items-center justify-between m-2 rounded-2xl relative z-10'>
                <div className='flex items-center gap-2'>
                  <AlertTriangle size={18} strokeWidth={2} className='text-error' />
                  <span className='font-headline-sm text-[16px] text-[#6b2525]'>Needs Attention</span>
                </div>
                <span className='px-2 py-0.5 bg-[#f5d5d5] text-error font-label-md text-[11px] rounded-md'>&lt;60%</span>
              </div>
              <div className='p-6 flex-1 relative z-10'>
                <div className='flex flex-col gap-5'>
                  {data.topNeeds.length > 0 ? data.topNeeds.slice(0, 3).map((student, idx) => (
                    <div key={idx} className='flex items-center justify-between'>
                      <span className='font-mono text-[12px] text-[#b04040]/70 w-12'>{student.rollNumber || `R-${(idx+1).toString().padStart(3,'0')}`}</span>
                      <span className='font-body-md text-[14px] text-[#6b2525] flex-1 truncate pr-2'>{student.name || 'Unknown'}</span>
                      <span className='font-label-md text-[13px] text-error font-bold'>{Math.round((student.avgScore || 0) * 100)}%</span>
                    </div>
                  )) : <p className='text-[13px] text-[#6b2525]/70'>No students in this tier.</p>}
                </div>
              </div>
              <div className='p-4 text-center border-t border-error/20 mt-auto relative z-10'>
                <button className='font-label-md text-[12px] text-error hover:opacity-80 transition-opacity font-bold'>
                  View All {data.distribution.needs} Students
                </button>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  )
}

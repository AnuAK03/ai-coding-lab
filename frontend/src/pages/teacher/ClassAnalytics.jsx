import { useNavigate } from 'react-router-dom'
import { Calendar, Download, Star, CheckCircle2, AlertTriangle, Search, Bell } from 'lucide-react'

export default function ClassAnalytics() {
  const navigate = useNavigate()

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
                  {/* Excellent (Dark Green) - roughly 45% */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#4a6f55" strokeWidth="16" strokeDasharray="113 251" strokeDashoffset="0" />
                  {/* Satisfactory (Medium Green) - roughly 35% */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#7a9b83" strokeWidth="16" strokeDasharray="88 251" strokeDashoffset="-113" />
                  {/* Needs Attention (Light Green) - roughly 20% */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#d0e1d4" strokeWidth="16" strokeDasharray="50 251" strokeDashoffset="-201" />
                </svg>
                
                {/* Center Text */}
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='font-headline-lg text-[28px] text-text-primary leading-none mb-1'>240</span>
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

            <div className='flex-1 relative w-full h-[200px] mt-2'>
              {/* Background Lines */}
              <div className='absolute inset-0 flex flex-col justify-between'>
                <div className='w-full h-px bg-outline-variant/20'></div>
                <div className='w-full h-px bg-outline-variant/20'></div>
                <div className='w-full h-px bg-outline-variant/20'></div>
                <div className='w-full h-px bg-outline-variant/20'></div>
              </div>
              
              {/* Line Chart SVG */}
              <svg className='absolute inset-0 w-full h-full' preserveAspectRatio="none">
                <path d="M 0 170 C 50 150, 80 130, 150 120 C 220 110, 250 100, 300 100 C 350 100, 400 80, 450 70 C 500 60, 550 50, 600 50 C 650 50, 700 20, 750 10" 
                      fill="none" stroke="#5d7c67" strokeWidth="2" />
                
                {/* Data Points */}
                <circle cx="150" cy="120" r="5" fill="#fff" stroke="#d0e1d4" strokeWidth="2" />
                <circle cx="300" cy="100" r="5" fill="#fff" stroke="#d0e1d4" strokeWidth="2" />
                <circle cx="450" cy="70" r="5" fill="#fff" stroke="#d0e1d4" strokeWidth="2" />
                <circle cx="600" cy="50" r="5" fill="#fff" stroke="#d0e1d4" strokeWidth="2" />
                <circle cx="750" cy="10" r="5" fill="#fff" stroke="#d0e1d4" strokeWidth="2" />
              </svg>

              {/* X-Axis Labels */}
              <div className='absolute -bottom-6 left-0 right-0 flex justify-between px-2'>
                <span className='font-label-md text-[11px] text-text-secondary'>Wk 1</span>
                <span className='font-label-md text-[11px] text-text-secondary ml-10'>Wk 3</span>
                <span className='font-label-md text-[11px] text-text-secondary ml-8'>Wk 5</span>
                <span className='font-label-md text-[11px] text-text-secondary ml-8'>Wk 7</span>
                <span className='font-label-md text-[11px] text-text-secondary ml-8'>Wk 9</span>
                <span className='font-label-md text-[11px] text-text-secondary'>Midterm</span>
              </div>
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
              <div className='w-[12%] h-[15%] bg-[#e3ece5] rounded-t-sm ml-6'></div>
              <div className='w-[12%] h-[35%] bg-[#d0e1d4] rounded-t-sm'></div>
              <div className='w-[12%] h-[60%] bg-[#7a9b83] rounded-t-sm'></div>
              <div className='w-[12%] h-[90%] bg-[#5d7c67] rounded-t-sm'></div>
              <div className='w-[12%] h-[75%] bg-[#7a9b83] rounded-t-sm'></div>
              <div className='w-[12%] h-[40%] bg-[#d0e1d4] rounded-t-sm'></div>
              <div className='w-[12%] h-[20%] bg-[#e3ece5] rounded-t-sm'></div>
              
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
              {/* Row 1 */}
              <div className='flex items-center gap-4'>
                <span className='w-24 text-right font-label-md text-[13px] text-text-secondary'>Pointers</span>
                <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                  <div className='h-full bg-[#b04040] rounded-full w-[85%]'></div>
                </div>
                <span className='w-10 font-label-md text-[13px] text-text-secondary'>85%</span>
              </div>
              {/* Row 2 */}
              <div className='flex items-center gap-4'>
                <span className='w-24 text-right font-label-md text-[13px] text-text-secondary'>Recursion</span>
                <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                  <div className='h-full bg-[#c95252] rounded-full w-[72%]'></div>
                </div>
                <span className='w-10 font-label-md text-[13px] text-text-secondary'>72%</span>
              </div>
              {/* Row 3 */}
              <div className='flex items-center gap-4'>
                <span className='w-24 text-right font-label-md text-[13px] text-text-secondary'>OOP</span>
                <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                  <div className='h-full bg-[#df8080] rounded-full w-[58%]'></div>
                </div>
                <span className='w-10 font-label-md text-[13px] text-text-secondary'>58%</span>
              </div>
              {/* Row 4 */}
              <div className='flex items-center gap-4'>
                <span className='w-24 text-right font-label-md text-[13px] text-text-secondary'>Arrays</span>
                <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                  <div className='h-full bg-[#5d7c67] rounded-full w-[45%]'></div>
                </div>
                <span className='w-10 font-label-md text-[13px] text-text-secondary'>45%</span>
              </div>
              {/* Row 5 */}
              <div className='flex items-center gap-4'>
                <span className='w-24 text-right font-label-md text-[13px] text-text-secondary'>Functions</span>
                <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                  <div className='h-full bg-[#7a9b83] rounded-full w-[30%]'></div>
                </div>
                <span className='w-10 font-label-md text-[13px] text-text-secondary'>30%</span>
              </div>
              {/* Row 6 */}
              <div className='flex items-center gap-4'>
                <span className='w-24 text-right font-label-md text-[13px] text-text-secondary'>Loops</span>
                <div className='flex-1 h-3 bg-[#f4f4ec] rounded-full overflow-hidden'>
                  <div className='h-full bg-[#d0e1d4] rounded-full w-[15%]'></div>
                </div>
                <span className='w-10 font-label-md text-[13px] text-text-secondary'>15%</span>
              </div>
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
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-text-secondary w-12'>R-182</span>
                    <span className='font-body-md text-[14px] text-text-primary flex-1'>Sarah Jenkins</span>
                    <span className='font-label-md text-[13px] text-text-primary font-bold'>98%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-text-secondary w-12'>R-145</span>
                    <span className='font-body-md text-[14px] text-text-primary flex-1'>Michael Chen</span>
                    <span className='font-label-md text-[13px] text-text-primary font-bold'>95%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-text-secondary w-12'>R-089</span>
                    <span className='font-body-md text-[14px] text-text-primary flex-1'>Aisha Patel</span>
                    <span className='font-label-md text-[13px] text-text-primary font-bold'>92%</span>
                  </div>
                </div>
              </div>
              <div className='p-4 text-center border-t border-outline-variant/20 mt-auto'>
                <button className='font-label-md text-[12px] text-text-secondary hover:text-text-primary transition-colors'>
                  View All 84 Students
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
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-text-secondary w-12'>R-211</span>
                    <span className='font-body-md text-[14px] text-text-primary flex-1'>David Kim</span>
                    <span className='font-label-md text-[13px] text-text-primary font-bold'>85%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-text-secondary w-12'>R-177</span>
                    <span className='font-body-md text-[14px] text-text-primary flex-1'>Emily Thorne</span>
                    <span className='font-label-md text-[13px] text-text-primary font-bold'>78%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-text-secondary w-12'>R-042</span>
                    <span className='font-body-md text-[14px] text-text-primary flex-1'>James Wilson</span>
                    <span className='font-label-md text-[13px] text-text-primary font-bold'>65%</span>
                  </div>
                </div>
              </div>
              <div className='p-4 text-center border-t border-outline-variant/20 mt-auto'>
                <button className='font-label-md text-[12px] text-text-secondary hover:text-text-primary transition-colors'>
                  View All 108 Students
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
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-[#b04040]/70 w-12'>R-015</span>
                    <span className='font-body-md text-[14px] text-[#6b2525] flex-1'>Robert Fox</span>
                    <span className='font-label-md text-[13px] text-error font-bold'>58%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-[#b04040]/70 w-12'>R-199</span>
                    <span className='font-body-md text-[14px] text-[#6b2525] flex-1'>Lisa Wong</span>
                    <span className='font-label-md text-[13px] text-error font-bold'>52%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='font-mono text-[12px] text-[#b04040]/70 w-12'>R-256</span>
                    <span className='font-body-md text-[14px] text-[#6b2525] flex-1'>Tom Harris</span>
                    <span className='font-label-md text-[13px] text-error font-bold'>45%</span>
                  </div>
                </div>
              </div>
              <div className='p-4 text-center border-t border-error/20 mt-auto relative z-10'>
                <button className='font-label-md text-[12px] text-error hover:opacity-80 transition-opacity font-bold'>
                  View All 48 Students
                </button>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  )
}

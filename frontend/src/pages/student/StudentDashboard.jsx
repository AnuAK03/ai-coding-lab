// frontend/src/pages/student/StudentDashboard.jsx
// CodeLab Student Dashboard (Stitch Theme)

import { useEffect, useState, useRef } from 'react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import StreakHeatmap from '../../components/StreakHeatmap'
import CalendarWidget from '../../components/CalendarWidget'
import { Flame, Medal, CheckCircle2, Zap, Play, Beaker, Calendar, BookOpen, Terminal } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function StudentDashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [visibleElements, setVisibleElements] = useState(new Set(['hero', 'stats', 'activity']))
  const navigate = useNavigate()

  const { theme } = useTheme()

  // Animated counters
  const [streakCount, setStreakCount] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)
  const [sessionCount, setSessionCount] = useState(0)
  const [xpCount, setXpCount] = useState(0)

  // Intersection observers
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const activityRef = useRef(null)

  // Check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        setProfile(snap.data())
      }
      setLoading(false)
    }
    loadProfile()
  }, [user.uid])

  // Load completed sessions
  useEffect(() => {
    async function loadSessionCount() {
      try {
        const q = query(
          collection(db, 'sessions'),
          where('studentId', '==', user.uid),
          where('status', '==', 'complete')
        )
        const snap = await getDocs(q)
        setCompletedSessions(snap.size)
      } catch (err) {
        console.error('Failed to load session count:', err)
      }
    }
    loadSessionCount()
  }, [user.uid])

  // Animate counters
  useEffect(() => {
    if (!profile) return

    const targetStreak = profile.streak ?? 0
    const targetBadges = profile.badges?.length ?? 0
    const targetSessions = completedSessions
    const targetXp = (completedSessions * 100) + (targetBadges * 50) + (targetStreak * 10)

    if (reducedMotion || !visibleElements.has('stats')) {
      setStreakCount(targetStreak)
      setBadgeCount(targetBadges)
      setSessionCount(targetSessions)
      setXpCount(targetXp)
      return
    }

    const duration = 800
    const steps = 40
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4)

      setStreakCount(Math.floor(targetStreak * easeProgress))
      setBadgeCount(Math.floor(targetBadges * easeProgress))
      setSessionCount(Math.floor(targetSessions * easeProgress))
      setXpCount(Math.floor(targetXp * easeProgress))

      if (currentStep >= steps) {
        setStreakCount(targetStreak)
        setBadgeCount(targetBadges)
        setSessionCount(targetSessions)
        setXpCount(targetXp)
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [profile, completedSessions, visibleElements, reducedMotion])

  // Intersection observer
  useEffect(() => {
    if (reducedMotion) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.dataset.section]))
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = [heroRef, statsRef, activityRef]
    elements.forEach(ref => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [reducedMotion])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <p className='text-on-surface-variant'>Loading dashboard...</p>
      </div>
    )
  }

  const isVisible = (section) => visibleElements.has(section) || reducedMotion

  // Get current date string
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className='min-h-screen bg-background p-6 lg:p-10 text-text-primary transition-colors'>
      <div className='max-w-6xl mx-auto space-y-8'>
        
        {/* Hero Banner */}
        <div 
          ref={heroRef}
          data-section='hero'
          className={`relative w-full h-[240px] rounded-3xl overflow-hidden shadow-sm border border-outline-variant/30 transition-all duration-700
                     ${isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Mockup Forest Illustration Background */}
          <img 
            src="https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=1600&q=80" 
            alt="Forest" 
            className='absolute inset-0 w-full h-full object-cover object-center opacity-80'
          />
          {/* Subtle overlay gradient */}
          <div className='absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/40 to-transparent backdrop-blur-[2px]'></div>
          
          <div className='absolute bottom-8 left-8'>
            <h1 className='font-headline-lg text-headline-lg font-bold text-[#1f2937] tracking-tight mb-2'>
              Welcome back, {profile?.name?.split(' ')[0] || 'Student'}.
            </h1>
            <div className='flex items-center gap-4 text-sm font-medium text-[#4b5563]'>
              <div className='flex items-center gap-1.5'>
                <Calendar size={16} />
                <span>{today}</span>
              </div>
              <div className='w-px h-4 bg-[#9ca3af]'></div>
              <div className='flex items-center gap-1.5'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                <span>18°C, Cloudy</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div 
          ref={statsRef}
          data-section='stats'
          className='grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'
        >
          {/* Streak */}
          <div className={`bg-white rounded-[24px] p-5 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-700 delay-100 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className='w-10 h-10 rounded-full bg-[#fde8e8] flex items-center justify-center mb-3'>
              <Flame size={20} className='text-[#e02424]' strokeWidth={2.5} />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-1'>{streakCount} Days</h2>
            <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Current Streak</p>
          </div>

          {/* Badges */}
          <div className={`bg-white rounded-[24px] p-5 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-700 delay-150 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className='w-10 h-10 rounded-full bg-[#def7ec] flex items-center justify-center mb-3'>
              <Medal size={20} className='text-[#046c4e]' strokeWidth={2.5} />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-1'>{badgeCount}</h2>
            <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Badges Earned</p>
          </div>

          {/* Programs */}
          <div className={`bg-white rounded-[24px] p-5 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-700 delay-200 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className='w-10 h-10 rounded-full bg-[#e1effe] flex items-center justify-center mb-3'>
              <CheckCircle2 size={20} className='text-[#1a56db]' strokeWidth={2.5} />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-1'>{sessionCount}</h2>
            <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Programs Done</p>
          </div>

          {/* XP */}
          <div className={`bg-white rounded-[24px] p-5 border border-outline-variant/30 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-700 delay-250 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className='w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-3'>
              <Zap size={20} className='text-[#4b5563]' strokeWidth={2.5} />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-1'>{xpCount.toLocaleString()} XP</h2>
            <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Total Credits</p>
          </div>
        </div>

        {/* Lower Section Grid */}
        <div 
          ref={activityRef}
          data-section='activity'
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-300 ${isVisible('activity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Heatmap and Calendar Group */}
          <div className='lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6 self-start'>
            {/* Coding Activity (Heatmap) */}
            <div className='bg-white rounded-[24px] p-6 border border-outline-variant/30 shadow-sm flex flex-col h-full'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='font-headline-md text-lg font-semibold text-gray-900'>Coding Activity</h3>
                <span className='text-[13px] text-gray-500'>Last 3 Months</span>
              </div>
              <div className='w-full overflow-x-auto pb-2 flex-1 flex flex-col justify-center'>
                <div className='min-w-[400px]'>
                  <StreakHeatmap userId={user.uid} theme={theme} />
                </div>
              </div>
            </div>

            {/* Calendar Block */}
            <CalendarWidget />
          </div>

          {/* Right Column: Actions & Program */}
          <div className='lg:col-span-1 space-y-6'>
            
            {/* Quick Actions */}
            <div className='bg-white rounded-[24px] p-6 border border-outline-variant/30 shadow-sm'>
              <h3 className='font-headline-md text-lg font-semibold text-gray-900 mb-4'>Quick Actions</h3>
              <div className='space-y-2.5'>
                <button 
                  onClick={() => navigate('/student/programs')}
                  className='w-full bg-[#4a6f55] hover:bg-[#3d5c46] text-white py-3 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm'
                >
                  <Play size={16} fill="currentColor" />
                  Continue Coding
                </button>
                <button 
                  onClick={() => navigate('/student/progress')}
                  className='w-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 py-3 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2'
                >
                  <Beaker size={16} />
                  Review Logic
                </button>
              </div>
            </div>

            {/* Current Program */}
            <div className='bg-white rounded-[24px] p-6 border border-outline-variant/30 shadow-sm'>
              <h3 className='font-headline-md text-lg font-semibold text-gray-900 mb-4'>Current Program</h3>
              <div className='flex items-center gap-3 bg-[#fafafa] border border-outline-variant/50 p-3 rounded-2xl cursor-pointer hover:border-[#4a6f55] transition-colors'>
                <div className='w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0'>
                  <Terminal size={20} className='text-indigo-600' />
                </div>
                <div>
                  <h4 className='font-semibold text-gray-900 text-[14px] leading-tight mb-1'>Data Structures in Python</h4>
                  <p className='text-[12px] text-gray-500'>Module 3 • 45% Complete</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

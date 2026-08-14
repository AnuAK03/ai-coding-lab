// frontend/src/pages/student/StudentDashboard.jsx
// Energetic, gamified dashboard inspired by Duolingo/fitness apps

import { useEffect, useState, useRef } from 'react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../../services/firebase'
import BadgeGrid from '../../components/BadgeGrid'
import StreakHeatmap from '../../components/StreakHeatmap'
import { Flame, Medal, BookOpen, ChevronRight, Trophy, Sparkles, Terminal } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function StudentDashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [visibleElements, setVisibleElements] = useState(new Set(['hero', 'stats', 'heatmap', 'badges', 'cta']))
  const [recentBadge, setRecentBadge] = useState(null)
  const navigate = useNavigate()

  // Get theme from context
  const { theme } = useTheme()

  // Animated counter refs
  const [streakCount, setStreakCount] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)
  const [sessionCount, setSessionCount] = useState(0)

  // Intersection observer refs
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const heatmapRef = useRef(null)
  const badgeGridRef = useRef(null)
  const ctaRef = useRef(null)

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
        const data = snap.data()
        setProfile(data)
        
        // Check for recently earned badges (within last 48 hours)
        if (data.badgeTimestamps) {
          const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000)
          const recent = Object.entries(data.badgeTimestamps)
            .filter(([_, timestamp]) => timestamp > twoDaysAgo)
            .sort((a, b) => b[1] - a[1])[0]
          
          if (recent) {
            setRecentBadge(recent[0])
          }
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [user.uid])

  // Load completed sessions count
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
        setCompletedSessions(0)
      }
    }
    loadSessionCount()
  }, [user.uid])

  // Animate counters when stats become visible
  useEffect(() => {
    if (!profile) return

    if (reducedMotion) {
      setStreakCount(profile.streak ?? 0)
      setBadgeCount(profile.badges?.length ?? 0)
      setSessionCount(completedSessions)
      return
    }

    if (!visibleElements.has('stats')) {
      setStreakCount(profile.streak ?? 0)
      setBadgeCount(profile.badges?.length ?? 0)
      setSessionCount(completedSessions)
      return
    }

    const targetStreak = profile.streak ?? 0
    const targetBadges = profile.badges?.length ?? 0
    const targetSessions = completedSessions

    const duration = 600
    const steps = 30
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setStreakCount(Math.floor(targetStreak * progress))
      setBadgeCount(Math.floor(targetBadges * progress))
      setSessionCount(Math.floor(targetSessions * progress))

      if (currentStep >= steps) {
        setStreakCount(targetStreak)
        setBadgeCount(targetBadges)
        setSessionCount(targetSessions)
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [profile, completedSessions, visibleElements, reducedMotion])

  // Intersection observer for scroll animations
  useEffect(() => {
    if (reducedMotion) {
      return
    }

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

    const elements = [heroRef, statsRef, heatmapRef, badgeGridRef, ctaRef]
    elements.forEach(ref => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [reducedMotion])

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0F0F10]' : 'bg-[#FAFAFA]'}`}>
      <p className={theme === 'dark' ? 'text-[#A1A1A3]' : 'text-[#737373]'}>Loading your dashboard...</p>
    </div>
  )

  const isVisible = (section) => visibleElements.has(section)

  // Get streak message for ghost mascot
  const getStreakMessage = (streak) => {
    if (streak === 0) return "Let's start!"
    if (streak < 3) return `${streak} day${streak > 1 ? 's' : ''}!`
    if (streak < 5) return `${streak} days strong!`
    if (streak < 10) return `Keep it up!`
    return `${streak} days! 🎉`
  }

  // Total badges for progress calculation
  const TOTAL_BADGES = 8

  // Calculate progress toward next streak milestone
  const getStreakProgress = (streak) => {
    if (streak < 5) return (streak / 5) * 100
    if (streak < 10) return ((streak - 5) / 5) * 100
    if (streak < 30) return ((streak - 10) / 20) * 100
    return 100
  }

  // Theme classes with more saturated colors
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      cardBg: 'rgba(26, 26, 29, 0.7)',
      border: 'border-white/10'
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      border: 'border-[#E5E5E5]'
    }
  }[theme]

  // Circular progress component - compact Notion-style
  const CircularProgress = ({ percentage, size = 44, strokeWidth = 2.5, color, children }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className='relative flex-shrink-0' style={{ width: size, height: size }}>
        <svg width={size} height={size} className='transform -rotate-90'>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={strokeWidth}
            fill='none'
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={reducedMotion ? offset : circumference}
            strokeLinecap='round'
            className={!reducedMotion ? 'transition-all duration-1000 ease-out' : ''}
            style={!reducedMotion ? { strokeDashoffset: offset } : {}}
          />
        </svg>
        <div className='absolute inset-0 flex items-center justify-center'>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Subtle background - neutral like Notion */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        {/* Very subtle gradient */}
        <div 
          className='absolute inset-0 transition-all duration-300'
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.01) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.015) 0%, rgba(139, 92, 246, 0.01) 100%)',
            opacity: 0.5
          }}
        />
      </div>

      <main className='max-w-5xl mx-auto px-6 py-12 relative z-10'>
        {/* HERO SECTION - Clean, compact header */}
        <div 
          ref={heroRef}
          data-section='hero'
          className={`mb-8 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                     ${isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h1 className={`text-2xl font-semibold ${t.text} leading-tight`}>
            Welcome back, {profile?.name || 'Student'}
          </h1>
          <p className={`${t.textMuted} text-sm mt-1`}>
            {profile?.department} • Year {profile?.year}
          </p>
        </div>
        {/* STAT CARDS - Compact Notion-style with subtle rings */}
        <div 
          ref={statsRef}
          data-section='stats'
          className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'
        >
          {/* Day Streak - Subtle amber accent */}
          <div 
            className={`rounded-lg border ${t.border} p-4 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                       hover:-translate-y-0.5 cursor-default
                       ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              background: theme === 'dark'
                ? 'rgba(26, 26, 29, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' 
                ? '0 1px 3px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              transitionDelay: isVisible('stats') && !reducedMotion ? '0ms' : '0ms'
            }}
          >
            <div className='flex items-center gap-3'>
              <CircularProgress 
                percentage={getStreakProgress(profile?.streak ?? 0)}
                size={44}
                strokeWidth={2.5}
                color={theme === 'dark' ? '#f59e0b' : '#d97706'}
              >
                <Flame size={16} className={theme === 'dark' ? 'text-amber-500' : 'text-amber-600'} strokeWidth={2} />
              </CircularProgress>
              
              <div className='flex-1'>
                <p className={`text-2xl font-semibold ${t.text}`}>
                  {streakCount}
                </p>
                <p className={`text-xs ${t.textMuted} font-medium uppercase tracking-wide`}>
                  Day Streak
                </p>
              </div>
            </div>
          </div>
          {/* Badges Earned - Subtle violet accent */}
          <div 
            className={`rounded-lg border ${t.border} p-4 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                       hover:-translate-y-0.5 cursor-default
                       ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              background: theme === 'dark'
                ? 'rgba(26, 26, 29, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' 
                ? '0 1px 3px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              transitionDelay: isVisible('stats') && !reducedMotion ? '50ms' : '0ms'
            }}
          >
            <div className='flex items-center gap-3'>
              <CircularProgress 
                percentage={(badgeCount / TOTAL_BADGES) * 100}
                size={44}
                strokeWidth={2.5}
                color={theme === 'dark' ? '#8b5cf6' : '#7c3aed'}
              >
                <Medal size={16} className={theme === 'dark' ? 'text-violet-500' : 'text-violet-600'} strokeWidth={2} />
              </CircularProgress>
              
              <div className='flex-1'>
                <p className={`text-2xl font-semibold ${t.text}`}>
                  {badgeCount}<span className={`text-base ${t.textMuted}`}>/{TOTAL_BADGES}</span>
                </p>
                <p className={`text-xs ${t.textMuted} font-medium uppercase tracking-wide`}>
                  Badges
                </p>
              </div>
            </div>
          </div>
          {/* Sessions Completed - Subtle indigo accent */}
          <div 
            className={`rounded-lg border ${t.border} p-4 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                       hover:-translate-y-0.5 cursor-default
                       ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              background: theme === 'dark'
                ? 'rgba(26, 26, 29, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' 
                ? '0 1px 3px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              transitionDelay: isVisible('stats') && !reducedMotion ? '100ms' : '0ms'
            }}
          >
            <div className='flex items-center gap-3'>
              <div className='relative flex-shrink-0' style={{ width: 44, height: 44 }}>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <BookOpen size={16} className={theme === 'dark' ? 'text-indigo-500' : 'text-indigo-600'} strokeWidth={2} />
                </div>
              </div>
              
              <div className='flex-1'>
                <p className={`text-2xl font-semibold ${t.text}`}>
                  {sessionCount}
                </p>
                <p className={`text-xs ${t.textMuted} font-medium uppercase tracking-wide`}>
                  Sessions
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* STREAK HEATMAP - Compact activity calendar */}
        <div 
          ref={heatmapRef}
          data-section='heatmap'
          className={`rounded-lg border ${t.border} p-5 mb-6 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                     ${isVisible('heatmap') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{
            backgroundColor: t.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark'
              ? '0 1px 3px rgba(0, 0, 0, 0.2)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className='flex items-center gap-2 mb-4'>
            <Sparkles size={14} className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} />
            <h2 className={`text-sm font-medium ${t.text}`}>Your Activity</h2>
          </div>
          <StreakHeatmap userId={user.uid} theme={theme} />
        </div>
        {/* BADGE GRID - Clean, compact */}
        <div 
          ref={badgeGridRef}
          data-section='badges'
          className={`rounded-lg border ${t.border} p-5 mb-6 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                     ${isVisible('badges') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{
            backgroundColor: t.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark'
              ? '0 1px 3px rgba(0, 0, 0, 0.2)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <Trophy size={14} className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} />
              <h2 className={`text-sm font-medium ${t.text}`}>Your Badges</h2>
            </div>
            
            {/* Recently earned badge highlight */}
            {recentBadge && (
              <div className={`px-2 py-0.5 rounded-md text-[10px] font-semibold
                             ${theme === 'dark' 
                               ? 'bg-green-500/10 text-green-400' 
                               : 'bg-green-100 text-green-700'
                             }`}>
                ✨ New Badge
              </div>
            )}
          </div>
          
          <BadgeGrid earnedBadges={profile?.badges || []} theme={theme} currentStreak={profile?.streak ?? 0} />
        </div>
        {/* BOTTOM CTA - Clean, professional */}
        <div 
          ref={ctaRef}
          data-section='cta'
          className={`rounded-lg border border-white/10 p-6 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] relative overflow-hidden
                     ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Subtle background accent */}
          <div className='absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl' />
          
          <div className='relative z-10'>
            <h2 className='text-lg font-semibold text-white mb-1'>
              Ready for today's lab?
            </h2>
            <p className='text-indigo-100 text-sm mb-4 max-w-xl'>
              Pick a program and start your proctored session
            </p>
            <button
              onClick={() => navigate('/student/programs')}
              className={`bg-white text-[#6366F1] font-semibold text-sm px-5 py-2.5 rounded-lg
                         flex items-center gap-2 hover:bg-blue-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                         hover:-translate-y-0.5 group`}
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              Browse Programs 
              <ChevronRight size={16} strokeWidth={2.5} className={`${!reducedMotion ? 'group-hover:translate-x-0.5 transition-transform duration-300' : ''}`} />
            </button>
          </div>
        </div>
      </main>

      {/* CSS Animations */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}

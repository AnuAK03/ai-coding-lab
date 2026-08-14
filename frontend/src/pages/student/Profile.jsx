// frontend/src/pages/student/Profile.jsx
// Student profile page - displays user info and stats (Notion-style)

import { useEffect, useState } from 'react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useTheme } from '../../contexts/ThemeContext'
import { typography, card, spacing, icons, progressRing, getThemeStyles } from '../../styles/studentTheme'
import { 
  User, Mail, GraduationCap, Hash, Calendar, 
  Flame, Medal, BookOpen, MapPin, Users, Shield
} from 'lucide-react'

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completedSessions, setCompletedSessions] = useState(0)
  const { theme } = useTheme()
  
  // Get theme styles
  const t = getThemeStyles(theme)

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          setProfile(snap.data())
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
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

  // Circular progress component - matching Overview page
  const CircularProgress = ({ percentage, size = progressRing.size, strokeWidth = progressRing.strokeWidth, color, children }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className='relative flex-shrink-0' style={{ width: size, height: size }}>
        <svg width={size} height={size} className='transform -rotate-90'>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={strokeWidth}
            fill='none'
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap='round'
            className='transition-all duration-1000 ease-out'
          />
        </svg>
        <div className='absolute inset-0 flex items-center justify-center'>
          {children}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center transition-colors duration-300`}>
        <p className={t.textMuted}>Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center transition-colors duration-300`}>
        <p className={t.textMuted}>Profile not found</p>
      </div>
    )
  }

  // Format date for "Member since"
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Unknown'
  
  // Profile fields configuration
  const profileFields = [
    { icon: User, label: 'Full Name', value: profile.name || 'Not set', color: 'blue' },
    { icon: Mail, label: 'Email Address', value: user.email, color: 'purple' },
    { icon: Shield, label: 'Role', value: profile.role || 'Student', color: 'green', capitalize: true },
    { icon: GraduationCap, label: 'Department', value: profile.department || 'Not set', color: 'orange' },
    { icon: Hash, label: 'Year', value: profile.year ? `Year ${profile.year}` : 'Not set', color: 'teal' },
    { icon: MapPin, label: 'Section', value: profile.section ? `Section ${profile.section}` : 'Not set', color: 'pink' },
    { icon: Hash, label: 'Roll Number', value: profile.rollNumber || 'Not set', color: 'yellow' },
    { icon: Users, label: 'Class ID', value: profile.classId || 'Not set', color: 'indigo', mono: true },
    { icon: Calendar, label: 'Member Since', value: memberSince, color: 'gray' },
  ]

  return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-12 px-6 transition-colors duration-300`}>
      <div className='max-w-4xl mx-auto'>
        
        {/* Header - Compact */}
        <div className='mb-8'>
          <h1 className={`${typography.pageHeadline} ${t.text}`}>
            Profile
          </h1>
          <p className={`${typography.pageSubtitle} ${t.textMuted}`}>
            Your account information and stats
          </p>
        </div>

        {/* Profile Information Card - Compact with hairline dividers */}
        <div
          className={`${card.radius.small} border ${t.border} ${card.padding.standard} mb-6`}
          style={{
            backgroundColor: t.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className='flex items-center gap-2 mb-4'>
            <User size={14} className={t.textMuted} />
            <h2 className={`${typography.sectionHeader} ${t.text}`}>
              Personal Information
            </h2>
          </div>
          
          <div className='space-y-0'>
            {profileFields.map((field, index) => {
              const Icon = field.icon
              return (
                <div key={field.label}>
                  <div className='flex items-center gap-3 py-3'>
                    <Icon size={14} className={t.textMuted} />
                    <div className='flex-1 min-w-0'>
                      <p className={`${typography.label} ${t.textSubtle}`}>
                        {field.label}
                      </p>
                      <p className={`${typography.body} ${t.text} font-medium ${field.capitalize ? 'capitalize' : ''} ${field.mono ? 'font-mono' : ''} truncate`}>
                        {field.value}
                      </p>
                    </div>
                  </div>
                  {index < profileFields.length - 1 && (
                    <div className={`border-b ${t.borderSubtle}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats Summary Card - Matching Overview page exactly */}
        <div
          className={`${card.radius.small} border ${t.border} ${card.padding.standard}`}
          style={{
            backgroundColor: t.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h2 className={`${typography.sectionHeader} ${t.text} mb-4`}>
            Your Stats
          </h2>
          
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Streak - Matching Overview */}
            <div className='flex items-center gap-3'>
              <CircularProgress 
                percentage={100}
                color={t.accent.amber}
              >
                <Flame size={16} style={{ color: t.accent.amber }} strokeWidth={2} />
              </CircularProgress>
              
              <div className='flex-1'>
                <p className={`${typography.statNumber} ${t.text}`}>
                  {profile.streak ?? 0}
                </p>
                <p className={`${typography.statLabel} ${t.textMuted}`}>
                  Day Streak
                </p>
              </div>
            </div>

            {/* Badges - Matching Overview */}
            <div className='flex items-center gap-3'>
              <CircularProgress 
                percentage={((profile.badges?.length ?? 0) / 8) * 100}
                color={t.accent.violet}
              >
                <Medal size={16} style={{ color: t.accent.violet }} strokeWidth={2} />
              </CircularProgress>
              
              <div className='flex-1'>
                <p className={`${typography.statNumber} ${t.text}`}>
                  {profile.badges?.length ?? 0}<span className={`text-base ${t.textMuted}`}>/8</span>
                </p>
                <p className={`${typography.statLabel} ${t.textMuted}`}>
                  Badges
                </p>
              </div>
            </div>

            {/* Sessions - Matching Overview */}
            <div className='flex items-center gap-3'>
              <div className='relative flex-shrink-0' style={{ width: 44, height: 44 }}>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <BookOpen size={16} style={{ color: t.accent.indigo }} strokeWidth={2} />
                </div>
              </div>
              
              <div className='flex-1'>
                <p className={`${typography.statNumber} ${t.text}`}>
                  {completedSessions}
                </p>
                <p className={`${typography.statLabel} ${t.textMuted}`}>
                  Sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

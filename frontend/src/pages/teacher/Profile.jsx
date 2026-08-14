// frontend/src/pages/teacher/Profile.jsx
// Teacher profile page - displays user info (Notion-style)

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useOutletContext } from 'react-router-dom'
import { 
  User, Mail, GraduationCap, Calendar, Shield
} from 'lucide-react'

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useOutletContext()
  
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
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      textSubtle: 'text-[#A3A3A3]',
      border: 'border-[#E5E5E5]',
      borderSubtle: 'border-[#F5F5F5]',
      cardBg: 'rgba(255, 255, 255, 0.7)',
    }
  }[theme]

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
    { icon: User, label: 'Full Name', value: profile.name || 'Not set' },
    { icon: Mail, label: 'Email Address', value: user.email },
    { icon: Shield, label: 'Role', value: profile.role || 'Teacher', capitalize: true },
    { icon: GraduationCap, label: 'Department', value: profile.department || 'Not set' },
    { icon: Calendar, label: 'Member Since', value: memberSince },
  ]

  return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-12 px-6 transition-colors duration-300`}>
      <div className='max-w-4xl mx-auto'>
        
        {/* Header - Compact */}
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold mb-1'>
            Profile
          </h1>
          <p className={`text-sm ${t.textMuted}`}>
            Your account information
          </p>
        </div>

        {/* Profile Information Card - Compact with hairline dividers */}
        <div
          className={`rounded-lg border ${t.border} p-4`}
          style={{
            backgroundColor: t.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className='flex items-center gap-2 mb-4'>
            <User size={14} className={t.textMuted} />
            <h2 className='font-medium text-sm'>
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
                      <p className={`text-xs font-medium uppercase tracking-wide ${t.textSubtle}`}>
                        {field.label}
                      </p>
                      <p className={`text-sm ${t.text} font-medium mt-0.5 ${field.capitalize ? 'capitalize' : ''} truncate`}>
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
      </div>
    </div>
  )
}

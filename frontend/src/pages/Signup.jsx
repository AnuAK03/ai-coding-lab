// frontend/src/pages/Signup.jsx
// Split-screen layout with pinned brand panel and independently scrolling form

import { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useNavigate, Link } from 'react-router-dom'
import { auth, db } from '../services/firebase'
import { Lightbulb, Terminal, BarChart3, Sun, Moon, ChevronDown } from 'lucide-react'

// Keep this list in sync with what teachers select when uploading programs (Day 8)
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical']
const YEARS = [1, 2, 3, 4]

export default function Signup() {
  const navigate = useNavigate()

  const [role,       setRole]       = useState('student')   // 'student' | 'teacher'
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [year,       setYear]       = useState(YEARS[0])
  const [section,    setSection]    = useState('A')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Theme state (same pattern as Login page)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codelab-theme')
      if (saved) return saved
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
      return 'dark'
    }
    return 'dark'
  })

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('codelab-theme', newTheme)
  }

  // Check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handler = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // classId is the field programs will be tagged with — e.g. 'CS-2-A'
  // Built consistently here so Day 8's program upload filters match exactly.
  function buildClassId() {
    const deptCode = department.split(' ').map(w => w[0]).join('').toUpperCase()
    return `${deptCode}-${year}-${section}`
  }

  // Theme classes (same pattern as Login page)
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      border: 'border-[#27272A]',
      inputBg: 'bg-[#1A1A1D]',
      inputBorder: 'border-[#27272A]',
      inputFocus: 'focus:border-[#818CF8] focus:ring-[#818CF8]/20',
      accent: 'bg-[#818CF8]',
      accentHover: 'hover:bg-[#6366F1]',
      accentText: 'text-[#818CF8]',
      toggleBg: 'bg-[#1A1A1D]',
      toggleActive: 'bg-[#818CF8]',
      errorBg: 'bg-red-500/10',
      errorBorder: 'border-red-500/30',
      errorText: 'text-red-400'
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      border: 'border-[#E5E5E5]',
      inputBg: 'bg-white',
      inputBorder: 'border-[#E5E5E5]',
      inputFocus: 'focus:border-[#6366F1] focus:ring-[#6366F1]/20',
      accent: 'bg-[#6366F1]',
      accentHover: 'hover:bg-[#4F46E5]',
      accentText: 'text-[#6366F1]',
      toggleBg: 'bg-[#F5F5F5]',
      toggleActive: 'bg-[#6366F1]',
      errorBg: 'bg-red-50',
      errorBorder: 'border-red-200',
      errorText: 'text-red-700'
    }
  }[theme]

  async function handleSignup(e) {
    e.preventDefault()
    setError('')

    if (!name || !email || !password) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (role === 'student' && !rollNumber) {
      setError('Roll number is required for students.')
      return
    }

    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)

      const profile = {
        uid:        result.user.uid,
        email,
        name,
        role,
        department,
        streak:     0,
        badges:     [],
        createdAt:  new Date().toISOString(),
      }

      if (role === 'student') {
        profile.rollNumber = rollNumber
        profile.year       = year
        profile.section    = section
        profile.classId    = buildClassId()   // e.g. 'CS-2-A' — used to filter programs
      }

      await setDoc(doc(db, 'users', result.user.uid), profile)

      navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Theme toggle - same position as Login */}
      <div className='fixed top-6 right-6 z-50'>
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-lg ${t.textMuted} hover:${t.text} transition-colors backdrop-blur-xl border ${t.border}`}
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(26, 26, 29, 0.7)' : 'rgba(255, 255, 255, 0.7)'
          }}
          aria-label='Toggle theme'
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Split-screen layout */}
      <div className='flex flex-col lg:flex-row min-h-screen'>
        
        {/* ── BRAND SIDE (Right half on desktop, top on mobile) ── */}
        <div className='lg:w-1/2 h-[30vh] lg:h-screen relative overflow-hidden order-1 lg:order-2'>
          {/* Gradient background (consistent with login) */}
          <div 
            className='absolute inset-0 transition-all duration-300'
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(79, 70, 229, 0.12) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(167, 139, 250, 0.1) 100%)'
            }}
          />

          {/* Floating badges and brand content */}
          <div className='absolute inset-0 flex items-center justify-center px-6 lg:px-12'>
            <div className={`relative max-w-md transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                           ${!reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-100'}`}
                 style={{
                   animationDelay: '0ms',
                   opacity: reducedMotion ? 1 : undefined
                 }}>
              
              {/* Floating badges (same as Login) */}
              <div className='flex items-center justify-center gap-4 mb-8 lg:mb-10'>
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full border-[3px] ${theme === 'dark' ? 'border-amber-600' : 'border-amber-500'} flex items-center justify-center
                               ${!reducedMotion ? 'animate-float' : ''}`}
                     style={{ animationDelay: '0ms' }}>
                  <Lightbulb size={20} className={theme === 'dark' ? 'text-amber-500' : 'text-amber-600'} strokeWidth={2} />
                </div>
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full border-[3px] ${theme === 'dark' ? 'border-emerald-600' : 'border-emerald-500'} flex items-center justify-center
                               ${!reducedMotion ? 'animate-float-delayed' : ''}`}
                     style={{ animationDelay: '400ms' }}>
                  <Terminal size={20} className={theme === 'dark' ? 'text-emerald-500' : 'text-emerald-600'} strokeWidth={2} />
                </div>
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full border-[3px] ${theme === 'dark' ? 'border-blue-600' : 'border-blue-500'} flex items-center justify-center
                               ${!reducedMotion ? 'animate-float-delayed-2' : ''}`}
                     style={{ animationDelay: '800ms' }}>
                  <BarChart3 size={20} className={theme === 'dark' ? 'text-blue-500' : 'text-blue-600'} strokeWidth={2} />
                </div>
              </div>

              {/* Brand copy (signup context) */}
              <h2 className='hidden lg:block text-3xl lg:text-4xl font-bold text-center leading-tight mb-6'>
                Join your class
                <br />
                in two minutes.
              </h2>

              {/* Mock UI panel snippet (simplified editor mockup) */}
              <div className='hidden lg:block'>
                <div 
                  className='rounded-2xl border overflow-hidden transition-all duration-300'
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(26, 26, 29, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)'
                  }}
                >
                  {/* Mini editor chrome */}
                  <div className={`px-4 py-3 flex items-center gap-2 border-b ${t.border}`}
                       style={{
                         backgroundColor: theme === 'dark' ? 'rgba(26, 26, 29, 0.6)' : 'rgba(245, 245, 245, 0.6)'
                       }}>
                    <div className='w-2.5 h-2.5 rounded-full bg-red-400/50' />
                    <div className='w-2.5 h-2.5 rounded-full bg-yellow-400/50' />
                    <div className='w-2.5 h-2.5 rounded-full bg-green-400/50' />
                  </div>
                  {/* Mini code snippet */}
                  <div className='p-4 font-mono text-xs lg:text-sm space-y-1.5'>
                    <div className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}>
                      def solve_problem():
                    </div>
                    <div className={`${t.textMuted} pl-4`}>
                      # AI hints guide your thinking
                    </div>
                    <div className={`${t.text} pl-4`}>
                      return solution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FORM SIDE (Left half on desktop, fits in viewport, bottom on mobile) ── */}
        <div className='lg:w-1/2 min-h-[70vh] lg:min-h-screen order-2 lg:order-1'>
          <div className='flex items-center justify-center py-8 lg:py-12 px-6 lg:px-12 h-full'>
            <div 
              className={`w-full max-w-2xl transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                         ${!reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-100'}`}
              style={{
                animationDelay: reducedMotion ? '0ms' : '200ms',
                opacity: reducedMotion ? 1 : undefined
              }}
            >
              {/* Glassmorphic card */}
              <div 
                className='rounded-3xl border p-6 lg:p-8 shadow-2xl transition-all duration-300'
                style={{
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(26, 26, 29, 0.7)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(24px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                  boxShadow: theme === 'dark'
                    ? '0 20px 60px rgba(0, 0, 0, 0.3)'
                    : '0 20px 60px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Header */}
                <div className='mb-6'>
                  <h1 className='text-2xl lg:text-3xl font-bold mb-1'>Create your account</h1>
                  <p className={`${t.textMuted} text-sm`}>
                    Join your class on CodeLab
                  </p>
                </div>

                {/* Role toggle - segmented control with sliding background */}
                <div className={`relative ${t.toggleBg} rounded-xl p-1 mb-5 transition-colors duration-300`}>
                  {/* Sliding background indicator */}
                  <div 
                    className={`absolute top-1 ${t.toggleActive} rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]`}
                    style={{
                      width: 'calc(50% - 4px)',
                      height: 'calc(100% - 8px)',
                      left: role === 'student' ? '4px' : 'calc(50%)',
                    }}
                  />
                  {/* Buttons */}
                  <div className='relative flex'>
                    {['student', 'teacher'].map(r => (
                      <button
                        key={r}
                        type='button'
                        onClick={() => setRole(r)}
                        className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-colors duration-300 capitalize z-10
                                   ${role === r ? 'text-white' : t.textMuted}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div 
                    className={`${t.errorBg} border ${t.errorBorder} ${t.errorText} rounded-xl p-3 mb-5 text-sm
                               transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]`}
                    style={{
                      animation: !reducedMotion ? 'slideDown 0.3s ease-out' : 'none'
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Signup form - Two column layout on desktop */}
                <form onSubmit={handleSignup} className='space-y-4'>
                  
                  {/* Row 1: Full name | Email */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    <div>
                      <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                        Full name
                      </label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder='Arjun Patel'
                        className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3.5 py-3
                                   text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                   ${t.text} placeholder:${t.textMuted}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                        Email
                      </label>
                      <input
                        type='email'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder='you@college.edu'
                        className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3.5 py-3
                                   text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                   ${t.text} placeholder:${t.textMuted}`}
                      />
                    </div>
                  </div>

                  {/* Row 2: Password | Department */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    <div>
                      <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                        Password
                      </label>
                      <input
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder='At least 6 characters'
                        className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3.5 py-3
                                   text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                   ${t.text} placeholder:${t.textMuted}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                        Department
                      </label>
                      <div className='relative'>
                        <select
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3.5 py-3 pr-10
                                     text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                     ${t.text} appearance-none cursor-pointer`}
                        >
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown 
                          size={16} 
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 (student only): Roll number | Year + Section */}
                  <div 
                    className='overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]'
                    style={{
                      maxHeight: role === 'student' ? '200px' : '0',
                      opacity: role === 'student' ? 1 : 0,
                      marginTop: role === 'student' ? '1rem' : '0'
                    }}
                  >
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                      <div>
                        <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                          Roll number
                        </label>
                        <input
                          value={rollNumber}
                          onChange={e => setRollNumber(e.target.value)}
                          placeholder='CS2024001'
                          className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3.5 py-3
                                     text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                     ${t.text} placeholder:${t.textMuted}`}
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                            Year
                          </label>
                          <div className='relative'>
                            <select
                              value={year}
                              onChange={e => setYear(Number(e.target.value))}
                              className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3 py-3 pr-8
                                         text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                         ${t.text} appearance-none cursor-pointer`}
                            >
                              {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                            <ChevronDown 
                              size={14} 
                              className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold ${t.text} mb-1.5`}>
                            Section
                          </label>
                          <input
                            value={section}
                            onChange={e => setSection(e.target.value.toUpperCase())}
                            maxLength={2}
                            placeholder='A'
                            className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-3.5 py-3
                                       text-sm focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                                       ${t.text} placeholder:${t.textMuted} text-center`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit button - full width */}
                  <button
                    type='submit'
                    disabled={loading}
                    className={`w-full ${t.accent} ${t.accentHover} text-white font-bold py-3.5 rounded-xl
                               text-sm shadow-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg
                               hover:-translate-y-0.5 hover:shadow-xl mt-5`}
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </form>

                <p className={`text-center text-xs ${t.textMuted} mt-5`}>
                  Already have an account?{' '}
                  <Link 
                    to='/login' 
                    className={`${t.accentText} font-semibold hover:underline transition-all`}
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 3.5s ease-in-out infinite;
        }

        .animate-float-delayed-2 {
          animation: float 4s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-float-delayed,
          .animate-float-delayed-2 {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

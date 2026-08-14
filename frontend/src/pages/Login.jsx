// frontend/src/pages/Login.jsx
// Split-screen layout with glassmorphic form card and brand side with floating badges

import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate, Link } from 'react-router-dom'
import { auth, db } from '../services/firebase'
import { Lightbulb, Terminal, BarChart3, Sun, Moon } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const navigate = useNavigate()

  // Theme state (same pattern as Landing page)
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

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with Firebase Auth
      const result = await signInWithEmailAndPassword(auth, email, password)

      // Fetch role from Firestore to decide where to redirect
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      const role = userDoc.data()?.role

      if (role === 'teacher') {
        navigate('/teacher/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err) {
      // Firebase error codes → human-readable messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Theme classes (same pattern as Landing page)
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
      errorBg: 'bg-red-50',
      errorBorder: 'border-red-200',
      errorText: 'text-red-700'
    }
  }[theme]

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Theme toggle - same position as Landing nav */}
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
          {/* Gradient background (consistent with landing hero) */}
          <div 
            className='absolute inset-0 transition-all duration-300'
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(79, 70, 229, 0.12) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(167, 139, 250, 0.1) 100%)'
            }}
          />

          {/* Floating badge animations (same as landing hero) */}
          <div className='absolute inset-0 flex items-center justify-center px-6 lg:px-12'>
            <div className={`relative max-w-md transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                           ${!reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-100'}`}
                 style={{
                   animationDelay: '0ms',
                   opacity: reducedMotion ? 1 : undefined
                 }}>
              
              {/* Floating badges */}
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

              {/* Brand copy */}
              <h2 className='hidden lg:block text-3xl lg:text-4xl font-bold text-center leading-tight mb-6'>
                Guided hints.
                <br />
                Real code.
                <br />
                Reports that actually help.
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

        {/* ── FORM SIDE (Left half on desktop, bottom on mobile) ── */}
        <div className='lg:w-1/2 min-h-[70vh] lg:h-screen flex items-center justify-center p-6 lg:p-12 order-2 lg:order-1'>
          <div 
            className={`w-full max-w-md transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                       ${!reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-100'}`}
            style={{
              animationDelay: reducedMotion ? '0ms' : '200ms',
              opacity: reducedMotion ? 1 : undefined
            }}
          >
            {/* Glassmorphic card */}
            <div 
              className='rounded-3xl border p-8 lg:p-10 shadow-2xl transition-all duration-300'
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
              <div className='mb-8'>
                <h1 className='text-3xl lg:text-4xl font-bold mb-2'>Welcome back</h1>
                <p className={`${t.textMuted} text-base`}>
                  Sign in to continue your learning
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div 
                  className={`${t.errorBg} border ${t.errorBorder} ${t.errorText} rounded-xl p-4 mb-6 text-sm
                             transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]`}
                  style={{
                    animation: !reducedMotion ? 'slideDown 0.3s ease-out' : 'none'
                  }}
                >
                  {error}
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleLogin} className='space-y-5'>
                <div>
                  <label className={`block text-sm font-semibold ${t.text} mb-2`}>
                    Email
                  </label>
                  <input
                    type='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='your@email.com'
                    className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-4 py-3.5
                               text-base focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                               ${t.text} placeholder:${t.textMuted}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold ${t.text} mb-2`}>
                    Password
                  </label>
                  <input
                    type='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder='••••••••'
                    className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.inputFocus} rounded-xl px-4 py-3.5
                               text-base focus:outline-none focus:ring-2 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                               ${t.text} placeholder:${t.textMuted}`}
                  />
                </div>
                
                <button
                  type='submit'
                  disabled={loading || !email || !password}
                  className={`w-full ${t.accent} ${t.accentHover} text-white font-bold py-4 rounded-xl
                             text-base shadow-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg
                             hover:-translate-y-0.5 hover:shadow-xl`}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className={`text-center text-sm ${t.textMuted} mt-6`}>
                New here?{' '}
                <Link 
                  to='/signup' 
                  className={`${t.accentText} font-semibold hover:underline transition-all`}
                >
                  Create an account
                </Link>
              </p>
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
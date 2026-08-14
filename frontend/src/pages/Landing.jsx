// frontend/src/pages/Landing.jsx
// Large distinct sections with unique animation styles per section
// Auto-expanding word-cycling pill + sticky nav with dropdown

import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { 
  ArrowRight, Lightbulb, Sparkles, BarChart3, CheckCircle, 
  User, Terminal, Shield, Trophy, Sun, Moon, ChevronDown
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  
  // Theme state
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

  // Cycling headline words with colors (light and dark theme versions)
  const cyclingWords = [
    { 
      word: 'build', 
      colorLight: 'rgba(99, 102, 241, 0.15)',
      colorDark: 'rgba(99, 102, 241, 0.25)'
    },
    { 
      word: 'debug', 
      colorLight: 'rgba(239, 68, 68, 0.15)',
      colorDark: 'rgba(239, 68, 68, 0.25)'
    },
    { 
      word: 'learn', 
      colorLight: 'rgba(34, 197, 94, 0.15)',
      colorDark: 'rgba(34, 197, 94, 0.25)'
    },
    { 
      word: 'think', 
      colorLight: 'rgba(168, 85, 247, 0.15)',
      colorDark: 'rgba(168, 85, 247, 0.25)'
    },
    { 
      word: 'ship', 
      colorLight: 'rgba(59, 130, 246, 0.15)',
      colorDark: 'rgba(59, 130, 246, 0.25)'
    }
  ]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [pillWidth, setPillWidth] = useState('auto')
  const [pillBgColor, setPillBgColor] = useState(cyclingWords[0].colorLight)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Ref to measure word width
  const wordMeasureRef = useRef(null)

  // Sticky nav state
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Section visibility + parallax
  const [visibleSections, setVisibleSections] = useState(new Set())
  const [scrollY, setScrollY] = useState(0)
  
  const heroRef = useRef(null)
  const editorRef = useRef(null)
  const explainerRef = useRef(null)
  const dashboardRef = useRef(null)
  const closingRef = useRef(null)

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('codelab-theme', newTheme)
  }

  // Update pill color when theme changes
  useEffect(() => {
    setPillBgColor(theme === 'dark' ? cyclingWords[currentWordIndex].colorDark : cyclingWords[currentWordIndex].colorLight)
  }, [theme, currentWordIndex, cyclingWords])

  // Check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handler = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Typing animation effect
  useEffect(() => {
    if (reducedMotion) {
      setDisplayedText(cyclingWords[0].word)
      // Measure initial width
      const tempSpan = document.createElement('span')
      tempSpan.style.cssText = `
        position: absolute;
        visibility: hidden;
        font-size: 75.6px;
        font-weight: 400;
        letter-spacing: -0.04em;
        white-space: nowrap;
      `
      tempSpan.textContent = cyclingWords[0].word
      document.body.appendChild(tempSpan)
      const textWidth = tempSpan.offsetWidth
      document.body.removeChild(tempSpan)
      const fontSize = 84
      const paddingTotal = fontSize * 0.7 * 2
      setPillWidth(`${textWidth + paddingTotal}px`)
      setPillBgColor(theme === 'dark' ? cyclingWords[0].colorDark : cyclingWords[0].colorLight)
      return
    }

    const currentWord = cyclingWords[currentWordIndex].word
    
    if (isTyping) {
      // Type out the word
      if (displayedText.length < currentWord.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1))
        }, 80) // Typing speed
        return () => clearTimeout(timeout)
      } else {
        // Finished typing, wait before erasing
        const timeout = setTimeout(() => {
          setIsTyping(false)
        }, 1800) // Pause before erasing
        return () => clearTimeout(timeout)
      }
    } else {
      // Erase the word
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1))
        }, 50) // Erasing speed (faster)
        return () => clearTimeout(timeout)
      } else {
        // Finished erasing, prepare next word
        setIsTransitioning(true)
        
        const nextIndex = (currentWordIndex + 1) % cyclingWords.length
        const nextWord = cyclingWords[nextIndex].word
        
        // Measure the next word's width BEFORE starting to type
        const tempSpan = document.createElement('span')
        tempSpan.style.cssText = `
          position: absolute;
          visibility: hidden;
          font-size: 75.6px;
          font-weight: 400;
          letter-spacing: -0.04em;
          white-space: nowrap;
        `
        tempSpan.textContent = nextWord
        document.body.appendChild(tempSpan)
        const textWidth = tempSpan.offsetWidth
        document.body.removeChild(tempSpan)
        
        const fontSize = 84
        const paddingTotal = fontSize * 0.7 * 2
        const totalWidth = textWidth + paddingTotal
        
        // Set the new width and color FIRST (theme-aware)
        setPillWidth(`${totalWidth}px`)
        setPillBgColor(theme === 'dark' ? cyclingWords[nextIndex].colorDark : cyclingWords[nextIndex].colorLight)
        
        // Then move to next word after a brief delay to let width transition
        const timeout = setTimeout(() => {
          setCurrentWordIndex(nextIndex)
          setIsTyping(true)
          setIsTransitioning(false)
        }, 150) // Short delay for width transition
        return () => clearTimeout(timeout)
      }
    }
  }, [displayedText, currentWordIndex, isTyping, reducedMotion, cyclingWords, isTransitioning, theme])

  // Sticky nav scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      if (!reducedMotion) {
        setScrollY(window.scrollY)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [reducedMotion])

  // Intersection observer for section entrances
  useEffect(() => {
    if (reducedMotion) {
      setVisibleSections(new Set(['hero', 'editor', 'explainer', 'dashboard', 'closing']))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.dataset.section]))
          }
        })
      },
      { threshold: 0.2 }
    )

    const sections = [heroRef, editorRef, explainerRef, dashboardRef, closingRef]
    sections.forEach(ref => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [reducedMotion])

  const isVisible = (section) => visibleSections.has(section)

  // Parallax helper for explainer section
  const getParallax = (speed) => {
    if (reducedMotion) return {}
    return { transform: `translateY(${scrollY * speed}px)` }
  }

  // Theme classes
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      border: 'border-[#27272A]',
      cardBg: 'bg-[#1A1A1D]',
      sectionAlt: 'bg-[#16161A]',
      accent: 'bg-[#818CF8] text-white',
      accentSoft: 'bg-[#818CF8]/15 text-[#A5B4FC]',
      accentVibrant: 'bg-[#818CF8]',
      accentHover: 'hover:bg-[#6366F1]',
      accentText: 'text-[#818CF8]',
      navBg: 'bg-[#0F0F10]/80',
      navScrolled: 'bg-[#0F0F10]/95',
      shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
      shadowHover: 'hover:shadow-[0_20px_60px_rgba(129,140,248,0.15)]'
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      border: 'border-[#E5E5E5]',
      cardBg: 'bg-white',
      sectionAlt: 'bg-[#F5F5F5]',
      accent: 'bg-[#6366F1] text-white',
      accentSoft: 'bg-[#6366F1]/12 text-[#6366F1]',
      accentVibrant: 'bg-[#6366F1]',
      accentHover: 'hover:bg-[#4F46E5]',
      accentText: 'text-[#6366F1]',
      navBg: 'bg-[#FAFAFA]/80',
      navScrolled: 'bg-[#FAFAFA]/95',
      shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
      shadowHover: 'hover:shadow-[0_20px_60px_rgba(99,102,241,0.12)]'
    }
  }[theme]

  return (
    <div className={`${t.bg} ${t.text} transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Water droplet glass spheres - scattered throughout entire page */}
      <div className='fixed inset-0 pointer-events-none z-0'>
        {/* Pink droplet - top left */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '180px',
            height: '180px',
            top: '8%',
            left: '5%',
            background: theme === 'dark' 
              ? 'radial-gradient(circle at 35% 30%, rgba(80, 60, 70, 0.6), rgba(60, 40, 50, 0.5), rgba(40, 30, 35, 0.4))'
              : 'radial-gradient(circle at 35% 30%, rgba(255, 240, 245, 0.9), rgba(255, 200, 220, 0.8), rgba(255, 182, 193, 0.7))',
            boxShadow: theme === 'dark'
              ? `inset -10px -10px 25px rgba(0, 0, 0, 0.3), inset 3px 3px 15px rgba(100, 80, 90, 0.4), 0 5px 25px rgba(0, 0, 0, 0.2)`
              : `inset -10px -10px 25px rgba(255, 150, 180, 0.25), inset 3px 3px 15px rgba(255, 255, 255, 0.7), 0 5px 25px rgba(255, 182, 193, 0.15)`
          }}
        />
        
        {/* Purple droplet - top right */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '140px',
            height: '140px',
            top: '12%',
            right: '8%',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 38% 32%, rgba(70, 60, 80, 0.58), rgba(50, 40, 60, 0.48), rgba(35, 30, 45, 0.38))'
              : 'radial-gradient(circle at 38% 32%, rgba(245, 240, 255, 0.88), rgba(220, 200, 240, 0.78), rgba(200, 180, 220, 0.68))',
            boxShadow: theme === 'dark'
              ? `inset -8px -8px 20px rgba(0, 0, 0, 0.28), inset 3px 3px 12px rgba(90, 80, 100, 0.38), 0 4px 20px rgba(0, 0, 0, 0.18)`
              : `inset -8px -8px 20px rgba(180, 140, 200, 0.24), inset 3px 3px 12px rgba(255, 255, 255, 0.65), 0 4px 20px rgba(200, 180, 220, 0.12)`
          }}
        />
        
        {/* Blue droplet - left middle */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '100px',
            height: '100px',
            top: '35%',
            left: '3%',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 40% 35%, rgba(60, 70, 80, 0.55), rgba(40, 50, 60, 0.45), rgba(30, 40, 50, 0.35))'
              : 'radial-gradient(circle at 40% 35%, rgba(240, 248, 255, 0.85), rgba(200, 220, 240, 0.75), rgba(180, 200, 230, 0.65))',
            boxShadow: theme === 'dark'
              ? `inset -6px -6px 15px rgba(0, 0, 0, 0.26), inset 2px 2px 10px rgba(80, 90, 100, 0.35), 0 3px 15px rgba(0, 0, 0, 0.15)`
              : `inset -6px -6px 15px rgba(140, 180, 220, 0.22), inset 2px 2px 10px rgba(255, 255, 255, 0.6), 0 3px 15px rgba(180, 200, 230, 0.1)`
          }}
        />
        
        {/* Coral droplet - right middle */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '160px',
            height: '160px',
            top: '45%',
            right: '6%',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 36% 33%, rgba(80, 60, 60, 0.59), rgba(60, 45, 45, 0.49), rgba(45, 35, 35, 0.39))'
              : 'radial-gradient(circle at 36% 33%, rgba(255, 245, 240, 0.89), rgba(255, 210, 200, 0.79), rgba(255, 180, 170, 0.69))',
            boxShadow: theme === 'dark'
              ? `inset -9px -9px 22px rgba(0, 0, 0, 0.29), inset 3px 3px 13px rgba(100, 80, 80, 0.39), 0 4px 22px rgba(0, 0, 0, 0.19)`
              : `inset -9px -9px 22px rgba(240, 140, 130, 0.25), inset 3px 3px 13px rgba(255, 255, 255, 0.68), 0 4px 22px rgba(255, 180, 170, 0.13)`
          }}
        />
        
        {/* Lavender droplet - bottom left */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '120px',
            height: '120px',
            bottom: '15%',
            left: '7%',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 37% 31%, rgba(70, 65, 75, 0.57), rgba(50, 45, 55, 0.47), rgba(40, 35, 45, 0.37))'
              : 'radial-gradient(circle at 37% 31%, rgba(248, 245, 255, 0.87), rgba(225, 210, 240, 0.77), rgba(210, 195, 230, 0.67))',
            boxShadow: theme === 'dark'
              ? `inset -7px -7px 18px rgba(0, 0, 0, 0.27), inset 2px 2px 11px rgba(90, 85, 95, 0.37), 0 4px 18px rgba(0, 0, 0, 0.17)`
              : `inset -7px -7px 18px rgba(180, 150, 210, 0.23), inset 2px 2px 11px rgba(255, 255, 255, 0.63), 0 4px 18px rgba(210, 195, 230, 0.11)`
          }}
        />
        
        {/* Rose droplet - bottom right */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '150px',
            height: '150px',
            bottom: '10%',
            right: '10%',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 39% 34%, rgba(75, 60, 65, 0.58), rgba(55, 45, 50, 0.48), rgba(40, 35, 40, 0.38))'
              : 'radial-gradient(circle at 39% 34%, rgba(255, 242, 248, 0.88), rgba(255, 205, 220, 0.78), rgba(240, 180, 200, 0.68))',
            boxShadow: theme === 'dark'
              ? `inset -8px -8px 20px rgba(0, 0, 0, 0.28), inset 3px 3px 12px rgba(95, 80, 85, 0.38), 0 4px 20px rgba(0, 0, 0, 0.18)`
              : `inset -8px -8px 20px rgba(220, 140, 170, 0.24), inset 3px 3px 12px rgba(255, 255, 255, 0.66), 0 4px 20px rgba(240, 180, 200, 0.12)`
          }}
        />
        
        {/* Mint droplet - center */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '90px',
            height: '90px',
            top: '60%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 40% 35%, rgba(60, 75, 70, 0.54), rgba(45, 60, 55, 0.44), rgba(35, 50, 45, 0.34))'
              : 'radial-gradient(circle at 40% 35%, rgba(240, 255, 250, 0.84), rgba(200, 240, 230, 0.74), rgba(180, 225, 220, 0.64))',
            boxShadow: theme === 'dark'
              ? `inset -5px -5px 14px rgba(0, 0, 0, 0.25), inset 2px 2px 9px rgba(80, 95, 90, 0.34), 0 3px 14px rgba(0, 0, 0, 0.14)`
              : `inset -5px -5px 14px rgba(140, 200, 190, 0.21), inset 2px 2px 9px rgba(255, 255, 255, 0.58), 0 3px 14px rgba(180, 225, 220, 0.09)`
          }}
        />
        
        {/* Amber droplet - top center */}
        <div 
          className='absolute rounded-full transition-all duration-300'
          style={{
            width: '110px',
            height: '110px',
            top: '5%',
            left: '48%',
            background: theme === 'dark'
              ? 'radial-gradient(circle at 38% 33%, rgba(75, 70, 60, 0.56), rgba(55, 50, 45, 0.46), rgba(45, 40, 35, 0.36))'
              : 'radial-gradient(circle at 38% 33%, rgba(255, 252, 240, 0.86), rgba(255, 235, 200, 0.76), rgba(250, 220, 180, 0.66))',
            boxShadow: theme === 'dark'
              ? `inset -6px -6px 16px rgba(0, 0, 0, 0.26), inset 2px 2px 10px rgba(95, 90, 80, 0.36), 0 3px 16px rgba(0, 0, 0, 0.15)`
              : `inset -6px -6px 16px rgba(220, 180, 120, 0.22), inset 2px 2px 10px rgba(255, 255, 255, 0.61), 0 3px 16px rgba(250, 220, 180, 0.1)`
          }}
        />
      </div>
      
      {/* ── STICKY NAV WITH DROPDOWN ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 
                      ${scrolled ? t.navScrolled : t.navBg} backdrop-blur-xl border-b ${t.border}`}>
        <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
          <span className={`text-lg font-bold ${t.text}`}>CodeLab</span>
          
          <div className='hidden md:flex items-center gap-8'>
            {/* Dropdown */}
            <div className='relative'>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                className={`flex items-center gap-1 text-sm font-medium ${t.textMuted} hover:${t.text} transition-colors`}
              >
                Product
                <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div 
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                  className={`absolute top-full left-0 mt-2 w-56 ${t.cardBg} border ${t.border} rounded-xl ${t.shadow}
                             transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                             ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                  style={{ transformOrigin: 'top' }}
                >
                  <div className='p-2'>
                    <a href='#editor' className={`block px-4 py-3 text-sm ${t.text} hover:${t.accentText} rounded-lg transition-colors`}>
                      Code Editor
                    </a>
                    <a href='#explainer' className={`block px-4 py-3 text-sm ${t.text} hover:${t.accentText} rounded-lg transition-colors`}>
                      AI Logic Explainer
                    </a>
                    <a href='#dashboard' className={`block px-4 py-3 text-sm ${t.text} hover:${t.accentText} rounded-lg transition-colors`}>
                      Teacher Dashboard
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${t.textMuted} hover:${t.text} transition-colors`}
              aria-label='Toggle theme'
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`text-sm ${t.textMuted} hover:${t.text} transition-colors px-3 py-2`}
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className={`text-sm ${t.accent} ${t.accentHover} transition-all px-5 py-2 rounded-lg font-semibold`}
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION (Large, rounded container, floating badge, auto-expanding pill) ── */}
      <section 
        ref={heroRef}
        data-section='hero'
        className='min-h-screen flex items-center justify-center px-6 py-32 relative'
      >
        <div 
          className={`max-w-7xl w-full rounded-[40px] border p-12 sm:p-16 relative z-10
                      transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                      ${isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                      ${theme === 'dark' 
                        ? 'border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
                        : 'border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
                      }`}
          style={{
            backgroundColor: theme === 'dark' 
              ? 'rgba(26, 26, 29, 0.4)' 
              : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)'
          }}
        >
          
          {/* Icon badge row with one floating badge */}
          <div className='flex items-center justify-center gap-4 mb-12'>
            <div className='w-12 h-12 rounded-full border-[3px] border-rose-500 dark:border-rose-600 flex items-center justify-center'>
              <User size={20} className='text-rose-600 dark:text-rose-500' strokeWidth={2} />
            </div>
            <div className={`w-12 h-12 rounded-full border-[3px] border-amber-500 dark:border-amber-600 flex items-center justify-center
                           ${!reducedMotion ? 'animate-float' : ''}`}>
              <Lightbulb size={20} className='text-amber-600 dark:text-amber-500' strokeWidth={2} />
            </div>
            <div className='w-12 h-12 rounded-full border-[3px] border-emerald-500 dark:border-emerald-600 flex items-center justify-center'>
              <Terminal size={20} className='text-emerald-600 dark:text-emerald-500' strokeWidth={2} />
            </div>
            <div className='w-12 h-12 rounded-full border-[3px] border-blue-500 dark:border-blue-600 flex items-center justify-center'>
              <BarChart3 size={20} className='text-blue-600 dark:text-blue-500' strokeWidth={2} />
            </div>
            <div className='w-12 h-12 rounded-full border-[3px] border-violet-500 dark:border-violet-600 flex items-center justify-center'>
              <Shield size={20} className='text-violet-600 dark:text-violet-500' strokeWidth={2} />
            </div>
            <div className='w-12 h-12 rounded-full border-[3px] border-cyan-500 dark:border-cyan-600 flex items-center justify-center'>
              <Trophy size={20} className='text-cyan-600 dark:text-cyan-500' strokeWidth={2} />
            </div>
            <div className='w-12 h-12 rounded-full border-[3px] border-pink-500 dark:border-pink-600 flex items-center justify-center'>
              <CheckCircle size={20} className='text-pink-600 dark:text-pink-500' strokeWidth={2} />
            </div>
          </div>

          {/* Hero headline with auto-expanding word pill */}
          <h1 className={`text-center text-[84px] font-bold ${t.text} leading-[1.1] tracking-[-0.04em] mb-8`}>
            <span className='block mb-4'>
              Students learn logic,
            </span>
            <span className='block'>
              then{' '}
              {/* Auto-expanding pill - larger size, typing effect, color transitions */}
              <span 
                ref={wordMeasureRef}
                className='inline-flex items-center justify-center rounded-full align-middle
                           transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]'
                style={{
                  margin: '0 0.2em',
                  padding: '0.08em 0.7em',
                  height: '1.2em',
                  verticalAlign: '-0.05em',
                  width: reducedMotion ? 'auto' : pillWidth,
                  minWidth: '2.5em',
                  backgroundColor: pillBgColor
                }}
              >
                <span 
                  className={`font-normal ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                  style={{
                    fontSize: '0.9em',
                    lineHeight: '1',
                    letterSpacing: '-0.04em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayedText}
                  {/* Typing cursor - slimmer */}
                  <span 
                    className='inline-block w-[0.03em] h-[0.75em] ml-[0.08em] align-middle'
                    style={{
                      backgroundColor: theme === 'dark' ? '#ffffff' : '#000000',
                      animation: isTyping ? 'none' : 'blink 1s step-end infinite'
                    }}
                  />
                </span>
              </span>
              {' '}it.
            </span>
          </h1>

          <style jsx>{`
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          `}</style>

          {/* Subtitle */}
          <p className={`text-center text-[24px] ${t.textMuted} leading-[1.5] max-w-3xl mx-auto mb-12`}>
            AI-guided coding labs for college courses. Proctored sessions, smart hints that guide without solving, automatic teacher reports.
          </p>

          {/* CTAs */}
          <div className='flex items-center justify-center gap-5 flex-wrap'>
            <button
              onClick={() => navigate('/signup')}
              className={`inline-flex items-center gap-3 ${t.accent} ${t.accentHover} transition-all 
                         px-8 py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1
                         ease-[cubic-bezier(0.25,1,0.5,1)] duration-300`}
            >
              Start a session
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`inline-flex items-center gap-3 ${t.textMuted} hover:${t.text} transition-all 
                         px-8 py-5 rounded-xl font-semibold text-lg border-2 ${t.border} hover:border-current
                         ease-[cubic-bezier(0.25,1,0.5,1)] duration-300`}
            >
              I already have an account
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-float {
            animation: none;
          }
        }
      `}</style>


      {/* ── EDITOR SECTION (Slide-in from sides) ── */}
      <section 
        id='editor'
        ref={editorRef}
        data-section='editor'
        className='min-h-[90vh] flex items-center justify-center px-6 py-32'
      >
        <div className='max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center'>
          
          {/* Content slides from left */}
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                          ${isVisible('editor') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-full border-2 border-emerald-400 dark:border-emerald-500 flex items-center justify-center'>
                <Terminal size={18} className='text-emerald-500 dark:text-emerald-400' strokeWidth={1.5} />
              </div>
              <span className={`text-base font-semibold ${t.textMuted} uppercase tracking-wider`}>
                Proctored Editor
              </span>
            </div>
            
            <h2 className='text-[56px] font-bold leading-[1.15] tracking-tight mb-8'>
              Write code.
              <br />
              Get hints when stuck.
            </h2>
            
            <p className={`text-[22px] ${t.textMuted} leading-relaxed mb-10`}>
              Fullscreen lock, paste-blocking, and up to 3 AI hints per program. Each hint guides thinking without handing over the answer.
            </p>
          </div>

          {/* Mockup slides from right with 3D depth */}
          <div className={`relative transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] delay-200
                          group hover:-translate-y-2 ${t.shadowHover}
                          ${isVisible('editor') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'}`}>
            <div className={`${t.cardBg} border ${t.border} rounded-2xl overflow-hidden ${t.shadow}`}>
              {/* Editor chrome */}
              <div className={`${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F5F5F5]'} border-b ${t.border} px-5 py-4 flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3A]' : 'bg-[#D4D4D4]'}`} />
                <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3A]' : 'bg-[#D4D4D4]'}`} />
                <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-[#3A3A3A]' : 'bg-[#D4D4D4]'}`} />
                <span className={`text-sm ${t.textMuted} ml-3 font-mono`}>fibonacci.py</span>
              </div>

              {/* Code area */}
              <div className={`p-8 font-mono text-base leading-relaxed ${theme === 'dark' ? 'bg-[#0F0F10]' : 'bg-white'}`}>
                <div className={t.textMuted}>
                  <span className={t.accentText}>def</span> <span className={t.text}>fibonacci</span>
                  <span className={t.textMuted}>(n):</span>
                </div>
                <div className={`${t.textMuted} ml-6 mt-2`}>
                  <span className='opacity-50'># Your code here...</span>
                </div>
                <div className={`${t.text} ml-6 mt-2`}>
                  <span className={`inline-block w-2 h-5 ${theme === 'dark' ? 'bg-[#818CF8]' : 'bg-[#6366F1]'} animate-pulse`} />
                </div>
              </div>

              {/* AI Hint panel */}
              <div className={`${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border-t ${theme === 'dark' ? 'border-indigo-500/20' : 'border-indigo-500/10'} p-6`}>
                <div className='flex items-start gap-4'>
                  <div className={`p-2.5 ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-500/5'} rounded-lg`}>
                    <Lightbulb size={20} className={t.accentText} strokeWidth={1.5} />
                  </div>
                  <div className='flex-1'>
                    <p className={`text-sm font-bold ${t.accentText} mb-2 uppercase tracking-wide`}>Hint #1 of 3</p>
                    <p className={`text-base ${t.text} leading-relaxed`}>
                      Start by defining the base cases. What should fibonacci(0) and fibonacci(1) return?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── AI EXPLAINER SECTION (Real parallax, distinct background) ── */}
      <section 
        id='explainer'
        ref={explainerRef}
        data-section='explainer'
        className={`min-h-[90vh] flex items-center justify-center px-6 py-32 ${t.sectionAlt}`}
      >
        <div className='max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center'>
          
          {/* Mockup with real parallax */}
          <div 
            className={`relative transition-opacity duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                       ${isVisible('explainer') ? 'opacity-100' : 'opacity-0'}`}
            style={!reducedMotion ? getParallax(0.05) : {}}
          >
            <div className={`${t.cardBg} border ${t.border} rounded-2xl p-8 ${t.shadow}`}>
              <div className='flex items-center gap-3 mb-6'>
                <Sparkles size={18} className={t.accentText} strokeWidth={1.5} />
                <div className={`text-xs font-bold ${t.textMuted} uppercase tracking-wider`}>
                  Understand the Logic
                </div>
              </div>
              
              <div className='space-y-5'>
                <div>
                  <h4 className={`text-base font-bold ${t.text} mb-3`}>What this program does</h4>
                  <p className={`text-base ${t.textMuted} leading-relaxed`}>
                    The Fibonacci sequence is a series where each number is the sum of the two 
                    preceding ones: 0, 1, 1, 2, 3, 5, 8...
                  </p>
                </div>

                <div>
                  <h4 className={`text-base font-bold ${t.text} mb-4`}>The approach</h4>
                  <ul className={`text-base ${t.textMuted} space-y-3`}>
                    <li className='flex items-start gap-3'>
                      <CheckCircle size={18} className={`${t.accentText} mt-1 flex-shrink-0`} strokeWidth={1.5} />
                      <span>Define base cases: fib(0) = 0 and fib(1) = 1</span>
                    </li>
                    <li className='flex items-start gap-3'>
                      <CheckCircle size={18} className={`${t.accentText} mt-1 flex-shrink-0`} strokeWidth={1.5} />
                      <span>For any n &gt; 1, return fib(n-1) + fib(n-2)</span>
                    </li>
                    <li className='flex items-start gap-3'>
                      <CheckCircle size={18} className={`${t.accentText} mt-1 flex-shrink-0`} strokeWidth={1.5} />
                      <span>Use recursion to break into subproblems</span>
                    </li>
                  </ul>
                </div>

                <div className={`pt-4 border-t ${t.border}`}>
                  <p className={`text-sm ${t.textMuted} italic`}>
                    The AI explains logic — never gives you the code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] delay-200
                          ${isVisible('explainer') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-full border-2 border-amber-400 dark:border-amber-500 flex items-center justify-center'>
                <Sparkles size={18} className='text-amber-500 dark:text-amber-400' strokeWidth={1.5} />
              </div>
              <span className={`text-base font-semibold ${t.textMuted} uppercase tracking-wider`}>
                AI Guidance
              </span>
            </div>
            
            <h2 className='text-[56px] font-bold leading-[1.15] tracking-tight mb-8'>
              You understand
              <br />
              the approach.
              <br />
              AI never codes it.
            </h2>
            
            <p className={`text-[22px] ${t.textMuted} leading-relaxed`}>
              Before students write a single line, the AI breaks down what the program should do and how to approach it.
            </p>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD SECTION (Scale-up reveal, distinct background) ── */}
      <section 
        id='dashboard'
        ref={dashboardRef}
        data-section='dashboard'
        className='min-h-[90vh] flex items-center justify-center px-6 py-32'
      >
        <div className='max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center'>
          
          {/* Content */}
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                          ${isVisible('dashboard') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-10 h-10 rounded-full border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center'>
                <BarChart3 size={18} className='text-blue-500 dark:text-blue-400' strokeWidth={1.5} />
              </div>
              <span className={`text-base font-semibold ${t.textMuted} uppercase tracking-wider`}>
                For Teachers
              </span>
            </div>
            
            <h2 className='text-[56px] font-bold leading-[1.15] tracking-tight mb-8'>
              Zero grading.
              <br />
              Full insight into
              <br />
              every student.
            </h2>
            
            <p className={`text-[22px] ${t.textMuted} leading-relaxed`}>
              ML pipeline analyzes every session: time, hints, test results, code quality, quiz scores. Teachers see exactly where students struggle.
            </p>
          </div>

          {/* Mockup with scale-up reveal */}
          <div className={`relative transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] delay-200
                          ${isVisible('dashboard') ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className={`${t.cardBg} border ${t.border} rounded-2xl p-8 ${t.shadow}`}>
              <div className='flex items-center gap-3 mb-6'>
                <BarChart3 size={18} className={t.accentText} strokeWidth={1.5} />
                <div className={`text-xs font-bold ${t.textMuted} uppercase tracking-wider`}>
                  Student Performance Report
                </div>
              </div>

              <div className='space-y-5'>
                {/* Student info */}
                <div className={`flex items-center justify-between pb-5 border-b ${t.border}`}>
                  <div>
                    <p className={`text-base font-bold ${t.text}`}>Sarah Johnson</p>
                    <p className={`text-sm ${t.textMuted} mt-1`}>Fibonacci Sequence</p>
                  </div>
                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-400 bg-indigo-400/10' : 'text-indigo-600 bg-indigo-600/10'} px-4 py-2 rounded-full`}>
                    Tier A
                  </span>
                </div>

                {/* Metrics grid */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className={`${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border ${t.border} rounded-xl p-5`}>
                    <p className={`text-xs ${t.textMuted} mb-2 font-semibold uppercase tracking-wide`}>Time spent</p>
                    <p className={`text-3xl font-bold ${t.text}`}>18 min</p>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border ${t.border} rounded-xl p-5`}>
                    <p className={`text-xs ${t.textMuted} mb-2 font-semibold uppercase tracking-wide`}>Hints used</p>
                    <p className={`text-3xl font-bold ${t.text}`}>1 of 3</p>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border ${t.border} rounded-xl p-5`}>
                    <p className={`text-xs ${t.textMuted} mb-2 font-semibold uppercase tracking-wide`}>Test pass rate</p>
                    <p className={`text-3xl font-bold ${t.text}`}>100%</p>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border ${t.border} rounded-xl p-5`}>
                    <p className={`text-xs ${t.textMuted} mb-2 font-semibold uppercase tracking-wide`}>Quiz score</p>
                    <p className={`text-3xl font-bold ${t.text}`}>4/5</p>
                  </div>
                </div>

                {/* Weak concepts */}
                <div className='pt-3'>
                  <p className={`text-xs font-bold ${t.textMuted} mb-3 uppercase tracking-wider`}>
                    Weak concepts detected
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <span className={`text-sm font-medium ${t.text} ${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border ${t.border} 
                                     px-4 py-2 rounded-lg`}>Recursion depth</span>
                    <span className={`text-sm font-medium ${t.text} ${theme === 'dark' ? 'bg-[#1A1A1D]' : 'bg-[#F8F8F8]'} border ${t.border} 
                                     px-4 py-2 rounded-lg`}>Base case logic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING CAPABILITIES STRIP (Simple fade-up) ── */}
      <section 
        ref={closingRef}
        data-section='closing'
        className='px-6 py-24'
      >
        <div className={`max-w-5xl mx-auto transition-all duration-800 ease-[cubic-bezier(0.25,1,0.5,1)]
                        ${isVisible('closing') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className='grid sm:grid-cols-3 gap-12 text-center'>
            <div>
              <p className={`text-lg ${t.text} font-bold mb-2`}>
                3 hints per program
              </p>
              <p className={`text-base ${t.textMuted}`}>
                never the answer
              </p>
            </div>
            <div>
              <p className={`text-lg ${t.text} font-bold mb-2`}>
                Plagiarism checked
              </p>
              <p className={`text-base ${t.textMuted}`}>
                structurally, across submissions
              </p>
            </div>
            <div>
              <p className={`text-lg ${t.text} font-bold mb-2`}>
                Reports generated
              </p>
              <p className={`text-base ${t.textMuted}`}>
                automatically after each session
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`border-t ${t.border} py-16 text-center transition-colors duration-300`}>
        <p className={`text-base ${t.textMuted}`}>CodeLab — Built for college programming labs</p>
      </footer>
    </div>
  )
}

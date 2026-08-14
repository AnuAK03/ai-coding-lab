// frontend/src/layouts/StudentLayout.jsx
// Persistent sidebar app shell for student pages

import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Code2, History, User, 
  Sun, Moon, Menu, X 
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useTheme } from '../contexts/ThemeContext'

export default function StudentLayout({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Get theme from context
  const { theme, toggleTheme } = useTheme()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { path: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/student/programs', label: 'Programs', icon: Code2 },
    { path: '/student/sessions', label: 'Sessions', icon: History },
    { path: '/student/profile', label: 'Profile', icon: User },
  ]

  const isActive = (path) => location.pathname === path

  // Theme classes
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      border: 'border-white/10',
      sidebarBg: 'rgba(15, 15, 16, 0.95)',
      navItemHover: 'hover:bg-white/5',
      navItemActive: 'bg-[#818CF8]/15 text-[#A5B4FC]',
      mobileBg: 'bg-[#0F0F10]/95'
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      border: 'border-[#E5E5E5]',
      sidebarBg: 'rgba(255, 255, 255, 0.95)',
      navItemHover: 'hover:bg-[#F5F5F5]',
      navItemActive: 'bg-[#6366F1]/12 text-[#6366F1]',
      mobileBg: 'bg-white/95'
    }
  }[theme]

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar user={user} role='student' theme={theme} />

      {/* Theme toggle - fixed top right */}
      <div className='fixed top-6 right-6 z-50'>
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 flex items-center justify-center rounded-lg ${t.textMuted} 
                     transition-all duration-200 backdrop-blur-xl border ${t.border}
                     hover:scale-105 active:scale-95`}
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(26, 26, 29, 0.7)' : 'rgba(255, 255, 255, 0.7)'
          }}
          aria-label='Toggle theme'
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`lg:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full ${t.text} transition-all duration-300 shadow-2xl`}
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(129, 140, 248, 0.9)' : 'rgba(99, 102, 241, 0.9)'
        }}
        aria-label='Toggle menu'
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className='flex'>
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:flex flex-col w-64 border-r ${t.border} h-[calc(100vh-64px)] sticky top-16 transition-all duration-300`}
          style={{
            backgroundColor: t.sidebarBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <nav className='flex-1 p-4 space-y-2'>
            {navItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                             ${active ? t.navItemActive : `${t.textMuted} ${t.navItemHover}`}`}
                >
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors
                                 ${active 
                                   ? (theme === 'dark' ? 'border-[#818CF8]' : 'border-[#6366F1]')
                                   : (theme === 'dark' ? 'border-white/20' : 'border-[#E5E5E5]')
                                 }`}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <span className='font-semibold text-sm'>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar (slide-in drawer) */}
        <div 
          className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside 
            className={`absolute left-0 top-0 bottom-0 w-72 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{
              backgroundColor: t.mobileBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className='p-6 border-b ${t.border}'>
              <h2 className={`text-lg font-bold ${t.text}`}>Menu</h2>
            </div>
            <nav className='p-4 space-y-2'>
              {navItems.map(item => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
                               ${active ? t.navItemActive : `${t.textMuted} ${t.navItemHover}`}`}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors
                                   ${active 
                                     ? (theme === 'dark' ? 'border-[#818CF8]' : 'border-[#6366F1]')
                                     : (theme === 'dark' ? 'border-white/20' : 'border-[#E5E5E5]')
                                   }`}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <span className='font-semibold text-sm'>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>

        {/* Main content area */}
        <main className='flex-1 min-h-[calc(100vh-64px)]'>
          <Outlet context={{ theme }} />
        </main>
      </div>
    </div>
  )
}

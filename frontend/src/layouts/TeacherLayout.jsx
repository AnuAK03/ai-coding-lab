// frontend/src/layouts/TeacherLayout.jsx
// Persistent sidebar app shell for teacher pages

import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Tv, TrendingUp, User as UserIcon,
  LogOut, Plus, Search, Bell, Menu, X 
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function TeacherLayout({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Get theme from context
  const { theme } = useTheme()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  const navItems = [
    { path: '/teacher/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/teacher/students', label: 'Students', icon: Users },
    { path: '/teacher/programs', label: 'Programs', icon: Tv },
    { path: '/teacher/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/teacher/profile', label: 'Profile', icon: UserIcon },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className='min-h-screen bg-[#FAFAF5] flex'>
      {/* Desktop Sidebar - w-64 = 256px to match Stitch */}
      <aside className='hidden lg:flex flex-col w-64 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/30 h-screen fixed left-0 top-0 z-50 py-xl px-md rounded-r-3xl shadow-xl'>
        {/* Logo Section */}
        <div className='flex items-center gap-sm mb-2xl px-sm'>
          <div className='w-10 h-10 rounded-lg bg-primary-container border border-outline-variant/50 flex items-center justify-center shrink-0'>
            <span className='text-primary text-[14px] font-bold'>&lt;/&gt;</span>
          </div>
          <div>
            <h1 className='font-headline-md text-headline-md font-bold text-primary tracking-tight'>CodeLab</h1>
            <p className='font-label-md text-label-md text-on-surface-variant/70'>Instructor Portal</p>
          </div>
        </div>

        {/* New Lesson Button */}
        <button className='w-full mb-lg py-sm px-md rounded-lg bg-accent-indigo text-surface-container-lowest font-label-md text-label-md flex items-center justify-center gap-sm hover:opacity-90 transition-opacity shadow-sm'>
          <Plus size={18} strokeWidth={2.5} />
          New Lesson
        </button>

        {/* Navigation */}
        <nav className='flex-1 flex flex-col gap-xs'>
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-md px-md py-sm font-body-md text-body-md transition-all duration-150
                           ${active 
                             ? 'text-primary font-bold border-r-[3px] border-primary bg-[#f0f5eb] rounded-l-lg rounded-r-none' 
                             : 'text-on-surface-variant/70 hover:text-primary hover:bg-primary-container/20 rounded-lg'
                           }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className='mt-auto pt-lg border-t border-outline-variant/20'>
          <button 
            onClick={handleLogout}
            className='w-full flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant/70 hover:text-error hover:bg-error-container/30 transition-colors font-body-md text-body-md'
          >
            <LogOut size={20} strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div 
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside 
          className={`absolute left-0 top-0 bottom-0 w-64 bg-surface/90 backdrop-blur-xl transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Logo Section */}
          <div className='px-4 pt-6 pb-4'>
            <div className='flex items-center gap-2 mb-5'>
              <div className='w-10 h-10 rounded-lg bg-primary-container border border-outline-variant/50 flex items-center justify-center'>
                <span className='text-primary text-sm font-bold'>&lt;/&gt;</span>
              </div>
              <div>
                <h1 className='font-headline-md text-[18px] font-bold text-primary'>CodeLab</h1>
                <p className='font-label-md text-[10px] text-on-surface-variant/70'>Instructor Portal</p>
              </div>
            </div>

            <button className='w-full bg-accent-indigo text-surface-container-lowest text-xs font-medium py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5'>
              <Plus size={14} />
              New Lesson
            </button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-3 space-y-1'>
            {navItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                             ${active ? 'text-primary font-bold bg-primary-container/30' : 'text-on-surface-variant/70 hover:bg-primary-container/20'}`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className='lg:hidden fixed bottom-6 right-6 z-40 p-3 rounded-full bg-accent-indigo text-white shadow-lg'
        aria-label='Toggle menu'
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main content area with top bar */}
      <div className='flex-1 lg:ml-64'>
        {/* Top Navigation Bar - h-20 = 80px to match Stitch */}
        <header className='bg-surface/60 backdrop-blur-md h-20 border-b border-outline-variant/20 flex justify-between items-center w-full px-margin sticky top-0 z-40'>
          {/* Search Bar */}
          <div className='flex items-center w-96 bg-background border border-outline-variant/50 rounded-full px-md py-2 focus-within:border-accent-indigo focus-within:ring-1 focus-within:ring-accent-indigo transition-all'>
            <Search size={20} className='text-on-surface-variant mr-sm' strokeWidth={2} />
            <input 
              type='text' 
              placeholder='Search across workspace...'
              className='bg-transparent border-none outline-none font-body-md text-body-md text-text-primary placeholder-on-surface-variant/70 w-full focus:ring-0 p-0'
            />
          </div>

          {/* Trailing Actions & Profile */}
          <div className='flex items-center gap-lg'>
            <button className='relative text-on-surface-variant hover:opacity-80 transition-opacity'>
              <Bell size={24} className='text-on-surface-variant' strokeWidth={2} />
              <span className='absolute top-0 right-0 w-2 h-2 bg-accent-indigo rounded-full'></span>
            </button>

            <div className='h-8 w-px bg-outline-variant/30'></div>

            <button 
              onClick={() => navigate('/teacher/profile')}
              className='flex items-center gap-sm cursor-pointer hover:opacity-80 transition-opacity'
            >
              <div className='w-8 h-8 rounded-full overflow-hidden border border-outline-variant/50 bg-secondary-container flex items-center justify-center'>
                <span className='text-on-secondary-container text-[13px] font-semibold'>
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'T'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className='min-h-[calc(100vh-80px)]'>
          <Outlet context={{ theme }} />
        </main>
      </div>
    </div>
  )
}

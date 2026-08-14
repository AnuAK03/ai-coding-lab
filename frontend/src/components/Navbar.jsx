// frontend/src/components/Navbar.jsx
// Glassmorphic sticky navbar with theme support

import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { LogOut, Code2 } from 'lucide-react'

export default function Navbar({ user, role, theme = 'dark' }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const t = {
    dark: {
      navBg: 'rgba(15, 15, 16, 0.8)',
      border: 'border-white/10',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      accent: 'bg-[#818CF8]/10 border-[#818CF8]/20 text-[#818CF8]',
      badge: 'bg-[#818CF8]/15 text-[#A5B4FC] border-[#818CF8]/20'
    },
    light: {
      navBg: 'rgba(250, 250, 250, 0.8)',
      border: 'border-[#E5E5E5]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      accent: 'bg-[#6366F1]/10 border-[#6366F1]/20 text-[#6366F1]',
      badge: 'bg-[#6366F1]/12 text-[#6366F1] border-[#6366F1]/20'
    }
  }[theme]

  return (
    <nav className={`sticky top-0 z-50 border-b ${t.border} px-6 py-4
                    flex items-center justify-between transition-all duration-300`}
         style={{
           backgroundColor: t.navBg,
           backdropFilter: 'blur(20px) saturate(150%)',
           WebkitBackdropFilter: 'blur(20px) saturate(150%)'
         }}>
      {/* Logo */}
      <div className='flex items-center gap-3'>
        <div className={`w-8 h-8 rounded-lg ${t.accent} border flex items-center justify-center`}>
          <Code2 size={18} strokeWidth={2.5} />
        </div>
        <span className={`font-bold ${t.text} text-lg`}>CodeLab</span>
        <span className={`ml-2 text-xs ${t.badge} px-3 py-1 rounded-full font-semibold capitalize border`}>
          {role}
        </span>
      </div>

      {/* Right side */}
      <div className='flex items-center gap-5'>
        <span className={`text-sm ${t.textMuted} hidden sm:block`}>
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 text-sm ${t.textMuted}
                     hover:text-red-400 transition-all duration-200 font-medium`}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
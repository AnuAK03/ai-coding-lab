// frontend/src/pages/student/Profile.jsx
// Student profile page - displays user info and settings

import { useEffect, useState } from 'react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import {
  Search, Bell, Moon, Edit2, CheckCircle2,
  Moon as MoonIcon, Volume2, Flag, Sun
} from 'lucide-react'

import themeForest from '../../assets/theme_forest.png'
import themeMountain from '../../assets/theme_mountain.png'
import themeNight from '../../assets/theme_night.png'
import themeDesk from '../../assets/theme_desk.png'
import avatarBunny from '../../assets/avatar_bunny.png'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()
  const user = getAuth().currentUser

  const [activeWorkspace, setActiveWorkspace] = useState('Forest Lake')
  const [activeColor, setActiveColor] = useState('Forest')
  const [soundEffects, setSoundEffects] = useState(true)
  const [notifications, setNotifications] = useState(true)

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      if (!user) return
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
  }, [user?.uid])

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#fcfaf5] flex items-center justify-center transition-colors duration-300`}>
        <p className='text-gray-500'>Loading profile...</p>
      </div>
    )
  }

  const workspaces = [
    { name: 'Forest Lake', image: themeForest },
    { name: 'Mountain Cabin', image: themeMountain },
    { name: 'Night Sky', image: themeNight },
    { name: 'Cozy Desk', image: themeDesk },
  ]

  const palettes = [
    { name: 'Forest (Default)', colors: ['bg-[#4a6f55]', 'bg-[#fbcfe8]', 'bg-[#fcfaf5]'], value: 'Forest' },
    { name: 'Ocean Mist', colors: ['bg-[#0e7490]', 'bg-[#cffafe]', 'bg-[#f8fafc]'], value: 'Ocean Mist' },
    { name: 'Autumn Leaf', colors: ['bg-[#b45309]', 'bg-[#ffedd5]', 'bg-[#fffbeb]'], value: 'Autumn Leaf' },
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#121212] text-gray-100' : 'bg-[#fcfaf5] text-[#171717]'} pb-12 transition-colors duration-300`}>


      <div className='max-w-[1200px] mx-auto px-8 pt-8'>
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            
            {/* Left Column */}
            <div className='space-y-6'>
               
               {/* Personal Information */}
               <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-outline-variant/30'} rounded-[20px] p-6 shadow-sm border`}>
                  <div className='flex justify-between items-start mb-6'>
                     <div>
                        <h2 className='text-lg font-serif font-bold mb-1'>Personal Information</h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Manage your student identity and contact details.</p>
                     </div>
                     <button className='flex items-center gap-1.5 text-sm font-semibold text-[#4a6f55] hover:text-[#3d5c46]'>
                        <Edit2 size={14} /> Edit
                     </button>
                  </div>

                  <div className='flex flex-col sm:flex-row gap-8'>
                     {/* Avatar & Badge */}
                     <div className='flex flex-col items-center gap-3 shrink-0'>
                        <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-[#fcfaf5] shadow-sm'>
                           <img src={avatarBunny} alt="Profile Bunny" className='w-full h-full object-cover' />
                        </div>
                        <span className='bg-[#e2e8f0] text-gray-700 text-xs font-bold px-3 py-1 rounded-full'>
                           Pro Student
                        </span>
                     </div>

                     {/* Form Fields */}
                     <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                           <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1.5`}>Full Name</label>
                           <input type="text" readOnly value={profile?.name || 'Alice Liddell'} className={`w-full ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                        </div>
                        <div>
                           <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1.5`}>Email Address</label>
                           <input type="text" readOnly value={user?.email || 'alice.l@codelab.edu'} className={`w-full ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                        </div>
                        <div>
                           <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1.5`}>Roll Number</label>
                           <input type="text" readOnly value={profile?.rollNumber || 'CS-2024-042'} className={`w-full ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                        </div>
                        <div>
                           <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1.5`}>Semester</label>
                           <select className={`w-full ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'} rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none`}>
                              <option>{profile?.semester || '4th Semester'}</option>
                           </select>
                        </div>
                        <div className='sm:col-span-2'>
                           <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1.5`}>Department</label>
                           <input type="text" readOnly value={profile?.department || 'Computer Science & Engineering'} className={`w-full ${theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none`} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* General Preferences */}
               <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-outline-variant/30'} rounded-[20px] p-6 shadow-sm border`}>
                  <h2 className='text-lg font-serif font-bold mb-6'>General Preferences</h2>
                  
                  <div className='space-y-6'>
                     {/* Dark Mode Toggle */}
                     <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-[#fed7aa] text-[#b45309]'}`}>
                              <MoonIcon size={20} />
                           </div>
                           <div>
                              <h4 className='font-bold text-sm'>Dark Mode</h4>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Switch to a darker theme for late-night coding sessions.</p>
                           </div>
                        </div>
                        <button 
                           onClick={toggleTheme}
                           className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-[#4a6f55]' : 'bg-gray-200'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}></div>
                        </button>
                     </div>

                     <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}></div>

                     {/* Sound Effects */}
                     <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-[#4a6f55] text-white'}`}>
                              <Volume2 size={20} />
                           </div>
                           <div>
                              <h4 className='font-bold text-sm'>Sound Effects</h4>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Play subtle sounds when completing tasks or receiving achievements.</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setSoundEffects(!soundEffects)}
                           className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${soundEffects ? 'bg-[#4a6f55]' : 'bg-gray-200'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${soundEffects ? 'translate-x-6' : 'translate-x-1'}`}></div>
                        </button>
                     </div>

                     <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}></div>

                     {/* Notifications */}
                     <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-[#78909c] text-white'}`}>
                              <Flag size={20} />
                           </div>
                           <div>
                              <h4 className='font-bold text-sm'>Coding Goal Notifications</h4>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Receive gentle reminders about your daily coding streaks.</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setNotifications(!notifications)}
                           className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${notifications ? 'bg-[#4a6f55]' : 'bg-gray-200'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column */}
            <div className='space-y-6'>
               
               {/* Workspace Environment */}
               <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-outline-variant/30'} rounded-[20px] p-6 shadow-sm border`}>
                  <h2 className='text-lg font-serif font-bold mb-1'>Workspace Environment</h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Choose a scenery to set the mood for your coding sessions.</p>

                  <div className='grid grid-cols-2 gap-4'>
                     {workspaces.map(ws => (
                        <div key={ws.name} className='space-y-2 cursor-pointer group' onClick={() => setActiveWorkspace(ws.name)}>
                           <div className={`rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeWorkspace === ws.name ? 'border-[#4a6f55] shadow-md p-1 bg-[#fcfaf5]' : 'border-gray-200 hover:border-gray-300'}`}>
                              <img src={ws.image} alt={ws.name} className={`w-full h-24 object-cover ${activeWorkspace === ws.name ? 'rounded-lg' : ''}`} />
                           </div>
                           <div className='flex items-center justify-between px-1'>
                              <span className={`text-xs font-bold ${activeWorkspace === ws.name ? 'text-[#4a6f55]' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}>{ws.name}</span>
                              {activeWorkspace === ws.name && <CheckCircle2 size={14} className='text-[#4a6f55]' />}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Color Palette */}
               <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-outline-variant/30'} rounded-[20px] p-6 shadow-sm border`}>
                  <h2 className='text-lg font-serif font-bold mb-1'>Color Palette</h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Customize the interface accent colors.</p>

                  <div className='space-y-3'>
                     {palettes.map(palette => (
                        <div 
                           key={palette.value}
                           onClick={() => setActiveColor(palette.value)}
                           className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                              activeColor === palette.value 
                                 ? (theme === 'dark' ? 'border-[#4a6f55] bg-[#4a6f55]/10' : 'border-[#4a6f55] bg-[#fcfaf5]') 
                                 : (theme === 'dark' ? 'border-gray-700 hover:bg-[#2a2a2a]' : 'border-gray-200 hover:bg-gray-50')
                           }`}
                        >
                           <div className='flex items-center gap-3'>
                              <div className='flex -space-x-2'>
                                 {palette.colors.map((color, i) => (
                                    <div key={i} className={`w-5 h-5 rounded-full ${color} border-2 border-white shadow-sm z-[${3-i}]`}></div>
                                 ))}
                              </div>
                              <span className={`text-sm font-semibold ${activeColor === palette.value ? (theme === 'dark' ? 'text-gray-100' : 'text-[#4a6f55]') : ''}`}>{palette.name}</span>
                           </div>
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeColor === palette.value ? 'border-[#4a6f55]' : 'border-gray-300'}`}>
                              {activeColor === palette.value && <div className='w-2.5 h-2.5 rounded-full bg-[#4a6f55]'></div>}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
         </div>
      </div>
    </div>
  )
}

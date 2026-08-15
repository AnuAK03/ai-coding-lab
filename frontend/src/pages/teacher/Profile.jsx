import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { 
  Pencil, Mail, Phone, Building, ChevronDown, 
  Lock, Shield, ChevronRight
} from 'lucide-react'

export default function Profile({ user }) {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [lightTheme, setLightTheme] = useState(true)
  const [profileData, setProfileData] = useState({ name: '', department: '', phone: '' })

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) return
      const d = await getDoc(doc(db, 'users', user.uid))
      if (d.exists()) {
        setProfileData({
          name: d.data().name || 'Unknown Teacher',
          department: d.data().department || 'Computer Science',
          phone: d.data().phone || '+1 (555) 000-0000'
        })
      }
    }
    loadProfile()
  }, [user])

  return (
    <div className='min-h-[calc(100vh-64px)] bg-background text-text-primary p-xl overflow-y-auto relative'>
      
      {/* Header Area */}
      <div className='max-w-[1200px] mx-auto'>
        <div className='flex items-start justify-between mb-8'>
          <div>
            <h1 className='font-headline-lg text-headline-lg text-text-primary tracking-tight mb-2'>
              Profile & Settings
            </h1>
            <p className='font-body-md text-text-secondary'>
              Manage your instructor account and settings.
            </p>
          </div>
        </div>

        {/* Profile Content - Centered */}
        <div className='w-[80%] mx-auto flex flex-col gap-8'>
          
          {/* Profile Card */}
          <div className='bg-white rounded-[24px] overflow-hidden shadow-sm border border-outline-variant/30 flex flex-col'>
            <div className='h-24 bg-[#eef6f0] w-full'></div>
            <div className='px-8 pb-8 flex flex-col items-center -mt-12'>
              <div className='relative mb-4'>
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=0b1f13&color=fff&size=150`} 
                  alt={profileData.name} 
                  className='w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm'
                />
                <button className='absolute bottom-0 right-0 bg-[#2e5939] text-white p-1.5 rounded-full border-2 border-white hover:bg-[#1a3822] transition-colors'>
                  <Pencil size={12} strokeWidth={2.5} />
                </button>
              </div>

              <h2 className='font-headline-md text-[24px] text-text-primary mb-1'>{profileData.name}</h2>
              <p className='font-label-md text-[13px] text-text-secondary tracking-normal mb-5'>
                Instructor, {profileData.department}
              </p>

              <div className='flex items-center gap-2 mb-8'>
                <span className='px-4 py-1.5 bg-[#e3ece5] text-[#386667] font-label-md text-[11px] rounded-full border border-[#dce4de]'>
                  Algorithms
                </span>
                <span className='px-4 py-1.5 bg-[#e3ece5] text-[#386667] font-label-md text-[11px] rounded-full border border-[#dce4de]'>
                  Systems
                </span>
              </div>

              <div className='w-full space-y-5 mb-8'>
                <div>
                  <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>Email</label>
                  <div className='relative'>
                    <Mail size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary' />
                    <input 
                      type="text" 
                      value={user?.email || ''}
                      className='w-full bg-[#f4f4ec] border-none text-text-primary font-body-sm text-[14px] rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2e5939]/20'
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>Phone</label>
                  <div className='relative'>
                    <Phone size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary' />
                    <input 
                      type="text" 
                      defaultValue="+1 (555) 019-8472"
                      className='w-full bg-[#f4f4ec] border-none text-text-primary font-body-sm text-[14px] rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#2e5939]/20'
                    />
                  </div>
                </div>
                <div>
                  <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>Department</label>
                  <div className='relative'>
                    <Building size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary' />
                    <input 
                      type="text" 
                      value={profileData.department}
                      className='w-full bg-[#f4f4ec] border-none text-text-primary font-body-sm text-[14px] rounded-xl pl-11 pr-10 py-3 outline-none cursor-pointer'
                      readOnly
                    />
                    <ChevronDown size={16} className='absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none' />
                  </div>
                </div>
              </div>

              <button className='w-full py-3 bg-white border border-outline-variant/50 rounded-xl font-label-md text-[14px] text-text-primary hover:bg-surface-container transition-colors shadow-sm'>
                Save Profile
              </button>
            </div>
          </div>

          {/* Account Settings Card */}
          <div className='bg-white rounded-[24px] p-8 shadow-sm border border-outline-variant/30 flex flex-col gap-6'>
            <h3 className='font-headline-md text-[20px] text-text-primary'>Account Settings</h3>
            
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-label-md text-[14px] text-text-primary mb-1'>Email Notifications</p>
                  <p className='font-body-sm text-[12px] text-text-secondary'>Updates on student submissions</p>
                </div>
                <button 
                  onClick={() => setEmailNotifs(!emailNotifs)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${emailNotifs ? 'bg-[#2e5939]' : 'bg-outline-variant/50'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${emailNotifs ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-label-md text-[14px] text-text-primary mb-1'>Light Theme Default</p>
                  <p className='font-body-sm text-[12px] text-text-secondary'>Always use light interface</p>
                </div>
                <button 
                  onClick={() => setLightTheme(!lightTheme)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${lightTheme ? 'bg-[#2e5939]' : 'bg-outline-variant/50'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${lightTheme ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <div className='space-y-3 mt-4'>
              <button className='w-full flex items-center justify-between p-4 bg-[#f4f4ec] rounded-xl hover:bg-[#e8e8df] transition-colors'>
                <div className='flex items-center gap-3'>
                  <Lock size={16} className='text-text-secondary' />
                  <span className='font-label-md text-[14px] text-text-primary'>Change Password</span>
                </div>
                <ChevronRight size={16} className='text-text-secondary' />
              </button>
              
              <button className='w-full flex items-center justify-between p-4 bg-[#f4f4ec] rounded-xl hover:bg-[#e8e8df] transition-colors'>
                <div className='flex items-center gap-3'>
                  <Shield size={16} className='text-text-secondary' />
                  <span className='font-label-md text-[14px] text-text-primary'>Security Log</span>
                </div>
                <ChevronRight size={16} className='text-text-secondary' />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

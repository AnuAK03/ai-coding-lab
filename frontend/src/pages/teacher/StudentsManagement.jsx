// frontend/src/pages/teacher/StudentsManagement.jsx
// Students Management page - exact Stitch layout replica

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { MoreVertical, X } from 'lucide-react'

export default function StudentsManagement() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [editingStudent, setEditingStudent] = useState(null)

  useEffect(() => {
    async function loadStudents() {
      try {
        const studentQ = query(collection(db, 'users'), where('role', '==', 'student'))
        const studentSnap = await getDocs(studentQ)
        const studentsData = studentSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setStudents(studentsData)
        if (studentsData.length > 0) {
          setSelectedStudent(studentsData[0])
        }
      } catch (e) {
        console.error('Failed to load students:', e)
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  if (loading) {
    return (
      <div className='flex-1 flex items-center justify-center bg-background'>
        <p className='text-on-surface-variant'>Loading students...</p>
      </div>
    )
  }

  return (
    <div className='flex flex-1 h-[calc(100vh-80px)] overflow-hidden bg-background'>
      {/* Left: Main Table Area */}
      <main className='flex-1 flex flex-col px-8 py-6 overflow-hidden'>
        {/* Page Header & Filters */}
        <div className='mb-4'>
          <h2 className='font-headline-lg text-headline-lg text-text-primary tracking-tight mb-1'>
            Students Directory
          </h2>
          <p className='text-[13px] text-on-surface-variant'>
            Manage enrollment, track progress, and view performance metrics.
          </p>
        </div>

        {/* Filters Row */}
        <div className='flex items-center gap-2 mb-4'>
          <div className='flex items-center bg-surface border border-outline-variant/50 rounded-md px-3 py-1.5 cursor-pointer hover:bg-surface-container transition-colors text-[13px]'>
            <span className='text-on-surface-variant mr-2'>Year:</span>
            <span className='text-text-primary mr-2 font-medium'>All</span>
            <span className='material-symbols-outlined text-[16px] text-on-surface-variant'>expand_more</span>
          </div>
          <div className='flex items-center bg-surface border border-outline-variant/50 rounded-md px-3 py-1.5 cursor-pointer hover:bg-surface-container transition-colors text-[13px]'>
            <span className='text-on-surface-variant mr-2'>Section:</span>
            <span className='text-text-primary mr-2 font-medium'>Alpha</span>
            <span className='material-symbols-outlined text-[16px] text-on-surface-variant'>expand_more</span>
          </div>
          <div className='flex items-center bg-surface border border-outline-variant/50 rounded-md px-3 py-1.5 cursor-pointer hover:bg-surface-container transition-colors text-[13px]'>
            <span className='text-on-surface-variant mr-2'>Level:</span>
            <span className='text-text-primary mr-2 font-medium'>Any</span>
            <span className='material-symbols-outlined text-[16px] text-on-surface-variant'>expand_more</span>
          </div>
          <div className='flex items-center bg-surface border border-outline-variant/50 rounded-md px-3 py-1.5 cursor-pointer hover:bg-surface-container transition-colors text-[13px]'>
            <span className='text-on-surface-variant mr-2'>Status:</span>
            <span className='text-text-primary mr-2 font-medium'>Active</span>
            <span className='material-symbols-outlined text-[16px] text-on-surface-variant'>expand_more</span>
          </div>
          <button className='ml-2 w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant/50 text-on-surface-variant hover:text-text-primary hover:bg-surface-container transition-colors'>
            <span className='material-symbols-outlined text-[18px]'>filter_list</span>
          </button>
          <button className='ml-auto w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant/50 text-on-surface-variant hover:text-text-primary hover:bg-surface-container transition-colors'>
            <span className='text-[14px] font-semibold'>A</span>
          </button>
        </div>

        {/* Table Container - White background, subtle border */}
        <div className='bg-surface border-none flex-1 flex flex-col overflow-hidden'>
          {/* Table Header */}
          <div className='grid grid-cols-12 gap-4 px-6 py-3 mb-2 rounded-xl bg-[#f0f5eb] text-secondary text-[11px] font-bold uppercase tracking-wide shrink-0'>
            <div className='col-span-1'>Roll #</div>
            <div className='col-span-2'>Student Name</div>
            <div className='col-span-2'>Program</div>
            <div className='col-span-2'>Progress</div>
            <div className='col-span-1 text-center'>Rank</div>
            <div className='col-span-2'>Level</div>
            <div className='col-span-1 text-right'>Status</div>
            <div className='col-span-1 text-right'>Actions</div>
          </div>

          {/* Table Body (Scrollable) */}
          <div className='flex-1 overflow-y-auto'>
            {students.map((student, index) => {
              const isSelected = selectedStudent?.id === student.id
              const rollNumber = `24A-${String(index + 1).padStart(2, '0')}`
              const program = student.currentProgram || 'Data Structures'
              const progress = student.progress || 0
              const modules = student.modules || 0
              const rank = student.rank || index + 1
              const level = student.level || (progress > 70 ? 'Advanced' : progress > 40 ? 'Intermediate' : 'Beginner')
              const isActive = student.isActive !== undefined ? student.isActive : true

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-[#f0f5eb]/50 transition-colors cursor-pointer relative ${
                    isSelected ? 'bg-[#f0f5eb]' : ''
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  )}
                  <div className='col-span-1 text-[13px] text-on-surface-variant font-mono'>
                    {rollNumber}
                  </div>
                  
                  <div className='col-span-2 flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-[11px] font-semibold text-on-surface-variant shrink-0'>
                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <span className='text-[13px] text-text-primary font-medium truncate'>
                      {student.name || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className='col-span-2 text-[13px] text-on-surface-variant truncate'>
                    {program}
                  </div>
                  
                  <div className='col-span-2 flex flex-col justify-center gap-0.5'>
                    <div className='flex justify-between text-[10px] text-on-surface-variant'>
                      <span>{modules}/10 Modules</span>
                      <span>{progress}%</span>
                    </div>
                    <div className='h-1 w-full bg-surface-container rounded-full overflow-hidden'>
                      <div 
                        className='h-full bg-accent-indigo rounded-full'
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className='col-span-1 flex justify-center items-center gap-1'>
                    <span className={`material-symbols-outlined text-[14px] ${rank === 1 ? 'text-tertiary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {rank === 1 ? 'stars' : 'military_tech'}
                    </span>
                    <span className='text-[13px] font-mono text-text-primary'>
                      {rank}
                    </span>
                  </div>
                  
                  <div className='col-span-2 flex items-center'>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                      level === 'Advanced' 
                        ? 'bg-[#d0f0f4] text-tertiary'
                        : level === 'Intermediate'
                        ? 'bg-[#e9e6df] text-on-surface-variant'
                        : 'bg-[#cceebf] text-primary'
                    }`}>
                      {level}
                    </span>
                  </div>
                  
                  <div className='col-span-1 flex justify-end items-center'>
                    <div className={`w-2 h-2 rounded-full ${
                      isActive 
                        ? 'bg-primary'
                        : 'bg-error'
                    }`}></div>
                  </div>
                  
                  <div className='col-span-1 flex justify-end pr-2 relative'>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === student.id ? null : student.id);
                      }}
                      className='text-on-surface-variant hover:text-text-primary transition-colors p-1 rounded-md hover:bg-outline-variant/20'
                    >
                      <MoreVertical size={16} strokeWidth={2} />
                    </button>
                    {activeDropdown === student.id && (
                      <div className='absolute right-8 top-0 mt-6 w-36 bg-white border border-outline-variant/30 rounded-xl shadow-lg z-10 py-1 overflow-hidden' onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => {
                            setEditingStudent(student.name || 'Unknown');
                            setActiveDropdown(null);
                          }}
                          className='w-full text-left px-4 py-2 font-body-sm text-[13px] text-text-primary hover:bg-[#f4f4ec] transition-colors'
                        >
                          Edit Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Right: Details Panel */}
      {selectedStudent && (
        <aside className='w-[340px] border-l border-outline-variant/30 bg-surface/80 backdrop-blur-md flex flex-col shrink-0 overflow-y-auto'>
          {/* Panel Header / Profile Mini */}
          <div className='p-lg border-b border-outline-variant/30 bg-surface sticky top-0 z-30'>
            <div className='flex justify-between items-start mb-5'>
              <div className='w-16 h-16 rounded-xl bg-[#d2dce2] flex items-center justify-center'>
                <div className='w-2.5 h-2.5 bg-blue-300 opacity-50 rounded-sm'></div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className='text-on-surface-variant hover:text-text-primary transition-colors'
              >
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>
            
            <h3 className='font-headline-sm text-[18px] font-bold text-text-primary mb-1'>
              {selectedStudent.name || 'Unknown Student'}
            </h3>
            <p className='font-body-sm text-[13px] text-on-surface-variant mb-4'>
              Roll: 24A-01 • Data Structures Cohort
            </p>
            
            <div className='flex gap-2'>
              <button className='flex-1 py-1.5 rounded-md bg-accent-indigo text-surface-container-lowest text-[13px] font-semibold hover:opacity-90 transition-opacity'>
                Message
              </button>
              <button className='px-3 py-1.5 rounded-md border border-outline-variant/70 text-text-secondary text-[13px] font-semibold hover:bg-surface-container transition-colors'>
                View IDE
              </button>
            </div>
          </div>

          {/* Bento Grid Content */}
          <div className='p-md flex flex-col gap-md'>
            {/* Stats Row */}
            <div className='grid grid-cols-2 gap-md'>
              <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30 flex flex-col justify-center items-center text-center group hover:border-accent-indigo/50 transition-colors'>
                <span className='material-symbols-outlined text-accent-indigo mb-1 text-[22px]' style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                <span className='font-headline-md text-[20px] font-bold text-text-primary tracking-tight group-hover:scale-105 transition-transform'>
                  14 Days
                </span>
                <span className='font-label-md text-[10px] text-on-surface-variant/70 uppercase'>
                  Current Streak
                </span>
              </div>
              
              <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30 flex flex-col justify-center items-center text-center'>
                <span className='material-symbols-outlined text-tertiary mb-1 text-[22px]'>
                  calendar_month
                </span>
                <span className='font-headline-md text-[20px] font-bold text-text-primary tracking-tight'>
                  96%
                </span>
                <span className='font-label-md text-[10px] text-on-surface-variant/70 uppercase'>
                  Attendance
                </span>
              </div>
            </div>

            {/* Weak Concepts */}
            <div className='bg-[#fbf2f0] rounded-2xl p-3 relative overflow-hidden mt-1'>
              <h4 className='font-label-md text-[11px] text-text-secondary uppercase mb-2 flex items-center gap-1.5'>
                <span className='material-symbols-outlined text-[14px] text-error'>warning</span>
                Needs Attention
              </h4>
              <div className='flex flex-wrap gap-2 relative z-10'>
                <span className='px-2.5 py-0.5 rounded-full bg-[#fae4e1] text-[#b04040] border border-[#f0c4c1] font-body-sm text-[11px]'>
                  Red-Black Trees
                </span>
                <span className='px-2.5 py-0.5 rounded-full bg-[#fae4e1] text-[#b04040] border border-[#f0c4c1] font-body-sm text-[11px]'>
                  Graph Traversal
                </span>
              </div>
            </div>

            {/* Badges / Achievements */}
            <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30'>
              <div className='flex justify-between items-center mb-2'>
                <h4 className='font-label-md text-[11px] text-text-secondary uppercase'>
                  Recent Badges
                </h4>
                <span className='font-label-md text-[11px] text-accent-indigo cursor-pointer hover:underline'>
                  View All
                </span>
              </div>
              <div className='flex gap-3'>
                <div className='flex flex-col items-center gap-1 group'>
                  <div className='w-10 h-10 rounded-full bg-tertiary-container border border-tertiary/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(56,102,103,0.3)]'>
                    <span className='material-symbols-outlined text-tertiary text-[20px]'>bug_report</span>
                  </div>
                  <span className='font-label-md text-[9px] text-on-surface-variant text-center'>
                    Bug Smasher
                  </span>
                </div>
                <div className='flex flex-col items-center gap-1 group'>
                  <div className='w-10 h-10 rounded-full bg-primary-container border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform'>
                    <span className='material-symbols-outlined text-primary text-[20px]'>speed</span>
                  </div>
                  <span className='font-label-md text-[9px] text-on-surface-variant text-center'>
                    Optimizer
                  </span>
                </div>
              </div>
            </div>

            {/* Instructor Notes */}
            <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30 flex-1 flex flex-col'>
              <div className='flex justify-between items-center mb-2'>
                <h4 className='font-label-md text-[11px] text-text-secondary uppercase flex items-center gap-1.5'>
                  <span className='material-symbols-outlined text-[14px]'>edit_note</span>
                  Private Notes
                </h4>
                <button className='text-on-surface-variant hover:text-text-primary'>
                  <span className='material-symbols-outlined text-[16px]'>add</span>
                </button>
              </div>
              <div className='bg-background/80 rounded-lg p-2.5 border border-outline-variant/30 flex-1'>
                <p className='font-body-sm text-[12px] text-text-secondary/90 leading-relaxed italic'>
                  "{selectedStudent.name} is performing exceptionally well in core logic but struggles slightly with visualizing non-linear data structures. Scheduled a brief 1:1 for Thursday to review Red-Black tree rebalancing."
                </p>
                <p className='font-label-md text-[9px] text-on-surface-variant/70 mt-1.5 text-right'>
                  Added Oct 24, 09:15 AM
                </p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Edit Profile Modal */}
      {editingStudent && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm'>
          <div className='bg-white rounded-3xl p-6 w-[400px] shadow-xl border border-outline-variant/30'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='font-headline-md text-xl text-text-primary'>Edit Profile</h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className='text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-surface-container transition-colors'
              >
                <X size={20} />
              </button>
            </div>
            
            <div className='space-y-4 mb-6'>
              <div>
                <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>Student Name</label>
                <input 
                  type="text" 
                  defaultValue={editingStudent}
                  className='w-full bg-[#f4f4ec] border border-transparent text-text-primary font-body-sm text-[13px] rounded-xl px-4 py-2.5 outline-none focus:border-[#2e5939]/30 focus:bg-white transition-colors'
                />
              </div>
              <div>
                <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>Section</label>
                <select className='w-full bg-[#f4f4ec] border border-transparent text-text-primary font-body-sm text-[13px] rounded-xl px-4 py-2.5 outline-none focus:border-[#2e5939]/30 focus:bg-white transition-colors cursor-pointer appearance-none'>
                  <option>A1</option>
                  <option>A2</option>
                  <option>B1</option>
                  <option>B2</option>
                </select>
              </div>
              <div>
                <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>Program</label>
                <select className='w-full bg-[#f4f4ec] border border-transparent text-text-primary font-body-sm text-[13px] rounded-xl px-4 py-2.5 outline-none focus:border-[#2e5939]/30 focus:bg-white transition-colors cursor-pointer appearance-none'>
                  <option>B.Sc CS</option>
                  <option>M.Sc DE</option>
                  <option>B.Sc IT</option>
                </select>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <button 
                onClick={() => setEditingStudent(null)}
                className='px-5 py-2.5 bg-[#f4f4ec] rounded-xl font-label-md text-[13px] text-text-primary hover:bg-[#e8e8df] transition-colors'
              >
                Cancel
              </button>
              <button 
                onClick={() => setEditingStudent(null)}
                className='px-5 py-2.5 bg-[#2e5939] text-white rounded-xl font-label-md text-[13px] hover:bg-[#1a3822] transition-colors shadow-sm'
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

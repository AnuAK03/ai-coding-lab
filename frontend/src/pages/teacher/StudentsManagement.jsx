// frontend/src/pages/teacher/StudentsManagement.jsx
// Students Management page - Real-time student progress tracking

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { MoreVertical, X, RefreshCw, Activity, Clock, AlertTriangle } from 'lucide-react'

export default function StudentsManagement() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [editingStudent, setEditingStudent] = useState(null)
  const [programs, setPrograms] = useState({})
  const [recentSessions, setRecentSessions] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Real-time data fetching
  useEffect(() => {
    let unsubscribeStudents = null
    let unsubscribeSessions = null
    let unsubscribePrograms = null

    async function setupRealTimeListeners() {
      try {
        // Real-time students listener
        const studentQuery = query(
          collection(db, 'users'), 
          where('role', '==', 'student')
        )
        
        unsubscribeStudents = onSnapshot(studentQuery, (snapshot) => {
          const studentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          // Sort by performance (avg score + streak bonus)
          studentsData.sort((a, b) => {
            const scoreA = (a.avgScore || 0) + (a.streak || 0) * 0.5
            const scoreB = (b.avgScore || 0) + (b.streak || 0) * 0.5
            return scoreB - scoreA
          })
          
          setStudents(studentsData)
          if (studentsData.length > 0 && !selectedStudent) {
            setSelectedStudent(studentsData[0])
          }
          setLastUpdate(new Date())
        })

        // Real-time programs listener
        unsubscribePrograms = onSnapshot(collection(db, 'programs'), (snapshot) => {
          const programsMap = {}
          snapshot.docs.forEach(doc => {
            programsMap[doc.id] = { id: doc.id, ...doc.data() }
          })
          setPrograms(programsMap)
        })

        // Real-time sessions listener (for current activities)
        const sessionsQuery = query(
          collection(db, 'sessions'),
          orderBy('startedAt', 'desc'),
          limit(100)
        )
        
        unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
          const sessionsMap = {}
          snapshot.docs.forEach(doc => {
            const data = doc.data()
            const studentId = data.studentId
            
            if (!sessionsMap[studentId] || 
                (data.startedAt && (!sessionsMap[studentId].startedAt || 
                data.startedAt.toDate() > sessionsMap[studentId].startedAt.toDate()))) {
              sessionsMap[studentId] = {
                id: doc.id,
                ...data,
                startedAt: data.startedAt ? data.startedAt.toDate() : null
              }
            }
          })
          setRecentSessions(sessionsMap)
        })

        setLoading(false)
      } catch (error) {
        console.error('Failed to setup real-time listeners:', error)
        setLoading(false)
      }
    }

    setupRealTimeListeners()

    // Cleanup function
    return () => {
      if (unsubscribeStudents) unsubscribeStudents()
      if (unsubscribeSessions) unsubscribeSessions()
      if (unsubscribePrograms) unsubscribePrograms()
    }
  }, [selectedStudent])

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // The real-time listeners will automatically update the data
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdate(new Date())
    }, 1000)
  }

  // Get student's current program and progress
  const getStudentProgress = (student) => {
    const recentSession = recentSessions[student.id]
    if (!recentSession) {
      return {
        programTitle: 'No Activity',
        progress: 0,
        modules: 0,
        status: 'inactive',
        lastActivity: null
      }
    }

    const program = programs[recentSession.programId]
    const programTitle = program?.title || 'Unknown Program'
    
    // Calculate progress based on completed sessions and scores
    const avgScore = student.avgScore || 0
    const progress = Math.round(avgScore * 100)
    const modules = Math.min(Math.round((avgScore * 10)), 10)
    
    // Determine status
    let status = 'active'
    if (recentSession.status === 'in_progress') {
      status = 'coding'
    } else if (recentSession.startedAt) {
      const hoursSinceActivity = (new Date() - recentSession.startedAt) / (1000 * 60 * 60)
      if (hoursSinceActivity > 24) {
        status = 'inactive'
      }
    }

    return {
      programTitle,
      progress,
      modules,
      status,
      lastActivity: recentSession.startedAt,
      quizScore: recentSession.quizScore,
      hintsUsed: recentSession.hintsUsed,
      violations: recentSession.violations?.length || 0,
      flagged: recentSession.flagged
    }
  }

  // Get status color and indicator
  const getStatusDisplay = (status, flagged = false) => {
    if (flagged) {
      return {
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        indicator: '⚠️',
        label: 'Flagged'
      }
    }
    
    switch (status) {
      case 'coding':
        return {
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          indicator: '💻',
          label: 'Coding'
        }
      case 'active':
        return {
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          indicator: '🟢',
          label: 'Active'
        }
      case 'inactive':
        return {
          color: 'text-gray-500',
          bg: 'bg-gray-500/10',
          indicator: '⚪',
          label: 'Idle'
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          indicator: '⚫',
          label: 'No Data'
        }
    }
  }

  // Format time ago helper
  const formatTimeAgo = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

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
          <div className='flex justify-between items-start mb-1'>
            <div>
              <h2 className='font-headline-lg text-headline-lg text-text-primary tracking-tight'>
                Students Directory
              </h2>
              <p className='text-[13px] text-on-surface-variant'>
                Real-time student progress, active programming sessions, and performance metrics.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className='flex items-center gap-1 px-3 py-1.5 text-[12px] bg-surface-container border border-outline-variant/50 rounded-lg hover:bg-surface-container-highest transition-colors disabled:opacity-50'
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {lastUpdate && (
                <span className='text-[11px] text-on-surface-variant'>
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
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
            <div className='col-span-2'>Current Program</div>
            <div className='col-span-2'>Progress</div>
            <div className='col-span-1 text-center'>Rank</div>
            <div className='col-span-2'>Activity Status</div>
            <div className='col-span-1 text-right'>Live Status</div>
            <div className='col-span-1 text-right'>Actions</div>
          </div>

          {/* Table Body (Scrollable) */}
          <div className='flex-1 overflow-y-auto'>
            {students.map((student, index) => {
              const isSelected = selectedStudent?.id === student.id
              const rollNumber = student.rollNumber || `CS${String(index + 1).padStart(3, '0')}`
              const progressData = getStudentProgress(student)
              const rank = index + 1
              const statusDisplay = getStatusDisplay(progressData.status, progressData.flagged)

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
                  
                  {/* Roll Number */}
                  <div className='col-span-1 text-[13px] text-on-surface-variant font-mono'>
                    {rollNumber}
                  </div>
                  
                  {/* Student Name with Avatar and Streak */}
                  <div className='col-span-2 flex items-center gap-2'>
                    <div className='w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-[11px] font-semibold text-on-surface-variant shrink-0'>
                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-[13px] text-text-primary font-medium truncate'>
                        {student.name || 'Unknown'}
                      </span>
                      {student.streak > 0 && (
                        <div className='flex items-center gap-1'>
                          <span className='text-[10px] text-orange-500'>🔥</span>
                          <span className='text-[10px] text-on-surface-variant'>{student.streak} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Current Program */}
                  <div className='col-span-2'>
                    <div className='text-[13px] text-text-primary font-medium truncate'>
                      {progressData.programTitle}
                    </div>
                    {progressData.lastActivity && (
                      <div className='text-[10px] text-on-surface-variant'>
                        {formatTimeAgo(progressData.lastActivity)}
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className='col-span-2 flex flex-col justify-center gap-0.5'>
                    <div className='flex justify-between text-[10px] text-on-surface-variant'>
                      <span>{progressData.modules}/10 Modules</span>
                      <span>{progressData.progress}%</span>
                    </div>
                    <div className='h-1 w-full bg-surface-container rounded-full overflow-hidden'>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressData.progress >= 80 ? 'bg-green-500' :
                          progressData.progress >= 60 ? 'bg-yellow-500' :
                          progressData.progress >= 40 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${progressData.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Rank */}
                  <div className='col-span-1 flex justify-center items-center gap-1'>
                    <span className={`material-symbols-outlined text-[14px] ${
                      rank <= 3 ? 'text-tertiary' : 'text-on-surface-variant'
                    }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {rank === 1 ? 'emoji_events' : rank <= 3 ? 'stars' : 'military_tech'}
                    </span>
                    <span className='text-[13px] font-mono text-text-primary'>
                      {rank}
                    </span>
                  </div>
                  
                  {/* Activity Status */}
                  <div className='col-span-2'>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                      <span>{statusDisplay.indicator}</span>
                      <span>{statusDisplay.label}</span>
                    </div>
                    {progressData.violations > 0 && (
                      <div className='flex items-center gap-1 mt-1'>
                        <AlertTriangle className='h-3 w-3 text-red-500' />
                        <span className='text-[10px] text-red-500'>{progressData.violations} violations</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Live Status Indicator */}
                  <div className='col-span-1 flex justify-end'>
                    <div className={`w-2 h-2 rounded-full ${
                      progressData.status === 'coding' ? 'bg-green-500 animate-pulse' :
                      progressData.status === 'active' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  {/* Actions */}
                  <div className='col-span-1 flex justify-end'>
                    <div className='relative'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDropdown(activeDropdown === student.id ? null : student.id)
                        }}
                        className='p-1 rounded-md hover:bg-surface-container transition-colors'
                      >
                        <MoreVertical className='w-4 h-4 text-on-surface-variant' />
                      </button>
                      
                      {activeDropdown === student.id && (
                        <div className='absolute right-0 top-full mt-1 w-40 bg-surface border border-outline-variant rounded-lg shadow-lg z-50'>
                          <button 
                            onClick={() => {
                              console.log('View details for:', student.name)
                              setActiveDropdown(null)
                            }}
                            className='w-full text-left px-4 py-2 font-body-sm text-[13px] text-text-primary hover:bg-[#f4f4ec] transition-colors rounded-t-lg'
                          >
                            View Timeline
                          </button>
                          <button 
                            onClick={() => {
                              console.log('Message student:', student.name)
                              setActiveDropdown(null)
                            }}
                            className='w-full text-left px-4 py-2 font-body-sm text-[13px] text-text-primary hover:bg-[#f4f4ec] transition-colors'
                          >
                            Send Message
                          </button>
                          <button 
                            onClick={() => {
                              setEditingStudent(student.name || 'Unknown')
                              setActiveDropdown(null)
                            }}
                            className='w-full text-left px-4 py-2 font-body-sm text-[13px] text-text-primary hover:bg-[#f4f4ec] transition-colors rounded-b-lg'
                          >
                            Edit Profile
                          </button>
                        </div>
                      )}
                    </div>
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
          {(() => {
            const progressData = getStudentProgress(selectedStudent)
            const statusDisplay = getStatusDisplay(progressData.status, progressData.flagged)
            const rollNumber = selectedStudent.rollNumber || 'CS000'
            const classId = selectedStudent.classId || 'Not Assigned'
            
            return (
              <>
                {/* Panel Header / Profile Mini */}
                <div className='p-lg border-b border-outline-variant/30 bg-surface sticky top-0 z-30'>
                  <div className='flex justify-between items-start mb-5'>
                    <div className='w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold'>
                      {selectedStudent.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className='text-on-surface-variant hover:text-text-primary transition-colors'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  </div>
                  
                  <h3 className='font-headline-sm text-[18px] font-bold text-text-primary mb-1'>
                    {selectedStudent.name || 'Unknown Student'}
                  </h3>
                  <p className='font-body-sm text-[13px] text-on-surface-variant mb-2'>
                    Roll: {rollNumber} • {classId}
                  </p>
                  
                  {/* Real-time Status */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium mb-4 ${statusDisplay.bg} ${statusDisplay.color}`}>
                    <span>{statusDisplay.indicator}</span>
                    <span>{statusDisplay.label}</span>
                    {progressData.status === 'coding' && (
                      <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                    )}
                  </div>
                  
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
                        {selectedStudent.streak || 0} Days
                      </span>
                      <span className='font-label-md text-[10px] text-on-surface-variant/70 uppercase'>
                        Current Streak
                      </span>
                    </div>
                    
                    <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30 flex flex-col justify-center items-center text-center'>
                      <span className='material-symbols-outlined text-tertiary mb-1 text-[22px]'>
                        quiz
                      </span>
                      <span className='font-headline-md text-[20px] font-bold text-text-primary tracking-tight'>
                        {Math.round((selectedStudent.avgScore || 0) * 100)}%
                      </span>
                      <span className='font-label-md text-[10px] text-on-surface-variant/70 uppercase'>
                        Avg Score
                      </span>
                    </div>
                  </div>

                  {/* Current Program Status */}
                  <div className='bg-surface-container rounded-2xl p-4 border border-outline-variant/30'>
                    <h4 className='font-label-md text-[11px] text-text-secondary uppercase mb-3 flex items-center gap-1.5'>
                      <Activity className='w-3 h-3' />
                      Current Activity
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-start'>
                        <span className='font-medium text-[14px] text-text-primary'>
                          {progressData.programTitle}
                        </span>
                        <span className='text-[12px] text-on-surface-variant'>
                          {progressData.progress}%
                        </span>
                      </div>
                      <div className='h-1.5 w-full bg-surface-container rounded-full overflow-hidden'>
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            progressData.progress >= 80 ? 'bg-green-500' :
                            progressData.progress >= 60 ? 'bg-yellow-500' :
                            progressData.progress >= 40 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${progressData.progress}%` }}
                        ></div>
                      </div>
                      {progressData.lastActivity && (
                        <p className='text-[11px] text-on-surface-variant'>
                          Last activity: {formatTimeAgo(progressData.lastActivity)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  {progressData.violations > 0 && (
                    <div className='bg-red-50 rounded-2xl p-3 border border-red-200'>
                      <h4 className='font-label-md text-[11px] text-red-600 uppercase mb-2 flex items-center gap-1.5'>
                        <AlertTriangle className='w-3 h-3' />
                        Integrity Alerts
                      </h4>
                      <div className='flex items-center justify-between'>
                        <span className='text-[12px] text-red-700'>
                          {progressData.violations} violation(s) detected
                        </span>
                        {progressData.flagged && (
                          <span className='px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium'>
                            FLAGGED
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Performance */}
                  {progressData.quizScore !== undefined && (
                    <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30'>
                      <h4 className='font-label-md text-[11px] text-text-secondary uppercase mb-2'>
                        Latest Session
                      </h4>
                      <div className='grid grid-cols-2 gap-2 text-center'>
                        <div>
                          <div className='font-medium text-[14px] text-text-primary'>
                            {progressData.quizScore || 0}%
                          </div>
                          <div className='text-[10px] text-on-surface-variant'>Quiz Score</div>
                        </div>
                        <div>
                          <div className='font-medium text-[14px] text-text-primary'>
                            {progressData.hintsUsed || 0}
                          </div>
                          <div className='text-[10px] text-on-surface-variant'>Hints Used</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className='bg-surface-container rounded-2xl p-3 border border-outline-variant/30'>
                    <h4 className='font-label-md text-[11px] text-text-secondary uppercase mb-2'>
                      Achievements
                    </h4>
                    <div className='flex flex-wrap gap-1'>
                      {(selectedStudent.badges || []).length > 0 ? (
                        selectedStudent.badges.map((badge, index) => (
                          <span key={index} className='px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium'>
                            {badge}
                          </span>
                        ))
                      ) : (
                        <span className='text-[11px] text-on-surface-variant italic'>No badges earned yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
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

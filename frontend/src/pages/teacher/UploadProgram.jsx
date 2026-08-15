// frontend/src/pages/teacher/UploadProgram.jsx
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { db } from '../../services/firebase'
import { getProgramSubmissionsReport, generateProgramReport } from '../../services/api'
import { 
  Plus, Trash2, ChevronLeft, Upload, CheckCircle2, AlertTriangle, 
  TrendingUp, Brain, Clock, RefreshCw, FileText, ChevronDown, 
  ChevronUp, UserCheck, UserX, Send, X, Code2, Eye
} from 'lucide-react'

const SUBJECTS    = ['Python Basics', 'Data Structures', 'Algorithms', 'OOP Concepts']
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical']
const YEARS       = [1, 2, 3, 4]

function buildClassId(department, year, section) {
  const deptCode = department.split(' ').map(w => w[0]).join('').toUpperCase()
  return `${deptCode}-${year}-${section}`
}

const TIER_STYLE = {
  excellent:       'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/10 dark:text-green-400',
  satisfactory:    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400',
  needs_attention: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/10 dark:text-red-400',
}

const TIER_LABEL = {
  excellent:       'Excellent',
  satisfactory:    'Satisfactory',
  needs_attention: 'Poor',
}

export default function UploadProgram() {
  const navigate = useNavigate()
  const { theme } = useOutletContext()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [filterPill, setFilterPill] = useState('all') // 'all' | 'completed' | 'pending'

  // Form state
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [subject,     setSubject]     = useState(SUBJECTS[0])
  const [difficulty,  setDifficulty]  = useState('easy')
  const [concepts,    setConcepts]    = useState('')
  const [starterCode, setStarterCode] = useState('')
  const [department,  setDepartment]  = useState(DEPARTMENTS[0])
  const [year,        setYear]        = useState(YEARS[0])
  const [section,     setSection]     = useState('A')
  const [hintLimit,   setHintLimit]   = useState(3)
  const [testCases,   setTestCases]   = useState([
    { label: 'Basic case', input: '', expectedOutput: '' }
  ])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Dashboard state
  const [programs, setPrograms] = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [programReports, setProgramReports] = useState({}) // { [programId]: reportData }
  const [loadingProgramReports, setLoadingProgramReports] = useState({})
  const [expandedProgramId, setExpandedProgramId] = useState(null)

  // DICE Model Student Report Modal state
  const [selectedStudentReport, setSelectedStudentReport] = useState(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  // Load programs & overview stats
  useEffect(() => {
    async function loadProgramsData() {
      setLoadingPrograms(true)
      try {
        const progSnap = await getDocs(collection(db, 'programs'))
        let fetched = progSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        // Fallback default programs if Firestore is empty
        if (fetched.length === 0) {
          fetched = [
            {
              id: 'ds_algo_1',
              title: 'Data Structures & Algorithms',
              code: 'CSE821',
              subject: 'Data Structures',
              classId: 'CS-2-A',
              startDate: 'Oct 12, 2023',
              language: 'Python',
              progressPct: 68,
              active: true
            },
            {
              id: 'react_patterns_1',
              title: 'Advanced React Patterns',
              code: 'WEB405',
              subject: 'Web Architecture',
              classId: 'CS-3-A',
              startDate: 'Nov 01, 2023',
              language: 'JavaScript',
              progressPct: 85,
              active: true
            }
          ]
        }

        setPrograms(fetched)

        // Preload submission reports for each program
        for (const prog of fetched) {
          fetchProgramReport(prog.id)
        }
      } catch (err) {
        console.error('Error loading programs:', err)
      } finally {
        setLoadingPrograms(false)
      }
    }

    if (activeTab === 'dashboard') {
      loadProgramsData()
    }
  }, [activeTab])

  // Fetch report & student list for a program
  async function fetchProgramReport(programId) {
    setLoadingProgramReports(prev => ({ ...prev, [programId]: true }))
    try {
      const data = await getProgramSubmissionsReport(programId)
      setProgramReports(prev => ({ ...prev, [programId]: data }))
    } catch (err) {
      console.warn(`Report fetch failed for ${programId}:`, err)
    } finally {
      setLoadingProgramReports(prev => ({ ...prev, [programId]: false }))
    }
  }

  function toggleExpandProgram(programId) {
    if (expandedProgramId === programId) {
      setExpandedProgramId(null)
    } else {
      setExpandedProgramId(programId)
      if (!programReports[programId]) {
        fetchProgramReport(programId)
      }
    }
  }

  function handleViewStudentReport(studentSubmission) {
    setSelectedStudentReport(studentSubmission)
    setReportModalOpen(true)
  }

  function updateTestCase(index, field, value) {
    setTestCases(prev => prev.map((tc, i) =>
      i === index ? { ...tc, [field]: value } : tc
    ))
  }

  function addTestCase() {
    setTestCases(prev => [
      ...prev,
      { label: `Test ${prev.length + 1}`, input: '', expectedOutput: '' }
    ])
  }

  function removeTestCase(index) {
    if (testCases.length === 1) return
    setTestCases(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title || !description) {
      setError('Title and description are required.')
      return
    }
    const incompleteTest = testCases.some(tc => !tc.expectedOutput.trim())
    if (incompleteTest) {
      setError('Every test case needs an expected output.')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'programs'), {
        title,
        description,
        subject,
        language:    'python',
        difficulty,
        concepts:    concepts.split(',').map(c => c.trim()).filter(Boolean),
        hintLimit:   Number(hintLimit),
        active:      true,
        starterCode: starterCode || '# your code here',
        classId:     buildClassId(department, year, section),
        testCases,
        createdAt:   new Date().toISOString()
      })

      setActiveTab('dashboard')
    } catch (err) {
      setError('Failed to save program. ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Filter programs by status
  const visiblePrograms = programs.filter(prog => {
    const report = programReports[prog.id]
    const subRate = report?.summary?.submissionRate || prog.progressPct || 0
    if (filterPill === 'completed') return subRate >= 80
    if (filterPill === 'pending') return subRate < 80
    return true
  })

  return (
    <div className='min-h-[calc(100vh-64px)] bg-background text-text-primary p-xl transition-colors duration-300'>
      
      {/* Top Header & Tabs */}
      <div className='flex items-center justify-between mb-8 max-w-7xl mx-auto'>
        <div>
          <h1 className='font-headline-lg text-headline-lg text-text-primary tracking-tight mb-2'>
            {activeTab === 'dashboard' ? 'Programs Management' : 'Upload Program'}
          </h1>
          <p className='font-body-md text-text-secondary'>
            {activeTab === 'dashboard' 
              ? 'Monitor curriculum progress, student engagement, and module completions.' 
              : 'Programs are visible only to students in the selected class.'}
          </p>
        </div>

        <div className='flex items-center gap-1 bg-surface-container/50 rounded-full p-1 border border-outline-variant/30'>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 rounded-full font-label-md text-[13px] transition-all ${
              activeTab === 'dashboard'
                ? 'bg-surface shadow-sm text-text-primary font-bold'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2 rounded-full font-label-md text-[13px] transition-all ${
              activeTab === 'upload'
                ? 'bg-surface shadow-sm text-text-primary font-bold'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Create New
          </button>
        </div>
      </div>

      <div className={activeTab === 'upload' ? 'max-w-3xl mx-auto' : 'max-w-7xl mx-auto'}>
        
        {/* ───────────────────────────────────────────────────────────── */}
        {/* CREATE NEW PROGRAM TAB */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1 text-sm mb-6 transition-colors`}
              style={{ color: theme === 'dark' ? '#A5B4FC' : '#6366F1' }}
            >
              <ChevronLeft size={16} strokeWidth={2} /> Back to Dashboard
            </button>

            {error && (
              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6'>
                <p className='text-sm text-red-400'>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Basic info */}
              <div className='bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm'>
                <div className='space-y-4'>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Title
                    </label>
                    <input
                      value={title} onChange={e => setTitle(e.target.value)}
                      placeholder='Fibonacci Series'
                      className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Description / Task
                    </label>
                    <textarea
                      value={description} onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder='Print the Fibonacci series up to N terms.'
                      className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                        Subject
                      </label>
                      <select
                        value={subject} onChange={e => setSubject(e.target.value)}
                        className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                      >
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                        Difficulty
                      </label>
                      <select
                        value={difficulty} onChange={e => setDifficulty(e.target.value)}
                        className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                      >
                        {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Concepts (comma-separated)
                    </label>
                    <input
                      value={concepts} onChange={e => setConcepts(e.target.value)}
                      placeholder='loops, recursion'
                      className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Starter Code (optional)
                    </label>
                    <textarea
                      value={starterCode} onChange={e => setStarterCode(e.target.value)}
                      rows={3}
                      placeholder='n = int(input())'
                      className='w-full border border-outline-variant/30 bg-[#f4f4ec] rounded-xl px-4 py-2.5 text-[13px] font-mono text-text-primary focus:outline-none focus:border-primary transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Hint Limit
                    </label>
                    <input
                      type='number' min={0} max={5}
                      value={hintLimit} onChange={e => setHintLimit(e.target.value)}
                      className='w-24 border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    />
                  </div>
                </div>
              </div>

              {/* Target class */}
              <div className='bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm'>
                <h3 className='font-headline-sm text-lg text-text-primary mb-4'>Target Class</h3>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Department
                    </label>
                    <select
                      value={department} onChange={e => setDepartment(e.target.value)}
                      className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Year
                    </label>
                    <select
                      value={year} onChange={e => setYear(Number(e.target.value))}
                      className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    >
                      {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                      Section
                    </label>
                    <input
                      value={section} onChange={e => setSection(e.target.value.toUpperCase())}
                      maxLength={2}
                      className='w-full border border-outline-variant/30 bg-background rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors'
                    />
                  </div>
                </div>
                <p className='text-[12px] text-text-secondary mt-3'>
                  Resulting class ID: <span className='font-mono font-bold bg-surface-container px-1.5 py-0.5 rounded'>{buildClassId(department, year, section)}</span>
                </p>
              </div>

              {/* Test cases */}
              <div className='bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-headline-sm text-lg text-text-primary'>Test Cases</h3>
                  <button
                    type='button' onClick={addTestCase}
                    className='flex items-center gap-1 font-label-md text-[12px] text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors border border-outline-variant/30'
                  >
                    <Plus size={14} strokeWidth={2} /> Add Test
                  </button>
                </div>

                <div className='space-y-4'>
                  {testCases.map((tc, i) => (
                    <div key={i} className='border border-outline-variant/30 rounded-2xl p-4 bg-background'>
                      <div className='flex items-center justify-between mb-3'>
                        <input
                          value={tc.label}
                          onChange={e => updateTestCase(i, 'label', e.target.value)}
                          placeholder={`Test ${i + 1} label`}
                          className='font-headline-sm text-[14px] text-text-primary bg-transparent border-none focus:outline-none flex-1'
                        />
                        {testCases.length > 1 && (
                          <button
                            type='button' onClick={() => removeTestCase(i)}
                            className='text-text-secondary hover:text-error transition-colors p-1'
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                            Input (stdin)
                          </label>
                          <textarea
                            value={tc.input}
                            onChange={e => updateTestCase(i, 'input', e.target.value)}
                            rows={2}
                            className='w-full border border-outline-variant/30 bg-[#f4f4ec] rounded-xl px-3 py-2 text-[12px] font-mono text-text-primary focus:outline-none focus:border-primary'
                          />
                        </div>
                        <div>
                          <label className='block font-label-md text-[11px] text-text-secondary uppercase mb-1.5'>
                            Expected Output
                          </label>
                          <textarea
                            value={tc.expectedOutput}
                            onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)}
                            rows={2}
                            className='w-full border border-outline-variant/30 bg-[#f4f4ec] rounded-xl px-3 py-2 text-[12px] font-mono text-text-primary focus:outline-none focus:border-primary'
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type='submit' disabled={saving}
                className='w-full bg-primary text-white font-label-md text-[14px] py-3 rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {saving ? 'Publishing...' : (
                  <>
                    <Upload size={16} strokeWidth={2} /> Publish Program
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* DASHBOARD TAB - PRESERVED STITCH UI LAYOUT */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className='flex flex-col gap-6'>
            {/* Filter Pills */}
            <div className='flex gap-2 mb-2'>
              <button 
                onClick={() => setFilterPill('all')}
                className={`px-4 py-1.5 rounded-md font-label-md text-[12px] transition-colors ${
                  filterPill === 'all'
                    ? 'bg-[#e7e7e5] text-text-primary font-bold shadow-sm'
                    : 'text-text-secondary hover:bg-surface-container'
                }`}
              >
                All Programs
              </button>
              <button 
                onClick={() => setFilterPill('completed')}
                className={`px-4 py-1.5 rounded-md font-label-md text-[12px] transition-colors ${
                  filterPill === 'completed'
                    ? 'bg-[#e7e7e5] text-text-primary font-bold shadow-sm'
                    : 'text-text-secondary hover:bg-surface-container'
                }`}
              >
                Completed
              </button>
              <button 
                onClick={() => setFilterPill('pending')}
                className={`px-4 py-1.5 rounded-md font-label-md text-[12px] border border-outline-variant/30 flex items-center gap-2 transition-colors ${
                  filterPill === 'pending'
                    ? 'bg-surface text-text-primary font-bold'
                    : 'bg-surface text-text-secondary hover:bg-surface-container'
                }`}
              >
                Pending <span className='w-1.5 h-1.5 rounded-full bg-error'></span>
              </button>
            </div>

            <div className='grid grid-cols-12 gap-8 items-start'>
              
              {/* ── Left Column - Programs (Col 8) ────────────────────────── */}
              <div className='col-span-12 lg:col-span-8 flex flex-col gap-6'>
                
                {loadingPrograms ? (
                  <div className='p-8 text-center text-text-secondary bg-surface rounded-3xl border border-outline-variant/30'>
                    <RefreshCw size={24} className='animate-spin mx-auto mb-2 text-primary' />
                    Loading curriculum programs...
                  </div>
                ) : visiblePrograms.map((prog, idx) => {
                  const rData = programReports[prog.id]
                  const submittedCount = rData?.summary?.submittedCount ?? (idx === 0 ? 68 : 38)
                  const totalCount = rData?.summary?.totalStudents ?? 100
                  const notSubmittedCount = rData?.summary?.notSubmittedCount ?? (totalCount - submittedCount)
                  const subRate = rData?.summary?.submissionRate ?? Math.round((submittedCount / totalCount) * 100)
                  const isExpanded = expandedProgramId === prog.id

                  // Combine submitted & pending list for reference table format
                  const submittedList = rData?.submittedStudents || []
                  const notSubmittedList = rData?.notSubmittedStudents || []

                  return (
                    <div 
                      key={prog.id} 
                      className='bg-surface rounded-3xl p-6 border border-outline-variant/30 relative overflow-hidden shadow-sm transition-all'
                    >
                      {/* Top Red Glow Accent on action required */}
                      {subRate < 70 && (
                        <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fae4e1] to-transparent'></div>
                      )}
                      
                      {/* Badges Header */}
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex gap-2 items-center'>
                          <span className='px-2.5 py-1 rounded bg-surface-container text-text-secondary font-label-md text-[10px] tracking-wider uppercase border border-outline-variant/30'>
                            {prog.code || prog.classId || 'CSE821'}
                          </span>
                          {subRate < 70 ? (
                            <span className='px-2.5 py-1 rounded bg-[#fae4e1] text-[#b04040] font-label-md text-[10px] tracking-wider uppercase flex items-center gap-1 border border-[#f0c4c1]'>
                              <span className='material-symbols-outlined text-[12px]'>warning</span>
                              Action Required
                            </span>
                          ) : (
                            <span className='px-2.5 py-1 rounded bg-[#d0e1d4] text-[#386667] font-label-md text-[10px] tracking-wider uppercase border border-[#b8d2be]'>
                              On Track
                            </span>
                          )}
                        </div>

                        <button 
                          onClick={() => toggleExpandProgram(prog.id)}
                          className='text-xs font-semibold text-primary flex items-center gap-1 hover:underline'
                        >
                          {isExpanded ? 'Hide Submissions Table' : 'View Submissions Table'}
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className='font-headline-md text-2xl text-text-primary mb-4'>
                        {prog.title}
                      </h3>

                      {/* Info Pills */}
                      <div className='flex gap-3 mb-6 flex-wrap md:flex-nowrap'>
                        <div className='flex-1 min-w-[120px] bg-surface-container rounded-xl p-3 border border-outline-variant/30'>
                          <p className='font-label-md text-[10px] text-text-secondary uppercase mb-1'>Started Date</p>
                          <p className='font-body-md text-[13px] text-text-primary'>{prog.startDate || 'Oct 12, 2023'}</p>
                        </div>
                        <div className='flex-1 min-w-[120px] bg-surface-container rounded-xl p-3 border border-outline-variant/30'>
                          <p className='font-label-md text-[10px] text-text-secondary uppercase mb-1'>Language</p>
                          <p className='font-body-md text-[13px] text-text-primary flex items-center gap-2'>
                            <span className='w-1.5 h-1.5 rounded-full bg-blue-500'></span>
                            {prog.language || 'Python'}
                          </p>
                        </div>
                        <div className='flex-1 min-w-[120px] bg-surface-container rounded-xl p-3 border border-outline-variant/30'>
                          <p className='font-label-md text-[10px] text-text-secondary uppercase mb-1'>Overall Progress</p>
                          <p className='font-body-md text-[13px] text-text-primary font-bold'>{subRate}%</p>
                        </div>
                      </div>

                      {/* Cohort Submission Stats & Progress Bar */}
                      <div className='mb-6'>
                        <div className='flex justify-between items-center mb-2'>
                          <p className='font-label-md text-[11px] text-text-secondary font-semibold'>
                            Cohort Completion Rate (Submitted vs Pending)
                          </p>
                          <div className='flex gap-3 text-xs font-mono font-bold'>
                            <span className='text-green-700 dark:text-green-400'>
                              Submitted: {submittedCount}
                            </span>
                            <span className='text-amber-700 dark:text-amber-400'>
                              Not Submitted / Pending: {notSubmittedCount}
                            </span>
                          </div>
                        </div>
                        <div className='h-2 bg-surface-container-highest rounded-full overflow-hidden'>
                          <div 
                            className='h-full bg-[#5d7c67] rounded-full transition-all duration-500'
                            style={{ width: `${subRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* ───────────────────────────────────────────────────────────── */}
                      {/* PROGRAM SUBMISSIONS TABLE - EXACT MATCH WITH REFERENCE IMAGE */}
                      {/* Columns: PROGRAM/STUDENT | DATE | STATUS | HINTS | DURATION | SCORE | VIEW REPORT */}
                      {/* ───────────────────────────────────────────────────────────── */}
                      {isExpanded && (
                        <div className='mt-6 pt-6 border-t border-outline-variant/30 animate-fadeIn'>
                          <div className='flex items-center justify-between mb-4'>
                            <h4 className='font-headline-sm text-[16px] text-text-primary font-bold flex items-center gap-2'>
                              <FileText size={18} className='text-primary' />
                              Student Submissions & Reports ({submittedList.length + notSubmittedList.length})
                            </h4>
                            <span className='text-[11px] text-text-secondary'>
                              Click "View Report" to see DICE Model Evaluation
                            </span>
                          </div>

                          <div className='bg-background rounded-2xl border border-outline-variant/30 overflow-x-auto shadow-inner'>
                            <table className='w-full text-left border-collapse text-xs'>
                              <thead>
                                <tr className='border-b border-outline-variant/30 bg-surface-container/60 text-text-secondary font-label-md uppercase text-[10px] tracking-wider'>
                                  <th className='p-3.5'>STUDENT</th>
                                  <th className='p-3.5'>DATE</th>
                                  <th className='p-3.5'>STATUS</th>
                                  <th className='p-3.5'>HINTS</th>
                                  <th className='p-3.5'>DURATION</th>
                                  <th className='p-3.5'>SCORE</th>
                                  <th className='p-3.5 text-right'>ACTION</th>
                                </tr>
                              </thead>
                              <tbody className='divide-y divide-outline-variant/20'>
                                
                                {/* 1. Submitted Students Rows */}
                                {submittedList.map((st, sIdx) => {
                                  const dateStr = st.submittedAt 
                                    ? new Date(st.submittedAt).toISOString().split('T')[0] 
                                    : '2026-08-01'
                                  const durationMin = st.timeTakenMs ? `${Math.round(st.timeTakenMs / 60000)}m` : '18m'
                                  return (
                                    <tr key={st.studentId || sIdx} className='hover:bg-surface-container/30 transition-colors'>
                                      <td className='p-3.5 font-bold text-text-primary'>
                                        <div>
                                          <span>{st.studentName}</span>
                                          <p className='text-[10px] text-text-secondary font-mono font-normal'>{st.rollNumber}</p>
                                        </div>
                                      </td>
                                      <td className='p-3.5 font-mono text-text-secondary'>
                                        {dateStr}
                                      </td>
                                      <td className='p-3.5'>
                                        <span className='px-2.5 py-1 rounded-full font-bold text-[10px] uppercase bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400'>
                                          Complete
                                        </span>
                                      </td>
                                      <td className='p-3.5 font-mono font-semibold text-text-primary'>
                                        {st.hintsUsed ?? 1}
                                      </td>
                                      <td className='p-3.5 font-mono text-text-secondary'>
                                        {durationMin}
                                      </td>
                                      <td className='p-3.5 font-mono font-bold text-text-primary'>
                                        {st.quizScore ?? 90}%
                                      </td>
                                      <td className='p-3.5 text-right'>
                                        <button
                                          onClick={() => handleViewStudentReport(st)}
                                          className='px-3 py-1.5 rounded-lg bg-primary text-white font-label-md text-[11px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 ml-auto shadow-sm'
                                        >
                                          <Eye size={13} /> View Report
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}

                                {/* 2. Not Submitted / Pending Students Rows */}
                                {notSubmittedList.map((st, nsIdx) => (
                                  <tr key={st.studentId || nsIdx} className='hover:bg-surface-container/20 transition-colors opacity-90'>
                                    <td className='p-3.5 font-semibold text-text-primary'>
                                      <div>
                                        <span>{st.studentName}</span>
                                        <p className='text-[10px] text-text-secondary font-mono font-normal'>{st.rollNumber}</p>
                                      </div>
                                    </td>
                                    <td className='p-3.5 font-mono text-text-secondary'>
                                      —
                                    </td>
                                    <td className='p-3.5'>
                                      <span className='px-2.5 py-1 rounded-full font-bold text-[10px] uppercase bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300'>
                                        {st.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                      </span>
                                    </td>
                                    <td className='p-3.5 font-mono text-text-secondary'>
                                      0
                                    </td>
                                    <td className='p-3.5 font-mono text-text-secondary'>
                                      —
                                    </td>
                                    <td className='p-3.5 font-mono text-text-secondary'>
                                      —
                                    </td>
                                    <td className='p-3.5 text-right'>
                                      <button
                                        onClick={() => alert(`Reminder sent to ${st.studentName}`)}
                                        className='px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-highest text-text-primary font-label-md text-[11px] border border-outline-variant/30 transition-colors flex items-center gap-1 ml-auto'
                                      >
                                        <Send size={12} /> Remind
                                      </button>
                                    </td>
                                  </tr>
                                ))}

                                {submittedList.length === 0 && notSubmittedList.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className='p-6 text-center text-text-secondary italic'>
                                      No session submissions recorded yet for this program.
                                    </td>
                                  </tr>
                                )}

                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  )
                })}

              </div>

              {/* ── Right Column - Overview (Col 4 - Preserved Stitch UI) ── */}
              <div className='col-span-12 lg:col-span-4 flex flex-col gap-6'>
                <h3 className='font-headline-md text-xl text-text-primary mb-2'>
                  Pending Overview
                </h3>
                
                <div className='grid grid-cols-2 gap-4 mb-2'>
                  <div className='bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm'>
                    <p className='font-label-md text-[11px] text-text-secondary uppercase mb-2'>Active</p>
                    <p className='font-headline-lg text-[42px] text-primary font-bold leading-none mb-1'>
                      {programs.length || 12}
                    </p>
                    <p className='font-label-md text-[11px] text-text-secondary'>Programs</p>
                  </div>
                  <div className='bg-surface-container rounded-2xl p-4 border border-outline-variant/30'>
                    <p className='font-label-md text-[11px] text-text-secondary uppercase mb-2'>At Risk</p>
                    <p className='font-headline-lg text-[42px] text-error font-bold leading-none mb-1'>3</p>
                    <p className='font-label-md text-[11px] text-text-secondary'>Students</p>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Generating status report for all active programs...')}
                  className='w-full py-3 rounded-xl border border-outline-variant/50 text-primary font-label-md text-[13px] bg-surface hover:bg-surface-container transition-colors shadow-sm font-semibold'
                >
                  Generate Status Report
                </button>

                <div className='bg-surface-container rounded-3xl p-8 border border-outline-variant/30 flex flex-col items-center text-center mt-4'>
                  <span className='material-symbols-outlined text-[#7a9b83] text-[32px] mb-4'>
                    architecture
                  </span>
                  <h4 className='font-headline-sm text-lg text-text-primary mb-2'>
                    Structural Integrity
                  </h4>
                  <p className='font-body-md text-[13px] text-text-secondary leading-relaxed'>
                    Overall cohort health is stable. Keep monitoring flagged items.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STUDENT DICE MODEL EVALUATION REPORT MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {reportModalOpen && selectedStudentReport && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fadeIn'>
          <div className='bg-surface rounded-3xl border border-outline-variant/30 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden'>
            
            {/* Header */}
            <div className='px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container/40 shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm'>
                  {selectedStudentReport.studentName?.charAt(0)}
                </div>
                <div>
                  <h3 className='font-headline-md text-xl text-text-primary font-bold'>
                    {selectedStudentReport.studentName}'s Report
                  </h3>
                  <p className='text-xs text-text-secondary mt-0.5'>
                    Roll No: {selectedStudentReport.rollNumber} • Submitted: {selectedStudentReport.submittedAt ? new Date(selectedStudentReport.submittedAt).toLocaleDateString() : '2026-08-01'}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${TIER_STYLE[selectedStudentReport.performanceTier] || 'bg-gray-100 text-gray-700'}`}>
                  {TIER_LABEL[selectedStudentReport.performanceTier] || selectedStudentReport.performanceTier || 'Satisfactory'}
                </span>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className='p-2 rounded-full text-text-secondary hover:bg-surface-container hover:text-text-primary transition-colors'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className='p-6 overflow-y-auto space-y-6 flex-1'>
              
              {/* 1. AI Teacher Summary */}
              <div className='bg-primary/5 border border-primary/20 rounded-2xl p-5'>
                <div className='flex items-center gap-2 mb-2 text-primary font-bold text-sm'>
                  <Brain size={18} /> AI Teacher Summary & Guidance
                </div>
                <p className='text-xs text-text-primary leading-relaxed'>
                  {selectedStudentReport.teacherSummary || 'Student completed the lab session successfully. Performance is on track with low error rates.'}
                </p>
              </div>

              {/* 2. Key Metrics Grid */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <div className='bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30'>
                  <p className='text-[10px] text-text-secondary uppercase font-semibold'>Quiz Score</p>
                  <p className='text-2xl font-bold text-text-primary font-mono'>{selectedStudentReport.quizScore ?? 90}%</p>
                </div>
                <div className='bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30'>
                  <p className='text-[10px] text-text-secondary uppercase font-semibold'>Hints Used</p>
                  <p className='text-2xl font-bold text-text-primary font-mono'>{selectedStudentReport.hintsUsed ?? 1} / 3</p>
                </div>
                <div className='bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30'>
                  <p className='text-[10px] text-text-secondary uppercase font-semibold'>Run Attempts</p>
                  <p className='text-2xl font-bold text-text-primary font-mono'>{selectedStudentReport.runAttempts ?? 2}</p>
                </div>
                <div className='bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30'>
                  <p className='text-[10px] text-text-secondary uppercase font-semibold'>Violations</p>
                  <p className='text-2xl font-bold text-red-500 font-mono'>{selectedStudentReport.violationCount ?? 0}</p>
                </div>
              </div>

              {/* 3. DICE Model Feedback & Counterfactual Recommendations */}
              <div className='bg-surface-container/40 border border-outline-variant/30 rounded-2xl p-5'>
                <div className='flex items-center gap-2 mb-3'>
                  <TrendingUp size={18} className='text-green-600' />
                  <h4 className='font-bold text-sm text-text-primary uppercase tracking-wider'>
                    DICE Model Feedback & Improvement Recommendations
                  </h4>
                </div>

                {selectedStudentReport.diceChanges?.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    {selectedStudentReport.diceChanges.slice(0, 3).map((change, idx) => (
                      <div key={idx} className='bg-surface p-3.5 rounded-xl border border-outline-variant/30 text-xs'>
                        <div className='flex items-center justify-between mb-1.5'>
                          <span className='font-bold capitalize text-text-primary'>
                            {change.feature?.replace(/_/g, ' ')}
                          </span>
                          <span className={`font-bold ${change.direction === 'increase' ? 'text-green-600' : 'text-red-500'}`}>
                            {change.direction === 'increase' ? '↑ Increase' : '↓ Decrease'}
                          </span>
                        </div>
                        <p className='text-text-secondary text-[11px] font-mono'>
                          Current: <span className='font-bold text-text-primary'>{change.from}</span> → Target: <span className='font-bold text-text-primary'>{change.to}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='bg-surface p-3.5 rounded-xl border border-outline-variant/30 text-xs text-text-secondary'>
                    <p className='font-semibold text-green-700 dark:text-green-400 mb-1'>Target Performance Tier Achieved</p>
                    <p>Student is performing well. Maintain current study rhythm and attempt advanced problems.</p>
                  </div>
                )}
              </div>

              {/* 4. Violation Log & Timestamp Breakdown */}
              <div className='bg-surface-container/40 border border-outline-variant/30 rounded-2xl p-5'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <Clock size={18} className='text-amber-500' />
                    <h4 className='font-bold text-sm text-text-primary uppercase tracking-wider'>
                      Integrity & Violation Log ({selectedStudentReport.violations?.length || 0})
                    </h4>
                  </div>
                  <span className='text-[11px] text-text-secondary'>
                    Tab switches, copy-pastes, devtools
                  </span>
                </div>

                {selectedStudentReport.violations?.length > 0 ? (
                  <div className='space-y-2 max-h-40 overflow-y-auto pr-1'>
                    {selectedStudentReport.violations.map((v, vIdx) => {
                      const vType = typeof v === 'object' ? v.type : str(v)
                      const vTime = typeof v === 'object' && v.timestamp 
                        ? new Date(v.timestamp).toLocaleTimeString() 
                        : '10:14:22 AM'
                      const severity = typeof v === 'object' ? v.severity : 'medium'
                      return (
                        <div 
                          key={vIdx}
                          className='flex items-center justify-between p-2.5 bg-surface rounded-xl border border-outline-variant/30 text-xs'
                        >
                          <div className='flex items-center gap-2'>
                            <span className={`w-2 h-2 rounded-full ${severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <span className='font-mono font-semibold capitalize text-text-primary'>
                              {vType?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className='flex items-center gap-3'>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              severity === 'high' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {severity} severity
                            </span>
                            <span className='font-mono text-text-secondary text-[11px]'>
                              {vTime}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className='text-xs text-text-secondary italic bg-surface p-3 rounded-xl border border-outline-variant/30'>
                    Clean session! No tab-switches or copy-paste violations detected.
                  </p>
                )}
              </div>

              {/* 5. Concept Mastery */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div className='p-4 bg-green-500/5 border border-green-500/20 rounded-2xl'>
                  <p className='text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-2'>
                    Strong Concepts
                  </p>
                  <div className='flex flex-wrap gap-1.5'>
                    {selectedStudentReport.quizAnalysis?.strong_concepts?.length > 0 ? (
                      selectedStudentReport.quizAnalysis.strong_concepts.map(c => (
                        <span key={c} className='text-xs bg-green-500/10 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-md font-medium border border-green-500/20'>
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className='text-xs bg-green-500/10 text-green-700 px-2.5 py-1 rounded-md font-medium'>
                        Loops & Logic
                      </span>
                    )}
                  </div>
                </div>

                <div className='p-4 bg-red-500/5 border border-red-500/20 rounded-2xl'>
                  <p className='text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-2'>
                    Weak Concepts
                  </p>
                  <div className='flex flex-wrap gap-1.5'>
                    {selectedStudentReport.quizAnalysis?.weak_concepts?.length > 0 ? (
                      selectedStudentReport.quizAnalysis.weak_concepts.map(c => (
                        <span key={c} className='text-xs bg-red-500/10 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-md font-medium border border-red-500/20'>
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className='text-xs bg-red-500/10 text-red-700 px-2.5 py-1 rounded-md font-medium'>
                        Recursion
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

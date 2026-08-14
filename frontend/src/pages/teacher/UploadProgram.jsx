// frontend/src/pages/teacher/UploadProgram.jsx
import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { db } from '../../services/firebase'
import { Plus, Trash2, ChevronLeft, Upload } from 'lucide-react'

const SUBJECTS    = ['Python Basics', 'Data Structures', 'Algorithms', 'OOP Concepts']
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical']
const YEARS       = [1, 2, 3, 4]

function buildClassId(department, year, section) {
  const deptCode = department.split(' ').map(w => w[0]).join('').toUpperCase()
  return `${deptCode}-${year}-${section}`
}

export default function UploadProgram() {
  const navigate = useNavigate()
  const { theme } = useOutletContext()

  const [activeTab, setActiveTab] = useState('dashboard')

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

  // Old theme object removed

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
      })

      navigate('/teacher/dashboard')

    } catch (err) {
      setError('Failed to save program. ' + err.message)
    } finally {
      setSaving(false)
    }
  }

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
                ? 'bg-surface shadow-sm text-text-primary'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2 rounded-full font-label-md text-[13px] transition-all ${
              activeTab === 'upload'
                ? 'bg-surface shadow-sm text-text-primary'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Create New
          </button>
        </div>
      </div>

      <div className={activeTab === 'upload' ? 'max-w-3xl mx-auto' : 'max-w-7xl mx-auto'}>
        {activeTab === 'upload' && (
          <>
            <button
              onClick={() => navigate('/teacher/dashboard')}
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

        {activeTab === 'dashboard' && (
          <div className='flex flex-col gap-6'>
            {/* Filter Pills */}
            <div className='flex gap-2 mb-2'>
              <button className='px-4 py-1.5 rounded-md bg-[#e7e7e5] text-text-primary font-label-md text-[12px]'>
                All Programs
              </button>
              <button className='px-4 py-1.5 rounded-md text-text-secondary font-label-md text-[12px] hover:bg-surface-container'>
                Completed
              </button>
              <button className='px-4 py-1.5 rounded-md bg-surface text-text-secondary font-label-md text-[12px] border border-outline-variant/30 flex items-center gap-2'>
                Pending <span className='w-1.5 h-1.5 rounded-full bg-error'></span>
              </button>
            </div>

            <div className='grid grid-cols-12 gap-8 items-start'>
              {/* Left Column - Programs */}
              <div className='col-span-8 flex flex-col gap-6'>
                {/* Data Structures Card */}
                <div className='bg-surface rounded-3xl p-6 border border-outline-variant/30 relative overflow-hidden shadow-sm'>
                  {/* Top Red Glow Accent */}
                  <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#fae4e1] to-transparent'></div>
                  
                  {/* Badges */}
                  <div className='flex gap-2 mb-4'>
                    <span className='px-2.5 py-1 rounded bg-surface-container text-text-secondary font-label-md text-[10px] tracking-wider uppercase border border-outline-variant/30'>
                      CSE821
                    </span>
                    <span className='px-2.5 py-1 rounded bg-[#fae4e1] text-[#b04040] font-label-md text-[10px] tracking-wider uppercase flex items-center gap-1 border border-[#f0c4c1]'>
                      <span className='material-symbols-outlined text-[12px]'>warning</span>
                      Action Required
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className='font-headline-md text-2xl text-text-primary mb-6'>
                    Data Structures & Algorithms
                  </h3>

                  {/* Info Pills */}
                  <div className='flex gap-4 mb-6'>
                    <div className='flex-1 bg-surface-container rounded-xl p-3 border border-outline-variant/30'>
                      <p className='font-label-md text-[10px] text-text-secondary uppercase mb-1'>Started Date</p>
                      <p className='font-body-md text-[13px] text-text-primary'>Oct 12, 2023</p>
                    </div>
                    <div className='flex-1 bg-surface-container rounded-xl p-3 border border-outline-variant/30'>
                      <p className='font-label-md text-[10px] text-text-secondary uppercase mb-1'>Language</p>
                      <p className='font-body-md text-[13px] text-text-primary flex items-center gap-2'>
                        <span className='w-1.5 h-1.5 rounded-full bg-blue-500'></span>
                        Python
                      </p>
                    </div>
                    <div className='flex-1 bg-surface-container rounded-xl p-3 border border-outline-variant/30'>
                      <p className='font-label-md text-[10px] text-text-secondary uppercase mb-1'>Overall Progress</p>
                      <p className='font-body-md text-[13px] text-text-primary'>68%</p>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className='mb-8'>
                    <div className='flex justify-between items-center mb-2'>
                      <p className='font-label-md text-[11px] text-text-secondary'>Cohort Completion Rate</p>
                      <p className='font-label-md text-[13px] text-primary font-bold'>68/100</p>
                    </div>
                    <div className='h-2 bg-surface-container-highest rounded-full overflow-hidden'>
                      <div className='h-full bg-[#d0e1d4] w-[68%] rounded-full'></div>
                    </div>
                  </div>

                  {/* Flagged Students */}
                  <div>
                    <div className='flex justify-between items-center mb-4'>
                      <h4 className='font-headline-sm text-[16px] text-text-primary flex items-center gap-2'>
                        <span className='material-symbols-outlined text-error text-[18px]'>flag</span>
                        Flagged Students (3)
                      </h4>
                      <p className='font-body-sm text-[12px] text-text-secondary'>Haven't completed recent module</p>
                    </div>
                    <div className='flex flex-col gap-3'>
                      {/* Student 1 */}
                      <div className='flex items-center justify-between p-3 rounded-2xl bg-surface border border-error/20'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-[#0F0F10] border border-outline-variant/30'></div>
                          <div>
                            <p className='font-body-md text-[14px] text-text-primary'>Marcus Vance</p>
                            <p className='font-body-sm text-[12px] text-text-secondary'>Stuck on: <span className='font-mono'>Binary Trees</span></p>
                          </div>
                        </div>
                        <div className='flex items-center gap-6'>
                          <div className='text-right'>
                            <p className='font-label-md text-[11px] text-error mb-0.5'>Idle 5 Days</p>
                            <p className='font-body-sm text-[10px] text-text-secondary'>Resume Status: Pending</p>
                          </div>
                          <button className='px-4 py-1.5 rounded-lg border border-outline-variant/50 font-label-md text-[12px] text-text-primary hover:bg-surface-container'>
                            Message
                          </button>
                        </div>
                      </div>
                      {/* Student 2 */}
                      <div className='flex items-center justify-between p-3 rounded-2xl bg-surface-container border border-outline-variant/30'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-[#0F0F10] border border-outline-variant/30'></div>
                          <div>
                            <p className='font-body-md text-[14px] text-text-primary'>Elena Rodriguez</p>
                            <p className='font-body-sm text-[12px] text-text-secondary'>Stuck on: <span className='font-mono'>Graph Traversal</span></p>
                          </div>
                        </div>
                        <div className='flex items-center gap-6'>
                          <div className='text-right'>
                            <p className='font-label-md text-[11px] text-error mb-0.5'>Idle 3 Days</p>
                            <p className='font-body-sm text-[10px] text-text-secondary'>Resume Status: Pending</p>
                          </div>
                          <button className='px-4 py-1.5 rounded-lg border border-outline-variant/50 font-label-md text-[12px] text-text-primary hover:bg-surface-container'>
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* React Card */}
                <div className='bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm'>
                  <div className='flex gap-2 mb-4'>
                    <span className='px-2.5 py-1 rounded bg-surface-container text-text-secondary font-label-md text-[10px] tracking-wider uppercase border border-outline-variant/30'>
                      WEB405
                    </span>
                    <span className='px-2.5 py-1 rounded bg-[#d0e1d4] text-[#386667] font-label-md text-[10px] tracking-wider uppercase border border-[#b8d2be]'>
                      On Track
                    </span>
                  </div>
                  <h3 className='font-headline-md text-2xl text-text-primary mb-6'>
                    Advanced React Patterns
                  </h3>
                  <div className='mb-4'>
                    <div className='flex justify-between items-center mb-2'>
                      <p className='font-label-md text-[11px] text-text-secondary'>Progress</p>
                      <p className='font-label-md text-[13px] text-primary font-bold'>85%</p>
                    </div>
                    <div className='h-2 bg-surface-container-highest rounded-full overflow-hidden mb-4'>
                      <div className='h-full bg-[#5d7c67] w-[85%] rounded-full'></div>
                    </div>
                    <p className='font-body-sm text-[12px] text-text-secondary'>
                      All 45 students active in the last 48 hours. Next module unlocks in 2 days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Overview */}
              <div className='col-span-4 flex flex-col gap-6'>
                <h3 className='font-headline-md text-xl text-text-primary mb-2'>
                  Pending Overview
                </h3>
                
                <div className='grid grid-cols-2 gap-4 mb-2'>
                  <div className='bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm'>
                    <p className='font-label-md text-[11px] text-text-secondary uppercase mb-2'>Active</p>
                    <p className='font-headline-lg text-[42px] text-primary font-bold leading-none mb-1'>12</p>
                    <p className='font-label-md text-[11px] text-text-secondary'>Programs</p>
                  </div>
                  <div className='bg-surface-container rounded-2xl p-4 border border-outline-variant/30'>
                    <p className='font-label-md text-[11px] text-text-secondary uppercase mb-2'>At Risk</p>
                    <p className='font-headline-lg text-[42px] text-error font-bold leading-none mb-1'>3</p>
                    <p className='font-label-md text-[11px] text-text-secondary'>Students</p>
                  </div>
                </div>

                <button className='w-full py-3 rounded-xl border border-outline-variant/50 text-primary font-label-md text-[13px] bg-surface hover:bg-surface-container transition-colors shadow-sm'>
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
    </div>
  )
}

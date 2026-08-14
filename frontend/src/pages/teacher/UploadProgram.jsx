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

  // Theme classes
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      textSubtle: 'text-[#737373]',
      border: 'border-white/10',
      borderSubtle: 'border-white/[0.06]',
      cardBg: 'rgba(26, 26, 29, 0.7)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      inputBorder: 'border-white/10',
      inputFocus: 'focus:border-[#818CF8]',
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      textSubtle: 'text-[#A3A3A3]',
      border: 'border-[#E5E5E5]',
      borderSubtle: 'border-[#F5F5F5]',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      inputBg: 'bg-white',
      inputBorder: 'border-[#E5E5E5]',
      inputFocus: 'focus:border-[#6366F1]',
    }
  }[theme]

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
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-12 px-6 transition-colors duration-300`}>
      <div className='max-w-3xl mx-auto'>

        <button
          onClick={() => navigate('/teacher/dashboard')}
          className={`flex items-center gap-1 text-sm mb-6 transition-colors`}
          style={{
            color: theme === 'dark' ? '#A5B4FC' : '#6366F1'
          }}
        >
          <ChevronLeft size={16} strokeWidth={2} /> Back to Dashboard
        </button>

        <div className='mb-8'>
          <h1 className='text-2xl font-semibold mb-1'>Upload Program</h1>
          <p className={`text-sm ${t.textMuted}`}>
            Programs are visible only to students in the selected class
          </p>
        </div>

        {error && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6'>
            <p className='text-sm text-red-400'>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>

          {/* Basic info */}
          <div 
            className={`rounded-lg border ${t.border} p-4`}
            style={{
              backgroundColor: t.cardBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className='space-y-3'>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Title
                </label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder='Fibonacci Series'
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Description / Task
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder='Print the Fibonacci series up to N terms.'
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                    Subject
                  </label>
                  <select
                    value={subject} onChange={e => setSubject(e.target.value)}
                    className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                               ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                    style={{
                      backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                    }}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                    Difficulty
                  </label>
                  <select
                    value={difficulty} onChange={e => setDifficulty(e.target.value)}
                    className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                               ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                    style={{
                      backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                    }}
                  >
                    {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Concepts (comma-separated)
                </label>
                <input
                  value={concepts} onChange={e => setConcepts(e.target.value)}
                  placeholder='loops, recursion'
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Starter Code (optional)
                </label>
                <textarea
                  value={starterCode} onChange={e => setStarterCode(e.target.value)}
                  rows={3}
                  placeholder='n = int(input())'
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             font-mono ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Hint Limit
                </label>
                <input
                  type='number' min={0} max={5}
                  value={hintLimit} onChange={e => setHintLimit(e.target.value)}
                  className={`w-24 border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Target class */}
          <div 
            className={`rounded-lg border ${t.border} p-4`}
            style={{
              backgroundColor: t.cardBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <h3 className='font-medium text-sm mb-3'>Target Class</h3>
            <div className='grid grid-cols-3 gap-3'>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Department
                </label>
                <select
                  value={department} onChange={e => setDepartment(e.target.value)}
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Year
                </label>
                <select
                  value={year} onChange={e => setYear(Number(e.target.value))}
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                >
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${t.textSubtle}`}>
                  Section
                </label>
                <input
                  value={section} onChange={e => setSection(e.target.value.toUpperCase())}
                  maxLength={2}
                  className={`w-full border ${t.inputBorder} ${t.inputBg} rounded-lg px-3 py-2 text-sm
                             ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus} transition-colors`}
                  style={{
                    backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                  }}
                />
              </div>
            </div>
            <p className={`text-xs ${t.textSubtle} mt-2`}>
              Resulting class ID: <span className='font-mono'>{buildClassId(department, year, section)}</span>
            </p>
          </div>

          {/* Test cases */}
          <div 
            className={`rounded-lg border ${t.border} p-4`}
            style={{
              backgroundColor: t.cardBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-medium text-sm'>Test Cases</h3>
              <button
                type='button' onClick={addTestCase}
                className='flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors'
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                  color: theme === 'dark' ? '#A5B4FC' : '#6366F1'
                }}
              >
                <Plus size={12} strokeWidth={2} /> Add Test
              </button>
            </div>

            <div className='space-y-3'>
              {testCases.map((tc, i) => (
                <div key={i} className={`border ${t.borderSubtle} rounded-lg p-3`}>
                  <div className='flex items-center justify-between mb-2'>
                    <input
                      value={tc.label}
                      onChange={e => updateTestCase(i, 'label', e.target.value)}
                      placeholder={`Test ${i + 1} label`}
                      className={`text-xs font-medium bg-transparent border-none focus:outline-none flex-1 ${t.text}`}
                    />
                    {testCases.length > 1 && (
                      <button
                        type='button' onClick={() => removeTestCase(i)}
                        className={`${t.textMuted} hover:text-red-500 transition-colors`}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className={`block text-xs ${t.textSubtle} mb-1`}>
                        Input (stdin) — leave blank if none
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={e => updateTestCase(i, 'input', e.target.value)}
                        rows={2}
                        className={`w-full border ${t.inputBorder} ${t.inputBg} rounded px-2 py-1.5
                                   text-xs font-mono ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus}`}
                        style={{
                          backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                        }}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs ${t.textSubtle} mb-1`}>
                        Expected Output
                      </label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)}
                        rows={2}
                        className={`w-full border ${t.inputBorder} ${t.inputBg} rounded px-2 py-1.5
                                   text-xs font-mono ${t.text} focus:outline-none focus:ring-1 ${t.inputFocus}`}
                        style={{
                          backgroundColor: theme === 'dark' ? t.inputBg : 'white'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type='submit' disabled={saving}
            className='w-full font-semibold py-2.5 rounded-lg text-sm transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed'
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(129, 140, 248, 0.9)' : 'rgba(99, 102, 241, 0.9)',
              color: 'white'
            }}
          >
            {saving ? 'Publishing...' : (
              <span className='flex items-center justify-center gap-1.5'>
                <Upload size={14} strokeWidth={2} /> Publish Program
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

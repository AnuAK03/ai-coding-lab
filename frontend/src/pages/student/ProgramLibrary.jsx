// frontend/src/pages/student/ProgramLibrary.jsx
import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useNavigate } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import { Code2, Zap, BookOpen } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const DIFFICULTY_COLOR = {
  dark: {
    easy:   'bg-green-500/15 text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    hard:   'bg-red-500/15 text-red-400 border-red-500/20',
  },
  light: {
    easy:   'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard:   'bg-red-100 text-red-700 border-red-200',
  }
}

export default function ProgramLibrary() {
  const [groupedPrograms, setGroupedPrograms] = useState({})   // { subject: [programs] }
  const [loading, setLoading]   = useState(true)
  const [classId, setClassId]   = useState(null)
  const user     = getAuth().currentUser
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    async function loadPrograms() {
      // 1. Get the student's own classId from their profile
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const userClassId = userSnap.data()?.classId
      setClassId(userClassId)

      if (!userClassId) {
        // Student has no classId (e.g. old account from before Day 7) — show nothing filtered
        setLoading(false)
        return
      }

      // 2. Query programs matching BOTH active=true AND this student's classId
      const q = query(
        collection(db, 'programs'),
        where('active', '==', true),
        where('classId', '==', userClassId)
      )
      const snap = await getDocs(q)
      const programs = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      // 3. Group by subject for sectioned display
      const grouped = {}
      for (const prog of programs) {
        const subj = prog.subject || 'General'
        if (!grouped[subj]) grouped[subj] = []
        grouped[subj].push(prog)
      }

      setGroupedPrograms(grouped)
      setLoading(false)
    }
    loadPrograms()
  }, [user.uid])

  const subjects = Object.keys(groupedPrograms)

  // Theme classes
  const t = {
    dark: {
      bg: 'bg-[#0F0F10]',
      text: 'text-[#EDEDED]',
      textMuted: 'text-[#A1A1A3]',
      cardBg: 'bg-[#1A1A1D]',
      cardBorder: 'border-white/10',
      cardHover: 'hover:border-[#818CF8]/30',
      accentText: 'text-[#818CF8]',
      badge: 'bg-[#818CF8]/15 text-[#A5B4FC] border-[#818CF8]/20',
      conceptBadge: 'bg-white/5 text-[#A1A1A3] border-white/10'
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      cardBg: 'bg-white',
      cardBorder: 'border-gray-100',
      cardHover: 'hover:border-blue-300',
      accentText: 'text-[#6366F1]',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      conceptBadge: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }[theme]

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-300`}>
      <main className='max-w-4xl mx-auto px-4 py-8'>
        <h1 className={`text-2xl font-bold ${t.text} mb-1`}>Program library</h1>
        <p className={`${t.textMuted} text-sm mb-6`}>
          {classId
            ? `Showing programs for your class (${classId})`
            : 'Choose a program to begin your proctored lab session.'}
        </p>

        {loading ? (
          <p className={t.textMuted}>Loading programs...</p>
        ) : subjects.length === 0 ? (
          <div className={`${t.cardBg} rounded-xl p-8 text-center ${t.textMuted} border ${t.cardBorder}`}>
            No programs available for your class yet. Ask your teacher to upload some.
          </div>
        ) : (
          // ── Subject sections ──
          <div className='space-y-8'>
            {subjects.map(subject => (
              <div key={subject}>
                <div className='flex items-center gap-2 mb-3'>
                  <BookOpen size={16} className={t.accentText} />
                  <h2 className={`font-semibold ${t.text}`}>{subject}</h2>
                  <span className={`text-xs ${t.textMuted}`}>
                    {groupedPrograms[subject].length} program
                    {groupedPrograms[subject].length !== 1 && 's'}
                  </span>
                </div>

                <div className='grid gap-3'>
                  {groupedPrograms[subject].map(prog => (
                    <div key={prog.id}
                         className={`${t.cardBg} rounded-xl p-5 shadow-sm border ${t.cardBorder}
                                    ${t.cardHover} hover:shadow-md transition-all duration-200`}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Code2 className={t.accentText} size={16} />
                            <h3 className={`font-semibold ${t.text}`}>{prog.title}</h3>
                          </div>
                          <p className={`text-sm ${t.textMuted} mb-3`}>{prog.description}</p>
                          <div className='flex gap-2 flex-wrap'>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border
                                              ${DIFFICULTY_COLOR[theme][prog.difficulty]}`}>
                              {prog.difficulty}
                            </span>
                            {prog.testCases?.length > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${t.badge}`}>
                                {prog.testCases.length} test case
                                {prog.testCases.length !== 1 && 's'}
                              </span>
                            )}
                            {prog.concepts?.map(c => (
                              <span key={c}
                                    className={`text-xs px-2 py-0.5 rounded-full border ${t.conceptBadge}`}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${t.textMuted} ml-4`}>
                          <Zap size={12} />
                          <span>{prog.hintLimit ?? 3} hints</span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className={`flex gap-2 mt-4 pt-3 border-t ${t.cardBorder}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/student/understand/${prog.id}`)
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5
                                     ${theme === 'dark' 
                                       ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/20'
                                       : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                     }
                                     text-xs font-medium py-2 rounded-lg transition-colors`}
                        >
                          <BookOpen size={14} /> Understand the logic
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/student/session/${prog.id}`)
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5
                                     ${theme === 'dark'
                                       ? 'bg-[#818CF8] hover:bg-[#6366F1] text-white'
                                       : 'bg-blue-600 hover:bg-blue-700 text-white'
                                     }
                                     text-xs font-medium py-2 rounded-lg transition-colors`}
                        >
                          <Code2 size={14} /> Start coding
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

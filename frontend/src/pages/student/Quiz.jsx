// frontend/src/pages/student/Quiz.jsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { generateQuiz, submitSession } from '../../services/api'
import { CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react'

export default function Quiz() {
  // Data passed from Session.jsx via navigate state
  // { sessionId, program, studentCode, studentId }
  const location = useLocation()
  const navigate  = useNavigate()
  const { sessionId, program, studentCode, studentId } = location.state || {}

  const [questions,  setQuestions]  = useState([])
  const [answers,    setAnswers]    = useState({})   // { q1: 'A', q2: 'C', ... }
  const [submitted,  setSubmitted]  = useState(false)
  const [score,      setScore]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Generate quiz on mount
  useEffect(() => {
    if (!program || studentCode === undefined) {
      navigate('/student/programs')
      return
    }
    loadQuiz()
  }, [])

  async function loadQuiz() {
    try {
      const result = await generateQuiz(
        program.title,
        program.description,
        program.concepts || [],
        studentCode
      )
      setQuestions(result.questions)
    } catch (err) {
      setError('Could not generate quiz. ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionId, selectedLabel) {
    if (submitted) return  // don't allow changes after submit
    setAnswers(prev => ({ ...prev, [questionId]: selectedLabel }))
  }

  async function handleSubmitQuiz() {
    // Calculate score
    let correct = 0
    const quizAnswers = questions.map(q => {
      const studentAnswer = answers[q.id]
      const isCorrect     = studentAnswer === q.correctAnswer
      if (isCorrect) correct++
      return {
        question_id:  q.id,
        concept_tag:  q.concept_tag,
        correct:      isCorrect,
        studentAnswer,
        correctAnswer: q.correctAnswer,
      }
    })

    const quizScore = correct / questions.length   // 0.0 – 1.0
    setScore({ correct, total: questions.length, value: quizScore })
    setSubmitted(true)

    // Save quiz results to Firestore session doc
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        quizScore:   quizScore,
        quizAnswers: quizAnswers,
        status:      'submitted',   // ready for ML pipeline (Day 5)
      })
      
      // Trigger backend pipeline (streak/badges/completion)
      // This runs as a background task, so we don't wait for it
      try {
        await submitSession({
          sessionId,
          studentId,
          programId: program.id,
        })
        console.log('Pipeline triggered successfully')
      } catch (pipelineErr) {
        // Don't block the UI — pipeline is best-effort/background
        console.error('Failed to trigger pipeline:', pipelineErr)
      }
    } catch (err) {
      console.error('Failed to save quiz score:', err)
    }
  }

  // ── Loading state ──
  if (loading) return (
    <div className='min-h-screen bg-[#fcfaf5] flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 size={32} className='text-[#4a6f55] animate-spin mx-auto mb-3' />
        <p className='text-gray-600 text-sm'>Generating your quiz...</p>
        <p className='text-gray-500 text-xs mt-1'>
          This takes a few seconds
        </p>
      </div>
    </div>
  )

  // ── Error state ──
  if (error) return (
    <div className='min-h-screen bg-[#fcfaf5] flex items-center justify-center p-4'>
      <div className='bg-white border border-[#e2e8f0] rounded-xl p-6 max-w-md text-center shadow-sm'>
        <XCircle size={32} className='text-red-500 mx-auto mb-3' />
        <p className='text-red-600 text-sm mb-4'>{error}</p>
        <button
          onClick={() => navigate('/student/programs')}
          className='text-[#4a6f55] underline font-medium text-sm hover:text-[#3d5c46]'
        >
          Back to programs
        </button>
      </div>
    </div>
  )

  // ── Results screen (after submission) ──
  if (submitted && score) return (
    <div className='min-h-screen bg-[#fcfaf5] flex items-center justify-center p-4 py-8'>
      <div className='bg-white border border-[#e2e8f0] shadow-sm rounded-2xl p-8 max-w-lg w-full'>
        <div className='text-center mb-6'>
          <CheckCircle size={48} className='text-[#10b981] mx-auto mb-3' />
          <h1 className='text-gray-900 text-2xl font-serif font-bold'>Session Complete!</h1>
          <p className='text-gray-500 font-medium text-sm mt-1'>
            {program.title}
          </p>
        </div>

        {/* Score display */}
        <div className='bg-[#fcfaf5] border border-[#e2e8f0] rounded-xl p-4 text-center mb-6'>
          <p className='text-5xl font-bold text-gray-900 mb-1'>
            {score.correct}/{score.total}
          </p>
          <p className='text-gray-500 font-medium text-sm'>
            {Math.round(score.value * 100)}% score
          </p>
        </div>

        {/* Answer review */}
        <div className='space-y-3 mb-6'>
          {questions.map(q => {
            const studentAns = answers[q.id]
            const isCorrect  = studentAns === q.correctAnswer
            return (
              <div key={q.id}
                   className={`rounded-lg p-3 border
                               ${isCorrect
                                   ? 'bg-[#10b981]/10 border-[#10b981]/30'
                                   : 'bg-[#f43f5e]/10 border-[#f43f5e]/30'}`}
              >
                <p className='text-gray-800 font-medium text-sm mb-1'>{q.question}</p>
                <p className={`text-xs font-bold
                               ${isCorrect ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                  {isCorrect ? '✓ Correct' : `✗ You answered ${studentAns} — correct: ${q.correctAnswer}`}
                </p>
                <p className='text-gray-600 font-medium text-xs mt-0.5'>{q.explanation}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/student/dashboard')}
          className='w-full bg-[#4a6f55] hover:bg-[#3d5c46] text-white
                     font-bold py-3 rounded-lg transition-colors text-sm'
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  // ── Main quiz UI ──
  const answeredCount = Object.keys(answers).length
  const allAnswered   = answeredCount === questions.length

  return (
    <div className='min-h-screen bg-[#fcfaf5] py-8 px-4'>
      <div className='max-w-2xl mx-auto'>

        {/* Quiz header */}
        <div className='flex items-center gap-3 mb-6'>
          <BookOpen size={20} className='text-[#4a6f55]' />
          <div>
            <h1 className='text-gray-900 font-serif font-bold'>Viva Quiz</h1>
            <p className='text-gray-500 font-medium text-xs mt-0.5'>{program.title}</p>
          </div>
          <span className='ml-auto text-xs font-bold text-gray-500 bg-white border border-[#e2e8f0] px-3 py-1.5 rounded-full'>
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {/* Questions */}
        <div className='space-y-5'>
          {questions.map((q, idx) => (
            <div key={q.id}
                 className='bg-white shadow-sm rounded-xl p-6 border border-[#e2e8f0]'>
              <p className='text-gray-900 text-sm font-bold mb-4'>
                <span className='text-[#4a6f55] mr-2'>Q{idx + 1}.</span>
                {q.question}
              </p>
              <div className='space-y-2.5'>
                {q.options.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(q.id, opt.label)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border font-medium ${
                        answers[q.id] === opt.label
                        ? 'bg-[#4a6f55] border-[#4a6f55] text-white'
                        : 'bg-white border-[#e2e8f0] text-gray-700 hover:bg-[#fcfaf5]'}`}
                  >
                    <span className='font-bold mr-2 opacity-80'>{opt.label}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit quiz button */}
        <button
          onClick={handleSubmitQuiz}
          disabled={!allAnswered}
          className={`w-full mt-8 py-3.5 rounded-xl font-bold text-sm
                       transition-colors shadow-sm
                       ${allAnswered
                           ? 'bg-[#4a6f55] hover:bg-[#3d5c46] text-white'
                           : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'}`}
        >
          {allAnswered
            ? 'Submit Quiz'
            : `Answer all questions (${questions.length - answeredCount} remaining)`}
        </button>
      </div>
    </div>
  )
}
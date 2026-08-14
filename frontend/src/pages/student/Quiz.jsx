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
    if (!program || !studentCode) {
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
    <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 size={32} className='text-blue-400 animate-spin mx-auto mb-3' />
        <p className='text-gray-400 text-sm'>Generating your quiz...</p>
        <p className='text-gray-600 text-xs mt-1'>
          This takes a few seconds
        </p>
      </div>
    </div>
  )

  // ── Error state ──
  if (error) return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
      <div className='bg-gray-800 rounded-xl p-6 max-w-md text-center'>
        <XCircle size={32} className='text-red-400 mx-auto mb-3' />
        <p className='text-red-300 text-sm mb-4'>{error}</p>
        <button
          onClick={() => navigate('/student/programs')}
          className='text-blue-400 underline text-sm'
        >
          Back to programs
        </button>
      </div>
    </div>
  )

  // ── Results screen (after submission) ──
  if (submitted && score) return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
      <div className='bg-gray-800 rounded-2xl p-8 max-w-lg w-full'>
        <div className='text-center mb-6'>
          <CheckCircle size={48} className='text-green-400 mx-auto mb-3' />
          <h1 className='text-white text-2xl font-bold'>Session Complete!</h1>
          <p className='text-gray-400 text-sm mt-1'>
            {program.title}
          </p>
        </div>

        {/* Score display */}
        <div className='bg-gray-900 rounded-xl p-4 text-center mb-6'>
          <p className='text-5xl font-bold text-white mb-1'>
            {score.correct}/{score.total}
          </p>
          <p className='text-gray-400 text-sm'>
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
                                   ? 'bg-green-900/30 border-green-800'
                                   : 'bg-red-900/30 border-red-800'}`}
              >
                <p className='text-gray-200 text-sm mb-1'>{q.question}</p>
                <p className={`text-xs font-medium
                               ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓ Correct' : `✗ You answered ${studentAns} — correct: ${q.correctAnswer}`}
                </p>
                <p className='text-gray-500 text-xs mt-0.5'>{q.explanation}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/student/dashboard')}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white
                     font-semibold py-2.5 rounded-lg transition-colors text-sm'
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
    <div className='min-h-screen bg-gray-900 py-8 px-4'>
      <div className='max-w-2xl mx-auto'>

        {/* Quiz header */}
        <div className='flex items-center gap-3 mb-6'>
          <BookOpen size={20} className='text-blue-400' />
          <div>
            <h1 className='text-white font-bold'>Viva Quiz</h1>
            <p className='text-gray-400 text-xs'>{program.title}</p>
          </div>
          <span className='ml-auto text-xs text-gray-500'>
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {/* Questions */}
        <div className='space-y-5'>
          {questions.map((q, idx) => (
            <div key={q.id}
                 className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
              <p className='text-gray-200 text-sm font-medium mb-3'>
                <span className='text-blue-400 mr-2'>Q{idx + 1}.</span>
                {q.question}
              </p>
              <div className='space-y-2'>
                {q.options.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(q.id, opt.label)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors border ${
                        answers[q.id] === opt.label
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                  >
                    <span className='font-semibold mr-2'>{opt.label}.</span>
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
          className={`w-full mt-6 py-3 rounded-xl font-semibold text-sm
                       transition-colors
                       ${allAnswered
                           ? 'bg-blue-600 hover:bg-blue-700 text-white'
                           : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
        >
          {allAnswered
            ? 'Submit Quiz'
            : `Answer all questions (${questions.length - answeredCount} remaining)`}
        </button>
      </div>
    </div>
  )
}
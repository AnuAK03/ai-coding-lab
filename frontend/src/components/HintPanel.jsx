// frontend/src/components/HintPanel.jsx
import { useState } from 'react'
import { Lightbulb, X, Loader2, Lock } from 'lucide-react'
import { getHint } from '../services/api'

const HINT_LIMIT = 3

export default function HintPanel({ program, code, hintsUsed, onHintUsed, onClose }) {
  const [hint,       setHint]       = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState('')
  const [hintHistory, setHintHistory] = useState([])

  const hintsRemaining = HINT_LIMIT - hintsUsed
  const isLocked       = hintsUsed >= HINT_LIMIT

  async function handleGetHint() {
    if (isLocked || isLoading) return
    setIsLoading(true)
    setError('')

    try {
      const result = await getHint(
        program.id,
        program.title,
        program.description,
        program.concepts || [],
        code,
        hintsUsed + 1          // hintNumber — 1-indexed
      )

      // Add to history so student can scroll back through hints
      setHintHistory(prev => [...prev, {
        number: hintsUsed + 1,
        text:   result.hint,
      }])

      setHint(result.hint)
      onHintUsed()             // tells Session.jsx to increment hintsUsed

    } catch (err) {
      setError(err.message || 'Could not get hint. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Overlay backdrop
    <div className='fixed inset-0 z-40 flex justify-end'>
      {/* Click backdrop to close */}
      <div
        className='flex-1 bg-black/40'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='w-96 bg-gray-900 border-l border-gray-700
                      flex flex-col h-full shadow-2xl'>

        {/* Panel header */}
        <div className='flex items-center justify-between
                        px-4 py-3 border-b border-gray-700'>
          <div className='flex items-center gap-2'>
            <Lightbulb size={16} className='text-yellow-400' />
            <span className='text-white font-semibold text-sm'>AI Hints</span>
          </div>
          <div className='flex items-center gap-3'>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                              ${isLocked
                                  ? 'bg-red-900 text-red-300'
                                  : 'bg-yellow-900 text-yellow-300'}`}>
              {isLocked ? 'Locked' : `${hintsRemaining} left`}
            </span>
            <button onClick={onClose} className='text-gray-400 hover:text-white'>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Hint history scroll area */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {hintHistory.length === 0 && !isLocked && (
            <div className='text-center py-8'>
              <Lightbulb size={32} className='text-gray-600 mx-auto mb-3' />
              <p className='text-gray-400 text-sm'>
                Stuck? Get a hint to guide your thinking.
              </p>
              <p className='text-gray-600 text-xs mt-1'>
                Hints guide you — they don't give the answer.
              </p>
            </div>
          )}

          {/* Render all previous hints */}
          {hintHistory.map(h => (
            <div key={h.number}
                 className='bg-gray-800 rounded-lg p-3 border border-gray-700'>
              <p className='text-xs text-yellow-400 font-medium mb-1.5'>
                Hint {h.number} of {HINT_LIMIT}
              </p>
              <p className='text-gray-200 text-sm leading-relaxed'>
                {h.text}
              </p>
            </div>
          ))}

          {/* Loading state */}
          {isLoading && (
            <div className='bg-gray-800 rounded-lg p-3 border border-gray-700
                            flex items-center gap-2'>
              <Loader2 size={14} className='text-yellow-400 animate-spin' />
              <span className='text-gray-400 text-sm'>Generating hint...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className='bg-red-900/30 border border-red-800
                            rounded-lg p-3 text-red-300 text-sm'>
              {error}
            </div>
          )}

          {/* Locked state */}
          {isLocked && (
            <div className='bg-gray-800 rounded-lg p-4 border border-gray-700
                            text-center mt-4'>
              <Lock size={24} className='text-gray-500 mx-auto mb-2' />
              <p className='text-gray-400 text-sm'>
                You have used all 3 hints for this session.
              </p>
              <p className='text-gray-600 text-xs mt-1'>
                Try to solve the rest on your own!
              </p>
            </div>
          )}
        </div>

        {/* Get hint button */}
        <div className='p-4 border-t border-gray-700'>
          <button
            onClick={handleGetHint}
            disabled={isLocked || isLoading}
            className={`w-full flex items-center justify-center gap-2
                         text-sm font-semibold py-2.5 rounded-lg transition-colors
                         ${isLocked || isLoading
                             ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                             : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}
          >
            {isLoading ? (
              <><Loader2 size={14} className='animate-spin' /> Thinking...</>
            ) : isLocked ? (
              <><Lock size={14} /> No hints remaining</>
            ) : (
              <><Lightbulb size={14} /> Get Hint {hintsUsed + 1} of {HINT_LIMIT}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
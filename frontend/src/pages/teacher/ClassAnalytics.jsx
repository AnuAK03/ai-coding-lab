// frontend/src/pages/teacher/ClassAnalytics.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ChevronLeft, TrendingUp, AlertCircle, Award } from 'lucide-react'

const TIER_LABEL = {
  excellent:       'Excellent',
  satisfactory:    'Satisfactory',
  needs_attention: 'Needs Attention',
}

export default function ClassAnalytics() {
  const navigate = useNavigate()
  const { theme } = useOutletContext()
  
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

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
    },
    light: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-[#171717]',
      textMuted: 'text-[#737373]',
      textSubtle: 'text-[#A3A3A3]',
      border: 'border-[#E5E5E5]',
      borderSubtle: 'border-[#F5F5F5]',
      cardBg: 'rgba(255, 255, 255, 0.7)',
    }
  }[theme]

  const tierColors = {
    excellent: theme === 'dark' ? '#34D399' : '#10B981',
    satisfactory: theme === 'dark' ? '#FBBF24' : '#F59E0B',
    needs_attention: theme === 'dark' ? '#FB923C' : '#F97316',
  }

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/reports/class')
        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-[calc(100vh-64px)] ${t.bg} flex items-center justify-center transition-colors duration-300`}>
        <p className={t.textMuted}>Loading analytics...</p>
      </div>
    )
  }

  const total = data?.total || 0
  const tiers = data?.tiers || {}

  return (
    <div className={`min-h-[calc(100vh-64px)] ${t.bg} ${t.text} py-12 px-6 transition-colors duration-300`}>
      <div className='max-w-4xl mx-auto'>

        <button
          onClick={() => navigate('/teacher/dashboard')}
          className={`flex items-center gap-1 ${t.textMuted} text-sm mb-6 transition-colors`}
          style={{
            color: theme === 'dark' ? '#A5B4FC' : '#6366F1'
          }}
        >
          <ChevronLeft size={16} strokeWidth={2} /> Back to Dashboard
        </button>

        <div className='mb-8'>
          <h1 className='text-2xl font-semibold mb-1'>Class Analytics</h1>
          <p className={`text-sm ${t.textMuted}`}>
            Aggregated performance across {total} completed session{total !== 1 && 's'}
          </p>
        </div>

        {total === 0 ? (
          <div 
            className={`rounded-lg p-8 text-center border ${t.border}`}
            style={{
              backgroundColor: t.cardBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <p className={t.textMuted}>
              No completed sessions yet. Analytics will appear once students submit labs.
            </p>
          </div>
        ) : (
          <div className='space-y-6'>

            {/* Performance Distribution */}
            <div 
              className={`rounded-lg p-4 border ${t.border}`}
              style={{
                backgroundColor: t.cardBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className='flex items-center gap-2 mb-4'>
                <TrendingUp size={14} style={{ color: theme === 'dark' ? '#60A5FA' : '#3B82F6' }} strokeWidth={2} />
                <h2 className='font-medium text-sm'>
                  Performance Distribution
                </h2>
              </div>
              <div className='space-y-3'>
                {Object.entries(tiers).map(([tier, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={tier}>
                      <div className='flex justify-between text-xs mb-1.5'>
                        <span className={`font-medium ${t.text}`}>
                          {TIER_LABEL[tier] || tier}
                        </span>
                        <span className={t.textMuted}>
                          {count} students ({pct}%)
                        </span>
                      </div>
                      <div 
                        className='h-2 rounded-full overflow-hidden'
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                        }}
                      >
                        <div
                          className='h-full rounded-full transition-all duration-500'
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: tierColors[tier] || (theme === 'dark' ? '#6B7280' : '#9CA3AF')
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-2 gap-4'>
              <div 
                className={`rounded-lg p-4 border ${t.border}`}
                style={{
                  backgroundColor: t.cardBg,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Award size={16} style={{ color: theme === 'dark' ? '#A78BFA' : '#8B5CF6' }} strokeWidth={2} className='mb-3' />
                <p className='text-2xl font-semibold mb-0.5'>
                  {Math.round((data?.avgQuizScore || 0) * 100)}%
                </p>
                <p className={`text-xs uppercase tracking-wide font-medium ${t.textSubtle}`}>
                  Average Quiz Score
                </p>
              </div>
              
              <div 
                className={`rounded-lg p-4 border ${t.border}`}
                style={{
                  backgroundColor: t.cardBg,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <AlertCircle size={16} style={{ color: theme === 'dark' ? '#FB923C' : '#F97316' }} strokeWidth={2} className='mb-3' />
                <p className='text-2xl font-semibold mb-0.5' style={{ color: theme === 'dark' ? '#FB923C' : '#F97316' }}>
                  {data?.flagged || 0}
                </p>
                <p className={`text-xs uppercase tracking-wide font-medium ${t.textSubtle}`}>
                  Flagged Sessions
                </p>
              </div>
            </div>

            {/* Weak Concepts */}
            {data?.topWeaknesses?.length > 0 && (
              <div 
                className={`rounded-lg p-4 border ${t.border}`}
                style={{
                  backgroundColor: t.cardBg,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className='flex items-center gap-2 mb-4'>
                  <AlertCircle size={14} style={{ color: theme === 'dark' ? '#FB923C' : '#F97316' }} strokeWidth={2} />
                  <h2 className='font-medium text-sm'>
                    Most Common Weak Concepts
                  </h2>
                </div>
                <div className='space-y-2'>
                  {data.topWeaknesses.map(([concept, count]) => (
                    <div 
                      key={concept}
                      className='flex items-center justify-between rounded-lg px-3 py-2'
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(251, 146, 60, 0.1)' : 'rgba(249, 115, 22, 0.08)'
                      }}
                    >
                      <span 
                        className='text-sm font-medium capitalize'
                        style={{ color: theme === 'dark' ? '#FCA5A5' : '#DC2626' }}
                      >
                        {concept.replace(/_/g, ' ')}
                      </span>
                      <span 
                        className='text-xs'
                        style={{ color: theme === 'dark' ? '#FB923C' : '#F97316' }}
                      >
                        {count} student{count !== 1 && 's'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${t.textSubtle} mt-3`}>
                  Consider revisiting these topics in your next lecture.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

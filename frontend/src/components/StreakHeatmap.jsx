// frontend/src/components/StreakHeatmap.jsx
// GitHub-style contribution heatmap showing session activity over last 12 weeks

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Loader2 } from 'lucide-react'

export default function StreakHeatmap({ userId, theme = 'dark' }) {
  const [activityData, setActivityData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadActivity() {
      try {
        // Fetch all completed sessions for this student
        const q = query(
          collection(db, 'sessions'),
          where('studentId', '==', userId),
          where('status', '==', 'complete')
        )
        const snap = await getDocs(q)
        
        // Group by date (YYYY-MM-DD format)
        const counts = {}
        snap.docs.forEach(doc => {
          const data = doc.data()
          if (data.startedAt?.seconds) {
            const date = new Date(data.startedAt.seconds * 1000)
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
            counts[dateStr] = (counts[dateStr] || 0) + 1
          }
        })
        
        setActivityData(counts)
      } catch (err) {
        console.error('Failed to load activity:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadActivity()
  }, [userId])

  // Generate grid of last 12 weeks (84 days)
  const generateGrid = () => {
    const today = new Date()
    const grid = []
    
    // Start from 12 weeks ago (84 days)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = activityData[dateStr] || 0
      
      grid.push({
        date: dateStr,
        count,
        dayOfWeek: date.getDay() // 0 = Sunday, 6 = Saturday
      })
    }
    
    return grid
  }

  // Get color intensity based on count
  const getColor = (count) => {
    if (count === 0) {
      return theme === 'dark' 
        ? 'bg-white/5 border-white/10' 
        : 'bg-gray-200/50 border-gray-300/50'
    }
    
    // Accent colors with intensity
    const colors = theme === 'dark' ? {
      1: 'bg-indigo-500/20 border-indigo-400/30',
      2: 'bg-indigo-500/40 border-indigo-400/50',
      3: 'bg-indigo-500/60 border-indigo-400/70',
      4: 'bg-indigo-500/80 border-indigo-400/90'
    } : {
      1: 'bg-indigo-200 border-indigo-300',
      2: 'bg-indigo-300 border-indigo-400',
      3: 'bg-indigo-400 border-indigo-500',
      4: 'bg-indigo-500 border-indigo-600'
    }
    
    // Cap at 4+ sessions
    const intensity = Math.min(count, 4)
    return colors[intensity]
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-32'>
        <Loader2 className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} animate-spin`} size={24} />
      </div>
    )
  }

  const grid = generateGrid()
  
  // Group by weeks (columns)
  const weeks = []
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7))
  }

  return (
    <div className='overflow-x-auto pb-2'>
      <div className='flex gap-0.5 min-w-max'>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className='flex flex-col gap-0.5'>
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm border transition-all duration-200 hover:scale-150 ${getColor(day.count)}`}
                title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className={`flex items-center gap-1.5 mt-3 text-[10px] ${theme === 'dark' ? 'text-[#A1A1A3]' : 'text-[#737373]'}`}>
        <span>Less</span>
        <div className={`w-2.5 h-2.5 rounded-sm border ${getColor(0)}`} />
        <div className={`w-2.5 h-2.5 rounded-sm border ${getColor(1)}`} />
        <div className={`w-2.5 h-2.5 rounded-sm border ${getColor(2)}`} />
        <div className={`w-2.5 h-2.5 rounded-sm border ${getColor(3)}`} />
        <div className={`w-2.5 h-2.5 rounded-sm border ${getColor(4)}`} />
        <span>More</span>
      </div>
    </div>
  )
}

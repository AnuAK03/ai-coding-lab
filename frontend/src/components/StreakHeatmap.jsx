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
        ? 'bg-[#161b22] border-white/5' 
        : 'bg-[#ebedf0] border-black/5'
    }
    
    // Accent colors with intensity (GitHub green)
    const colors = theme === 'dark' ? {
      1: 'bg-[#0e4429] border-transparent',
      2: 'bg-[#006d32] border-transparent',
      3: 'bg-[#26a641] border-transparent',
      4: 'bg-[#39d353] border-transparent'
    } : {
      1: 'bg-[#9be9a8] border-transparent',
      2: 'bg-[#40c463] border-transparent',
      3: 'bg-[#30a14e] border-transparent',
      4: 'bg-[#216e39] border-transparent'
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
      <div className='flex gap-1 min-w-max'>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className='flex flex-col gap-1'>
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-4 h-4 rounded-sm border transition-all duration-200 hover:scale-125 ${getColor(day.count)}`}
                title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className={`flex items-center gap-1.5 mt-4 text-[11px] ${theme === 'dark' ? 'text-[#A1A1A3]' : 'text-[#737373]'}`}>
        <span>Less</span>
        <div className={`w-4 h-4 rounded-sm border ${getColor(0)}`} />
        <div className={`w-4 h-4 rounded-sm border ${getColor(1)}`} />
        <div className={`w-4 h-4 rounded-sm border ${getColor(2)}`} />
        <div className={`w-4 h-4 rounded-sm border ${getColor(3)}`} />
        <div className={`w-4 h-4 rounded-sm border ${getColor(4)}`} />
        <span>More</span>
      </div>
    </div>
  )
}

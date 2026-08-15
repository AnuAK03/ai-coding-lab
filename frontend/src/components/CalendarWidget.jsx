// frontend/src/components/CalendarWidget.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget() {
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'short' });
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Dummy data for calendar days (just mock it for aesthetic)
  const calendarDays = [
    { date: 29, isPrevMonth: true }, { date: 30, isPrevMonth: true }, 
    { date: 1 }, { date: 2 }, { date: 3, dots: 1 }, { date: 4, dots: 2 }, { date: 5 },
    { date: 6 }, { date: 7 }, { date: 8 }, { date: 9 }, { date: 10, dots: 2 }, { date: 11 }, { date: 12 },
    { date: 13 }, { date: 14, dots: 2 }, { date: 15, dots: 2 }, { date: 16, isCurrent: true }, { date: 17 }, { date: 18 }, { date: 19 },
    { date: 20 }, { date: 21, dots: 2 }, { date: 22, dots: 2 }, { date: 23 }, { date: 24 }, { date: 25 }, { date: 26 },
    { date: 27 }, { date: 28 }, { date: 29 }, { date: 30 }, { date: 31 }, { date: 1, isNextMonth: true }, { date: 2, isNextMonth: true }
  ];

  return (
    <div className='bg-white rounded-[24px] p-6 border border-outline-variant/30 shadow-sm flex flex-col h-full'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-headline-md text-sm font-bold text-gray-800'>Coding Stats</h3>
      </div>
      
      <div className='flex items-center justify-between mb-4 px-2'>
        <button className='text-gray-400 hover:text-gray-700 transition-colors'>
          <ChevronLeft size={16} />
        </button>
        <span className='text-[13px] font-bold text-gray-700 tracking-wide'>
          {currentMonth} {currentYear}
        </span>
        <button className='text-gray-400 hover:text-gray-700 transition-colors'>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className='grid grid-cols-7 gap-y-3 gap-x-1 text-center w-full mt-2'>
        {/* Days Header */}
        {daysOfWeek.map(day => (
          <div key={day} className='text-[11px] font-semibold text-gray-400'>
            {day}
          </div>
        ))}

        {/* Dates */}
        {calendarDays.map((dayObj, index) => (
          <div key={index} className='flex flex-col items-center justify-start h-8'>
            <div 
              className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium transition-all
                ${dayObj.isPrevMonth || dayObj.isNextMonth ? 'text-gray-300' : 'text-gray-600'}
                ${dayObj.isCurrent ? 'bg-[#73b694] text-white shadow-sm' : 'hover:bg-gray-100 cursor-pointer'}
              `}
            >
              {dayObj.date}
            </div>
            {dayObj.dots > 0 && (
              <div className='flex gap-0.5 mt-0.5'>
                {Array.from({ length: dayObj.dots }).map((_, i) => (
                  <div key={i} className='w-1 h-1 rounded-full bg-[#73b694]'></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// frontend/src/components/CalendarWidget.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getAuth } from 'firebase/auth';

export default function CalendarWidget({ userId }) {
  const authUser = getAuth().currentUser;
  const activeUserId = userId || authUser?.uid;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityMap, setActivityMap] = useState({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11
  const today = new Date();
  const isCurrentMonthView = today.getFullYear() === year && today.getMonth() === month;
  const actualTodayDate = today.getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'short' });
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Real-time Firestore session listener for calendar dots
  useEffect(() => {
    if (!activeUserId) return;

    const q = query(
      collection(db, 'sessions'),
      where('studentId', '==', activeUserId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const counts = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        const rawDate = data.startedAt || data.submittedAt;
        if (rawDate) {
          let dateObj;
          if (rawDate.seconds) {
            dateObj = new Date(rawDate.seconds * 1000);
          } else if (rawDate.toDate) {
            dateObj = rawDate.toDate();
          } else {
            dateObj = new Date(rawDate);
          }
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
            counts[dateStr] = (counts[dateStr] || 0) + 1;
          }
        }
      });
      setActivityMap(counts);
    }, (err) => {
      console.warn('CalendarWidget session listener error:', err);
    });

    return () => unsubscribe();
  }, [activeUserId]);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build real calendar grid
  const buildCalendarDays = () => {
    const days = [];

    // First day of current month (Mon = 0, Sun = 6)
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        isPrevMonth: true,
        isCurrent: false,
        dots: 0,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${mStr}-${dStr}`;
      const count = activityMap[dateKey] || 0;
      const isToday = isCurrentMonthView && day === actualTodayDate;

      days.push({
        date: day,
        isPrevMonth: false,
        isNextMonth: false,
        isCurrent: isToday,
        dots: Math.min(2, count),
      });
    }

    // 3. Next month leading days to complete grid rows
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        date: i,
        isNextMonth: true,
        isCurrent: false,
        dots: 0,
      });
    }

    return days;
  };

  const calendarDays = buildCalendarDays();

  return (
    <div className='bg-white rounded-[24px] p-6 border border-outline-variant/30 shadow-sm flex flex-col h-full'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-headline-md text-sm font-bold text-gray-800'>Coding Stats</h3>
      </div>
      
      <div className='flex items-center justify-between mb-4 px-2'>
        <button onClick={prevMonth} className='text-gray-400 hover:text-gray-700 transition-colors p-1'>
          <ChevronLeft size={16} />
        </button>
        <span className='text-[13px] font-bold text-gray-700 tracking-wide'>
          {monthName} {year}
        </span>
        <button onClick={nextMonth} className='text-gray-400 hover:text-gray-700 transition-colors p-1'>
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
                ${dayObj.isCurrent ? 'bg-[#73b694] text-white shadow-sm font-bold' : 'hover:bg-gray-100 cursor-pointer'}
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

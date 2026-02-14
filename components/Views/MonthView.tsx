
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getDayId, getComputedActivities } from '../../utils';
import { BookTemplate, RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProtocolContextMenu } from '../ProtocolContextMenu';
import { MiniTimeline } from '../MiniTimeline';
import { Button } from '../UI';

export const MonthView: React.FC = () => {
  const { setSelectedDate, setView, days, protocols } = useStore();
  const [menuState, setMenuState] = useState<{ dateId: string; x: number; y: number } | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  // Logic to fill the grid with prev/current/next days
  const calendarDays = React.useMemo(() => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDayOfWeek = firstDay.getDay(); // 0 = Sun
      const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0 = Mon
      
      const daysArr = [];
      
      // Previous Month Days
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for(let i = adjustedStartDay - 1; i >= 0; i--) {
          const d = new Date(year, month - 1, prevMonthLastDay - i);
          daysArr.push({ date: d, isCurrentMonth: false });
      }
      
      // Current Month Days
      const daysInCurrentMonth = lastDay.getDate();
      for(let i = 1; i <= daysInCurrentMonth; i++) {
          daysArr.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }
      
      // Next Month Days (Fill to 35 or 42)
      const remaining = 42 - daysArr.length;
      for(let i = 1; i <= remaining; i++) {
          daysArr.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
      
      return daysArr;
  }, [year, month]);

  const todayId = getDayId(new Date());

  const handleActionClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuState({ dateId: id, x: e.clientX, y: e.clientY });
  };
  
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuState({ dateId: id, x: e.clientX, y: e.clientY });
  };
  
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const jumpToToday = () => setViewDate(new Date());

  return (
    // RESTORED PADDING: py-20, UPDATED desktop px to lg:px-20
    <div className="w-full max-w-[1920px] mx-auto py-20 px-8 lg:px-20 min-h-full" onClick={() => setMenuState(null)}>
      {/* Header with Navigation */}
      <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="text-left">
            <h2 className="type-h1 lg:type-display text-white mb-4">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="type-label text-zinc-500">Temporal Grid Overview</p>
        </div>
        
        <div className="flex gap-4">
             <Button variant="secondary" size="icon" onClick={prevMonth} icon={<ChevronLeft />} />
             <Button variant="secondary" size="md" onClick={jumpToToday}>Today</Button>
             <Button variant="secondary" size="icon" onClick={nextMonth} icon={<ChevronRight />} />
        </div>
      </div>

      {/* Grid: 3 cols on mobile, 7 on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-px bg-white/5 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl mb-32">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="bg-zinc-900 p-6 type-label text-zinc-500 text-center border-b border-white/5 hidden md:block">
            {d}
          </div>
        ))}
        
        {calendarDays.map(({ date, isCurrentMonth }, i) => {
          const id = getDayId(date);
          const isToday = id === todayId;
          const computedActivities = getComputedActivities(days, protocols, id);
          const isEmpty = computedActivities.length === 0;
          
          return (
            <motion.div
              key={`${id}-${i}`}
              onClick={() => {
                setSelectedDate(id);
                setView('DAY');
              }}
              onContextMenu={(e) => handleContextMenu(e, id)}
              // Increased height: h-48 sm:h-56
              className={`group relative h-48 sm:h-56 p-6 flex flex-col justify-between cursor-pointer transition-colors hover:bg-white/5 ${
                !isCurrentMonth ? 'bg-zinc-950/50' : 'bg-zinc-900'
              } ${isToday ? 'ring-inset ring-2 ring-cyan-500/50' : ''}`}
            >
              <div className="flex justify-between items-start z-10 mb-4 relative">
                <span className={`type-mono-body tabular-nums ${
                    isToday ? 'text-cyan-400' : isCurrentMonth ? 'text-zinc-400' : 'text-zinc-700'
                }`}>
                  {date.getDate().toString().padStart(2, '0')}
                </span>
                
                {/* ACTION BUTTON (Only valid if current month or relevant) */}
                {isCurrentMonth && (
                    <button 
                        onClick={(e) => handleActionClick(e, id)}
                        className={`absolute top-0 right-0 p-2 lg:p-3 rounded-full border transition-all z-20 md:opacity-0 md:group-hover:opacity-100 ${
                            isEmpty 
                            ? 'bg-zinc-800 border-white/10 text-zinc-400' 
                            : 'bg-zinc-900/80 border-white/5 text-zinc-600'
                        }`}
                    >
                        {isEmpty ? <Plus className="w-4 h-4 md:w-5 md:h-5" /> : <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                )}
              </div>
              
              <div className={`mt-auto pointer-events-none w-full pb-6 pt-4 ${!isCurrentMonth ? 'opacity-30 grayscale' : ''}`}>
                <MiniTimeline activities={computedActivities} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <ProtocolContextMenu 
        isOpen={!!menuState} 
        onClose={() => setMenuState(null)} 
        targetDate={menuState?.dateId || ''} 
        coords={menuState ? { x: menuState.x, y: menuState.y } : null} 
      />
    </div>
  );
};

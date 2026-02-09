
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getDayId, getComputedActivities } from '../../utils';
import { BookTemplate } from 'lucide-react';
import { ProtocolContextMenu } from '../ProtocolContextMenu';
import { MiniTimeline } from '../MiniTimeline';

export const MonthView: React.FC = () => {
  const { setSelectedDate, setView, days, protocols } = useStore();
  const [menuState, setMenuState] = useState<{ dateId: string; x: number; y: number } | null>(null);

  const currentMonth = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthDays = React.useMemo(() => {
    const res = [];
    for (let i = 0; i < adjustedFirstDay; i++) res.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      res.push(new Date(year, month, i));
    }
    return res;
  }, [year, month, daysInMonth, adjustedFirstDay]);

  const todayId = getDayId(new Date());

  const handleBlueprintClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuState({ dateId: id, x: e.clientX, y: e.clientY });
  };
  
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuState({ dateId: id, x: e.clientX, y: e.clientY });
  };

  return (
    // STRICT: px-8 = 2rem = 16px (since root font is 8px)
    <div className="w-full max-w-[1920px] mx-auto py-12 px-8 min-h-full" onClick={() => setMenuState(null)}>
      {/* Unified Header Style: Left Aligned */}
      <div className="mb-16 text-left">
        <h2 className="type-h1 lg:type-display text-white mb-4">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <p className="type-label text-zinc-500">Temporal Grid Overview</p>
      </div>

      {/* Grid: 3 cols on mobile, 7 on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-px bg-white/5 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl mb-32">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="bg-zinc-900 p-6 type-label text-zinc-500 text-center border-b border-white/5 hidden md:block">
            {d}
          </div>
        ))}
        
        {monthDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-zinc-900/30 hidden md:block" />;
          
          const id = getDayId(date);
          const isToday = id === todayId;
          const isFuture = id > todayId;
          const computedActivities = getComputedActivities(days, protocols, id);
          
          return (
            <motion.div
              key={id}
              onClick={() => {
                setSelectedDate(id);
                setView('DAY');
              }}
              onContextMenu={(e) => handleContextMenu(e, id)}
              // Increased height: h-48 sm:h-56
              className={`group relative bg-zinc-900 h-48 sm:h-56 p-6 flex flex-col justify-between cursor-pointer transition-colors hover:bg-white/5 ${
                isToday ? 'ring-inset ring-2 ring-cyan-500/50' : ''
              }`}
            >
              <div className="flex justify-between items-start z-10 mb-4">
                {/* Added font-mono for numbers */}
                <span className={`type-mono-body tabular-nums ${isToday ? 'text-cyan-400' : 'text-zinc-400'}`}>
                  {date.getDate().toString().padStart(2, '0')}
                </span>
                
                {isFuture && (
                  <button 
                    onClick={(e) => handleBlueprintClick(e, id)}
                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-3 bg-zinc-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-zinc-500 rounded-xl transition-all border border-white/5 z-20"
                    title="Load Blueprint"
                  >
                    <BookTemplate className="w-6 h-6" />
                  </button>
                )}
              </div>
              
              {/* INCREASED PADDING: pb-6 pt-4 for timeline block */}
              <div className="mt-auto pointer-events-none w-full pb-6 pt-4">
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

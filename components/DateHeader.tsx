
import React from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { useStore } from '../store';
import { getDayId } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

export const DateHeader: React.FC = () => {
  const { selectedDate, setSelectedDate, userConfig } = useStore();
  const t = useTranslation();
  
  const todayId = getDayId(new Date());
  const isToday = selectedDate === todayId;
  const isFuture = selectedDate > todayId;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayId);
  };

  // Format Date using locale
  const dateObj = new Date(selectedDate);
  const lang = userConfig.language === 'ru' ? 'ru-RU' : 'en-US';
  const formattedDate = dateObj.toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    // STRICT: p-4 (8px visual padding due to 8px rem root), rounded-[2rem]
    <div className="w-full flex items-center justify-between bg-zinc-900/80 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 shadow-xl z-50 relative">
       {/* Button: w-20 h-20 (40px) */}
       <button onClick={handlePrevDay} className="w-20 h-20 flex items-center justify-center rounded-2xl active:bg-white/10 text-zinc-400 hover:text-white transition-colors relative z-20 hover:bg-white/5">
         {/* w-12 = 3rem = 24px */}
         <ChevronLeft className="w-12 h-12" />
       </button>
       
       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
         {/* Date: type-mono-sm (12px) */}
         <span className="type-mono-sm text-white tabular-nums">{formattedDate}</span>
         {/* Subtitle: type-caption (10px) */}
         <span className={`type-caption mt-1 ${isToday ? 'text-cyan-400' : isFuture ? 'text-purple-400' : 'text-zinc-500'}`}>
            {isToday ? t.views.live_sync : isFuture ? t.views.future_state : t.views.archive}
         </span>
       </div>

       {/* Right Side Controls */}
       <div className="flex items-center gap-4 relative z-20">
          <button 
             onClick={handleJumpToToday} 
             className={`w-20 h-20 flex items-center justify-center rounded-2xl transition-all ${isToday ? 'text-cyan-500 bg-cyan-500/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`} 
             title="Jump to Today"
           >
             <Target className="w-12 h-12" />
           </button>
           <button onClick={handleNextDay} className="w-20 h-20 flex items-center justify-center rounded-2xl active:bg-white/10 text-zinc-400 hover:text-white transition-colors hover:bg-white/5">
             <ChevronRight className="w-12 h-12" />
           </button>
       </div>
    </div>
  );
};

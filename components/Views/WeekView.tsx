
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getDayId, getComputedActivities } from '../../utils';
import { MiniTimeline } from '../MiniTimeline';
import { BookTemplate, RefreshCw, Plus } from 'lucide-react';
import { ProtocolContextMenu } from '../ProtocolContextMenu';
import { useTranslation } from '../../hooks/useTranslation';

export const WeekView: React.FC = () => {
  const { setSelectedDate, setView, days, protocols, userConfig } = useStore();
  const [menuState, setMenuState] = useState<{ dateId: string; x: number; y: number } | null>(null);
  const t = useTranslation();
  
  const horizonDays = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    
    for (let i = 0; i < 8; i++) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return dates;
  }, []);

  const handleSetup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuState({ dateId: id, x: e.clientX, y: e.clientY });
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuState({ dateId: id, x: e.clientX, y: e.clientY });
  };
  
  const lang = userConfig.language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    // CHANGED: Added flex flex-col and pb-40 (80px) to outer container to handle layout and spacing
    <div className="w-full max-w-[1920px] mx-auto pt-20 px-8 lg:px-20 min-h-full flex flex-col pb-40" onClick={() => setMenuState(null)}>
      {/* Unified Header Style: Left Aligned */}
      <div className="mb-8 lg:mb-12 text-left shrink-0">
        <h2 className="type-h1 lg:type-display mb-4 text-white">{t.views.day_horizon}</h2>
        <p className="type-label text-zinc-500">{t.views.neural_pipeline}</p>
      </div>

      {/* Grid: Added flex-1 to fill remaining space, removed pb-40 from here */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 flex-1">
        {horizonDays.map((date, i) => {
          const id = getDayId(date);
          const computedActivities = getComputedActivities(days, protocols, id);
          const todayId = getDayId(new Date());
          const isToday = id === todayId;
          const isEmpty = computedActivities.length === 0;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                setSelectedDate(id);
                setView('DAY');
              }}
              onContextMenu={(e) => handleContextMenu(e, id)}
              // Styles: min-h-[240px] kept as safe minimum, h-full allows stretching
              className={`group relative flex flex-col items-center h-full min-h-[240px] p-6 lg:p-8 rounded-[3rem] border transition-all overflow-hidden cursor-pointer ${
                isToday 
                  ? 'bg-zinc-900 border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.1)] scale-105 z-10' 
                  : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
              }`}
            >
              {/* MOBILE TOP-RIGHT ACTION BUTTON (Hidden on Desktop) */}
              <button
                    onClick={(e) => handleSetup(e, id)}
                    className={`md:hidden absolute top-6 right-6 p-3 rounded-full border transition-all z-20 ${
                        isEmpty 
                        ? 'bg-zinc-800 border-white/10 text-zinc-400' 
                        : 'bg-zinc-900/80 border-white/5 text-zinc-600'
                    }`}
                >
                    {isEmpty ? <Plus className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
              </button>

              <div className="text-center relative z-10 pointer-events-none mt-2 lg:mt-6">
                <span className={`type-h3 block mb-4 uppercase ${isToday ? 'text-cyan-400' : 'text-zinc-600'}`}>
                  {date.toLocaleDateString(lang, { weekday: 'short' })}
                </span>
                {/* Smaller Date Number - type-mono-display (48px) */}
                <span className={`type-mono-display leading-none tabular-nums ${isToday ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                  {date.getDate()}
                </span>
                
                {days[id]?.protocolId && (
                   <div className="mt-8 flex justify-center">
                     <span className={`px-6 py-2 rounded-full type-label flex items-center gap-3 uppercase ${isToday ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                       {isToday && <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />}
                       {t.protocol.synced}
                     </span>
                   </div>
                )}
              </div>

              {/* DESKTOP BOTTOM ACTION BUTTON (Hidden on Mobile) */}
              <div className="flex-1 w-full flex items-end justify-center relative z-10 mt-auto pb-8 hidden md:flex">
                   <motion.button 
                    onClick={(e) => handleSetup(e, id)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all shadow-lg ${
                      isEmpty 
                        ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-700' 
                        : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {isEmpty ? <BookTemplate className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                    <span className="type-body font-bold">{isEmpty ? t.protocol.assign : t.views.change}</span>
                  </motion.button>
              </div>

              {/* INCREASED PADDING: pt-10 and pb-6 for timeline block */}
              <div className="w-full relative z-10 pt-10 pb-6 border-t border-white/5 mt-auto">
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

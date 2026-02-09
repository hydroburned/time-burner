
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { CheckCircle2, Zap, Flame, Edit2, Clock, Layers, Moon } from 'lucide-react';
import { Activity } from '../types';
import { useStore } from '../store';
import { getEndTime, isActivityInFuture, timeToMinutes } from '../utils';
import { COLORS, TAG_CONFIG } from '../constants';

interface SlotListProps {
  activities: Activity[];
  selectedDate: string;
  onEdit: (activity: Activity) => void;
  onHover?: (id: string | null) => void;
  hoveredId?: string | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onOpenContext?: (activity: Activity) => void;
}

interface SlotItemProps {
    activity: Activity;
    selectedDate: string;
    isMobile: boolean;
    currentMins: number;
    hoveredId?: string | null;
    selectedId?: string | null;
    onEdit: (activity: Activity) => void;
    onHover?: (id: string | null) => void;
    onSelect?: (id: string) => void;
    handleToggle: (activity: Activity) => void;
}

const SlotItem: React.FC<SlotItemProps> = ({
    activity,
    selectedDate,
    isMobile,
    currentMins,
    hoveredId,
    selectedId,
    onEdit,
    onHover,
    onSelect,
    handleToggle
}) => {
    // Swipe State
    const x = useMotionValue(0);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (!isMobile) return;
        
        // Swipe Left threshold
        if (info.offset.x < -60) {
            onEdit(activity);
        }
    };

    const handleIconClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!activity.id.startsWith('virtual-')) handleToggle(activity);
    };
    
    // DESKTOP Edit Handler (Button Click)
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(activity);
    };

    const handleBodyClick = () => {
        // Desktop selection
        if (!isMobile && onSelect) {
            onSelect(activity.id);
        }
    };

    const endTime = getEndTime(activity.startTime, activity.duration);
    const startMins = timeToMinutes(activity.startTime);
    const endMins = startMins + activity.duration;
    const isVirtual = activity.id.startsWith('virtual-');
    const isHovered = hoveredId === activity.id;
    const isSelected = selectedId === activity.id;
    
    const isActive = !isVirtual && selectedDate === new Date().toISOString().split('T')[0] && 
                     currentMins >= startMins && currentMins < endMins;
    
    const isFuture = isActivityInFuture(selectedDate, activity.startTime);
    
    // Visual State Logic
    let opacityClass = 'opacity-100';
    let bgClass = 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80';
    let textClass = 'text-zinc-300';
    let buttonStyle = 'bg-zinc-950 border-white/10 group-hover:border-white/20 active:scale-90';

    if (isVirtual) {
      opacityClass = 'opacity-50';
      bgClass = 'bg-zinc-950/30 border-white/5 border-dashed';
    } else {
       if (isActive) {
           bgClass = 'bg-zinc-800 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)]';
           textClass = 'text-white';
           buttonStyle = `bg-zinc-950 border-white/20 shadow-lg scale-105`;
       } else if (isFuture) {
           bgClass = 'bg-zinc-900/20 border-white/5'; 
           textClass = 'text-zinc-500';
           opacityClass = 'opacity-50 hover:opacity-100';
       }

       if (activity.completed) {
           bgClass = isActive ? bgClass : 'bg-zinc-900/80 border-cyan-500/20'; 
           textClass = 'text-zinc-200 line-through decoration-zinc-500';
           opacityClass = 'opacity-90';
           buttonStyle = 'bg-cyan-500 border-cyan-500 scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
       }
       
       if (isSelected) {
          bgClass = 'bg-zinc-800 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]';
          if (!isActive && !activity.completed) textClass = 'text-white';
       }

       if (isHovered && !isSelected && !isMobile) {
          bgClass = `${bgClass.split(' ')[0]} border-white/20 bg-zinc-800 shadow-xl scale-[1.02] z-20`;
       }
    }

    return (
        <div className="relative group overflow-visible">
            {/* SWIPE ACTION LAYER (Mobile Only) */}
            {isMobile && !isVirtual && (
                <div className="absolute inset-0 flex items-center justify-end px-8 z-0">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <span className="type-label">Edit</span>
                        <Edit2 className="w-6 h-6" />
                    </div>
                </div>
            )}

            {/* MAIN CARD */}
            <motion.div
                layout
                // Mobile Swipe Config
                drag={isMobile && !isVirtual ? "x" : false}
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                
                onClick={handleBodyClick}
                onMouseEnter={() => !isMobile && onHover && onHover(activity.id)}
                onMouseLeave={() => !isMobile && onHover && onHover(null)}
                
                className={`relative z-10 flex items-center gap-6 md:gap-10 p-6 rounded-[3rem] border transition-all duration-300 select-none overflow-hidden ${opacityClass} ${bgClass} ${!isVirtual ? 'cursor-pointer' : ''}`}
            >
                 {/* Status Icon */}
                <div 
                    onClick={handleIconClick}
                    className={`flex-shrink-0 w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all border relative z-10 ${buttonStyle}`}
                >
                {activity.completed ? (
                    <CheckCircle2 className="w-10 h-10 text-black" />
                ) : (
                    <div className="flex items-center justify-center pointer-events-none">
                    {activity.type === 'BURN' && <Flame className={`w-10 h-10 ${isActive ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : isFuture ? 'text-zinc-600' : 'text-orange-500'}`} />}
                    {activity.type === 'FUEL' && <Zap className={`w-10 h-10 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : isFuture ? 'text-zinc-600' : 'text-cyan-500'}`} />}
                    {activity.type === 'REST' && <Moon className={`w-10 h-10 ${isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : isFuture ? 'text-zinc-600' : 'text-purple-500'}`} />}
                    {activity.type === 'VOID' && <Clock className={`w-10 h-10 ${isActive ? 'text-white' : isFuture ? 'text-zinc-600' : 'text-zinc-500'}`} />}
                    </div>
                )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-1 relative z-10">
                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                        <span className={`type-mono-sm tabular-nums ${isActive || isHovered || isSelected ? 'text-white' : 'text-zinc-500'}`}>
                        {activity.startTime} - {endTime} 
                        </span>
                        
                        {/* TAGS ROW */}
                        <div className="flex items-center gap-2">
                            {activity.priority && (
                            <span className={`type-caption px-3 h-8 flex items-center rounded-full border ${TAG_CONFIG.Core.bg} ${TAG_CONFIG.Core.border} ${TAG_CONFIG.Core.text}`}>
                                Core
                            </span>
                            )}
                            {activity.tags?.map(tag => {
                            const config = TAG_CONFIG[tag] || { bg: 'bg-zinc-800', border: 'border-white/5', text: 'text-zinc-400' };
                            return (
                                <span key={tag} className={`type-caption px-3 h-8 flex items-center rounded-full border ${config.bg} ${config.border} ${config.text}`}>
                                {tag}
                                </span>
                            );
                            })}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pr-12">
                        <div 
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                        style={{ backgroundColor: COLORS[activity.type] }}
                        />
                        <h3 className={`type-body font-bold truncate ${textClass}`}>
                        {activity.title}
                        </h3>
                    </div>
                </div>

                {/* DESKTOP HOVER EDIT BUTTON */}
                {!isMobile && !isVirtual && (
                    <button 
                        onClick={handleEditClick}
                        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-zinc-800 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all z-20"
                        title="Edit Slot"
                    >
                        <Edit2 className="w-6 h-6" />
                    </button>
                )}
            </motion.div>
        </div>
    );
}

export const SlotList: React.FC<SlotListProps> = ({ 
  activities, 
  selectedDate, 
  onEdit, 
  onHover, 
  hoveredId, 
  selectedId,
  onSelect,
  onOpenContext
}) => {
  const toggleActivity = useStore((state) => state.toggleActivity);

  const sortedActivities = [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  const handleToggle = (activity: Activity) => {
    // Virtual slots are read-only
    if (activity.id.startsWith('virtual-')) return;
    
    // Allow toggle anytime (removed isFuture check based on previous request)
    
    // Haptic Feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
    }
    
    toggleActivity(selectedDate, activity.id);
  };

  return (
    // Gap 16px (2rem -> gap-8)
    <div className="flex flex-col gap-8 pb-40 lg:pb-12 overflow-x-hidden">
      <AnimatePresence initial={false}>
        {sortedActivities.map((activity) => (
            <SlotItem
                key={activity.id}
                activity={activity}
                selectedDate={selectedDate}
                isMobile={isMobile}
                currentMins={currentMins}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onEdit={onEdit}
                onHover={onHover}
                onSelect={onSelect}
                handleToggle={handleToggle}
            />
        ))}
      </AnimatePresence>
      
      {sortedActivities.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-zinc-900/10">
          <Layers className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
          <p className="type-body text-zinc-500 uppercase">Grid Offline</p>
        </div>
      )}
    </div>
  );
};

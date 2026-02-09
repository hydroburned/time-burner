
import React from 'react';
import { Activity } from '../types';
import { COLORS } from '../constants';
import { timeToMinutes } from '../utils';

interface MiniTimelineProps {
  activities: Activity[];
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({ activities }) => {
  // Create 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHourColor = (h: number) => {
    const activity = activities.find(a => {
      const startMin = timeToMinutes(a.startTime);
      const endMin = startMin + a.duration;
      const hourMin = h * 60;
      return hourMin >= startMin && hourMin < endMin;
    });

    if (!activity) return 'bg-white/5';
    
    // Updated Logic: Pale for Assigned, Bright for Completed
    if (activity.type === 'BURN') {
        return activity.completed ? 'bg-orange-500' : 'bg-orange-500/20';
    }
    if (activity.type === 'FUEL') {
        return activity.completed ? 'bg-cyan-500' : 'bg-cyan-500/20';
    }
    if (activity.type === 'REST') {
        return activity.completed ? 'bg-purple-500' : 'bg-purple-500/20';
    }
    if (activity.type === 'VOID') {
        return activity.completed ? 'bg-zinc-300' : 'bg-zinc-600/30';
    }
    
    return 'bg-white/10';
  };

  return (
    // STRICT: w-full, gap increased to gap-2 (4px/8px scale -> 8-16px visual spacing)
    <div className="flex flex-col gap-2 w-full mx-auto opacity-100 transition-opacity">
      {/* Row 1: 00:00 - 11:00 */}
      {/* h-[1.5rem] = 12px, gap-[0.5rem] = 4px */}
      <div className="flex gap-[0.5rem] h-[1.5rem] w-full">
        {hours.slice(0, 12).map(h => (
          <div key={h} className={`flex-1 rounded-full ${getHourColor(h)}`} />
        ))}
      </div>
      {/* Row 2: 12:00 - 23:00 */}
      <div className="flex gap-[0.5rem] h-[1.5rem] w-full">
        {hours.slice(12, 24).map(h => (
          <div key={h} className={`flex-1 rounded-full ${getHourColor(h)}`} />
        ))}
      </div>
    </div>
  );
};

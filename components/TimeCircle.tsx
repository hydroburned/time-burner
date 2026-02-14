
import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from '../types';
import { COLORS } from '../constants';
import { describeArc, timeToMinutes, getDayId } from '../utils';

interface TimeCircleProps {
  activities: Activity[];
  onSelectSlot: (activity: Activity) => void;
  size?: number;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  selectedDate: string;
}

export const TimeCircle: React.FC<TimeCircleProps> = ({ 
  activities, 
  onSelectSlot, 
  size = 320, 
  hoveredId, 
  onHover,
  selectedDate
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const radius = size / 2 - 24; 
  const centerX = size / 2;
  const centerY = size / 2;
  const degPerMin = 360 / 1440;
  const GAP_ANGLE = 0.5;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = selectedDate === getDayId(new Date());

  const activeActivity = useMemo(() => {
    return activities.find(a => {
      const start = timeToMinutes(a.startTime);
      const end = start + a.duration;
      return currentMinutes >= start && currentMinutes < end;
    });
  }, [activities, currentMinutes]);

  const slots = useMemo(() => {
    return activities.map((activity) => {
      const startMin = timeToMinutes(activity.startTime);
      let startAngle = startMin * degPerMin;
      let endAngle = (startMin + activity.duration) * degPerMin;
      
      if (activity.duration > 15) {
         endAngle -= GAP_ANGLE;
      }
      
      const isActive = activeActivity?.id === activity.id;
      const isHovered = hoveredId === activity.id;
      
      return {
        ...activity,
        startAngle,
        endAngle,
        isActive,
        isHovered,
        path: describeArc(centerX, centerY, radius, startAngle, endAngle),
      };
    });
  }, [activities, centerX, centerY, radius, degPerMin, activeActivity, hoveredId]);

  const currentTimeAngle = currentMinutes * degPerMin;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Removed -rotate-180 to make 00:00 Top and 12:00 Bottom */}
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#18181b" 
            strokeWidth="20"
          />
          
          {/* Hour Markers (Ticks Only) */}
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1={centerX + (radius + 20) * Math.cos(((i * 15 - 90) * Math.PI) / 180)}
              y1={centerY + (radius + 20) * Math.sin(((i * 15 - 90) * Math.PI) / 180)}
              x2={centerX + (radius + 28) * Math.cos(((i * 15 - 90) * Math.PI) / 180)}
              y2={centerY + (radius + 28) * Math.sin(((i * 15 - 90) * Math.PI) / 180)}
              stroke={i % 6 === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}
              strokeWidth={i % 6 === 0 ? "3" : "1"}
            />
          ))}

          {/* Activity Slots */}
          {slots.map((slot) => {
             let strokeColor = COLORS[slot.type];
             let opacity = 0.3;
             let filter = 'none';
             let strokeWidth = 18; // Slightly thinner default for elegance

             if (slot.isActive || slot.isHovered) {
               opacity = 1;
               strokeWidth = slot.isHovered ? 26 : 22;
               filter = `drop-shadow(0 0 15px ${COLORS[slot.type]})`;
             } else if (slot.completed) {
               opacity = 0.9;
             } else {
               opacity = 0.2; 
             }

             return (
              <motion.path
                key={slot.id}
                d={slot.path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="butt" 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity, 
                  strokeWidth,
                  filter
                }}
                whileHover={{ 
                  strokeWidth: 26, 
                  opacity: 1, 
                  cursor: 'pointer',
                  filter: `drop-shadow(0 0 8px ${COLORS[slot.type]})`
                }}
                onMouseEnter={() => onHover && onHover(slot.id)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={() => onSelectSlot(slot)}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Current Time Indicator - Only show if it is today */}
          {isToday && (
            <>
              <motion.line
                x1={centerX}
                y1={centerY}
                x2={centerX + (radius + 14) * Math.cos(((currentTimeAngle - 90) * Math.PI) / 180)}
                y2={centerY + (radius + 14) * Math.sin(((currentTimeAngle - 90) * Math.PI) / 180)}
                stroke="#fff"
                strokeWidth="2"
                strokeDasharray="4 4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <circle 
                cx={centerX + (radius + 14) * Math.cos(((currentTimeAngle - 90) * Math.PI) / 180)}
                cy={centerY + (radius + 14) * Math.sin(((currentTimeAngle - 90) * Math.PI) / 180)}
                r="3"
                fill="#fff"
              />
            </>
          )}
        </svg>

        {/* Center Time Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-20">
          {/* type-mono-display (48px) */}
          <span className="type-mono-display text-white tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          {/* type-label (12px) */}
          <span className="type-label text-zinc-500 mt-2">
             Right Now
          </span>
        </div>
      </div>

      {/* Info Below Dial */}
      {/* Updated Padding: p-8 pb-20 for mobile (40px bottom) */}
      <div className="h-16 w-full flex items-start justify-center mt-12 p-8 lg:pb-8 pb-20">
        {activeActivity ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              // INCREASED GAP TO gap-4 (16px)
              className="flex flex-col items-center gap-4"
            >
              <div className="px-4 py-1.5 bg-zinc-800 rounded-full border border-white/10">
                <span className="type-label text-zinc-400">Current Phase</span>
              </div>
              <span className={`type-h3 text-center px-4`} style={{ color: COLORS[activeActivity.type] }}>
                {activeActivity.title}
              </span>
            </motion.div>
          ) : (
            <span className="type-label text-zinc-600 mt-2">System Idle</span>
          )}
      </div>
    </div>
  );
};


import { DayState, Activity, Protocol, ActivityDefinition } from './types';

export const timeToMinutes = (time: string): number => {
  if (!time || typeof time !== 'string') return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const getEndTime = (startTime: string, duration: number): string => {
  const startMins = timeToMinutes(startTime);
  return minutesToTime(startMins + duration);
};

export const getDayId = (date: Date): string => {
  // Use Local Time instead of UTC (toISOString) to ensure "Today" stays "Today" past midnight locally
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const getPreviousDayId = (dateId: string): string => {
  const d = new Date(dateId);
  d.setDate(d.getDate() - 1);
  return getDayId(d); // Use the safe getDayId
};

export const isActivityInFuture = (dateId: string, startTime: string): boolean => {
  const now = new Date();
  const todayId = getDayId(now);
  
  if (dateId > todayId) return true;
  if (dateId < todayId) return false;
  
  // It's today, check time
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(startTime);
  
  return slotMinutes > currentMinutes;
};

/**
 * CORE LOGIC: Merges the Protocol (Structure) with DayState (Completion)
 */
export const getComputedActivities = (
  days: Record<string, DayState>, 
  protocols: Protocol[], 
  dateId: string
): Activity[] => {
  const activities: Activity[] = [];
  
  // 1. Get Activities for Current Day
  const dayState = days[dateId];
  
  // If day has a protocol assigned
  if (dayState && dayState.protocolId) {
    const protocol = protocols.find(p => p.id === dayState.protocolId);
    
    // Only process if protocol exists (wasn't deleted)
    if (protocol && Array.isArray(protocol.activities)) {
       const completedIds = new Set(dayState.completedActivityIds);
       
       // Defensive mapping: Ensure activity is valid before processing
       const currentDayActivities = protocol.activities
         .filter(def => def && def.id && typeof def.startTime === 'string')
         .map(def => {
           const log = dayState.activityLogs[def.id];
           return {
             ...def,
             completed: completedIds.has(def.id),
             hasNotes: !!(log && (log.notes.trim().length > 0 || log.checklist.length > 0))
           };
         });
       
       activities.push(...currentDayActivities);
    }
  }

  return activities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
};

export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  // Protect against NaN or infinite loop scenarios
  if (isNaN(startAngle) || isNaN(endAngle) || isNaN(radius)) return '';
  
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');

  return d;
};

export const sanitizeForFirestore = (state: any): any => {
    // Explicitly select only data fields to avoid circular references or functions
    // JSON.parse/stringify ensures deep cloning and removal of undefined
    const cleanData = {
        days: state.days || {},
        protocols: state.protocols || [],
        userConfig: state.userConfig || {},
        energy: state.energy || 50,
        updatedAt: new Date().toISOString()
    };
    return JSON.parse(JSON.stringify(cleanData));
};

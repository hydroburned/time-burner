
import { ActivityDefinition } from './types';

export const COLORS = {
  BURN: '#FF4D00', // Neon Orange
  FUEL: '#00E5FF', // Cyan
  REST: '#A855F7', // Purple
  VOID: '#D9F99D', // Neon Lime (High Visibility)
  BACKGROUND: '#020202',
  SURFACE: '#09090b',
  SURFACE_HIGHLIGHT: '#18181b',
  BORDER: 'rgba(255,255,255, 0.08)',
};

export const TAG_CONFIG: Record<string, { bg: string, border: string, text: string, shadow: string }> = {
  Workout: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]' },
  Nature:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
  Health:  { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400',   shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.2)]' },
  Love:    { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.2)]' },
  Core:    { bg: 'bg-red-500/10',    border: 'border-red-500/50',    text: 'text-red-500',    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' }
};

// STRICT DESIGN SYSTEM: 4px base grid
export const THEME = {
  RADIUS: {
    SM: '0.5rem',     // 8px
    MD: '0.75rem',    // 12px
    LG: '1rem',       // 16px
    XL: '1.5rem',     // 24px
    XXL: '2rem',      // 32px
    JUMBO: '2.5rem',  // 40px
    FULL: '9999px',
  },
  SPACING: {
    XS: '0.25rem',    // 4px
    SM: '0.5rem',     // 8px
    MD: '0.75rem',    // 12px
    LG: '1rem',       // 16px
    XL: '1.25rem',    // 20px
    XXL: '1.5rem',    // 24px
    HM: '2rem',       // 32px
    JUMBO: '2.5rem',  // 40px
    MEGA: '3rem',     // 48px
  }
};

export const DEFAULT_PROTOCOL: ActivityDefinition[] = [
  // MORNING
  { id: '1', title: 'Wake up + Hydrate', startTime: '07:00', duration: 30, type: 'FUEL', description: 'Immediate water intake and light meditation.', tags: ['Health'] },
  { id: '2', title: 'High Performance Breakfast', startTime: '07:30', duration: 60, type: 'FUEL', description: 'Nutrient dense fuel.', tags: ['Health'] },
  { id: '3', title: 'Deep Work Block #1', startTime: '09:00', duration: 150, type: 'BURN', description: 'Portfolio and high-focus tasks.', priority: true },
  { id: '4', title: 'Light Exposure', startTime: '11:30', duration: 30, type: 'FUEL', description: 'Pause for sunlight exposure.', tags: ['Nature'] },
  
  // DAY
  { id: '5', title: 'Physical Reset', startTime: '12:00', duration: 90, type: 'FUEL', description: 'Exercise or physical movement.', tags: ['Workout'] },
  { id: '6', title: 'Lunch + Recovery', startTime: '13:30', duration: 60, type: 'REST', description: 'Recovery nutrition.', tags: ['Health'] },
  { id: '7', title: 'NSDR Reset', startTime: '14:30', duration: 20, type: 'FUEL', description: 'Non-Sleep Deep Rest for neural reset.', tags: ['Health'] },
  
  // AFTERNOON
  { id: '8', title: 'Deep Work Block #2', startTime: '15:00', duration: 120, type: 'BURN', description: 'Job search or admin tasks.' },
  { id: '9', title: 'Skill Acquisition', startTime: '17:00', duration: 60, type: 'VOID', description: 'Learning and research.' },
  { id: '10', title: 'Outdoor Walk', startTime: '18:00', duration: 60, type: 'FUEL', description: 'Optical flow and eye relaxation.', tags: ['Nature'] },
  
  // EVENING
  { id: '11', title: 'Family Dinner', startTime: '19:00', duration: 90, type: 'REST', description: 'Social and emotional reset.', tags: ['Love'] },
  { id: '12', title: 'Digital Sunset', startTime: '21:30', duration: 30, type: 'REST', description: 'Blue light blockers ON.' },
  { id: '13', title: 'Reading', startTime: '22:00', duration: 60, type: 'REST', description: 'Physical book reading.' },
  { id: '14', title: 'Sleep', startTime: '23:00', duration: 480, type: 'REST', description: 'Optimized recovery.', tags: ['Health'] },
];

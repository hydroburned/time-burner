
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Droplets, ShieldAlert } from 'lucide-react';
import { COLORS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

interface EnergyTankProps {
  currentEnergy: number;
}

export const EnergyTank: React.FC<EnergyTankProps> = ({ currentEnergy }) => {
  const [mode, setMode] = useState<'IDLE' | 'FUELING' | 'BURNING'>('IDLE');
  const prevEnergyRef = useRef(currentEnergy);
  const t = useTranslation();
  
  const percentage = Math.min(100, Math.max(0, currentEnergy));
  const isLow = percentage < 20;

  useEffect(() => {
    if (currentEnergy > prevEnergyRef.current) {
      setMode('FUELING');
      const timer = setTimeout(() => setMode('IDLE'), 1200);
      return () => clearTimeout(timer);
    } else if (currentEnergy < prevEnergyRef.current) {
      setMode('BURNING');
      const timer = setTimeout(() => setMode('IDLE'), 1200);
      return () => clearTimeout(timer);
    }
    prevEnergyRef.current = currentEnergy;
  }, [currentEnergy]);

  const getBarColor = () => {
    if (isLow) return '#EF4444';
    if (mode === 'FUELING') return COLORS.FUEL;
    if (mode === 'BURNING') return COLORS.BURN;
    return COLORS.FUEL;
  };

  return (
    <div className="relative flex flex-col p-8 bg-zinc-900/40 rounded-3xl border border-white/5 backdrop-blur-xl shadow-lg w-full group overflow-hidden">
      {isLow && <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLow ? 'low' : mode}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {isLow ? <ShieldAlert className="w-5 h-5 text-red-500" /> :
               mode === 'FUELING' ? <Droplets className="w-5 h-5 text-cyan-400" /> :
               mode === 'BURNING' ? <Flame className="w-5 h-5 text-orange-500" /> :
               <Zap className="w-5 h-5 text-zinc-500" />}
            </motion.div>
          </AnimatePresence>
          <span className="type-label text-zinc-500">
            {t.energy.tank_label}
          </span>
        </div>
        <span className={`type-mono-body ${isLow ? 'text-red-500' : 'text-white'}`}>
          {Math.round(currentEnergy)}%
        </span>
      </div>

      <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 h-full rounded-full"
          style={{ 
            backgroundColor: getBarColor(),
            boxShadow: `0 0 10px ${getBarColor()}66`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 40, damping: 15 }}
        />
      </div>
    </div>
  );
};

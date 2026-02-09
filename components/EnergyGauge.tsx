
import React from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Flame, ShieldAlert } from 'lucide-react';

interface EnergyGaugeProps {
  energy: number;
}

export const EnergyGauge: React.FC<EnergyGaugeProps> = ({ energy }) => {
  const isBurnout = energy < 20;
  
  return (
    <div className="w-full max-w-md bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
      {isBurnout && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
      )}
      
      <div className="relative">
        <Zap className={`w-6 h-6 ${isBurnout ? 'text-red-500' : 'text-cyan-400'}`} />
        {isBurnout && (
          <ShieldAlert className="w-4 h-4 text-red-600 absolute -top-1 -right-1 animate-bounce" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Energy Tank</span>
          <span className={`text-sm font-mono font-bold ${isBurnout ? 'text-red-500' : 'text-white'}`}>
            {energy}%
          </span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isBurnout ? 'bg-red-500' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
            initial={{ width: 0 }}
            animate={{ width: `${energy}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        {energy > 70 ? (
          <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
        ) : (
          <Battery className="w-5 h-5 text-zinc-600" />
        )}
      </div>
    </div>
  );
};

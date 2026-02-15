
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { ChevronRight, LayoutGrid, GitFork } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface ProtocolContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  coords: { x: number; y: number } | null;
}

export const ProtocolContextMenu: React.FC<ProtocolContextMenuProps> = ({ isOpen, onClose, targetDate, coords }) => {
  const { protocols, days, applyProtocolToDay, setView, detachProtocolForDay } = useStore();
  const t = useTranslation();
  
  const currentProtocolId = days[targetDate]?.protocolId;
  const currentProtocol = protocols.find(p => p.id === currentProtocolId);
  // Only show library protocols or if currently no protocol
  const visibleProtocols = protocols.filter(p => !p.isCustom);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const handleSelect = (protocolId: string) => {
    applyProtocolToDay(targetDate, protocolId);
    onClose();
  };
  
  const handleDetach = () => {
      detachProtocolForDay(targetDate);
      onClose();
  };

  const handleLibrary = () => {
    setView('PROTOCOLS');
    onClose();
  }

  if (!isOpen) return null;

  // Simple boundary detection to prevent menu going off-screen (Desktop Only)
  let top = coords?.y || 0;
  let left = coords?.x || 0;
  
  if (!isMobile && typeof window !== 'undefined') {
    if (window.innerHeight - top < 400) top -= 300; 
    if (window.innerWidth - left < 320) left -= 320; 
  }

  // Animation variants
  const variants = isMobile ? {
      initial: { y: '100%', opacity: 1 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '100%', opacity: 1 }
  } : {
      initial: { opacity: 0, scale: 0.95, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 }
  };

  const containerStyle = isMobile ? {
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: '2rem 2rem 0 0',
      width: '100%',
      maxHeight: '80vh'
  } : {
      top,
      left,
      width: '40rem',
      borderRadius: '2rem'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200]" onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
         {/* Backdrop */}
         <div className={`absolute inset-0 ${isMobile ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`} />
         
         <motion.div
           initial={variants.initial}
           animate={variants.animate}
           exit={variants.exit}
           transition={{ type: "spring", bounce: 0, duration: 0.3 }}
           className="absolute bg-zinc-900 border border-white/10 shadow-2xl p-4 flex flex-col gap-2 overflow-hidden"
           style={containerStyle}
           onClick={(e) => e.stopPropagation()}
         >
            {isMobile && <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto my-2 mb-4" />}

            <div className="px-4 py-2 type-label text-zinc-500 border-b border-white/5 mb-2">
              {t.protocol.switch}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {visibleProtocols.map(p => {
                const isActive = currentProtocolId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl type-body font-bold transition-all flex items-center justify-between group ${
                      isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {isActive && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,1)]" />}
                  </button>
                )
              })}
            </div>

            {/* Separator */}
            <div className="h-px bg-white/5 my-2" />
            
            {/* Custom / Unlink Option */}
            {currentProtocol && !currentProtocol.isCustom && (
                <button 
                  onClick={handleDetach}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 type-body font-bold text-orange-400 border border-orange-500/10 hover:border-orange-500/30 transition-all mb-2"
                >
                  <div className="flex items-center gap-3">
                    <GitFork className="w-6 h-6 rotate-180" />
                    <span>{t.protocol.unlink}</span>
                  </div>
                </button>
            )}

            {currentProtocol && currentProtocol.isCustom && (
                <div className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 type-body text-zinc-500 flex items-center gap-3 mb-2 cursor-default">
                    <GitFork className="w-6 h-6 rotate-180 text-cyan-500" />
                    <span>{t.protocol.custom_active}</span>
                </div>
            )}
            
            <button 
              onClick={handleLibrary}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 type-body font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-6 h-6" />
                <span>{t.protocol.library}</span>
              </div>
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Safe area spacing for mobile */}
            {isMobile && <div className="h-8" />}
         </motion.div>
      </div>
    </AnimatePresence>
  );
};

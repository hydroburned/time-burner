
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Flame, Zap, Moon, Clock, X, Check } from 'lucide-react';
import { ActivityDefinition, SlotType } from '../types';
import { getEndTime, timeToMinutes } from '../utils';
import { Button, Input } from './UI';
import { TAG_CONFIG } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

interface ActivityEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialActivity?: ActivityDefinition | Partial<ActivityDefinition> | null;
  onSave: (activity: ActivityDefinition) => void;
  onDelete?: (id: string) => void;
  protocolName?: string;
  mode?: 'modal' | 'panel'; // 'modal' for Home, 'panel' for Timeline
}

const AVAILABLE_TAGS = ['Workout', 'Nature', 'Health', 'Love'];

export const ActivityEditor: React.FC<ActivityEditorProps> = ({ 
  isOpen, 
  onClose, 
  initialActivity, 
  onSave, 
  onDelete,
  protocolName,
  mode = 'modal'
}) => {
  const t = useTranslation();
  const [data, setData] = useState<Partial<ActivityDefinition>>({
    title: '',
    startTime: '09:00',
    duration: 60,
    type: 'BURN',
    description: '',
    priority: false,
    tags: []
  });
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  useEffect(() => {
    if (isOpen) {
      if (initialActivity) {
        setData({
            ...initialActivity,
            title: initialActivity.title || '',
            startTime: initialActivity.startTime || '09:00',
            duration: initialActivity.duration || 60,
            type: initialActivity.type || 'BURN',
            description: initialActivity.description || '',
            priority: initialActivity.priority || false,
            tags: initialActivity.tags || []
        });
      } else {
        setData({
          title: '',
          startTime: '09:00',
          duration: 60,
          type: 'BURN',
          description: '',
          priority: false,
          tags: []
        });
      }
    }
  }, [isOpen, initialActivity]);

  const handleSave = () => {
    if (data.title && data.startTime) {
      onSave(data as ActivityDefinition);
      // In panel mode, clicking "Done" or Cmd+Enter should typically close/deselect the item too
      // The user requested that clicking empty space deselects, but "Done" usually implies completion.
      // We will close it here to satisfy "Done" button behavior.
      onClose(); 
    }
  };

  // Live Update for Panel Mode
  useEffect(() => {
     if (mode === 'panel' && isOpen && data.title && data.startTime) {
         // Debounce live updates so we don't spam state
         const timer = setTimeout(() => {
             // We pass a flag or just call onSave without closing
             // Note: ProtocolEditor needs to handle this update without closing the selection
             onSave(data as ActivityDefinition);
         }, 100);
         return () => clearTimeout(timer);
     }
  }, [data, mode, isOpen]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (initialActivity?.id && onDelete) {
        onDelete(initialActivity.id);
        onClose();
    }
  };

  const toggleTag = (tag: string) => {
     const currentTags = data.tags || [];
     if (currentTags.includes(tag)) {
         setData({ ...data, tags: currentTags.filter(t => t !== tag) });
     } else {
         setData({ ...data, tags: [...currentTags, tag] });
     }
  };

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
           e.preventDefault();
           e.stopPropagation();
           onClose();
       }
       if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
           e.preventDefault();
           e.stopPropagation();
           handleSave();
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, data, onClose]); // Added dependencies to ensure closure captures latest state

  if (!isOpen) return null;

  const isModal = mode === 'modal';

  return (
    <div className={`fixed inset-0 z-[150] flex ${isModal ? (isMobile ? 'items-end' : 'items-center justify-center p-4') : 'items-end justify-center pointer-events-none'}`}>
       {/* Backdrop - Only for Modal Mode */}
       <AnimatePresence>
         {isModal && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
           />
         )}
       </AnimatePresence>

       {/* Editor Content */}
       <motion.div
         initial={isModal ? (isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 20 }) : { y: 300, opacity: 0 }}
         animate={isModal ? (isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }) : { y: 0, opacity: 1 }}
         exit={isModal ? (isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 20 }) : { y: 300, opacity: 0 }}
         transition={{ type: "spring", bounce: 0, duration: 0.3 }}
         // Padding Logic: 
         // Modal (Desktop) -> p-10 (More breathing room)
         // Panel (Timeline) -> p-6, but max width restricted
         // Modal (Mobile) -> h-auto, max-h-[90vh], rounded-t-[3rem]
         className={`relative w-full max-w-[75rem] bg-zinc-950 border border-white/10 overflow-hidden pointer-events-auto flex flex-col ${
             isModal 
                ? (isMobile ? 'h-auto max-h-[92vh] rounded-t-[3rem] border-0' : 'rounded-[3rem] p-10 shadow-2xl') 
                : 'shadow-[0_-40px_80px_rgba(0,0,0,0.8)] border-t border-white/20 rounded-t-[3rem] p-6 pb-12 z-[200]'
         }`}
       >
          {/* Mobile Safe Area Spacer */}
          {isModal && isMobile && <div className="h-6 shrink-0 w-full flex justify-center"><div className="w-16 h-1 bg-zinc-800 rounded-full" /></div>}

          {/* Scrollable Container for Mobile */}
          <div className={`flex-1 overflow-y-auto ${isMobile && isModal ? 'p-6 pb-32' : ''}`}>
              <div className="flex flex-col gap-6">
                 {/* Header / Title Input */}
                 <div className="flex items-center gap-4">
                     <Input 
                       autoFocus={isMobile || !isMobile} // Always autofocus title
                       placeholder={t.editor.title_placeholder}
                       value={data.title}
                       onChange={(e) => setData({ ...data, title: e.target.value })}
                       // Changed px-2 to px-8 (16px visual)
                       className="type-h2 border-none bg-transparent px-8 h-24 flex items-center focus:bg-zinc-900/50 placeholder-zinc-700 rounded-2xl"
                     />
                     <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full text-zinc-500 transition-colors shrink-0">
                        {/* w-12 = 24px */}
                        <X className="w-12 h-12" />
                     </button>
                 </div>

                 {/* Time Controls */}
                 {/* Updated padding to p-6 for better spacing */}
                 <div className="grid grid-cols-[1.5fr_1.5fr_1fr] gap-4 bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5">
                    <div className="flex flex-col gap-2">
                      <label className="type-label text-zinc-500 pl-2">{t.editor.start}</label>
                      <input 
                        type="time"
                        value={data.startTime}
                        onChange={(e) => setData({...data, startTime: e.target.value})}
                        className="bg-transparent type-mono-body text-white focus:outline-none p-2 rounded hover:bg-white/5 cursor-pointer w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-2 border-l border-white/5 pl-4 md:pl-6">
                      <label className="type-label text-zinc-500 pl-2">{t.editor.end}</label>
                      <input 
                        type="time"
                        value={getEndTime(data.startTime || '00:00', data.duration || 60)}
                        onChange={(e) => {
                          const startMins = timeToMinutes(data.startTime || '00:00');
                          const endMins = timeToMinutes(e.target.value);
                          let newDuration = endMins - startMins;
                          if (newDuration < 0) newDuration += 1440; 
                          setData({...data, duration: newDuration || 15 });
                        }}
                        className="bg-transparent type-mono-body text-white focus:outline-none p-2 rounded hover:bg-white/5 cursor-pointer w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-2 border-l border-white/5 pl-4 md:pl-6">
                      <label className="type-label text-zinc-500 pl-2">{t.editor.mins}</label>
                      <input 
                        type="number"
                        value={data.duration}
                        step={15}
                        onChange={(e) => setData({...data, duration: parseInt(e.target.value) || 15 })}
                        className="bg-transparent type-mono-body text-white focus:outline-none w-full p-2 rounded hover:bg-white/5"
                      />
                    </div>
                 </div>
                 
                 {/* Configuration / Toggles (Tags) */}
                 {/* Styled as a row of compact pills, flex-wrap allowed */}
                 <div className="flex flex-wrap items-center gap-3 px-2">
                     {/* CORE (Priority) - Special Tag */}
                     <button 
                        onClick={() => setData({ ...data, priority: !data.priority })}
                        // INCREASED HEIGHT: h-12 (24px)
                        className={`flex-shrink-0 flex items-center gap-2 px-6 h-12 rounded-full border transition-all ${
                            data.priority 
                            ? `${TAG_CONFIG.Core.bg} ${TAG_CONFIG.Core.border} ${TAG_CONFIG.Core.text} ${TAG_CONFIG.Core.shadow}` 
                            : 'bg-zinc-900 border-white/5 text-zinc-600 hover:text-zinc-300 hover:border-white/10'
                        }`}
                     >
                        {/* NO ICON */}
                        <span className="type-label">{t.editor.core}</span>
                     </button>

                     {/* Other Tags */}
                     {AVAILABLE_TAGS.map(tag => {
                         const isActive = data.tags?.includes(tag);
                         const config = TAG_CONFIG[tag];
                         return (
                            <button 
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                // INCREASED HEIGHT: h-12 (24px)
                                className={`flex-shrink-0 flex items-center gap-2 px-6 h-12 rounded-full border transition-all ${
                                    isActive 
                                    ? `${config.bg} ${config.border} ${config.text} ${config.shadow}` 
                                    : 'bg-zinc-900 border-white/5 text-zinc-600 hover:text-zinc-300 hover:border-white/10'
                                }`}
                            >
                                <span className="type-label">{tag}</span>
                            </button>
                         );
                     })}
                 </div>

                 {/* Footer Actions */}
                 <div className="flex flex-col md:flex-row items-center justify-between pt-2 gap-6">
                     {/* Type Toggles - PADDING ADDED TO PREVENT CLIPPING */}
                     <div className="flex gap-4 w-full justify-between md:w-auto md:justify-start overflow-visible p-2">
                        {(['BURN', 'FUEL', 'REST', 'VOID'] as SlotType[]).map(t => (
                          <button
                            key={t}
                            onClick={() => setData({...data, type: t})}
                            title={t}
                            // 48px buttons (w-24 h-24 = 6rem * 8 = 48px)
                            className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all ${
                              data.type === t ? 'bg-white text-black border-white scale-110 shadow-lg' : 'bg-black text-zinc-600 border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            {t === 'BURN' && <Flame className="w-10 h-10" />}
                            {t === 'FUEL' && <Zap className="w-10 h-10" />}
                            {t === 'REST' && <Moon className="w-10 h-10" />}
                            {t === 'VOID' && <Clock className="w-10 h-10" />}
                          </button>
                        ))}
                     </div>

                     {/* Main Buttons */}
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        {initialActivity?.id && onDelete && (
                           <Button 
                             variant="danger" 
                             size="md" 
                             onClick={handleDelete}
                             // Height h-24 (48px) to match type toggles
                             className="px-8 rounded-full flex items-center gap-3 h-24 flex-1 md:flex-none"
                             // Explicitly override icon size
                             icon={<Trash2 className="w-12 h-12" />}
                           >
                              <span className="hidden sm:inline">{t.editor.delete}</span>
                           </Button>
                        )}
                        <Button 
                          variant="primary" 
                          size="md" 
                          onClick={handleSave}
                          // Height h-24 (48px) to match type toggles
                          className="px-12 rounded-full h-24 type-h3 flex-1 md:flex-none"
                        >
                           {t.editor.done}
                        </Button>
                     </div>
                 </div>
              </div>
          </div>
       </motion.div>
    </div>
  );
};

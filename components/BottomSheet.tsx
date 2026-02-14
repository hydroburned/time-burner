
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string | null;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Covers everything (z-50) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 touch-none"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-zinc-950 border-t border-white/10 rounded-t-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-6 pb-2 touch-none cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-1.5 bg-zinc-800 rounded-full" />
            </div>

            {/* Content Container */}
            <div className="flex flex-col h-full overflow-hidden">
                {title && (
                    <div className="px-8 pb-6 flex items-center justify-between shrink-0">
                        <h3 className="type-h2 truncate pr-4 text-white">{title}</h3>
                        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}
                
                {/* Scrollable Content - Reduced padding from pb-32 to pb-12 */}
                <div className="flex-1 overflow-y-auto pb-12 custom-scrollbar">
                    {children}
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

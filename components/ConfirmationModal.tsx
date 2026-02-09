
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './UI';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              // 400px = 50rem
              className="relative w-full max-w-[50rem] bg-zinc-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 text-white">
                  {isDangerous && <AlertTriangle className="w-10 h-10 text-red-500" />}
                  {/* Title: type-h2 (24px) - UPDATED from type-h1 */}
                  <h3 className="type-h2">{title}</h3>
                </div>
                
                {/* Body: type-body (16px) */}
                <p className="type-body text-zinc-400">
                  {message}
                </p>

                <div className="flex gap-4 mt-6 justify-end">
                  <Button variant="ghost" size="md" onClick={onClose} className="type-h3">
                    {cancelLabel}
                  </Button>
                  <Button 
                    variant={isDangerous ? 'danger' : 'primary'} 
                    size="md" 
                    onClick={() => { onConfirm(); onClose(); }}
                    className="type-h3 px-8"
                  >
                    {confirmLabel}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

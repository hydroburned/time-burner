
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { User, Shield, LogOut, Info, Keyboard, ChevronDown } from 'lucide-react';
import { Card } from '../UI';
import { ConfirmationModal } from '../ConfirmationModal';

export const SettingsView: React.FC = () => {
  const { userConfig, updateUserConfig } = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  return (
    // RESTORED PADDING: pt-20 pb-20 (5rem), UPDATED desktop px to lg:px-20
    <div className="w-full max-w-[1920px] mx-auto pt-20 pb-20 px-8 lg:px-20">
      <div className="max-w-[70rem] mx-auto pb-32">
        
        {/* Unified Header Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="type-h1 lg:type-display mb-4 text-white">Operator Profile</h2>
            <p className="type-label text-zinc-500">Identity & Configuration</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 opacity-60">
             <span className="type-label text-white">Time Burner</span>
             <span className="type-caption text-zinc-500">v1.0.4 // Local Architecture</span>
          </div>
        </div>

        <div className="space-y-16">
          {/* Styled to match Protocol Card */}
          <section className="bg-zinc-900/40 rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-2xl">
            <div className="flex items-center gap-8 border-b border-white/5 pb-10">
              <div className="w-32 h-32 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <User className="w-16 h-16 text-cyan-400" />
              </div>
              <div>
                {/* Reduced to type-h2 */}
                <h3 className="type-h2 text-white">{userConfig.name}</h3>
                <p className="type-body text-zinc-500 mt-2">{userConfig.bio}</p>
              </div>
            </div>

            <div className="grid gap-10">
              <div className="space-y-4">
                <label className="type-label text-zinc-500 pl-2">Codename</label>
                <input 
                  type="text" 
                  value={userConfig.name}
                  onChange={(e) => updateUserConfig({ name: e.target.value })}
                  // Reduced to type-h3
                  className="w-full bg-black border border-white/5 rounded-[2rem] px-8 h-24 type-h3 font-bold focus:border-cyan-500 outline-none transition-all focus:bg-zinc-900 text-white"
                />
              </div>

              <div className="space-y-4">
                <label className="type-label text-zinc-500 pl-2">Protocol Philosophy</label>
                <textarea 
                  value={userConfig.bio}
                  onChange={(e) => updateUserConfig({ bio: e.target.value })}
                  className="w-full bg-black border border-white/5 rounded-[2rem] px-8 py-6 type-body focus:border-cyan-500 outline-none h-48 resize-none font-medium transition-all focus:bg-zinc-900 text-white"
                />
              </div>
            </div>
          </section>

          {/* Operational Log - Smaller Text */}
          <Card className="p-10 rounded-[3rem] flex items-start gap-8 bg-zinc-900/20 border-dashed">
             <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Info className="w-8 h-8 text-cyan-500" />
             </div>
             <div className="flex-1">
               <h4 className="type-body font-bold text-zinc-300 uppercase">Operational Log</h4>
               <p className="type-mono-sm text-zinc-500 mt-2 leading-relaxed">
                 Completing FUEL (+15) and BURN (-20) entries synchronizes your energy vector.
                 Maintain balance to avoid system burnout.
               </p>
             </div>
          </Card>

          {/* Collapsible Keyboard Shortcuts */}
          <Card className="rounded-[3rem] bg-zinc-900/20 border-dashed overflow-hidden">
             <button 
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="w-full p-10 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
             >
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Keyboard className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h4 className="type-body font-bold text-zinc-300 uppercase">Keyboard Controls</h4>
                </div>
                <ChevronDown className={`w-8 h-8 text-zinc-500 transition-transform ${showShortcuts ? 'rotate-180' : ''}`} />
             </button>
             
             <AnimatePresence>
                {showShortcuts && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-10 pb-10"
                    >
                        <div className="grid grid-cols-1 gap-6 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="type-mono-sm text-zinc-500">Navigate Dates</span>
                                <span className="type-mono-sm text-white">Left / Right Arrow</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="type-mono-sm text-zinc-500">Delete Node (Editor)</span>
                                <span className="type-mono-sm text-white">Delete / Backspace</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="type-mono-sm text-zinc-500">Save (Editor)</span>
                                <span className="type-mono-sm text-white">Cmd + Enter</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="type-mono-sm text-zinc-500">Close / Cancel</span>
                                <span className="type-mono-sm text-white">Escape</span>
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
          </Card>

          <section className="flex flex-col gap-6">
            <button className="flex items-center justify-between p-10 bg-zinc-900/40 border border-white/5 rounded-[3rem] hover:bg-zinc-900 hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-6">
                <Shield className="w-10 h-10 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                <span className="type-body font-bold text-white">Security Protocol</span>
              </div>
              <span className="type-label text-zinc-600 group-hover:text-cyan-500">ACTIVE</span>
            </button>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center gap-4 p-8 bg-red-500/5 border border-red-500/10 rounded-[3rem] hover:bg-red-500/10 text-red-500 transition-colors group w-full"
            >
              <LogOut className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="type-body font-bold">Purge All Data</span>
            </button>
          </section>
        </div>

        <ConfirmationModal 
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={handleReset}
          title="Purge System Data?"
          message="This will wipe all local storage and reload the application. This action cannot be undone."
          confirmLabel="Purge"
          isDangerous
        />
      </div>
    </div>
  );
};

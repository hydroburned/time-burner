
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { User, Shield, LogOut, Info, Keyboard, ChevronDown, Cloud, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Card, Button } from '../UI';
import { ConfirmationModal } from '../ConfirmationModal';
import { auth } from '../../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

export const SettingsView: React.FC = () => {
  const { userConfig, updateUserConfig, currentUser } = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const handleReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      
      if (error.code === 'auth/configuration-not-found') {
          setAuthError("Google Sign-In disabled. Enable 'Google' in Firebase Console > Auth > Sign-in method.");
      } else if (error.code === 'auth/unauthorized-domain') {
          setAuthError(`Domain unauthorized. Add '${window.location.hostname}' to Firebase Console > Auth > Settings > Authorized Domains.`);
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          setAuthError(null);
      } else if (error.code === 'auth/popup-blocked') {
          setAuthError("Pop-up blocked. Please allow pop-ups for this site to sign in.");
      } else {
          setAuthError(error.message || "Authentication failed.");
      }
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto pt-20 pb-20 px-8 lg:px-20">
      <div className="max-w-[70rem] mx-auto pb-32">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="type-h1 lg:type-display mb-4 text-white">Operator Profile</h2>
            <p className="type-label text-zinc-500">Identity & Configuration</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 opacity-60">
             <span className="type-label text-white">Time Burner</span>
             <span className="type-caption text-zinc-500">v1.0.6 // {currentUser ? 'CLOUD SYNC' : 'LOCAL'}</span>
          </div>
        </div>

        <div className="space-y-16">
          <section className="bg-zinc-900/40 rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
            {currentUser && <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />}

            <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center gap-8 border-b border-white/5 pb-10">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] overflow-hidden shrink-0 ${currentUser ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-zinc-800 border border-white/5'}`}>
                        {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                        <User className={`w-16 h-16 ${currentUser ? 'text-cyan-400' : 'text-zinc-600'}`} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="type-h2 text-white truncate">{userConfig.name}</h3>
                        <p className="type-body text-zinc-500 mt-2">{currentUser ? currentUser.email : 'Local Operator'}</p>
                    </div>
                </div>

                <AnimatePresence>
                    {authError && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
                        >
                            <div className="flex items-start gap-4 flex-1">
                                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                                <div>
                                    <h4 className="type-label text-red-400 mb-1">Authentication Failed</h4>
                                    <p className="type-mono-sm text-red-300 select-all">{authError}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button size="sm" variant="danger" onClick={() => setAuthError(null)} icon={<X />}>
                                    Dismiss
                                </Button>
                                <Button size="sm" variant="primary" onClick={handleGoogleLogin} icon={<RefreshCw />}>
                                    Retry
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid gap-10 relative z-10">
              <div className="space-y-4">
                <label className="type-label text-zinc-500 pl-2">Codename</label>
                <input 
                  type="text" 
                  value={userConfig.name}
                  onChange={(e) => updateUserConfig({ name: e.target.value })}
                  className="w-full bg-black border border-white/5 rounded-[2rem] px-8 h-24 type-h3 font-bold focus:border-cyan-500 outline-none transition-all focus:bg-zinc-900 text-white"
                />
              </div>

              {/* Cloud Command Center */}
              {/* UPDATED: items-start for mobile, md:items-center for desktop */}
              <div className="bg-black border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                 <div className="flex items-center gap-6 w-full md:w-auto">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${currentUser ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-900 text-zinc-600'}`}>
                        <Cloud className="w-8 h-8" />
                     </div>
                     <div className="flex flex-col text-left">
                         <span className="type-body font-bold text-white">Cloud Synchronization</span>
                         <span className="type-caption text-zinc-500 mt-1">
                             {currentUser ? 'Active • Real-time Link' : 'Inactive • Local Only'}
                         </span>
                     </div>
                 </div>

                 {currentUser ? (
                    <Button variant="secondary" size="md" onClick={handleLogout} className="shrink-0 w-full md:w-auto" icon={<LogOut />}>
                        Disconnect
                    </Button>
                ) : (
                    <Button 
                        variant="primary" 
                        size="md" 
                        onClick={handleGoogleLogin} 
                        className="shrink-0 relative overflow-hidden w-full md:w-auto" 
                        icon={isLoggingIn ? <RefreshCw className="animate-spin" /> : <Cloud />}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? 'Connecting...' : 'Sync with Google'}
                    </Button>
                )}
              </div>
            </div>
          </section>

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
            <button className={`flex items-center justify-between p-10 bg-zinc-900/40 border border-white/5 rounded-[3rem] transition-colors group ${currentUser ? 'hover:border-green-500/30' : 'hover:bg-zinc-900 hover:border-white/10'}`}>
              <div className="flex items-center gap-6">
                <Shield className={`w-10 h-10 transition-colors ${currentUser ? 'text-green-500' : 'text-zinc-500 group-hover:text-cyan-400'}`} />
                <div className="flex flex-col text-left">
                     <span className="type-body font-bold text-white">Security Protocol</span>
                     {currentUser ? (
                         <span className="type-caption text-zinc-500">Cloud Link Established</span>
                     ) : (
                         <span className="type-caption text-zinc-600 group-hover:text-cyan-500">Local Storage Only</span>
                     )}
                </div>
              </div>
              <span className={`type-label ${currentUser ? 'text-green-500' : 'text-zinc-600'}`}>
                 {currentUser ? 'SECURE' : 'OFFLINE'}
              </span>
            </button>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center gap-4 p-8 bg-red-500/5 border border-red-500/10 rounded-[3rem] hover:bg-red-500/10 text-red-500 transition-colors group w-full"
            >
              <LogOut className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="type-body font-bold">Purge Local Data</span>
            </button>
          </section>
        </div>

        <ConfirmationModal 
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={handleReset}
          title="Purge System Data?"
          message="This will wipe all local storage and reload the application. Cloud data remains safe if synchronized."
          confirmLabel="Purge"
          isDangerous
        />
      </div>
    </div>
  );
};

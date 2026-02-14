
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sanitizeForFirestore } from '../utils';

export const SyncConflictModal: React.FC = () => {
  const { 
    syncConflictData, 
    setSyncConflictData, 
    setPendingSyncDecision, 
    replaceState,
    days, protocols, userConfig, energy 
  } = useStore();
  
  const [isProcessing, setIsProcessing] = useState(false);

  if (!syncConflictData) return null;

  const handleSyncChoice = async (choice: 'KEEP_LOCAL' | 'USE_CLOUD') => {
      setIsProcessing(true);
      
      try {
          if (!auth.currentUser) throw new Error("No user authenticated");

          if (choice === 'KEEP_LOCAL') {
              // 1. Overwrite cloud with current local data
              const localPayload = sanitizeForFirestore({
                  days,
                  protocols,
                  userConfig,
                  energy,
                  updatedAt: new Date().toISOString()
              });
              
              await setDoc(doc(db, 'users', auth.currentUser.uid), localPayload, { merge: true });
              console.log("Cloud overwritten with local data.");
          } else {
              // 2. Overwrite local with cloud data (syncConflictData)
              replaceState({
                days: syncConflictData.days || {},
                protocols: syncConflictData.protocols || [],
                userConfig: { ...userConfig, ...(syncConflictData.userConfig || {}) },
                energy: syncConflictData.energy ?? 50
              });
              console.log("Local overwritten with cloud data.");
          }
      } catch (e) {
          console.error("Sync resolution failed", e);
          alert("Failed to synchronize. Please check connection.");
      } finally {
          setIsProcessing(false);
          setSyncConflictData(null); // Close Modal
          setPendingSyncDecision(false); // Resume Auto-Sync
      }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
         />
         <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[60rem] bg-zinc-950 border border-white/10 rounded-[4rem] p-12 shadow-2xl overflow-hidden"
         >
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                    <RefreshCw className="w-16 h-16 text-cyan-500 animate-spin" />
                    <h3 className="type-h2 text-white">Synchronizing...</h3>
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    <div className="text-center">
                        <h3 className="type-h1 text-white mb-4">Sync Conflict Detected</h3>
                        <p className="type-body text-zinc-400 max-w-[40rem] mx-auto">
                            Existing data found in the cloud. Choose which version to keep. 
                            This action <span className="text-white font-bold">cannot be undone</span>.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Keep Local Option */}
                        <button 
                            onClick={() => handleSyncChoice('KEEP_LOCAL')}
                            className="flex flex-col items-center gap-6 p-10 rounded-[3rem] bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 hover:border-cyan-500/50 transition-all group"
                        >
                            <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowUpCircle className="w-10 h-10 text-cyan-400" />
                            </div>
                            <div className="text-center">
                                <h4 className="type-h3 text-white mb-2">Keep Local</h4>
                                <p className="type-mono-sm text-zinc-500">Overwrite cloud with current device data</p>
                            </div>
                        </button>

                        {/* Use Cloud Option */}
                        <button 
                            onClick={() => handleSyncChoice('USE_CLOUD')}
                            className="flex flex-col items-center gap-6 p-10 rounded-[3rem] bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 hover:border-purple-500/50 transition-all group"
                        >
                            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowDownCircle className="w-10 h-10 text-purple-400" />
                            </div>
                            <div className="text-center">
                                <h4 className="type-h3 text-white mb-2">Use Cloud</h4>
                                <p className="type-mono-sm text-zinc-500">Overwrite this device with cloud data</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
         </motion.div>
    </div>
  );
};


import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, PanInfo } from 'framer-motion';
import { Plus, BookTemplate, AlertTriangle, RefreshCw, CheckCircle2, WifiOff, Lock } from 'lucide-react';
import { useStore } from './store';
import { Navigation } from './components/Navigation';
import { TimeCircle } from './components/TimeCircle';
import { EnergyTank } from './components/EnergyTank';
import { SlotList } from './components/SlotList';
import { WeekView } from './components/Views/WeekView';
import { MonthView } from './components/Views/MonthView';
import { SettingsView } from './components/Views/SettingsView';
import { ProtocolManager } from './components/Views/TemplateManager';
import { Onboarding } from './components/Onboarding';
import { Activity, ActivityDefinition } from './types';
import { getComputedActivities, sanitizeForFirestore } from './utils';
import { Button } from './components/UI';
import { DateHeader } from './components/DateHeader';
import { ProtocolContextMenu } from './components/ProtocolContextMenu';
import { ActivityEditor } from './components/ActivityEditor';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Logbook } from './components/Logbook';
import { BottomSheet } from './components/BottomSheet';
import { auth, db, analytics } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const { 
    view, energy, selectedDate, days, protocols, 
    addActivityToProtocol, updateActivityInProtocol, removeActivityFromProtocol, 
    userConfig, setView, setSelectedDate,
    currentUser, setCurrentUser, replaceState
  } = useStore();
  const t = useTranslation();
  
  // Editor State
  const [showEditor, setShowEditor] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Delete State
  const [deleteActivityConfirm, setDeleteActivityConfirm] = useState<{ isOpen: boolean; id: string }>({
    isOpen: false,
    id: ''
  });
  
  // Context Sheet State (Mobile)
  const [activeSheetActivity, setActiveSheetActivity] = useState<Activity | null>(null);

  // Interaction State
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showProtocolMenu, setShowProtocolMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{x: number, y: number} | null>(null);
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE' | 'DENIED'>('IDLE');
  
  // REFS for logic (avoids re-renders loops)
  const isRemoteUpdate = useRef(false);
  const saveTimeout = useRef<any>(null);
  const unsubscribeSnapshotRef = useRef<(() => void) | null>(null);

  // Mobile / Scroll State
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollContainerRef }); 

  // Header Animation
  const miniHeaderOpacity = useTransform(scrollY, [250, 350], [0, 1]);
  const miniHeaderY = useTransform(scrollY, [250, 350], [-20, 0]);
  const miniHeaderPointerEvents = useTransform(scrollY, (value: number) => value > 300 ? 'auto' : 'none');

  const isBurnout = energy < 20;

  // Derive current Protocol info
  const currentDayState = days[selectedDate];
  const currentProtocolId = currentDayState?.protocolId;
  const currentProtocolName = useMemo(() => {
    if (!currentProtocolId) return null;
    return protocols.find(p => p.id === currentProtocolId)?.name;
  }, [currentProtocolId, protocols]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(timer);
  }, []);

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'screen_view', {
        firebase_screen: view,
        screen_name: view
      });
    }
  }, [view]);

  // --- STRICT SYNC ENGINE V3 ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // 1. Cleanup old listeners
      if (unsubscribeSnapshotRef.current) {
         unsubscribeSnapshotRef.current();
         unsubscribeSnapshotRef.current = null;
      }

      if (user) {
        console.log("✅ [Auth] User logged in:", user.email);
        setCurrentUser({ uid: user.uid, email: user.email, photoURL: user.photoURL });
        setSyncStatus('SYNCING');
        
        // Log Login Event
        if(analytics) logEvent(analytics, 'login', { method: 'google' });

        const userDocRef = doc(db, 'users', user.uid);

        try {
            // A. Initial Check (Get Once) with Timeout Safety
            const fetchPromise = getDoc(userDocRef);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));

            const docSnap: any = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (docSnap.exists()) {
                console.log("⬇️ [Sync] Cloud data found. Hydrating...");
                const data = docSnap.data();
                if (data) {
                    isRemoteUpdate.current = true; 
                    replaceState(data);
                    setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
                }
            } else {
                console.log("⬆️ [Sync] New user. Uploading local state...");
                const payload = sanitizeForFirestore(useStore.getState());
                await setDoc(userDocRef, payload);
            }
            setSyncStatus('IDLE');

            // B. Setup Realtime Listener
            const unsub = onSnapshot(userDocRef, (doc) => {
                // Skip if this update was caused by us (latency compensation)
                if (doc.metadata.hasPendingWrites) return; 

                const data = doc.data();
                if (data) {
                    console.log("🔄 [Sync] Remote update received");
                    isRemoteUpdate.current = true;
                    replaceState(data);
                    setSyncStatus('IDLE');
                    setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
                }
            }, (error) => {
                console.error("❌ [Sync] Snapshot Error:", error);
                if (error.code === 'permission-denied') {
                    setSyncStatus('DENIED');
                } else {
                    setSyncStatus('ERROR');
                }
            });

            unsubscribeSnapshotRef.current = unsub;

        } catch (error: any) {
            console.error("❌ [Sync] Init Failed:", error);
            if (error.code === 'permission-denied') {
                setSyncStatus('DENIED');
            } else {
                setSyncStatus('ERROR');
            }
        }

      } else {
        console.log("👋 [Auth] User logged out");
        setCurrentUser(null);
        setSyncStatus('OFFLINE');
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeSnapshotRef.current) unsubscribeSnapshotRef.current();
    };
  }, []);

  // --- LOCAL TO CLOUD TRIGGER ---
  useEffect(() => {
    const unsubscribeStore = useStore.subscribe((state) => {
        if (!auth.currentUser) return;
        if (isRemoteUpdate.current) return; 

        setSyncStatus('SYNCING');
        
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        
        saveTimeout.current = setTimeout(async () => {
             if (isRemoteUpdate.current) {
                 setSyncStatus('IDLE');
                 return;
             }

             try {
                 const payload = sanitizeForFirestore(state);
                 await setDoc(doc(db, 'users', auth.currentUser!.uid), payload, { merge: true });
                 setSyncStatus('IDLE');
             } catch (e: any) {
                 console.error("❌ [Sync] Upload failed:", e);
                 if (e.code === 'permission-denied') {
                     setSyncStatus('DENIED');
                 } else {
                     setSyncStatus('ERROR');
                 }
             }
        }, 2000);
    });

    return () => {
        unsubscribeStore();
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
    }
  }, []);

  // Keyboard Navigation for Dates
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEditor) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowLeft') {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d.toISOString().split('T')[0]);
      }
      if (e.key === 'ArrowRight') {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d.toISOString().split('T')[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditor, selectedDate]);

  // Reset selected activity when date changes
  useEffect(() => {
    setSelectedActivityId(null);
  }, [selectedDate]);

  const currentActivities = useMemo(() => {
    return getComputedActivities(days, protocols, selectedDate);
  }, [days, protocols, selectedDate]);
  
  const selectedActivity = useMemo(() => 
    currentActivities.find(a => a.id === selectedActivityId) || null
  , [currentActivities, selectedActivityId]);

  if (!userConfig.onboardingComplete) {
    return <Onboarding />;
  }

  // --- Handlers ---

  const openInject = (activity: Activity | null = null, e?: React.MouseEvent) => {
    if (activity && activity.id.startsWith('virtual-')) return;
    if (!currentProtocolId) {
        setMenuCoords(e ? { x: e.clientX, y: e.clientY } : null);
        setShowProtocolMenu(true);
        return;
    }
    setEditingActivity(activity);
    setShowEditor(true);
  };

  const handleSaveActivity = (def: ActivityDefinition) => {
    if (!currentProtocolId) return;
    const finalDef = { ...def, id: editingActivity?.id || crypto.randomUUID() };
    if (editingActivity) {
      updateActivityInProtocol(currentProtocolId, finalDef);
    } else {
      addActivityToProtocol(currentProtocolId, finalDef);
    }
    setShowEditor(false);
  };

  const handleClickDeleteActivity = (id: string) => {
     if (!currentProtocolId || !id) return;
     setDeleteActivityConfirm({ isOpen: true, id });
  };

  const executeDeleteActivity = () => {
    if (currentProtocolId && deleteActivityConfirm.id) {
        removeActivityFromProtocol(currentProtocolId, deleteActivityConfirm.id);
        setShowEditor(false);
    }
  };

  const toggleProtocolMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuCoords({ x: e.clientX, y: e.clientY });
    setShowProtocolMenu(!showProtocolMenu);
  };
  
  const handleSlotSelect = (id: string) => {
     setSelectedActivityId(prev => prev === id ? null : id);
  };
  
  const handleSlotEdit = (a: Activity) => {
     openInject(a);
  };
  
  const handleCircleSelect = (a: Activity) => {
    handleSlotSelect(a.id);
  }

  const handleOpenSheet = (a: Activity) => {
      setActiveSheetActivity(a);
  };

  // --- Views Renders ---

  const renderMobileDayView = () => {
    const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const THRESHOLD = 50;
        if (info.offset.x > THRESHOLD) {
            // Swipe Right -> Prev Day
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().split('T')[0]);
        } else if (info.offset.x < -THRESHOLD) {
            // Swipe Left -> Next Day
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().split('T')[0]);
        }
    };

    return (
      <div className="flex flex-col min-h-full bg-[#020202]">
         {/* STICKY MINI HEADER */}
         <motion.div 
           style={{ opacity: miniHeaderOpacity, y: miniHeaderY, pointerEvents: miniHeaderPointerEvents }}
           className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 px-6 py-4 pt-safe-top flex items-center justify-between"
         >
            <div className="flex flex-col">
               <span className="type-label text-zinc-500">{t.protocol.active_label}</span>
               <span className="type-h3 text-white truncate max-w-[200px]">{currentProtocolName || t.protocol.no_active}</span>
            </div>
            <div className="flex items-center gap-4">
               {syncStatus === 'SYNCING' && <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />}
               <span className="type-mono-body text-cyan-400">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
               </span>
            </div>
         </motion.div>
  
         {/* SCROLLABLE CONTENT WITH SWIPE AREA */}
         {/* Wrapped in motion.div for Swipe Gesture */}
         <motion.div 
             className="w-full flex flex-col gap-8 px-4 pt-8 pb-12 bg-[#020202] touch-pan-y"
             drag="x"
             dragConstraints={{ left: 0, right: 0 }}
             dragElastic={0.2}
             onDragEnd={handleSwipe}
         >
              <DateHeader />
              <div className="flex justify-center my-4 pointer-events-none">
                  <div className="pointer-events-auto">
                    <TimeCircle 
                        activities={currentActivities} 
                        onSelectSlot={handleCircleSelect} 
                        size={300}
                        hoveredId={hoveredActivityId}
                        onHover={setHoveredActivityId}
                        selectedDate={selectedDate}
                    />
                  </div>
              </div>
         </motion.div>
  
         <div className="bg-[#020202] relative z-30 px-4 pt-8 pb-40">
              <div className="flex items-center justify-between px-2 mb-6">
                  <h3 className="type-h2 text-white">{t.protocol.label}</h3>
                  <div className="flex gap-4">
                      <Button size="icon" variant="secondary" onClick={toggleProtocolMenu} icon={<BookTemplate />} />
                      <Button size="icon" variant="primary" onClick={(e) => openInject(null, e)} icon={<Plus />} />
                  </div>
              </div>
  
              {currentProtocolName ? (
                  <SlotList 
                      activities={currentActivities} 
                      selectedDate={selectedDate}
                      onEdit={handleSlotEdit}
                      onHover={setHoveredActivityId}
                      hoveredId={hoveredActivityId}
                      selectedId={selectedActivityId}
                      onSelect={handleSlotSelect}
                      onOpenContext={handleOpenSheet}
                  />
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
                      <AlertTriangle className="w-16 h-16 text-zinc-700 mb-6" />
                      <h3 className="type-body text-zinc-500 uppercase mb-4">{t.protocol.no_signal}</h3>
                      <Button size="md" variant="secondary" onClick={(e) => toggleProtocolMenu(e)}>{t.protocol.assign}</Button>
                  </div>
              )}
         </div>
  
         <ProtocolContextMenu 
            isOpen={showProtocolMenu} 
            onClose={() => setShowProtocolMenu(false)} 
            targetDate={selectedDate}
            coords={menuCoords}
          />
      </div>
    );
  };

  const renderDesktopDayView = () => (
     <motion.div
        key="day-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-row h-full overflow-hidden w-full gap-0"
      >
        <div className="flex flex-col relative z-10 w-[50rem] shrink-0 h-full py-12 bg-transparent justify-between border-r border-white/5">
           <div className="w-full px-8 z-50">
              <DateHeader />
           </div>

           <div className="flex items-start justify-center relative mt-[5rem] mb-20 flex-1">
             <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
                <TimeCircle 
                  activities={currentActivities} 
                  onSelectSlot={handleCircleSelect} 
                  size={360}
                  hoveredId={hoveredActivityId}
                  onHover={setHoveredActivityId}
                  selectedDate={selectedDate}
                />
             </div>
           </div>

           <div className="w-full px-8 mt-auto">
             <EnergyTank currentEnergy={energy} />
           </div>
        </div>

        <div className="flex-1 w-full h-full flex flex-row bg-[#020202]">
          <div className="flex-1 flex flex-col h-full border-r border-white/5 min-w-0 relative">
              <div className="px-8 pt-12 pb-8 shrink-0 bg-[#020202] z-20 border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4 min-h-[48px]">
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-3">
                         <h3 className="type-h1 text-white truncate leading-none mb-2">{t.protocol.label}</h3>
                         {/* VISUAL SYNC INDICATOR */}
                         {currentUser && (
                             <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                                 syncStatus === 'SYNCING' ? 'bg-cyan-900/20 border-cyan-500/20 text-cyan-400' :
                                 syncStatus === 'ERROR' ? 'bg-red-900/20 border-red-500/20 text-red-400' :
                                 syncStatus === 'DENIED' ? 'bg-orange-900/20 border-orange-500/20 text-orange-400' :
                                 'bg-zinc-800 border-white/5 text-zinc-500'
                             }`}>
                                 {syncStatus === 'SYNCING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                                 {syncStatus === 'IDLE' && <CheckCircle2 className="w-3 h-3" />}
                                 {syncStatus === 'ERROR' && <WifiOff className="w-3 h-3" />}
                                 {syncStatus === 'DENIED' && <Lock className="w-3 h-3" />}
                                 <span className="text-[10px] font-bold uppercase tracking-wider">
                                     {syncStatus === 'IDLE' ? t.protocol.synced : syncStatus}
                                 </span>
                             </div>
                         )}
                      </div>
                      {currentProtocolName ? (
                        <span className="type-mono-sm text-zinc-500 truncate block">{currentProtocolName}</span>
                      ) : (
                        <span className="type-mono-sm text-zinc-600 animate-pulse block">{t.protocol.no_active}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 relative">
                      <div className="relative">
                        <Button 
                          variant={!currentProtocolName ? 'primary' : 'secondary'} 
                          size="md"
                          onClick={toggleProtocolMenu} 
                          icon={<BookTemplate />} 
                          className={showProtocolMenu ? 'bg-zinc-800 text-white' : ''}
                        >
                            {!currentProtocolName && t.protocol.select}
                        </Button>
                        
                        <ProtocolContextMenu 
                          isOpen={showProtocolMenu} 
                          onClose={() => setShowProtocolMenu(false)} 
                          targetDate={selectedDate}
                          coords={menuCoords}
                        />
                      </div>

                      <Button variant="primary" size="md" onClick={(e) => openInject(null, e)} icon={<Plus />} disabled={!currentProtocolId}>
                        {t.protocol.inject}
                      </Button>
                    </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                  {currentProtocolName ? (
                    <SlotList 
                      activities={currentActivities} 
                      selectedDate={selectedDate}
                      onEdit={handleSlotEdit}
                      onHover={setHoveredActivityId}
                      hoveredId={hoveredActivityId}
                      selectedId={selectedActivityId}
                      onSelect={handleSlotSelect}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
                       <AlertTriangle className="w-16 h-16 text-zinc-700 mb-6" />
                       <h3 className="type-body text-zinc-500 uppercase mb-4">{t.protocol.no_signal}</h3>
                       <Button size="md" variant="secondary" onClick={(e) => toggleProtocolMenu(e)}>{t.protocol.assign}</Button>
                    </div>
                  )}
              </div>
          </div>

          <div className="flex-none w-[50rem] h-full min-w-0">
              <Logbook selectedDate={selectedDate} selectedActivity={selectedActivity} />
          </div>
        </div>
      </motion.div>
  );

  const renderView = () => {
    switch (view) {
      case 'WEEK': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><WeekView /></div>;
      case 'MONTH': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><MonthView /></div>;
      case 'SETTINGS': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><SettingsView /></div>;
      case 'PROTOCOLS': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><ProtocolManager /></div>;
      case 'DAY':
      default:
        return <div className="w-full h-full overflow-hidden">
           {isMobile ? (
              <div ref={scrollContainerRef} className="h-full overflow-y-auto custom-scrollbar">
                {renderMobileDayView()}
              </div>
           ) : renderDesktopDayView()}
        </div>;
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-700 ${isBurnout ? 'glitch-red' : ''} bg-[#020202]`}>
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
             key={view}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="w-full h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <Navigation />

      <AnimatePresence>
        {showEditor && (
          <ActivityEditor 
            isOpen={showEditor}
            onClose={() => setShowEditor(false)}
            initialActivity={editingActivity}
            onSave={handleSaveActivity}
            onDelete={handleClickDeleteActivity}
            protocolName={currentProtocolName || ''}
            mode="modal" 
          />
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={deleteActivityConfirm.isOpen}
        onClose={() => setDeleteActivityConfirm({ ...deleteActivityConfirm, isOpen: false })}
        onConfirm={executeDeleteActivity}
        title={t.editor.confirm_delete}
        message={t.editor.confirm_msg}
        confirmLabel={t.editor.delete}
        isDangerous
      />

      <BottomSheet
         isOpen={!!activeSheetActivity}
         onClose={() => setActiveSheetActivity(null)}
         title={null} 
      >
         <div className="pb-8 h-full">
            <Logbook selectedDate={selectedDate} selectedActivity={activeSheetActivity} />
         </div>
      </BottomSheet>
    </div>
  );
};

export default App;

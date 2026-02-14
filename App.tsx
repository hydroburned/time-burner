
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Plus, BookTemplate, Info, AlertTriangle, Menu, Cloud, RefreshCw } from 'lucide-react';
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
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const { 
    view, energy, selectedDate, days, protocols, 
    addActivityToProtocol, updateActivityInProtocol, removeActivityFromProtocol, 
    userConfig, setView, setReturnView, setSelectedDate,
    currentUser, setCurrentUser, replaceState
  } = useStore();
  
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
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sync Refs to prevent closure staleness and loops
  const isRemoteUpdate = useRef(false);
  const saveTimeout = useRef<any>(null);

  // Mobile / Scroll State
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  // Ref for the scrollable container (Mobile Day View)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Uses the scroll container ref for tracking scroll on mobile
  const { scrollY } = useScroll({ container: scrollContainerRef }); 

  // Header Animation: Fade IN the sticky header when we scroll past the clock (approx 300px)
  const miniHeaderOpacity = useTransform(scrollY, [250, 350], [0, 1]);
  const miniHeaderY = useTransform(scrollY, [250, 350], [-20, 0]);
  const miniHeaderPointerEvents = useTransform(scrollY, (value) => value > 300 ? 'auto' : 'none');

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

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- FIREBASE SYNC LOGIC ---
  useEffect(() => {
    // 1. Listen for Auth State Changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, [setCurrentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    // 2. Setup Realtime Listener (Cloud -> Local)
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      // CRITICAL: Ignore updates that originate from our own local writes (latency compensation)
      if (docSnap.metadata.hasPendingWrites) return;

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          console.log("SYNC: Cloud data received (Overwriting Local)");
          isRemoteUpdate.current = true;
          
          // SCENARIO 1: Phone Login / Sync Update
          // If cloud has data, we trust it implicitly.
          replaceState({
             days: data.days || {},
             protocols: data.protocols || [],
             userConfig: { ...userConfig, ...(data.userConfig || {}) },
             energy: data.energy ?? 50
          });

          // Reset flag after state settles to allow future local edits
          setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
        }
      } else {
        // SCENARIO 2: First Time Login (No cloud data)
        // Upload LOCAL data to initialize the Cloud.
        console.log("SYNC: No cloud data found (Initializing from Local)");
        
        const state = useStore.getState();
        const payload = sanitizeForFirestore({
            days: state.days,
            protocols: state.protocols,
            userConfig: state.userConfig,
            energy: state.energy,
            createdAt: new Date().toISOString()
        });

        setDoc(userDocRef, payload, { merge: true })
            .then(() => console.log("SYNC: Initialization Complete"))
            .catch(err => console.error("SYNC: Initialization Failed", err));
      }
    }, (error) => {
        console.error("Sync listener error:", error);
    });

    // 3. Setup Store Subscription (Local -> Cloud)
    const unsubscribeStore = useStore.subscribe((state) => {
        // If this update came from the cloud, DO NOT echo it back
        if (isRemoteUpdate.current) return;
        
        // Debounce the save to prevent spamming Firestore
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        
        setIsSyncing(true);
        saveTimeout.current = setTimeout(async () => {
            // Double check flag inside timeout in case a cloud update came in during the delay
            if (isRemoteUpdate.current) {
                setIsSyncing(false);
                return;
            }

            try {
                if (!auth.currentUser) return;

                const payload = sanitizeForFirestore({
                    days: state.days,
                    protocols: state.protocols,
                    userConfig: state.userConfig,
                    energy: state.energy,
                    updatedAt: new Date().toISOString()
                });

                await setDoc(userDocRef, payload, { merge: true });
            } catch (error) {
                console.error("Sync failed", error);
            } finally {
                setIsSyncing(false);
            }
        }, 2000); // 2 second debounce
    });

    return () => {
        unsubscribeSnapshot();
        unsubscribeStore();
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [currentUser?.uid]); // Only re-run if UID changes

  // Keyboard Navigation for Dates
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If editor is open, don't navigate dates
      if (showEditor) return;
      
      // If typing, don't navigate
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
    // Cannot edit virtual slots
    if (activity && activity.id.startsWith('virtual-')) return;
    
    // If no protocol, warn or prompt user
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

    // Preserve the ID if editing, or create new if adding
    const finalDef = {
      ...def,
      id: editingActivity?.id || crypto.randomUUID()
    };

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

  const renderMobileDayView = () => (
    // Updated: h-full overflow-y-auto to handle scroll internally within the fixed app container
    <div className="flex flex-col min-h-full bg-[#020202]">
       
       {/* STICKY MINI HEADER */}
       {/* It sits on top but is hidden/transparent until scroll */}
       <motion.div 
         style={{ opacity: miniHeaderOpacity, y: miniHeaderY, pointerEvents: miniHeaderPointerEvents }}
         className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 px-6 py-4 pt-safe-top flex items-center justify-between"
       >
          <div className="flex flex-col">
             <span className="type-label text-zinc-500">Active Protocol</span>
             <span className="type-h3 text-white truncate max-w-[200px]">{currentProtocolName || 'No Protocol'}</span>
          </div>
          <div className="flex items-center gap-4">
             {isSyncing && <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />}
             <span className="type-mono-body text-cyan-400">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
             </span>
          </div>
       </motion.div>

       {/* SCROLLABLE CONTENT START */}
       
       {/* 1. Large Header & Clock (Scrolls naturally) */}
       <div className="w-full flex flex-col gap-8 px-4 pt-8 pb-12 bg-[#020202]">
            <DateHeader />
            
            <div className="flex justify-center my-4">
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

       {/* 2. List Area (Scrolls naturally below clock) */}
       {/* ADDED PT-8 padding top to prevent overlap with Current Phase block */}
       <div className="bg-[#020202] relative z-30 px-4 pt-8 pb-40">
            {/* List Controls */}
            <div className="flex items-center justify-between px-2 mb-6">
                <h3 className="type-h2 text-white">Protocol</h3>
                <div className="flex gap-4">
                    <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={toggleProtocolMenu}
                    icon={<BookTemplate />}
                    />
                    <Button 
                    size="icon" 
                    variant="primary" 
                    onClick={(e) => openInject(null, e)}
                    icon={<Plus />}
                    />
                </div>
            </div>

            {/* Slot List */}
            {currentProtocolName ? (
                <SlotList 
                activities={currentActivities} 
                selectedDate={selectedDate}
                onEdit={handleSlotEdit}
                onHover={setHoveredActivityId}
                hoveredId={hoveredActivityId}
                selectedId={selectedActivityId}
                onSelect={handleSlotSelect}
                onOpenContext={handleOpenSheet} // Passed for Sheet, but List handles interactions now
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
                    <AlertTriangle className="w-16 h-16 text-zinc-700 mb-6" />
                    <h3 className="type-body text-zinc-500 uppercase mb-4">No Signal</h3>
                    <Button size="md" variant="secondary" onClick={(e) => toggleProtocolMenu(e)}>Assign Protocol</Button>
                </div>
            )}
       </div>

       {/* MOBILE MENUS */}
       <ProtocolContextMenu 
          isOpen={showProtocolMenu} 
          onClose={() => setShowProtocolMenu(false)} 
          targetDate={selectedDate}
          coords={menuCoords}
        />
    </div>
  );

  const renderDesktopDayView = () => (
     <motion.div
        key="day-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        // Changed h-screen to h-full to fit within parent
        className="flex flex-row h-full overflow-hidden w-full gap-0"
      >
        {/* LEFT COLUMN */}
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

        {/* RIGHT COLUMN */}
        <div className="flex-1 w-full h-full flex flex-row bg-[#020202]">
          <div className="flex-1 flex flex-col h-full border-r border-white/5 min-w-0 relative">
              {/* Header */}
              <div className="px-8 pt-12 pb-8 shrink-0 bg-[#020202] z-20 border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4 min-h-[48px]">
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-3">
                         <h3 className="type-h1 text-white truncate leading-none mb-2">Protocol</h3>
                         {isSyncing && <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />}
                      </div>
                      {currentProtocolName ? (
                        <span className="type-mono-sm text-zinc-500 truncate block">{currentProtocolName}</span>
                      ) : (
                        <span className="type-mono-sm text-zinc-600 animate-pulse block">NO PROTOCOL</span>
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
                            {!currentProtocolName && "Select"}
                        </Button>
                        
                        <ProtocolContextMenu 
                          isOpen={showProtocolMenu} 
                          onClose={() => setShowProtocolMenu(false)} 
                          targetDate={selectedDate}
                          coords={menuCoords}
                        />
                      </div>

                      <Button 
                        variant="primary" 
                        size="md" 
                        onClick={(e) => openInject(null, e)} 
                        icon={<Plus />}
                        disabled={!currentProtocolId}
                      >
                        Inject
                      </Button>
                    </div>
                  </div>
              </div>

              {/* SLOT LIST */}
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
                       <h3 className="type-body text-zinc-500 uppercase mb-4">No Signal</h3>
                       <Button size="md" variant="secondary" onClick={(e) => toggleProtocolMenu(e)}>Assign Protocol</Button>
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

  // Wrappers now handle the scroll context
  const renderView = () => {
    switch (view) {
      case 'WEEK': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><WeekView /></div>;
      case 'MONTH': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><MonthView /></div>;
      case 'SETTINGS': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><SettingsView /></div>;
      case 'PROTOCOLS': return <div className="w-full h-full overflow-y-auto custom-scrollbar"><ProtocolManager /></div>;
      case 'DAY':
      default:
        // Day Views handle their own scrolling (Mobile = internal, Desktop = flex columns)
        // Wrapped in div to match height of parent
        return <div className="w-full h-full overflow-hidden">
           {isMobile ? (
              // Use ref here to track scroll for sticky header
              <div ref={scrollContainerRef} className="h-full overflow-y-auto custom-scrollbar">
                {renderMobileDayView()}
              </div>
           ) : renderDesktopDayView()}
        </div>;
    }
  };

  return (
    // Changed: h-screen overflow-hidden to fix the layout context
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
        title="Delete Slot?"
        message="Are you sure you want to delete this slot? This will affect every day using this protocol."
        confirmLabel="Delete"
        isDangerous
      />

      {/* MOBILE BOTTOM SHEET FOR LOGBOOK */}
      <BottomSheet
         isOpen={!!activeSheetActivity}
         onClose={() => setActiveSheetActivity(null)}
         // Don't pass title to avoid duplication, the Logbook handles it nicely
         title={null} 
      >
         <div className="pb-8 h-full">
            <Logbook 
                selectedDate={selectedDate} 
                selectedActivity={activeSheetActivity} 
            />
         </div>
      </BottomSheet>
    </div>
  );
};

export default App;

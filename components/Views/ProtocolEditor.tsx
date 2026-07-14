
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useStore } from '../../store';
import { 
  ChevronLeft,
  Check,
  Trash2,
} from 'lucide-react';
import { ActivityDefinition, SlotType, Protocol } from '../../types';
import { COLORS } from '../../constants';
import { timeToMinutes, minutesToTime } from '../../utils';
import { Button } from '../UI';
import { ActivityEditor } from '../ActivityEditor';
import { ConfirmationModal } from '../ConfirmationModal';

// Different scales for Mobile vs Desktop
const PIXELS_PER_MINUTE_MOBILE = 1.5;
const PIXELS_PER_MINUTE_DESKTOP = 3; // 1.5x of previous 2.0 or general desktop scale

const SNAP_MINUTES = 15;
const TOTAL_MINUTES = 1440;

interface ProtocolEditorProps {
  initialProtocol?: Protocol | null; // If null, we are creating a new one
  onClose: () => void;
}

export const ProtocolEditor: React.FC<ProtocolEditorProps> = ({ initialProtocol, onClose }) => {
  const { addProtocol, updateProtocol, deleteProtocol } = useStore();
  
  const [draftActivities, setDraftActivities] = useState<ActivityDefinition[]>([]);
  const [protocolName, setProtocolName] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, time: number} | null>(null);
  
  // Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; startMins: number; type: 'MOVE' | 'RESIZE_R' | 'RESIZE_L'; startDuration: number; } | null>(null);

  // Motion Values for Drag Scroll Tracking
  const scrollX = useMotionValue(0);
  const scrollY = useMotionValue(0);

  const pixelsPerMinute = isMobile ? PIXELS_PER_MINUTE_MOBILE : PIXELS_PER_MINUTE_DESKTOP;

  // Initialize State
  useEffect(() => {
    if (initialProtocol) {
      setDraftActivities(JSON.parse(JSON.stringify(initialProtocol.activities))); // Deep copy
      setProtocolName(initialProtocol.name);
    } else {
      setDraftActivities([]);
      setProtocolName(`Protocol ${new Date().toLocaleDateString()}`);
    }
  }, [initialProtocol]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- ACTIONS ---

  const handleSave = () => {
    if (draftActivities.length === 0) return;
    
    if (initialProtocol) {
      // UPDATE EXISTING
      updateProtocol(initialProtocol.id, {
        name: protocolName,
        activities: draftActivities
      });
    } else {
      // CREATE NEW
      addProtocol(protocolName, draftActivities);
    }
    onClose();
  };

  const handleInitialDeleteClick = () => {
    if (initialProtocol) {
      setShowDeleteConfirm(true);
    } else {
      onClose(); // Just close if it was a draft
    }
  };

  const executeDeleteProtocol = () => {
    if (initialProtocol) {
       deleteProtocol(initialProtocol.id);
       onClose();
    }
  };

  const updateNode = useCallback((id: string, updates: Partial<ActivityDefinition>) => {
    setDraftActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setDraftActivities(prev => prev.filter(a => a.id !== id));
    setEditingNodeId(null);
  }, []);

  // Keyboard Shortcuts (Delete/Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingNodeId) return;
      
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteNode(editingNodeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNodeId, deleteNode]);

  // --- INTERACTION HANDLERS ---

  const addNode = (type: SlotType, atTime?: number) => {
    let startMins = atTime ?? 540;
    
    // Auto-place logic
    if (atTime === undefined && draftActivities.length > 0) {
      const sorted = [...draftActivities].sort((a,b) => (timeToMinutes(a.startTime) + a.duration) - (timeToMinutes(b.startTime) + b.duration));
      const last = sorted[sorted.length - 1];
      startMins = timeToMinutes(last.startTime) + last.duration;
    }
    
    if (startMins >= TOTAL_MINUTES - 60) startMins = TOTAL_MINUTES - 60;
    startMins = Math.round(startMins / SNAP_MINUTES) * SNAP_MINUTES;

    const newNode: ActivityDefinition = {
      id: crypto.randomUUID(),
      title: `New ${type} Block`,
      startTime: minutesToTime(startMins),
      duration: 60,
      type,
      description: '',
      priority: false
    };
    setDraftActivities(prev => [...prev, newNode]);
    setContextMenu(null);
  };

  const handlePointerDown = (e: React.PointerEvent, nodeId: string, type: 'MOVE' | 'RESIZE_R' | 'RESIZE_L') => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const node = draftActivities.find(n => n.id === nodeId);
    if (!node) return;

    dragRef.current = { nodeId, startX: e.clientX, startY: e.clientY, startMins: timeToMinutes(node.startTime), startDuration: node.duration, type };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    
    const { nodeId, startX, startY, startMins, startDuration, type } = dragRef.current;
    
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    
    e.stopPropagation();
    
    const deltaPx = isMobile ? (e.clientY - startY) : (e.clientX - startX);
    const deltaMins = deltaPx / pixelsPerMinute;

    if (type === 'MOVE') {
      const rawMins = startMins + deltaMins;
      const snappedMins = Math.round(rawMins / SNAP_MINUTES) * SNAP_MINUTES;
      const safeMins = Math.max(0, Math.min(TOTAL_MINUTES - startDuration, snappedMins));
      updateNode(nodeId, { startTime: minutesToTime(safeMins) });
    } else if (type === 'RESIZE_R') {
      const rawDuration = startDuration + deltaMins;
      const safeDuration = Math.max(SNAP_MINUTES, Math.min(TOTAL_MINUTES - startMins, Math.round(rawDuration / SNAP_MINUTES) * SNAP_MINUTES));
      updateNode(nodeId, { duration: safeDuration });
    } else if (type === 'RESIZE_L') {
       const rawMins = startMins + deltaMins;
       const snappedMins = Math.round(rawMins / SNAP_MINUTES) * SNAP_MINUTES;
       const newDuration = startDuration - (snappedMins - startMins);
       if (newDuration >= SNAP_MINUTES && snappedMins >= 0) updateNode(nodeId, { startTime: minutesToTime(snappedMins), duration: newDuration });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const { nodeId, startX, startY, type } = dragRef.current;
      
      if (type === 'MOVE') {
          const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
          if (dist < 5) {
              setEditingNodeId(nodeId);
          }
      }

      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  };

  const handleDockDragEnd = (e: any, info: any, type: SlotType) => {
    if (!scrollContainerRef.current) return;
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    
    const isInside = 
        info.point.x >= containerRect.left && 
        info.point.x <= containerRect.right &&
        info.point.y >= containerRect.top &&
        info.point.y <= containerRect.bottom;

    if (isInside) {
        let timeMins = 0;
        
        const currentScrollX = scrollX.get();
        const currentScrollY = scrollY.get();

        if (isMobile) {
            const relativeY = info.point.y - containerRect.top;
            const absoluteY = relativeY - currentScrollY; 
            timeMins = absoluteY / pixelsPerMinute;
        } else {
            const relativeX = info.point.x - containerRect.left;
            const absoluteX = relativeX - currentScrollX;
            timeMins = absoluteX / pixelsPerMinute;
        }
        
        timeMins -= 30; 
        addNode(type, Math.max(0, timeMins));
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    
    const currentScrollX = scrollX.get();
    const currentScrollY = scrollY.get();

    let timeMins = 0;
    if (isMobile) {
        timeMins = (e.clientY - rect.top - currentScrollY) / pixelsPerMinute;
    } else {
        timeMins = (e.clientX - rect.left - currentScrollX) / pixelsPerMinute;
    }
    setContextMenu({ x: e.clientX, y: e.clientY, time: timeMins });
  };

  const handleModalSave = (def: ActivityDefinition) => {
     if(editingNodeId) {
         updateNode(editingNodeId, def);
     }
  };

  const editingNode = draftActivities.find(a => a.id === editingNodeId);
  const canvasSize = (TOTAL_MINUTES * pixelsPerMinute) + (isMobile ? 400 : 0); 

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 bg-black z-[150] flex flex-col overflow-hidden select-none pb-safe"
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 h-32 border-b border-white/5 bg-zinc-950 z-50 shrink-0">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <Button size="icon" variant="secondary" onClick={onClose} icon={<ChevronLeft />} />
          <input 
            value={protocolName}
            onChange={(e) => setProtocolName(e.target.value)}
            className="bg-transparent border-none type-h2 font-bold text-white w-full outline-none placeholder-zinc-700 truncate min-w-0"
            placeholder="Protocol Name"
          />
        </div>
        <div className="flex items-center gap-4 shrink-0">
            {initialProtocol && (
               <Button 
                variant="danger" 
                size="icon" 
                onClick={handleInitialDeleteClick} 
                icon={<Trash2 />}
                title="Delete Protocol"
                className="w-20 h-20"
               />
            )}
            <Button 
                variant="primary" 
                size="icon" 
                onClick={handleSave} 
                disabled={draftActivities.length === 0} 
                icon={<Check />}
                className="w-20 h-20" 
            />
        </div>
      </div>

      {/* Editor Canvas - DRAG SCROLL */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-hidden relative bg-[#020202] cursor-crosshair"
      >
        <motion.div 
            className="relative" 
            drag={isMobile ? "y" : "x"}
            dragConstraints={{ 
                top: isMobile ? -canvasSize + window.innerHeight - 200 : 0, 
                bottom: 0,
                left: isMobile ? 0 : -canvasSize + window.innerWidth - 200,
                right: 0
            }}
            dragElastic={0.1}
            style={{ 
                x: scrollX,
                y: scrollY,
                height: isMobile ? canvasSize : '100%', 
                width: isMobile ? '100%' : canvasSize 
            }}
            onContextMenu={handleContextMenu}
            onClick={() => {
                setContextMenu(null);
                setEditingNodeId(null);
            }}
        >
            {/* Grid Lines & Labels */}
            {Array.from({ length: 25 }).map((_, h) => (
              <div 
                key={h} 
                className={`absolute border-white/5 pointer-events-none ${isMobile ? 'left-0 right-0 border-t' : 'top-0 bottom-0 border-l'}`}
                style={{ 
                  [isMobile ? 'top' : 'left']: h * 60 * pixelsPerMinute,
                }}
              >
                <span className={`absolute type-mono-sm text-zinc-600 select-none z-10 px-1 ${isMobile ? 'left-2 -top-2' : 'left-2 top-2'}`}>
                  {h.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {/* Nodes Rendering */}
            {draftActivities.map((node) => {
              const pos = timeToMinutes(node.startTime) * pixelsPerMinute;
              const size = node.duration * pixelsPerMinute;
              const isEditing = editingNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onPointerDown={(e) => handlePointerDown(e, node.id, 'MOVE')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); }}
                  className={`absolute rounded-[1.5rem] border flex flex-col p-6 cursor-grab overflow-hidden group ${isEditing ? 'z-30 ring-2 ring-cyan-500 bg-zinc-900 shadow-xl' : 'z-20 bg-zinc-900/60'}`}
                  style={{ 
                    [isMobile ? 'top' : 'left']: pos,
                    [isMobile ? 'height' : 'width']: size,
                    [isMobile ? 'width' : 'height']: isMobile ? '60%' : '140px', 
                    [isMobile ? 'left' : 'top']: isMobile ? '20%' : '80px',
                    backgroundColor: `${COLORS[node.type]}22`,
                    borderColor: `${COLORS[node.type]}44`,
                  }}
                >
                  <span className="type-body font-bold text-white truncate leading-tight pointer-events-none select-none">{node.title}</span>
                  <span className="type-mono-sm text-zinc-400 mt-1 pointer-events-none select-none">{node.startTime}</span>
                  
                  {isMobile ? (
                    <>
                        {/* Top Handle (Start) */}
                        <div
                        onPointerDown={(e) => handlePointerDown(e, node.id, 'RESIZE_L')}
                        className="absolute left-0 right-0 top-0 h-10 cursor-ns-resize flex items-start justify-center z-40 hover:bg-white/5 active:bg-white/10"
                        >
                           <div className="w-16 h-1.5 bg-white/30 rounded-full mt-3" />
                        </div>

                        {/* Bottom Handle (Duration) */}
                        <div
                        onPointerDown={(e) => handlePointerDown(e, node.id, 'RESIZE_R')}
                        className="absolute left-0 right-0 bottom-0 h-10 cursor-ns-resize flex items-end justify-center z-40 hover:bg-white/5 active:bg-white/10"
                        >
                           <div className="w-16 h-1.5 bg-white/30 rounded-full mb-3" />
                        </div>
                    </>
                  ) : (
                    <>
                      {/* Desktop Side Handles */}
                      <div 
                        onPointerDown={(e) => handlePointerDown(e, node.id, 'RESIZE_R')} 
                        className="absolute right-0 top-0 bottom-0 w-8 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20"
                      >
                        <div className="w-1.5 h-12 bg-white/20 rounded-full" />
                      </div>
                      
                      <div 
                        onPointerDown={(e) => handlePointerDown(e, node.id, 'RESIZE_L')} 
                        className="absolute left-0 top-0 bottom-0 w-8 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20"
                      >
                        <div className="w-1.5 h-12 bg-white/20 rounded-full" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </motion.div>
      </div>
        
      {/* Dock (Left Menu on Desktop, Bottom on Mobile) */}
      {/* HIDDEN WHEN EDITING TO PREVENT Z-INDEX ISSUES */}
      <div 
          className={`absolute z-[160] flex gap-6 pointer-events-auto transition-all duration-300 ${
            editingNodeId ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
          } ${isMobile ? 'bottom-8 left-0 right-0 justify-center' : 'left-6 top-1/2 -translate-y-1/2 flex-col'}`}
      >
          {(['BURN', 'FUEL', 'REST', 'VOID'] as SlotType[]).map(type => (
              <motion.div 
              key={type} 
              drag 
              dragMomentum={false}
              dragElastic={0}
              dragTransition={{ power: 0, timeConstant: 0 }} 
              dragSnapToOrigin 
              onDragEnd={(e, info) => handleDockDragEnd(e, info, type)}
              whileDrag={{ scale: 1.1, zIndex: 999 }}
              className={`${isMobile ? 'w-28 h-28 rounded-2xl' : 'w-44 h-44 rounded-xl'} bg-zinc-900/90 backdrop-blur border border-white/10 flex flex-col items-center justify-center gap-3 cursor-grab shadow-lg hover:border-white/20 hover:scale-105`}
              >
                  <div className="w-4 h-4 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[type], color: COLORS[type] }} />
                  <span className="type-label text-zinc-500">{type}</span>
              </motion.div>
          ))}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
          {contextMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed z-[200] bg-zinc-800 border border-white/10 rounded-xl shadow-2xl p-2 min-w-[200px] flex flex-col gap-1"
                style={{ left: Math.min(window.innerWidth - 220, contextMenu.x), top: Math.min(window.innerHeight - 250, contextMenu.y) }}
              >
                <div className="px-3 py-2 type-label text-zinc-500 border-b border-white/5 mb-1">
                  Insert at {minutesToTime(Math.round(contextMenu.time / SNAP_MINUTES) * SNAP_MINUTES)}
                </div>
                {(['BURN', 'FUEL', 'REST', 'VOID'] as SlotType[]).map(type => (
                  <button 
                    key={type}
                    onClick={() => addNode(type, contextMenu.time)}
                    className="text-left px-4 py-3 type-mono-body text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-8"
                  >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[type] }} />
                      {type} Block
                  </button>
                ))}
              </motion.div>
          )}
      </AnimatePresence>

      {/* Node Editor Panel */}
      <ActivityEditor 
          isOpen={!!editingNode}
          onClose={() => setEditingNodeId(null)}
          initialActivity={editingNode}
          onSave={handleModalSave}
          onDelete={() => editingNodeId && deleteNode(editingNodeId)}
          mode="panel" 
      />

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDeleteProtocol}
        title="Delete Protocol?"
        message={`Are you sure you want to delete "${protocolName}"? This cannot be undone.`}
        confirmLabel="Delete"
        isDangerous
      />
    </motion.div>
  );
};

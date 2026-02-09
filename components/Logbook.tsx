
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, StickyNote, ListTodo, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { Activity, ChecklistItem } from '../types';
import { COLORS } from '../constants';

interface LogbookProps {
  selectedDate: string;
  selectedActivity: Activity | null;
}

export const Logbook: React.FC<LogbookProps> = ({ selectedDate, selectedActivity }) => {
  const { days, updateActivityLog, updateDailyNote, updateDailyChecklist } = useStore();
  
  const dayState = days[selectedDate];
  const [dailyNoteLocal, setDailyNoteLocal] = useState('');
  
  // Activity Specific State
  const [notesLocal, setNotesLocal] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  
  // Daily Checklist State
  const [newDailyChecklistText, setNewDailyChecklistText] = useState('');

  // Sync state from store when selection changes
  useEffect(() => {
    if (dayState) {
        setDailyNoteLocal(dayState.dailyNote || '');
    }
    
    if (dayState && selectedActivity) {
        const log = dayState.activityLogs[selectedActivity.id];
        setNotesLocal(log?.notes || '');
    }
  }, [dayState, selectedActivity?.id]);

  // Debounce Daily Note Save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dayState && dailyNoteLocal !== dayState.dailyNote) {
        updateDailyNote(selectedDate, dailyNoteLocal);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dailyNoteLocal, selectedDate]);

  // Debounce Activity Note Save
  useEffect(() => {
    if (!selectedActivity) return;
    const timer = setTimeout(() => {
        const currentLog = dayState?.activityLogs[selectedActivity.id];
        if (currentLog?.notes !== notesLocal) {
            updateActivityLog(selectedDate, selectedActivity.id, { notes: notesLocal });
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [notesLocal, selectedDate, selectedActivity?.id]);


  // --- Activity Actions ---

  const handleChecklistAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !newChecklistText.trim()) return;

    const currentLog = dayState?.activityLogs[selectedActivity.id] || { notes: '', checklist: [] };
    const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: newChecklistText.trim(),
        completed: false
    };

    updateActivityLog(selectedDate, selectedActivity.id, {
        checklist: [...(currentLog.checklist || []), newItem]
    });
    setNewChecklistText('');
  };

  const toggleChecklist = (itemId: string) => {
    if (!selectedActivity) return;
    const currentLog = dayState?.activityLogs[selectedActivity.id];
    if (!currentLog) return;

    const updatedChecklist = currentLog.checklist.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateActivityLog(selectedDate, selectedActivity.id, { checklist: updatedChecklist });
  };
  
  const deleteChecklist = (itemId: string) => {
    if (!selectedActivity) return;
    const currentLog = dayState?.activityLogs[selectedActivity.id];
    if (!currentLog) return;

    const updatedChecklist = currentLog.checklist.filter(item => item.id !== itemId);
    updateActivityLog(selectedDate, selectedActivity.id, { checklist: updatedChecklist });
  };

  // --- Daily Actions ---

  const handleDailyChecklistAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDailyChecklistText.trim()) return;

    const currentList = dayState?.dailyChecklist || [];
    const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: newDailyChecklistText.trim(),
        completed: false
    };

    updateDailyChecklist(selectedDate, [...currentList, newItem]);
    setNewDailyChecklistText('');
  };

  const toggleDailyChecklist = (itemId: string) => {
    const currentList = dayState?.dailyChecklist || [];
    const updatedList = currentList.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateDailyChecklist(selectedDate, updatedList);
  };

  const deleteDailyChecklist = (itemId: string) => {
    const currentList = dayState?.dailyChecklist || [];
    const updatedList = currentList.filter(item => item.id !== itemId);
    updateDailyChecklist(selectedDate, updatedList);
  };


  // --- Views ---

  const renderDailySummary = () => (
    <div className="flex flex-col h-full gap-8">
        <div className="flex items-center gap-4 text-zinc-500">
            <StickyNote className="w-6 h-6" />
            <span className="type-label">Daily Summary</span>
        </div>

        {/* Daily Checklist */}
        <div className="flex flex-col gap-4">
             <div className="flex flex-col gap-2">
                {dayState?.dailyChecklist?.map(item => (
                    <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleDailyChecklist(item.id)}>
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${item.completed ? 'bg-zinc-500 border-zinc-500' : 'border-zinc-700 bg-black'}`}>
                            {item.completed && <Check className="w-4 h-4 text-black" />}
                        </div>
                        <span className={`type-body flex-1 ${item.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{item.text}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteDailyChecklist(item.id); }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                        >
                            <Plus className="w-5 h-5 rotate-45" />
                        </button>
                    </div>
                ))}
                
                <form onSubmit={handleDailyChecklistAdd} className="flex items-center gap-4 p-2 pl-4 opacity-60 focus-within:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-zinc-500" />
                      <input 
                        value={newDailyChecklistText}
                        onChange={(e) => setNewDailyChecklistText(e.target.value)}
                        placeholder="Add daily task..."
                        className="bg-transparent border-none outline-none type-body text-white placeholder-zinc-700 flex-1 h-10"
                      />
                </form>
             </div>
        </div>
        
        <div className="h-px bg-white/5 w-full my-2" />

        <textarea 
            value={dailyNoteLocal}
            onChange={(e) => setDailyNoteLocal(e.target.value)}
            placeholder="Log general insights, mood, or retrospective notes for the day..."
            className="w-full flex-1 bg-zinc-950/30 border border-white/5 rounded-[2rem] p-8 type-body focus:border-white/10 outline-none resize-none placeholder-zinc-700 text-zinc-300 leading-relaxed"
        />
        
        {(!dayState || !dayState.protocolId) && (
            <div className="p-6 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 flex items-center gap-4">
                <AlertCircle className="w-8 h-8 text-orange-500" />
                <span className="type-mono-sm text-orange-400">No protocol assigned. Select one to enable tracking.</span>
            </div>
        )}
    </div>
  );

  const renderActivityLog = () => {
    if (!selectedActivity) return null;
    const log = dayState?.activityLogs[selectedActivity.id] || { notes: '', checklist: [] };

    return (
        <div className="flex flex-col h-full gap-8">
            {/* Header */}
            <div className="pb-8 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[selectedActivity.type] }} />
                    <span className="type-label" style={{ color: COLORS[selectedActivity.type] }}>{selectedActivity.type}</span>
                </div>
                {/* Mobile optimization: truncate title if too long */}
                <h3 className="type-h2 text-white leading-tight break-words">{selectedActivity.title}</h3>
                <span className="type-mono-sm text-zinc-500 mt-2 block">{selectedActivity.startTime} // {selectedActivity.duration}m</span>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-zinc-500">
                    <ListTodo className="w-5 h-5" />
                    <span className="type-label">Micro-Habits</span>
                </div>
                
                <div className="flex flex-col gap-2">
                    {log.checklist?.map(item => (
                        <div key={item.id} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleChecklist(item.id)}>
                            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${item.completed ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-700 bg-black'}`}>
                                {item.completed && <Check className="w-4 h-4 text-black" />}
                            </div>
                            <span className={`type-body flex-1 ${item.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{item.text}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteChecklist(item.id); }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                            >
                                <Plus className="w-5 h-5 rotate-45" /> {/* Close Icon */}
                            </button>
                        </div>
                    ))}
                    
                    <form onSubmit={handleChecklistAdd} className="flex items-center gap-4 p-2 pl-4 opacity-60 focus-within:opacity-100 transition-opacity">
                         <Plus className="w-5 h-5 text-zinc-500" />
                         <input 
                            value={newChecklistText}
                            onChange={(e) => setNewChecklistText(e.target.value)}
                            placeholder="Add execution step..."
                            className="bg-transparent border-none outline-none type-body text-white placeholder-zinc-700 flex-1 h-10"
                         />
                    </form>
                </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-4 flex-1 min-h-[200px]">
                <div className="flex items-center gap-3 text-zinc-500">
                    <StickyNote className="w-5 h-5" />
                    <span className="type-label">Execution Log</span>
                </div>
                <textarea 
                    value={notesLocal}
                    onChange={(e) => setNotesLocal(e.target.value)}
                    placeholder="Log executing details, friction points, or outputs..."
                    className="w-full flex-1 bg-zinc-950/30 border border-white/5 rounded-[2rem] p-6 type-body focus:border-white/10 outline-none resize-none placeholder-zinc-700 text-zinc-300 leading-relaxed custom-scrollbar"
                />
            </div>
        </div>
    );
  };

  return (
    // Updated padding: p-6 on mobile, p-10 on desktop.
    <div className="h-full bg-zinc-900/20 p-6 lg:p-10 overflow-y-auto custom-scrollbar w-full">
      <AnimatePresence mode="wait">
         <motion.div
           key={selectedActivity ? selectedActivity.id : 'summary'}
           initial={{ opacity: 0, x: 10 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -10 }}
           transition={{ duration: 0.2 }}
           className="h-full"
         >
            {selectedActivity ? renderActivityLog() : renderDailySummary()}
         </motion.div>
      </AnimatePresence>
    </div>
  );
};

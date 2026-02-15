
import React, { useState } from 'react';
import { useStore } from '../../store';
import { 
  Plus, 
  Trash2, 
  PenLine,
  Copy
} from 'lucide-react';
import { Protocol } from '../../types';
import { Button } from '../UI';
import { ProtocolEditor } from './ProtocolEditor';
import { ConfirmationModal } from '../ConfirmationModal';
import { useTranslation } from '../../hooks/useTranslation';

export const ProtocolManager: React.FC = () => {
  const { protocols, deleteProtocol, addProtocol } = useStore();
  const t = useTranslation();
  
  const [editorState, setEditorState] = useState<{ isOpen: boolean; protocol: Protocol | null }>({
    isOpen: false,
    protocol: null
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const libraryProtocols = protocols.filter(p => !p.isCustom);

  const handleDeleteClick = (e: React.MouseEvent, protocolId: string, protocolName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      id: protocolId,
      name: protocolName
    });
  };

  const handleDuplicateClick = (e: React.MouseEvent, protocol: Protocol) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nameMatch = protocol.name.match(/^(.*) \((\d+)\)$/);
    let newName = `${protocol.name} (1)`;
    if (nameMatch) {
        newName = `${nameMatch[1]} (${parseInt(nameMatch[2]) + 1})`;
    } else if (protocol.name.endsWith(' (Copy)')) {
        newName = `${protocol.name} 1`;
    }

    const newActivities = protocol.activities.map(a => ({
        ...a,
        id: crypto.randomUUID()
    }));

    addProtocol(newName, newActivities);
  };

  const executeDelete = () => {
    if (deleteConfirm.id) {
      deleteProtocol(deleteConfirm.id);
    }
  };

  const openCreator = () => {
    setEditorState({ isOpen: true, protocol: null }); 
  };

  const openEditor = (protocol: Protocol) => {
    setEditorState({ isOpen: true, protocol }); 
  };

  const closeEditor = () => {
    setEditorState({ isOpen: false, protocol: null });
  };

  if (editorState.isOpen) {
    return (
      <ProtocolEditor 
        initialProtocol={editorState.protocol}
        onClose={closeEditor}
      />
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto py-20 px-8 lg:px-20">
      {/* Header: Use type-h1 to prevent massive "Display" font size breaking one-line rule */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <h2 className="type-h1 mb-4 text-white">{t.protocol.library}</h2>
          <p className="type-label text-zinc-500">{t.protocol.manage}</p>
        </div>
        <div className="flex gap-4">
           <Button variant="primary" onClick={openCreator} icon={<Plus />}>
             {t.protocol.create}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 pb-32">
        {libraryProtocols.map((protocol) => {
          return (
            <div key={protocol.id} className="relative group">
              <div 
                className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 hover:border-white/10 flex flex-col justify-start min-h-[340px] shadow-2xl transition-all relative cursor-pointer overflow-hidden z-10"
                onClick={() => openEditor(protocol)}
              >
                  <div className="space-y-6 pt-2 mb-8">
                    {/* CHANGED to type-h3 (20px) for smaller text as requested */}
                    <h3 className="type-h3 text-white pr-12 line-clamp-2 leading-tight">
                      {protocol.name}
                    </h3>
                    <span className="type-mono-body text-zinc-500 block tabular-nums">
                      {protocol.activities.length} {t.protocol.phases} • {Math.round(protocol.activities.reduce((acc, curr) => acc + curr.duration, 0) / 60)} {t.protocol.hours}
                    </span>
                  </div>

                  <div className="mt-auto pt-6 flex flex-col gap-4">
                      <button className="type-label tracking-normal rounded-[2rem] transition-all flex items-center justify-center gap-4 border bg-zinc-900 text-zinc-400 border-white/5 group-hover:text-white group-hover:bg-zinc-800 group-hover:border-white/20 px-8 h-20 w-full pointer-events-none">
                        <PenLine className="w-6 h-6" />
                        {t.protocol.edit_def}
                      </button>

                      <div className="flex gap-4">
                        <button 
                            onClick={(e) => handleDuplicateClick(e, protocol)}
                            className="flex-1 h-20 bg-zinc-900 hover:bg-white/10 text-zinc-500 hover:text-white rounded-[2rem] transition-colors border border-white/5 cursor-pointer shadow-lg flex items-center justify-center"
                            title={t.protocol.duplicate}
                        >
                            <Copy className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClick(e, protocol.id, protocol.name)}
                            className="flex-1 h-20 bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-[2rem] transition-colors border border-white/5 cursor-pointer shadow-lg flex items-center justify-center"
                            title={t.protocol.delete}
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                  </div>
              </div>
            </div>
          );
        })}
        
        <div onClick={openCreator} className="p-10 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 group cursor-pointer hover:bg-white/5 min-h-[340px] transition-all">
          <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:bg-zinc-800 transition-colors">
            <Plus className="w-12 h-12 text-zinc-600" />
          </div>
          <p className="type-label text-zinc-500 group-hover:text-white">{t.protocol.new_def}</p>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={executeDelete}
        title={t.editor.confirm_delete}
        message={t.editor.confirm_msg}
        confirmLabel={t.editor.delete}
        isDangerous
      />
    </div>
  );
};

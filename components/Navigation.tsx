
import React from 'react';
import { 
  Calendar, 
  Layers, 
  Settings, 
  BookTemplate,
  Home,
} from 'lucide-react';
import { useStore } from '../store';
import { ViewType } from '../types';

export const Navigation: React.FC = () => {
  const { view, setView } = useStore();

  const views: { id: ViewType; icon: any; label: string }[] = [
    { id: 'DAY', icon: Home, label: 'Main' },
    { id: 'WEEK', icon: Layers, label: 'Week' },
    { id: 'MONTH', icon: Calendar, label: 'Month' },
    { id: 'PROTOCOLS', icon: BookTemplate, label: 'Protocols' },
    { id: 'SETTINGS', icon: Settings, label: 'Core' },
  ];

  return (
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
      {/* 
        1rem = 8px.
        p-2 = 16px padding container.
        gap-3 = 12px gap.
      */}
      <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-4 shadow-2xl">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            // FIXED SIZE: w-24 h-24 (48px) for both states to prevent jump
            className={`w-24 h-24 flex items-center justify-center rounded-full transition-all duration-300 ${
              view === v.id 
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
            title={v.label}
          >
            {/* Icon 20px = 2.5rem = w-10 */}
            <v.icon className="w-10 h-10" />
          </button>
        ))}
      </div>
    </nav>
  );
};

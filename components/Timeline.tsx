
import React from 'react';
import { StoryScene } from '../types';

interface TimelineProps {
  scenes: StoryScene[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ scenes, activeId, onSelect }) => {
  return (
    <div className="h-48 bg-[#0a0a0a] border-t border-[#222] relative flex flex-col shrink-0">
      <div className="h-6 flex items-center px-4 border-b border-[#1a1a1a] text-[9px] text-gray-600 gap-10">
        <span className="text-orange-500">00:00</span>
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i}>00:{((i + 1) * 5).toString().padStart(2, '0')}</span>
        ))}
      </div>
      
      <div className="flex-1 flex items-center px-4 gap-2 overflow-x-auto overflow-y-hidden py-4">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className={`relative min-w-[160px] h-[100px] border rounded transition-all duration-300 group overflow-hidden
              ${activeId === scene.id ? 'border-[#ff6b00] scale-105 z-10 ring-2 ring-[#ff6b00]/20' : 'border-[#222] hover:border-[#444]'}`}
          >
            {scene.imageUrl ? (
              <img src={scene.imageUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-[#111] flex items-center justify-center p-2">
                <p className="text-[9px] text-gray-500 text-center line-clamp-3">{scene.description}</p>
              </div>
            )}
            
            <div className={`absolute inset-x-0 bottom-0 p-1.5 flex justify-between items-end bg-gradient-to-t from-black/80 to-transparent
              ${activeId === scene.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <div className="flex flex-col">
                 <span className="text-[8px] text-[#ff6b00] font-bold uppercase">{scene.shotType.split(' ')[0]}</span>
                 <span className="text-[9px] text-white truncate max-w-[100px]">{scene.title}</span>
              </div>
              <span className="text-[8px] text-gray-400">{scene.duration}s</span>
            </div>

            {scene.status === 'generating' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-[#ff6b00] border-t-transparent animate-spin rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a1a1a]">
        <div className="h-full bg-[#ff6b00] w-[10%] transition-all"></div>
      </div>
    </div>
  );
};

export default Timeline;

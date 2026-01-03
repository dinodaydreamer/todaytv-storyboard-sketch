
import React from 'react';
import { StoryScene } from '../types';

interface PreviewAreaProps {
  scene?: StoryScene;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ scene }) => {
  if (!scene) return null;

  return (
    <div className="flex-1 bg-[#0c0c0c] flex items-center justify-center p-8 relative">
      <div className={`relative shadow-2xl bg-[#111] border border-[#222] flex items-center justify-center overflow-hidden
        ${scene.aspectRatio === '16:9' ? 'aspect-video w-full max-w-5xl' : 
          scene.aspectRatio === '9:16' ? 'aspect-[9/16] h-full' : 'aspect-square w-full max-w-2xl'}`}>
        
        {scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={scene.title} 
            className="w-full h-full object-cover animate-in fade-in duration-700"
          />
        ) : (
          <div className="text-center p-12">
            <svg className="w-20 h-20 text-[#222] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#ff6b00] font-bold uppercase tracking-widest text-sm mb-2">{scene.shotType}</p>
            <p className="text-gray-500 italic max-w-md mx-auto">
              "{scene.description}"
            </p>
          </div>
        )}

        {scene.status === 'generating' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-[#ff6b00] border-t-transparent animate-spin rounded-full mb-4"></div>
            <p className="text-[#ff6b00] font-bold tracking-widest uppercase">AI Đang phác thảo...</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#111]/80 backdrop-blur-md px-6 py-3 rounded-full border border-[#333] flex gap-8 items-center">
         <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase">Phân cảnh</span>
            <span className="font-bold text-[#ff6b00]">{scene.shotNumber}</span>
         </div>
         <div className="h-6 w-px bg-[#333]"></div>
         <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase">Cỡ cảnh</span>
            <span className="font-medium text-white">{scene.shotType}</span>
         </div>
         <div className="h-6 w-px bg-[#333]"></div>
         <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase">Thời lượng</span>
            <span className="font-medium text-white">{scene.duration}s</span>
         </div>
      </div>
    </div>
  );
};

export default PreviewArea;

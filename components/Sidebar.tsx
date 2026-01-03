
import React from 'react';
import { StoryScene, ShotType, AspectRatio } from '../types';

interface SidebarProps {
  scene: StoryScene;
  onUpdate: (updated: StoryScene) => void;
  onGenerate: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ scene, onUpdate, onGenerate }) => {
  return (
    <aside className="w-96 bg-[#0a0a0a] border-l border-white/5 p-8 flex flex-col gap-8 overflow-y-auto shrink-0 z-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
           <span className="bg-[#ff6b00] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">Phân cảnh {scene.shotNumber}</span>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">{scene.title}</h3>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
             <label className="text-[11px] text-gray-500 uppercase font-black tracking-wider">Thời lượng (s)</label>
             <input 
              type="number"
              value={scene.duration}
              onChange={(e) => onUpdate({...scene, duration: Number(e.target.value)})}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#ff6b00] font-bold focus:outline-none focus:border-[#ff6b00] transition-colors"
             />
          </div>
          <div className="space-y-1.5">
             <label className="text-[11px] text-gray-500 uppercase font-black tracking-wider">Cỡ cảnh</label>
             <select 
              value={scene.shotType}
              onChange={(e) => onUpdate({...scene, shotType: e.target.value as ShotType})}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
             >
               {Object.values(ShotType).map(type => (
                 <option key={type} value={type}>{type}</option>
               ))}
             </select>
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-[11px] text-gray-500 uppercase font-black tracking-wider">Tỉ lệ khung hình</label>
           <div className="grid grid-cols-2 gap-2">
             {Object.values(AspectRatio).map(ratio => (
               <button
                key={ratio}
                onClick={() => onUpdate({...scene, aspectRatio: ratio})}
                className={`py-2 text-xs border rounded-xl transition-all font-bold ${scene.aspectRatio === ratio ? 'bg-white text-black border-white shadow-lg' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
               >
                 {ratio}
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-[11px] text-gray-500 uppercase font-black tracking-wider">Kịch bản chi tiết</label>
           <textarea 
            value={scene.description}
            onChange={(e) => onUpdate({...scene, description: e.target.value})}
            rows={4}
            className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm leading-relaxed text-gray-400 focus:outline-none focus:border-[#ff6b00] transition-colors resize-none"
           />
        </div>

        <div className="space-y-2">
           <div className="flex justify-between items-center">
              <label className="text-[11px] text-gray-500 uppercase font-black tracking-wider">AI Visual Prompt</label>
              <button 
                onClick={() => onUpdate({...scene, visualPrompt: scene.description})}
                className="text-[10px] text-[#ff6b00] font-bold hover:underline"
              >
                Đồng bộ kịch bản
              </button>
           </div>
           <textarea 
            value={scene.visualPrompt}
            onChange={(e) => onUpdate({...scene, visualPrompt: e.target.value})}
            rows={4}
            placeholder="Mô tả cụ thể hình ảnh để AI vẽ sketch..."
            className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm leading-relaxed text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
           />
           <p className="text-[10px] text-gray-600 italic">Mẹo: Thêm các từ như 'heavy shadows', 'pencil strokes' để sketch đẹp hơn.</p>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-white/5">
        <button
          onClick={onGenerate}
          disabled={scene.status === 'generating'}
          className={`w-full flex items-center justify-center gap-3 font-black py-5 rounded-2xl transition-all shadow-xl
            ${scene.imageUrl ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#ff6b00] text-black hover:bg-[#ff8533]'}`}
        >
          {scene.status === 'generating' ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
          {scene.imageUrl ? 'VẼ LẠI PHÁC THẢO' : 'BẮT ĐẦU VẼ SKETCH'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

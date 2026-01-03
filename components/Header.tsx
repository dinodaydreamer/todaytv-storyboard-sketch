
import React from 'react';

interface HeaderProps {
  onExport: () => void;
  onGenerateAll: () => void;
  onReset: () => void;
  onShowGuide: () => void;
  onOpenKeySelection: () => void;
  isGenerating: boolean;
  isApiReady: boolean;
  hasScenes: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onExport, 
  onGenerateAll, 
  onReset,
  onShowGuide,
  onOpenKeySelection,
  isGenerating, 
  isApiReady, 
  hasScenes 
}) => {
  return (
    <header className="h-20 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-8 shrink-0 z-[60]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff6b00] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff6b00]/20">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h12v8H4V7z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tighter italic text-white leading-none hidden lg:block">
            AI SKETCH <span className="text-[#ff6b00]">PRO</span>
          </h1>
        </div>

        <div className="flex items-center bg-[#161616] rounded-xl px-4 border border-white/5 transition-all">
          <span className="text-[10px] font-black text-gray-600 mr-2 uppercase">API STATUS:</span>
          <button 
            onClick={onOpenKeySelection}
            className={`text-xs py-2 font-mono uppercase font-bold transition-colors ${isApiReady ? 'text-green-500' : 'text-[#ff6b00]'}`}
          >
            {isApiReady ? 'KEY SELECTED' : 'SELECT API KEY'}
          </button>
          <div className={`w-2.5 h-2.5 rounded-full ml-3 ${isApiReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onShowGuide}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
          title="Hướng dẫn sử dụng"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-red-500/10 hover:border-red-500/30 transition-all uppercase"
        >
          TẠO MỚI
        </button>

        {hasScenes && (
          <>
            <button
              onClick={onGenerateAll}
              disabled={isGenerating || !isApiReady}
              className="flex items-center gap-2 bg-[#ff6b00] text-black px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#ff8533] disabled:opacity-20 transition-all shadow-lg shadow-[#ff6b00]/10 uppercase"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
              ) : 'VẼ TOÀN BỘ STORYBOARD'}
            </button>
            <button
              onClick={onExport}
              disabled={!isApiReady}
              className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase"
            >
              XUẤT PDF
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

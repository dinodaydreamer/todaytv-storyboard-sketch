
import React from 'react';

interface HeaderProps {
  onExport: () => void;
  onGenerateAll: () => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  isGenerating: boolean;
  isApiReady: boolean;
  hasScenes: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onExport, 
  onGenerateAll, 
  apiKey, 
  onApiKeyChange, 
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
          <h1 className="text-xl font-black tracking-tighter italic text-white leading-none hidden md:block">
            AI SKETCH <span className="text-[#ff6b00]">PRO</span>
          </h1>
        </div>

        <div className="flex items-center bg-[#161616] rounded-xl px-3 border border-white/5 focus-within:border-[#ff6b00]/50 transition-all">
          <span className="text-[10px] font-black text-gray-600 mr-2">API:</span>
          <input 
            type="password"
            placeholder="Nhập API Key tại đây..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-48 md:w-64 py-2 text-[#ff6b00] font-mono placeholder:text-gray-800"
          />
          <div className={`w-2 h-2 rounded-full ml-2 ${isApiReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {hasScenes && (
          <>
            <button
              onClick={onGenerateAll}
              disabled={isGenerating || !isApiReady}
              className="flex items-center gap-2 bg-[#ff6b00] text-black px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#ff8533] disabled:opacity-20 transition-all shadow-lg shadow-[#ff6b00]/10 uppercase"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
              ) : 'VẼ TẤT CẢ (PRO)'}
            </button>
            <button
              onClick={onExport}
              disabled={!isApiReady}
              className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase"
            >
              XUẤT PDF TIẾNG VIỆT
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

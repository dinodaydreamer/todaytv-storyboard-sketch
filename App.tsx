
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoryScene, ShotType, AspectRatio, AppState } from './types';
import { parseScriptToScenes, generateSketch } from './services/geminiService';
import { exportToPDF } from './utils/pdfExport';

// Components
import Header from './components/Header';
import Timeline from './components/Timeline';
import Sidebar from './components/Sidebar';
import PreviewArea from './components/PreviewArea';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    scenes: [],
    currentSceneId: null,
    isGeneratingAll: false,
    scriptInput: '',
    isApiReady: false,
  });

  const [showGuide, setShowGuide] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // 384px = w-96
  const isResizingSidebar = useRef(false);

  const startResizingSidebar = useCallback((e: React.MouseEvent) => {
    isResizingSidebar.current = true;
    e.preventDefault();
  }, []);

  const stopResizingSidebar = useCallback(() => {
    isResizingSidebar.current = false;
  }, []);

  const resizeSidebar = useCallback((e: MouseEvent) => {
    if (isResizingSidebar.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resizeSidebar);
    window.addEventListener('mouseup', stopResizingSidebar);
    return () => {
      window.removeEventListener('mousemove', resizeSidebar);
      window.removeEventListener('mouseup', stopResizingSidebar);
    };
  }, [resizeSidebar, stopResizingSidebar]);

  // Initialize and check if an API key has already been selected.
  useEffect(() => {
    const checkKeySelection = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setState(prev => ({ ...prev, isApiReady: hasKey }));
      }
    };
    checkKeySelection();
  }, []);

  // Use mandatory dialog for API key selection when using Pro image generation models.
  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // Assume selection successful as per guidelines to mitigate race conditions.
      setState(prev => ({ ...prev, isApiReady: true }));
    }
  };

  const handleScriptSubmit = (script: string) => {
    if (!script.trim()) return;
    const parsed = parseScriptToScenes(script) as StoryScene[];
    setState(prev => ({
      ...prev,
      scenes: parsed,
      currentSceneId: parsed[0]?.id || null,
      scriptInput: script
    }));
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ kịch bản hiện tại không?")) {
      setState(prev => ({
        ...prev,
        scenes: [],
        currentSceneId: null,
        scriptInput: '',
      }));
    }
  };

  // Error handler for the "Requested entity was not found." condition.
  const handleApiError = async (error: any) => {
    if (error?.message?.includes("Requested entity was not found")) {
      setState(prev => ({ ...prev, isApiReady: false }));
      await handleOpenKeySelection();
      return true;
    }
    return false;
  };

  const handleGenerateAll = async () => {
    if (state.isGeneratingAll || !state.isApiReady) return;
    setState(prev => ({ ...prev, isGeneratingAll: true }));
    
    const updatedScenes = [...state.scenes];
    for (let i = 0; i < updatedScenes.length; i++) {
      if (updatedScenes[i].status !== 'completed') {
        updatedScenes[i] = { ...updatedScenes[i], status: 'generating' };
        setState(prev => ({ ...prev, scenes: [...updatedScenes] }));
        try {
          const url = await generateSketch(updatedScenes[i]);
          updatedScenes[i] = { ...updatedScenes[i], imageUrl: url, status: 'completed' };
        } catch (e: any) {
          const handled = await handleApiError(e);
          updatedScenes[i] = { ...updatedScenes[i], status: 'error' };
          if (handled) break;
        }
        setState(prev => ({ ...prev, scenes: [...updatedScenes] }));
      }
    }
    setState(prev => ({ ...prev, isGeneratingAll: false }));
  };

  const handleGenerateSingle = async (sceneId: string) => {
    if (!state.isApiReady) return;
    const idx = state.scenes.findIndex(s => s.id === sceneId);
    if (idx === -1) return;

    const newScenes = [...state.scenes];
    newScenes[idx] = { ...newScenes[idx], status: 'generating' };
    setState(prev => ({ ...prev, scenes: newScenes }));

    try {
      const url = await generateSketch(newScenes[idx]);
      newScenes[idx] = { ...newScenes[idx], imageUrl: url, status: 'completed' };
    } catch (e: any) {
      await handleApiError(e);
      newScenes[idx] = { ...newScenes[idx], status: 'error' };
    }
    setState(prev => ({ ...prev, scenes: [...newScenes] }));
  };

  const updateScene = (updated: StoryScene) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === updated.id ? updated : s)
    }));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header 
        isApiReady={state.isApiReady}
        onOpenKeySelection={handleOpenKeySelection}
        onExport={() => exportToPDF(state.scenes)} 
        onGenerateAll={handleGenerateAll}
        onReset={handleReset}
        onShowGuide={() => setShowGuide(true)}
        isGenerating={state.isGeneratingAll}
        hasScenes={state.scenes.length > 0}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Blocked access overlay if no API Key is selected */}
        {!state.isApiReady && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="w-20 h-20 bg-[#ff6b00]/20 rounded-full flex items-center justify-center mx-auto border border-[#ff6b00]/40">
                <svg className="w-10 h-10 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter">TRUY CẬP <span className="text-[#ff6b00]">BỊ KHÓA</span></h2>
              <p className="text-gray-400">Vui lòng chọn <span className="text-white font-bold">Paid API Key</span> từ Google AI Studio để bắt đầu vẽ phác thảo.</p>
              
              <button 
                onClick={handleOpenKeySelection}
                className="w-full bg-[#ff6b00] text-black font-black py-4 rounded-xl hover:bg-[#ff8533] transition-all uppercase flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                CHỌN API KEY
              </button>

              <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff6b00] underline">Tìm hiểu về Billing & API Key</a>
              </div>
            </div>
          </div>
        )}

        {/* Modal Hướng dẫn */}
        {showGuide && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full bg-[#161616] border border-white/10 rounded-3xl p-10 relative">
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-3xl font-black italic mb-8 uppercase text-[#ff6b00]">Hướng dẫn sử dụng</h2>
              <div className="space-y-6 text-gray-300">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0">1</div>
                  <p>Chọn <b>Gemini API Key</b> từ thanh Menu. Đây là bắt buộc để AI có thể vẽ hình.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0">2</div>
                  <p>Dán kịch bản vào khung trung tâm. Sử dụng cú pháp <b>"Shot 1: [Mô tả]"</b>, <b>"Cảnh 2: [Mô tả]"</b> để AI tự động phân tách.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0">3</div>
                  <p>Nhấn <b>"PHÂN TÍCH KỊCH BẢN"</b> để tạo Timeline ở phía dưới.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0">4</div>
                  <p>Chỉnh sửa các phân cảnh ở Sidebar bên phải (cỡ cảnh, tỉ lệ, kịch bản) sau đó nhấn <b>"VẼ LẠI"</b> nếu cần.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0">5</div>
                  <p>Nhấn <b>"XUẤT PDF"</b> để tải về bộ Storyboard chuyên nghiệp hoàn chỉnh.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full mt-10 bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all uppercase"
              >
                ĐÃ HIỂU, BẮT ĐẦU THÔI!
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col relative bg-[#0f0f0f]">
          {state.scenes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-2xl w-full bg-[#161616] p-10 rounded-3xl border border-white/5 shadow-2xl">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold mb-2">Bắt đầu kịch bản của bạn</h2>
                  <p className="text-gray-400 text-sm">Nhập nội dung các phân cảnh để AI tự động vẽ phác thảo.</p>
                </div>
                <textarea
                  className="w-full h-56 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-[#ff6b00] transition-all mb-6 placeholder:text-gray-700 leading-relaxed"
                  placeholder="Ví dụ:&#10;Shot 1: Cận cảnh một người đang nhìn vào gương.&#10;Shot 2: Toàn cảnh thành phố lúc ban đêm."
                  value={state.scriptInput}
                  onChange={(e) => setState(prev => ({ ...prev, scriptInput: e.target.value }))}
                />
                <button
                  onClick={() => handleScriptSubmit(state.scriptInput)}
                  className="w-full bg-[#ff6b00] text-black font-black py-4 rounded-xl hover:bg-[#ff8533] transition-all uppercase"
                >
                  PHÂN TÍCH KỊCH BẢN
                </button>
              </div>
            </div>
          ) : (
            <>
              <PreviewArea scene={state.scenes.find(s => s.id === state.currentSceneId)} />
              <Timeline 
                scenes={state.scenes} 
                activeId={state.currentSceneId} 
                onSelect={(id) => setState(prev => ({ ...prev, currentSceneId: id }))}
              />
            </>
          )}
        </main>

        {state.currentSceneId && (
          <div className="flex relative shrink-0">
             {/* Handle kéo thả Sidebar */}
            <div 
              onMouseDown={startResizingSidebar}
              className="absolute left-[-4px] top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#ff6b00]/50 z-20 transition-colors"
            />
            <Sidebar 
              width={sidebarWidth}
              scene={state.scenes.find(s => s.id === state.currentSceneId)!} 
              onUpdate={updateScene} 
              onGenerate={() => handleGenerateSingle(state.currentSceneId!)}
            />
          </div>
        )}
      </div>

      <div className="h-10 bg-[#080808] border-t border-white/5 flex items-center px-6 text-[10px] text-gray-500 justify-between uppercase font-bold tracking-widest">
        <div className="flex gap-4">
          <span className={state.isApiReady ? 'text-green-500' : 'text-red-500'}>
            Status: {state.isApiReady ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span>Scenes: {state.scenes.length}</span>
        </div>
        <div className="flex gap-4">
          <span>Tự động đồng bộ mô tả kịch bản làm Prompt</span>
          <span>Model: Gemini 3 Pro</span>
        </div>
      </div>
    </div>
  );
};

export default App;

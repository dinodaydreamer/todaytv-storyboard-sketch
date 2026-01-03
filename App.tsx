
import React, { useState } from 'react';
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
    apiKey: '',
  });

  const handleApiKeyChange = (val: string) => {
    setState(prev => ({ ...prev, apiKey: val, isApiReady: val.length > 10 }));
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

  const handleGenerateAll = async () => {
    if (state.isGeneratingAll || !state.isApiReady) return;
    setState(prev => ({ ...prev, isGeneratingAll: true }));
    
    const updatedScenes = [...state.scenes];
    for (let i = 0; i < updatedScenes.length; i++) {
      if (updatedScenes[i].status !== 'completed') {
        updatedScenes[i] = { ...updatedScenes[i], status: 'generating' };
        setState(prev => ({ ...prev, scenes: [...updatedScenes] }));
        try {
          const url = await generateSketch(updatedScenes[i], state.apiKey);
          updatedScenes[i] = { ...updatedScenes[i], imageUrl: url, status: 'completed' };
        } catch (e) {
          updatedScenes[i] = { ...updatedScenes[i], status: 'error' };
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
      const url = await generateSketch(newScenes[idx], state.apiKey);
      newScenes[idx] = { ...newScenes[idx], imageUrl: url, status: 'completed' };
    } catch (e) {
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
        apiKey={state.apiKey}
        onApiKeyChange={handleApiKeyChange}
        onExport={() => exportToPDF(state.scenes)} 
        onGenerateAll={handleGenerateAll}
        isGenerating={state.isGeneratingAll}
        hasScenes={state.scenes.length > 0}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Lớp phủ chặn app nếu chưa nhập API */}
        {!state.isApiReady && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="w-20 h-20 bg-[#ff6b00]/20 rounded-full flex items-center justify-center mx-auto border border-[#ff6b00]/40">
                <svg className="w-10 h-10 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter">TRUY CẬP <span className="text-[#ff6b00]">BỊ KHÓA</span></h2>
              <p className="text-gray-400">Vui lòng nhập <span className="text-white font-bold">Gemini API Key</span> vào ô nhập phía trên Menu để bắt đầu sử dụng trí tuệ nhân tạo Nano Banana Pro.</p>
              <div className="animate-bounce text-[#ff6b00]">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
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
                  placeholder="Shot 1: ..."
                  value={state.scriptInput}
                  onChange={(e) => setState(prev => ({ ...prev, scriptInput: e.target.value }))}
                />
                <button
                  onClick={() => handleScriptSubmit(state.scriptInput)}
                  className="w-full bg-[#ff6b00] text-black font-black py-4 rounded-xl hover:bg-[#ff8533] transition-all"
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
          <Sidebar 
            scene={state.scenes.find(s => s.id === state.currentSceneId)!} 
            onUpdate={updateScene} 
            onGenerate={() => handleGenerateSingle(state.currentSceneId!)}
          />
        )}
      </div>

      <div className="h-10 bg-[#080808] border-t border-white/5 flex items-center px-6 text-[10px] text-gray-500 justify-between uppercase font-bold tracking-widest">
        <div className="flex gap-4">
          <span className={state.isApiReady ? 'text-green-500' : 'text-red-500'}>
            Status: {state.isApiReady ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span>Scenes: {state.scenes.length}</span>
        </div>
        <div>Model: Nano Banana Pro (Gemini 3)</div>
      </div>
    </div>
  );
};

export default App;


import React, { useState, useRef, useEffect } from 'react';
import { analyzeScript, generateShotImage } from './services/geminiService';
import { ScriptAnalysis, TimelineItem, SavedProject, LogEntry, Shot } from './types';
import { Timeline } from './components/Timeline';
import { ShotDetails } from './components/ShotDetails';
import { Loader2, Wand2, Save, FolderOpen, FileOutput, Images, Sun, Moon, Clapperboard, PlayCircle, StopCircle, Key } from 'lucide-react';

const SAMPLE_SCRIPT = `CẢNH 1
EXT. BÃI PHẾ LIỆU CÔNG NGHỆ - NGÀY
TOÀN CẢNH. Giữa những đống kim loại gỉ sét khổng lồ của thành phố tương lai, một chú robot nhỏ tên BIT đang đào bới.

CẬN CẢNH. Tay robot chạm vào một mầm cây nhỏ đang tỏa sáng dưới lớp sắt vụn.`;

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [scriptInput, setScriptInput] = useState(SAMPLE_SCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ScriptAnalysis | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'input' | 'timeline'>('input');
  const [previewHeight, setPreviewHeight] = useState(400); 
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const stopBatchRef = useRef(false);

  // Fix: Derived state to find the currently selected item based on selectedItemId
  const selectedItem = timelineItems.find(item => item.id === selectedItemId) || null;

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  };

  const checkAndPromptKey = async () => {
    // @ts-ignore
    if (!(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  // Hàm quan trọng: Vẽ chữ ra ảnh để không bao giờ bị lỗi font tiếng Việt trong PDF
  const renderTextToImage = (
    text: string, 
    widthMm: number, 
    fontSize: number, 
    color: string, 
    isBold: boolean = false,
    align: 'left' | 'center' = 'left'
  ): Promise<{ dataUrl: string, heightMm: number }> => {
    return new Promise((resolve) => {
      const scale = 5; 
      const mmToPx = 3.78; 
      const canvasWidth = widthMm * mmToPx * scale;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const fontStack = 'Inter, "Segoe UI", Tahoma, sans-serif';
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx * scale}px ${fontStack}`;
      
      const words = (text || "").split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > canvasWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine.trim());
      
      const lineHeight = fontSize * 1.5;
      const totalHeightMm = lines.length * lineHeight + 2;
      canvas.width = canvasWidth;
      canvas.height = totalHeightMm * mmToPx * scale;
      
      ctx.scale(scale, scale);
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx}px ${fontStack}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      
      lines.forEach((line, i) => {
        let x = 0;
        if (align === 'center') {
          const metrics = ctx.measureText(line);
          x = (widthMm * mmToPx - metrics.width) / 2;
        }
        ctx.fillText(line, x, i * lineHeight * mmToPx);
      });
      
      resolve({ dataUrl: canvas.toDataURL('image/png'), heightMm: totalHeightMm });
    });
  };

  const handleExportPDF = async () => {
    if (!analysisData || timelineItems.length === 0) return;
    addLog("Đang đóng gói PDF (Anti-Font-Error Mode)...", "info");
    
    try {
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Trang Bìa
      doc.setFillColor(249, 115, 22); // Orange 600
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      const badge = await renderTextToImage("OFFICIAL STORYBOARD DOCUMENT", pageWidth - 40, 9, "#FFFFFF", true, 'center');
      doc.addImage(badge.dataUrl, 'PNG', 20, 15, pageWidth - 40, badge.heightMm);

      const title = await renderTextToImage("SKETCH AI STORYBOARD", pageWidth - 40, 26, "#f97316", true, 'center');
      doc.addImage(title.dataUrl, 'PNG', 20, 60, pageWidth - 40, title.heightMm);

      const proj = await renderTextToImage(analysisData.title.toUpperCase(), pageWidth - 40, 18, "#18181b", true, 'center');
      doc.addImage(proj.dataUrl, 'PNG', 20, 100, pageWidth - 40, proj.heightMm);

      const logline = await renderTextToImage(analysisData.logline_vi, pageWidth - 60, 11, "#52525b", false, 'center');
      doc.addImage(logline.dataUrl, 'PNG', 30, 130, pageWidth - 60, logline.heightMm);

      // Trang nội dung
      const margin = 15;
      const shotsPerPage = 3;
      const boxWidth = pageWidth - (margin * 2);
      const boxHeight = 78;

      for (let i = 0; i < timelineItems.length; i++) {
        const item = timelineItems[i];
        if (i % shotsPerPage === 0) {
          doc.addPage();
          doc.setFillColor(249, 115, 22);
          doc.rect(0, 0, pageWidth, 12, 'F');
          const hText = `PROJECT: ${analysisData.title.toUpperCase()} | PAGE ${doc.internal.getNumberOfPages() - 1}`;
          const header = await renderTextToImage(hText, pageWidth - 30, 7, "#FFFFFF", true);
          doc.addImage(header.dataUrl, 'PNG', margin, 3.5, pageWidth - 30, header.heightMm);
        }

        const y = 20 + (i % shotsPerPage) * (boxHeight + 8);
        doc.setDrawColor(249, 115, 22);
        doc.rect(margin, y, boxWidth, boxHeight);
        
        if (item.data.imageUrl) {
            doc.addImage(item.data.imageUrl, 'PNG', margin + 4, y + 4, 85, 48);
        } else {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin + 4, y + 4, 85, 48, 'F');
        }

        const infoX = margin + 94;
        const infoW = boxWidth - 98;

        const sNum = await renderTextToImage(`SHOT #${i + 1}`, infoW, 14, "#f97316", true);
        doc.addImage(sNum.dataUrl, 'PNG', infoX, y + 4, infoW, sNum.heightMm);

        const meta = await renderTextToImage(`${item.data.type} | ${item.duration}s`, infoW, 9, "#18181b", true);
        doc.addImage(meta.dataUrl, 'PNG', infoX, y + 4 + sNum.heightMm + 2, infoW, meta.heightMm);

        const desc = await renderTextToImage(item.data.description_vi, infoW, 9, "#52525b", false);
        doc.addImage(desc.dataUrl, 'PNG', infoX, y + 4 + sNum.heightMm + meta.heightMm + 5, infoW, desc.heightMm);
      }

      doc.save(`STORYBOARD_${analysisData.title.replace(/\s+/g, '_')}.pdf`);
      addLog("Xuất PDF thành công (Đã sửa lỗi tiếng Việt).", "success");
    } catch (err: any) {
      addLog(`Lỗi PDF: ${err.message}`, "error");
    }
  };

  const handleBatchGenerate = async () => {
    if (isBatchGenerating) {
      stopBatchRef.current = true;
      return;
    }
    await checkAndPromptKey();
    setIsBatchGenerating(true);
    stopBatchRef.current = false;
    addLog("Bắt đầu vẽ toàn bộ phân cảnh...", "info");

    for (let i = 0; i < timelineItems.length; i++) {
      if (stopBatchRef.current) break;
      const item = timelineItems[i];
      if (item.data.imageUrl) continue;

      try {
        const url = await generateShotImage(item.data.prompt_en, analysisData?.characters);
        if (url) {
          setTimelineItems(prev => prev.map(t => t.id === item.id ? { ...t, data: { ...t.data, imageUrl: url } } : t));
          addLog(`Đã vẽ xong Shot #${i+1}`, "success");
        }
      } catch (err) {
        addLog(`Lỗi Shot #${i+1}`, "error");
      }
    }
    setIsBatchGenerating(false);
    addLog("Hoàn tất quy trình vẽ toàn bộ.", "success");
  };

  const handleSaveJSON = () => {
    if (!analysisData) return;
    const project: SavedProject = { version: "1.0", timestamp: new Date().toISOString(), scriptInput, analysisData, timelineItems };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${analysisData.title.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string) as SavedProject;
        setScriptInput(project.scriptInput);
        setAnalysisData(project.analysisData);
        setTimelineItems(project.timelineItems);
        setView('timeline');
        addLog("Đã tải dự án JSON.", "success");
      } catch (err) {
        addLog("Lỗi đọc JSON.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    await checkAndPromptKey();
    setIsAnalyzing(true);
    addLog("Đang phân tích kịch bản...", "info");
    try {
      const data = await analyzeScript(scriptInput);
      setAnalysisData(data);
      const items: TimelineItem[] = [];
      let time = 0;
      data.acts.forEach(act => act.scenes.forEach(scene => scene.shots.forEach(shot => {
        items.push({ id: shot.id, start: time, duration: shot.duration, data: shot, sceneHeader: scene.header });
        time += shot.duration;
      })));
      setTimelineItems(items);
      setView('timeline');
      addLog("Phân tích hoàn tất.", "success");
    } catch (err) {
      addLog("Lỗi phân tích kịch bản.", "error");
    } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden transition-colors">
      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <Images size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase">SKETCH <span className="text-orange-500 font-light">AI</span></h1>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={async () => await window.aistudio.openSelectKey()} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:text-orange-500 transition-colors" title="Cấu hình API Key">
            <Key size={18} />
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {view === 'timeline' && (
            <div className="flex space-x-2">
              <button onClick={handleBatchGenerate} className={`p-2 rounded-lg ${isBatchGenerating ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-orange-500'}`} title="Vẽ toàn bộ">
                {isBatchGenerating ? <StopCircle size={18} /> : <PlayCircle size={18} />}
              </button>
              <button onClick={handleSaveJSON} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg" title="Lưu JSON">
                <Save size={18} />
              </button>
              <button onClick={handleExportPDF} className="bg-orange-600 text-white p-2 rounded-lg shadow-lg shadow-orange-600/20" title="Xuất PDF">
                <FileOutput size={18} />
              </button>
            </div>
          )}
          {view === 'input' && (
             <label className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg cursor-pointer hover:text-orange-500">
                <FolderOpen size={18} />
                <input type="file" accept=".json" onChange={handleLoadJSON} className="hidden" />
             </label>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {view === 'input' ? (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#09090b]">
            <div className="w-full max-w-3xl space-y-8">
              <div className="text-center">
                <h2 className="text-5xl font-black tracking-tight uppercase leading-none mb-4">PHÁC THẢO <br/> <span className="text-orange-600">STORYBOARD AI</span></h2>
                <p className="text-zinc-500 italic">Công cụ phân tích và tạo kịch bản hình ảnh chuyên dụng cho Filmmakers.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden h-[40vh]">
                <textarea className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed" value={scriptInput} onChange={e => setScriptInput(e.target.value)} placeholder="Dán kịch bản của bạn tại đây..." />
              </div>
              <div className="flex justify-center">
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-orange-600 text-white px-12 py-4 rounded-full font-black text-lg shadow-xl shadow-orange-600/30 hover:scale-105 transition-all disabled:opacity-50 flex items-center">
                  {isAnalyzing ? <Loader2 className="animate-spin mr-3" /> : <Wand2 className="mr-3"/>}
                  {isAnalyzing ? "ĐANG PHÂN TÍCH..." : "TẠO STORYBOARD"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-row">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div style={{ height: previewHeight }} className="flex-shrink-0 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative">
                {/* Fix: Use derived selectedItem for preview display */}
                {selectedItem ? (
                  <div className="max-w-[85%] max-h-[85%] aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl relative">
                    {selectedItem.data.imageUrl ? (
                      <img src={selectedItem.data.imageUrl} className="w-full h-full object-contain grayscale" />
                    ) : (
                      <div className="p-8 text-center text-zinc-500">
                        <Clapperboard size={32} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-orange-600 uppercase text-xs">{selectedItem.data.type}</p>
                        <p className="italic text-sm mt-2">"{selectedItem.data.description_vi}"</p>
                      </div>
                    )}
                  </div>
                ) : <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest opacity-30">Chọn một Shot trên timeline để xem</p>}
              </div>
              <div className="flex-1 relative">
                <Timeline items={timelineItems} onSelectItem={item => setSelectedItemId(item.id)} selectedItemId={selectedItemId} />
              </div>
              <div className="h-24 bg-zinc-50 dark:bg-zinc-950 border-t dark:border-zinc-900 p-2 overflow-y-auto font-mono text-[10px] text-zinc-500 custom-scrollbar">
                {logs.map((log, i) => <div key={i}>[{log.timestamp}] {log.message}</div>)}
                <div ref={logsEndRef} />
              </div>
            </div>
            <div className="w-96 bg-zinc-50 dark:bg-zinc-900 border-l dark:border-black shrink-0">
              <ShotDetails 
                /* Fix: Use derived selectedItem for ShotDetails component */
                item={selectedItem} 
                onClose={() => setSelectedItemId(undefined)} 
                onGenerateImage={async (asp, res) => {
                    /* Fix: Check both selectedItemId and selectedItem existence before generating image */
                    if(selectedItemId && selectedItem) {
                        await checkAndPromptKey();
                        addLog("Đang vẽ phác thảo...", "info");
                        const url = await generateShotImage(selectedItem.data.prompt_en, analysisData?.characters, asp, res);
                        if(url) {
                            setTimelineItems(prev => prev.map(t => t.id === selectedItemId ? {...t, data: {...t.data, imageUrl: url}} : t));
                            addLog("Vẽ phác thảo thành công.", "success");
                        }
                    }
                }} 
                onUpdateShot={(updates) => {
                    if(selectedItemId) {
                        setTimelineItems(prev => prev.map(t => t.id === selectedItemId ? {...t, data: {...t.data, ...updates}} : t));
                    }
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;


import React, { useState, useRef, useEffect } from 'react';
import { analyzeScript, validateApiKey, generateShotImage } from './services/geminiService';
import { ScriptAnalysis, TimelineItem, SavedProject, LogEntry, Shot } from './types';
import { Timeline } from './components/Timeline';
import { ShotDetails } from './components/ShotDetails';
import { HelpModal } from './components/HelpModal';
import { Play, Loader2, FileText, Wand2, LayoutTemplate, Upload, Key, CheckCircle, AlertCircle, HelpCircle, Save, FolderOpen, Download, ImagePlus, StopCircle, FileOutput, Settings, X, GripHorizontal, Images, PlusCircle, TerminalSquare, ShieldAlert, Sun, Moon, Clapperboard } from 'lucide-react';

const SAMPLE_SCRIPT = `CẢNH 1
EXT. BÃI PHẾ LIỆU CÔNG NGHỆ - NGÀY
TOÀN CẢNH. Giữa những đống kim loại gỉ sét khổng lồ của thành phố tương lai, một chú robot nhỏ tên BIT (hình dáng tròn trịa, mắt led xanh) đang đào bới. Bầu trời xám xịt, bụi bặm.

CẬN CẢNH. Tay robot chạm vào một vệt xanh lá le lói dưới lớp sắt vụn. Đó là một mầm cây nhỏ đang tỏa sáng.

CẢNH 2
EXT. BAN CÔNG NHÀ BIT - HOÀNG HÔN
TRUNG CẢNH. Bit cẩn thận đặt mầm cây vào một chiếc chậu làm từ vỏ lon cũ. Ánh nắng hoàng hôn màu cam cháy nhuộm đỏ những tòa tháp kim loại phía xa.`;

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiKey, setApiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [scriptInput, setScriptInput] = useState(SAMPLE_SCRIPT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ScriptAnalysis | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'input' | 'timeline'>('input');
  const [previewHeight, setPreviewHeight] = useState(400); 
  const isDraggingRef = useRef(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const shouldStopBatchRef = useRef(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleCheckKey = async () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;
    setApiStatus('checking');
    const isValid = await validateApiKey(cleanKey);
    if (isValid) {
      setIsKeyValid(true);
      setApiStatus('valid');
      addLog("API Key hợp lệ.", "success");
    } else {
      setIsKeyValid(false);
      setApiStatus('invalid');
      addLog("API Key không hợp lệ.", "error");
    }
  };

  /**
   * Render văn bản tiếng Việt Unicode sang Image để chèn vào PDF an toàn.
   */
  const renderTextToImage = (
    text: string, 
    widthMm: number, 
    fontSize: number, 
    color: string, 
    isBold: boolean = false,
    align: 'left' | 'center' = 'left'
  ): Promise<{ dataUrl: string, heightMm: number }> => {
    return new Promise((resolve) => {
      const scale = 5; // Độ phân giải cao cho PDF
      const mmToPx = 3.78; 
      const canvasWidth = widthMm * mmToPx * scale;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const fontName = '"Inter", "Segoe UI", "Arial", sans-serif';
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx * scale}px ${fontName}`;
      
      const words = text.split(/\s+/);
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
      
      const lineHeight = fontSize * 1.4;
      const totalHeightMm = lines.length * lineHeight + 2;
      canvas.width = canvasWidth;
      canvas.height = totalHeightMm * mmToPx * scale;
      
      ctx.scale(scale, scale);
      ctx.font = `${isBold ? 'bold' : ''} ${fontSize * mmToPx}px ${fontName}`;
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
    addLog("Đang đóng gói Storyboard chất lượng cao...", "info");
    
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // --- TRANG BÌA ---
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Header Cam
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      const badge = await renderTextToImage("OFFICIAL STORYBOARD DOCUMENT", pageWidth - 40, 9, "#FFFFFF", true, 'center');
      doc.addImage(badge.dataUrl, 'PNG', 20, 18, pageWidth - 40, badge.heightMm);

      const title = await renderTextToImage("SKETCH AI STORYBOARD", pageWidth - 40, 28, "#f97316", true, 'center');
      doc.addImage(title.dataUrl, 'PNG', 20, 70, pageWidth - 40, title.heightMm);

      const proj = await renderTextToImage(analysisData.title.toUpperCase(), pageWidth - 40, 22, "#18181b", true, 'center');
      doc.addImage(proj.dataUrl, 'PNG', 20, 70 + title.heightMm + 15, pageWidth - 40, proj.heightMm);

      const logline = await renderTextToImage(analysisData.logline_vi, pageWidth - 60, 11, "#52525b", false, 'center');
      doc.addImage(logline.dataUrl, 'PNG', 30, 140, pageWidth - 60, logline.heightMm);

      const dateStr = `NGÀY XUẤT: ${new Date().toLocaleDateString('vi-VN')}`;
      const date = await renderTextToImage(dateStr, pageWidth - 40, 8, "#a1a1aa", false, 'center');
      doc.addImage(date.dataUrl, 'PNG', 20, pageHeight - 20, pageWidth - 40, date.heightMm);

      // --- TRANG NỘI DUNG ---
      const margin = 15;
      const shotsPerPage = 3;
      const boxWidth = pageWidth - (margin * 2);
      const boxHeight = 75;

      for (let i = 0; i < timelineItems.length; i++) {
        const item = timelineItems[i];
        if (i % shotsPerPage === 0) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          
          doc.setFillColor(249, 115, 22);
          doc.rect(0, 0, pageWidth, 12, 'F');
          
          const header = await renderTextToImage(`DỰ ÁN: ${analysisData.title.toUpperCase()} | TRANG ${doc.internal.getNumberOfPages() - 1}`, pageWidth - 30, 7, "#FFFFFF", true);
          doc.addImage(header.dataUrl, 'PNG', margin, 3.5, pageWidth - 30, header.heightMm);
        }

        const y = 20 + (i % shotsPerPage) * (boxHeight + 10);

        // Khung card
        doc.setDrawColor(249, 115, 22);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, boxWidth, boxHeight);
        
        // Ảnh phác thảo
        const imgW = 85;
        const imgH = 47.8;
        doc.setFillColor(248, 248, 248);
        doc.rect(margin + 5, y + 5, imgW, imgH, 'F');
        if (item.data.imageUrl) {
          doc.addImage(item.data.imageUrl, 'PNG', margin + 5, y + 5, imgW, imgH);
        }

        // Thông tin text (Render sang image để an toàn Unicode)
        const infoX = margin + imgW + 10;
        const infoW = boxWidth - imgW - 15;

        const sNum = await renderTextToImage(`SHOT #${i + 1}`, infoW, 14, "#f97316", true);
        doc.addImage(sNum.dataUrl, 'PNG', infoX, y + 5, infoW, sNum.heightMm);

        const metaText = `${item.data.type} • ${item.duration}s • ${item.data.camera_movement || 'Tĩnh'}`;
        const meta = await renderTextToImage(metaText, infoW, 9, "#18181b", true);
        doc.addImage(meta.dataUrl, 'PNG', infoX, y + 5 + sNum.heightMm + 2, infoW, meta.heightMm);

        const desc = await renderTextToImage(item.data.description_vi, infoW, 9.5, "#52525b", false);
        doc.addImage(desc.dataUrl, 'PNG', infoX, y + 5 + sNum.heightMm + meta.heightMm + 6, infoW, desc.heightMm);

        const sceneLabel = await renderTextToImage(item.sceneHeader, infoW, 7, "#a1a1aa", false);
        doc.addImage(sceneLabel.dataUrl, 'PNG', infoX, y + boxHeight - 8, infoW, sceneLabel.heightMm);
      }

      doc.save(`STORYBOARD_FIXED_${analysisData.title.replace(/\s+/g, '_')}.pdf`);
      addLog("Xuất PDF thành công (Đã xử lý triệt để lỗi font).", "success");
    } catch (err: any) {
      addLog(`Lỗi PDF: ${err.message}`, "error");
    }
  };

  const handleAnalyze = async () => {
    if (!isKeyValid || !scriptInput.trim()) return;
    setIsAnalyzing(true);
    addLog("Đang phân tích kịch bản...", "info");
    try {
      const data = await analyzeScript(scriptInput, apiKey.trim());
      setAnalysisData(data);
      const items: TimelineItem[] = [];
      let time = 0;
      data.acts.forEach(act => act.scenes.forEach(scene => scene.shots.forEach(shot => {
        items.push({ id: shot.id, start: time, duration: shot.duration, data: shot, sceneHeader: scene.header });
        time += shot.duration;
      })));
      setTimelineItems(items);
      setView('timeline');
      addLog("Phân tích xong.", "success");
    } catch (err) {
      addLog("Lỗi phân tích.", "error");
    } finally { setIsAnalyzing(false); }
  };

  const selectedItem = timelineItems.find(i => i.id === selectedItemId) || null;

  return (
    <div className="h-screen w-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden transition-colors">
      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg">
            <Images size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase">SKETCH <span className="text-orange-500 font-light">AI</span></h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`flex items-center border rounded-lg px-2 py-1.5 transition-all ${
            apiStatus === 'valid' ? 'border-emerald-500 bg-emerald-500/5' : 
            apiStatus === 'invalid' ? 'border-red-500 bg-red-500/5' : 'border-zinc-200 dark:border-zinc-800'
          }`}>
            {apiStatus === 'checking' ? <Loader2 size={14} className="animate-spin text-orange-500" /> : 
             apiStatus === 'valid' ? <CheckCircle size={14} className="text-emerald-500" /> : 
             apiStatus === 'invalid' ? <AlertCircle size={14} className="text-red-500" /> : <ShieldAlert size={14} className="text-zinc-400" />}
            <input 
              type="password" 
              value={apiKey} 
              onChange={e => {setApiKey(e.target.value); setApiStatus('idle'); setIsKeyValid(false);}}
              placeholder="Gemini API Key..." 
              className="bg-transparent text-xs ml-2 outline-none w-32 md:w-48 placeholder-zinc-400"
            />
            {apiStatus === 'idle' && apiKey.length > 5 && (
              <button onClick={handleCheckKey} className="ml-2 text-[10px] font-bold text-orange-600 uppercase">Check</button>
            )}
          </div>

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {view === 'timeline' && (
            <button onClick={handleExportPDF} className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-500 transition-colors" title="Xuất PDF">
              <FileOutput size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {view === 'input' ? (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#09090b]">
            <div className="w-full max-w-3xl space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black tracking-tight leading-tight uppercase">PHÁC THẢO <br/> <span className="text-orange-600">STORYBOARD AI</span></h2>
                <p className="text-zinc-500 max-w-md mx-auto italic">Tự động bóc tách kịch bản và phác họa storyboard với độ chính xác cao.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden h-[40vh] relative">
                <textarea 
                  className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
                  value={scriptInput}
                  onChange={e => setScriptInput(e.target.value)}
                  placeholder="Dán kịch bản tại đây..."
                />
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !isKeyValid}
                  className="bg-orange-600 text-white px-12 py-4 rounded-full font-black text-lg shadow-xl shadow-orange-600/30 hover:scale-105 transition-all disabled:opacity-50 flex items-center"
                >
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
                ) : <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest opacity-30">Chọn một Shot để xem</p>}
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
              <ShotDetails item={selectedItem} onClose={() => setSelectedItemId(undefined)} onGenerateImage={(asp, res) => {
                if(selectedItemId && isKeyValid) {
                  addLog("Đang vẽ phác thảo...", "info");
                  generateShotImage(selectedItem!.data.prompt_en, apiKey.trim(), [], asp, res).then(url => {
                    if(url) {
                      setTimelineItems(prev => prev.map(t => t.id === selectedItemId ? {...t, data: {...t.data, imageUrl: url}} : t));
                      addLog("Đã vẽ xong.", "success");
                    }
                  });
                }
              }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

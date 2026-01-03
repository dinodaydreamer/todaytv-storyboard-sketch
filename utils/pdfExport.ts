
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { StoryScene } from "../types";

export const exportToPDF = async (scenes: StoryScene[]) => {
  const container = document.getElementById('pdf-render-container');
  if (!container) return;

  // Đảm bảo font chữ đã được tải hoàn toàn trước khi render
  await document.fonts.ready;

  container.innerHTML = '';
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const pageElement = document.createElement('div');
    pageElement.className = "pdf-page-render";
    pageElement.style.width = '800px';
    pageElement.style.padding = '50px';
    pageElement.style.background = 'white';
    pageElement.style.color = 'black';
    // Sử dụng font-stack chuẩn để đảm bảo tiếng Việt không bị lỗi
    pageElement.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    pageElement.innerHTML = `
      <div style="border-bottom: 5px solid #000; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">
            SHOT ${scene.shotNumber}
          </h1>
          <div style="font-size: 14px; color: #555; font-weight: 700; margin-top: 5px; text-transform: uppercase;">
            ${scene.shotType}
          </div>
        </div>
        <div style="text-align: right; font-size: 12px; font-weight: 800; color: #888;">
          TỈ LỆ: ${scene.aspectRatio} | THỜI LƯỢNG: ${scene.duration}S
        </div>
      </div>

      <div style="width: 100%; border: 3px solid #000; background: #000; margin-bottom: 35px; aspect-ratio: ${scene.aspectRatio === '16:9' ? '16/9' : scene.aspectRatio === '9:16' ? '9/16' : '1/1'}; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        ${scene.imageUrl ? 
          `<img src="${scene.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : 
          `<div style="color: #444; font-weight: 900; font-size: 24px;">NO VISUAL GENERATED</div>`
        }
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">
        <div style="background: #fafafa; border-left: 8px solid #ff6b00; padding: 25px; border-radius: 0 8px 8px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 12px; color: #ff6b00; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Kịch bản chi tiết</h2>
          <p style="margin: 0; font-size: 18px; line-height: 1.6; color: #1a1a1a; font-weight: 500;">${scene.description}</p>
        </div>
        
        <div style="padding: 0 25px;">
          <h2 style="margin: 0 0 8px 0; font-size: 11px; color: #bbb; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">AI Prompt Visual</h2>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #888; font-style: italic;">${scene.visualPrompt}</p>
        </div>
      </div>

      <div style="position: absolute; bottom: 40px; left: 50px; right: 50px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #ccc; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
        <span>AI SKETCH STORYBOARD PRO</span>
        <span>TRANG ${i + 1} / ${scenes.length}</span>
      </div>
    `;

    container.appendChild(pageElement);

    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    container.removeChild(pageElement);
  }

  pdf.save(`Storyboard_Final_VN_${new Date().toISOString().split('T')[0]}.pdf`);
};

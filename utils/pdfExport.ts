
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { StoryScene } from "../types";

export const exportToPDF = async (scenes: StoryScene[]) => {
  const container = document.getElementById('pdf-render-container');
  if (!container) return;

  // Xóa nội dung cũ
  container.innerHTML = '';
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    
    // Tạo cấu trúc HTML cho một trang
    const pageElement = document.createElement('div');
    pageElement.style.width = '800px';
    pageElement.style.padding = '40px';
    pageElement.style.background = 'white';
    pageElement.style.color = 'black';
    pageElement.style.fontFamily = "'Inter', sans-serif";

    pageElement.innerHTML = `
      <div style="border-bottom: 4px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
          ${scene.title} <span style="color: #666; font-size: 16px; font-weight: 400;">/ ${scene.shotType}</span>
        </h1>
        <div style="text-align: right; font-size: 12px; font-weight: 700;">
          THỜI LƯỢNG: ${scene.duration}S | TỈ LỆ: ${scene.aspectRatio}
        </div>
      </div>

      <div style="width: 100%; border: 2px solid #000; background: #f9f9f9; margin-bottom: 30px; aspect-ratio: ${scene.aspectRatio === '16:9' ? '16/9' : scene.aspectRatio === '9:16' ? '9/16' : '1/1'}; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        ${scene.imageUrl ? 
          `<img src="${scene.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : 
          `<div style="color: #ccc; font-weight: bold; font-size: 20px;">[CHƯA CÓ HÌNH ẢNH]</div>`
        }
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
        <div style="border-left: 5px solid #ff6b00; padding-left: 15px;">
          <h2 style="margin: 0 0 5px 0; font-size: 14px; color: #ff6b00; text-transform: uppercase; font-weight: 900;">Kịch bản / Nội dung</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333;">${scene.description}</p>
        </div>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 4px;">
          <h2 style="margin: 0 0 5px 0; font-size: 11px; color: #999; text-transform: uppercase; font-weight: 900;">AI Visual Prompt</h2>
          <p style="margin: 0; font-size: 13px; font-style: italic; color: #666;">${scene.visualPrompt}</p>
        </div>
      </div>

      <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #aaa; text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
        AI Sketch Storyboard Pro • Trang ${i + 1} / ${scenes.length}
      </div>
    `;

    container.appendChild(pageElement);

    // Chụp canvas từ HTML
    const canvas = await html2canvas(pageElement, {
      scale: 2, // Tăng chất lượng ảnh
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Xóa page element sau khi chụp xong để giải phóng memory
    container.removeChild(pageElement);
  }

  pdf.save(`Storyboard_Pro_Vietnamese_${new Date().getTime()}.pdf`);
};

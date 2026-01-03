
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { StoryScene } from "../types";

export const exportToPDF = async (scenes: StoryScene[]) => {
  const container = document.getElementById('pdf-render-container');
  if (!container) return;

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
    pageElement.style.padding = '60px';
    pageElement.style.background = 'white';
    pageElement.style.color = 'black';
    pageElement.style.position = 'relative';
    pageElement.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    // Tính toán chiều cao ảnh để tránh dùng aspect-ratio (thường gây lỗi rendering)
    let imageHeight = 350; // Mặc định
    if (scene.aspectRatio === '16:9') imageHeight = 680 * (9/16);
    else if (scene.aspectRatio === '9:16') imageHeight = 680 * (16/9);
    else if (scene.aspectRatio === '4:3') imageHeight = 680 * (3/4);
    else imageHeight = 680;

    pageElement.innerHTML = `
      <div style="padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 36px; font-weight: 900; text-transform: uppercase; letter-spacing: -1.5px; color: #000;">
            SHOT ${scene.shotNumber}
          </h1>
          <div style="font-size: 14px; color: #666; font-weight: 700; margin-top: 4px; text-transform: uppercase;">
            ${scene.shotType}
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; font-weight: 800; color: #999; letter-spacing: 1px;">
          TỈ LỆ: ${scene.aspectRatio} | THỜI LƯỢNG: ${scene.duration}S
        </div>
      </div>

      <div style="width: 100%; height: ${imageHeight}px; background: #000; margin-bottom: 40px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #ddd;">
        ${scene.imageUrl ? 
          `<img src="${scene.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : 
          `<div style="color: #444; font-weight: 900; font-size: 20px; text-transform: uppercase;">Chưa có hình ảnh</div>`
        }
      </div>

      <div style="margin-top: 20px;">
        <div style="margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 13px; color: #ff6b00; text-transform: uppercase; font-weight: 900; letter-spacing: 1.5px;">Kịch bản chi tiết</h2>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 4px;">
          <p style="margin: 0; font-size: 19px; line-height: 1.6; color: #111; font-weight: 500;">${scene.description}</p>
        </div>
      </div>

      <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #bbb; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
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
      backgroundColor: "#ffffff",
      // Tắt các tính năng có thể gây lỗi sọc ngang
      ignoreElements: (element) => element.tagName === 'IFRAME'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    container.removeChild(pageElement);
  }

  pdf.save(`Storyboard_Final_${new Date().getTime()}.pdf`);
};

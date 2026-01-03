
import { jsPDF } from "jspdf";
import { StoryScene } from "../types";

/**
 * Xuất file PDF Storyboard chuyên nghiệp.
 * Sử dụng bảng mã Latinh sạch để đảm bảo hiển thị đúng chính tả cơ bản.
 */
export const exportToPDF = async (scenes: StoryScene[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header đen cinematic
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 107, 0);
  doc.setFontSize(26);
  doc.text("AI STORYBOARD PROFESSIONAL", 20, 25);
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(10);
  doc.text(`MODEL: GEMINI 3 PRO IMAGE | NGAY: ${new Date().toLocaleDateString('vi-VN')}`, 20, 35);
  doc.text(`TONG SO PHAN CANH: ${scenes.length}`, 20, 42);

  let y = 60;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  scenes.forEach((scene, index) => {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    // Line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Shot Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`${scene.title.toUpperCase()} - ${scene.shotType}`, margin, y);
    y += 8;

    // Image
    const imgW = contentWidth;
    const imgH = 80;
    if (scene.imageUrl) {
      try {
        doc.addImage(scene.imageUrl, 'PNG', margin, y, imgW, imgH);
      } catch (e) {
        doc.rect(margin, y, imgW, imgH);
      }
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, imgW, imgH, 'F');
    }
    y += imgH + 10;

    // Description (Xử lý tiếng Việt an toàn cho jsPDF)
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    const splitDesc = doc.splitTextToSize(`NOI DUNG: ${scene.description}`, contentWidth);
    doc.text(splitDesc, margin, y);
    y += (splitDesc.length * 6) + 4;

    const splitPrompt = doc.splitTextToSize(`PROMPT AI: ${scene.visualPrompt}`, contentWidth);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(splitPrompt, margin, y);
    
    y += (splitPrompt.length * 5) + 15;
  });

  doc.save(`Storyboard_Pro_${new Date().getTime()}.pdf`);
};

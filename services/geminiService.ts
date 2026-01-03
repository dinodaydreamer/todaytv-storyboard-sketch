
import { GoogleGenAI } from "@google/genai";
import { StoryScene, AspectRatio, ShotType } from "../types";

export const generateSketch = async (
  scene: StoryScene,
  apiKey: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const systemPrompt = `Create a high-end cinematic storyboard sketch.
  ART STYLE: Professional charcoal and pencil rough sketch. Grayscale only. High contrast.
  SCENE CONTENT: ${scene.visualPrompt}.
  SHOT TYPE: ${scene.shotType}. Ensure the composition strictly follows this shot type.
  
  CRITICAL STYLING RULES:
  1. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS.
  2. NO ARROWS, NO CAMERA MOVEMENT SYMBOLS.
  3. NO SPEECH BUBBLES. NO LABELS.
  4. NO WATERMARKS OR ARTIST SIGNATURES.
  5. PURE VISUAL ARTWORK ONLY. 
  6. CLEAN COMPOSITION FOR FILM PRODUCTION.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: systemPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: (scene.aspectRatio === '16:9' ? '16:9' : 
                        scene.aspectRatio === '9:16' ? '9:16' : 
                        scene.aspectRatio === '4:3' ? '4:3' : '1:1') as any,
          imageSize: "1K"
        },
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Không nhận được dữ liệu ảnh từ AI.");
  } catch (error) {
    console.error("Lỗi Gemini Pro:", error);
    throw error;
  }
};

export const parseScriptToScenes = (script: string): Partial<StoryScene>[] => {
  // Regex tách các shot dựa trên từ khóa Shot/Cảnh/Phân cảnh
  const segments = script.split(/(?=Shot\s*\d+|Phân cảnh\s*\d+|Cảnh\s*\d+)/i).filter(s => s.trim());
  
  return segments.map((seg, index) => {
    const cleanSeg = seg.trim();
    
    // Tìm số shot
    const titleMatch = cleanSeg.match(/^(Shot|Phân cảnh|Cảnh)\s*(\d+):?/i);
    const title = titleMatch ? `Shot ${titleMatch[2]}` : `Shot ${index + 1}`;
    
    // Làm sạch nội dung mô tả
    const description = cleanSeg.replace(/^(Shot|Phân cảnh|Cảnh)\s*\d+:?/i, '').trim();
    
    // Tự động nhận diện Shot Type từ nội dung
    let detectedShotType = ShotType.MEDIUM; // Mặc định
    if (cleanSeg.toLowerCase().match(/cận cảnh|close-up|close up|đặc tả/i)) {
      detectedShotType = ShotType.CLOSE_UP;
    } else if (cleanSeg.toLowerCase().match(/toàn cảnh|wide shot|wide-shot|long shot/i)) {
      detectedShotType = ShotType.WIDE;
    } else if (cleanSeg.toLowerCase().match(/cực toàn|extreme wide/i)) {
      detectedShotType = ShotType.EXTREME_WIDE;
    } else if (cleanSeg.toLowerCase().match(/qua vai|over the shoulder|ots/i)) {
      detectedShotType = ShotType.OVER_THE_SHOULDER;
    } else if (cleanSeg.toLowerCase().match(/pov|góc nhìn nhân vật/i)) {
      detectedShotType = ShotType.POINT_OF_VIEW;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      shotNumber: index + 1,
      title: title,
      description: description || "Phân cảnh mới",
      visualPrompt: description || "Cinematic storyboard sketch",
      duration: 5,
      shotType: detectedShotType,
      aspectRatio: AspectRatio.SIXTEEN_NINE,
      status: 'idle' as const
    };
  });
};

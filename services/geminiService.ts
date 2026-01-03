
import { GoogleGenAI } from "@google/genai";
import { StoryScene, AspectRatio, ShotType } from "../types";

export const generateSketch = async (
  scene: StoryScene,
  apiKey: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  // Prompt tối ưu hóa: Không có chữ, phong cách sketch điện ảnh 1K
  const systemPrompt = `Create a professional cinematic storyboard sketch.
  ART STYLE: High-quality charcoal and pencil hand-drawn technique on white paper.
  VISUAL CONTENT: ${scene.visualPrompt}.
  SHOT COMPOSITION: ${scene.shotType}.
  LIGHTING: Dramatic cinematic lighting, strong contrast, no colors.
  MANDATORY RULES: 
  - ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS.
  - NO LABELS, NO SPEECH BUBBLES.
  - NO OVERLAYS OR WATERMARKS.
  - Pure visual cinematic artwork only.
  - Professional film production storyboard quality.`;

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
    throw new Error("Không tìm thấy dữ liệu ảnh.");
  } catch (error) {
    console.error("Lỗi Gemini Pro:", error);
    throw error;
  }
};

export const parseScriptToScenes = (script: string): Partial<StoryScene>[] => {
  const segments = script.split(/(?=Shot\s*\d+|Phân cảnh\s*\d+|Cảnh\s*\d+)/i).filter(s => s.trim());
  return segments.map((seg, index) => {
    const cleanSeg = seg.trim();
    const titleMatch = cleanSeg.match(/^(Shot|Phân cảnh|Cảnh)\s*(\d+):?/i);
    const title = titleMatch ? `Shot ${titleMatch[2]}` : `Shot ${index + 1}`;
    const description = cleanSeg.replace(/^(Shot|Phân cảnh|Cảnh)\s*\d+:?/i, '').trim();
    return {
      id: Math.random().toString(36).substr(2, 9),
      shotNumber: index + 1,
      title: title,
      description: description || "Phân cảnh mới",
      visualPrompt: description || "Cinematic storyboard sketch",
      duration: 5,
      shotType: ShotType.MEDIUM,
      aspectRatio: AspectRatio.SIXTEEN_NINE,
      status: 'idle' as const
    };
  });
};

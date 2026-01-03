
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis } from "../types";

// Fix: Removed explicit Schema type to rely on inference and simplify integration
const scriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Tên kịch bản" },
    genre: { type: Type.STRING, description: "Thể loại phim" },
    logline_vi: { type: Type.STRING, description: "Tóm tắt nội dung bằng tiếng Việt (1 câu)" },
    characters: {
      type: Type.ARRAY,
      description: "Danh sách nhân vật chính và mô tả ngoại hình",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "Mô tả ngoại hình chi tiết" }
        },
        required: ["name", "description"]
      }
    },
    acts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.STRING },
                header: { type: Type.STRING },
                location: { type: Type.STRING },
                time: { type: Type.STRING },
                shots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      duration: { type: Type.NUMBER },
                      description_vi: { type: Type.STRING },
                      camera_movement: { type: Type.STRING },
                      prompt_en: { type: Type.STRING },
                      prompt_video_en: { type: Type.STRING }
                    },
                    required: ["type", "duration", "description_vi", "prompt_en", "prompt_video_en", "camera_movement"]
                  }
                }
              },
              required: ["scene_number", "header", "location", "time", "shots"]
            }
          }
        },
        required: ["title", "scenes"]
      }
    }
  },
  required: ["title", "genre", "logline_vi", "acts"]
};

export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysis> => {
  // Fix: Initialized GoogleGenAI using direct process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Phân tích kịch bản sau đây thành cấu trúc 3 Hồi (Acts), các Cảnh (Scenes) và từng Cú máy (Shots). Trả về JSON.
    Nội dung: ${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: scriptSchema,
      systemInstruction: "Bạn là một trợ lý đạo diễn chuyên nghiệp. Hãy bóc tách kịch bản thành danh sách shot chi tiết kèm theo mô tả tiếng Việt và prompt tiếng Anh cho AI tạo ảnh.",
    }
  });

  const data = JSON.parse(response.text || '{}') as ScriptAnalysis;
  
  data.acts.forEach((act, aIdx) => {
    act.id = `act-${aIdx}`;
    act.scenes.forEach((scene, sIdx) => {
      scene.id = `scene-${aIdx}-${sIdx}`;
      scene.shots.forEach((shot, shIdx) => {
        shot.id = `shot-${aIdx}-${sIdx}-${shIdx}`;
      });
    });
  });

  return data;
};

export const generateShotImage = async (
    prompt: string, 
    characters?: {name: string, description: string}[],
    aspectRatio: string = "16:9",
    resolution: string = "1K"
): Promise<string | null> => {
  // Fix: Initialized GoogleGenAI using direct process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let finalPrompt = `Cinematic storyboard sketch, pencil shading, high contrast, clean lines: ${prompt}`;
  if (characters?.length) {
    const charDesc = characters.map(c => `${c.name}: ${c.description}`).join('; ');
    finalPrompt += ` | Reference characters: ${charDesc}`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: { parts: [{ text: finalPrompt }] },
    config: {
      imageConfig: { aspectRatio: aspectRatio as any, imageSize: resolution as any }
    }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
};

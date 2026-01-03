
export enum ShotType {
  CLOSE_UP = 'Cận cảnh (Close-up)',
  MEDIUM = 'Trung cảnh (Medium Shot)',
  WIDE = 'Toàn cảnh (Wide Shot)',
  EXTREME_WIDE = 'Cực toàn cảnh (Extreme Wide)',
  OVER_THE_SHOULDER = 'Qua vai (Over-the-shoulder)',
  POINT_OF_VIEW = 'Góc nhìn nhân vật (POV)',
}

export enum AspectRatio {
  SIXTEEN_NINE = '16:9',
  ONE_ONE = '1:1',
  NINE_SIXTEEN = '9:16',
  FOUR_THREE = '4:3',
}

export interface StoryScene {
  id: string;
  shotNumber: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  duration: number; // giây
  shotType: ShotType;
  aspectRatio: AspectRatio;
  status: 'idle' | 'generating' | 'completed' | 'error';
}

export interface AppState {
  scenes: StoryScene[];
  currentSceneId: string | null;
  isGeneratingAll: boolean;
  scriptInput: string;
  isApiReady: boolean;
  apiKey: string;
}

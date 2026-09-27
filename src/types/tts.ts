export type VoiceName = "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";

export type TTSMode = "single" | "dialogue";

export interface VoiceProfile {
  name: VoiceName;
  genderHint: "Neutral / Male" | "Deep / Masculine" | "Warm / Feminine" | "Gritty / Dynamic" | "Smooth / Breezy";
  tone: string;
  recommendedFor: string[];
  color: string;
  iconName: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  style?: string;
}

export interface SpeakerConfig {
  speaker: string;
  voiceName: VoiceName;
  style?: string;
}

export interface GeneratedAudioItem {
  id: string;
  timestamp: number;
  mode: TTSMode;
  title: string;
  text: string;
  style?: string;
  voiceName?: VoiceName;
  dialogueSpeakers?: SpeakerConfig[];
  dialogueParts?: DialogueLine[];
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  duration?: number;
  peaks?: number[];
  blobUrl?: string;
}

export interface TTSPreset {
  id: string;
  title: string;
  category: "Cinematic" | "Podcast" | "Meditation" | "Gaming" | "Commercial" | "Storytelling";
  mode: TTSMode;
  description: string;
  // single mode fields
  voiceName?: VoiceName;
  text?: string;
  style?: string;
  // dialogue mode fields
  dialogueSpeakers?: [SpeakerConfig, SpeakerConfig];
  dialogueParts?: Omit<DialogueLine, "id">[];
}

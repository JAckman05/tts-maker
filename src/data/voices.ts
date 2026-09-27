import { VoiceProfile } from "../types/tts";

export const GEMINI_VOICES: VoiceProfile[] = [
  {
    name: "Puck",
    genderHint: "Neutral / Male",
    tone: "Youthful, vibrant, energetic, friendly & engaging",
    recommendedFor: ["Podcasts", "Explainers", "Upbeat Narrations", "Casual Dialogue"],
    color: "from-amber-500 to-orange-600",
    iconName: "Sparkles",
  },
  {
    name: "Charon",
    genderHint: "Deep / Masculine",
    tone: "Authoritative, resonant, cinematic & deep presence",
    recommendedFor: ["Movie Trailers", "Documentaries", "Epic Storytelling", "Audiobooks"],
    color: "from-indigo-600 to-slate-800",
    iconName: "Film",
  },
  {
    name: "Kore",
    genderHint: "Warm / Feminine",
    tone: "Warm, empathetic, articulate, calm & clear",
    recommendedFor: ["Meditation", "Customer Care", "Educational Content", "Audio Guides"],
    color: "from-emerald-500 to-teal-700",
    iconName: "Heart",
  },
  {
    name: "Fenrir",
    genderHint: "Gritty / Dynamic",
    tone: "Commanding, intense, gritty & dramatic weight",
    recommendedFor: ["Video Game NPCs", "Action Prompts", "Suspense Monologues"],
    color: "from-rose-600 to-red-900",
    iconName: "ShieldAlert",
  },
  {
    name: "Zephyr",
    genderHint: "Smooth / Breezy",
    tone: "Breezy, modern, silky smooth, laid-back & articulate",
    recommendedFor: ["Tech Keynotes", "Lifestyle Vlogs", "Modern Podcasts", "Ambient Reading"],
    color: "from-cyan-500 to-blue-600",
    iconName: "Wind",
  },
];

import React from "react";
import { Sparkles, Film, Heart, ShieldAlert, Wind, Check } from "lucide-react";
import { GEMINI_VOICES } from "../data/voices";
import { VoiceName } from "../types/tts";

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  label?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  label = "Voice Persona",
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case "Film":
        return <Film className="w-4 h-4" />;
      case "Heart":
        return <Heart className="w-4 h-4" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-4 h-4" />;
      case "Wind":
        return <Wind className="w-4 h-4" />;
      case "Sparkles":
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
        <span className="text-[11px] text-slate-400">
          Selected: <strong className="text-violet-300">{selectedVoice}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {GEMINI_VOICES.map((v) => {
          const isSelected = selectedVoice === v.name;
          return (
            <button
              key={v.name}
              type="button"
              onClick={() => onSelectVoice(v.name)}
              className={`p-3 rounded-xl border text-left transition relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-slate-800/90 border-violet-500 shadow-md shadow-violet-500/10 ring-1 ring-violet-500/50"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${v.color} flex items-center justify-center text-white shadow-sm`}
                >
                  {getIcon(v.iconName)}
                </div>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="font-semibold text-slate-100 text-sm">{v.name}</div>
              <div className="text-[10px] text-violet-400/90 font-medium mb-1">
                {v.genderHint}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {v.tone}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

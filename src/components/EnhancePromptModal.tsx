import React, { useState } from "react";
import { Sparkles, Wand2, X, Check, Loader2, Lightbulb } from "lucide-react";

interface EnhancePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  currentStyle: string;
  onApply: (enhancedText: string, suggestedStyle: string) => void;
}

export const EnhancePromptModal: React.FC<EnhancePromptModalProps> = ({
  isOpen,
  onClose,
  currentText,
  currentStyle,
  onApply,
}) => {
  const [intention, setIntention] = useState<string>("Make it sound natural with cinematic breathing and emotional depth");
  const [persona, setPersona] = useState<string>("Engaging Narrator");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    enhancedText: string;
    suggestedStyle: string;
    tips?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleEnhance = async () => {
    if (!currentText.trim()) {
      setError("Please write some text in the prompt editor first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tts/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: currentText,
          currentStyle,
          persona,
          intention,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to enhance prompt");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Enhancement failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result.enhancedText, result.suggestedStyle);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100 leading-tight">
              AI Voice Director & Prompt Enhancer
            </h3>
            <p className="text-xs text-slate-400">
              Injects lifelike vocal bursts (&lt;breath&gt;, &lt;laugh&gt;) and prosody directives
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">
              Target Persona / Vibe
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                "Cinematic Trailer Narrator",
                "Warm Podcast Co-host",
                "Calm Meditation Master",
                "Gritty Cyberpunk Mercenary",
                "Charismatic Tech Presenter",
                "Emotional Storyteller",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPersona(preset)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition cursor-pointer ${
                    persona === preset
                      ? "bg-violet-600/30 border-violet-500 text-violet-200"
                      : "bg-slate-850 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Directorial Intention
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              placeholder="e.g. Add subtle breath pauses, gentle laughter, and intimate pacing"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleEnhance}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Directing Vocal Cadence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Enhance Script & Generate Style Directive</span>
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider block mb-1">
                  Enhanced Script (with vocal markers)
                </span>
                <p className="text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {result.enhancedText}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Recommended speechMetadata.style
                </span>
                <p className="text-slate-200 italic text-xs leading-relaxed">
                  {result.suggestedStyle}
                </p>
              </div>

              {result.tips && result.tips.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Vocal Director's Notes:
                  </span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1">
                    {result.tips.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply to Prompt Editor</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

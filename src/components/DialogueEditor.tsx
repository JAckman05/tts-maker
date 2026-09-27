import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, User, Sparkles, MessageSquare } from "lucide-react";
import { DialogueLine, SpeakerConfig, VoiceName } from "../types/tts";
import { GEMINI_VOICES } from "../data/voices";

interface DialogueEditorProps {
  speakers: [SpeakerConfig, SpeakerConfig];
  onChangeSpeakers: (speakers: [SpeakerConfig, SpeakerConfig]) => void;
  lines: DialogueLine[];
  onChangeLines: (lines: DialogueLine[]) => void;
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  speakers,
  onChangeSpeakers,
  lines,
  onChangeLines,
}) => {
  const updateSpeaker = (idx: 0 | 1, key: keyof SpeakerConfig, value: string) => {
    const updated = [...speakers] as [SpeakerConfig, SpeakerConfig];
    const prevSpeakerName = updated[idx].speaker;
    updated[idx] = { ...updated[idx], [key]: value };

    // If speaker name changed, update dialogue lines referencing that speaker
    if (key === "speaker" && value.trim()) {
      const newLines = lines.map((l) =>
        l.speaker === prevSpeakerName ? { ...l, speaker: value.trim() } : l
      );
      onChangeLines(newLines);
    }
    onChangeSpeakers(updated);
  };

  const addLine = (speakerName: string) => {
    const newLine: DialogueLine = {
      id: "line-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      speaker: speakerName || speakers[0].speaker,
      text: "",
      style: "",
    };
    onChangeLines([...lines, newLine]);
  };

  const updateLine = (id: string, updates: Partial<DialogueLine>) => {
    onChangeLines(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLine = (id: string) => {
    if (lines.length <= 1) return;
    onChangeLines(lines.filter((l) => l.id !== id));
  };

  const moveLine = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lines.length) return;
    const copy = [...lines];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    onChangeLines(copy);
  };

  const insertTagIntoLine = (id: string, tag: string) => {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const newText = line.text ? `${line.text} ${tag} ` : `${tag} `;
    updateLine(id, { text: newText });
  };

  return (
    <div className="space-y-6">
      {/* Speaker Definitions (Gemini 3.8 Flash TTS requires exactly 2 speakers for multiSpeakerVoiceConfig) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Dialogue Characters (2 Speakers)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Powered by Gemini Multi-Speaker Direction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speakers.map((spk, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300">
                  Character {idx + 1}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Voice: {spk.voiceName}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Character Name</label>
                <input
                  type="text"
                  value={spk.speaker}
                  onChange={(e) => updateSpeaker(idx as 0 | 1, "speaker", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-medium"
                  placeholder="e.g. Alex"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voice Persona</label>
                <select
                  value={spk.voiceName}
                  onChange={(e) =>
                    updateSpeaker(idx as 0 | 1, "voiceName", e.target.value as VoiceName)
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.genderHint} - {v.tone.slice(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Default Character Tone</label>
                <input
                  type="text"
                  value={spk.style || ""}
                  onChange={(e) => updateSpeaker(idx as 0 | 1, "style", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Curious, warm, articulate co-host"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screenplay Turn Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Dialogue Lines ({lines.length} Turns)
            </h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => addLine(speakers[0].speaker)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3 h-3 text-violet-400" />
              <span>Add Line ({speakers[0].speaker || "Speaker 1"})</span>
            </button>
            <button
              type="button"
              onClick={() => addLine(speakers[1].speaker)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>Add Line ({speakers[1].speaker || "Speaker 2"})</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => {
            const isSpeaker1 = line.speaker === speakers[0].speaker;
            return (
              <div
                key={line.id}
                className={`p-3.5 rounded-xl border transition ${
                  isSpeaker1
                    ? "bg-slate-900/80 border-violet-500/30"
                    : "bg-slate-900/80 border-emerald-500/30"
                }`}
              >
                {/* Line top bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400 w-5">#{idx + 1}</span>
                    <select
                      value={line.speaker}
                      onChange={(e) => updateLine(line.id, { speaker: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value={speakers[0].speaker}>{speakers[0].speaker || "Speaker 1"}</option>
                      <option value={speakers[1].speaker}>{speakers[1].speaker || "Speaker 2"}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move controls */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveLine(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Move line up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === lines.length - 1}
                      onClick={() => moveLine(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Move line down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete line */}
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteLine(line.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer ml-1"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Line text textarea */}
                <div>
                  <textarea
                    rows={2}
                    value={line.text}
                    onChange={(e) => updateLine(line.id, { text: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none font-sans leading-relaxed"
                    placeholder={`What does ${line.speaker || "this character"} say? You can include <breath>, <laugh>, |yeah| ...`}
                  />
                </div>

                {/* Quick tags bar for this line */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Insert:</span>
                    {["<breath>", "<laugh>", "<gasp>", "<sigh>", "|yeah|", "|mhm|", "|right|"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTagIntoLine(line.id, tag)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 flex-1 min-w-[200px] max-w-sm justify-end">
                    <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
                    <input
                      type="text"
                      value={line.style || ""}
                      onChange={(e) => updateLine(line.id, { style: e.target.value })}
                      placeholder="Line emotion / style (optional)"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

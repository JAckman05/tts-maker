import React from "react";
import { Sparkles, HelpCircle } from "lucide-react";

interface PromptTagsBarProps {
  onInsertTag: (tag: string) => void;
  mode?: "single" | "dialogue";
}

interface TagItem {
  tag: string;
  label: string;
  description: string;
  category: "burst" | "backchannel";
  badgeColor: string;
}

const TAGS: TagItem[] = [
  {
    tag: "<breath>",
    label: "Breath",
    description: "Adds a natural, human breath intake and organic pause.",
    category: "burst",
    badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25",
  },
  {
    tag: "<laugh>",
    label: "Laugh",
    description: "Generates an audible, spontaneous laugh or chuckle.",
    category: "burst",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25",
  },
  {
    tag: "<gasp>",
    label: "Gasp",
    description: "Injects sudden surprise, alarm, or breathless emotion.",
    category: "burst",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25",
  },
  {
    tag: "<sigh>",
    label: "Sigh",
    description: "Produces a subtle emotional sigh of relief, fatigue, or resignation.",
    category: "burst",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25",
  },
  {
    tag: "|yeah|",
    label: "|yeah|",
    description: "Natural conversational agreement backchannel without interrupting the main rhythm.",
    category: "backchannel",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25",
  },
  {
    tag: "|mhm|",
    label: "|mhm|",
    description: "Thoughtful nodding backchannel sound indicating attentive listening.",
    category: "backchannel",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30 hover:bg-teal-500/25",
  },
  {
    tag: "|right|",
    label: "|right|",
    description: "Affirmative conversational chime frequently used in dialogues and podcasts.",
    category: "backchannel",
    badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25",
  },
  {
    tag: "|uh-huh|",
    label: "|uh-huh|",
    description: "Casual listening backchannel response.",
    category: "backchannel",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25",
  },
];

export const PromptTagsBar: React.FC<PromptTagsBarProps> = ({ onInsertTag }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 my-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Quick Vocal Direction Tags</span>
          <span className="text-[10px] text-slate-400 font-normal ml-1">
            (Click to insert at cursor)
          </span>
        </div>
        <div className="group relative flex items-center text-slate-400 hover:text-slate-200 cursor-pointer">
          <HelpCircle className="w-3.5 h-3.5" />
          <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-2 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-300 shadow-xl z-20">
            Gemini 3.8 Flash TTS supports native scripted vocal bursts like &lt;breath&gt; and dialogue backchanneling like |yeah| to synthesize lifelike, natural human audio.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 mr-1 select-none">
          Vocal Bursts:
        </span>
        {TAGS.filter((t) => t.category === "burst").map((item) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => onInsertTag(item.tag)}
            className={`px-2 py-1 rounded-md text-xs font-mono border transition flex items-center gap-1 cursor-pointer active:scale-95 ${item.badgeColor}`}
            title={item.description}
          >
            <span>{item.tag}</span>
          </button>
        ))}

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <span className="text-[10px] font-mono uppercase text-slate-400 mr-1 select-none">
          Backchannels:
        </span>
        {TAGS.filter((t) => t.category === "backchannel").map((item) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => onInsertTag(item.tag)}
            className={`px-2 py-1 rounded-md text-xs font-mono border transition flex items-center gap-1 cursor-pointer active:scale-95 ${item.badgeColor}`}
            title={item.description}
          >
            <span>{item.tag}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

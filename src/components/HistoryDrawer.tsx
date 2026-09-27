import React from "react";
import { History, Play, Trash2, Download, RefreshCw, X, Radio } from "lucide-react";
import { GeneratedAudioItem } from "../types/tts";
import { formatTime } from "../utils/audio";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedAudioItem[];
  onPlayItem: (item: GeneratedAudioItem) => void;
  onLoadItem: (item: GeneratedAudioItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onPlayItem,
  onLoadItem,
  onDeleteItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-md flex flex-col text-white">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold text-sm text-slate-100">Take History</h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Clear all history"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Radio className="w-10 h-10 stroke-1 text-slate-600 mb-2" />
            <p className="text-xs">No generated audio takes yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Synthesize a TTS prompt to save takes here automatically.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition space-y-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-200 truncate">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>
                      {item.mode === "dialogue" ? "Dual Speaker" : item.voiceName}
                    </span>
                    <span>•</span>
                    <span>{formatTime(item.duration || 0)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPlayItem(item)}
                    className="p-1.5 bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white rounded-lg transition cursor-pointer"
                    title="Play Take"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => {
                      if (!item.blobUrl) return;
                      const a = document.createElement("a");
                      a.href = item.blobUrl;
                      a.download = `${item.title.toLowerCase().replace(/\s+/g, "-")}.wav`;
                      a.click();
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                    title="Download WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                    title="Delete Take"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed">
                "{item.text}"
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button
                  onClick={() => onLoadItem(item)}
                  className="flex items-center gap-1 text-violet-400 hover:text-violet-300 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Load prompt</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

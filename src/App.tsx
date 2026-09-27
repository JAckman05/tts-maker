import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Sparkles,
  Users,
  Wand2,
  History,
  Radio,
  Sliders,
  Code2,
  ChevronDown,
  Play,
  RotateCcw,
  Volume2,
  FileText,
  AlertCircle,
  HelpCircle,
  AudioWaveform,
} from "lucide-react";
import { VoiceSelector } from "./components/VoiceSelector";
import { PromptTagsBar } from "./components/PromptTagsBar";
import { DialogueEditor } from "./components/DialogueEditor";
import { AudioPlayer } from "./components/AudioPlayer";
import { EnhancePromptModal } from "./components/EnhancePromptModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { TTS_PRESETS } from "./data/presets";
import {
  GeneratedAudioItem,
  SpeakerConfig,
  DialogueLine,
  TTSMode,
  VoiceName,
} from "./types/tts";
import { base64ToWavBlob, extractWaveformPeaks } from "./utils/audio";

const STORAGE_KEY = "voxprompt_tts_history_v1";

export default function App() {
  // Mode: Single speaker vs Multi-speaker Screenplay
  const [mode, setMode] = useState<TTSMode>("single");

  // Single speaker state
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>("Charon");
  const [promptText, setPromptText] = useState<string>(
    "Before the stars went quiet, <breath> they whispered a final coordinates sequence across the void. If you are hearing this broadcast, <gasp> the perimeter has already fallen. Tread lightly into the dark."
  );
  const [styleDirection, setStyleDirection] = useState<string>(
    "Deep, resonant, suspenseful cinematic movie trailer voice, speaking with gravitas and slow theatrical timing."
  );

  // Multi speaker state
  const [dialogueSpeakers, setDialogueSpeakers] = useState<[SpeakerConfig, SpeakerConfig]>([
    { speaker: "Alex", voiceName: "Puck", style: "Enthusiastic, energetic podcast host" },
    { speaker: "Sam", voiceName: "Kore", style: "Curious, thoughtful tech co-host" },
  ]);
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: "l1",
      speaker: "Alex",
      text: "Welcome back everyone! <breath> Today we are diving headfirst into real-time audio and voice design.",
      style: "Bright, punchy, welcoming",
    },
    {
      id: "l2",
      speaker: "Sam",
      text: "Oh man, |yeah| it has honestly been one of the wilder weeks in AI history. <laugh> I still cannot believe how expressive these models sound now.",
      style: "Impressed, conversational, warm",
    },
    {
      id: "l3",
      speaker: "Alex",
      text: "Right? |mhm| Just listen to the cadence and breathing pauses. It feels like we're in the exact same studio together.",
      style: "Engaged, agreeing enthusiastically",
    },
    {
      id: "l4",
      speaker: "Sam",
      text: "Totally. <breath> Let's break down how creators can actually prompt this fidelity themselves.",
      style: "Smooth transition, curious",
    },
  ]);

  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudioItem | null>(null);
  const [history, setHistory] = useState<GeneratedAudioItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isEnhanceOpen, setIsEnhanceOpen] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("cinematic-trailer");

  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Re-create Blob URLs for saved base64 audio
          const hydrated = parsed.map((item: GeneratedAudioItem) => {
            if (item.audioBase64) {
              const blob = base64ToWavBlob(item.audioBase64, item.sampleRate || 24000);
              return { ...item, blobUrl: URL.createObjectURL(blob) };
            }
            return item;
          });
          setHistory(hydrated);
        }
      }
    } catch (e) {
      console.warn("Failed to load history:", e);
    }
  }, []);

  // Save history to localStorage (strip temporary blobUrl)
  const saveHistory = (items: GeneratedAudioItem[]) => {
    try {
      const serializable = items.slice(0, 20).map(({ blobUrl, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn("Failed to save history:", e);
    }
  };

  // Insert tag at cursor position in single mode textarea
  const handleInsertTagAtCursor = (tag: string) => {
    const el = promptTextareaRef.current;
    if (!el) {
      setPromptText((prev) => `${prev} ${tag} `);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const spaceBefore = before.length > 0 && !before.endsWith(" ") ? " " : "";
    const spaceAfter = after.length > 0 && !after.startsWith(" ") ? " " : "";

    const insertion = `${spaceBefore}${tag}${spaceAfter}`;
    const newText = before + insertion + after;
    setPromptText(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 10);
  };

  // Load preset
  const handleApplyPreset = (presetId: string) => {
    const preset = TTS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(preset.id);
    setMode(preset.mode);

    if (preset.mode === "single") {
      if (preset.voiceName) setSelectedVoice(preset.voiceName);
      if (preset.text) setPromptText(preset.text);
      if (preset.style) setStyleDirection(preset.style);
    } else {
      if (preset.dialogueSpeakers) setDialogueSpeakers(preset.dialogueSpeakers);
      if (preset.dialogueParts) {
        setDialogueLines(
          preset.dialogueParts.map((p, idx) => ({
            ...p,
            id: `line-${Date.now()}-${idx}`,
          }))
        );
      }
    }
  };

  // Synthesize Speech via Backend API
  const handleGenerateTTS = async () => {
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      let payload: Record<string, unknown>;

      if (mode === "single") {
        if (!promptText.trim()) {
          throw new Error("Please enter script text to synthesize.");
        }
        payload = {
          mode: "single",
          text: promptText.trim(),
          style: styleDirection.trim() || undefined,
          voiceName: selectedVoice,
        };
      } else {
        if (dialogueLines.some((l) => !l.text.trim())) {
          throw new Error("Please ensure all dialogue lines have text.");
        }
        payload = {
          mode: "dialogue",
          dialogueSpeakers,
          dialogueParts: dialogueLines.map((l) => ({
            speaker: l.speaker,
            text: l.text.trim(),
            style: l.style?.trim() || undefined,
          })),
        };
      }

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Synthesis failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.audio) {
        throw new Error("No audio returned from Gemini 3.8 Flash TTS.");
      }

      const sampleRate = data.sampleRate || 24000;
      const wavBlob = base64ToWavBlob(data.audio, sampleRate);
      const blobUrl = URL.createObjectURL(wavBlob);
      const peaks = extractWaveformPeaks(data.audio, 64);

      // Estimate duration from PCM byte count: (byteLen / (sampleRate * 2 bytesPerSample))
      const binaryLength = atob(data.audio).length;
      const approxDuration = binaryLength / (sampleRate * 2);

      const newItem: GeneratedAudioItem = {
        id: "take-" + Date.now(),
        timestamp: Date.now(),
        mode,
        title:
          mode === "single"
            ? `${selectedVoice} Take (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
            : `Dialogue Take (${dialogueSpeakers[0].speaker} & ${dialogueSpeakers[1].speaker})`,
        text:
          mode === "single"
            ? promptText.trim()
            : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(" | "),
        style: mode === "single" ? styleDirection.trim() : undefined,
        voiceName: mode === "single" ? selectedVoice : undefined,
        dialogueSpeakers: mode === "dialogue" ? dialogueSpeakers : undefined,
        dialogueParts: mode === "dialogue" ? dialogueLines : undefined,
        audioBase64: data.audio,
        mimeType: data.mimeType || "audio/wav",
        sampleRate,
        duration: approxDuration,
        peaks,
        blobUrl,
      };

      setCurrentAudio(newItem);
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      saveHistory(updatedHistory);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "TTS generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcut Cmd+Enter / Ctrl+Enter to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isGenerating) {
          handleGenerateTTS();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isGenerating,
    mode,
    promptText,
    styleDirection,
    selectedVoice,
    dialogueSpeakers,
    dialogueLines,
  ]);

  // Load history item into workspace
  const handleLoadHistoryItem = (item: GeneratedAudioItem) => {
    setMode(item.mode);
    if (item.mode === "single") {
      if (item.text) setPromptText(item.text);
      if (item.style) setStyleDirection(item.style);
      if (item.voiceName) setSelectedVoice(item.voiceName);
    } else {
      if (item.dialogueSpeakers && item.dialogueSpeakers.length === 2) {
        setDialogueSpeakers(item.dialogueSpeakers as [SpeakerConfig, SpeakerConfig]);
      }
      if (item.dialogueParts) {
        setDialogueLines(item.dialogueParts);
      }
    }
    setCurrentAudio(item);
    setIsHistoryOpen(false);
  };

  // Style ideas quick chips
  const STYLE_IDEAS = [
    "Whispering mysteriously with slow cadence",
    "Excited sports commentator at high speed",
    "Calm meditation guide with soothing warmth",
    "Dramatic movie trailer narrator with deep gravitas",
    "Curious tech reviewer marvelling at innovation",
    "Warm, tender bedtime story reader",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-600/40">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <AudioWaveform className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">
                  VoxPrompt Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  gemini-3.8-flash-tts
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Professional Voice Direction & Screenplay Synthesis Workbench
              </p>
            </div>
          </div>

          {/* Mode Switcher & History Button */}
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  mode === "single"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Single Voice</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("dialogue")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  mode === "dialogue"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Dual Screenplay</span>
              </button>
            </div>

            {/* History Toggle */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Takes</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-mono">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompting Station (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Preset Selector Banner */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Prompt Template:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
              <select
                value={selectedPresetId}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {TTS_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.title} ({p.mode === "dialogue" ? "Dual Dialogue" : "Single"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode View: Single Voice Mode */}
          {mode === "single" && (
            <div className="space-y-5">
              {/* Voice Persona Selection */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                  label="1. Select Voice Persona"
                />
              </div>

              {/* Directorial Style Directive */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-violet-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      2. Speech Style & Emotional Prosody Direction
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    speechMetadata.style
                  </span>
                </div>

                <input
                  type="text"
                  value={styleDirection}
                  onChange={(e) => setStyleDirection(e.target.value)}
                  placeholder="e.g. Deep, resonant cinematic trailer voice with slow, suspenseful pauses..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />

                {/* Quick style suggestion pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">
                    Ideas:
                  </span>
                  {STYLE_IDEAS.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setStyleDirection(idea)}
                      className="text-[10px] px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer truncate max-w-[220px]"
                      title={idea}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Script & Prompt Editor */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      3. Speech Script & Vocal Burst Markers
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* AI Prompt Director Button */}
                    <button
                      type="button"
                      onClick={() => setIsEnhanceOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/50 hover:to-indigo-600/50 border border-violet-500/40 text-violet-300 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3 text-violet-400" />
                      <span>AI Prompt Director</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {promptText.length} chars
                    </span>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={promptTextareaRef}
                  rows={5}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter the text to be spoken. You can insert natural vocal bursts like <breath>, <laugh>, <gasp>, <sigh> or dialogue backchannels..."
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-y font-sans leading-relaxed"
                />

                {/* Tags insertion bar */}
                <PromptTagsBar
                  onInsertTag={handleInsertTagAtCursor}
                  mode="single"
                />
              </div>
            </div>
          )}

          {/* Mode View: Dual Screenplay Mode */}
          {mode === "dialogue" && (
            <div className="space-y-4">
              <DialogueEditor
                speakers={dialogueSpeakers}
                onChangeSpeakers={setDialogueSpeakers}
                lines={dialogueLines}
                onChangeLines={setDialogueLines}
              />
            </div>
          )}

          {/* Action Bar: Synthesize Button */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Model Ready:</span>
              <code className="text-violet-300 font-mono font-medium">gemini-3.8-flash-tts</code>
              <span className="hidden sm:inline text-slate-500">
                (Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl</kbd> +{" "}
                <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">Enter</kbd> to run)
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateTTS}
              disabled={isGenerating}
              className="py-3 px-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Synthesize Speech</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Synthesis Notice</div>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Audio Playback & Tech Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Audio Player Card */}
          {currentAudio ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AudioWaveform className="w-3.5 h-3.5 text-violet-400" />
                  Broadcast Output
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">Ready to play</span>
              </div>
              <AudioPlayer item={currentAudio} autoPlay={true} />
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <Mic className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300">Studio Audio Deck</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Configure your voice prompt on the left and click "Synthesize Speech" to generate 24kHz audio with live waveform playback.
                </p>
              </div>
            </div>
          )}

          {/* Developer API Payload Inspector */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-violet-400" />
                <span>Gemini TTS Request Inspector</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showInspector ? "rotate-180" : ""}`}
              />
            </button>

            {showInspector && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Exact parameters sent to <code className="text-violet-300">ai.models.generateContent</code> with Gemini 3.8 Flash TTS:
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-850 max-h-60 leading-relaxed">
                  {JSON.stringify(
                    mode === "single"
                      ? {
                          model: "gemini-3.8-flash-tts",
                          contents: [
                            {
                              role: "user",
                              parts: [
                                {
                                  text: promptText.trim(),
                                  speechMetadata: styleDirection ? { style: styleDirection } : undefined,
                                },
                              ],
                            },
                          ],
                          config: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                              voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: selectedVoice },
                              },
                            },
                          },
                        }
                      : {
                          model: "gemini-3.8-flash-tts",
                          contents: [
                            {
                              role: "user",
                              parts: dialogueLines.map((l) => ({
                                text: `${l.speaker}: ${l.text}`,
                                speechMetadata: {
                                  speaker: l.speaker,
                                  ...(l.style ? { style: l.style } : {}),
                                },
                              })),
                            },
                          ],
                          config: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                              multiSpeakerVoiceConfig: {
                                speakerVoiceConfigs: [
                                  {
                                    speaker: dialogueSpeakers[0].speaker,
                                    voiceConfig: {
                                      prebuiltVoiceConfig: { voiceName: dialogueSpeakers[0].voiceName },
                                    },
                                  },
                                  {
                                    speaker: dialogueSpeakers[1].speaker,
                                    voiceConfig: {
                                      prebuiltVoiceConfig: { voiceName: dialogueSpeakers[1].voiceName },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>

          {/* Quick Guide to TTS Prompting */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-400">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
              TTS Prompting Best Practices
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong className="text-slate-300">Vocal Bursts:</strong> Use <code className="text-sky-300">&lt;breath&gt;</code> before dramatic phrases and <code className="text-amber-300">&lt;laugh&gt;</code> for genuine humor.
              </li>
              <li>
                <strong className="text-slate-300">Backchanneling:</strong> In dialogues, insert <code className="text-emerald-300">|yeah|</code> or <code className="text-teal-300">|mhm|</code> to keep the conversation feeling spontaneous.
              </li>
              <li>
                <strong className="text-slate-300">Style Directives:</strong> Describe tone, cadence, distance from microphone, and mood in detail.
              </li>
              <li>
                <strong className="text-slate-300">Broadcast PCM:</strong> Gemini TTS returns uncompressed 24 kHz audio, seamlessly packaged into standard WAV for download.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* AI Director Modal */}
      <EnhancePromptModal
        isOpen={isEnhanceOpen}
        onClose={() => setIsEnhanceOpen(false)}
        currentText={promptText}
        currentStyle={styleDirection}
        onApply={(enhancedText, suggestedStyle) => {
          setPromptText(enhancedText);
          setStyleDirection(suggestedStyle);
        }}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onPlayItem={(item) => setCurrentAudio(item)}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={(id) => {
          const updated = history.filter((h) => h.id !== id);
          setHistory(updated);
          saveHistory(updated);
          if (currentAudio?.id === id) {
            setCurrentAudio(updated[0] || null);
          }
        }}
        onClearHistory={() => {
          setHistory([]);
          saveHistory([]);
          setCurrentAudio(null);
        }}
      />
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Radio,
  FileAudio,
} from "lucide-react";
import { formatTime } from "../utils/audio";
import { GeneratedAudioItem } from "../types/tts";

interface AudioPlayerProps {
  item: GeneratedAudioItem;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ item, autoPlay = true }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(item.duration || 0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Setup audio element from blobUrl
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("Auto-play blocked by browser:", err);
      });
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [item.blobUrl, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const handleSeek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const target = ratio * duration;
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleDownload = () => {
    if (!item.blobUrl) return;
    const a = document.createElement("a");
    a.href = item.blobUrl;
    const sanitizedTitle = (item.title || "gemini-tts-speech")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    a.download = `${sanitizedTitle}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const peaks = item.peaks || Array(60).fill(0.3);
  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const currentActiveBarIndex = Math.floor(progressRatio * peaks.length);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-white">
      {item.blobUrl && (
        <audio
          ref={audioRef}
          src={item.blobUrl}
          loop={isLooping}
          preload="metadata"
        />
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base leading-tight">
              {item.title || "Synthesized Audio"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-violet-300 font-mono text-[11px] border border-slate-700">
                gemini-3.8-flash-tts
              </span>
              <span>•</span>
              <span>{item.mode === "dialogue" ? "Dual Speaker" : `Voice: ${item.voiceName || "Kore"}`}</span>
              <span>•</span>
              <span>24 kHz PCM (WAV)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95"
            title="Download Broadcast WAV"
          >
            <Download className="w-3.5 h-3.5 text-violet-400" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform Visualization Bars */}
      <div
        className="relative h-20 bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-2 flex items-center gap-[3px] justify-between cursor-pointer group select-none overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          handleSeek(ratio);
        }}
      >
        {/* Glow progress overlay */}
        <div
          className="absolute inset-y-0 left-0 bg-violet-500/10 pointer-events-none transition-all duration-75"
          style={{ width: `${progressRatio * 100}%` }}
        />

        {/* Needle scrubber */}
        <div
          className="absolute inset-y-0 w-0.5 bg-violet-400 shadow-[0_0_10px_#a78bfa] pointer-events-none transition-all duration-75"
          style={{ left: `${progressRatio * 100}%` }}
        />

        {peaks.map((peak, idx) => {
          const isPassed = idx <= currentActiveBarIndex;
          const barHeight = Math.max(12, Math.round(peak * 68));
          return (
            <div
              key={idx}
              className={`flex-1 rounded-full transition-all duration-100 ${
                isPassed
                  ? "bg-gradient-to-t from-violet-500 to-indigo-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                  : "bg-slate-700/60 group-hover:bg-slate-600/70"
              }`}
              style={{
                height: `${barHeight}px`,
                transform: isPlaying && isPassed ? "scaleY(1.05)" : "scaleY(1)",
              }}
            />
          );
        })}
      </div>

      {/* Scrub bar & Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Play/Pause & Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition transform active:scale-95 cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wider text-slate-200">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {isPlaying ? "Streaming playback..." : "Paused"}
            </span>
          </div>
        </div>

        {/* Secondary controls: Speed, Loop, Volume */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-xs font-mono text-violet-300 border border-slate-700 transition cursor-pointer"
            title="Playback Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-violet-400" />
            <span>{playbackRate}x</span>
          </button>

          {/* Loop Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
              isLooping
                ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title={isLooping ? "Looping enabled" : "Loop audio"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Mute/Volume Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1">
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (audioRef.current) {
                  audioRef.current.volume = nextMuted ? 0 : volume;
                }
              }}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(val === 0);
                if (audioRef.current) {
                  audioRef.current.volume = val;
                }
              }}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Style & Text preview accordion */}
      {(item.style || item.text) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs">
          {item.style && (
            <div className="flex items-start gap-2 mb-1.5">
              <span className="text-violet-400 font-medium shrink-0">Style Direction:</span>
              <span className="text-slate-300 italic">{item.style}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-slate-400 line-clamp-2">
            <FileAudio className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <span className="truncate">{item.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

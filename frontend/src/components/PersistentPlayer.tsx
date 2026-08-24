import { useState } from "react";
import { useMusic } from "../context/MusicContext";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { formatTime } from "../lib/utils";

export function PersistentPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    queue,
    isShuffle,
    isRepeat,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVol,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleFavoriteSong,
    playSong,
  } = useMusic();

  const [showQueue, setShowQueue] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentSong) return null;

  function fmtSecs(sec: number) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Floating Bottom Bar Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-2xl shadow-2xl transition-all duration-300">
        {/* Progress Bar (Clickable) */}
        <div
          className="absolute -top-1 left-0 right-0 h-1.5 cursor-pointer bg-slate-200/60 hover:h-2.5 transition-all group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seek(pos * duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 relative group-hover:bg-blue-500"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Song Info */}
          <div className="flex items-center gap-3 min-w-0 max-w-[280px] sm:max-w-xs">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-900 shadow-md">
              <img
                src={currentSong.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80"}
                alt={currentSong.title}
                className={`h-full w-full object-cover transition-transform duration-700 ${
                  isPlaying ? "scale-105" : "scale-100"
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0ms] h-full" />
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
                    <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs sm:text-sm font-bold text-slate-900">
                {currentSong.title}
              </p>
              <p className="truncate text-[11px] text-slate-500 font-medium">
                {currentSong.artist} · <span className="capitalize text-blue-600">{currentSong.category}</span>
              </p>
            </div>

            <button
              onClick={() => toggleFavoriteSong(currentSong)}
              className={`p-1.5 rounded-lg transition-colors ${
                currentSong.isFavorite
                  ? "text-rose-500 hover:text-rose-600 bg-rose-50"
                  : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"
              }`}
              title="Add to Favorites"
            >
              <Heart className={`w-4 h-4 ${currentSong.isFavorite ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Center: Main Controls & Time */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleShuffle}
                className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors ${
                  isShuffle ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={playPrev}
                className="p-1.5 text-slate-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-100"
                title="Previous"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={playNext}
                className="p-1.5 text-slate-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-100"
                title="Next"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors ${
                  isRepeat ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Repeat"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>{fmtSecs(currentTime)}</span>
              <span>/</span>
              <span>{fmtSecs(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Queue */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleMute} className="text-slate-500 hover:text-slate-800">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVol(parseFloat(e.target.value))}
                className="w-20 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                showQueue
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Playback Queue"
            >
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">வரிசை ({queue.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Queue Drawer Modal */}
      {showQueue && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl animate-fade-in max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-sm text-slate-900">பாடல் வரிசை (Queue)</h4>
              <span className="badge bg-blue-100 text-blue-800 text-[10px]">{queue.length}</span>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto space-y-1.5 py-2 flex-1 mt-2">
            {queue.map((song, idx) => {
              const isCurrent = currentSong.id === song.id;
              return (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => playSong(song)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-blue-50/80 border border-blue-200 text-blue-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700 text-xs"
                  }`}
                >
                  <span className="text-xs font-mono text-slate-400 w-4">{idx + 1}</span>
                  <img src={song.coverUrl} alt={song.title} className="w-9 h-9 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{song.title}</p>
                    <p className="truncate text-[10px] text-slate-400">{song.artist}</p>
                  </div>
                  {isCurrent && isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

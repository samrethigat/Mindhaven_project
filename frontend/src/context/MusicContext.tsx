import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  audioUrl: string;
  duration?: string;
  coverUrl?: string;
  isFavorite?: boolean;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  queue: Song[];
  isShuffle: boolean;
  isRepeat: boolean;
  isMiniPlayer: boolean;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (time: number) => void;
  setVol: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  toggleFavoriteSong: (song: Song) => Promise<boolean>;
  setIsMiniPlayer: (mini: boolean) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration || 0);
    });

    audio.addEventListener("ended", () => {
      handleSongEnded();
    });

    audio.addEventListener("error", () => {
      console.warn("Audio playback error on URL:", audio.src);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  function handleSongEnded() {
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    playNext();
  }

  function playSong(song: Song, newQueue?: Song[]) {
    if (!song) return;
    setCurrentSong(song);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some((s) => s.id === song.id)) {
      setQueue((prev) => [...prev, song]);
    }

    // Save immediately to local history storage
    try {
      const raw = localStorage.getItem("mindhaven_music_history");
      const list = raw ? JSON.parse(raw) : [];
      const historyItem = {
        _id: `local_m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        mediaType: "music",
        mediaId: song.id || song.title,
        title: song.title,
        artist: song.artist || "Artist",
        data: song,
        playedAt: new Date().toISOString(),
      };
      const filtered = list.filter((item: any) => item.title !== song.title || item.artist !== song.artist);
      const updated = [historyItem, ...filtered].slice(0, 60);
      localStorage.setItem("mindhaven_music_history", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("mindhaven_history_updated", { detail: { type: "music", item: historyItem } }));
    } catch {
      // Ignore storage errors
    }

    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          // Record play history in backend
          api.post("/music/history", { track: song, song }).catch(() => {});
        })
        .catch((err) => {
          console.warn("Autoplay was blocked or failed:", err.message);
          setIsPlaying(false);
        });
    }
  }

  function togglePlay() {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function pause() {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  function resume() {
    if (audioRef.current && currentSong) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function playNext() {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    let nextIndex = currentIndex + 1;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = 0;
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      playSong(nextSong);
    }
  }

  function playPrev() {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    const prevSong = queue[prevIndex];
    if (prevSong) {
      playSong(prevSong);
    }
  }

  function seek(time: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }

  function setVol(val: number) {
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0 && isMuted) setIsMuted(false);
    }
  }

  function toggleMute() {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }

  function toggleShuffle() {
    setIsShuffle(!isShuffle);
    toast.success(!isShuffle ? "கலக்கு இயக்கம் (Shuffle ON)" : "வரிசை இயக்கம் (Shuffle OFF)");
  }

  function toggleRepeat() {
    setIsRepeat(!isRepeat);
    toast.success(!isRepeat ? "மீண்டும் மீண்டும் (Repeat ON)" : "தொடர் இயக்கம் (Repeat OFF)");
  }

  function addToQueue(song: Song) {
    if (!queue.some((s) => s.id === song.id)) {
      setQueue((prev) => [...prev, song]);
      toast.success(`"${song.title}" வரிசையில் சேர்க்கப்பட்டது! 🎵`);
    } else {
      toast("ஏற்கனவே வரிசையில் உள்ளது 🎶");
    }
  }

  async function toggleFavoriteSong(song: Song): Promise<boolean> {
    try {
      const res = await api.post("/music/favorites", { track: song });
      const fav = !!res.data.isFavorite;
      if (currentSong && currentSong.id === song.id) {
        setCurrentSong({ ...currentSong, isFavorite: fav });
      }
      toast.success(fav ? "பிடித்த பாடல்களில் சேர்க்கப்பட்டது! ❤️" : "நீக்கப்பட்டது");
      return fav;
    } catch {
      toast.error("விருப்பத்தை மாற்றுவதில் பிழை ஏற்பட்டது.");
      return false;
    }
  }

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        isMuted,
        currentTime,
        duration,
        queue,
        isShuffle,
        isRepeat,
        isMiniPlayer,
        playSong,
        togglePlay,
        pause,
        resume,
        playNext,
        playPrev,
        seek,
        setVol,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        toggleFavoriteSong,
        setIsMiniPlayer,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}

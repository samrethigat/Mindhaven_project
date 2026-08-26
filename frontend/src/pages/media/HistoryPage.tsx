import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMusic } from "../../context/MusicContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Clock,
  Music,
  Film,
  Play,
  Trash2,
  Search,
  ExternalLink,
  X,
  RotateCcw,
  Sparkles,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import toast from "react-hot-toast";

interface HistoryItem {
  _id: string;
  mediaType: "music" | "video";
  mediaId: string;
  title: string;
  artist?: string;
  data: any;
  playedAt: string;
}

export function HistoryPage() {
  const { language, t } = useLanguage();
  const { isDark } = useTheme();
  usePageTitle(t("history_title"));

  const { playSong } = useMusic();
  const [activeTab, setActiveTab] = useState<"music" | "video">("music");
  const [musicHistory, setMusicHistory] = useState<HistoryItem[]>([]);
  const [videoHistory, setVideoHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Read local history cache
      let localMusic: HistoryItem[] = [];
      let localVideo: HistoryItem[] = [];
      try {
        const rawM = localStorage.getItem("mindhaven_music_history");
        if (rawM) localMusic = JSON.parse(rawM);
        const rawV = localStorage.getItem("mindhaven_video_history");
        if (rawV) localVideo = JSON.parse(rawV);
      } catch {}

      // 2. Fetch backend history
      const [mRes, vRes] = await Promise.all([
        api.get("/music/history").catch(() => ({ data: { history: [] } })),
        api.get("/video/history").catch(() => ({ data: { history: [] } })),
      ]);

      const backendMusic: HistoryItem[] = mRes.data?.history || [];
      const backendVideo: HistoryItem[] = vRes.data?.history || [];

      // 3. Merge & Deduplicate Music
      const mergedMusicMap = new Map<string, HistoryItem>();
      [...localMusic, ...backendMusic].forEach((item) => {
        const key = item.title?.toLowerCase().trim() || item._id;
        if (!mergedMusicMap.has(key)) {
          mergedMusicMap.set(key, item);
        }
      });
      const finalMusic = Array.from(mergedMusicMap.values()).sort(
        (a, b) => new Date(b.playedAt || 0).getTime() - new Date(a.playedAt || 0).getTime()
      );

      // 4. Merge & Deduplicate Videos
      const mergedVideoMap = new Map<string, HistoryItem>();
      [...localVideo, ...backendVideo].forEach((item) => {
        const key = item.title?.toLowerCase().trim() || item._id;
        if (!mergedVideoMap.has(key)) {
          mergedVideoMap.set(key, item);
        }
      });
      const finalVideo = Array.from(mergedVideoMap.values()).sort(
        (a, b) => new Date(b.playedAt || 0).getTime() - new Date(a.playedAt || 0).getTime()
      );

      setMusicHistory(finalMusic);
      setVideoHistory(finalVideo);
      localStorage.setItem("mindhaven_music_history", JSON.stringify(finalMusic));
      localStorage.setItem("mindhaven_video_history", JSON.stringify(finalVideo));
    } catch {
      // Graceful offline fallback to localStorage
      try {
        const rawM = localStorage.getItem("mindhaven_music_history");
        if (rawM) setMusicHistory(JSON.parse(rawM));
        const rawV = localStorage.getItem("mindhaven_video_history");
        if (rawV) setVideoHistory(JSON.parse(rawV));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();

    const onHistoryUpdated = () => {
      try {
        const rawM = localStorage.getItem("mindhaven_music_history");
        if (rawM) setMusicHistory(JSON.parse(rawM));
        const rawV = localStorage.getItem("mindhaven_video_history");
        if (rawV) setVideoHistory(JSON.parse(rawV));
      } catch {}
    };

    window.addEventListener("mindhaven_history_updated", onHistoryUpdated);
    window.addEventListener("storage", onHistoryUpdated);

    return () => {
      window.removeEventListener("mindhaven_history_updated", onHistoryUpdated);
      window.removeEventListener("storage", onHistoryUpdated);
    };
  }, [loadHistory]);

  async function handleDeleteItem(item: HistoryItem, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const endpoint = item.mediaType === "music" ? `/music/history/${item._id}` : `/video/history/${item._id}`;
      await api.delete(endpoint).catch(() => {});
      
      if (item.mediaType === "music") {
        const next = musicHistory.filter((h) => h._id !== item._id);
        setMusicHistory(next);
        localStorage.setItem("mindhaven_music_history", JSON.stringify(next));
      } else {
        const next = videoHistory.filter((h) => h._id !== item._id);
        setVideoHistory(next);
        localStorage.setItem("mindhaven_video_history", JSON.stringify(next));
      }
      toast.success(t("history_item_deleted"));
    } catch {
      if (item.mediaType === "music") {
        const next = musicHistory.filter((h) => h._id !== item._id);
        setMusicHistory(next);
        localStorage.setItem("mindhaven_music_history", JSON.stringify(next));
      } else {
        const next = videoHistory.filter((h) => h._id !== item._id);
        setVideoHistory(next);
        localStorage.setItem("mindhaven_video_history", JSON.stringify(next));
      }
      toast.success(t("history_item_deleted"));
    }
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      const endpoint = activeTab === "music" ? "/music/history" : "/video/history";
      await api.delete(endpoint).catch(() => {});

      if (activeTab === "music") {
        setMusicHistory([]);
        localStorage.removeItem("mindhaven_music_history");
      } else {
        setVideoHistory([]);
        localStorage.removeItem("mindhaven_video_history");
      }
      setShowClearConfirm(false);
      toast.success(activeTab === "music" ? t("history_cleared_music") : t("history_cleared_video"));
    } catch {
      if (activeTab === "music") {
        setMusicHistory([]);
        localStorage.removeItem("mindhaven_music_history");
      } else {
        setVideoHistory([]);
        localStorage.removeItem("mindhaven_video_history");
      }
      setShowClearConfirm(false);
      toast.success(activeTab === "music" ? t("history_cleared_music") : t("history_cleared_video"));
    } finally {
      setClearing(false);
    }
  }

  function formatRelativeTime(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return language === "ta" ? "சற்று முன்" : "Just now";
    if (diffSecs < 3600) {
      const mins = Math.max(1, Math.floor(diffSecs / 60));
      return language === "ta" ? `${mins} நிமிடங்களுக்கு முன்` : `${mins}m ago`;
    }
    if (diffSecs < 86400) {
      const hours = Math.floor(diffSecs / 3600);
      return language === "ta" ? `${hours} மணி நேரத்திற்கு முன்` : `${hours}h ago`;
    }
    if (diffSecs < 172800) {
      return language === "ta" ? "நேற்று" : "Yesterday";
    }
    return formatDate(dateStr);
  }

  // Filtered lists
  const filteredMusic = useMemo(() => {
    if (!searchQuery.trim()) return musicHistory;
    const q = searchQuery.toLowerCase();
    return musicHistory.filter(
      (h) =>
        h.title?.toLowerCase().includes(q) ||
        h.artist?.toLowerCase().includes(q) ||
        h.data?.artist?.toLowerCase().includes(q) ||
        h.data?.category?.toLowerCase().includes(q)
    );
  }, [musicHistory, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videoHistory;
    const q = searchQuery.toLowerCase();
    return videoHistory.filter(
      (h) =>
        h.title?.toLowerCase().includes(q) ||
        h.artist?.toLowerCase().includes(q) ||
        h.data?.speaker?.toLowerCase().includes(q) ||
        h.data?.category?.toLowerCase().includes(q)
    );
  }, [videoHistory, searchQuery]);

  const activeCount = activeTab === "music" ? musicHistory.length : videoHistory.length;

  return (
    <div className="space-y-6 pb-28 max-w-5xl mx-auto animate-fade-in">
      {/* Top Header Card */}
      <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("history_badge")}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>🕘 {t("history_title")}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t("history_sub")}
            </p>
          </div>

          {/* Refresh & Clear Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
              title={t("history_refresh")}
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">{t("history_refresh")}</span>
            </button>

            {activeCount > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("history_clear")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("music");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "music"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Music className="w-4 h-4" />
            <span>
              {t("history_music_tab")} ({musicHistory.length})
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("video");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "video"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/25 scale-[1.02]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>
              {t("history_video_tab")} ({videoHistory.length})
            </span>
          </button>
        </div>

        {/* Search within history */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "music"
                ? t("history_search_music_placeholder")
                : t("history_search_video_placeholder")
            }
            className="input pl-9 pr-8 py-1.5 text-xs w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/50 dark:border-slate-800"
            />
          ))}
        </div>
      )}

      {/* 🎵 1. MUSIC HISTORY TAB */}
      {!loading && activeTab === "music" && (
        <div className="space-y-3">
          {filteredMusic.length === 0 ? (
            <div className="card p-12 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t("history_empty_music")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t("history_empty_music_sub")}
              </p>
              <Link
                to="/candidate/music"
                className="btn-primary text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("history_open_music_hub")}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMusic.map((h) => {
                const trackData = h.data || {
                  id: h.mediaId,
                  title: h.title,
                  artist: h.artist || "Artist",
                  category: "hits",
                };
                const cover =
                  trackData.coverUrl ||
                  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80";

                return (
                  <div
                    key={h._id}
                    className="card p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sm:gap-4 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-sm">
                        <img src={cover} alt={h.title} className="w-full h-full object-cover" />
                        <button
                          onClick={() => playSong(trackData)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {h.title || "Untitled Track"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {h.artist || trackData.artist || "Unknown Artist"}
                          </p>
                          {trackData.category && (
                            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] py-0 px-1.5 font-bold uppercase hidden sm:inline">
                              {trackData.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      <span
                        className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 text-right"
                        title={h.playedAt ? new Date(h.playedAt).toLocaleString() : ""}
                      >
                        {formatRelativeTime(h.playedAt)}
                      </span>

                      {/* Play Action */}
                      <button
                        onClick={() => playSong(trackData)}
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors shadow-sm"
                        title={t("music_play_now")}
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      {/* Delete from history action */}
                      <button
                        onClick={(e) => handleDeleteItem(h, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={t("history_item_deleted")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🎬 2. VIDEO HISTORY TAB */}
      {!loading && activeTab === "video" && (
        <div className="space-y-3">
          {filteredVideos.length === 0 ? (
            <div className="card p-12 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t("history_empty_video")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t("history_empty_video_sub")}
              </p>
              <Link
                to="/candidate/videos"
                className="btn-primary text-xs inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("history_open_video_hub")}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredVideos.map((h) => {
                const vidData = h.data || {
                  id: h.mediaId,
                  title: h.title,
                  speaker: h.artist || "Speaker",
                  embedUrl: `https://www.youtube.com/embed/${h.mediaId}`,
                };
                const thumbnail =
                  vidData.thumbnail ||
                  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80";

                return (
                  <div
                    key={h._id}
                    onClick={() => setActiveVideo(vidData)}
                    className="card p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sm:gap-4 hover:border-rose-400 dark:hover:border-rose-600 transition-all shadow-sm cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-16 sm:w-20 h-11 sm:h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-sm">
                        <img src={thumbnail} alt={h.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-rose-600/80 transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current text-white ml-0.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-rose-600 transition-colors">
                          {h.title || "Video Masterclass"}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {h.artist || vidData.speaker || "Educational Speaker"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      <span
                        className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 text-right"
                        title={h.playedAt ? new Date(h.playedAt).toLocaleString() : ""}
                      >
                        {formatRelativeTime(h.playedAt)}
                      </span>

                      {/* Watch Video Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideo(vidData);
                        }}
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-colors shadow-sm"
                        title="Watch Video"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Item Action */}
                      <button
                        onClick={(e) => handleDeleteItem(h, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={t("history_item_deleted")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🎬 Video Player Modal Lightbox */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 text-white">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="font-bold text-sm sm:text-base truncate">{activeVideo.title}</h3>
                <p className="text-xs text-slate-400 truncate">{activeVideo.speaker}</p>
              </div>

              <div className="flex items-center gap-2">
                {activeVideo.youtubeUrl && (
                  <a
                    href={activeVideo.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={() => setActiveVideo(null)}
                  className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Iframe Stream */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`${activeVideo.embedUrl || "https://www.youtube.com/embed/inpok4MKVLM"}?autoplay=1`}
                title={activeVideo.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {activeTab === "music" ? t("history_confirm_music_title") : t("history_confirm_video_title")}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("history_confirm_desc")}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-outline text-xs flex-1 py-2.5"
              >
                {t("common_cancel")}
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="btn-danger text-xs flex-1 py-2.5 shadow-md shadow-rose-500/20"
              >
                {clearing ? t("common_clearing") : t("common_confirm_clear")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

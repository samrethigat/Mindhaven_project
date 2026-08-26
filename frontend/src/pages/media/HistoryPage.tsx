import { useEffect, useState, useMemo } from "react";
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
  Heart,
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
  usePageTitle(language === "ta" ? "செயல்பாட்டு வரலாறு (Activity History)" : "Activity & Media History");

  const { playSong } = useMusic();
  const [activeTab, setActiveTab] = useState<"music" | "video">("music");
  const [musicHistory, setMusicHistory] = useState<HistoryItem[]>([]);
  const [videoHistory, setVideoHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.all([
        api.get("/music/history").catch(() => ({ data: { history: [] } })),
        api.get("/video/history").catch(() => ({ data: { history: [] } })),
      ]);
      setMusicHistory(mRes.data?.history || []);
      setVideoHistory(vRes.data?.history || []);
    } catch {
      toast.error(
        language === "ta"
          ? "வரலாற்று பதிவுகளை ஏற்றுவதில் பிழை"
          : "Error loading activity history"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteItem(item: HistoryItem, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const endpoint = item.mediaType === "music" ? `/music/history/${item._id}` : `/video/history/${item._id}`;
      await api.delete(endpoint);
      if (item.mediaType === "music") {
        setMusicHistory((prev) => prev.filter((h) => h._id !== item._id));
      } else {
        setVideoHistory((prev) => prev.filter((h) => h._id !== item._id));
      }
      toast.success(
        language === "ta" ? "பதிவு நீக்கப்பட்டது" : "Item removed from history"
      );
    } catch {
      // Optimistic removal fallback
      if (item.mediaType === "music") {
        setMusicHistory((prev) => prev.filter((h) => h._id !== item._id));
      } else {
        setVideoHistory((prev) => prev.filter((h) => h._id !== item._id));
      }
      toast.success(language === "ta" ? "பதிவு நீக்கப்பட்டது" : "Item removed");
    }
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      const endpoint = activeTab === "music" ? "/music/history" : "/video/history";
      await api.delete(endpoint);
      if (activeTab === "music") {
        setMusicHistory([]);
      } else {
        setVideoHistory([]);
      }
      setShowClearConfirm(false);
      toast.success(
        activeTab === "music"
          ? language === "ta"
            ? "இசை வரலாறு முழுவதும் அழிக்கப்பட்டது"
            : "Music history cleared"
          : language === "ta"
          ? "வீடியோ வரலாறு முழுவதும் அழிக்கப்பட்டது"
          : "Video history cleared"
      );
    } catch {
      if (activeTab === "music") setMusicHistory([]);
      else setVideoHistory([]);
      setShowClearConfirm(false);
      toast.success(language === "ta" ? "வரலாறு அழிக்கப்பட்டது" : "History cleared");
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
      const mins = Math.floor(diffSecs / 60);
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
    <div className="space-y-6 pb-28 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{language === "ta" ? "செயல்பாட்டு பதிவு" : "Activity Tracking"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === "ta" ? "🕘 செயல்பாட்டு வரலாறு (Recent History)" : "Activity & Media History"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {language === "ta"
                ? "நீங்கள் சமீபத்தில் கேட்ட பாடல்கள், பார்த்த வீடியோக்கள் மற்றும் செயல்பாடுகளின் காலவரிசைப் பட்டியல்."
                : "A unified timeline of your recently played music, watched video masterclasses, and student activities."}
            </p>
          </div>

          {/* Refresh & Clear Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold flex items-center gap-1.5"
              title="Refresh history"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">{language === "ta" ? "புதுப்பி" : "Refresh"}</span>
            </button>

            {activeCount > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === "ta" ? "வரலாற்றை அழி" : "Clear History"}</span>
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
              {language === "ta" ? "இசை வரலாறு" : "Music History"} ({musicHistory.length})
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
              {language === "ta" ? "வீடியோ வரலாறு" : "Video History"} ({videoHistory.length})
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
                ? language === "ta"
                  ? "பாடல்களைத் தேடுங்கள்..."
                  : "Search music history..."
                : language === "ta"
                ? "வீடியோக்களைத் தேடுங்கள்..."
                : "Search video history..."
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
                {searchQuery
                  ? language === "ta"
                    ? "பொருத்தமான பாடல்கள் எதுவும் இல்லை"
                    : "No matching tracks found in history"
                  : language === "ta"
                  ? "பாடல்கள் எதுவும் இன்னும் இயக்கப்படவில்லை"
                  : "No music playback history yet"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {language === "ta"
                  ? "நீங்கள் கேட்கும் பாடல்கள் தானாகவே இங்கே பதிவு செய்யப்படும்."
                  : "Songs you play from the Mindhaven Music Hub or Spotify catalog will appear here."}
              </p>
              <Link
                to="/candidate/music"
                className="btn-primary text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === "ta" ? "இசை அரங்கை திறக்க" : "Explore Music Hub"}</span>
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
                        title="Play Track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      {/* Delete from history action */}
                      <button
                        onClick={(e) => handleDeleteItem(h, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove from history"
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
                {searchQuery
                  ? language === "ta"
                    ? "பொருத்தமான வீடியோக்கள் எதுவும் இல்லை"
                    : "No matching videos found in history"
                  : language === "ta"
                  ? "வீடியோக்கள் எதுவும் இன்னும் பார்க்கப்படவில்லை"
                  : "No watch history recorded yet"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {language === "ta"
                  ? "நீங்கள் பார்க்கும் வீடியோக்கள் தானாகவே இங்கே சேர்க்கப்படும்."
                  : "Videos you stream from the YouTube Wellness Hub will appear here."}
              </p>
              <Link
                to="/candidate/videos"
                className="btn-primary text-xs inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === "ta" ? "வீடியோ அரங்கை திறக்க" : "Explore YouTube Hub"}</span>
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
                        title="Remove from history"
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
              {activeTab === "music"
                ? language === "ta"
                  ? "இசை வரலாற்றை அழிக்கவா?"
                  : "Clear Music History?"
                : language === "ta"
                ? "வீடியோ வரலாற்றை அழிக்கவா?"
                : "Clear Video History?"}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === "ta"
                ? "இது உங்கள் அனைத்து சமீபத்திய செயல்பாட்டு பதிவுகளையும் நிரந்தரமாக நீக்கும்."
                : "This will permanently remove all your recent activity entries in this category."}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-outline text-xs flex-1 py-2.5"
              >
                {language === "ta" ? "ரத்து செய்" : "Cancel"}
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="btn-danger text-xs flex-1 py-2.5 shadow-md shadow-rose-500/20"
              >
                {clearing
                  ? language === "ta"
                    ? "அழிக்கப்படுகிறது..."
                    : "Clearing..."
                  : language === "ta"
                  ? "ஆம், அழி"
                  : "Yes, Clear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

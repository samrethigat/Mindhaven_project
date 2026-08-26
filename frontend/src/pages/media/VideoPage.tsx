import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Film,
  Play,
  Heart,
  Search,
  Sparkles,
  X,
  Eye,
  Clock,
  Flame,
  Maximize2,
  Share2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface Video {
  id: string;
  videoId?: string;
  title: string;
  speaker: string;
  category: string;
  embedUrl: string;
  youtubeUrl?: string;
  thumbnail: string;
  duration: string;
  views?: string;
  tags?: string;
  isFavorite?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: string;
}

export function VideoPage() {
  const { language, t } = useLanguage();
  usePageTitle(language === "ta" ? "வீடியோ அரங்கம் (YouTube Hub)" : "YouTube Hub");

  const [videos, setVideos] = useState<Video[]>([]);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    setPage(1);
    loadVideos(1, false);
  }, [activeCategory, search, language]);

  useEffect(() => {
    api.get("/video/recommendations")
      .then((res) => setRecommendations(res.data.recommendations || []))
      .catch(() => {});
  }, []);

  async function loadVideos(pageNumber: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.get("/video/list", {
        params: {
          category: activeCategory,
          search,
          language,
          page: pageNumber,
          limit: 20,
        },
      });

      const newVideos = res.data.videos || [];
      if (newVideos.length > 0) {
        setVideos((prev) => (append ? [...prev, ...newVideos] : newVideos));
        setCategories(res.data.categories || []);
        setTotalVideos(res.data.total || newVideos.length);
        setHasMore(Boolean(res.data.hasMore));
      } else {
        setFallbackVideos();
      }
    } catch {
      setFallbackVideos();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function setFallbackVideos() {
    const fallbackList: Video[] = [
      {
        id: "vid_01",
        title: "5-Minute Guided Breathing for Instant Calm & Anxiety Relief",
        speaker: "Mindhaven Wellness",
        category: "mindfulness",
        embedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
        youtubeUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
        thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80",
        duration: "5:12",
        views: "45K",
      },
      {
        id: "vid_02",
        title: "Overcoming Student Stress & Exam Pressure",
        speaker: "Campus Psychology Hub",
        category: "student",
        embedUrl: "https://www.youtube.com/embed/8jPQjJS3tdc",
        youtubeUrl: "https://www.youtube.com/watch?v=8jPQjJS3tdc",
        thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
        duration: "8:45",
        views: "28K",
      },
      {
        id: "vid_03",
        title: "10-Minute Morning Meditation for Focus & Clarity",
        speaker: "Peaceful Mind",
        category: "meditation",
        embedUrl: "https://www.youtube.com/embed/O-6f5wQXSu8",
        youtubeUrl: "https://www.youtube.com/watch?v=O-6f5wQXSu8",
        thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&q=80",
        duration: "10:00",
        views: "62K",
      },
    ];
    setVideos(fallbackList);
    setCategories([
      { id: "all", label: "All Videos", icon: "✨" },
      { id: "mindfulness", label: "Mindfulness", icon: "🌿" },
      { id: "student", label: "Student Wellness", icon: "🎓" },
      { id: "meditation", label: "Meditation", icon: "🧘" },
    ]);
    setTotalVideos(fallbackList.length);
    setHasMore(false);
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadVideos(nextPage, true);
  }

  async function handleOpenVideo(vid: Video) {
    setActiveVideo(vid);
    try {
      const raw = localStorage.getItem("mindhaven_video_history");
      const list = raw ? JSON.parse(raw) : [];
      const historyItem = {
        _id: `local_v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        mediaType: "video",
        mediaId: vid.id || vid.videoId || vid.title,
        title: vid.title,
        artist: vid.speaker || "Speaker",
        data: vid,
        playedAt: new Date().toISOString(),
      };
      const filtered = list.filter((item: any) => item.title !== vid.title);
      const updated = [historyItem, ...filtered].slice(0, 60);
      localStorage.setItem("mindhaven_video_history", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("mindhaven_history_updated", { detail: { type: "video", item: historyItem } }));
    } catch {
      // Ignore storage errors
    }
    api.post("/video/history", { video: vid, track: vid }).catch(() => {});
  }

  async function handleToggleFavorite(vid: Video, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await api.post("/video/favorites", { video: vid });
      const fav = res.data.isFavorite;
      setVideos(videos.map((v) => (v.id === vid.id ? { ...v, isFavorite: fav } : v)));
      setRecommendations(recommendations.map((v) => (v.id === vid.id ? { ...v, isFavorite: fav } : v)));
      if (activeVideo && activeVideo.id === vid.id) {
        setActiveVideo({ ...activeVideo, isFavorite: fav });
      }
      toast.success(
        fav
          ? language === "ta" ? "பிடித்த வீடியோக்களில் சேர்க்கப்பட்டது! ❤️" : "Saved to favorites! ❤️"
          : language === "ta" ? "நீக்கப்பட்டது" : "Removed from favorites"
      );
    } catch {
      toast.error("Error updating favorites");
    }
  }

  function handleShare(vid: Video, e: React.MouseEvent) {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: vid.title, text: vid.speaker, url: vid.youtubeUrl || window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${vid.title} - ${vid.youtubeUrl || window.location.href}`);
      toast.success(language === "ta" ? "வீடியோ இணைப்பு நகலெடுக்கப்பட்டது 📋" : "Video link copied 📋");
    }
  }

  const featured = videos.length > 0 ? videos[0] : null;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>🎬 {t("nav_videos")} (YouTube HD Videos)</span>
            <span className="badge bg-rose-100 text-rose-800 text-xs font-bold">Official Embeds</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === "ta"
              ? "மாணவர்களுக்கான தன்னம்பிக்கை உரைகள், கல்வி, கோடிங், AI மற்றும் நகைச்சுவை வழிகாட்டல்கள்"
              : "Inspiring speeches, coding masterclasses, AI tutorials, and comedy relief."}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === "ta"
                ? "வீடியோக்களைத் தேடுங்கள் (Comedy, Python, Motivation, AI)..."
                : "Search videos (Comedy, Python, Motivation, AI)..."
            }
            className="input pl-10 text-xs sm:text-sm w-full"
          />
        </div>
      </div>

      {/* Featured Video Spotlight */}
      {featured && !search && activeCategory === "all" && (
        <div
          onClick={() => handleOpenVideo(featured)}
          className="group relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl cursor-pointer"
        >
          <div className="aspect-[21/9] w-full max-h-[360px] overflow-hidden relative">
            <img
              src={featured.thumbnail}
              alt={featured.title}
              className="h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-2xl group-hover:scale-110 group-hover:bg-rose-600 transition-all">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="badge bg-rose-500 text-white text-xs font-bold px-3 py-1">
                  ⭐ {language === "ta" ? "சிறப்பு வீடியோ" : "Featured Video"}
                </span>
                <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
                  {featured.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {featured.speaker} · {featured.views} views · {featured.duration}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {featured.youtubeUrl && (
                  <a
                    href={featured.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 rounded-2xl bg-white/20 border border-white/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/30 transition-all"
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={(e) => handleToggleFavorite(featured, e)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all"
                >
                  <Heart className={`w-5 h-5 ${featured.isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Videos Row */}
      {recommendations.length > 0 && !search && activeCategory === "all" && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span>{language === "ta" ? "பரிந்துரைக்கப்படும் வீடியோக்கள் ❤️" : "Recommended For You ❤️"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((vid) => (
              <div
                key={`rec-${vid.id}`}
                onClick={() => handleOpenVideo(vid)}
                className="group flex gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-rose-200 cursor-pointer transition-all"
              >
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-900">
                  <img src={vid.thumbnail} alt={vid.title} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-mono text-white">
                    {vid.duration}
                  </span>
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <p className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-rose-600">
                    {vid.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{vid.speaker}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories (10 Categories) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/25 scale-105"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Videos Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{totalVideos} {language === "ta" ? "வீடியோக்கள் கண்டறியப்பட்டன" : "videos found"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {videos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => handleOpenVideo(vid)}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3.5 hover:shadow-xl hover:border-slate-300 cursor-pointer transition-all duration-300"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 shadow-inner">
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-md">
                    {vid.duration}
                  </span>
                </div>

                {/* Info */}
                <div className="mt-3 space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {vid.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate">{vid.speaker}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {vid.views || "100K"}
                </span>

                <div className="flex items-center gap-1.5">
                  {vid.youtubeUrl && (
                    <a
                      href={vid.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={(e) => handleShare(vid, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleToggleFavorite(vid, e)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      vid.isFavorite
                        ? "text-rose-500 hover:text-rose-600 bg-rose-50"
                        : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"
                    }`}
                    title="Favorite"
                  >
                    <Heart className={`w-4 h-4 ${vid.isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Pagination */}
        {hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {loadingMore
                ? language === "ta" ? "வீடியோக்கள் ஏற்றப்படுகின்றன..." : "Loading more videos..."
                : language === "ta" ? "மேலும் வீடியோக்களைக் காட்டு 🎬" : "Load More Videos 🎬"}
            </button>
          </div>
        )}
      </div>

      {/* Video Player Lightbox Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-slate-700">
            {/* Modal Header */}
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
                    <span>Open YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={(e) => handleToggleFavorite(activeVideo, e)}
                  className={`p-2 rounded-xl border transition-colors ${
                    activeVideo.isFavorite
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeVideo.isFavorite ? "fill-current" : ""}`} />
                </button>

                <button
                  onClick={() => setActiveVideo(null)}
                  className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embed Video Stream */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`${activeVideo.embedUrl}?autoplay=1`}
                title={activeVideo.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

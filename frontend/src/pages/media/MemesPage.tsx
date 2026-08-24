import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Smile,
  Heart,
  Share2,
  Search,
  RotateCw,
  Sparkles,
  Maximize2,
  X,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";

interface Meme {
  id: string;
  title: string;
  caption: string;
  category: string;
  imageUrl: string;
  likes: number;
  shares: number;
  tags?: string;
  isLiked?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: string;
}

export function MemesPage() {
  const { language, t } = useLanguage();
  usePageTitle(language === "ta" ? "தமிழ் மீம்ஸ் (Tamil Memes)" : "Meme Feed");

  const [memes, setMemes] = useState<Meme[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalMemes, setTotalMemes] = useState(0);
  const [lightboxMeme, setLightboxMeme] = useState<Meme | null>(null);

  useEffect(() => {
    setPage(1);
    loadMemes(1, false);
  }, [activeCategory, search, language]);

  async function loadMemes(pageNumber: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.get("/memes/list", {
        params: {
          category: activeCategory,
          search,
          page: pageNumber,
          limit: 20,
        },
      });

      const newMemes = res.data.memes || [];
      setMemes((prev) => (append ? [...prev, ...newMemes] : newMemes));
      setCategories(res.data.categories || []);
      setTotalMemes(res.data.total || newMemes.length);
      setHasMore(Boolean(res.data.hasMore));
    } catch {
      toast.error(language === "ta" ? "மீம்ஸ்களை ஏற்றுவதில் பிழை" : "Error loading memes");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMemes(nextPage, true);
  }

  async function handleToggleLike(meme: Meme, e?: React.MouseEvent) {
    e?.stopPropagation();
    try {
      const res = await api.post("/memes/like", { meme });
      const liked = res.data.isLiked;
      setMemes(
        memes.map((m) =>
          m.id === meme.id
            ? { ...m, isLiked: liked, likes: liked ? m.likes + 1 : Math.max(0, m.likes - 1) }
            : m
        )
      );
      if (lightboxMeme && lightboxMeme.id === meme.id) {
        setLightboxMeme({
          ...lightboxMeme,
          isLiked: liked,
          likes: liked ? lightboxMeme.likes + 1 : Math.max(0, lightboxMeme.likes - 1),
        });
      }
      toast.success(
        liked
          ? language === "ta" ? "விருப்பம் தெரிவிக்கப்பட்டது! ❤️" : "Liked & Saved! ❤️"
          : language === "ta" ? "விருப்பம் நீக்கப்பட்டது" : "Unliked"
      );
    } catch {
      toast.error("Error toggling like");
    }
  }

  function handleShare(meme: Meme, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (navigator.share) {
      navigator
        .share({
          title: meme.title,
          text: `${meme.title}\n${meme.caption}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${meme.title}: ${meme.caption}`);
      toast.success(language === "ta" ? "மீம் விவரங்கள் நகலெடுக்கப்பட்டது! 📋" : "Meme copied! 📋");
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>😂 {t("nav_memes")} & Fun Feed</span>
            <span className="badge bg-amber-100 text-amber-800 text-xs font-bold">Trending Humor</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === "ta"
              ? "கல்லூரி வாழ்க்கை, நண்பர்கள், கோடிங் மற்றும் சினிமா நகைச்சுவைகள் — சிரித்து மகிழுங்கள்!"
              : "Campus life, engineering humor, coding jokes, and cinema fun to lighten your mood."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "ta" ? "மீம்ஸ்களைத் தேடுங்கள்..." : "Search memes..."}
              className="input pl-10 text-xs sm:text-sm w-full"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              loadMemes(1, false);
            }}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all active:scale-95"
            title="Refresh Feed"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Category Pills (10 Categories) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-105"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Memes Masonry / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{totalMemes} {language === "ta" ? "மீம்ஸ்கள் உள்ளன" : "memes available"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {memes.map((meme) => (
            <div
              key={meme.id}
              onClick={() => setLightboxMeme(meme)}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 hover:shadow-xl hover:border-amber-300 cursor-pointer transition-all duration-300"
            >
              <div className="space-y-3">
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-inner">
                  <img
                    src={meme.imageUrl}
                    alt={meme.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Title & Caption */}
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                    {meme.title}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {meme.caption}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="badge bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  {meme.category}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleShare(meme, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleToggleLike(meme, e)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      meme.isLiked
                        ? "text-rose-500 bg-rose-50"
                        : "text-slate-400 hover:text-rose-500 hover:bg-slate-50"
                    }`}
                    title="Like"
                  >
                    <Heart className={`w-4 h-4 ${meme.isLiked ? "fill-current" : ""}`} />
                    <span>{meme.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {loadingMore
                ? language === "ta" ? "மீம்ஸ்கள் ஏற்றப்படுகின்றன..." : "Loading more memes..."
                : language === "ta" ? "மேலும் மீம்ஸ்களைக் காட்டு 😂" : "Load More Memes 😂"}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxMeme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {lightboxMeme.title}
              </h3>
              <button
                onClick={() => setLightboxMeme(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="max-h-[60vh] overflow-hidden rounded-2xl bg-slate-900 flex items-center justify-center">
                <img
                  src={lightboxMeme.imageUrl}
                  alt={lightboxMeme.title}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <p className="text-sm text-slate-700 font-medium">{lightboxMeme.caption}</p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={(e) => handleToggleLike(lightboxMeme, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    lightboxMeme.isLiked
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                      : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${lightboxMeme.isLiked ? "fill-current" : ""}`} />
                  <span>{lightboxMeme.likes} Likes</span>
                </button>

                <button
                  onClick={(e) => handleShare(lightboxMeme, e)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

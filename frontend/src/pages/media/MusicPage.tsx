import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useMusic } from "../../context/MusicContext";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Music,
  Play,
  Pause,
  Heart,
  Search,
  Sparkles,
  ExternalLink,
  Flame,
  Plus,
  Radio,
  User,
  Disc,
} from "lucide-react";
import toast from "react-hot-toast";

interface Track {
  id: string;
  spotifyId?: string;
  title: string;
  artist: string;
  category: string;
  audioUrl: string;
  spotifyUrl?: string;
  coverUrl: string;
  duration: string;
  plays?: number;
  isFavorite?: boolean;
  album?: string;
}

interface Artist {
  id: string;
  name: string;
  monthlyListeners: string;
  imageUrl: string;
  spotifyUrl: string;
  genre: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
}

export function MusicPage() {
  const { currentSong, isPlaying, playSong, togglePlay, toggleFavoriteSong } = useMusic();
  const { language, t } = useLanguage();
  usePageTitle(language === "ta" ? "இசை அரங்கம் (Spotify Hub)" : "Spotify Music Hub");

  const [tracks, setTracks] = useState<Track[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalTracks, setTotalTracks] = useState(0);

  useEffect(() => {
    setPage(1);
    loadTracks(1, false);
  }, [activeCategory, search, language]);

  async function loadTracks(pageNumber: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.get("/music/tracks", {
        params: {
          category: activeCategory,
          search,
          language,
          page: pageNumber,
          limit: 24,
        },
      });

      const newTracks = res.data.tracks || [];
      setTracks((prev) => (append ? [...prev, ...newTracks] : newTracks));
      setCategories(res.data.categories || []);
      setArtists(res.data.artists || []);
      setTotalTracks(res.data.total || newTracks.length);
      setHasMore(Boolean(res.data.hasMore));
    } catch {
      toast.error(language === "ta" ? "பாடல்களை ஏற்றுவதில் பிழை" : "Error loading tracks");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTracks(nextPage, true);
  }

  function handleArtistClick(artistName: string) {
    setSearch(artistName);
  }

  async function handleToggleFavorite(song: Track) {
    const isFav = await toggleFavoriteSong(song as any);
    setTracks(tracks.map((t) => (t.id === song.id ? { ...t, isFavorite: isFav } : t)));
  }

  const featuredTrack = tracks.length > 0 ? tracks[0] : null;

  return (
    <div className="space-y-8 pb-28">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>🎵 {t("nav_music")} (Spotify Music Streaming)</span>
            <span className="badge bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Spotify Integrated</span>
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === "ta"
              ? "தமிழ் சினிமா மெலடிகள், கர்நாடக சங்கீதம், அனிருத் & ரஹ்மான் ஹிட்ஸ் மற்றும் புத்துணர்ச்சியூட்டும் பாடல்கள்."
              : "Discover Tamil hits, classical carnatic, evergreen 90s, and latest Spotify releases."}
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
                ? "பாடல்கள் அல்லது இசையமைப்பாளரைத் தேடுங்கள் (Anirudh, Rahman, 90s)..."
                : "Search tracks, artists, or moods (Anirudh, Rahman)..."
            }
            className="input pl-10 text-xs sm:text-sm w-full"
          />
        </div>
      </div>

      {/* Featured Spotlight Card */}
      {featuredTrack && !search && activeCategory === "all" && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <img
              src={featuredTrack.coverUrl}
              alt={featuredTrack.title}
              className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl object-cover shadow-2xl border border-white/10 flex-shrink-0"
            />

            <div className="space-y-3 min-w-0 flex-1 text-center md:text-left">
              <span className="badge bg-emerald-500 text-white text-xs font-bold px-3 py-1">
                ⭐ {language === "ta" ? "சிறப்புப் பாடல்" : "Featured Track"}
              </span>

              <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight truncate">
                {featuredTrack.title}
              </h3>

              <p className="text-sm text-slate-300 font-medium">
                {featuredTrack.artist} · {featuredTrack.duration}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => {
                    if (currentSong?.id === featuredTrack.id) togglePlay();
                    else playSong(featuredTrack);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xl hover:bg-emerald-400 hover:scale-105 transition-all"
                >
                  {currentSong?.id === featuredTrack.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>{language === "ta" ? "இடைநிறுத்து" : "Pause"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>{language === "ta" ? "இப்போதே கேள்" : "Play Now"}</span>
                    </>
                  )}
                </button>

                {featuredTrack.spotifyUrl && (
                  <a
                    href={featuredTrack.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 px-4 py-3 text-xs sm:text-sm font-bold text-[#1DB954] hover:bg-[#1DB954]/30 transition-all"
                  >
                    <span>Open in Spotify</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={() => handleToggleFavorite(featuredTrack)}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                    featuredTrack.isFavorite
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${featuredTrack.isFavorite ? "fill-rose-500" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Artists Showcase */}
      {artists.length > 0 && !search && activeCategory === "all" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>{language === "ta" ? "பிரபல இசையமைப்பாளர்கள் & பாடகர்கள்" : "Popular Artists & Composers"}</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {artists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => handleArtistClick(artist.name)}
                className="group flex flex-col items-center p-3 rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:border-indigo-200 cursor-pointer transition-all text-center space-y-2"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-full shadow-md bg-slate-100">
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600">
                    {artist.name}
                  </p>
                  <p className="text-[10px] text-slate-400">{artist.monthlyListeners} Listeners</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories (18 Categories) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/25 scale-105"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tracks Grid (Scalable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{totalTracks} {language === "ta" ? "பாடல்கள் கண்டறியப்பட்டன" : "tracks found"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tracks.map((song) => {
            const isThisPlaying = currentSong?.id === song.id && isPlaying;

            return (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className={`group flex flex-col justify-between overflow-hidden rounded-3xl border p-3.5 transition-all duration-300 cursor-pointer ${
                  currentSong?.id === song.id
                    ? "border-emerald-500 bg-emerald-50/40 shadow-md"
                    : "border-slate-200/80 bg-white hover:shadow-xl hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Cover */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-inner">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Play Button Overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${
                        isThisPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentSong?.id === song.id) togglePlay();
                          else playSong(song);
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl hover:scale-110 transition-transform"
                      >
                        {isThisPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white">
                      {song.duration}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="mt-3 space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                      {song.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
                  {song.spotifyUrl ? (
                    <a
                      href={song.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1DB954] hover:underline"
                    >
                      <span>Spotify</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{song.category}</span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(song);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      song.isFavorite
                        ? "text-rose-500 hover:text-rose-600 bg-rose-50"
                        : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${song.isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Pagination (Supports 10,000+ discovery) */}
        {hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {loadingMore
                ? language === "ta" ? "பாடல்கள் ஏற்றப்படுகின்றன..." : "Loading more tracks..."
                : language === "ta" ? "மேலும் பாடல்களைக் காட்டு 🎵" : "Load More Songs 🎵"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useMusic } from "../../context/MusicContext";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Search,
  Music,
  Film,
  Smile,
  MessageSquare,
  Play,
  Heart,
  ChevronRight,
  Sparkles,
  ExternalLink,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

export function GlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{
    tracks: any[];
    artists?: any[];
    videos: any[];
    memes: any[];
    conversations: any[];
  }>({
    tracks: [],
    artists: [],
    videos: [],
    memes: [],
    conversations: [],
  });
  const [activeTab, setActiveTab] = useState<"all" | "artists" | "music" | "videos" | "memes" | "chats">("all");
  const [loading, setLoading] = useState(false);

  const { playSong } = useMusic();
  const { language, t } = useLanguage();

  usePageTitle(language === "ta" ? `தேடல்: ${query || "அனைத்தும்"}` : `Search: ${query || "Global"}`);

  useEffect(() => {
    if (query.trim()) {
      handleSearch(query);
    }
  }, [query]);

  async function handleSearch(q: string) {
    setLoading(true);
    try {
      const res = await api.get("/search/global", { params: { q } });
      setResults(res.data);
    } catch {
      const qLower = q.toLowerCase();
      const matchedTracks = [
        { id: "trk_hit_01", title: "ஆரம்பமே அமர்க்களம் (Mass Beats)", artist: "Anirudh Ravichander", category: "hits", duration: "6:12", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
        { id: "trk_mel_03", title: "வசந்த கால தென்றல் (Melody)", artist: "Ilaiyaraaja", category: "melody", duration: "5:44", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      ].filter((t) => t.title.toLowerCase().includes(qLower) || t.artist.toLowerCase().includes(qLower));

      setResults({
        tracks: matchedTracks,
        artists: [],
        videos: [],
        memes: [],
        conversations: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const artistsCount = results.artists?.length || 0;
  const totalResults =
    results.tracks.length + artistsCount + results.videos.length + results.memes.length + results.conversations.length;

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto">
      {/* Header & Big Search Bar */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            <span>{language === "ta" ? "பொதுத் தேடல் (Global Content Search)" : "Universal Content Search"}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === "ta"
              ? "Spotify பாடல்கள், இசையமைப்பாளர்கள், YouTube வீடியோக்கள், மீம்கள் மற்றும் உரையாடல்களை ஒரே இடத்தில் தேடுங்கள்"
              : "Discover Spotify tracks, artists, YouTube videos, memes, and chat threads instantly"}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchParams({ q: e.target.value });
            }}
            placeholder={
              language === "ta"
                ? "எதையும் தேடுங்கள் (Anirudh, Rahman, Python, Comedy, Machine Learning)..."
                : "Search anything across music, artists, videos, memes, and chats..."
            }
            className="input pl-12 py-3.5 text-sm sm:text-base w-full rounded-2xl shadow-sm border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{language === "ta" ? "அனைத்தும்" : "All"} ({totalResults})</span>
        </button>

        {artistsCount > 0 && (
          <button
            onClick={() => setActiveTab("artists")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === "artists"
                ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === "ta" ? "இசையமைப்பாளர்கள்" : "Artists"} ({artistsCount})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("music")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "music"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>{t("nav_music")} ({results.tracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "videos"
              ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>{t("nav_videos")} ({results.videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("memes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "memes"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>{t("nav_memes")} ({results.memes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("chats")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === "chats"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t("nav_chat")} ({results.conversations.length})</span>
        </button>
      </div>

      {/* Results Body */}
      {query.trim() === "" ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <Search className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
          <p className="text-sm font-medium">
            {language === "ta"
              ? "தேட விரும்பும் சொல்லை மேலே தட்டச்சு செய்யவும்"
              : "Type a query above to search across Spotify, YouTube, Memes, and Chats"}
          </p>
        </div>
      ) : totalResults === 0 && !loading ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <p className="text-base font-bold text-slate-700">
            {language === "ta" ? "முடிவுகள் எதுவும் கிடைக்கவில்லை" : "No results found"}
          </p>
          <p className="text-xs">
            {language === "ta" ? `"${query}" என்பதற்கு தொடர்புடைய தகவல்கள் இல்லை.` : `No matches for "${query}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* 1. Artists Results */}
          {(activeTab === "all" || activeTab === "artists") && (results.artists?.length || 0) > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <span>{language === "ta" ? "இசையமைப்பாளர்கள் & பாடகர்கள்" : "Artists & Composers"} ({results.artists?.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.artists?.map((art) => (
                  <div
                    key={art.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all group"
                  >
                    <img src={art.imageUrl} alt={art.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate group-hover:text-teal-600">
                        {art.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{art.monthlyListeners} Listeners</p>
                    </div>
                    {art.spotifyUrl && (
                      <a
                        href={art.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-50 text-[#1DB954] hover:bg-emerald-50"
                        title="Open in Spotify"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Music Results */}
          {(activeTab === "all" || activeTab === "music") && results.tracks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Music className="w-5 h-5 text-indigo-600" />
                  <span>🎵 Spotify {t("nav_music")} ({results.tracks.length})</span>
                </h3>
                <Link to="/candidate/music" className="text-xs font-bold text-blue-600">
                  {language === "ta" ? "அனைத்தையும் பார் →" : "View Music Page →"}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.tracks.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => playSong(song)}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer transition-all group"
                  >
                    <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {song.spotifyUrl && (
                        <a
                          href={song.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1DB954] hover:bg-slate-50"
                          title="Open in Spotify"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Video Results */}
          {(activeTab === "all" || activeTab === "videos") && results.videos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-600" />
                  <span>🎬 YouTube {t("nav_videos")} ({results.videos.length})</span>
                </h3>
                <Link to="/candidate/videos" className="text-xs font-bold text-rose-600">
                  {language === "ta" ? "அனைத்தையும் பார் →" : "View Videos Page →"}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {results.videos.map((vid) => (
                  <Link
                    key={vid.id}
                    to="/candidate/videos"
                    className="group flex gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-rose-200 transition-all"
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
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 4. Meme Results */}
          {(activeTab === "all" || activeTab === "memes") && results.memes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-500" />
                  <span>😂 {t("nav_memes")} ({results.memes.length})</span>
                </h3>
                <Link to="/candidate/memes" className="text-xs font-bold text-amber-600">
                  {language === "ta" ? "அனைத்தையும் பார் →" : "View Memes Page →"}
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {results.memes.map((m) => (
                  <Link
                    key={m.id}
                    to="/candidate/memes"
                    className="group rounded-2xl border border-slate-100 bg-white p-2.5 hover:shadow-md hover:border-amber-200 transition-all space-y-1.5"
                  >
                    <img src={m.imageUrl} alt={m.title} className="aspect-square w-full object-cover rounded-xl" />
                    <p className="font-bold text-[11px] text-slate-900 truncate group-hover:text-amber-600">
                      {m.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 5. Chat Results */}
          {(activeTab === "all" || activeTab === "chats") && results.conversations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>💬 {t("nav_chat")} ({results.conversations.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.conversations.map((conv) => (
                  <Link
                    key={conv._id}
                    to="/candidate/ai-chat"
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-purple-50/60 hover:border-purple-200 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="font-bold text-xs text-slate-900 truncate group-hover:text-purple-700">
                        {conv.title}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

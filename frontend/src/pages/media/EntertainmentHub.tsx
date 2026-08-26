import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useMusic } from "../../context/MusicContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { api } from "../../lib/api";
import {
  Sparkles,
  Music,
  Video,
  Smile,
  Search,
  Play,
  ExternalLink,
  Heart,
  Share2,
  X,
  Volume2,
  Flame,
  Radio,
  Clock,
  Eye,
  RefreshCw,
  Layers,
  ChevronRight,
  Disc,
} from "lucide-react";
import toast from "react-hot-toast";

interface Track {
  id: string;
  spotifyId?: string;
  title: string;
  artist: string;
  category: string;
  language: string;
  audioUrl?: string;
  embedUrl: string;
  spotifyUrl: string;
  coverUrl: string;
  duration: string;
  popularity?: number;
  album?: string;
  hasPreview?: boolean;
}

interface VideoItem {
  id: string;
  videoId: string;
  title: string;
  speaker: string;
  category: string;
  language: string;
  embedUrl: string;
  youtubeUrl: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  description?: string;
}

interface MemeItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  language: string;
  imageUrl: string;
  likes: number;
  shares: number;
  source: string;
  redditUrl?: string;
  isLiked?: boolean;
}

export function EntertainmentHub() {
  const { language, setLanguage, currentLanguageObj, languages } = useLanguage();
  const { playSong } = useMusic();

  usePageTitle(
    language === "ta"
      ? "பன்மொழி பொழுதுபோக்கு அரங்கம் (Multilingual Entertainment)"
      : `${currentLanguageObj.name} Entertainment Hub`
  );

  const [activeTab, setActiveTab] = useState<"all" | "music" | "videos" | "memes">("all");
  const [musicCategory, setMusicCategory] = useState<"latest" | "trending" | "popular" | "playlists">("latest");
  const [videoCategory, setVideoCategory] = useState<"trending" | "latest" | "comedy" | "mindfulness">("trending");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [memes, setMemes] = useState<MemeItem[]>([]);

  // Modals
  const [activeSpotifyEmbed, setActiveSpotifyEmbed] = useState<string | null>(null);
  const [activeVideoEmbed, setActiveVideoEmbed] = useState<VideoItem | null>(null);
  const [activeMemeLightbox, setActiveMemeLightbox] = useState<MemeItem | null>(null);

  useEffect(() => {
    loadEntertainmentContent();
  }, [language]);

  async function loadEntertainmentContent() {
    setLoading(true);
    try {
      const res = await api.get("/entertainment/recommendations", {
        params: { language },
      });

      const data = res.data;
      if (data) {
        setTracks([
          ...(data.music?.latest || []),
          ...(data.music?.trending || []),
          ...(data.music?.popular || []),
        ]);
        setPlaylists(data.music?.playlists || []);
        setVideos([
          ...(data.videos?.trending || []),
          ...(data.videos?.comedy || []),
          ...(data.videos?.mindfulness || []),
          ...(data.videos?.latest || []),
        ]);
        setMemes([...(data.memes?.trending || []), ...(data.memes?.latest || [])]);
      }
    } catch {
      // Graceful fallback to avoid error popups
    } finally {
      setLoading(false);
    }
  }

  // Filtered lists
  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredVideos = videos.filter((v) => {
    const matchesCategory = videoCategory === "trending" ? true : v.category === videoCategory;
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredMemes = memes.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.caption.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  function handlePlayTrack(track: Track) {
    if (track.audioUrl) {
      playSong({
        id: track.id,
        title: track.title,
        artist: track.artist,
        category: track.category,
        audioUrl: track.audioUrl,
        coverUrl: track.coverUrl,
        duration: track.duration,
      });
    } else {
      setActiveSpotifyEmbed(track.embedUrl);
    }
  }

  function handlePlayVideo(vid: VideoItem) {
    setActiveVideoEmbed(vid);
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
      // Ignore
    }
    api.post("/video/history", { video: vid, track: vid }).catch(() => {});
  }

  function handleLikeMeme(id: string) {
    setMemes((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, likes: m.likes + (m.isLiked ? -1 : 1), isLiked: !m.isLiked } : m
      )
    );
  }

  return (
    <div className="space-y-8 pb-32 max-w-7xl mx-auto">
      {/* 🌟 Top Hero Header & Dynamic Language Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-950 p-6 sm:p-10 text-white shadow-2xl border border-blue-800/40">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
              <span>
                {language === "ta"
                  ? "தானியங்கி பன்மொழி பொழுதுபோக்கு"
                  : "Automatic Multilingual Entertainment"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{currentLanguageObj.flag}</span>
              <span>
                {language === "ta"
                  ? `${currentLanguageObj.nativeName} பொழுதுபோக்கு அரங்கம்`
                  : `${currentLanguageObj.name} Entertainment Hub`}
              </span>
            </h1>
            <p className="text-sm text-blue-100/80 max-w-2xl leading-relaxed">
              {language === "ta"
                ? "உங்கள் விருப்ப மொழியில் Spotify பாடல்கள், YouTube வீடியோக்கள் மற்றும் பிராந்திய மீம்ஸ்கள் உடனடியாக புதுப்பிக்கப்படுகின்றன."
                : `Official Spotify chartbusters, YouTube entertainment videos, and viral regional memes automatically tailored for ${currentLanguageObj.name}.`}
            </p>
          </div>

          {/* Language Quick Selector Pills */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-3 rounded-2xl w-full md:w-auto shadow-inner">
            <p className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>🌐 {language === "ta" ? "மொழியை மாற்றுக" : "Select Your Language"}:</span>
              <span className="text-blue-400 font-extrabold">{currentLanguageObj.nativeName}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-w-sm">
              {languages.slice(0, 8).map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    language === l.code
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span className="mr-1">{l.flag}</span>
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "ta"
                ? "பாடல்கள், கலைஞர்கள், வீடியோக்கள் அல்லது மீம்ஸ்களைத் தேடுக..."
                : `Search ${currentLanguageObj.name} songs, artists, videos, or memes...`
            }
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-md transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 🧭 Navigation Tab Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: language === "ta" ? "அனைத்தும்" : "All Entertainment", icon: Layers },
            { id: "music", label: language === "ta" ? "Spotify இசை" : "Spotify Music", icon: Music },
            { id: "videos", label: language === "ta" ? "YouTube வீடியோக்கள்" : "YouTube Videos", icon: Video },
            { id: "memes", label: language === "ta" ? "மீம்ஸ் அரங்கம்" : "Regional Memes", icon: Smile },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={loadEntertainmentContent}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95"
          title="Refresh Content"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
          <span className="hidden sm:inline">{language === "ta" ? "புதுப்பி" : "Refresh"}</span>
        </button>
      </div>

      {/* 🎵 SECTION 1: SPOTIFY MUSIC */}
      {(activeTab === "all" || activeTab === "music") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {language === "ta"
                      ? `${currentLanguageObj.nativeName} இசை அரங்கம்`
                      : `${currentLanguageObj.name} Spotify Music Hub`}
                  </span>
                  <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    Official Spotify API
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === "ta"
                    ? "சமீபத்திய வெளியீடுகள், ட்ரெண்டிங் ஹிட்ஸ் மற்றும் அதிகாரப்பூர்வ ஸ்பாட்டிஃபை பிளேலிஸ்ட்கள்"
                    : `Latest chartbusters, soulful melodies, and Spotify playlists in ${currentLanguageObj.name}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Music Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))
              : filteredTracks.slice(0, 8).map((track) => (
                  <div
                    key={track.id}
                    className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300"
                  >
                    {/* Artwork with Overlay Play */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 mb-3 shadow-md">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => handlePlayTrack(track)}
                          className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all"
                          title="Play Track"
                        >
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </button>
                        <button
                          onClick={() => setActiveSpotifyEmbed(track.embedUrl)}
                          className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-md hover:bg-black hover:scale-110 active:scale-95 transition-all"
                          title="Spotify Embed Player"
                        >
                          <Disc className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold text-white/90 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {track.duration}
                        </span>
                        {track.popularity && (
                          <span className="flex items-center gap-1 text-emerald-300">
                            <Flame className="w-3 h-3 text-emerald-400 fill-current" />
                            {track.popularity}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          {track.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {track.artist}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => handlePlayTrack(track)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{language === "ta" ? "இயக்கு" : "Play"}</span>
                        </button>

                        <a
                          href={track.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-500 transition-colors"
                        >
                          <span>Spotify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          {/* Featured Spotify Playlists */}
          {playlists.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Disc className="w-4 h-4 text-emerald-500" />
                <span>
                  {language === "ta"
                    ? "அதிகாரப்பூர்வ ஸ்பாட்டிஃபை பிளேலிஸ்ட்கள்"
                    : `Featured ${currentLanguageObj.name} Playlists`}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {playlists.slice(0, 3).map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setActiveSpotifyEmbed(pl.embedUrl)}
                    className="cursor-pointer flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-800/80 transition-all group"
                  >
                    <img
                      src={pl.coverUrl}
                      alt={pl.name}
                      className="w-14 h-14 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {pl.description}
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Open Spotify Player →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 🎬 SECTION 2: YOUTUBE VIDEOS */}
      {(activeTab === "all" || activeTab === "videos") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {language === "ta"
                      ? `${currentLanguageObj.nativeName} வீடியோ அரங்கம்`
                      : `${currentLanguageObj.name} YouTube Videos Hub`}
                  </span>
                  <span className="badge bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[10px] font-bold">
                    Official YouTube API
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === "ta"
                    ? "மன அழுத்த நிவாரணம், நகைச்சுவை மற்றும் சமீபத்திய பொழுதுபோக்கு வீடியோக்கள்"
                    : `Mindfulness sessions, comedy clips, and trending entertainment videos in ${currentLanguageObj.name}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-60 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))
              : filteredVideos.slice(0, 8).map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => handlePlayVideo(vid)}
                    className="group cursor-pointer flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:shadow-xl hover:border-red-500/40 transition-all duration-300"
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 mb-3 shadow-md">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                        <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-all">
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </div>
                      </div>

                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white backdrop-blur-sm">
                        {vid.duration}
                      </span>
                    </div>

                    {/* Video Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
                          {vid.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {vid.speaker}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          {vid.views}
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                          {language === "ta" ? "காண்க" : "Watch"} →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* 😂 SECTION 3: REGIONAL MEMES */}
      {(activeTab === "all" || activeTab === "memes") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {language === "ta"
                      ? `${currentLanguageObj.nativeName} மீம்ஸ் அரங்கம்`
                      : `${currentLanguageObj.name} Regional Memes`}
                  </span>
                  <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                    Viral Humor
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === "ta"
                    ? "கல்லூரி மற்றும் மாணவர் சார்ந்த நேர்மறை நகைச்சுவை மீம்ஸ்கள்"
                    : `Positive student vibes and relatable comedy memes in ${currentLanguageObj.name}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Memes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))
              : filteredMemes.slice(0, 8).map((meme) => (
                  <div
                    key={meme.id}
                    className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300"
                  >
                    {/* Meme Image */}
                    <div
                      onClick={() => setActiveMemeLightbox(meme)}
                      className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 mb-3 cursor-pointer shadow-md"
                    >
                      <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback on broken image
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md">
                          🔍 {language === "ta" ? "பெரிதாக்கு" : "Zoom Meme"}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {meme.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {meme.caption}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => handleLikeMeme(meme.id)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                            meme.isLiked
                              ? "bg-pink-50 text-pink-600 dark:bg-pink-950/60"
                              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${meme.isLiked ? "fill-current text-pink-600" : ""}`}
                          />
                          <span>{meme.likes}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: meme.title, url: meme.imageUrl }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(meme.imageUrl);
                              toast.success("Meme link copied!");
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Share Meme"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* 🎧 SPOTIFY EMBED MODAL */}
      {activeSpotifyEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-emerald-500/30 p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <Disc className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span>Spotify Official Player</span>
              </span>
              <button
                onClick={() => setActiveSpotifyEmbed(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              src={activeSpotifyEmbed}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* 🎬 YOUTUBE EMBED MODAL */}
      {activeVideoEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-950 border border-red-500/30 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-red-400 flex items-center gap-2 line-clamp-1 pr-4">
                <Video className="w-4 h-4 text-red-500" />
                <span>{activeVideoEmbed.title}</span>
              </span>
              <button
                onClick={() => setActiveVideoEmbed(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <iframe
                src={`${activeVideoEmbed.embedUrl}?autoplay=1`}
                title={activeVideoEmbed.title}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <span>{activeVideoEmbed.speaker}</span>
              <a
                href={activeVideoEmbed.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 🖼️ MEME LIGHTBOX MODAL */}
      {activeMemeLightbox && (
        <div
          onClick={() => setActiveMemeLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700 p-4 shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 line-clamp-1">
                {activeMemeLightbox.title}
              </span>
              <button
                onClick={() => setActiveMemeLightbox(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={activeMemeLightbox.imageUrl}
              alt={activeMemeLightbox.title}
              className="max-h-[65vh] w-auto mx-auto rounded-2xl object-contain"
            />
            <p className="text-xs text-slate-300 text-center font-medium">
              {activeMemeLightbox.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

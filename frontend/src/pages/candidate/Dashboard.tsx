import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMusic } from "../../context/MusicContext";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSelector } from "../../components/LanguageSelector";
import { api } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Sparkles,
  Music,
  Film,
  Smile,
  Brain,
  Calendar,
  Play,
  ChevronRight,
  Flame,
  Search,
  MessageSquare,
  Heart,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, formatTime } from "../../lib/utils";

const MOODS = [
  { emoji: "✨", label: "மகிழ்ச்சி (Radiant)", labelEn: "Radiant" },
  { emoji: "🌿", label: "அமைதி (Calm)", labelEn: "Calm" },
  { emoji: "☁️", label: "சாதாரணம் (Okay)", labelEn: "Okay" },
  { emoji: "🌧️", label: "கவலை (Anxious)", labelEn: "Anxious" },
  { emoji: "⚡", label: "மன அழுத்தம் (Stressed)", labelEn: "Stressed" },
];

const DEFAULT_RECENT_TRACKS = [
  {
    id: "track_1",
    title: "Weightless Horizon",
    artist: "Mindhaven Ambient Soundscapes",
    category: "Anxiety Relief",
    duration: "3:45",
    coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&q=80",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
  },
  {
    id: "track_2",
    title: "Gentle Morning Sunlight",
    artist: "Peaceful Meditation",
    category: "Calm Focus",
    duration: "4:20",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg",
  },
  {
    id: "track_3",
    title: "Deep Sleep & 432Hz Waves",
    artist: "Sound Sanctuary",
    category: "Deep Sleep",
    duration: "5:10",
    coverUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80",
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/soft_rain.ogg",
  },
];

const DEFAULT_RECOMMENDED_VIDEOS = [
  {
    id: "vid_1",
    title: "5-Minute Guided Breathing for Instant Stress Relief",
    category: "Mindfulness",
    duration: "5:12",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80",
    videoUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
  },
  {
    id: "vid_2",
    title: "Overcoming Exam Anxiety & Academic Pressure",
    category: "Student Wellness",
    duration: "8:45",
    thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
    videoUrl: "https://www.youtube.com/watch?v=8jPQjJS3tdc",
  },
];

const DEFAULT_TRENDING_MEMES = [
  {
    id: "meme_1",
    caption: "Me telling myself 'one small step at a time' today 🐱",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80",
    likes: 42,
  },
  {
    id: "meme_2",
    caption: "Brain at 3 AM vs Brain during study time 🧠✨",
    imageUrl: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=500&q=80",
    likes: 68,
  },
];

export function CandidateDashboard() {
  const { user } = useAuth();
  const { playSong } = useMusic();
  const { language, t, currentLanguageObj } = useLanguage();

  usePageTitle(`Dashboard - ${currentLanguageObj.nativeName}`);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodLogged, setMoodLogged] = useState(false);
  const [recentTracks, setRecentTracks] = useState<any[]>(DEFAULT_RECENT_TRACKS);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>(DEFAULT_RECOMMENDED_VIDEOS);
  const [trendingMemes, setTrendingMemes] = useState<any[]>(DEFAULT_TRENDING_MEMES);
  const [lastConversation, setLastConversation] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    // 1. Music Tracks
    api.get("/music/recommendations")
      .then((res) => {
        if (res.data.recommendations?.length) setRecentTracks(res.data.recommendations.slice(0, 4));
      })
      .catch(() => {});

    // 2. Videos
    api.get("/video/recommendations")
      .then((res) => {
        if (res.data.recommendations?.length) setRecommendedVideos(res.data.recommendations.slice(0, 3));
      })
      .catch(() => {});

    // 3. Memes
    api.get("/memes/list")
      .then((res) => {
        if (res.data.memes?.length) setTrendingMemes(res.data.memes.slice(0, 4));
      })
      .catch(() => {});

    // 4. Last Conversation
    api.get("/ai/conversations")
      .then((res) => {
        const convs = res.data.conversations || [];
        if (convs.length > 0) setLastConversation(convs[0]);
      })
      .catch(() => {});

    // 5. Appointments
    api.get("/appointments/candidate")
      .then((res) => {
        setAppointments(Array.isArray(res.data) ? res.data : res.data.appointments || []);
      })
      .catch(() => {});
  }, []);

  async function handleLogMood(mood: typeof MOODS[0]) {
    setSelectedMood(mood.labelEn);
    try {
      await api.post("/care/mood", { moodImproved: mood.labelEn === "Radiant" || mood.labelEn === "Calm" });
      setMoodLogged(true);
      toast.success(
        language === "ta"
          ? `மனநிலை பதிவு செய்யப்பட்டது: ${mood.label.split(" ")[0]}`
          : `Mood recorded: ${mood.labelEn}`
      );
    } catch {
      setMoodLogged(true);
    }
  }

  const upcomingAppts = appointments.filter((a) => a.status === "confirmed" || a.status === "pending").slice(0, 2);

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto">
      {/* 1. Hero Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge bg-blue-500/20 text-blue-300 border border-blue-400/20 text-xs font-bold py-1 px-3">
              ✨ Mira AI Assistant
            </span>
            <div className="bg-white/10 rounded-2xl p-0.5 backdrop-blur-md">
              <LanguageSelector compact />
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {t("dash_greeting_prefix")}, {user?.fullName || "Friend"}! 👋
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            {t("dash_hero_desc")}
          </p>

          {/* Action Chips */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/candidate/ai-chat"
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{t("dash_chat_btn")}</span>
            </Link>

            <Link
              to="/candidate/music"
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              <Music className="w-4 h-4" />
              <span>{t("dash_music_btn")}</span>
            </Link>

            <Link
              to="/candidate/search"
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>{language === "ta" ? "பொதுத் தேடல்" : "Search"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Continue Chat Quick Card */}
      {lastConversation && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                {language === "ta" ? "உரையாடலைத் தொடர்க" : "Continue Conversation"}
              </p>
              <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                "{lastConversation.title}"
              </p>
            </div>
          </div>

          <Link
            to="/candidate/ai-chat"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span>{language === "ta" ? "உரையாடலைத் திற" : "Open Chat"}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 3. Daily Mood Check-In */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {t("dash_mood_title")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("dash_mood_sub")}
            </p>
          </div>
          {moodLogged && (
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              ✓ {language === "ta" ? "பதிவு செய்யப்பட்டது" : "Logged"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.labelEn}
              onClick={() => handleLogMood(m)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                selectedMood === m.labelEn
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                  : "bg-slate-50/70 border-slate-200/70 hover:bg-blue-50/60 text-slate-800"
              }`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-xs font-bold text-center">
                {language === "ta" ? m.label.split(" ")[0] : m.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Quick Feature Hub Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/candidate/ai-chat"
          className="group p-5 rounded-3xl border border-slate-200/80 bg-white hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
              {t("nav_chat")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "ta"
                ? "ChatGPT போன்ற தமிழ் உரையாடல்கள் மற்றும் நேரடி குரல் உதவியாளர்."
                : "ChatGPT-like conversational intelligence with multilingual speech recognition."}
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t("dash_chat_btn")} →
          </span>
        </Link>

        <Link
          to="/candidate/music"
          className="group p-5 rounded-3xl border border-slate-200/80 bg-white hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
              {t("nav_music")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "ta"
                ? "Spotify போன்ற மெலடி, கர்நாடகம், 90s மற்றும் புத்துணர்ச்சியூட்டும் பாடல்கள்."
                : "Spotify-like streaming with melodies, classical carnatic, 90s, and latest hits."}
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t("dash_music_btn")} →
          </span>
        </Link>

        <Link
          to="/candidate/videos"
          className="group p-5 rounded-3xl border border-slate-200/80 bg-white hover:shadow-xl hover:border-rose-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 group-hover:text-rose-600 transition-colors">
              {t("nav_videos")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "ta"
                ? "YouTube போன்ற தன்னம்பிக்கை உரைகள், கல்வி, கோடிங் மற்றும் நகைச்சுவைகள்."
                : "YouTube-like library with motivation, coding tutorials, AI, and comedy."}
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t("nav_videos")} →
          </span>
        </Link>

        <Link
          to="/candidate/memes"
          className="group p-5 rounded-3xl border border-slate-200/80 bg-white hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Smile className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
              {t("nav_memes")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === "ta"
                ? "கல்லூரி வாழ்க்கை, நண்பர்கள் மற்றும் கோடிங் நகைச்சுவைகள்."
                : "Relatable campus humor, friendship memes, and coding jokes."}
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {t("nav_memes")} →
          </span>
        </Link>
      </div>

      {/* 5. Music Spotlight & Recommended Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Music */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {language === "ta" ? "🎵 பரிந்துரைக்கப்படும் பாடல்கள்" : "🎵 Recommended Music"}
              </h3>
            </div>
            <Link to="/candidate/music" className="text-xs font-bold text-blue-600 hover:underline">
              {language === "ta" ? "அனைத்தும் →" : "View All →"}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentTracks.map((song) => (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer transition-all group"
              >
                <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-700">
                    {song.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{song.artist}</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Videos */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {language === "ta" ? "🎬 பரிந்துரைக்கப்படும் வீடியோக்கள்" : "🎬 Recommended Videos"}
              </h3>
            </div>
            <Link to="/candidate/videos" className="text-xs font-bold text-rose-600 hover:underline">
              {language === "ta" ? "அனைத்தும் →" : "View All →"}
            </Link>
          </div>

          <div className="space-y-2.5">
            {recommendedVideos.map((vid) => (
              <Link
                key={vid.id}
                to="/candidate/videos"
                className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-rose-50/60 hover:border-rose-200 transition-all group"
              >
                <img src={vid.thumbnail} alt={vid.title} className="w-16 h-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-rose-600">
                    {vid.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{vid.speaker} · {vid.duration}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Trending Memes Grid */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">
              {language === "ta" ? "😂 டிரெண்டிங் மீம்ஸ் & சிரிப்பு" : "😂 Trending Memes"}
            </h3>
          </div>
          <Link to="/candidate/memes" className="text-xs font-bold text-amber-600 hover:underline">
            {language === "ta" ? "அனைத்து மீம்களையும் பார் →" : "View All Memes →"}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {trendingMemes.map((m) => (
            <Link
              key={m.id}
              to="/candidate/memes"
              className="group rounded-2xl border border-slate-100 bg-slate-50/40 p-2.5 hover:shadow-md hover:border-amber-200 transition-all space-y-2"
            >
              <img src={m.imageUrl} alt={m.title} className="aspect-square w-full object-cover rounded-xl" />
              <p className="font-bold text-xs text-slate-900 truncate group-hover:text-amber-600">
                {m.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useMusic } from "../../context/MusicContext";
import { api } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Heart,
  Music,
  Film,
  Smile,
  Play,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

export function FavoritesPage() {
  usePageTitle("பிடித்தவை (Favorites)");
  const { playSong } = useMusic();
  const [activeTab, setActiveTab] = useState<"music" | "video" | "meme">("music");
  const [musicFavs, setMusicFavs] = useState<any[]>([]);
  const [videoFavs, setVideoFavs] = useState<any[]>([]);
  const [memeFavs, setMemeFavs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);
    try {
      const [mRes, vRes, meRes] = await Promise.all([
        api.get("/music/favorites"),
        api.get("/video/favorites").catch(() => ({ data: { favorites: [] } })),
        api.get("/memes/favorites").catch(() => ({ data: { favorites: [] } })),
      ]);
      setMusicFavs(mRes.data.favorites || []);
      setVideoFavs(vRes.data.favorites || []);
      setMemeFavs(meRes.data.favorites || []);
    } catch {
      toast.error("விருப்பங்களை ஏற்றுவதில் பிழை");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <span>❤️ என் விருப்பங்கள் (My Favorites)</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          நீங்கள் சேமித்த தமிழ் பாடல்கள், வீடியோக்கள் மற்றும் நகைச்சுவை மீம்ஸ்கள்
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("music")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "music"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>இசை ({musicFavs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("video")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "video"
              ? "bg-rose-600 text-white shadow-md shadow-rose-500/25"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>வீடியோக்கள் ({videoFavs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("meme")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "meme"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>மீம்ஸ் ({memeFavs.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "music" && (
        <div className="space-y-3">
          {musicFavs.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">
              பிடித்த பாடல்கள் எதுவும் இல்லை. இசை பக்கத்தில் ❤️ ஐகானை கிளிக் செய்து சேமிக்கவும்!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {musicFavs.map((f) => (
                <div
                  key={f._id}
                  className="card p-4 flex items-center gap-3.5 hover:shadow-md transition-shadow"
                >
                  <img
                    src={f.data?.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80"}
                    alt={f.title}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">{f.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{f.data?.artist || "Tamil Music"}</p>
                  </div>
                  <button
                    onClick={() => playSong(f.data)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "video" && (
        <div className="space-y-3">
          {videoFavs.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">
              பிடித்த வீடியோக்கள் எதுவும் இல்லை.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {videoFavs.map((f) => (
                <div key={f._id} className="card overflow-hidden">
                  <img
                    src={f.data?.thumbnail}
                    alt={f.title}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-3.5">
                    <p className="font-bold text-xs text-slate-900 truncate">{f.title}</p>
                    <p className="text-[10px] text-slate-500">{f.data?.speaker}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "meme" && (
        <div className="space-y-3">
          {memeFavs.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">
              பிடித்த மீம்ஸ்கள் எதுவும் இல்லை.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {memeFavs.map((f) => (
                <div key={f._id} className="card overflow-hidden">
                  <img
                    src={f.data?.imageUrl}
                    alt={f.title}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-bold text-xs text-slate-900">{f.title}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{f.data?.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

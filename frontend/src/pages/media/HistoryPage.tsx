import { useEffect, useState } from "react";
import { useMusic } from "../../context/MusicContext";
import { api } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Clock, Music, Film, Play } from "lucide-react";
import { formatDate } from "../../lib/utils";
import toast from "react-hot-toast";

export function HistoryPage() {
  usePageTitle("வரலாறு (Activity History)");
  const { playSong } = useMusic();
  const [activeTab, setActiveTab] = useState<"music" | "video">("music");
  const [musicHistory, setMusicHistory] = useState<any[]>([]);
  const [videoHistory, setVideoHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.all([
        api.get("/music/history"),
        api.get("/video/history").catch(() => ({ data: { history: [] } })),
      ]);
      setMusicHistory(mRes.data.history || []);
      setVideoHistory(vRes.data.history || []);
    } catch {
      toast.error("வரலாற்று பதிவுகளை ஏற்றுவதில் பிழை");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <span>🕘 செயல்பாட்டு வரலாறு (Recent History)</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          நீங்கள் சமீபத்தில் கேட்ட பாடல்கள் மற்றும் பார்த்த வீடியோக்களின் பட்டியல்
        </p>
      </div>

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
          <span>இசை வரலாறு ({musicHistory.length})</span>
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
          <span>வீடியோ வரலாறு ({videoHistory.length})</span>
        </button>
      </div>

      {activeTab === "music" && (
        <div className="space-y-3">
          {musicHistory.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">
              பாடல்கள் எதுவும் இன்னும் இயக்கப்படவில்லை.
            </div>
          ) : (
            <div className="space-y-2.5">
              {musicHistory.map((h) => (
                <div
                  key={h._id}
                  className="card p-3.5 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={h.data?.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80"}
                      alt={h.title}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{h.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{h.data?.artist} · {h.data?.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(h.playedAt)}
                    </span>
                    <button
                      onClick={() => playSong(h.data)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "video" && (
        <div className="space-y-3">
          {videoHistory.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">
              வீடியோக்கள் எதுவும் இன்னும் பார்க்கப்படவில்லை.
            </div>
          ) : (
            <div className="space-y-2.5">
              {videoHistory.map((h) => (
                <div
                  key={h._id}
                  className="card p-3.5 flex items-center justify-between gap-4 hover:border-rose-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={h.data?.thumbnail}
                      alt={h.title}
                      className="w-14 h-9 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{h.title}</p>
                      <p className="text-[11px] text-slate-500">{h.data?.speaker}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {formatDate(h.playedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

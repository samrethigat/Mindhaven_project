import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Brain,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Tag,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "../../lib/utils";

interface MemoryItem {
  _id: string;
  key: string;
  value: string;
  category: "identity" | "music" | "interest" | "language" | "general" | "preference";
  source: string;
  createdAt: string;
}

export function MemoryManager() {
  usePageTitle("AI நினைவகம் (AI Memory)");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("preference");

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);
    try {
      const res = await api.get("/ai/memories");
      setMemories(res.data.memories || []);
    } catch {
      toast.error("நினைவக தகவல்களை ஏற்றுவதில் பிழை");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) {
      toast.error("தலைப்பு மற்றும் விபரம் தேவை");
      return;
    }

    try {
      const res = await api.post("/ai/memories", {
        key: newKey.trim(),
        value: newValue.trim(),
        category: newCategory,
      });
      setMemories([res.data.memory, ...memories]);
      setShowAddModal(false);
      setNewKey("");
      setNewValue("");
      toast.success("நினைவகம் வெற்றிகரமாக சேர்க்கப்பட்டது! 🧠✨");
    } catch {
      toast.error("சேர்ப்பதில் பிழை");
    }
  }

  async function handleDeleteMemory(id: string) {
    try {
      await api.delete(`/ai/memories/${id}`);
      setMemories(memories.filter((m) => m._id !== id));
      toast.success("நினைவகம் நீக்கப்பட்டது");
    } catch {
      toast.error("நீக்குவதில் பிழை");
    }
  }

  async function handleClearAll() {
    if (!confirm("அனைத்து நினைவக தகவல்களையும் அழிக்க விரும்புகிறீர்களா?")) return;
    try {
      await api.delete("/ai/memories");
      setMemories([]);
      toast.success("அனைத்து நினைவக தகவல்களும் அழிக்கப்பட்டன");
    } catch {
      toast.error("அழிப்பதில் பிழை");
    }
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>🧠 AI நினைவக மேலாண்மை (Memory)</span>
            <span className="badge bg-purple-100 text-purple-800 text-xs font-bold">Smart Context</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            மிரா AI உங்களைப் பற்றி நினைவில் வைத்துள்ள தனிப்பட்ட விருப்பங்கள் மற்றும் விவரங்கள்
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary bg-purple-600 hover:bg-purple-700 border-none text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>நினைவகம் சேர் (Add Memory)</span>
          </button>

          {memories.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-outline text-rose-600 border-rose-200 hover:bg-rose-50 text-xs py-2 px-3"
            >
              அனைத்தையும் அழி (Clear All)
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50/60 to-indigo-50/60 p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          <span>தனியுரிமை மற்றும் நினைவக பாதுகாப்பு</span>
        </div>
        <p className="text-xs text-purple-800 leading-relaxed">
          மிரா உங்கள் தனிப்பட்ட உரையாடல்களிலிருந்து முக்கிய விவரங்களை (உதாரணமாக: பிடித்த இசை, விருப்பங்கள்) மட்டுமே நினைவில் வைத்துக்கொள்ளும். ரகசிய கடவுச்சொற்கள் அல்லது வங்கி விவரங்கள் ஒருபோதும் சேமிக்கப்படாது. நீங்கள் எப்போது வேண்டுமானாலும் இந்த நினைவகங்களை நீக்கலாம்.
        </p>
      </div>

      {/* Memories List */}
      {memories.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-purple-700 mx-auto">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">நினைவகம் காலியாக உள்ளது</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              AI உடன் பேசும்போது "எனக்கு மெலடி பாடல் பிடிக்கும் என்று நினைவில் வைத்துக்கொள்" என்று சொன்னால் தானாகவே சேமிக்கப்படும்.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary bg-purple-600 hover:bg-purple-700 border-none text-xs"
          >
            + புதிய நினைவகம் சேர்
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.map((m) => (
            <div
              key={m._id}
              className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider">
                    {m.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(m.createdAt)}
                  </span>
                </div>

                <p className="font-bold text-sm text-slate-900">{m.key}</p>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                  {m.value}
                </p>
              </div>

              <button
                onClick={() => handleDeleteMemory(m._id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>புதிய நினைவகம் சேர் (Add Memory)</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="label">தலைப்பு / பிரிவு (Key)</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. பிடித்த பாடல் வகை (Favorite Music)"
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="label">விவரம் (Value)</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. எனக்கு இளையராஜா மற்றும் ஏ.ஆர்.ரஹ்மான் மெலடி பாடல்கள் மிகவும் பிடிக்கும்"
                  className="input text-sm h-24"
                  required
                />
              </div>

              <div>
                <label className="label">வகை (Category)</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input text-sm"
                >
                  <option value="preference">விருப்பம் (Preference)</option>
                  <option value="music">இசை (Music)</option>
                  <option value="interest">ஆர்வம் (Interest)</option>
                  <option value="identity">அடையாளம் (Identity)</option>
                  <option value="language">மொழி (Language)</option>
                  <option value="general">பொது (General)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline text-xs"
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-purple-600 hover:bg-purple-700 border-none text-xs"
                >
                  சேமி (Save Memory)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

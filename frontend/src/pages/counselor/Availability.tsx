import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function CounselorAvailability() {
  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/counselor/me").then((res) => {
      setDays(res.data.user.availability?.days || []);
      setSlots(res.data.user.availability?.timeSlots || []);
      setIsOnline(res.data.user.isOnline || false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function toggleDay(d: string) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }
  function toggleSlot(s: string) {
    setSlots((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save() {
    setSaving(true);
    try {
      await api.put("/counselor/availability", { availability: { days, timeSlots: slots } });
      toast.success("Availability updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    try {
const { data } = await api.patch("/counselor/online", { isOnline: !isOnline });
      setIsOnline(data.isOnline);
      toast.success(data.isOnline ? "You are now Online" : "You are now Offline");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">Availability</h2>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Status</h3>
            <p className="text-sm text-slate-500">Patients can see if you're online.</p>
          </div>
          <button
            onClick={toggleStatus}
            className={cn("rounded-full px-4 py-2 text-sm font-bold", isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}
          >
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold">Available Days</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={cn("rounded-xl border px-4 py-2 text-sm font-medium transition-colors", days.includes(d) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold">Available Time Slots</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSlot(s)}
              className={cn("rounded-xl border px-4 py-2 text-sm font-medium transition-colors", slots.includes(s) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Save Availability"}</button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import { ShieldCheck, Info } from "lucide-react";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function CounselorAvailability() {
  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/counselor/me")
      .then((res) => {
        setDays(res.data.user.availability?.days || []);
        setSlots(res.data.user.availability?.timeSlots || []);
        setIsOnline(res.data.user.isOnline || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      toast.success("Availability updated successfully.");
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
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Counselor Availability & Scheduling</h2>
        <p className="text-sm text-slate-500">Configure your working days, consultation slots, and online presence</p>
      </div>

      <div className="card p-5 bg-teal-50/50 border border-teal-200/80 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 leading-relaxed">
          <p className="font-bold text-teal-950">Strict 5-Patient Daily Quota Policy</p>
          <p className="mt-0.5 text-teal-800">
            To prevent practitioner burnout and ensure dedicated, high-quality care, our system automatically limits bookings to a maximum of <strong>5 appointments per doctor per day</strong>. Once you reach 5 confirmed/active bookings on any given date, that date is automatically marked as fully booked for new reservations.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Live Presence Status</h3>
            <p className="text-sm text-slate-500">Patients can see if you are actively available for chats.</p>
          </div>
          <button
            onClick={toggleStatus}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm",
              isOnline ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-100 text-slate-600 border border-slate-200"
            )}
          >
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Available Working Days</h3>
          <span className="text-xs text-slate-400 font-medium">{days.length} days selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={cn(
                "rounded-xl border px-4 py-2 text-xs font-bold transition-colors",
                days.includes(d)
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-teal-300"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Available Consultation Time Slots</h3>
          <span className="text-xs text-slate-400 font-medium">{slots.length} time slots enabled</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSlot(s)}
              className={cn(
                "rounded-xl border px-4 py-2 text-xs font-bold transition-colors",
                slots.includes(s)
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-teal-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full bg-teal-600 hover:bg-teal-700 border-none py-3 text-sm font-bold shadow-md shadow-teal-600/20">
        {saving ? "Saving…" : "Save Availability Settings"}
      </button>
    </div>
  );
}

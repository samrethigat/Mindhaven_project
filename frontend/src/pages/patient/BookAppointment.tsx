import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../../components/ui/Loading";

/** Default time slots used when a counselor has not configured availability. */
const DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counselor, setCounselor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    date: "", time: "", consultationType: "online", reason: "", additionalNotes: "",
  });

  useEffect(() => {
    api.get(`/counselor/public/${id}`).then((res) => {
      setCounselor(res.data.counselor);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Use the counselor's configured time slots, falling back to defaults if none set.
  const timeSlots: string[] =
    Array.isArray(counselor?.availability?.timeSlots) && counselor.availability.timeSlots.length > 0
      ? counselor.availability.timeSlots
      : DEFAULT_TIME_SLOTS;

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/appointments", {
        counselorId: id, date: form.date, time: form.time,
        consultationType: form.consultationType, reason: form.reason, additionalNotes: form.additionalNotes,
      });
      toast.success("Appointment requested! Check your email for confirmation.");
      navigate("/patient/appointments");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Book Appointment</h2>
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {counselor?.fullName?.[0] || "C"}
          </div>
          <div>
            <p className="font-semibold">{counselor?.fullName}</p>
            <p className="text-sm text-slate-500">{counselor?.specialization} · {counselor?.qualification}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Patient Name</label>
            <input className="input" value={user?.fullName || ""} disabled />
          </div>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Date *</label>
              <input name="date" type="date" className="input" value={form.date} onChange={update} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="label">Time Slot *</label>
              <select name="time" className="input" value={form.time} onChange={update} required>
                <option value="">Select</option>
                {timeSlots.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Consultation Type</label>
            <select name="consultationType" className="input" value={form.consultationType} onChange={update}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea name="reason" className="input" value={form.reason} onChange={update} rows={3} placeholder="Briefly describe what you'd like to discuss…" />
          </div>
          <div>
            <label className="label">Additional Notes</label>
            <textarea name="additionalNotes" className="input" value={form.additionalNotes} onChange={update} rows={2} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Booking…" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

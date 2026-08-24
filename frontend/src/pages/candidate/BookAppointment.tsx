import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../../components/ui/Loading";

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
      toast.success("Appointment requested! Check your notifications and email for confirmation.");
      navigate("/candidate/appointments");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Book Consultation Appointment</h2>
        <p className="text-sm text-slate-500">Schedule a confidential 1-on-1 session with your chosen counselor</p>
      </div>

      <div className="card p-6 bg-slate-900 text-white border-none shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-2xl font-bold text-white overflow-hidden">
            {counselor?.photo ? (
              <img src={counselor.photo} alt={counselor.fullName} className="h-full w-full object-cover" />
            ) : (
              counselor?.fullName?.[0] || "C"
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{counselor?.fullName}</p>
            <p className="text-xs text-teal-300 font-medium">{counselor?.specialization} · {counselor?.qualification}</p>
            <p className="text-xs text-slate-400 mt-1">🏥 {counselor?.hospital || counselor?.clinic || "Main Campus Clinic"}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Candidate Name</label>
            <input className="input bg-slate-50 font-medium" value={user?.fullName || user?.email || ""} disabled />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Preferred Date *</label>
              <input name="date" type="date" className="input" value={form.date} onChange={update} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="label">Available Time Slot *</label>
              <select name="time" className="input" value={form.time} onChange={update} required>
                <option value="">Select Time Slot</option>
                {timeSlots.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Consultation Mode *</label>
            <select name="consultationType" className="input" value={form.consultationType} onChange={update} required>
              <option value="online">Online (Video / Voice / Chat Consultation)</option>
              <option value="offline">Offline (In-Person Clinic / Hospital Visit)</option>
            </select>
          </div>

          <div>
            <label className="label">Primary Reason for Consultation</label>
            <textarea name="reason" className="input" value={form.reason} onChange={update} rows={3} placeholder="Briefly share what you would like support with (e.g. stress, anxiety, academic pressures)…" />
          </div>

          <div>
            <label className="label">Additional Notes or Preferences</label>
            <textarea name="additionalNotes" className="input" value={form.additionalNotes} onChange={update} rows={2} placeholder="Any specific accommodations or questions for the counselor…" />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full bg-teal-600 hover:bg-teal-700 border-none py-3 text-base">
            {submitting ? "Submitting Request…" : "Confirm Appointment Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

export const CandidateBookAppointment = BookAppointment;

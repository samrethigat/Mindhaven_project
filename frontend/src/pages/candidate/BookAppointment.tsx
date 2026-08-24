import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Loading } from "../../components/ui/Loading";
import { Calendar, Clock, AlertCircle, CheckCircle2, ShieldCheck, User, Building2 } from "lucide-react";

const DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [counselor, setCounselor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "",
    consultationType: "online",
    reason: "",
    additionalNotes: "",
  });

  const [availability, setAvailability] = useState<{
    isWorkingDay: boolean;
    activeCount: number;
    maxDailyLimit: number;
    isFullyBooked: boolean;
    isAvailable: boolean;
    allSlots: string[];
    bookedSlots: string[];
    availableSlots: string[];
    statusMessage: string;
    dayOfWeek: string;
  } | null>(null);

  // Fetch counselor public profile
  useEffect(() => {
    if (!id) return;
    api
      .get(`/counselor/public/${id}`)
      .then((res) => {
        setCounselor(res.data.counselor);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch live slot and daily capacity availability from backend
  const fetchAvailability = useCallback(
    async (dateToFetch: string) => {
      if (!id || !dateToFetch) return;
      setLoadingSlots(true);
      try {
        const res = await api.get(`/appointments/counselor/${id}/availability`, {
          params: { date: dateToFetch },
        });
        setAvailability(res.data);
      } catch (err) {
        console.error("Failed to load doctor availability:", err);
      } finally {
        setLoadingSlots(false);
      }
    },
    [id]
  );

  // Initial and on-date-change availability fetch
  useEffect(() => {
    if (form.date) {
      fetchAvailability(form.date);
    }
  }, [form.date, fetchAvailability]);

  // Real-time socket updates for concurrent bookings across multiple tabs / users
  useEffect(() => {
    if (!socket || !id) return;

    const handleAvailabilityChange = (data: { counselorId: string; dateStr: string }) => {
      if (data.counselorId === id && data.dateStr === form.date) {
        fetchAvailability(form.date);
      }
    };

    socket.on("appointment:availability-changed", handleAvailabilityChange);
    return () => {
      socket.off("appointment:availability-changed", handleAvailabilityChange);
    };
  }, [socket, id, form.date, fetchAvailability]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    setForm((prev) => ({ ...prev, date: newDate, time: "" }));
  }

  function handleSlotSelect(slotTime: string) {
    if (availability?.bookedSlots.includes(slotTime) || availability?.isFullyBooked) {
      return;
    }
    setForm((prev) => ({ ...prev, time: slotTime }));
  }

  function updateField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.date) {
      toast.error("Please choose an appointment date.");
      return;
    }
    if (!form.time) {
      toast.error("Please choose an available time slot.");
      return;
    }
    if (availability?.isFullyBooked) {
      toast.error("This doctor is fully booked for this date. Please choose another doctor or date.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/appointments", {
        counselorId: id,
        date: form.date,
        time: form.time,
        consultationType: form.consultationType,
        reason: form.reason,
        additionalNotes: form.additionalNotes,
      });

      toast.success("Appointment booked successfully.");
      navigate("/candidate/appointments");
    } catch (err: any) {
      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.error || getErrorMessage(err);
      const reason = err?.response?.data?.reason;

      if (status === 409 || reason === "SLOT_OCCUPIED") {
        if (reason === "DAILY_LIMIT_REACHED" || errorMsg.includes("fully booked")) {
          toast.error("This doctor is fully booked for this date. Please choose another doctor or date.");
        } else {
          toast.error("This slot was just booked by another patient. Please choose another available time.");
        }
      } else {
        toast.error(errorMsg);
      }

      // Re-sync with database state immediately
      if (form.date) {
        setForm((prev) => ({ ...prev, time: "" }));
        fetchAvailability(form.date);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;

  const allSlots = availability?.allSlots || DEFAULT_TIME_SLOTS;
  const activeCount = availability?.activeCount || 0;
  const maxLimit = availability?.maxDailyLimit || 5;
  const isFullyBooked = availability?.isFullyBooked || activeCount >= maxLimit;
  const isWorkingDay = availability ? availability.isWorkingDay : true;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Book Consultation Appointment</h2>
          <p className="text-sm text-slate-500">Secure real-time slot reservation with direct doctor schedule validation</p>
        </div>
        <Link to="/candidate/counselors" className="btn-outline text-xs py-1.5 px-3">
          ← Back to Doctors
        </Link>
      </div>

      {/* Doctor Summary Card */}
      <div className="card p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white border-none shadow-xl rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-2xl font-bold text-white shadow-lg overflow-hidden border border-teal-400/30">
              {counselor?.photo ? (
                <img src={counselor.photo} alt={counselor.fullName} className="h-full w-full object-cover" />
              ) : (
                counselor?.fullName?.[0] || "D"
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-white">{counselor?.fullName}</p>
                <span className="badge bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px]">
                  Verified Doctor
                </span>
              </div>
              <p className="text-xs text-teal-300 font-semibold mt-0.5">
                {counselor?.specialization} · {counselor?.qualification}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  {counselor?.hospital || counselor?.clinic || "Campus Wellness Center"}
                </span>
                <span>•</span>
                <span>💼 {counselor?.experience} yrs exp</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-3 border border-slate-700/50 text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Daily Booking Limit</p>
            <p className="text-sm font-bold text-teal-300">Max 5 Patients / Day</p>
          </div>
        </div>
      </div>

      {/* Booking Form Card */}
      <div className="card p-6 sm:p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Details */}
          <div>
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Name</label>
            <div className="relative">
              <input
                className="input bg-slate-50 font-semibold text-slate-800"
                value={user?.fullName || user?.email || ""}
                disabled
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Date Picker & Capacity Monitor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Select Appointment Date *
              </label>
              {availability && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isFullyBooked
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : activeCount > 0
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {isFullyBooked
                    ? "🔴 Fully Booked (5/5)"
                    : `🟢 Capacity: ${activeCount} / ${maxLimit} Booked`}
                </span>
              )}
            </div>

            <input
              name="date"
              type="date"
              className="input text-sm font-semibold"
              value={form.date}
              onChange={handleDateChange}
              required
              min={new Date().toISOString().split("T")[0]}
            />

            {/* Daily Capacity Meter Bar */}
            {availability && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Doctor Daily Patient Capacity ({form.date}):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeCount} of {maxLimit} Slots Booked
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFullyBooked ? "bg-rose-500" : activeCount >= 4 ? "bg-amber-500" : "bg-teal-500"
                    }`}
                    style={{ width: `${Math.min(100, (activeCount / maxLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Availability Status Banners */}
          {availability && !isWorkingDay && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Doctor Not Available on {availability.dayOfWeek}</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Dr. {counselor?.fullName} is not scheduled for consultations on this day of the week. Please select another date.
                </p>
              </div>
            </div>
          )}

          {availability && isWorkingDay && isFullyBooked && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Doctor is Fully Booked for this Date</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  This doctor has reached the maximum daily limit of 5 patient appointments for {form.date}. Please select another doctor or pick a different date.
                </p>
              </div>
            </div>
          )}

          {/* Time Slot Selection Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Available Time Slots *
              </label>
              {loadingSlots && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-teal-600"></span>
                  Checking live slots...
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-12 bg-slate-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : !isWorkingDay || isFullyBooked ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                No slots available for booking on this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {allSlots.map((slotTime: string) => {
                  const isBooked = availability?.bookedSlots.includes(slotTime);
                  const isSelected = form.time === slotTime;

                  return (
                    <button
                      key={slotTime}
                      type="button"
                      disabled={isBooked || isFullyBooked}
                      onClick={() => handleSlotSelect(slotTime)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                        isBooked
                          ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-[1.02]"
                          : "bg-white border-slate-200/80 text-slate-700 hover:border-teal-500 hover:bg-teal-50/40"
                      }`}
                    >
                      <span className="text-sm tracking-wide">{slotTime}</span>
                      <span className="text-[10px] font-normal mt-0.5">
                        {isBooked ? "🔒 Booked" : isSelected ? "✓ Selected" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mode of Consultation */}
          <div>
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Mode *</label>
            <select
              name="consultationType"
              className="input text-sm font-semibold"
              value={form.consultationType}
              onChange={updateField}
              required
            >
              <option value="online">🌐 Online Video / Voice Session</option>
              <option value="offline">🏥 In-Person Campus / Hospital Visit</option>
            </select>
          </div>

          {/* Reason for Consultation */}
          <div>
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider">
              Primary Reason for Consultation
            </label>
            <textarea
              name="reason"
              className="input text-sm"
              value={form.reason}
              onChange={updateField}
              rows={3}
              placeholder="Briefly describe what you'd like guidance on (e.g. stress, anxiety, academic pressures, wellness)..."
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="label text-xs font-bold text-slate-700 uppercase tracking-wider">
              Additional Notes or Accommodations
            </label>
            <textarea
              name="additionalNotes"
              className="input text-sm"
              value={form.additionalNotes}
              onChange={updateField}
              rows={2}
              placeholder="Any specific requests or background details for the doctor..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || isFullyBooked || !isWorkingDay || !form.time}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                isFullyBooked || !isWorkingDay || !form.time
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : submitting
                  ? "bg-teal-700 text-white cursor-wait"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-[0.99]"
              }`}
            >
              {submitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Securing Appointment...
                </>
              ) : isFullyBooked ? (
                "Doctor Fully Booked for this Date"
              ) : !isWorkingDay ? (
                "Doctor Not Available on this Date"
              ) : !form.time ? (
                "Please Select an Available Time Slot"
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirm Appointment Booking ({form.time})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const CandidateBookAppointment = BookAppointment;

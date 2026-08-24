import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Calendar,
  Clock,
  User,
  HeartHandshake,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

export function ParentAppointments() {
  const { language } = useLanguage();
  usePageTitle(language === "ta" ? "ஆலோசனை அமர்வுகள்" : "Counseling Appointments");

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const res = await api.get("/parent/appointments");
      setAppointments(res.data.appointments || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {language === "ta" ? "மாணவர் ஆலோசனை அமர்வுகள்" : "Student Counseling Appointments"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "ta"
            ? "மாணவர் ஒப்புதலின் கீழ் பகிரப்பட்ட திட்டமிடப்பட்ட ஆலோசனை அமர்வுகள்"
            : "Authorized scheduled counseling sessions for linked students"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card p-10 bg-white border border-slate-200/80 rounded-3xl text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-slate-900">
            {language === "ta" ? "அமர்வுகள் எதுவும் இல்லை" : "No Appointments Scheduled"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {language === "ta"
              ? "மாணவர் முன்பதிவு செய்த ஆலோசனை அமர்வுகள் ஒப்புதல் அளிக்கப்படும் போது இங்கே தோன்றும்."
              : "When your linked student books authorized counseling sessions, they will be visible here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((appt: any) => {
            const isConfirmed = appt.status === "confirmed";
            const isPending = appt.status === "pending";
            const isCancelled = appt.status === "cancelled";

            return (
              <div
                key={appt._id}
                className="card p-5 sm:p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-sm border border-slate-200">
                        {appt.candidate?.fullName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{appt.candidate?.fullName || "Student"}</h4>
                        <p className="text-[11px] text-slate-500">{appt.appointmentId || "Session"}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isConfirmed
                          ? "bg-emerald-100 text-emerald-700"
                          : isPending
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  {/* Counselor & Time */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl mb-4">
                    <p className="flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        Counselor: <strong>{appt.counselor?.fullName || "Campus Counselor"}</strong>
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{new Date(appt.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Time Slot: {appt.time || "Scheduled"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      {appt.consultationType === "online" ? (
                        <Video className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className="capitalize">{appt.consultationType || "Online"} Consultation</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>Specialization: {appt.counselor?.specialization || "Psychological Wellness"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

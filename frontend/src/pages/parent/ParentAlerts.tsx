import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Clock,
  HeartHandshake,
  PhoneCall,
  Info,
  Filter,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

export function ParentAlerts() {
  const { language } = useLanguage();
  usePageTitle(language === "ta" ? "நல்வாழ்வு எச்சரிக்கைகள்" : "Wellbeing Alerts");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  async function fetchAlerts() {
    try {
      setLoading(true);
      const res = await api.get("/parent/alerts");
      setAlerts(res.data.alerts || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function handleAcknowledge(alertId: string) {
    try {
      await api.post(`/parent/alerts/${alertId}/acknowledge`);
      toast.success(language === "ta" ? "எச்சரிக்கை உறுதிப்படுத்தப்பட்டது" : "Alert acknowledged");
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, status: "acknowledged" } : a))
      );
    } catch (err: any) {
      toast.error("Failed to acknowledge alert");
    }
  }

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "ALL") return true;
    return a.level === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === "ta" ? "மாணவர் நல்வாழ்வு எச்சரிக்கைகள்" : "Student Well-being Alerts"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === "ta"
              ? "நெறிமுறை சார்ந்த வழிகாட்டல் மற்றும் ஆதரவு குறிகாட்டிகள்"
              : "Ethical, non-diagnostic indicators and suggested parental actions"}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start">
          {["ALL", "CRITICAL", "HIGH", "MODERATE"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === lvl
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Ethical Guidance Card */}
      <div className="card p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">
            {language === "ta" ? "பெற்றோருக்கான மருத்துவமற்ற நெறிமுறை வழிகாட்டல்:" : "Ethical Non-Diagnostic Platform Notice:"}
          </span>{" "}
          {language === "ta"
            ? "இந்த எச்சரிக்கைகள் எந்தவொரு மருத்துவ நோயறிதலையும் குறிக்கவில்லை. உணர்ச்சிவசப்பட்ட மன அழுத்தம் அல்லது சோர்வு கண்டறியப்பட்டால் குடும்ப ஆதரவை எளிதாக்குவதே இதன் நோக்கம்."
            : "These alerts do not constitute clinical medical or psychological diagnoses. They highlight possible emotional stress or crisis indicators so you can check in gently and offer compassionate family support."}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card p-10 bg-white border border-slate-200/80 rounded-3xl text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-slate-900">
            {language === "ta" ? "செயலில் எச்சரிக்கைகள் எதுவும் இல்லை" : "No Active Alerts Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {language === "ta"
              ? "உங்கள் இணைக்கப்பட்ட மாணவர்களுக்கான மனநல குறிகாட்டிகள் அனைத்தும் சாதாரணமாக உள்ளன."
              : "All well-being signals for your linked students appear healthy and within normal parameters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => {
            const isCritical = alert.level === "CRITICAL";
            const isHigh = alert.level === "HIGH";
            const isAcknowledged = alert.status === "acknowledged";

            return (
              <div
                key={alert._id}
                className={`card p-5 sm:p-6 bg-white rounded-3xl border transition-all ${
                  isCritical
                    ? "border-rose-300 shadow-rose-100"
                    : isHigh
                    ? "border-amber-300 shadow-amber-50"
                    : "border-slate-200"
                } shadow-sm`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCritical
                            ? "bg-rose-100 text-rose-700"
                            : isHigh
                            ? "bg-amber-100 text-amber-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {alert.level} LEVEL
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {new Date(alert.detectedAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">{alert.title}</h3>

                    {alert.student && (
                      <p className="text-xs font-semibold text-slate-600">
                        Student: <span className="text-slate-900">{alert.student.fullName}</span> ({alert.student.candidateId || alert.student.department})
                      </p>
                    )}

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700">
                      <p className="font-semibold text-slate-900 mb-1">{alert.message}</p>
                      <p className="text-slate-500">
                        <span className="font-bold text-amber-700">Recommended Step:</span> {alert.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                    {!isAcknowledged ? (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Acknowledged
                      </span>
                    )}

                    <Link
                      to="/parent/counselors"
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                      <span>Contact Counselor</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

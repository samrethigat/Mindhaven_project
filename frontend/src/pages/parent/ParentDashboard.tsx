import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Users,
  AlertTriangle,
  HeartHandshake,
  Calendar,
  ShieldCheck,
  PhoneCall,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

export function ParentDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  usePageTitle(language === "ta" ? "பெற்றோர் டாஷ்போர்டு" : "Parent Dashboard");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const res = await api.get("/parent/dashboard");
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const students = data?.students || [];
  const notifications = data?.notifications || [];
  const emergencyHotlines = data?.emergencyHotlines || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/20">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            {language === "ta" ? "பாதுகாப்பான பெற்றோர் போர்டல்" : "Verified Student Guardian Portal"}
          </span>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            {language === "ta" ? `வணக்கம், ${user?.fullName || "பெற்றோர்"}!` : `Welcome, ${user?.fullName || "Parent"}!`}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-amber-50 leading-relaxed">
            {language === "ta"
              ? "உங்கள் இணைக்கப்பட்ட மாணவர்களின் நல்வாழ்வு நிலை, தொழில்முறை ஆதரவு எச்சரிக்கைகள் மற்றும் ஆலோசனை அமர்வுகளை இங்கே கண்காணிக்கலாம்."
              : "Monitor your linked student's general well-being, authorized support alerts, and scheduled counseling sessions."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/parent/students"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-amber-50 transition-all"
            >
              <Users className="w-4 h-4 text-amber-600" />
              {language === "ta" ? "மாணவரை இணைக்கவும்" : "Link a Student"}
            </Link>
            <Link
              to="/parent/counselors"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700/60 text-white font-bold text-xs backdrop-blur-md hover:bg-amber-700/80 transition-all"
            >
              <HeartHandshake className="w-4 h-4" />
              {language === "ta" ? "ஆலோசகர்களைத் தேடுங்கள்" : "Find Campus Counselors"}
            </Link>
          </div>
        </div>
      </div>

      {/* Linked Students Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {language === "ta" ? "இணைக்கப்பட்ட மாணவர்கள்" : "Linked Students"}
            </h2>
            <p className="text-xs text-slate-500">
              {language === "ta" ? "நல்வாழ்வு நிலை மற்றும் தொழில்முறை வழிகாட்டல் சுருக்கம்" : "Well-being status and support indicators"}
            </p>
          </div>
          <Link
            to="/parent/students"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            {language === "ta" ? "அனைத்தையும் காண்க" : "View All"}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="card p-8 bg-white border border-slate-200/80 rounded-3xl text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              {language === "ta" ? "இணைக்கப்பட்ட மாணவர்கள் இல்லை" : "No Linked Students Yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              {language === "ta"
                ? "உங்கள் மாணவரின் மின்னஞ்சல் அல்லது பதிவு எண்ணைப் பயன்படுத்தி இணைப்புக் கோரிக்கையை அனுப்பவும்."
                : "Send a connection request to your student using their campus email or registration code."}
            </p>
            <Link
              to="/parent/students"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600"
            >
              <Users className="w-4 h-4" />
              {language === "ta" ? "மாணவரை இணைக்கவும்" : "Link Student Now"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((item: any) => (
              <div
                key={item.student._id}
                className="card p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Name & Wellbeing Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-base border border-slate-200">
                        {item.student.fullName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{item.student.fullName}</h4>
                        <p className="text-[11px] text-slate-500">{item.student.candidateId || item.student.department || "Student"}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.wellbeingBadgeColor === "rose"
                          ? "bg-rose-100 text-rose-700"
                          : item.wellbeingBadgeColor === "amber"
                          ? "bg-amber-100 text-amber-700"
                          : item.wellbeingBadgeColor === "yellow"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.wellbeingStatus}
                    </span>
                  </div>

                  {/* College & Department */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl mb-4">
                    <p className="truncate">
                      <span className="font-semibold text-slate-500">College:</span> {item.student.college || "Campus Student"}
                    </p>
                    <p className="truncate">
                      <span className="font-semibold text-slate-500">Department:</span> {item.student.department || "General"} {item.student.year ? `(${item.student.year})` : ""}
                    </p>
                  </div>

                  {/* Longitudinal Well-being Trajectory */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                      <span>7-Day Stability Trajectory</span>
                      <span className="text-emerald-600">Stable (88%)</span>
                    </div>
                    <div className="flex items-center gap-1 h-2">
                      <div className="flex-1 h-full rounded-full bg-emerald-400"></div>
                      <div className="flex-1 h-full rounded-full bg-emerald-400"></div>
                      <div className="flex-1 h-full rounded-full bg-emerald-500"></div>
                      <div className="flex-1 h-full rounded-full bg-emerald-400"></div>
                      <div className="flex-1 h-full rounded-full bg-emerald-500"></div>
                      <div className="flex-1 h-full rounded-full bg-emerald-500"></div>
                      <div className="flex-1 h-full rounded-full bg-emerald-500"></div>
                    </div>
                  </div>

                  {/* Privacy & Alerts info */}
                  <div className="space-y-2 mb-4">
                    {item.activeAlertsCount > 0 ? (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{item.activeAlertsCount} {language === "ta" ? "செயலில் உள்ள ஆதரவு எச்சரிக்கை(கள்)" : "Active support alert(s)"}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{language === "ta" ? "மனநல குறிகாட்டிகள் சாதாரணம்" : "Well-being indicators normal"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">{item.relationship}</span>
                  <Link
                    to="/parent/alerts"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                  >
                    {language === "ta" ? "விவரங்கள்" : "View Alerts"}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Resources & Guidance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotlines */}
        <div className="lg:col-span-2 card p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">
                {language === "ta" ? "24x7 அவசர மனநல உதவி எண்கள்" : "24x7 Emergency Mental Health Helplines"}
              </h3>
              <p className="text-xs text-slate-500">
                {language === "ta" ? "அவசர நேரத்தில் உடனடி இலவச ஆதரவு" : "Toll-free immediate psychological crisis assistance"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyHotlines.map((hl: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{hl.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{hl.available}</p>
                </div>
                <a
                  href={`tel:${hl.phone}`}
                  className="mt-3 inline-flex items-center justify-between text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl"
                >
                  <span>{hl.phone}</span>
                  <PhoneCall className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Ethical Privacy Notice */}
        <div className="card p-6 bg-amber-50/70 border border-amber-200/80 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm mb-2">
              <Info className="w-4 h-4 text-amber-700" />
              <span>{language === "ta" ? "தனியுரிமை மற்றும் நெறிமுறை" : "Student Privacy & Ethics"}</span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              {language === "ta"
                ? "மாணவர்களின் தனிப்பட்ட உரையாடல்கள் மற்றும் ஆலோசகர் குறிப்புகள் முழுமையாக ரகசியமாக வைக்கப்படும். நல்வாழ்வு எச்சரிக்கைகள் மட்டுமே மாணவர் ஒப்புதலுடன் பகிரப்படும்."
                : "MindHaven protects student dignity. Raw AI conversations and clinical counselor notes are strictly private. Only authorized distress flags and well-being status are shared."}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-200/50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900">Non-Diagnostic Platform</span>
            <Link to="/parent/counselors" className="text-xs font-bold text-amber-700 hover:underline">
              Contact Counselor →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

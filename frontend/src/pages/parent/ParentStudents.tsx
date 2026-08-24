import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hash,
  Send,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export function ParentStudents() {
  const { language } = useLanguage();
  usePageTitle(language === "ta" ? "இணைக்கப்பட்ட மாணவர்கள்" : "Linked Students");

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    studentEmail: "",
    studentId: "",
    relationship: "Father",
  });

  async function fetchLinks() {
    try {
      setLoading(true);
      const res = await api.get("/parent/students");
      setLinks(res.data.links || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load linked students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLinks();
  }, []);

  async function handleLinkRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentEmail.trim() && !form.studentId.trim()) {
      return toast.error("Please enter student email or Candidate ID");
    }

    setSubmitting(true);
    try {
      const res = await api.post("/parent/link/request", form);
      toast.success(res.data.message || "Link request sent to student! 🎉");
      setModalOpen(false);
      setForm({ studentEmail: "", studentId: "", relationship: "Father" });
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send link request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === "ta" ? "இணைக்கப்பட்ட மாணவர்கள் மேலாண்மை" : "Linked Students Management"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === "ta"
              ? "மாணவர் கணக்குகளை இணைக்கவும் மற்றும் அனுமதிகளைக் காணவும்"
              : "Manage student connections, link invitations, and authorization status"}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:bg-amber-600 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === "ta" ? "மாணவரை இணைக்க கோரிக்கை" : "Request Student Link"}</span>
        </button>
      </div>

      {/* Linked List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : links.length === 0 ? (
        <div className="card p-10 bg-white border border-slate-200/80 rounded-3xl text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-slate-900">
            {language === "ta" ? "இணைக்கப்பட்ட மாணவர்கள் இல்லை" : "No Linked Students Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {language === "ta"
              ? "உங்கள் மாணவரின் கணக்கை இணைக்க 'Request Student Link' பொத்தானைக் கிளிக் செய்யவும்."
              : "Click the request button to connect with your student using their email or Candidate ID."}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 hover:bg-amber-600"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === "ta" ? "இணைக்கத் தொடங்குங்கள்" : "Link Student Now"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: any) => {
            const student = link.student || {};
            const isAccepted = link.status === "accepted";
            const isPending = link.status === "pending";
            const isRejected = link.status === "rejected";

            return (
              <div
                key={link._id}
                className="card p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-base border border-slate-200">
                        {student.fullName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{student.fullName || "Student User"}</h4>
                        <p className="text-[11px] text-slate-500">{student.email || student.candidateId}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isAccepted
                          ? "bg-emerald-100 text-emerald-700"
                          : isPending
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isAccepted && <CheckCircle className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      {isRejected && <XCircle className="w-3 h-3" />}
                      {link.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl mb-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Relationship:</span>
                      <span className="font-bold text-slate-800">{link.relationship}</span>
                    </div>
                    {student.college && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">College:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{student.college}</span>
                      </div>
                    )}
                    {student.department && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Department:</span>
                        <span className="font-bold text-slate-800">{student.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Privacy settings summary */}
                  <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                    <p className="font-bold text-slate-700 mb-1">Student Permissions Granted:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <span className={link.privacySettings?.shareAlerts ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        ✓ Support Alerts
                      </span>
                      <span className={link.privacySettings?.shareAppointments ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        ✓ Appointments
                      </span>
                      <span className={link.privacySettings?.shareGeneralWellbeing ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        ✓ Wellbeing Score
                      </span>
                      <span className="text-slate-400 line-through">
                        Private Chat Logs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Requested: {new Date(link.requestedAt || link.createdAt).toLocaleDateString()}</span>
                  {link.linkingCode && isPending && (
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Code: {link.linkingCode}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Link Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 bg-white border border-slate-200 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {language === "ta" ? "மாணவர் இணைப்புக் கோரிக்கை" : "Request Student Connection"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {language === "ta"
                ? "மாணவரின் கல்லூரி மின்னஞ்சல் அல்லது பதிவு எண்ணை உள்ளிடவும். மாணவர் ஒப்புதல் அளித்தவுடன் இணைப்பு செயல்படும்."
                : "Enter the student's registered email or Candidate ID. The link will become active once the student accepts."}
            </p>

            <form onSubmit={handleLinkRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {language === "ta" ? "மாணவர் மின்னஞ்சல்" : "Student Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={form.studentEmail}
                    onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
                    placeholder="student@college.edu"
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              <div className="text-center text-[10px] font-bold text-slate-400 uppercase">OR</div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {language === "ta" ? "மாணவர் ஐடி / பதிவு எண்" : "Candidate ID / Register Number"}
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    placeholder="CND-123456"
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {language === "ta" ? "உறவுமுறை" : "Your Relationship to Student"}
                </label>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className="input text-xs sm:text-sm w-full"
                >
                  <option value="Father">Father (தந்தை)</option>
                  <option value="Mother">Mother (தாய்)</option>
                  <option value="Guardian">Guardian (பாதுகாவலர்)</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Sending..." : "Send Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

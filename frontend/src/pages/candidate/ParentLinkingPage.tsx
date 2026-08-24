import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Users,
  HeartHandshake,
  CheckCircle,
  XCircle,
  Shield,
  Lock,
  Clock,
  Trash2,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

export function ParentLinkingPage() {
  const { language } = useLanguage();
  usePageTitle(language === "ta" ? "பெற்றோர் இணைப்பு & தனியுரிமை" : "Parent Linking & Privacy");

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [privacyForm, setPrivacyForm] = useState({
    shareAlerts: true,
    shareAppointments: true,
    shareGeneralWellbeing: true,
    shareCounselorInfo: true,
  });

  async function fetchLinks() {
    try {
      setLoading(true);
      const res = await api.get("/candidate/parent-links");
      setLinks(res.data.links || []);
    } catch (err: any) {
      toast.error("Failed to load parent links");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLinks();
  }, []);

  async function handleApprove(linkId: string) {
    try {
      await api.post(`/candidate/parent-links/${linkId}/approve`);
      toast.success(language === "ta" ? "பெற்றோர் இணைப்பு அங்கீகரிக்கப்பட்டது! 🎉" : "Parent link approved! 🎉");
      fetchLinks();
    } catch (err: any) {
      toast.error("Failed to approve link");
    }
  }

  async function handleReject(linkId: string) {
    try {
      await api.post(`/candidate/parent-links/${linkId}/reject`);
      toast.success("Link request declined");
      fetchLinks();
    } catch (err: any) {
      toast.error("Failed to decline link");
    }
  }

  async function handleRevoke(linkId: string) {
    if (!confirm(language === "ta" ? "இந்த இணைப்பை ரத்து செய்ய விரும்புகிறீர்களா?" : "Are you sure you want to revoke this parent connection?")) return;
    try {
      await api.post(`/candidate/parent-links/${linkId}/revoke`);
      toast.success("Parent link revoked");
      fetchLinks();
    } catch (err: any) {
      toast.error("Failed to revoke link");
    }
  }

  function openPrivacyModal(link: any) {
    setEditingLink(link);
    setPrivacyForm({
      shareAlerts: link.privacySettings?.shareAlerts ?? true,
      shareAppointments: link.privacySettings?.shareAppointments ?? true,
      shareGeneralWellbeing: link.privacySettings?.shareGeneralWellbeing ?? true,
      shareCounselorInfo: link.privacySettings?.shareCounselorInfo ?? true,
    });
  }

  async function handleSavePrivacy(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLink) return;
    try {
      await api.put(`/candidate/parent-links/${editingLink._id}/privacy`, privacyForm);
      toast.success(language === "ta" ? "தனியுரிமை அமைப்புகள் புதுப்பிக்கப்பட்டன! 🎉" : "Privacy settings updated! 🎉");
      setEditingLink(null);
      fetchLinks();
    } catch (err: any) {
      toast.error("Failed to update privacy settings");
    }
  }

  const pendingRequests = links.filter((l) => l.status === "pending");
  const activeLinks = links.filter((l) => l.status === "accepted");

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {language === "ta" ? "பெற்றோர் இணைப்பு & தனியுரிமை அமைப்புகள்" : "Parent Linking & Privacy Controls"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "ta"
            ? "உங்கள் குடும்பத்துடன் இணைக்கவும், உங்கள் தகவலின் மீதான முழு கட்டுப்பாட்டை வைத்திருக்கவும்"
            : "Manage parent connections and maintain full granular control over what information is shared"}
        </p>
      </div>

      {/* Strict Privacy Guarantee Banner */}
      <div className="card p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
          <Shield className="w-5 h-5" />
        </div>
        <div className="text-xs text-blue-950 leading-relaxed">
          <span className="font-black">
            {language === "ta" ? "மாணவர் தனியுரிமை உறுதிமொழி:" : "Student Privacy Guarantee:"}
          </span>{" "}
          {language === "ta"
            ? "உங்கள் AI உரையாடல் பதிவுகள், ரகசிய அரட்டைகள் மற்றும் ஆலோசகர் குறிப்புகள் பெற்றோருடன் பகிரப்படாது. மாணவரின் அனுமதியுடன் பொதுவான நல்வாழ்வு மற்றும் அவசர எச்சரிக்கைகள் மட்டுமே பகிரப்படும்."
            : "Your private AI conversation logs, chat history, and clinical counselor notes are 100% confidential and NEVER accessible to parents. You decide which well-being indicators to share below."}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{language === "ta" ? "நிலுவையில் உள்ள பெற்றோர் கோரிக்கைகள்" : "Pending Parent Requests"}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((link) => (
              <div
                key={link._id}
                className="card p-5 bg-white border-2 border-amber-200 rounded-3xl shadow-sm space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-base">
                    {link.parent?.fullName?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{link.parent?.fullName || "Parent User"}</h3>
                    <p className="text-xs text-slate-500">{link.relationship} • {link.parent?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(link._id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{language === "ta" ? "ஏற்றுக்கொள்" : "Approve Link"}</span>
                  </button>
                  <button
                    onClick={() => handleReject(link._id)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{language === "ta" ? "நிராகரி" : "Decline"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Links */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-teal-600" />
          <span>{language === "ta" ? "செயலில் உள்ள பெற்றோர் இணைப்புகள்" : "Connected Parent Accounts"}</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : activeLinks.length === 0 ? (
          <div className="card p-8 bg-white border border-slate-200/80 rounded-3xl text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              {language === "ta" ? "இணைக்கப்பட்ட பெற்றோர் கணக்குகள் இல்லை" : "No Active Parent Connections"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {language === "ta"
                ? "உங்கள் பெற்றோர் இணைப்புக் கோரிக்கை அனுப்பியவுடன் இங்கே தோன்றும்."
                : "When your parent creates an account and sends a request, it will appear here for your approval."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLinks.map((link) => (
              <div
                key={link._id}
                className="card p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-base border border-teal-200">
                        {link.parent?.fullName?.charAt(0) || "P"}
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">{link.parent?.fullName || "Parent"}</h3>
                        <p className="text-xs text-slate-500">{link.relationship} • {link.parent?.phone || link.parent?.email}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Connected
                    </span>
                  </div>

                  {/* Permissions Summary */}
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl mb-3">
                    <p className="font-bold text-slate-700 mb-1">Sharing Permissions:</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span className={link.privacySettings?.shareAlerts ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        {link.privacySettings?.shareAlerts ? "✓" : "✕"} Support Alerts
                      </span>
                      <span className={link.privacySettings?.shareAppointments ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        {link.privacySettings?.shareAppointments ? "✓" : "✕"} Appointments
                      </span>
                      <span className={link.privacySettings?.shareGeneralWellbeing ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        {link.privacySettings?.shareGeneralWellbeing ? "✓" : "✕"} Wellbeing Score
                      </span>
                      <span className="text-slate-400 line-through">
                        Private Chat Logs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openPrivacyModal(link)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize Privacy</span>
                  </button>

                  <button
                    onClick={() => handleRevoke(link._id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 p-1.5 rounded-xl hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Customization Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 bg-white border border-slate-200 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {language === "ta" ? "தனியுரிமை அனுமதிகள்" : "Privacy & Sharing Permissions"}
                </h3>
              </div>
              <button
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {language === "ta"
                ? `${editingLink.parent?.fullName} உடன் நீங்கள் பகிர்ந்து கொள்ள விரும்பும் தகவல்களைத் தேர்வு செய்யவும்.`
                : `Select what information you feel comfortable sharing with ${editingLink.parent?.fullName}.`}
            </p>

            <form onSubmit={handleSavePrivacy} className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Support Alerts</span>
                  <span className="text-[10px] text-slate-500">Allow parents to receive notifications on high emotional distress</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyForm.shareAlerts}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, shareAlerts: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Appointments</span>
                  <span className="text-[10px] text-slate-500">Share date & time of campus counseling sessions</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyForm.shareAppointments}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, shareAppointments: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Wellbeing Status</span>
                  <span className="text-[10px] text-slate-500">Share general overall wellness status (Normal / Support Recommended)</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyForm.shareGeneralWellbeing}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, shareGeneralWellbeing: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded"
                />
              </label>

              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-900 flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Private AI Chats & Notes</span>
                </span>
                <span className="text-[10px] font-bold uppercase bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded">Always Locked</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 hover:bg-teal-700 active:scale-95"
                >
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

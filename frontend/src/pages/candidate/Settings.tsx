import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../context/LanguageContext";
import { api, getErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Globe, Check, Shield, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

export function CandidateSettings() {
  const { user, setUser, logout } = useAuth();
  const { language, setLanguage, t, currentLanguageObj } = useLanguage();

  usePageTitle(`Settings - ${currentLanguageObj.nativeName}`);

  const [form, setForm] = useState<any>({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    college: user?.college || "",
    department: user?.department || "",
  });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/candidate/me", form);
      setUser({ ...user, ...data.user });
      toast.success(language === "ta" ? "சுயவிவரம் புதுப்பிக்கப்பட்டது" : "Profile updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPass(true);
    try {
      await api.put("/candidate/change-password", passForm);
      toast.success(language === "ta" ? "கடவுச்சொல் மாற்றப்பட்டது" : "Password changed successfully");
      setPassForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPass(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">{t("nav_settings")}</h2>
        <p className="text-sm text-slate-500">
          {language === "ta"
            ? "உங்கள் சுயவிவரம், மொழி தேர்வு மற்றும் கணக்கு அமைப்புகளை நிர்வகியுங்கள்"
            : "Manage your profile, preferred language, and account security"}
        </p>
      </div>

      {/* 1. Language Preference Section */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-purple-50/70 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{t("language_title")}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{t("language_sub")}</p>
            </div>
          </div>
          <span className="badge bg-blue-100 text-blue-800 text-xs font-bold font-mono">
            {currentLanguageObj.flag} {currentLanguageObj.nativeName}
          </span>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{lang.flag}</span>
                  <div className="text-left truncate">
                    <p className="truncate">{lang.nativeName}</p>
                    <p className={`text-[10px] ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                      {lang.name}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. User Profile Card */}
      <div className="card p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-2xl font-bold text-teal-700 overflow-hidden shadow-sm">
            {user?.photo ? (
              <img src={user.photo} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.[0] || user?.email?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            {user?.candidateId && (
              <span className="inline-block mt-1 badge bg-teal-50 text-teal-700 text-xs font-mono font-bold">
                ID: {user.candidateId}
              </span>
            )}
          </div>
        </div>
        <button onClick={logout} className="btn-danger text-xs">
          {t("nav_logout")}
        </button>
      </div>

      {/* 3. Edit Profile Form */}
      <form onSubmit={save} className="card space-y-4 p-6">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-teal-600" />
          <span>{language === "ta" ? "சுயவிவரத்தை திருத்து" : "Edit Profile"}</span>
        </h3>
        <div>
          <label className="label">{language === "ta" ? "முழு பெயர்" : "Full Name"}</label>
          <input name="fullName" className="input text-sm" value={form.fullName} onChange={update} />
        </div>
        <div>
          <label className="label">{language === "ta" ? "தொலைபேசி எண்" : "Phone"}</label>
          <input name="phone" className="input text-sm" value={form.phone} onChange={update} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">{language === "ta" ? "கல்லூரி" : "College / Institution"}</label>
            <input name="college" className="input text-sm" value={form.college} onChange={update} />
          </div>
          <div>
            <label className="label">{language === "ta" ? "துறை" : "Department / Major"}</label>
            <input name="department" className="input text-sm" value={form.department} onChange={update} />
          </div>
        </div>
        <div>
          <label className="label">{language === "ta" ? "முகவரி" : "Address"}</label>
          <input name="address" className="input text-sm" value={form.address} onChange={update} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">{language === "ta" ? "நகரம்" : "City"}</label>
            <input name="city" className="input text-sm" value={form.city} onChange={update} />
          </div>
          <div>
            <label className="label">{language === "ta" ? "மாநிலம்" : "State"}</label>
            <input name="state" className="input text-sm" value={form.state} onChange={update} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">
          {saving
            ? language === "ta" ? "சேமிக்கப்படுகிறது..." : "Saving..."
            : language === "ta" ? "சுயவிவரத்தை சேமி" : "Save Profile Changes"}
        </button>
      </form>

      {/* 4. Security & Password */}
      <form onSubmit={changePassword} className="card space-y-4 p-6">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-600" />
          <span>{language === "ta" ? "கடவுச்சொல் மாற்றம்" : "Security & Password"}</span>
        </h3>
        <div>
          <label className="label">{language === "ta" ? "தற்போதைய கடவுச்சொல்" : "Current Password"}</label>
          <input type="password" className="input text-sm" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
        </div>
        <div>
          <label className="label">{language === "ta" ? "புதிய கடவுச்சொல்" : "New Password"}</label>
          <input type="password" className="input text-sm" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} required minLength={6} />
        </div>
        <button type="submit" disabled={changingPass} className="btn-outline text-xs">
          {changingPass
            ? language === "ta" ? "மாற்றப்படுகிறது..." : "Updating..."
            : language === "ta" ? "கடவுச்சொல்லை மாற்று" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export const PatientSettings = CandidateSettings;

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { User, Phone, Mail, Globe, Save, Briefcase, MapPin, Shield } from "lucide-react";
import toast from "react-hot-toast";

export function ParentSettings() {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  usePageTitle(language === "ta" ? "பெற்றோர் அமைப்புகள்" : "Parent Settings");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    occupation: "",
    relationshipToStudent: "Father",
    city: "",
    state: "",
    country: "India",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        alternatePhone: user.alternatePhone || "",
        occupation: user.occupation || "",
        relationshipToStudent: user.relationshipToStudent || "Father",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "India",
      });
    }
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/parent/profile", formData);
      await refreshUser();
      toast.success(language === "ta" ? "சுயவிவரம் புதுப்பிக்கப்பட்டது! 🎉" : "Profile updated successfully! 🎉");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {language === "ta" ? "பெற்றோர் அமைப்புகள் மற்றும் சுயவிவரம்" : "Parent Settings & Profile"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "ta" ? "தொடர்பு விவரங்கள் மற்றும் மொழி அமைப்புகளை நிர்வகிக்கவும்" : "Manage your contact info, relationship details, and language preferences"}
        </p>
      </div>

      {/* Language Preference Card */}
      <div className="card p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-500" />
          <h2 className="font-black text-sm text-slate-900">
            {language === "ta" ? "விருப்பமான மொழி (Preferred Language)" : "Preferred Language"}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          {language === "ta"
            ? "போர்டல் இடைமுகத்திற்கான மொழியைத் தேர்ந்தெடுக்கவும்"
            : "Select the primary language for your dashboard and notifications"}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
            { code: "en", label: "English", flag: "🌐" },
            { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
            { code: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
          ].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                language === item.code
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{item.flag}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "முழுப் பெயர்" : "Full Name"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="input pl-10 text-xs sm:text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "மாணவருக்கான உறவுமுறை" : "Relationship to Student"}
              </label>
              <select
                name="relationshipToStudent"
                value={formData.relationshipToStudent}
                onChange={handleChange}
                className="input text-xs sm:text-sm w-full"
              >
                <option value="Father">Father (தந்தை)</option>
                <option value="Mother">Mother (தாய்)</option>
                <option value="Guardian">Guardian (பாதுகாவலர்)</option>
                <option value="Family Member">Family Member</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "தொலைபேசி எண்" : "Primary Phone"}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input pl-10 text-xs sm:text-sm w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "மாற்று தொலைபேசி" : "Alternate Phone"}
              </label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                placeholder="+91..."
                className="input text-xs sm:text-sm w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "தொழில்" : "Occupation"}
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="input text-xs sm:text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "நகரம்" : "City"}
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input text-xs sm:text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "மாநிலம்" : "State"}
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input text-xs sm:text-sm w-full"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : (language === "ta" ? "மாற்றங்களைச் சேமிக்கவும்" : "Save Changes")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

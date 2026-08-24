import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  HeartHandshake,
  Search,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  Languages,
  Filter,
  Sparkles,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";

export function ParentCounselors() {
  const { language } = useLanguage();
  usePageTitle(language === "ta" ? "ஆலோசகர்களைத் தேடுங்கள்" : "Find Campus Counselors");

  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [specFilter, setSpecFilter] = useState("all");

  async function fetchCounselors() {
    try {
      setLoading(true);
      const params: any = {};
      if (cityFilter.trim()) params.city = cityFilter.trim();
      if (typeFilter !== "all") params.consultationType = typeFilter;
      if (specFilter !== "all") params.specialization = specFilter;

      // Try browser geolocation if available
      if (navigator.geolocation && !cityFilter) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            params.lat = pos.coords.latitude;
            params.lng = pos.coords.longitude;
            const res = await api.get("/counselor/available", { params });
            setCounselors(res.data.counselors || []);
            setLoading(false);
          },
          async () => {
            const res = await api.get("/counselor/available", { params });
            setCounselors(res.data.counselors || []);
            setLoading(false);
          },
          { timeout: 5000 }
        );
      } else {
        const res = await api.get("/counselor/available", { params });
        setCounselors(res.data.counselors || []);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error("Failed to load counselors");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCounselors();
  }, [typeFilter, specFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {language === "ta" ? "உரிமம் பெற்ற வளாக ஆலோசகர்கள்" : "Verified Campus Counselors"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === "ta"
            ? "இருப்பிட தூரம் மற்றும் நேரடி நேர இடைவெளிகளுடன் கூடிய தொழில்முறை ஆலோசகர்கள்"
            : "Location-based real-time counselor availability and consultation formats"}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCounselors()}
            placeholder={language === "ta" ? "நகரம் / மாவட்டம் மூலம் தேடவும்..." : "Search by City / District (e.g. Chennai, Coimbatore)..."}
            className="input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <button
          onClick={fetchCounselors}
          className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-95"
        >
          {language === "ta" ? "தேடு" : "Search"}
        </button>

        {/* Consultation Type */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input text-xs sm:text-sm w-full md:w-44"
        >
          <option value="all">All Modes (Online & Offline)</option>
          <option value="online">Online Only</option>
          <option value="offline">In-Person Campus</option>
        </select>
      </div>

      {/* Counselors Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : counselors.length === 0 ? (
        <div className="card p-10 bg-white border border-slate-200/80 rounded-3xl text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-slate-900">No Counselors Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Try broadening your location search or resetting filters to find available campus counselors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {counselors.map((c: any) => (
            <div
              key={c._id}
              className="card p-5 sm:p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-base border border-teal-200">
                      {c.fullName?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{c.fullName}</h3>
                      <p className="text-[11px] text-teal-700 font-bold">{c.specialization || "Psychological Counselor"}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      c.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.isOnline ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                    {c.isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl mb-4">
                  {c.hospital || c.clinic ? (
                    <p className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{c.hospital || c.clinic}</span>
                    </p>
                  ) : null}

                  {(c.city || c.district) && (
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.city || c.district}, {c.state || "India"}</span>
                      {c.distanceKm !== undefined && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          ~{c.distanceKm} km away
                        </span>
                      )}
                    </p>
                  )}

                  {c.languages && c.languages.length > 0 && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.languages.join(", ")}</span>
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Mode: <strong className="text-slate-800 capitalize">{c.consultationType}</strong></span>
                    <span className="font-bold text-emerald-600">
                      {c.consultationFee === 0 ? "Free Campus Service" : `₹${c.consultationFee}/Session`}
                    </span>
                  </div>
                </div>

                {/* Daily Capacity Status */}
                <div className="mb-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Daily Limit: 5</span>
                  {c.isFullyBooked ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px]">
                      🔴 Fully Booked (5/5)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                      🟢 Available ({c.activeAppointmentsCount || 0}/5 booked)
                    </span>
                  )}
                </div>

                {/* Available Days */}
                {c.availability?.days && c.availability.days.length > 0 && (
                  <div className="mb-4 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Days: </span>
                    <span>{c.availability.days.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">{c.qualification || "Licensed Counselor"}</span>
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Contact Info</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

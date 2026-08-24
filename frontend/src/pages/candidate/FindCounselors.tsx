import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { getCurrentPosition } from "../../lib/permission";

export function FindCounselors() {
  usePageTitle("Find Counselors");
  const { user, setUser } = useAuth();
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [consultationFilter, setConsultationFilter] = useState("all");
  const [locating, setLocating] = useState(false);
  const [cityManual, setCityManual] = useState("");

  function loadCounselors(params: Record<string, any> = {}) {
    setLoading(true);
    api.get("/counselor/available", { params })
      .then((res) => {
        setCounselors(res.data.counselors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadCounselors();
  }, []);

  async function useMyLocation() {
    setLocating(true);
    const res = await getCurrentPosition();
    if (!res.ok || !res.coords) {
      toast.error(res.reason || "Location access helps us find counselors near you. Please allow location access or select your city manually.");
      setLocating(false);
      return;
    }
    const { latitude, longitude } = res.coords;
    try {
      const geo = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      ).then((r) => r.json());
      const city = geo.city || geo.locality || geo.principalSubdivision || "";
      const state = geo.principalSubdivision || "";
      
      await api.put("/candidate/location", { city, state, lat: latitude, lng: longitude });
      setUser({ ...(user as any), ...{ city, state } });
      
      loadCounselors({ lat: latitude, lng: longitude, city, state });
      toast.success(city ? `Showing counselors near ${city}.` : "Showing counselors near your current location.");
    } catch {
      toast.error("Could not determine your location. Please search by city manually.");
    } finally {
      setLocating(false);
    }
  }

  async function manualCitySearch(e: React.FormEvent) {
    e.preventDefault();
    const city = cityManual.trim();
    if (!city) {
      toast.error("Please enter your city.");
      return;
    }
    await api.put("/candidate/location", { city }).catch(() => {});
    loadCounselors({ city });
    toast.success(`Showing counselors near ${city}.`);
  }

  const filtered = counselors.filter((c) => {
    const matchSearch =
      (c.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.specialization || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || c.district || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.hospital || c.clinic || "").toLowerCase().includes(search.toLowerCase());

    const matchType =
      consultationFilter === "all" ||
      c.consultationType === "both" ||
      c.consultationType === consultationFilter;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Find Counselors</h2>
          <p className="text-sm text-slate-500">Discover licensed mental health professionals near you</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto text-sm"
            value={consultationFilter}
            onChange={(e) => setConsultationFilter(e.target.value)}
          >
            <option value="all">All Consultation Modes</option>
            <option value="online">Online Consultation</option>
            <option value="offline">Offline / Clinic Visit</option>
          </select>
          <input
            className="input w-full max-w-xs text-sm"
            placeholder="Search by name, specialization, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card p-5 bg-gradient-to-r from-teal-50/50 to-blue-50/50 border border-teal-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Location-Based Counselor Discovery</p>
            <p className="text-xs text-slate-600">
              {user?.city
                ? `Current area: ${user.city}${user.state ? ", " + user.state : ""}.`
                : "Grant location access to automatically sort counselors by distance."}
            </p>
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="btn-primary bg-teal-600 hover:bg-teal-700 border-none"
          >
            {locating ? "Finding nearby…" : "Use my location"}
          </button>
        </div>
        <form onSubmit={manualCitySearch} className="mt-3 flex flex-wrap gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Enter your city or district (e.g. New York, Chicago, Mumbai)"
            value={cityManual}
            onChange={(e) => setCityManual(e.target.value)}
          />
          <button type="submit" className="btn-outline text-sm">
            Search by City
          </button>
        </form>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="No counselors found" description="Try expanding your search area or removing filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <div key={c._id} className="card flex flex-col justify-between p-6 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700 overflow-hidden">
                      {c.photo ? (
                        <img src={c.photo} alt={c.fullName} className="h-full w-full object-cover" />
                      ) : (
                        c.fullName?.[0] || "C"
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{c.fullName}</p>
                      <p className="text-xs font-medium text-teal-600">{c.specialization || "Mental Health Counselor"}</p>
                    </div>
                  </div>
                  {c.distanceKm !== null && c.distanceKm !== undefined && (
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                      📍 {c.distanceKm} km
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p>🎓 <strong>Qualification:</strong> {c.qualification || "Licensed Counselor"}</p>
                  <p>💼 <strong>Experience:</strong> {c.experience} years</p>
                  <p>🏥 <strong>Hospital/Clinic:</strong> {c.hospital || c.clinic || "Private Practice"}</p>
                  <p>📍 <strong>Location:</strong> {[c.city, c.district, c.state].filter(Boolean).join(", ") || "Main Campus Clinic"}</p>
                  {c.languages && c.languages.length > 0 && (
                    <p>🗣️ <strong>Languages:</strong> {c.languages.join(", ")}</p>
                  )}
                </div>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-2">
                <span className={`badge ${c.isOnline ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                  {c.isOnline ? "🟢 Online" : "⚪ Offline"}
                </span>
                <Link to={`/candidate/book/${c._id}`} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">
                  📅 Book Appointment
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const CandidateFindCounselors = FindCounselors;

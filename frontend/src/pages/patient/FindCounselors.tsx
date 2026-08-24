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
  const [locating, setLocating] = useState(false);
  const [cityManual, setCityManual] = useState("");

  function loadCounselors(params: Record<string, any> = {}) {
    setLoading(true);
    api.get("/counselor/available", { params }).then((res) => {
      setCounselors(res.data.counselors);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => {
    loadCounselors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Contextual location request — only when the patient asks to find nearby
     counselors. Reverse-geocode to city/state; fallback to manual selection. */
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
      // Persist only city/state (never precise coordinates) for nearby search.
      if (city || state) {
        await api.put("/patient/location", { city, state });
        setUser({ ...(user as any), ...{ city, state } });
      }
      loadCounselors({ city, state });
      toast.success(city ? `Showing counselors near ${city}.` : "Showing counselors near you.");
    } catch {
      toast.error("Could not determine your location. Please select your city manually.");
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
    await api.put("/patient/location", { city }).catch(() => {});
    loadCounselors({ city });
    toast.success(`Showing counselors near ${city}.`);
  }

  const filtered = counselors.filter((c) =>
    (c.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.specialization || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.city || c.district || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Find Counselors</h2>
        <input className="input w-full max-w-xs" placeholder="Search by name, specialization or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Contextual location request (not on first load — only when used) */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Find counselors near you</p>
            <p className="text-xs text-slate-500">
              {user?.city ? `You're currently set to ${user.city}${user.state ? ", " + user.state : ""}.` : "Allow location access to show counselors near you, or enter your city below."}
            </p>
          </div>
          <button onClick={useMyLocation} disabled={locating} className="btn-primary">
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <form onSubmit={manualCitySearch} className="mt-3 flex flex-wrap gap-2">
          <input
            className="input flex-1"
            placeholder="Enter your city (e.g. Chennai)"
            value={cityManual}
            onChange={(e) => setCityManual(e.target.value)}
          />
          <button type="submit" className="btn-outline">Search by city</button>
        </form>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="No counselors found" description="Try adjusting your search or city." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <div key={c._id} className="card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                  {c.fullName?.[0] || "C"}
                </div>
                <div>
                  <p className="font-semibold">{c.fullName}</p>
                  <p className="text-xs text-slate-500">{c.specialization || c.qualification}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>🎓 {c.qualification}</p>
                <p>💼 {c.experience} yrs experience</p>
                <p>🏥 {c.hospital || c.clinic}</p>
                <p>📍 {[c.city, c.district].filter(Boolean).join(", ")}</p>
                <p>💰 ₹{c.consultationFee || "—"}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="badge bg-green-100 text-green-700">{c.isOnline ? "Online" : "Available"}</span>
                <Link to={`/patient/book/${c._id}`} className="btn-primary">📅 Book Appointment</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


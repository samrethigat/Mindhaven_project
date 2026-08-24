import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { getCurrentPosition } from "../../lib/permission";
import { Calendar, Search } from "lucide-react";

export function FindCounselors() {
  usePageTitle("Find Counselors");
  const { user, setUser } = useAuth();
  const { socket } = useSocket();

  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [locating, setLocating] = useState(false);
  const [cityManual, setCityManual] = useState("");

  const loadCounselors = useCallback(
    (params: Record<string, any> = {}) => {
      setLoading(true);
      const queryParams = { ...params, date: selectedDate };
      api
        .get("/counselor/available", { params: queryParams })
        .then((res) => {
          setCounselors(res.data.counselors || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    [selectedDate]
  );

  useEffect(() => {
    loadCounselors();
  }, [loadCounselors]);

  useEffect(() => {
    if (!socket) return;
    const handleAvailabilityChange = () => {
      loadCounselors();
    };
    socket.on("appointment:availability-changed", handleAvailabilityChange);
    return () => {
      socket.off("appointment:availability-changed", handleAvailabilityChange);
    };
  }, [socket, loadCounselors]);

  async function useMyLocation() {
    setLocating(true);
    const res = await getCurrentPosition();
    if (!res.ok || !res.coords) {
      toast.error(
        res.reason ||
          "Location access helps us find counselors near you. Please allow location access or select your city manually."
      );
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

  const filtered = counselors.filter(
    (c) =>
      (c.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.specialization || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || c.district || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Find Counselors</h2>
          <p className="text-sm text-slate-500">Live doctor availability and 5-appointment daily capacity limit</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
            <input
              type="date"
              className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="relative">
            <input
              className="input w-full max-w-xs text-xs pl-8"
              placeholder="Search by name, specialization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Find counselors near you</p>
            <p className="text-xs text-slate-500">
              {user?.city
                ? `You're currently set to ${user.city}${user.state ? ", " + user.state : ""}.`
                : "Allow location access to show counselors near you, or enter your city below."}
            </p>
          </div>
          <button onClick={useMyLocation} disabled={locating} className="btn-primary text-xs">
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <form onSubmit={manualCitySearch} className="mt-3 flex flex-wrap gap-2">
          <input
            className="input flex-1 text-xs"
            placeholder="Enter your city (e.g. Chennai)"
            value={cityManual}
            onChange={(e) => setCityManual(e.target.value)}
          />
          <button type="submit" className="btn-outline text-xs">
            Search by city
          </button>
        </form>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="No counselors found" description="Try adjusting your search or city." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => {
            const activeCount = c.activeAppointmentsCount || 0;
            const maxLimit = c.maxDailyLimit || 5;
            const isFullyBooked = c.isFullyBooked || activeCount >= maxLimit;
            const isWorkingDay = c.isWorkingDay !== undefined ? c.isWorkingDay : true;

            return (
              <div key={c._id} className="card p-6 flex flex-col justify-between">
                <div>
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

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Daily Limit: 5 / Day</span>
                    {!isWorkingDay ? (
                      <span className="badge bg-slate-100 text-slate-600 font-bold">⚪ Off Duty on Date</span>
                    ) : isFullyBooked ? (
                      <span className="badge bg-rose-100 text-rose-700 font-bold">🔴 Fully Booked (5/5)</span>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-800 font-bold">
                        🟢 Available ({activeCount}/5 booked)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="badge bg-green-100 text-green-700">{c.isOnline ? "Online" : "Available"}</span>
                  {isFullyBooked ? (
                    <button disabled className="btn-outline text-xs cursor-not-allowed opacity-50">
                      🚫 Fully Booked
                    </button>
                  ) : (
                    <Link to={`/patient/book/${c._id}`} className="btn-primary text-xs">
                      📅 Book Appointment
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

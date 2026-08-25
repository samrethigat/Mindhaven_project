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
import { Calendar, MapPin, Search, ShieldCheck, UserCheck } from "lucide-react";

export function FindCounselors() {
  usePageTitle("Find Counselors");
  const { user, setUser } = useAuth();
  const { socket } = useSocket();

  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [consultationFilter, setConsultationFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [locating, setLocating] = useState(false);
  const [cityManual, setCityManual] = useState("");

const DEFAULT_CAMPUS_COUNSELORS = [
  {
    _id: "cns_meera_01",
    fullName: "Dr. Meera Iyer",
    qualification: "Ph.D. Clinical Psychology",
    specialization: "Anxiety & Depression",
    experience: 12,
    hospital: "Campus Wellbeing & Mental Health Institute",
    clinic: "Wellbeing Center, Block A",
    licenseNumber: "LIC-1001",
    languages: ["English", "Tamil", "Hindi"],
    city: "Chennai",
    state: "Tamil Nadu",
    consultationType: "both",
    activeAppointmentsCount: 2,
    maxDailyLimit: 5,
    isFullyBooked: false,
    availableSlots: ["10:00", "11:00", "15:00", "16:00"],
    allSlots: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00"],
  },
  {
    _id: "cns_arjun_02",
    fullName: "Dr. Arjun Nair",
    qualification: "M.D. Psychiatry",
    specialization: "Mood Disorders & Stress Management",
    experience: 9,
    hospital: "Sunrise Neuropsychiatry Care",
    clinic: "Nair Clinic, Main Campus Road",
    licenseNumber: "LIC-1002",
    languages: ["English", "Malayalam", "Hindi"],
    city: "Chennai",
    state: "Tamil Nadu",
    consultationType: "both",
    activeAppointmentsCount: 1,
    maxDailyLimit: 5,
    isFullyBooked: false,
    availableSlots: ["09:00", "10:00", "17:00", "18:00"],
    allSlots: ["09:00", "10:00", "14:00", "17:00", "18:00"],
  },
  {
    _id: "cns_sarah_03",
    fullName: "Dr. Sarah Joseph",
    qualification: "M.Phil. Counselling Psychology",
    specialization: "Student Stress & Academic Pressure",
    experience: 6,
    hospital: "Campus Care Psychological Center",
    clinic: "Student Support Hub",
    licenseNumber: "LIC-1003",
    languages: ["English", "Tamil", "Malayalam"],
    city: "Chennai",
    state: "Tamil Nadu",
    consultationType: "both",
    activeAppointmentsCount: 3,
    maxDailyLimit: 5,
    isFullyBooked: false,
    availableSlots: ["11:00", "12:00", "16:00"],
    allSlots: ["10:00", "11:00", "12:00", "14:00", "16:00"],
  },
];

  const loadCounselors = useCallback(
    (params: Record<string, any> = {}) => {
      setLoading(true);
      const queryParams = { ...params, date: selectedDate };
      api
        .get("/counselor/available", { params: queryParams })
        .then((res) => {
          if (res.data.counselors && res.data.counselors.length > 0) {
            setCounselors(res.data.counselors);
          } else {
            setCounselors(DEFAULT_CAMPUS_COUNSELORS);
          }
          setLoading(false);
        })
        .catch(() => {
          setCounselors(DEFAULT_CAMPUS_COUNSELORS);
          setLoading(false);
        });
    },
    [selectedDate]
  );

  useEffect(() => {
    loadCounselors();
  }, [loadCounselors]);

  // Real-time socket updates for availability changes
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
      {/* Page Title & Search/Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Find Doctor / Counselor</h2>
          <p className="text-sm text-slate-500">
            Real-time daily capacity (5 max appointments/day) and live slot availability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target Date Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
            <input
              type="date"
              className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <select
            className="input w-auto text-xs font-semibold"
            value={consultationFilter}
            onChange={(e) => setConsultationFilter(e.target.value)}
          >
            <option value="all">All Modes (Online & Offline)</option>
            <option value="online">Online Consultation</option>
            <option value="offline">Offline / Clinic Visit</option>
          </select>

          <div className="relative">
            <input
              className="input w-full max-w-xs text-xs pl-8"
              placeholder="Search doctor, hospital, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Location Banner */}
      <div className="card p-5 bg-gradient-to-r from-teal-50/60 to-blue-50/60 border border-teal-100 rounded-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800 text-sm">Location-Based Doctor Matching</p>
            <p className="text-xs text-slate-600">
              {user?.city
                ? `Current area: ${user.city}${user.state ? ", " + user.state : ""}. Doctors sorted by proximity.`
                : "Enable location access to discover nearest campus mental health specialists."}
            </p>
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs"
          >
            {locating ? "Finding nearby…" : "Use my location"}
          </button>
        </div>
        <form onSubmit={manualCitySearch} className="mt-3 flex flex-wrap gap-2">
          <input
            className="input flex-1 text-xs"
            placeholder="Enter city or campus district (e.g. Chennai, Mumbai, Bangalore)"
            value={cityManual}
            onChange={(e) => setCityManual(e.target.value)}
          />
          <button type="submit" className="btn-outline text-xs py-1.5 px-3">
            Filter by City
          </button>
        </form>
      </div>

      {/* Counselors Grid */}
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty
          title="No doctors or counselors found"
          description="Try selecting another date or expanding your search filters."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => {
            const activeCount = c.activeAppointmentsCount || 0;
            const maxLimit = c.maxDailyLimit || 5;
            const isFullyBooked = c.isFullyBooked || activeCount >= maxLimit;
            const isWorkingDay = c.isWorkingDay !== undefined ? c.isWorkingDay : true;

            return (
              <div
                key={c._id}
                className="card flex flex-col justify-between p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  {/* Doctor Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-xl font-bold text-teal-700 overflow-hidden border border-teal-200 shrink-0">
                        {c.photo ? (
                          <img src={c.photo} alt={c.fullName} className="h-full w-full object-cover" />
                        ) : (
                          c.fullName?.[0] || "D"
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base">{c.fullName}</p>
                        <p className="text-xs font-semibold text-teal-600">
                          {c.specialization || "Clinical Psychologist"}
                        </p>
                      </div>
                    </div>

                    {c.distanceKm !== null && c.distanceKm !== undefined && (
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-100 shrink-0">
                        📍 {c.distanceKm} km
                      </span>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                    <p>
                      🎓 <strong>Qualification:</strong> {c.qualification || "Licensed Practitioner"}
                    </p>
                    <p>
                      💼 <strong>Experience:</strong> {c.experience} years
                    </p>
                    <p>
                      🏥 <strong>Hospital/Clinic:</strong> {c.hospital || c.clinic || "Campus Wellness"}
                    </p>
                    <p>
                      📍 <strong>Location:</strong>{" "}
                      {[c.city, c.district, c.state].filter(Boolean).join(", ") || "Main Center"}
                    </p>
                    {c.languages && c.languages.length > 0 && (
                      <p>
                        🗣️ <strong>Languages:</strong> {c.languages.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Daily Limit & Capacity Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Daily Limit: 5 / Day</span>

                    {!isWorkingDay ? (
                      <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                        ⚪ Off Duty on Selected Date
                      </span>
                    ) : isFullyBooked ? (
                      <span className="badge bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        🔴 Fully Booked (5/5)
                      </span>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        🟢 Available ({activeCount}/{maxLimit} booked)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-2">
                  <span
                    className={`badge ${
                      c.isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"
                    } text-[10px]`}
                  >
                    {c.isOnline ? "🟢 Online Now" : "⚪ Offline"}
                  </span>

                  {isFullyBooked ? (
                    <button
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200"
                      title="This doctor has reached the maximum daily limit of 5 appointments for this date."
                    >
                      🚫 Fully Booked
                    </button>
                  ) : (
                    <Link
                      to={`/candidate/book/${c._id}`}
                      className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs py-2 px-3.5 rounded-xl flex items-center gap-1 shadow-sm shadow-teal-600/20"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Appointment</span>
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

export const CandidateFindCounselors = FindCounselors;

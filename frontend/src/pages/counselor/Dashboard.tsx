import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import { formatDate, formatTime, statusBadgeClass, capitalize } from "../../lib/utils";

export function CounselorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [today, setToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/appointments/counselor/stats"),
      api.get("/appointments/counselor"),
    ]).then(([s, a]) => {
      setStats(s.data);
      const all = a.data.appointments || [];
      const todayStr = new Date().toISOString().split("T")[0];
      setToday(all.filter((appt: any) => new Date(appt.date).toISOString().split("T")[0] === todayStr));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: "Today's Appointments", value: stats?.today || today.length, icon: "📅" },
    { label: "Pending Requests", value: stats?.pending || 0, icon: "📥" },
    { label: "Confirmed", value: stats?.confirmed || 0, icon: "✅" },
    { label: "Completed Sessions", value: stats?.completed || 0, icon: "🎯" },
    { label: "Upcoming", value: stats?.upcoming || 0, icon: "⏳" },
    { label: "Cancelled", value: stats?.cancelled || 0, icon: "❌" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Counselor Dashboard</h2>
        <Link to="/counselor/appointment-requests" className="btn-primary">View Requests</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-2xl">{c.icon}</div>
            <p className="mt-2 text-3xl font-extrabold">{c.value}</p>
            <p className="text-sm text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold">Today's Schedule</h3>
        {today.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No appointments scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {today.map((a: any) => (
              <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="font-semibold">{a.patient?.fullName || a.patientName}</p>
                  <p className="text-sm text-slate-500">{formatTime(a.time)} · {capitalize(a.consultationType)}</p>
                </div>
                <span className={`badge ${statusBadgeClass(a.status)}`}>{capitalize(a.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

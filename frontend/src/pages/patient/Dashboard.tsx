import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { formatDate, formatTime, statusBadgeClass, capitalize } from "../../lib/utils";
import { usePageTitle } from "../../lib/usePageTitle";

export function PatientDashboard() {
  usePageTitle("Patient Dashboard");
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments/patient").then((res) => {
      setAppointments(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter((a) => ["pending", "confirmed", "rescheduled"].includes(a.status));
  const upcomingSorted = [...upcoming].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold">Welcome, {user?.fullName || "Student"} 👋</h2>
        <p className="mt-1 text-slate-500">Here's your mental health overview.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/patient/counselors" className="btn-primary">Find a Counselor</Link>
          <Link to="/patient/emergency" className="btn-danger">Emergency Help</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Appointments", value: appointments.length, icon: "📅" },
          { label: "Upcoming", value: upcoming.length, icon: "⏳" },
          { label: "Confirmed", value: appointments.filter((a) => a.status === "confirmed").length, icon: "✅" },
          { label: "Pending", value: appointments.filter((a) => a.status === "pending").length, icon: "🕐" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-2xl">{s.icon}</div>
            <p className="mt-2 text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold">Upcoming Appointments</h3>
        {loading ? (
          <Loading />
        ) : upcomingSorted.length === 0 ? (
          <Empty title="No upcoming appointments" description="Book a session with a counselor to get started." />
        ) : (
          <div className="space-y-3">
            {upcomingSorted.map((a: any) => (
              <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="font-semibold">{a.counselor?.fullName || a.counselorName}</p>
                  <p className="text-sm text-slate-500">{formatDate(a.date)} at {formatTime(a.time)} · {capitalize(a.consultationType)}</p>
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { formatDate, formatTime, statusBadgeClass, capitalize } from "../../lib/utils";

export function CounselorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/appointments/counselor").then((res) => {
      setAppointments(res.data.appointments);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <select className="input max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="missed">Missed</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="No appointments" />
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a._id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold">{a.patient?.fullName || a.patientName}</p>
                <p className="text-sm text-slate-500">{formatDate(a.date)} at {formatTime(a.time)} · {capitalize(a.consultationType)}</p>
                <p className="text-xs text-slate-400">ID: {a.appointmentId}</p>
              </div>
<div className="flex flex-col items-end gap-2">
                <span className={`badge ${statusBadgeClass(a.status)}`}>{capitalize(a.status)}</span>
                {(a.status === "confirmed" || a.status === "rescheduled") && (
                  <Link to={`/counselor/consultation/${a._id}`} className="btn-primary">
                    🎥 Join Consultation
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { formatDate, formatTime, statusBadgeClass, capitalize } from "../../lib/utils";

export function MyAppointments() {
  usePageTitle("Appointments");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments/patient").then((res) => {
      setAppointments(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Appointments</h2>
      {loading ? (
        <Loading />
      ) : appointments.length === 0 ? (
        <Empty title="No appointments" description="Book a session with a counselor." />
      ) : (
        <div className="space-y-3">
          {appointments.map((a: any) => (
            <div key={a._id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold">{a.counselor?.fullName || a.counselorName}</p>
                <p className="text-sm text-slate-500">
                  {formatDate(a.date)} at {formatTime(a.time)} · {capitalize(a.consultationType)}
                </p>
                <p className="text-xs text-slate-400">ID: {a.appointmentId}</p>
                {a.reason && <p className="mt-1 text-sm text-slate-600">Reason: {a.reason}</p>}
              </div>
<div className="flex flex-col items-end gap-2">
                <span className={`badge ${statusBadgeClass(a.status)}`}>{capitalize(a.status)}</span>
                {(a.status === "confirmed" || a.status === "rescheduled") && (
                  <Link to={`/patient/consultation/${a._id}`} className="btn-primary">
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

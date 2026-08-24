import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { formatDate, formatTime, statusBadgeClass, capitalize } from "../../lib/utils";
import { useSocket } from "../../context/SocketContext";

export function CounselorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { socket } = useSocket();

  function loadAppointments() {
    api
      .get("/appointments/counselor")
      .then((res) => {
        setAppointments(res.data.appointments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("appointment:new", loadAppointments);
    socket.on("appointment:availability-changed", loadAppointments);
    socket.on("appointment:status-updated", loadAppointments);
    return () => {
      socket.off("appointment:new", loadAppointments);
      socket.off("appointment:availability-changed", loadAppointments);
      socket.off("appointment:status-updated", loadAppointments);
    };
  }, [socket]);

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-sm text-slate-500">Manage your patient schedule and active consultations</p>
        </div>
        <select className="input max-w-xs text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
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
        <Empty title="No appointments found" description="Appointments booked with you will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a._id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-slate-900">{a.patient?.fullName || a.patientName}</p>
                <p className="text-sm text-slate-600 font-medium">
                  📅 {formatDate(a.date)} at {formatTime(a.time)} · {capitalize(a.consultationType)} Mode
                </p>
                <p className="text-xs text-slate-400 font-mono">ID: {a.appointmentId}</p>
                {a.reason && <p className="text-xs text-slate-500 mt-1"><strong>Reason:</strong> {a.reason}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${statusBadgeClass(a.status)}`}>{capitalize(a.status)}</span>
                {(a.status === "confirmed" || a.status === "accepted" || a.status === "rescheduled") && (
                  <div className="flex items-center gap-2 mt-1">
                    <Link to={`/counselor/chats`} className="btn-outline text-xs py-1.5 px-3">
                      💬 Chat
                    </Link>
                    <Link to={`/counselor/consultation/${a._id}`} className="btn-primary text-xs py-1.5 px-3">
                      🎥 Join Consultation
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

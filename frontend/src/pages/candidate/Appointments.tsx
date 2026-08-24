import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { formatDate, formatTime, statusBadgeClass, capitalize } from "../../lib/utils";
import { useSocket } from "../../context/SocketContext";

export function MyAppointments() {
  usePageTitle("My Appointments");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { socket } = useSocket();

  function fetchAppointments() {
    setLoading(true);
    api
      .get("/appointments/candidate")
      .then((res) => {
        setAppointments(Array.isArray(res.data) ? res.data : res.data.appointments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = () => {
      fetchAppointments();
    };
    socket.on("appointment:status-updated", handleStatusUpdate);
    socket.on("appointment:availability-changed", handleStatusUpdate);
    return () => {
      socket.off("appointment:status-updated", handleStatusUpdate);
      socket.off("appointment:availability-changed", handleStatusUpdate);
    };
  }, [socket]);

  async function handleCancel(id: string) {
    if (!window.confirm("Are you sure you want to cancel this appointment? This will free up the doctor's time slot.")) {
      return;
    }
    setCancellingId(id);
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: "Cancelled by patient" });
      toast.success("Appointment cancelled successfully.");
      fetchAppointments();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Consultation Appointments</h2>
          <p className="text-sm text-slate-500">Track and manage your upcoming & past counseling sessions</p>
        </div>
        <Link to="/candidate/counselors" className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs sm:text-sm">
          + Book New Session
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : appointments.length === 0 ? (
        <Empty title="No appointments yet" description="Find a counselor near you and schedule your first session." />
      ) : (
        <div className="space-y-3">
          {appointments.map((a: any) => {
            const isCanCancel = ["pending", "accepted", "confirmed", "rescheduled"].includes(a.status?.toLowerCase());

            return (
              <div
                key={a._id}
                className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:border-teal-200 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-base">{a.counselor?.fullName || a.counselorName}</p>
                    <span className="text-xs text-slate-400 font-mono">({a.appointmentId})</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    📅 {formatDate(a.date)} at {formatTime(a.time)} ·{" "}
                    {a.consultationType === "online" ? "🌐 Online Video/Voice" : "🏥 Offline Clinic Visit"}
                  </p>
                  {a.reason && (
                    <p className="text-xs text-slate-500">
                      <strong>Reason:</strong> {a.reason}
                    </p>
                  )}
                  {a.additionalNotes && <p className="text-xs text-slate-400 italic">Notes: {a.additionalNotes}</p>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${statusBadgeClass(a.status)}`}>{capitalize(a.status)}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {(a.status === "confirmed" || a.status === "accepted" || a.status === "rescheduled") && (
                      <>
                        <Link to={`/candidate/chats`} className="btn-outline text-xs py-1.5 px-3">
                          💬 Message
                        </Link>
                        <Link
                          to={`/candidate/consultation/${a._id}`}
                          className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs py-1.5 px-3"
                        >
                          🎥 Join Room
                        </Link>
                      </>
                    )}
                    {isCanCancel && (
                      <button
                        onClick={() => handleCancel(a._id)}
                        disabled={cancellingId === a._id}
                        className="btn-outline text-xs py-1.5 px-3 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                      >
                        {cancellingId === a._id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const CandidateAppointments = MyAppointments;

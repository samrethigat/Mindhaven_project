import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { formatDate, formatTime, capitalize } from "../../lib/utils";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";

export function AppointmentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const [reschedule, setReschedule] = useState<any>(null);
  const [rejectFor, setRejectFor] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reschedForm, setReschedForm] = useState({ newDate: "", newTime: "", reason: "" });

  async function load() {
    try {
      const { data } = await api.get("/appointments/counselor");
      setRequests((data.appointments || []).filter((a: any) => a.status === "pending"));
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("appointment:new", load);
    return () => {
      socket.off("appointment:new");
    };
  }, [socket]);

  async function accept(id: string) {
    try {
      await api.post(`/appointments/${id}/accept`);
      toast.success("Appointment confirmed");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed");
    }
  }

  async function reject(id: string) {
    try {
      await api.post(`/appointments/${id}/reject`, { reason: rejectReason });
      toast.success("Appointment rejected");
      setRejectFor(null);
      setRejectReason("");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed");
    }
  }

  async function doReschedule(id: string) {
    try {
      await api.post(`/appointments/${id}/reschedule`, reschedForm);
      toast.success("Appointment rescheduled");
      setReschedule(null);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed");
    }
  }

  function resetForm() {
    setReschedForm({ newDate: "", newTime: "", reason: "" });
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appointment Requests</h2>
      {requests.length === 0 ? (
        <Empty title="No pending requests" description="New appointment requests will appear here in real-time." />
      ) : (
        <div className="space-y-4">
          {requests.map((a: any) => (
            <div key={a._id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {a.patientName?.[0] || "P"}
                  </div>
                  <div>
                    <p className="font-semibold">{a.patientName}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(a.date)} at {formatTime(a.time)} · {capitalize(a.consultationType)}
                    </p>
                    <p className="text-xs text-slate-400">ID: {a.appointmentId}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  <p>{a.patientEmail}</p>
                  <p>{a.patientPhone}</p>
                </div>
              </div>
              {a.reason && <p className="mt-3 text-sm text-slate-600"><strong>Reason:</strong> {a.reason}</p>}
              {a.additionalNotes && <p className="mt-1 text-sm text-slate-600"><strong>Notes:</strong> {a.additionalNotes}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => accept(a._id)} className="btn-primary">Accept</button>
                <button onClick={() => { setRejectFor(a._id); setRejectReason(""); }} className="btn-outline">Reject</button>
                <button
                  onClick={() => {
                    setReschedule(a._id);
                    setReschedForm({
                      newDate: new Date(a.date).toISOString().split("T")[0],
                      newTime: a.time,
                      reason: "",
                    });
                  }}
                  className="btn-outline"
                >
                  Reschedule
                </button>
                <a href={`tel:${a.patientPhone}`} className="btn-outline">Call</a>
              </div>

              {rejectFor === a._id && (
                <div className="mt-4 space-y-3 rounded-xl border border-red-100 bg-red-50 p-4">
                  <textarea
                    className="input"
                    placeholder="Rejection reason (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => reject(a._id)} className="btn-danger">Confirm Reject</button>
                    <button onClick={() => setRejectFor(null)} className="btn-outline">Cancel</button>
                  </div>
                </div>
              )}

              {reschedule === a._id && (
                <div className="mt-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">New Date</label>
                      <input
                        type="date"
                        className="input"
                        value={reschedForm.newDate}
                        onChange={(e) => setReschedForm({ ...reschedForm, newDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">New Time</label>
                      <input
                        className="input"
                        value={reschedForm.newTime}
                        onChange={(e) => setReschedForm({ ...reschedForm, newTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <textarea
                    className="input"
                    placeholder="Reason for reschedule"
                    value={reschedForm.reason}
                    onChange={(e) => setReschedForm({ ...reschedForm, reason: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => doReschedule(a._id)} className="btn-primary">Confirm Reschedule</button>
                    <button onClick={() => { setReschedule(null); resetForm(); }} className="btn-outline">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


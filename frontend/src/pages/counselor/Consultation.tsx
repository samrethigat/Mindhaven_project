import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import { api, getErrorMessage } from "../../lib/api";
import { useSocket } from "../../context/SocketContext";
import { Loading } from "../../components/ui/Loading";
import { VideoCall } from "../../components/VideoCall";
import { formatDate, formatTime, capitalize } from "../../lib/utils";

export function CounselorConsultationPage() {
  const { id } = useParams();
  const { socket } = useSocket();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/appointments/${id}`)
      .then((res) => setAppointment(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <span className="text-4xl">🚫</span>
        <p className="text-sm text-slate-600">{error}</p>
        <Link to="/counselor/appointments" className="btn-outline">Back to appointments</Link>
      </div>
    );
  }
  if (!appointment) return null;

  const isOnline = appointment.consultationType === "online";
  const confirmed = ["confirmed", "rescheduled"].includes(appointment.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Consultation</h2>
        <Link to="/counselor/appointments" className="btn-outline">← Appointments</Link>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{appointment.patient?.fullName || appointment.patientName}</p>
            <p className="text-sm text-slate-500">
              {formatDate(appointment.date)} at {formatTime(appointment.time)} · {capitalize(appointment.consultationType)}
            </p>
            <p className="text-xs text-slate-400">ID: {appointment.appointmentId}</p>
          </div>
          <span className="badge bg-green-100 text-green-700">{capitalize(appointment.status)}</span>
        </div>
      </div>

      {!confirmed ? (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <span className="text-4xl">🔒</span>
          <p className="text-sm text-slate-600">
            {appointment.status === "pending"
              ? "This consultation unlocks once you confirm the patient's appointment."
              : "This consultation is no longer available."}
          </p>
        </div>
      ) : isOnline ? (
        !joined ? (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <span className="text-4xl">📹</span>
            <p className="text-sm text-slate-600">
              You're about to start a secure video consultation with {appointment.patient?.fullName || appointment.patientName}.
              You'll be asked for camera and microphone access.
            </p>
            {socket ? (
              <button onClick={() => setJoined(true)} className="btn-primary">
                🎥 Join Consultation
              </button>
            ) : (
              <p className="text-sm text-slate-400">Connecting to the consultation server…</p>
            )}
          </div>
        ) : (
          <VideoCall
            socket={socket as Socket}
            appointmentId={appointment._id}
            peerName={appointment.patient?.fullName || appointment.patientName}
          />
        )
      ) : (
        /* Offline consultation — show location + patient details */
        <div className="card p-6">
          <h3 className="mb-3 text-lg font-semibold">📍 Consultation details</h3>
          <p className="text-sm text-slate-600">
            This is an offline consultation with {appointment.patient?.fullName || appointment.patientName}.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-semibold">{appointment.patient?.fullName || appointment.patientName}</p>
            <p className="mt-1 text-slate-500">{appointment.patientEmail}</p>
            {appointment.patientPhone && <p className="text-slate-500">📞 {appointment.patientPhone}</p>}
            <p className="mt-2 text-slate-600">{formatDate(appointment.date)} at {formatTime(appointment.time)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

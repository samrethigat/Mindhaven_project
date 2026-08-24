import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import { api, getErrorMessage } from "../../lib/api";
import { useSocket } from "../../context/SocketContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";
import { VideoCall } from "../../components/VideoCall";
import { formatDate, formatTime, capitalize } from "../../lib/utils";

export function CandidateConsultationPage() {
  usePageTitle("Candidate Consultation");
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
        <Link to="/candidate/appointments" className="btn-outline">Back to Appointments</Link>
      </div>
    );
  }
  if (!appointment) return null;

  const isOnline = appointment.consultationType === "online";
  const confirmed = ["confirmed", "accepted", "rescheduled"].includes(appointment.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Consultation Session</h2>
          <p className="text-sm text-slate-500">Confidential 1-on-1 session with your counselor</p>
        </div>
        <Link to="/candidate/appointments" className="btn-outline text-xs">← Appointments</Link>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-slate-900 text-lg">{appointment.counselorName}</p>
            <p className="text-sm text-slate-500">
              📅 {formatDate(appointment.date)} at {formatTime(appointment.time)} · {capitalize(appointment.consultationType)} Mode
            </p>
            <p className="text-xs text-slate-400 font-mono">ID: {appointment.appointmentId}</p>
          </div>
          <span className="badge bg-emerald-100 text-emerald-800 font-bold">{capitalize(appointment.status)}</span>
        </div>
      </div>

      {!confirmed ? (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <span className="text-4xl">🔒</span>
          <p className="text-sm text-slate-600">
            {appointment.status === "pending"
              ? "This consultation room unlocks once your counselor accepts your appointment request."
              : "This consultation session is no longer active."}
          </p>
          <Link to="/candidate/appointments" className="btn-outline text-xs">Return to My Appointments</Link>
        </div>
      ) : isOnline ? (
        !joined ? (
          <div className="card flex flex-col items-center gap-4 p-10 text-center bg-slate-900 text-white border-none shadow-2xl">
            <span className="text-5xl">📹</span>
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white">Join Secure Consultation Room</h3>
              <p className="mt-2 text-sm text-slate-300">
                You are about to start a WebRTC-encrypted video/voice consultation with {appointment.counselorName}.
                Camera and microphone permissions will be requested upon entering.
              </p>
            </div>
            {socket ? (
              <button onClick={() => setJoined(true)} className="btn-primary bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold border-none px-6 py-3 text-base">
                🎥 Enter Consultation Room
              </button>
            ) : (
              <p className="text-sm text-teal-300">Connecting to secure signaling server…</p>
            )}
          </div>
        ) : (
          <VideoCall socket={socket as Socket} appointmentId={appointment._id} peerName={appointment.counselorName} />
        )
      ) : (
        <div className="card p-6">
          <h3 className="mb-3 text-lg font-bold text-slate-900">📍 Offline Clinic / Hospital Location</h3>
          <p className="text-sm text-slate-600">
            This is an offline consultation. Please visit the location below at your scheduled appointment time.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm space-y-2">
            <p className="font-bold text-slate-900 text-base">{appointment.counselorName}</p>
            <p className="text-slate-700">🏥 {appointment.counselor?.hospital || appointment.counselor?.clinic || "Hospital / Main Campus Clinic"}</p>
            <p className="text-slate-500">
              📍 {[appointment.counselor?.address, appointment.counselor?.city, appointment.counselor?.district, appointment.counselor?.state].filter(Boolean).join(", ") || "Address provided on confirmation"}
            </p>
            <p className="text-teal-700 font-semibold pt-1">
              📅 {formatDate(appointment.date)} at {formatTime(appointment.time)}
            </p>
          </div>
          <p className="mt-4 text-xs text-slate-400">Please arrive 10 minutes prior to your appointment time.</p>
        </div>
      )}
    </div>
  );
}

export const ConsultationPage = CandidateConsultationPage;

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import {
  requestCamera,
  requestMicrophone,
  stopStream,
  isSecureContext,
} from "../lib/permission";
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck, 
  Users, 
  Clock, 
  RotateCcw,
  Sparkles,
  AlertCircle
} from "lucide-react";

type Props = {
  socket: Socket;
  appointmentId: string;
  peerName: string;
};

type SignalData = { type?: string; sdp?: any; candidate?: any };

export function VideoCall({ socket, appointmentId, peerName }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const joinedRef = useRef(false);
  const peerEstablished = useRef(false);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const makePeerConnection = useCallback(async (localStream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    pcRef.current = pc;
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    pc.onicecandidate = (e) => {
      if (e.candidate && joinedRef.current) {
        socket.emit("consultation:signal", {
          appointmentId,
          to: "",
          data: { type: "candidate", candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setWaiting(false);
        peerEstablished.current = true;
      }
    };

    return pc;
  }, [socket, appointmentId]);

  // Create/offer or answer based on peerCount when we join the room.
  const joinConsultation = useCallback(async () => {
    if (joinedRef.current) return;
    if (!isSecureContext()) {
      setError("Video consultation requires a secure context (HTTPS / localhost).");
      return;
    }

    // Local media (camera + mic).
    const cam = await requestCamera({ video: true });
    if (!cam.stream) {
      setError(cam.reason || "Camera access is required for video consultation.");
      return;
    }
    const mic = await requestMicrophone({ audio: true });
    // Combine camera + mic into a single stream.
    const stream = cam.stream;
    if (mic.stream) {
      mic.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = await makePeerConnection(stream);

    socket.emit(
      "consultation:join",
      { appointmentId },
      (res: any) => {
        if (res?.error) {
          setError(res.error);
          stopStream(stream);
          return;
        }
        joinedRef.current = true;
        const peerCount = res.peerCount || 1;
        if (peerCount === 1) {
          setTimeout(async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("consultation:signal", {
                appointmentId,
                to: "",
                data: { type: "offer", sdp: offer },
              });
            } catch {}
          }, 400);
        }
      }
    );
  }, [socket, appointmentId, makePeerConnection]);

  useEffect(() => {
    joinConsultation();

    const onSignal = async (payload: { from: string; data: SignalData }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (payload.data.type === "offer") {
          await pc.setRemoteDescription(payload.data.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("consultation:signal", {
            appointmentId,
            to: payload.from,
            data: { type: "answer", sdp: answer },
          });
        } else if (payload.data.type === "answer") {
          await pc.setRemoteDescription(payload.data.sdp);
        } else if (payload.data.type === "candidate" && payload.data.candidate) {
          await pc.addIceCandidate(payload.data.candidate);
        }
      } catch (err) {
        console.error("Signal error", err);
      }
    };

    const onPeerJoined = () => {
      if (joinedRef.current && pcRef.current && !peerEstablished.current) {
        setTimeout(async () => {
          try {
            const pc = pcRef.current!;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("consultation:signal", {
              appointmentId,
              to: "",
              data: { type: "offer", sdp: offer },
            });
          } catch {}
        }, 300);
      }
    };

    socket.on("consultation:signal", onSignal);
    socket.on("consultation:peer-joined", onPeerJoined);

    return () => {
      socket.off("consultation:signal", onSignal);
      socket.off("consultation:peer-joined", onPeerJoined);
    };
  }, [socket, appointmentId, joinConsultation]);

  async function leaveCall() {
    socket.emit("consultation:leave", { appointmentId });
    pcRef.current?.close();
    pcRef.current = null;
    if (localStreamRef.current) stopStream(localStreamRef.current);
    localStreamRef.current = null;
    toast.success("Consultation session ended");
  }

  function toggleMic() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }

  function toggleCam() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !camOn;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }

  useEffect(() => {
    return () => {
      leaveCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="card flex flex-col items-center justify-center gap-4 p-10 text-center max-w-lg mx-auto my-8 bg-white border border-rose-100 shadow-xl rounded-3xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Device Connection Notice</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
        <button
          onClick={() => { setError(null); joinedRef.current = false; joinConsultation(); }}
          className="btn-primary flex items-center gap-2 mt-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Access</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Telehealth Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Encrypted Telehealth Room
          </span>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>HIPAA-Standard Encryption</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Local Participant Video */}
        <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-xl">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="h-full w-full object-cover" 
          />
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {!micOn && (
              <span className="rounded-full bg-rose-500/80 p-1.5 text-white backdrop-blur">
                <MicOff className="w-3.5 h-3.5" />
              </span>
            )}
            {!camOn && (
              <span className="rounded-full bg-rose-500/80 p-1.5 text-white backdrop-blur">
                <VideoOff className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <span className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
            You (Local Feed)
          </span>
        </div>

        {/* Remote Participant Video */}
        <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-xl">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="h-full w-full object-cover" 
          />
          {waiting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 text-2xl mb-3 animate-pulse">
                ⏳
              </div>
              <h4 className="font-bold text-base text-white">Connecting consultation…</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-xs">
                Waiting for <span className="text-blue-300 font-semibold">{peerName}</span> to join this active video room.
              </p>
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
            {peerName}
          </span>
        </div>
      </div>

      {/* Floating Modern Telemedicine Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-lg">
        <button 
          onClick={toggleMic} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            micOn 
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200" 
              : "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
          }`}
        >
          {micOn ? <Mic className="w-4 h-4 text-slate-700" /> : <MicOff className="w-4 h-4" />}
          <span>{micOn ? "Mute Mic" : "Unmute Mic"}</span>
        </button>

        <button 
          onClick={toggleCam} 
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            camOn 
              ? "bg-slate-100 text-slate-800 hover:bg-slate-200" 
              : "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
          }`}
        >
          {camOn ? <VideoIcon className="w-4 h-4 text-slate-700" /> : <VideoOff className="w-4 h-4" />}
          <span>{camOn ? "Stop Camera" : "Start Camera"}</span>
        </button>

        <button 
          onClick={leaveCall} 
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 transition-all active:scale-95"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Room</span>
        </button>
      </div>

      {waiting && (
        <p className="text-center text-xs text-slate-500 font-medium">
          💡 If the other participant hasn't joined, ensure both devices are in the Consultation room from their dashboard.
        </p>
      )}
    </div>
  );
}



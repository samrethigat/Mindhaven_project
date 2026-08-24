import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/call/$roomId")({
  component: CallRoom,
});

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function CallRoom() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("Connecting…");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const channel = supabase.channel(`call-${roomId}`, { config: { broadcast: { self: false } } });

    async function start() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (cancelled) return;
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => {
        if (remoteRef.current && e.streams[0]) remoteRef.current.srcObject = e.streams[0];
        setStatus("Connected");
        setJoined(true);
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          void channel.send({ type: "broadcast", event: "ice", payload: e.candidate.toJSON() });
        }
      };

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          void channel.send({ type: "broadcast", event: "answer", payload: answer });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
          }
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
          } catch {
            /* ignore late candidates */
          }
        })
        .on("broadcast", { event: "join" }, async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          void channel.send({ type: "broadcast", event: "offer", payload: offer });
        })
        .subscribe((s) => {
          if (s === "SUBSCRIBED") {
            setStatus("Waiting for the other person…");
            void channel.send({ type: "broadcast", event: "join", payload: {} });
          }
        });
    }

    void start().catch(() => setStatus("Camera or microphone unavailable"));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  function toggle(kind: "audio" | "video") {
    const tracks =
      kind === "audio"
        ? streamRef.current?.getAudioTracks()
        : streamRef.current?.getVideoTracks();
    tracks?.forEach((t) => (t.enabled = !t.enabled));
    if (kind === "audio") setMicOn((v) => !v);
    else setCamOn((v) => !v);
  }

  async function shareScreen() {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (!sender) return;
    if (sharing) {
      const camTrack = streamRef.current?.getVideoTracks()[0];
      if (camTrack) await sender.replaceTrack(camTrack);
      setSharing(false);
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = display.getVideoTracks()[0];
      if (!track) return;
      await sender.replaceTrack(track);
      setSharing(true);
      track.onended = () => {
        const camTrack = streamRef.current?.getVideoTracks()[0];
        if (camTrack) void sender.replaceTrack(camTrack);
        setSharing(false);
      };
    } catch {
      /* user cancelled the picker */
    }
  }

  function fullscreen() {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Secure session</h1>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
        <Card
          ref={shellRef}
          className="relative overflow-hidden border-0 bg-muted p-0 shadow-[var(--shadow-soft)]"
        >
          <video ref={remoteRef} autoPlay playsInline className="aspect-video w-full bg-black object-cover" />
          {!joined && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
              <span className="size-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <p className="font-display text-lg font-semibold">Waiting for the other person…</p>
              <p className="text-sm opacity-80">{status}</p>
            </div>
          )}
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className="absolute right-4 bottom-4 h-28 w-40 rounded-xl border object-cover shadow-lg"
          />
        </Card>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="icon" onClick={() => toggle("audio")}>
            {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => toggle("video")}>
            {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
          </Button>
          <Button
            variant={sharing ? "default" : "outline"}
            size="icon"
            aria-label="Share screen"
            onClick={() => void shareScreen()}
          >
            <MonitorUp className="size-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Fullscreen" onClick={fullscreen}>
            <Maximize className="size-4" />
          </Button>
          <Button
            variant="destructive"
            onClick={() => void navigate({ to: "/appointments" })}
          >
            <PhoneOff className="size-4" /> Leave
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
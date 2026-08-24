import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getCompanionHistory, sendCompanionMessage, analyzeFaceSnapshot } from "@/lib/ai.functions";
import { Camera, CameraOff, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/companion")({
  component: Companion,
});

type Msg = { id: string; role: string; content: string };

function Companion() {
  const history = useServerFn(getCompanionHistory);
  const send = useServerFn(sendCompanionMessage);
  const analyzeFace = useServerFn(analyzeFaceSnapshot);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [faceOn, setFaceOn] = useState(false);
  const [faceEmotion, setFaceEmotion] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingStart = useRef<number | null>(null);

  const { data } = useQuery({ queryKey: ["companion-history"], queryFn: () => history({}) });

  useEffect(() => {
    if (data) setMessages(data as Msg[]);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function toggleFace() {
    if (faceOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setFaceOn(false);
      setFaceEmotion(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setFaceOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error("Camera permission denied.");
    }
  }

  async function captureEmotion(): Promise<string | undefined> {
    const video = videoRef.current;
    if (!faceOn || !video || video.videoWidth === 0) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = (video.videoHeight / video.videoWidth) * 320;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const res = await analyzeFace({ data: { imageDataUrl: canvas.toDataURL("image/jpeg", 0.7) } });
      setFaceEmotion(res.emotion);
      return res.emotion;
    } catch {
      return undefined;
    }
  }

  async function submit() {
    const text = input.trim();
    if (!text || pending) return;
    const typingSpeed =
      typingStart.current != null
        ? Math.round((text.length / Math.max(1, (Date.now() - typingStart.current) / 1000)) * 60)
        : undefined;
    typingStart.current = null;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text }]);
    setPending(true);
    try {
      const emotion = await captureEmotion();
      const res = await send({ data: { message: text, typingSpeed, faceEmotion: emotion } });
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res.answer }]);
      if (res.emergency) {
        toast.error("I've alerted a counsellor and your trusted contacts. You are not alone.");
      }
    } catch {
      toast.error("Mira couldn't reply just now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Mira</h1>
            <p className="text-sm text-muted-foreground">
              Your AI friend. Judgement-free, awake at 3am, and always on your side.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {faceEmotion && <Badge variant="secondary" className="capitalize">{faceEmotion}</Badge>}
            <Button variant="outline" size="sm" onClick={() => void toggleFace()}>
              {faceOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
            </Button>
          </div>
        </div>

        {faceOn && (
          <video
            ref={videoRef}
            muted
            playsInline
            className="mb-3 h-24 w-32 self-end rounded-xl object-cover shadow-[var(--shadow-soft)]"
          />
        )}

        <Card className="flex min-h-0 flex-1 flex-col border-0 p-4 shadow-[var(--shadow-soft)]">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="glass rounded-2xl p-4 text-sm">
                Hi, I&apos;m Mira 💙 Tell me anything — how your day went, what&apos;s heavy, or
                nothing much at all. I&apos;ll listen.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Mira is typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex items-end gap-2 border-t pt-3">
            <Textarea
              autoFocus
              value={input}
              rows={2}
              placeholder="Type what's on your mind…"
              onChange={(e) => {
                if (typingStart.current == null) typingStart.current = Date.now();
                setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              className="min-h-12 resize-none"
            />
            <Button size="icon" disabled={pending || !input.trim()} onClick={() => void submit()}>
              <Send className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
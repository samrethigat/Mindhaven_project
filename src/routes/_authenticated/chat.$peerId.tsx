import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { sendDirectMessage } from "@/lib/messaging.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, CheckCheck, ImageIcon, Mic, Paperclip, Phone, Send, Smile, Square } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/$peerId")({
  component: ChatRoom,
});

const EMOJIS = ["😊", "😢", "❤️", "🙏", "💙", "😅", "🤗", "👍", "🌈", "✨", "😴", "😰"];

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  kind: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  read_at: string | null;
  created_at: string;
};

function Attachment({ msg }: { msg: Msg }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!msg.attachment_path) return;
    void supabase.storage
      .from("chat-files")
      .createSignedUrl(msg.attachment_path, 3600)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [msg.attachment_path]);

  if (!url) return <p className="text-xs opacity-70">Loading attachment…</p>;
  if (msg.kind === "image")
    return <img src={url} alt={msg.attachment_name ?? "Shared image"} className="max-h-64 rounded-lg" />;
  if (msg.kind === "voice") return <audio controls src={url} className="max-w-56" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
      <Paperclip className="size-4" /> {msg.attachment_name ?? "Attachment"}
    </a>
  );
}

function ChatRoom() {
  const { peerId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const send = useServerFn(sendDirectMessage);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const channelKey = useMemo(
    () => [user?.id ?? "", peerId].sort().join("-"),
    [user?.id, peerId],
  );

  const { data: peer } = useQuery({
    queryKey: ["chat-peer", peerId],
    queryFn: async () => {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("counsellors").select("full_name, phone").eq("user_id", peerId).maybeSingle(),
        supabase.from("students").select("full_name, mobile_number").eq("user_id", peerId).maybeSingle(),
      ]);
      return {
        name: c?.full_name ?? s?.full_name ?? "Conversation",
        phone: c?.phone ?? s?.mobile_number ?? null,
      };
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", peerId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${peerId},recipient_id.eq.${peerId}`)
        .order("created_at", { ascending: true })
        .limit(300);
      return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // mark incoming messages as seen
  useEffect(() => {
    if (!user || !messages?.length) return;
    const unread = messages.filter((m) => m.recipient_id === user.id && !m.read_at);
    if (!unread.length) return;
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        unread.map((m) => m.id),
      );
  }, [messages, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-${channelKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages", peerId] });
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if ((payload as { from?: string }).from === peerId) {
          setPeerTyping(true);
          setTimeout(() => setPeerTyping(false), 2500);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelKey, peerId, queryClient, user]);

  function ping() {
    void supabase.channel(`chat-${channelKey}`).send({
      type: "broadcast",
      event: "typing",
      payload: { from: user?.id },
    });
  }

  type OutgoingMessage = {
    recipientId: string;
    content: string;
    kind: "text" | "image" | "file" | "voice";
    attachmentPath?: string;
    attachmentName?: string;
    attachmentType?: string;
  };

  async function deliver(payload: OutgoingMessage) {
    setSending(true);
    try {
      await send({ data: payload });
      void queryClient.invalidateQueries({ queryKey: ["messages", peerId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Message failed to send.");
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    const body = text.trim();
    if (!body) return;
    setText("");
    await deliver({ recipientId: peerId, content: body, kind: "text" });
  }

  async function upload(file: File, kind: "image" | "file" | "voice") {
    if (!user) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Files must be under 15 MB.");
      return;
    }
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("chat-files").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    await deliver({
      recipientId: peerId,
      content: "",
      kind,
      attachmentPath: path,
      attachmentName: file.name,
      attachmentType: file.type,
    });
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        void upload(new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" }), "voice");
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone unavailable.");
    }
  }

  async function startCall() {
    if (!user) return;
    if (!peer?.phone) {
      toast.error("No phone number on file for this contact.");
      return;
    }
    const started = Date.now();
    const { data: log } = await supabase
      .from("call_logs")
      .insert({ caller_id: user.id, callee_id: peerId, kind: "phone", status: "started" })
      .select("id")
      .single();
    window.location.href = `tel:${peer.phone}`;
    const finish = async () => {
      if (!log) return;
      const seconds = Math.round((Date.now() - started) / 1000);
      await supabase
        .from("call_logs")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: seconds,
          status: seconds < 5 ? "missed" : "completed",
        })
        .eq("id", log.id);
    };
    window.addEventListener("focus", () => void finish(), { once: true });
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{peer?.name ?? "Chat"}</h1>
            <p className="h-4 text-xs text-muted-foreground">
              {peerTyping ? "typing…" : "End-to-end private conversation"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void startCall()}
            title={peer?.phone ?? "No phone number on file"}
          >
            <Phone className="size-4" /> Call
          </Button>
        </div>

        <Card className="flex min-h-0 flex-1 flex-col border-0 p-4 shadow-[var(--shadow-soft)]">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {(messages ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Say hello — this chat is private. 💙</p>
            )}
            {(messages ?? []).map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] space-y-1 rounded-2xl px-4 py-2 text-sm ${
                      mine
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                    {m.attachment_path && <Attachment msg={m} />}
                    <div className="flex items-center justify-end gap-1 text-[10px] opacity-70">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {mine &&
                        (m.read_at ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Emoji">
                  <Smile className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="grid grid-cols-6 gap-1 text-xl">
                  {EMOJIS.map((e) => (
                    <button key={e} className="rounded hover:bg-accent" onClick={() => setText((t) => t + e)}>
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" aria-label="Send image" onClick={() => imageRef.current?.click()}>
              <ImageIcon className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Send file" onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-5" />
            </Button>
            <Button
              variant={recording ? "destructive" : "ghost"}
              size="icon"
              aria-label="Voice note"
              onClick={() => void toggleRecording()}
            >
              {recording ? <Square className="size-4" /> : <Mic className="size-5" />}
            </Button>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, "image");
                e.target.value = "";
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, "file");
                e.target.value = "";
              }}
            />
            <Input
              value={text}
              maxLength={4000}
              placeholder="Write a message…"
              onChange={(e) => {
                setText(e.target.value);
                ping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <Button size="icon" disabled={sending || !text.trim()} onClick={() => void submit()}>
              <Send className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

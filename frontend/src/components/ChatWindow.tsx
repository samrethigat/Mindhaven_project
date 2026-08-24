import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatDateTime } from "../lib/utils";
import { notify } from "../lib/permission";
import toast from "react-hot-toast";

export function ChatWindow({ appointmentId, otherName }: { appointmentId: string; otherName: string }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);

  useEffect(() => {
    api.get(`/chats/appointment/${appointmentId}`).then((res) => {
      setMessages(res.data.messages);
    }).catch(() => {});
  }, [appointmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // Mark incoming messages as read when this window is open.
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("message:read", { appointmentId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, appointmentId, messages.length]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg: any) => {
      if (msg.appointment !== appointmentId) return;
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      // If it's from the peer, mark read + notify.
      if (msg.sender !== user?._id) {
        socket.emit("message:read", { appointmentId });
        notify("New message", { body: msg.content || "You received a new message." });
      }
    };
    const onTyping = ({ appointmentId: aid, typing }: any) => {
      if (aid === appointmentId) setPeerTyping(!!typing);
    };
    socket.on("message:new", onNew);
    socket.on("message:sent", onNew);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("message:new", onNew);
      socket.off("message:sent", onNew);
      socket.off("chat:typing", onTyping);
    };
  }, [socket, appointmentId, user?._id]);

  function emitTyping(v: boolean) {
    if (!socket) return;
    socket.emit("chat:typing", { appointmentId, typing: v });
  }

  function handleTyping() {
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1200);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      const { data } = await api.post("/chats", { appointmentId, content, type: "text" });
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send");
    } finally {
      emitTyping(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await api.post("/upload", fd);
      const msgType = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : file.type.startsWith("audio/") ? "voice" : "text";
      const { data } = await api.post("/chats", {
        appointmentId,
        content: up.data.url,
        type: msgType,
      });
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-2xl border border-slate-200 bg-white sm:h-[60vh]">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
          {otherName?.[0] || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{otherName}</p>
          <p className="text-xs text-slate-400">{peerTyping ? "typing…" : "online"}</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m: any) => {
          const mine = m.sender === user?._id;
          const seen = user && m.readBy?.includes(user._id);
          const isImage = m.type === "image";
          const isFile = m.type === "pdf";
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm sm:max-w-[70%] ${mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                {isImage && m.content ? (
                  <img src={m.content} alt="attachment" className="max-h-52 rounded-lg" />
                ) : isFile ? (
                  <a href={m.content} target="_blank" rel="noreferrer" className="underline break-all">📄 {m.fileName || "Download PDF"}</a>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
                <p className={`mt-1 text-[10px] ${mine ? "text-blue-200" : "text-slate-400"}`}>
                  {formatDateTime(m.createdAt)}{" "}
                  {mine && (seen ? "· Seen" : "· Sent ✓")}
                </p>
              </div>
            </div>
          );
        })}
        {peerTyping && (
          <div className="flex justify-start">
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <label className="btn-outline cursor-pointer shrink-0 text-sm">
          📎
          <input type="file" className="hidden" accept="image/*,application/pdf,audio/*" onChange={handleFile} disabled={uploading} />
        </label>
        <input
          className="input min-w-0 flex-1"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
        />
        <button type="submit" className="btn-primary shrink-0">{uploading ? "…" : "Send"}</button>
      </form>
    </div>
  );
}

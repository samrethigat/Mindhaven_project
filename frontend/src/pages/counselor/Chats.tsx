import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { ChatWindow } from "../../components/ChatWindow";

export function CounselorChats() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/chats").then((res) => {
      setConversations(res.data.conversations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Chats</h2>
      {loading ? (
        <Loading />
      ) : conversations.length === 0 ? (
        <Empty title="No conversations" description="Respond to appointment requests to start chatting with patients." />
      ) : (
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <div className={`space-y-2 md:block ${active ? "hidden" : "block"}`}>
            {conversations.map((c: any) => (
              <button
                key={c.appointment}
                onClick={() => setActive(c)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${active?.appointment === c.appointment ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{c.otherName}</p>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">{c.lastMessage || "No messages yet"}</p>
              </button>
            ))}
          </div>
          <div className={active ? "block" : "hidden md:block"}>
            {active ? (
              <>
                {active && (
                  <button onClick={() => setActive(null)} className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 md:hidden">
                    ← Back to conversations
                  </button>
                )}
                <ChatWindow appointmentId={active.appointment} otherName={active.otherName} />
              </>
            ) : (
              <Empty title="Select a conversation" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

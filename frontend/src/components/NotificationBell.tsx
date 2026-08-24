import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSocket } from "../context/SocketContext";
import { formatDateTime } from "../lib/utils";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();

  async function load() {
    try {
      const [c, n] = await Promise.all([
        api.get("/notifications/unread-count"),
        api.get("/notifications"),
      ]);
      setCount(c.data.count);
      setNotifications(n.data.notifications);
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("notification:new", () => load());
    return () => {
      socket.off("notification:new");
    };
  }, [socket]);

  async function markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
    load();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100">
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:w-80">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <Link to="/patient/notifications" className="text-xs text-blue-600" onClick={() => setOpen(false)}>View all</Link>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No notifications</p>}
              {notifications.slice(0, 8).map((n: any) => (
                <button
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition-colors hover:bg-slate-50 ${n.read ? "" : "bg-blue-50"}`}
                >
                  <p className="font-medium text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading } from "../components/ui/Loading";
import { Empty } from "../components/ui/Empty";
import { formatDateTime } from "../lib/utils";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get("/notifications");
    setNotifications(data.notifications);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await api.post("/notifications/read-all");
    load();
  }

  async function markOne(id: string) {
    await api.post(`/notifications/${id}/read`);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <button onClick={markAll} className="btn-outline">Mark all as read</button>
      </div>

      {loading ? (
        <Loading />
      ) : notifications.length === 0 ? (
        <Empty title="No notifications" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <button
              key={n._id}
              onClick={() => markOne(n._id)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${n.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">{n.title}</p>
                <span className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

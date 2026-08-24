import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  PermissionStatus,
  getCameraState,
  getMicState,
  getLocationState,
  getNotificationState,
  requestCamera,
  requestMicrophone,
  getCurrentPosition,
  requestNotifications,
  isSecureContext,
  stopStream,
} from "../../lib/permission";

type Item = {
  key: string;
  icon: string;
  label: string;
  desc: string;
  status: PermissionStatus;
};

function statusUI(status: PermissionStatus) {
  switch (status) {
    case "allowed":
      return { label: "Allowed", cls: "bg-green-100 text-green-700" };
    case "blocked":
      return { label: "Blocked", cls: "bg-red-100 text-red-700" };
    case "dismissed":
      return { label: "Dismissed", cls: "bg-amber-100 text-amber-700" };
    case "unsupported":
      return { label: "Unsupported", cls: "bg-slate-200 text-slate-600" };
    default:
      return { label: "Not requested", cls: "bg-slate-100 text-slate-500" };
  }
}

export function PermissionsPage() {
  usePageTitle("Device Permissions");
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [items, setItems] = useState<Item[]>([
    { key: "camera", icon: "📷", label: "Camera", desc: "For video consultations", status: "not-requested" },
    { key: "microphone", icon: "🎤", label: "Microphone", desc: "For voice conversations & consultations", status: "not-requested" },
    { key: "location", icon: "📍", label: "Location", desc: "For finding nearby counselors", status: "not-requested" },
    { key: "notification", icon: "🔔", label: "Notifications", desc: "For appointment & chat updates", status: "not-requested" },
  ]);

  async function refresh() {
    setLoading(true);
    const [camera, mic, location, notification] = await Promise.all([
      getCameraState(),
      getMicState(),
      getLocationState(),
      getNotificationState(),
    ]);
    setItems((prev) =>
      prev.map((i) => {
        const s =
          i.key === "camera"
            ? camera
            : i.key === "microphone"
            ? mic
            : i.key === "location"
            ? location
            : notification;
        return { ...i, status: s };
      })
    );
    setLoading(false);
  }

  async function syncPermission(key: string, value: boolean) {
    try {
      const { data } = await api.put("/patient/permissions", { permissions: { [key]: value } });
      setUser({ ...user, ...data.user });
    } catch {}
  }

  async function allow(key: string) {
    if (key === "camera") {
      const res = await requestCamera();
      if (res.stream) setStream(res.stream);
      if (res.ok) { await syncPermission("camera", true); toast.success("Camera access granted"); }
      else toast.error(res.reason || "Camera access is required for video consultation.");
    } else if (key === "microphone") {
      const res = await requestMicrophone();
      if (res.stream) setStream(res.stream);
      if (res.ok) { await syncPermission("microphone", true); toast.success("Microphone access granted"); }
      else toast.error(res.reason || "Microphone access is required.");
    } else if (key === "location") {
      const res = await getCurrentPosition();
      if (res.ok) {
        await syncPermission("location", true);
        toast.success("Location access granted. We'll use it to find counselors near you.");
      } else {
        toast.error(res.reason || "Location access helps us find counselors near you. Please allow it or select your city manually.");
      }
    } else if (key === "notification") {
      const res = await requestNotifications();
      if (res.ok) { await syncPermission("notification", true); toast.success("Notifications enabled"); }
      else toast.error(res.reason || "Notification permission was not granted.");
    }
    refresh();
  }

  useEffect(() => {
    refresh();
    return () => { if (stream) stopStream(stream); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Device Permissions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage how MindHaven uses your camera, microphone, location and notifications.
        </p>
      </div>

      {!isSecureContext() && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Camera, microphone and location require a secure (HTTPS) connection. On localhost these work in development.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const s = statusUI(item.status);
          return (
            <div key={item.key} className="card flex flex-wrap items-center gap-3 p-5">
              <span className="text-2xl">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <span className={`badge ${s.cls}`}>{s.label}</span>
              {(item.status === "not-requested" || item.status === "dismissed") && (
                <button onClick={() => allow(item.key)} className="btn-primary">Allow</button>
              )}
              {item.status === "blocked" && (
                <button onClick={() => allow(item.key)} className="btn-outline">Try Again</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-600">Note</p>
        <p className="mt-1">
          Browser security means a website cannot force a permission. To change a permission later, open your
          browser's site settings and update it there. Precise location is never stored permanently — only your
          city/state is used to find nearby counselors.
        </p>
      </div>
    </div>
  );
}

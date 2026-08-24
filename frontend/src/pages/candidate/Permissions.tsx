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
      return { label: "Allowed", cls: "bg-emerald-100 text-emerald-800 font-bold" };
    case "blocked":
      return { label: "Blocked", cls: "bg-rose-100 text-rose-800 font-bold" };
    case "dismissed":
      return { label: "Dismissed", cls: "bg-amber-100 text-amber-800 font-bold" };
    case "unsupported":
      return { label: "Unsupported", cls: "bg-slate-200 text-slate-600" };
    default:
      return { label: "Not requested", cls: "bg-slate-100 text-slate-500" };
  }
}

export function PermissionsPage() {
  usePageTitle("Candidate Device Permissions");
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [items, setItems] = useState<Item[]>([
    { key: "camera", icon: "📷", label: "Camera Access", desc: "Required for WebRTC video consultations with your counselor", status: "not-requested" },
    { key: "microphone", icon: "🎤", label: "Microphone Access", desc: "Required for WebRTC voice consultations & Mira AI voice check-in", status: "not-requested" },
    { key: "location", icon: "📍", label: "Location Services", desc: "Used to discover and sort licensed counselors near you", status: "not-requested" },
    { key: "notification", icon: "🔔", label: "Push Notifications", desc: "For appointment confirmations, reminders, & counselor messages", status: "not-requested" },
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
      const { data } = await api.put("/candidate/permissions", { permissions: { [key]: value } });
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
      else toast.error(res.reason || "Microphone access is required for voice calls.");
    } else if (key === "location") {
      const res = await getCurrentPosition();
      if (res.ok) {
        await syncPermission("location", true);
        toast.success("Location access granted. We will use it to show nearby counselors.");
      } else {
        toast.error(res.reason || "Location access helps us find counselors near you.");
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
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Device & Browser Permissions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage hardware and device access permissions for video, voice, location discovery, and notifications
        </p>
      </div>

      {!isSecureContext() && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
          Camera, microphone, and location APIs require an HTTPS connection in production. On localhost, browser permissions work in development mode.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const s = statusUI(item.status);
          return (
            <div key={item.key} className="card flex flex-wrap items-center gap-3 p-5">
              <span className="text-2xl">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <span className={`badge ${s.cls}`}>{s.label}</span>
              {(item.status === "not-requested" || item.status === "dismissed") && (
                <button onClick={() => allow(item.key)} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">Grant Access</button>
              )}
              {item.status === "blocked" && (
                <button onClick={() => allow(item.key)} className="btn-outline text-xs">Retry Access</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Privacy Guarantee</p>
        <p>
          Your exact real-time coordinates are never continuously tracked or exposed to third parties. Device permissions can be revoked at any time through your browser's site settings.
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const PERMISSION_INTRO_KEY = "mindhaven_permission_intro_seen_v1";

/** First-time professional explanation of device permissions (non-blocking). */
export function PermissionIntro() {
  const { user } = useAuth();
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(PERMISSION_INTRO_KEY);
    } catch {
      return true;
    }
  });

  async function dismiss(_seen: boolean) {
    try {
      localStorage.setItem(PERMISSION_INTRO_KEY, "1");
      // Sync the intro state to backend so it isn't shown repeatedly across devices.
      await api.put("/patient/permissions", { permissions: { introSeen: true } });
    } catch {}
    setOpen(false);
  }

  if (!user || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">🧠</div>
        <h2 className="mt-4 text-xl font-bold">A word about device permissions</h2>
        <p className="mt-2 text-sm text-slate-600">
          MindHaven uses a few device permissions to provide voice, video, nearby counselor search and notifications.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2"><span>📷</span><span className="text-slate-700"><strong>Camera</strong> — for video consultations.</span></div>
          <div className="flex items-center gap-2"><span>🎤</span><span className="text-slate-700"><strong>Microphone</strong> — for voice conversations and consultations.</span></div>
          <div className="flex items-center gap-2"><span>📍</span><span className="text-slate-700"><strong>Location</strong> — for finding nearby counselors.</span></div>
          <div className="flex items-center gap-2"><span>🔔</span><span className="text-slate-700"><strong>Notifications</strong> — for appointment and counselor-chat updates.</span></div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          We only ask for a permission when you use the related feature — nothing is requested automatically.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => dismiss(true)} className="btn-primary flex-1">Continue</button>
          <button onClick={() => dismiss(false)} className="btn-outline flex-1">Not Now</button>
        </div>
      </div>
    </div>
  );
}

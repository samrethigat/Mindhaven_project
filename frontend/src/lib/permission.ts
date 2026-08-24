// ---------------------------------------------------------------------------
// Device permission helpers — camera, microphone, geolocation, notifications.
// Respects browser security rules (JS cannot force a permission). Provides
// granular status detection and "try again" guidance.
// ---------------------------------------------------------------------------

export type PermissionStatus = "allowed" | "blocked" | "not-requested" | "unsupported" | "dismissed";

export const MESSAGES = {
  cameraDenied: "Camera access is required for video consultation. Please allow camera access in your browser settings.",
  micDenied: "Microphone access is required for voice communication. Please allow microphone access in your browser settings.",
  locationDenied: "Location access helps us find counselors near you. Please allow location access or select your city manually.",
  locationMessage:
    "MindHaven uses a few device permissions to provide voice, video, nearby counselor search and notifications.",
};

/** Camera/mic require a secure context (HTTPS or localhost). */
export function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext === true;
}

export function mediaSupported(): boolean {
  return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function");
}

function productToState(permission: PermissionName): Promise<PermissionStatus> {
  return new Promise((resolve) => {
    if (!navigator.permissions || typeof navigator.permissions.query !== "function") {
      resolve("unsupported");
      return;
    }
    navigator.permissions
      .query({ name: permission })
      .then((status: any) => {
        if (status.state === "granted") resolve("allowed");
        else if (status.state === "prompt") resolve("not-requested");
        else resolve("blocked");
      })
      .catch(() => resolve("unsupported"));
  });
}

export async function getCameraState(): Promise<PermissionStatus> {
  return productToState("camera" as PermissionName);
}

export async function getMicState(): Promise<PermissionStatus> {
  return productToState("microphone" as PermissionName);
}

export async function getNotificationState(): Promise<PermissionStatus> {
  if (typeof Notification === "undefined" || typeof Notification.requestPermission !== "function") {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "allowed";
  if (Notification.permission === "denied") return "blocked";
  return "not-requested";
}

export async function getLocationState(): Promise<PermissionStatus> {
  if (!("geolocation" in navigator)) return "unsupported";
  return productToState("geolocation" as PermissionName);
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export async function requestCamera(constraints: MediaStreamConstraints = { video: true }): Promise<{
  ok: boolean;
  stream?: MediaStream;
  status: PermissionStatus;
  reason?: string;
}> {
  if (!isSecureContext()) {
    return { ok: false, status: "unsupported", reason: "Camera requires a secure (HTTPS) connection." };
  }
  if (!mediaSupported()) {
    return { ok: false, status: "unsupported", reason: "Camera is not supported in this browser." };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, ...constraints });
    return { ok: true, stream, status: "allowed" };
  } catch (err: any) {
    const name = err?.name || "";
    const reason =
      name === "NotAllowedError" || name === "PermissionDeniedError"
        ? MESSAGES.cameraDenied
        : name === "NotFoundError" || name === "DevicesNotFoundError"
        ? "No camera device was found."
        : "Camera is unavailable right now.";
    return { ok: false, status: "blocked", reason };
  }
}

export async function stopStream(stream?: MediaStream | null) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
}

// ---------------------------------------------------------------------------
// Microphone
// ---------------------------------------------------------------------------
export async function requestMicrophone(constraints: MediaStreamConstraints = { audio: true }): Promise<{
  ok: boolean;
  stream?: MediaStream;
  status: PermissionStatus;
  reason?: string;
}> {
  if (!isSecureContext()) {
    return { ok: false, status: "unsupported", reason: "Microphone requires a secure (HTTPS) connection." };
  }
  if (!mediaSupported()) {
    return { ok: false, status: "unsupported", reason: "Microphone is not supported in this browser." };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, ...constraints });
    return { ok: true, stream, status: "allowed" };
  } catch (err: any) {
    const name = err?.name || "";
    const reason =
      name === "NotAllowedError" || name === "PermissionDeniedError"
        ? MESSAGES.micDenied
        : name === "NotFoundError" || name === "DevicesNotFoundError"
        ? "No microphone device was found."
        : "Microphone is unavailable right now.";
    return { ok: false, status: "blocked", reason };
  }
}

// ---------------------------------------------------------------------------
// Geolocation — stores only city/state, never precise coordinates permanently.
// ---------------------------------------------------------------------------
export async function getCurrentPosition(): Promise<{
  ok: boolean;
  coords?: { latitude: number; longitude: number };
  status: PermissionStatus;
  reason?: string;
}> {
  if (!isSecureContext()) {
    return { ok: false, status: "unsupported", reason: "Location requires a secure (HTTPS) connection." };
  }
  if (!("geolocation" in navigator)) {
    return { ok: false, status: "unsupported", reason: "Location is not supported in this browser." };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          status: "allowed",
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, status: "blocked", reason: MESSAGES.locationDenied });
        } else {
          resolve({ ok: false, status: "not-requested", reason: "Could not determine your location." });
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function requestNotifications(): Promise<{
  ok: boolean;
  status: PermissionStatus;
  reason?: string;
}> {
  if (typeof Notification === "undefined" || typeof Notification.requestPermission !== "function") {
    return { ok: false, status: "unsupported", reason: "Notifications are not supported in this browser." };
  }
  if (Notification.permission === "granted") return { ok: true, status: "allowed" };
  if (Notification.permission === "denied") return { ok: false, status: "blocked" };
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      return { ok: true, status: "allowed" };
    }
    return { ok: false, status: "blocked", reason: MESSAGES.locationDenied };
  } catch {
    return { ok: false, status: "dismissed", reason: "Notification permission request was dismissed." };
  }
}

/** Fire a browser notification. No-op if not permitted. */
export function notify(
  title: string,
  opts: { body?: string; icon?: string; tag?: string } = {}
): boolean {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  try {
    new Notification(title, { body: opts.body, icon: opts.icon, tag: opts.tag });
    return true;
  } catch {
    return false;
  }
}


/**
 * CORS allowed-origins helper for MindHaven.
 *
 * `FRONTEND_URL` may contain one or more browser origins separated by commas,
 * e.g.:
 *   FRONTEND_URL=https://mindhaven.example.com,http://localhost:5173
 *
 * This is shared by Express CORS middleware and Socket.IO so HTTP API calls
 * and real-time WebSockets can connect securely without cross-origin errors.
 */

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];

/** Parse the FRONTEND_URL env var into a normalized list of origins. */
export function getAllowedOrigins() {
  const raw = process.env.FRONTEND_URL || "";
  const configured = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return Array.from(new Set([...DEV_ORIGINS, ...configured]));
}

/** Check if an origin is permitted */
function isOriginAllowed(origin, allowedList) {
  if (!origin) return true; // Mobile apps, curl, server-to-server requests
  if (allowedList.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true; // Any Vercel preview or production deployment
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

/** CORS origin callback used by Express `cors()`. */
export function corsOptions() {
  const allowed = getAllowedOrigins();
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowed)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  };
}

/** Socket.IO compatible origins function. */
export function socketCorsOrigins() {
  const allowed = getAllowedOrigins();
  return (origin, callback) => {
    if (isOriginAllowed(origin, allowed)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by Socket.IO CORS: ${origin}`));
  };
}

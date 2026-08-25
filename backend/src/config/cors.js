/**
 * CORS allowed-origins helper.
 *
 * `FRONTEND_URL` may contain one or more browser origins separated by commas,
 * e.g.:
 *   FRONTEND_URL=https://mindhaven.example.com,http://localhost:5173
 *
 * This is shared by both the Express CORS middleware and the Socket.IO
 * CORS config so HTTP API calls and real-time WebSocket connections come
 * from the same allow-list. It also always includes the dev origin so local
 * development keeps working even if it isn't listed.
 */

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

/** Parse the FRONTEND_URL env var into a normalized list of origins. */
export function getAllowedOrigins() {
  const raw = process.env.FRONTEND_URL || "";
  const configured = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // De-duplicate while preserving order.
  return Array.from(new Set([...DEV_ORIGINS, ...configured]));
}

/** CORS origin callback used by Express `cors()`. */
export function corsOptions() {
  const allowed = getAllowedOrigins();
  return {
    origin(origin, callback) {
      // Allow requests with no Origin (mobile apps, curl, same-origin).
      if (!origin) {
        return callback(null, true);
      }
      if (allowed.includes(origin) || (origin.endsWith(".vercel.app") || origin.includes("localhost"))) {
        return callback(null, true);
      }
      // In development or when explicitly listed, permit origin
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  };
}

/** Socket.IO compatible origins array. */
export function socketCorsOrigins() {
  return getAllowedOrigins();
}


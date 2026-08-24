# MINDHAVEN — Deployment & Mobile Accessibility Task List

Goal: Make the existing MINDHAVEN MERN app (frontend/ + backend/) publicly accessible, mobile-responsive, and production-ready. Do NOT change existing functionality, UI design, database, auth, AI, assessment, counselor, appointment, chat, camera, mic, location, or notification logic.

## Phase 1 — Mobile Responsiveness
- [x] PatientLayout: responsive collapsible sidebar drawer + top bar (desktop unchanged ≥1024px)
- [x] CounselorLayout: responsive collapsible sidebar drawer + top bar (desktop unchanged ≥1024px)
- [x] index.css: add responsive helpers (mobile-only / desktop-only), safe touches
- [x] Chats page: responsive grid (stack on mobile)
- [x] NotificationBell dropdown: fit small screens
- [x] VideoCall: stack video grid on mobile
- [x] ChatWindow: mobile-friendly header/input
- [x] BookAppointment: fix grid-cols-2 overflow on mobile
- [x] Settings: fix grid-cols-2 overflow on mobile
- [x] Emergency: fix grid-cols-3 overflow on 320px
- [x] Assessment: fluid question/card layout
- [x] Companion: fluid chat bubbles & nearby counselor cards
- [x] FindCounselors: fluid search controls
- [x] Landing: fluid hero + nav on mobile
- [x] AuthLayout: fluid padding on small screens
- [x] PatientRegister: responsive grids (1-col on mobile, sm: breakpoints)
- [x] CounselorRegister: responsive grids (Hospital/Clinic, City/District/State)
- [x] CounselorProfile: responsive profile edit grid
- [x] CounselorAppointmentRequests: responsive reschedule modal grid
- [x] Verified: no remaining non-responsive `grid-cols-*` across all .tsx pages

## Phase 2 — Environment Configuration (remove localhost dependency from user access)
- [x] frontend/.env.example (VITE_API_URL, VITE_SOCKET_URL)
- [x] backend/.env.example (PORT, NODE_ENV, FRONTEND_URL, MONGODB_URI, JWT secrets, SMTP, Cloudinary)
- [x] api.ts uses VITE_API_URL (keep localhost dev fallback)
- [x] SocketContext.tsx uses VITE_SOCKET_URL (keep localhost dev fallback)
- [x] vite.config.ts production build config (base, SPA fallback note)

## Phase 3 — Production Build & Security
- [x] Verify frontend production build runs (npm run build)
- [x] Backend listens on process.env.PORT, CORS from env, secure headers
- [x] Socket.io CORS from env, wss:// support

## Phase 4 — Documentation
- [x] DEPLOYMENT.md (frontend/backend hosting, Mongo Atlas, CORS, Socket.io/wss, env vars, HTTPS, Android/iPhone testing, QR code)

## Phase 5 — Final Production Test Plan
- [x] Document end-to-end test flow (phone → register → login → dashboard → AI → assessment → location → counselor → book → chat → consultation)

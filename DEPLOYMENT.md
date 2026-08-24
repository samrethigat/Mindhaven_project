# MINDHAVEN — Production Deployment Guide

Deploy the **existing** MINDHAVEN application as one public HTTPS web app that any
student can open from a phone or laptop — no localhost required.

There are **two deployable parts**:

| Part | Folder | Stack | Host suggestion |
|------|--------|-------|-----------------|
| Frontend (the website students see) | `frontend/` | React + Vite + TS + Tailwind | **Vercel** (free) |
| Backend (API + Socket.IO + DB) | `backend/` | Node.js + Express + MongoDB + Socket.io | **Render** (free) |

The database is your **existing MongoDB Atlas** cluster — we do **not** create a new one.

---

## 1. What is already prepared

- **Mobile responsiveness** — restored/across every page (down to 320px). No separate mobile site.
- **Env-driven frontend** — `frontend/src/lib/api.ts` and `frontend/src/context/SocketContext.tsx`
  read `VITE_API_URL` and `VITE_SOCKET_URL`. No localhost is hard-coded for production.
- **Env-driven backend** — `backend/src/server.js` listens on `process.env.PORT`, reads
  `MONGODB_URI`, JWT secrets, SMTP, Cloudinary from env. CORS and Socket.IO use a shared
  allow-list from `FRONTEND_URL` (comma separated) in `backend/src/config/cors.js`.
- **Cross-origin auth cookies** — the refresh cookie uses `Secure` + `SameSite=None` in
  production (`backend/src/controllers/authController.js`) so login/token-refresh keeps
  working when the frontend and backend are on different domains.
- **SPA routing** — `frontend/vercel.json` rewrites all routes to `index.html` so page
  refreshes / deep links don't 404.
- **Render blueprint** — `backend/render.yaml` for one-click backend hosting.
- **Env templates** — `frontend/.env.example` and `backend/.env.example`.
- **QR code page** — `qr.html` (open it, paste your final URL, screenshot the QR).

---

## 2. Environment variables — exactly what to configure

### Backend (Render dashboard → Environment, or `backend/.env`)

```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://mindhaven.yourdomain.com,http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/mindhaven?retryWrites=true&w=majority
JWT_SECRET=long_random_secret_a
JWT_REFRESH_SECRET=long_random_secret_b
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_NAME=MindHaven Support
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> `FRONTEND_URL` **must** contain your deployed frontend origin (no trailing slash).
> Add `http://localhost:5173` as well so local dev still works.

### Frontend (Vercel dashboard → Project → Settings → Environment Variables)

```
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
VITE_SOCKET_URL=wss://YOUR-BACKEND-DOMAIN
```

> `VITE_API_URL` ends with `/api`. `VITE_SOCKET_URL` uses `wss://` (secure WebSocket).
> Example: if backend is `https://mindhaven-backend.onrender.com`, then:
> - `VITE_API_URL=https://mindhaven-backend.onrender.com/api`
> - `VITE_SOCKET_URL=wss://mindhaven-backend.onrender.com`

**Never** put `MONGODB_URI`, JWT secrets, SMTP, or Cloudinary keys in the frontend.

---

## 3. Deploy the BACKEND (Render)

1. Push the repo to GitHub (include `backend/`).
2. In [render.com](https://render.com) → **New → Web Service** → connect your repo.
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
3. Add every backend env var listed in section 2.
4. Deploy. Render gives you an HTTPS URL like `https://mindhaven-backend.onrender.com`.
5. Verify: open `https://mindhaven-backend.onrender.com/api/health` → `{"status":"ok",...}`.

> If you prefer **Railway** or **Fly.io**, the same `npm install && npm start` + env vars apply.

---

## 4. Deploy the FRONTEND (Vercel)

1. In [vercel.com](https://vercel.com) → **New Project** → import the same repo.
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
2. Add frontend env vars (`VITE_API_URL`, `VITE_SOCKET_URL`) under Settings → Environment Variables.
3. Deploy. Vercel gives you an HTTPS URL like `https://mindhaven.vercel.app`.
4. Optional: add your own domain (e.g. `mindhaven.yourdomain.com`) in **Settings → Domains**.

> `frontend/vercel.json` already handles SPA routing (deep links won't 404).

---

## 5. Connect frontend ↔ backend

- Backend CORS allows origins listed in `FRONTEND_URL`. Make sure your frontend origin is there.
- Frontend calls `VITE_API_URL` (e.g. `https://mindhaven-backend.onrender.com/api`).
- Socket.IO connects to `VITE_SOCKET_URL` (e.g. `wss://mindhaven-backend.onrender.com`).
- Both use `credentials: true`; JWT is sent via `Authorization: Bearer` header + refresh cookie.

---

## 6. MongoDB Atlas (existing database)

Do **not** create a new database. Only:
1. In Atlas, allow network access: **Network Access → Add IP** → `0.0.0.0/0` (open to the internet) so both Render and student traffic can connect.
2. Put your existing connection string into the backend `MONGODB_URI` env var.
3. Optionally create a dedicated DB user with a strong password.

---

## 7. CORS & Socket.IO / WebSockets

- Backend `backend/src/config/cors.js` reads `FRONTEND_URL` (comma-separated) and applies it to
  both Express CORS and Socket.IO.
- Socket.IO uses secure `wss://` automatically when served over HTTPS (Render does this for you).
- The frontend `VITE_SOCKET_URL` must start with `wss://` in production.
- Render's Web Service supports WebSockets on the free + paid plans. If you use a platform that
  doesn't, enable sticky sessions / WebSocket support in its settings.

---

## 8. HTTPS

- **Vercel** and **Render** give you HTTPS certificates automatically for their domains.
- For your own domain (`mindhaven.yourdomain.com`), add it in Vercel → Domains (auto HTTPS)
  and Render → Settings → Custom Domain (auto HTTPS).
- Camera, microphone, geolocation and notifications **require** HTTPS — this is why we use
  `https://` everywhere. localhost is the only exception and is only for dev.

---

## 9. Test from an Android phone

1. Open your public URL in Chrome on the phone.
2. Confirm the padlock 🔒 (HTTPS) is shown.
3. Register a patient, log in, go to **Device Permissions**, allow camera/mic/location/notifications.
4. Test AI Friend, Assessment, Find Counselors (location), book an appointment, chat, and video consultation.

---

## 10. Test from an iPhone

1. Open the URL in Safari (or Chrome). Allow HTTPS.
2. For camera/mic/video, Safari requires the page to be opened — accept the permission prompts.
3. Notifications: iOS requires the site to be added to Home Screen (Add to Home Screen) for web push.
   In-app notification bell still works on all browsers.

---

## 11. Generate / share the QR code

1. Open `qr.html` in a browser.
2. Paste your final public URL (e.g. `https://mindhaven.yourdomain.com`) and press Enter.
3. Screenshot the QR.
4. Share via WhatsApp, Telegram, email, college groups, printed posters, and your project presentation.
5. Scanning with any phone camera opens MINDHAVEN directly.

---

## 12. Post-deploy verification checklist

- [ ] `https://YOUR-FRONTEND/api/health` (backend) returns ok (use your backend URL).
- [ ] Frontend loads over HTTPS with no mixed-content warnings.
- [ ] Register → Login → Patient Dashboard works.
- [ ] AI Friend, Assessment, Level 1 / Level 2 work on mobile.
- [ ] Location permission → Find nearby counselors.
- [ ] Book appointment → counselor accepts → real-time chat works.
- [ ] Video/voice consultation works (camera + mic granted).
- [ ] No horizontal scroll on a 320px-wide phone.
- [ ] No `localhost` reached by end users (only dev).

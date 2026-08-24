# MindHaven — Mental Health Support System

A complete **Digital Mental Health and Psychological Support System for Students in Higher Education** featuring a strict role-based **Patient ↔ Counselor** workflow, appointment booking with real emails and notifications, real-time chat, and a professional medical-style counselor portal.

> This is a full-stack MERN application: **React + Vite + TypeScript + Tailwind** (frontend) and **Node.js + Express + MongoDB + Mongoose + JWT + Socket.io + Nodemailer** (backend).

---

## Folder Structure

```
.
├── backend/                 # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── config/          # DB, Cloudinary
│   │   ├── controllers/     # auth, appointment, chat, counselor, patient, notification, call, upload
│   │   ├── middleware/      # auth, role authorization, validation, error handler
│   │   ├── models/          # User, Appointment, Message, Notification, CallLog, EmailLog
│   │   ├── routes/          # all API routes
│   │   ├── scripts/         # seedCounselors
│   │   ├── services/        # email, notification, reminder, templates
│   │   ├── socket/          # Socket.io real-time chat
│   │   ├── utils/           # JWT token helpers
│   │   └── server.js
│   └── .env.example
├── frontend/                # React + Vite + TS + Tailwind
│   └── src/
│       ├── components/      # ChatWindow, NotificationBell, Loading, Empty
│       ├── context/         # AuthContext, SocketContext
│       ├── layouts/         # PatientLayout, CounselorLayout
│       ├── lib/             # api client, utils
│       └── pages/           # auth, landing, patient, counselor
└── TODO.md
```

---

## Key Features

### Role-Based Access (very strict)
- Two completely separate roles: **Patient** and **Counselor**.
- Separate login pages. Cross-portal login is **blocked** with a clear message.
- Role is enforced on the **backend** via JWT — never trusted from the frontend.
- Manual URL access to the wrong role's pages returns **Unauthorized Access** and redirects to the user's own dashboard.

### Appointment Lifecycle
- Patient books → saved as **Pending**
- Counselor instantly emailed: **"New Appointment Request - Mental Health Support System"**
- Patient gets a **submission confirmation** email
- Counselor gets an **in-app notification** (with unread badge)
- Counselor **Accept** → Confirmed → patient emailed + notified
- Counselor **Reject** → optional reason → patient emailed + notified
- Counselor **Reschedule** → history saved → patient + counselor emailed + notified
- **24h reminder** emails to both parties (scheduled job)

### Real-Time Chat (Socket.io)
- Only patients with an appointment and their assigned counselor can chat
- Text, emoji, images, PDFs, voice messages
- Instant delivery; offline/unread recipients get email + notification

### Notification Center
- Database-backed notifications for both roles
- Unread counters, mark-as-read, mark-all-read

### Calls
- Call button uses `tel:` for the registered phone number
- Phone numbers are only revealed to the two matched users
- Call logs with duration

### Counselor Account Deletion
- Requires current password + typing `DELETE`
- Deactivates account, cancels future appointments, notifies + emails affected patients, blocks future login

### Security
- JWT access + refresh tokens, bcrypt password hashing
- Helmet, rate limiting, input validation, ownership checks on every route
- Email failure is logged + retried and **never** breaks appointment booking

---

## Getting Started

### 1. Backend

```sh
cd backend
cp .env.example .env
# 1. Create a MongoDB Atlas cluster and paste the URI into MONGODB_URI
# 2. Add SMTP credentials (Gmail App Password / SendGrid / Mailgun)
# 3. Add JWT secrets and Cloudinary keys
npm install
npm run dev        # http://localhost:5000
```

Optional — seed 3 demo counselors (remove before production):

```sh
npm run seed:counselors
```

### 2. Frontend

```sh
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

---

## Example `.env` (backend)

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mindhaven
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

### Frontend `.env`

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Scripts

| Command | Description |
| --- | --- |
| `cd backend && npm run dev` | Run backend (nodemon) |
| `cd backend && npm start` | Run backend (production) |
| `cd backend && npm run seed:counselors` | Seed demo counselors |
| `cd frontend && npm run dev` | Run frontend (Vite) |
| `cd frontend && npm run build` | Build frontend for production |

---

## Deployment

| Layer | Recommended |
| --- | --- |
| Frontend | Vercel (build `npm run build`, output `dist`) |
| Backend | Render (build `npm install`, start `node src/server.js`) |
| Database | MongoDB Atlas |
| Email | SMTP provider (Gmail / SendGrid / Mailgun) |
| File storage | Cloudinary |

### 🌐 Production deployment (public HTTPS URL for all students)

The project is **mobile-responsive** and **deployment-ready**. To take it live on one public
HTTPS URL (works on Android, iPhone, tablets, laptops from any network — no localhost), follow
the complete step-by-step guide:

👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Key points:
- Frontend uses `VITE_API_URL` / `VITE_SOCKET_URL` (see `frontend/.env.example`) — no hard-coded localhost in production.
- Backend reads `PORT`, `MONGODB_URI`, JWT secrets, SMTP, Cloudinary from env (see `backend/.env.example`).
- CORS + Socket.IO use a shared allow-list from `FRONTEND_URL` (`backend/src/config/cors.js`), comma-separated.
- SPA routing is handled by `frontend/vercel.json` / `frontend/netlify.toml` (page refreshes won't 404).
- QR-code access: open `qr.html`, paste your final URL, and print/screenshot the QR to share across WhatsApp, Telegram, email, college groups and posters.

### Deployment config files
- `frontend/vercel.json` — SPA catch-all rewrites for Vercel
- `frontend/netlify.toml` — SPA fallback for Netlify
- `backend/render.yaml` — Render blueprint (web service, `npm start`)
- `backend/Dockerfile` + `backend/.dockerignore` — optional container deployment
- `frontend/.env.example` / `backend/.env.example` — env templates
- `.vercelignore` — ignore non-frontend paths when pointing Vercel at the repo root

---

## Testing the Core Flows

1. **Patient login** → patient dashboard → patient features only
2. **Counselor login** → counselor dashboard → own details → patient pages blocked
3. **Book appointment** → saved, counselor email, patient confirmation email, both notifications
4. **Accept** → confirmed, patient email + notification, chat enabled
5. **Chat** → real-time message, offline notifications/emails
6. **Reschedule** → both notified/emailed, history saved
7. **Delete account** → password + DELETE → deactivated, future appointments cancelled, patients notified

---

## Notes

- The existing **MindHaven** app (TanStack Start + Supabase) remains untouched in the repo root. This new system lives in `backend/` and `frontend/`.
- Replace demo counselor seed data with real licensed counsellors before production.
- Configure HTTPS and trusted origins in production.

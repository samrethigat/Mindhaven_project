# MindHaven Backend

Node.js + Express + MongoDB backend for the Mental Health Support System.

## Features

- **Role-based auth** (Patient / Counselor) with JWT access + refresh tokens (httpOnly cookies)
- **Cross-portal login blocking** — a Patient cannot log into the Counselor portal and vice-versa
- **Appointments** — book, accept, reject, reschedule, cancel, with ownership checks
- **Email system** — Nodemailer with delivery logging + failure retry (never breaks booking)
- **Notifications** — in-app database-backed notifications with unread counters
- **Real-time chat** — Socket.io, gated to users who share an appointment
- **Calls** — call logs + `tel:` fallback, phone revealed only to matched users
- **Counselor account deletion** — password + DELETE confirmation, cancels future appointments
- **Appointment reminders** — scheduled job 24h before appointment
- **Cloudinary uploads** — profile photos, chat images/PDFs/voice
- **Security** — Helmet, rate limiting, validation, ownership checks, sanitized responses

## Setup

```sh
cd backend
cp .env.example .env
# fill in MongoDB URI, JWT secrets, SMTP, Cloudinary
npm install
npm run dev   # starts on http://localhost:5000
```

## Scripts

- `npm run dev` — start with nodemon
- `npm start` — start in production
- `npm run seed:counselors` — seed 3 demo counselors (remove before production)

## API Summary

| Area | Base |
| --- | --- |
| Auth | `/api/auth` |
| Counselor | `/api/counselor` |
| Patient | `/api/patient` |
| Appointments | `/api/appointments` |
| Chats | `/api/chats` |
| Notifications | `/api/notifications` |
| Calls | `/api/calls` |
| Upload | `/api/upload` |
| Health | `/api/health` |

## Security Notes

- Roles are enforced on the backend via JWT — never trust the frontend role.
- Ownership is checked on every appointment/chat/call route.
- Passwords are hashed with bcrypt.
- `.env` is never committed.

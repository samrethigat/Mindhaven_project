# MindHaven Frontend

React + Vite + TypeScript + Tailwind frontend for the Mental Health Support System.

## Features

- **Landing page** — hero, features, levels of care
- **Patient portal** — dashboard, find counselors, book appointments, my appointments, chats, notifications, emergency contacts, settings
- **Counselor portal** — professional medical-style dashboard, profile, appointment requests (accept/reject/reschedule), appointments, patients, chats, notifications, availability, account settings, secure account deletion
- **Strict role-based routing** — patients and counselors never see each other's pages (Unauthorized → redirect to own dashboard)
- **Real-time chat** with Socket.io
- **Notification center** with unread badges
- Responsive, loading/empty/error states, toasts

## Setup

```sh
cd frontend
cp .env.example .env
npm install
npm run dev   # starts on http://localhost:5173 (proxies /api to :5000)
```

## Env Variables

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | `http://localhost:5000` |

## Build for production

```sh
npm run build
npm run preview
```

## Deployment (Vercel)

1. Build command: `npm run build`
2. Output directory: `dist`
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend URLs.

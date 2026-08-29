# SPO Admin Web — Somali Police OBE

React admin portal for **SPO — Somali Police OBE**. Talks only to the Backend REST API (never MongoDB directly).

## Prerequisites

- Node.js 18+
- Backend running at `http://localhost:5000` with MongoDB `Citizen_Police_Portal`

## Setup

```bash
cd Web
npm install
```

Optional: create `.env` to override the API base URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Seeded admin login

- Email: `admin@spf.gov.so`
- Password: `admin123`

Citizen accounts are rejected at login for this portal.

## Main routes

| Path | Description |
|------|-------------|
| `/login` | Staff login |
| `/dashboard` | Summary + recent activity |
| `/citizens` | Citizen list / search / status |
| `/citizens/:id` | Citizen details + related records |
| `/settings` | Settings landing |
| `/settings/users` | Staff users + police registration |
| `/settings/permissions` | Permissions availability (Coming Soon when unsupported) |
| `/complaints`, `/ob-records`, `/reports`, `/notifications`, `/audit-logs`, `/profile` | Coming soon |

## Stack

- Vite + React 19
- React Router
- Backend: `http://localhost:5000/api`

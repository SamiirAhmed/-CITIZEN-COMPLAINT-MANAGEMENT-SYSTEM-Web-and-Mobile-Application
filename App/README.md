# SPF Citizen Mobile Application

Flutter citizen client for the **Citizen Police Portal**.

## Architecture

```
Flutter App  →  Backend API (Node/Express)  →  MongoDB (Citizen_Police_Portal)
React Web    →  Backend API (Node/Express)  →  MongoDB (Citizen_Police_Portal)
```

The Flutter app never connects to MongoDB directly.

## Project layout (`lib/`)

- `application/` — app shell, routes, theme
- `core/` — API client, secure session, validators, shared widgets
- `models/` — citizen, complaint, OB, notification models
- `services/` — authentication, citizen, complaint, OB, notification APIs
- `layouts/` — drawer + bottom navigation shell
- `navigation/` — navigation items
- `features/` — authentication, dashboard, complaints, OB, notifications, profile

## Features

- Citizen registration & login with strict validation
- Secure token session storage
- Premium dashboard with live summary data
- Drawer + bottom navigation
- Submit & track complaints
- View related OB records
- Notifications (read/unread)
- Profile, edit profile, change password
- Logout with session clear

## Validation (Flutter + Backend)

| Field | Rule |
|-------|------|
| Name | Required, max 30 characters |
| NIRA ID | Required, exactly 11 characters |
| Phone | Required |
| Tell | Required |
| Email | Required, valid format |
| Password | Required, minimum 8 characters |

## Setup

1. Start MongoDB
2. Start Backend (uses database `Citizen_Police_Portal`):

```bash
cd Backend
npm install
npm run dev
```

3. Flutter:

```bash
cd App
flutter pub get
flutter run
```

The app always uses the local backend:
- Windows / web: `http://127.0.0.1:5000/api`
- Android emulator: `http://10.0.2.2:5000/api` (this is your PC localhost)

Do not pass a hosted API URL. The app uses only the local backend.

## Branding

- Primary: SPF Blue `#0B3D91`
- Logo: `assets/branding/spf_logo.png`

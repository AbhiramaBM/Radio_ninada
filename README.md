# Radio Ninada - Complete Backend & Admin Dashboard

Modern digital community radio backend server and Next.js 15 Admin Dashboard powering **Radio Ninada**.

---

## Development Login Credentials

| Role | Email | Login Method | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `radioninada@gmail.com` | Firebase (Email / Google) | Full system access, role assignment, system settings |
| **Dev Admin** | `admin@radioninada.local` | Password `Admin@123` | Local development admin |
| **Editor** | `editor@radioninada.local` | Password `Editor@123` | Content CRUD: Programs, Podcasts, News, Schedule, Events |
| **RJ (Host)** | `rj@radioninada.local` | Password `RJ@123` | Live streaming control, host profile, podcast uploads |
| **Moderator** | `mod@radioninada.local` | Password `Mod@123` | User registration moderation, participant approvals |

---

## Firebase Setup (Authentication + Firestore + Phone OTP)

1. Create or use the Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com) with **radioninada@gmail.com**.
2. Enable **Authentication** providers:
   - Email/Password
   - Google (use radioninada@gmail.com as owner)
   - Phone (for OTP login)
3. Create a **Web app** and copy the config into:
   - `admin/.env.local` (see `admin/.env.local.example`)
   - `frontend/js/firebase-config.js` (`window.__FIREBASE_CONFIG__`)
4. Create a **Service Account** key (Project Settings → Service Accounts) and add to `backend/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
5. Enable **Firestore Database** and deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Set `ADMIN_EMAIL=radioninada@gmail.com` in backend `.env` (default).

When `radioninada@gmail.com` signs in via Firebase, the backend assigns **SUPER_ADMIN** automatically.

---

## Project Architecture

```
radioninada/
├── Radio_ninada/               # Existing Public Web Frontend (HTML/CSS/JS preserved)
│   └── js/api-client.js        # REST API connector script for public site
├── backend/                    # Node.js + Express + Prisma REST API Server
│   ├── src/
│   │   ├── config/             # Config & Prisma Client instance
│   │   ├── controllers/        # Route controllers for all 15 modules
│   │   ├── middlewares/        # JWT Auth, Role RBAC, Zod Validation, Audit Logging
│   │   ├── routes/             # REST Express router endpoints (/api/*)
│   │   ├── socket/             # Socket.IO Realtime engine for live listener stats
│   │   └── utils/              # JWT, Slug generator, Duplicate checker, CSV export
│   ├── prisma/
│   │   ├── schema.prisma       # Complete Normalized PostgreSQL / SQLite Data Schema
│   │   └── seed.ts             # Dev Seed script with admin accounts & sample data
│   └── package.json
└── admin/                      # Next.js 15 Admin Dashboard Portal
    ├── src/
    │   ├── app/                # Next.js App Router (Dashboard, Live, Programs, etc.)
    │   ├── components/         # UI Navigation, Header, Cards, Tables, Modals, Charts
    │   ├── lib/                # Axios API client with automatic JWT refresh
    │   └── store/              # Zustand Auth Store
    └── package.json
```

---

## Quick Start Guide

### 1. Start Backend API Server
```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```
Backend will start on `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 2. Start Admin Dashboard
```bash
cd admin
npm install
npm run dev
```
Admin Dashboard will open on `http://localhost:3000`. Navigate to `http://localhost:3000/login` to sign in using seeded credentials.

---

## REST API Endpoints Overview

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue JWT Access/Refresh tokens |
| | `POST` | `/api/auth/firebase` | Verify Firebase ID token & issue JWT (admin: radioninada@gmail.com) |
| | `POST` | `/api/auth/refresh` | Refresh expired access token |
| | `GET` | `/api/auth/me` | Fetch active user profile |
| **Users** | `GET/POST` | `/api/users` | List / Create user accounts |
| | `PATCH` | `/api/users/:id/role` | Update user role (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, etc.) |
| | `PATCH` | `/api/users/:id/status` | Update user status (`ACTIVE`, `SUSPENDED`, `BANNED`) |
| **Live Radio**| `GET/PUT` | `/api/live` | Get live state / Update stream URL & playing song |
| | `POST` | `/api/live/toggle` | Toggle broadcast ON AIR / OFF AIR |
| **Programs** | `GET/POST` | `/api/programs` | List / Create program (with duplicate title warning) |
| | `POST` | `/api/programs/bulk-delete` | Bulk soft-delete programs |
| **Podcasts** | `GET/POST` | `/api/podcasts` | List / Upload audio episode |
| | `POST` | `/api/podcasts/:id/download` | Increment download counter |
| **Schedule** | `GET/POST` | `/api/schedule` | Weekly schedule slots (with overlap conflict detector) |
| **News** | `GET/POST` | `/api/news` | Category news articles (College, Local, State, etc.) |
| **RJs** | `GET/POST` | `/api/rj` | Host profiles, social links, and achievements |
| **Events** | `GET/POST` | `/api/events` | Manage events & participant ticket registrations |
| | `GET` | `/api/events/:id/export-csv` | Export attendee list as CSV |
| **Gallery** | `GET/POST` | `/api/gallery` | Photo/Video albums and studio media |
| **Analytics**| `GET` | `/api/analytics/dashboard` | Station metrics, listeners, and chart analytics |
| | `GET` | `/api/analytics/export` | Download full analytics report CSV |
| **AI Ready** | `GET` | `/api/ai/search` | AI Semantic search endpoint stub |
| | `GET` | `/api/ai/podcast/:id/summary` | AI Podcast summary generator stub |

---

## Security Features
- **JWT Authentication**: Short-lived access tokens with secure refresh tokens.
- **RBAC Enforcement**: Fine-grained role permissions middleware (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `RJ`, `MODERATOR`).
- **Input Validation**: Zod schema validation on body, query, and params.
- **Audit Logging**: Logs every administrative action, IP address, and resource target into `AuditLog`.
- **Helmet & Rate Limiting**: HTTP security headers and IP rate limiting (300 requests / 15 mins).
- **Duplicate Prevention**: Automated title & season/episode duplicate collision warning.

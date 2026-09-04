# Radio Ninada 90.4 FM - Production Platform

A modern, full-stack digital community radio platform powering **Radio Ninada 90.4 FM** (broadcasted from SDM College, Ujire). The platform provides live stream playback, on-demand podcast broadcasting, weekly program timetables, news, and an integrated Cloudinary Media Library for station staff.

---

## 1. Project Architecture

The repository is organized strictly into two application directories:

```text
Radio_ninada/
├── backend/                    # Node.js + Express + TypeScript + Prisma REST API Server
│   ├── src/
│   │   ├── config/             # Environment, Prisma Client, and Cloudinary configurations
│   │   ├── controllers/        # REST API controllers (Auth, Podcasts, Media, Live, etc.)
│   │   ├── middlewares/        # JWT Auth, Role RBAC, Multer upload, and Centralized Error handling
│   │   ├── routes/             # API routes (/api/*)
│   │   ├── services/           # Cloudinary media service with automatic temp file cleanup
│   │   ├── socket/             # Real-time WebSocket engine for live broadcast states
│   │   ├── utils/              # JWT, Slug generator, and Logging helpers
│   │   ├── validation/         # Zod schemas for request validation
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # HTTP server and WebSocket initialization
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL normalized schema (Media, Podcasts, Episodes, etc.)
│   │   └── seed.ts             # Development seed script (Super Admin, Categories, Hosts, Live state)
│   ├── uploads/                # Temporary staging directory for Multer uploads (.gitkeep)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                   # Public Web Frontend (HTML5, CSS, Vanilla JavaScript)
│   ├── css/                    # Responsive stylesheet
│   ├── images/                 # Station logos and static branding assets
│   ├── js/
│   │   ├── api-client.js       # Centralized REST API client (no Firebase)
│   │   ├── app.js              # UI dynamic data synchronizer & modal management
│   │   ├── media.js            # In-browser Media Library for staff (Cloudinary management)
│   │   ├── player.js           # HTML5 Audio engine (Live stream & on-demand podcasts)
│   │   ├── podcasts.js         # Podcast catalog, category filters, and episode streaming
│   │   ├── programs.js         # Daily schedule and RJ host roster
│   │   └── utils.js            # Toast alerts, date/time formatting, and HTML escaping
│   ├── index.html              # Main public radio web application
│   ├── package.json            # Static preview server scripts
│   └── README.md
│
├── .gitignore
├── vercel.json                 # Unified deployment configuration
└── README.md                   # System documentation
```

---

## 2. Technology Stack

- **Frontend**: Semantic HTML5, Vanilla JavaScript (modular architecture), Tailwind CSS (CDN), Material Symbols.
- **Backend**: Node.js (v18+), TypeScript, Express.js.
- **Database & ORM**: PostgreSQL with Prisma ORM.
- **Media Storage**: Cloudinary Media Library (Audio & Images delivered via global CDN).
- **Security**: Helmet, CORS, Express Rate Limiter, Bcrypt password hashing, JWT Authentication with Role-Based Access Control (RBAC).
- **Real-Time**: Socket.IO for live listeners and broadcast status updates.

---

## 3. Public Listeners vs. Staff Authentication

- **Public Listeners**: Enjoy 100% unrestricted access. No sign-up, login, or phone OTP prompts are required to stream live radio, listen to podcasts, view schedules, or submit contact messages.
- **Staff & Administrators**: Authenticate via `POST /api/auth/login` to access administrative actions and the integrated Cloudinary Media Library.

### Seeded Staff Credentials

| Role | Email | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `radioninada@gmail.com` | `Admin@123` | Full system access, user role management, Media Library deletion |
| **Editor** | `editor@radioninada.com` | `Editor@123` | Content creation, podcast uploads, program management |

---

## 4. Cloudinary Setup & Media Library

Cloudinary serves as the primary media storage engine for podcast audio, episode covers, host portraits, program thumbnails, and banners.

### A. Create Cloudinary Credentials
1. Register for a free account at [Cloudinary](https://cloudinary.com/).
2. From the **Cloudinary Dashboard / API Keys** page, copy:
   - **Cloud Name** (e.g., `radioninada`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz12345`)
3. Add these to `backend/.env`.

> [!CAUTION]
> NEVER expose `CLOUDINARY_API_KEY` or `CLOUDINARY_API_SECRET` in frontend JavaScript. All uploads are processed securely through the backend server.

### B. Cloudinary Folder Hierarchy
All uploaded assets are automatically placed into designated folders:
```text
radio-ninada/
├── podcasts/
│   ├── covers/                 # Podcast series cover art
│   └── episodes/               # Audio MP3/WAV/AAC episodes
├── programs/                   # Program thumbnails and banners
├── hosts/                      # RJ and presenter profile photos
├── banners/                    # Promotional homepage banners
├── gallery/                    # Studio and community event photography
└── media/                      # General station media library uploads
```

### C. In-Browser Media Library
Station staff can access the integrated Media Library directly from the web application:
- Press <kbd>Alt</kbd> + <kbd>M</kbd> anywhere on the site or use the staff sign-in dialog.
- Upload images, audio clips (MP3/WAV), or PDFs.
- Preview images and listen to audio recordings.
- Copy CDN delivery URLs to clipboard with one click.
- Permanently delete media assets (automatically deletes from both PostgreSQL and Cloudinary).

---

## 5. Environment Configuration

Create `backend/.env` using the template below:

```env
# Application Environment
NODE_ENV=development
PORT=5000

# PostgreSQL Database (Prisma ORM)
DATABASE_URL="postgresql://postgres:password@localhost:5432/radioninada?schema=public"

# JWT Security
JWT_SECRET="radioninada-super-secret-jwt-key-2026-production"
JWT_REFRESH_SECRET="radioninada-super-secret-refresh-key-2026-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# CORS & Administration
CORS_ORIGIN="http://localhost:3000,http://127.0.0.1:3000"
ADMIN_EMAIL="radioninada@gmail.com"
```

---

## 6. Local Development Setup

### Step 1: Start Backend API Server
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push schema to PostgreSQL database
npx prisma db push

# Seed initial data (Admin accounts, Categories, Hosts, Live stream)
npx prisma db seed

# Run backend development server (with hot reload)
npm run dev
```
Backend runs on `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`).

### Step 2: Start Frontend
In a new terminal window:
```bash
cd frontend

# Start static preview server
npm start
```
Frontend opens at `http://localhost:3000`.

---

## 7. REST API Reference

All API responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "message": "Optional status message",
  "data": {}
}
```

### Core Endpoints

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/live` | `GET` | Public | Current stream URL, live status, and now-playing metadata |
| `/api/live` | `PUT` | Staff | Update live broadcast stream URL, title, and playing song |
| `/api/live/toggle` | `POST` | Staff | Toggle stream ON AIR / OFF AIR |
| `/api/podcasts` | `GET` | Public | List podcasts with category filtering and search |
| `/api/podcasts/:slug` | `GET` | Public | Get podcast details and episode listing |
| `/api/podcasts` | `POST` | Staff | Create a new podcast series |
| `/api/podcasts/:id/episodes`| `POST` | Staff | Upload/add an episode to a podcast series |
| `/api/podcasts/episodes/:id/download` | `POST` | Public | Increment episode listen/download counter |
| `/api/programs` | `GET` | Public | List weekly radio programs and schedules |
| `/api/programs` | `POST` | Staff | Create new radio program |
| `/api/categories` | `GET` | Public | List content categories |
| `/api/hosts` | `GET` | Public | Station RJ host profiles and designations |
| `/api/media` | `GET` | Staff | List Media Library files with folder and type filters |
| `/api/media/upload` | `POST` | Staff | Upload media file to Cloudinary & store DB metadata |
| `/api/media/:id` | `DELETE`| Admin | Delete asset from Cloudinary and PostgreSQL |
| `/api/contact` | `POST` | Public | Submit contact / feedback message |
| `/api/banners` | `GET` | Public | Active homepage promotional banners |
| `/api/announcements` | `GET` | Public | Station notifications and alerts |
| `/api/auth/login` | `POST` | Public | Staff/Admin login returning JWT access & refresh tokens |
| `/api/auth/refresh` | `POST` | Public | Refresh expired access token |
| `/api/auth/me` | `GET` | Staff | Fetch active user profile |
| `/api/health` | `GET` | Public | Health check endpoint |

---

## 8. Deployment Guide

### Vercel (Monorepo)
The root [`vercel.json`](file:///c:/Users/abhir/Downloads/radioninada/Radio_ninada/vercel.json) routes `/api/*` to the serverless Express backend and serves static files from `frontend/`:
1. Connect your GitHub repository to Vercel.
2. Configure environment variables in the Vercel project settings (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`).
3. Deploy.

### Dedicated Node.js Hosting (Render / Railway / VPS)
- **Backend**: Deploy `backend/` as a Web Service.
  - Build command: `npm install && npx prisma generate && npm run build`
  - Start command: `node dist/server.js`
- **Frontend**: Deploy `frontend/` on any static hosting (Vercel, Netlify, Cloudflare Pages).
- **Database**: Managed PostgreSQL (Supabase, Neon, Railway, or AWS RDS).
- **Media**: Cloudinary.

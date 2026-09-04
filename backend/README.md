# Radio Ninada - Backend API Server

Production-ready REST API server and realtime broadcast engine for **Radio Ninada 90.4 FM**, built with Node.js, Express, TypeScript, PostgreSQL (Prisma ORM), and Cloudinary media storage.

## Technology Stack
- **Runtime & Language**: Node.js & TypeScript
- **Framework**: Express.js with Helmet security headers & CORS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens) & bcrypt password hashing
- **Media Storage**: Cloudinary Media Library (podcasts, episodes, covers, programs, banners)
- **Validation**: Zod schema validation
- **Realtime**: Socket.IO for live listener statistics & status updates

## Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your PostgreSQL `DATABASE_URL`, `JWT_SECRET`, and Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

## Database Commands
```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database (Development)
npx prisma db push

# Run Database Migrations (Production)
npx prisma migrate dev --name init

# Seed database with super admin, default categories, hosts, and live state
npx prisma db seed
```

## Running the Server
```bash
# Development (with hot reloading)
npm run dev

# Production Build & Start
npm run build
npm start
```
API server runs on `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.

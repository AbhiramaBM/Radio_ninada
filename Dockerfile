# Multi-stage production container for Radio Ninada Full-Stack
FROM node:20-alpine AS builder

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

# Generate Prisma Client & compile TypeScript
COPY backend/prisma ./prisma
RUN npm run prisma:generate

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy compiled artifacts and Prisma engine
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/dist ./dist

# Copy frontend static assets
WORKDIR /app
COPY frontend ./frontend

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "dist/server.js"]

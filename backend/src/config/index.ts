import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const defaultDbPath = path.resolve(__dirname, '../../prisma/dev.db').replace(/\\/g, '/');
const rawDbUrl = process.env.DATABASE_URL || `file:${defaultDbPath}`;
const databaseUrl = rawDbUrl.startsWith('file:') && !path.isAbsolute(rawDbUrl.replace('file:', ''))
  ? `file:${path.resolve(__dirname, '../../prisma', rawDbUrl.replace('file:', '')).replace(/\\/g, '/')}`
  : rawDbUrl;

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET || 'radioninada-super-secret-jwt-key-2026-secure',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'radioninada-super-secret-refresh-key-2026-secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(','),
  uploadDir: process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../../uploads'),
  adminEmail: (process.env.ADMIN_EMAIL || 'radioninada@gmail.com').toLowerCase(),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
};

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || 'radioninada-super-secret-jwt-key-2026-secure',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'radioninada-super-secret-refresh-key-2026-secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(','),
  uploadDir: path.resolve(__dirname, '../../uploads'),
};

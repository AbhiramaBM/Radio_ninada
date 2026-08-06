"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    jwtSecret: process.env.JWT_SECRET || 'radioninada-super-secret-jwt-key-2026-secure',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'radioninada-super-secret-refresh-key-2026-secure',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    corsOrigin: (process.env.CORS_ORIGIN || '*').split(','),
    uploadDir: path_1.default.resolve(__dirname, '../../uploads'),
    adminEmail: (process.env.ADMIN_EMAIL || 'radioninada@gmail.com').toLowerCase(),
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
};

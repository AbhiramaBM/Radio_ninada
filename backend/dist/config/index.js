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
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/radioninada?schema=public',
    jwtSecret: process.env.JWT_SECRET || 'radioninada-super-secret-jwt-key-2026-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'radioninada-super-secret-refresh-key-2026-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim()),
    uploadDir: process.env.VERCEL ? '/tmp' : path_1.default.resolve(__dirname, '../../uploads'),
    adminEmail: (process.env.ADMIN_EMAIL || 'radioninada@gmail.com').toLowerCase(),
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        url: process.env.CLOUDINARY_URL || '',
    },
};

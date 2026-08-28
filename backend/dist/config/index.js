"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const fs_1 = __importDefault(require("fs"));
const defaultDbPath = path_1.default.resolve(__dirname, '../../prisma/dev.db').replace(/\\/g, '/');
const rawDbUrl = process.env.DATABASE_URL || `file:${defaultDbPath}`;
let databaseUrl = rawDbUrl;
if (process.env.VERCEL && rawDbUrl.startsWith('file:')) {
    const tmpDbPath = '/tmp/dev.db';
    const bundleDbPath = path_1.default.resolve(__dirname, '../../prisma/dev.db');
    if (!fs_1.default.existsSync(tmpDbPath)) {
        try {
            if (fs_1.default.existsSync(bundleDbPath)) {
                fs_1.default.copyFileSync(bundleDbPath, tmpDbPath);
                console.log('[Vercel DB Init] Copied bundled dev.db to /tmp/dev.db');
            }
            else {
                console.warn('[Vercel DB Warning] Bundled dev.db not found at', bundleDbPath);
            }
        }
        catch (e) {
            console.error('[Vercel DB Copy Error]:', e.message);
        }
    }
    databaseUrl = `file:${tmpDbPath}`;
}
else if (rawDbUrl.startsWith('file:') && !path_1.default.isAbsolute(rawDbUrl.replace('file:', ''))) {
    databaseUrl = `file:${path_1.default.resolve(__dirname, '../../prisma', rawDbUrl.replace('file:', '')).replace(/\\/g, '/')}`;
}
exports.config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl,
    jwtSecret: process.env.JWT_SECRET || 'radioninada-super-secret-jwt-key-2026-secure',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'radioninada-super-secret-refresh-key-2026-secure',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    corsOrigin: (process.env.CORS_ORIGIN || '*').split(','),
    uploadDir: process.env.VERCEL ? '/tmp' : path_1.default.resolve(__dirname, '../../uploads'),
    adminEmail: (process.env.ADMIN_EMAIL || 'radioninada@gmail.com').toLowerCase(),
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        url: process.env.CLOUDINARY_URL || '',
    },
};

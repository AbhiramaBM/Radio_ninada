"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const index_1 = require("../config/index");
// Ensure temporary upload directory exists
if (!fs_1.default.existsSync(index_1.config.uploadDir)) {
    fs_1.default.mkdirSync(index_1.config.uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, index_1.config.uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    },
});
const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/aac',
    'audio/ogg',
    'audio/x-m4a',
    'audio/mp4',
    // Video
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    // Documents
    'application/pdf',
];
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype) ||
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('audio/') ||
            file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images, Audio, Video, and PDF.`));
        }
    },
});

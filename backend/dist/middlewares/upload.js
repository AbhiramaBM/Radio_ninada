"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_1 = require("../config/index");
if (!fs_1.default.existsSync(index_1.config.uploadDir)) {
    fs_1.default.mkdirSync(index_1.config.uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, index_1.config.uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit for video/audio uploads
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/aac',
            'audio/ogg',
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
            'video/x-msvideo',
            'video/3gpp',
        ];
        if (allowedMimeTypes.includes(file.mimetype) ||
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype.startsWith('audio/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file format. Only images, audio, and video files (MP4, WEBM, MOV, etc.) are allowed.'));
        }
    },
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const index_1 = require("../config/index");
const isCloudinaryConfigured = Boolean((index_1.config.cloudinary.cloudName && index_1.config.cloudinary.apiKey && index_1.config.cloudinary.apiSecret) ||
    index_1.config.cloudinary.url);
if (isCloudinaryConfigured) {
    if (index_1.config.cloudinary.url) {
        cloudinary_1.v2.config({
            cloudinary_url: index_1.config.cloudinary.url,
        });
    }
    else {
        cloudinary_1.v2.config({
            cloud_name: index_1.config.cloudinary.cloudName,
            api_key: index_1.config.cloudinary.apiKey,
            api_secret: index_1.config.cloudinary.apiSecret,
        });
    }
}
let storage;
if (isCloudinaryConfigured) {
    storage = new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_1.v2,
        params: async (req, file) => {
            const isVideo = file.mimetype.startsWith('video/');
            const isAudio = file.mimetype.startsWith('audio/');
            const subFolder = isAudio ? 'audio' : isVideo ? 'video' : 'images';
            const targetFolder = req.query?.folder || `radio-ninada/${subFolder}`;
            const cleanFileName = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
            const sanitizedName = cleanFileName.replace(/[^a-zA-Z0-9]/g, '_');
            return {
                folder: targetFolder,
                resource_type: isVideo || isAudio ? 'video' : 'auto',
                public_id: `${Date.now()}_${sanitizedName}`,
            };
        },
    });
}
else {
    if (!fs_1.default.existsSync(index_1.config.uploadDir)) {
        fs_1.default.mkdirSync(index_1.config.uploadDir, { recursive: true });
    }
    storage = multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, index_1.config.uploadDir);
        },
        filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path_1.default.extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    });
}
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit for video/audio uploads
    fileFilter: (_req, file, cb) => {
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

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index';

// Ensure temporary upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
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

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images, Audio, Video, and PDF.`));
    }
  },
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { config } from '../config/index';

const isCloudinaryConfigured = Boolean(
  (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) ||
  config.cloudinary.url
);

if (isCloudinaryConfigured) {
  if (config.cloudinary.url) {
    cloudinary.config({
      cloudinary_url: config.cloudinary.url,
    });
  } else {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
  }
}

let storage: multer.StorageEngine;

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const isAudio = file.mimetype.startsWith('audio/');
      const subFolder = isAudio ? 'audio' : isVideo ? 'video' : 'images';
      const targetFolder = (req.query?.folder as string) || `radio-ninada/${subFolder}`;

      const cleanFileName = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
      const sanitizedName = cleanFileName.replace(/[^a-zA-Z0-9]/g, '_');

      return {
        folder: targetFolder,
        resource_type: isVideo || isAudio ? 'video' : 'auto',
        public_id: `${Date.now()}_${sanitizedName}`,
      };
    },
  });
} else {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, config.uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });
}

export const upload = multer({
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
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only images, audio, and video files (MP4, WEBM, MOV, etc.) are allowed.'));
    }
  },
});


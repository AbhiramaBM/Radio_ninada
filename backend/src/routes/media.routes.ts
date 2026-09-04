import { Router } from 'express';
import { uploadMedia, listMedia, getMediaById, deleteMedia, getUploadSignature, recordUploadedMedia } from '../controllers/media.controller';
import { upload } from '../middlewares/upload';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Signed direct Cloudinary upload credentials
router.get('/signature', getUploadSignature);

// Record direct Cloudinary upload in database
router.post(
  '/record',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']),
  recordUploadedMedia
);

// Upload media asset via server proxy to Cloudinary (Staff/Admin)
router.post(
  '/upload',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']),
  upload.single('file'),
  auditLog('UPLOAD', 'Media'),
  uploadMedia
);

// List media assets (Public or Staff)
router.get('/', listMedia);

// Get single media asset by ID
router.get('/:id', getMediaById);

// Delete media asset from Cloudinary & DB (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  auditLog('MEDIA_DELETE', 'Media'),
  deleteMedia
);

export default router;

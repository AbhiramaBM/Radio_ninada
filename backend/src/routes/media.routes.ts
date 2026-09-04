import { Router } from 'express';
import { uploadMedia, listMedia, getMediaById, deleteMedia } from '../controllers/media.controller';
import { upload } from '../middlewares/upload';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Upload media asset to Cloudinary (Staff/Admin)
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

import { Router } from 'express';
import { getGallery, createGalleryItem, deleteGalleryItem } from '../controllers/gallery.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getGallery);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), upload.single('media'), auditLog('CREATE', 'GalleryItem'), createGalleryItem);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'GalleryItem'), deleteGalleryItem);

export default router;

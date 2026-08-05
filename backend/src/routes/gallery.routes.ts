import { Router, Request, Response, NextFunction } from 'express';
import { getGallery, createGalleryItem, deleteGalleryItem } from '../controllers/gallery.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Resilient file upload handler for both 'file' and 'media' field names or JSON requests
const handleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'media', maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.warn('Gallery upload notice:', err.message);
    }
    if (req.files && typeof req.files === 'object') {
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      const fileArr = filesObj['file'] || filesObj['media'];
      if (fileArr && fileArr.length > 0) {
        req.file = fileArr[0];
      }
    }
    next();
  });
};

router.get('/', getGallery);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), handleFileUpload, auditLog('CREATE', 'GalleryItem'), createGalleryItem);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'GalleryItem'), deleteGalleryItem);

export default router;

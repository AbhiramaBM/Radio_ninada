import { Router } from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getBanners);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), upload.single('image'), auditLog('CREATE', 'Banner'), createBanner);
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), upload.single('image'), auditLog('UPDATE', 'Banner'), updateBanner);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Banner'), deleteBanner);

export default router;

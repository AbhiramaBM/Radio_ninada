import { Router } from 'express';
import { getBanners, createBanner, deleteBanner } from '../controllers/banner.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getBanners);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), upload.single('image'), auditLog('CREATE', 'Banner'), createBanner);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Banner'), deleteBanner);

export default router;

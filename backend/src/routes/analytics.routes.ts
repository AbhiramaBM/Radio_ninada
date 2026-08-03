import { Router } from 'express';
import { getDashboardStats, exportAnalyticsReport } from '../controllers/analytics.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'MODERATOR']), getDashboardStats);
router.get('/export', requireRole(['SUPER_ADMIN', 'ADMIN']), exportAnalyticsReport);

export default router;

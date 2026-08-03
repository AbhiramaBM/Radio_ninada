import { Router } from 'express';
import { getNotifications, createNotification, deleteNotification } from '../controllers/notification.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), getNotifications);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('CREATE', 'Notification'), createNotification);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Notification'), deleteNotification);

export default router;

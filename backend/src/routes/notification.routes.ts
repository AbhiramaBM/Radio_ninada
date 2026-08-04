import { Router } from 'express';
import { getNotifications, createNotification, deleteNotification } from '../controllers/notification.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getNotifications);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('CREATE', 'Notification'), createNotification);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Notification'), deleteNotification);

export default router;

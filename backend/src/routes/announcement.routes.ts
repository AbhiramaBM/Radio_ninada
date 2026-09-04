import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  markAnnouncementRead,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getAnnouncements);
router.patch('/:id/read', markAnnouncementRead);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('CREATE', 'Announcement'), createAnnouncement);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Announcement'), deleteAnnouncement);

export default router;

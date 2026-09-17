import { Router } from 'express';
import { submitContactMessage, listContactMessages, updateContactMessageStatus } from '../controllers/contact.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Public submission
router.post('/', submitContactMessage);

// Admin listing & status update
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), listContactMessages);
router.patch('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('UPDATE', 'ContactMessage'), updateContactMessageStatus);

export default router;

import { Router } from 'express';
import { submitContactMessage, listContactMessages } from '../controllers/contact.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Public submission
router.post('/', submitContactMessage);

// Admin listing
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), listContactMessages);

export default router;

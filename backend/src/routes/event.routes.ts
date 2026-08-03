import { Router } from 'express';
import {
  getEvents,
  createEvent,
  registerParticipant,
  exportParticipantsCSV,
  deleteEvent,
} from '../controllers/event.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getEvents);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('CREATE', 'Event'), createEvent);
router.post('/:eventId/register', registerParticipant);
router.get('/:id/export-csv', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR']), exportParticipantsCSV);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Event'), deleteEvent);

export default router;

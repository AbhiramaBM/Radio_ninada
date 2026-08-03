import { Router } from 'express';
import { getSchedule, createScheduleSlot, batchUpdateSchedule, deleteScheduleSlot } from '../controllers/schedule.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getSchedule);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('CREATE', 'Schedule'), createScheduleSlot);
router.post('/batch-update', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('BATCH_UPDATE', 'Schedule'), batchUpdateSchedule);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Schedule'), deleteScheduleSlot);

export default router;

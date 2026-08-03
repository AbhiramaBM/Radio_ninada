import { Router } from 'express';
import { getLiveState, updateLiveState, toggleLive } from '../controllers/live.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getLiveState);
router.put('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'RJ']), auditLog('UPDATE', 'LiveState'), updateLiveState);
router.post('/toggle', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'RJ']), auditLog('TOGGLE', 'LiveState'), toggleLive);

export default router;

import { Router } from 'express';
import { getRJs, createRJ, updateRJ, deleteRJ } from '../controllers/rj.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getRJs);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('CREATE', 'RJProfile'), createRJ);
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'RJ']), auditLog('UPDATE', 'RJProfile'), updateRJ);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'RJProfile'), deleteRJ);

export default router;

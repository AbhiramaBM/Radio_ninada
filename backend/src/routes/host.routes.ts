import { Router } from 'express';
import { listHosts, getHostById, createHost, deleteHost } from '../controllers/host.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', listHosts);
router.get('/:id', getHostById);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('CREATE', 'Host'), createHost);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Host'), deleteHost);

export default router;

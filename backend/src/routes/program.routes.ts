import { Router } from 'express';
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  bulkDeletePrograms,
  bulkPublishPrograms,
} from '../controllers/program.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getPrograms);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), auditLog('CREATE', 'Program'), createProgram);
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), auditLog('UPDATE', 'Program'), updateProgram);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Program'), deleteProgram);
router.post('/bulk-delete', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('BULK_DELETE', 'Program'), bulkDeletePrograms);
router.post('/bulk-publish', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('BULK_PUBLISH', 'Program'), bulkPublishPrograms);

export default router;

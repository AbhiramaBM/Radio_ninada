import { Router } from 'express';
import { getPrograms, getProgramBySlug, createProgram, deleteProgram } from '../controllers/program.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getPrograms);
router.get('/:slug', getProgramBySlug);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), auditLog('CREATE', 'Program'), createProgram);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Program'), deleteProgram);

export default router;

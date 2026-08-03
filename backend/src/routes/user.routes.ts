import { Router } from 'express';
import { getUsers, createUser, updateUserRole, updateUserStatus, deleteUser } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']), getUsers);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('CREATE', 'User'), createUser);
router.patch('/:id/role', requireRole(['SUPER_ADMIN']), auditLog('ROLE_CHANGE', 'User'), updateUserRole);
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']), auditLog('STATUS_CHANGE', 'User'), updateUserStatus);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'User'), deleteUser);

export default router;

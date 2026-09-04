import { Router } from 'express';
import { listCategories, createCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', listCategories);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('CREATE', 'Category'), createCategory);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Category'), deleteCategory);

export default router;

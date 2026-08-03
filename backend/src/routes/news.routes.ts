import { Router } from 'express';
import { getNews, createNews, updateNews, deleteNews } from '../controllers/news.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getNews);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), upload.single('image'), auditLog('CREATE', 'News'), createNews);
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), auditLog('UPDATE', 'News'), updateNews);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'News'), deleteNews);

export default router;

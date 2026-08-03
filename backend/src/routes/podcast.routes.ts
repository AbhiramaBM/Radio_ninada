import { Router } from 'express';
import {
  getPodcasts,
  createPodcast,
  updatePodcast,
  deletePodcast,
  incrementDownloads,
} from '../controllers/podcast.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getPodcasts);
router.post(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']),
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  auditLog('CREATE', 'Podcast'),
  createPodcast
);
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']), auditLog('UPDATE', 'Podcast'), updatePodcast);
router.post('/:id/download', incrementDownloads);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Podcast'), deletePodcast);

export default router;

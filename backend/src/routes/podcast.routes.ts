import { Router } from 'express';
import {
  getPodcasts,
  getPodcastBySlug,
  createPodcast,
  addEpisode,
  incrementDownload,
  deletePodcast,
} from '../controllers/podcast.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Public podcast endpoints
router.get('/', getPodcasts);
router.get('/:slug', getPodcastBySlug);
router.post('/episodes/:id/download', incrementDownload);

// Staff/Admin endpoints
router.post(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']),
  auditLog('CREATE', 'Podcast'),
  createPodcast
);

router.post(
  '/:id/episodes',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ']),
  auditLog('CREATE', 'PodcastEpisode'),
  addEpisode
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  auditLog('DELETE', 'Podcast'),
  deletePodcast
);

export default router;

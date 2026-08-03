import { Router } from 'express';
import {
  aiSearch,
  getPodcastSummary,
  getPodcastTranscript,
  getAIRecommendations,
} from '../controllers/ai.controller';

const router = Router();

router.get('/search', aiSearch);
router.get('/podcast/:id/summary', getPodcastSummary);
router.get('/podcast/:id/transcript', getPodcastTranscript);
router.get('/recommendations', getAIRecommendations);

export default router;

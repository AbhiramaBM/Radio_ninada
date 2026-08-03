import { Router } from 'express';
import { getSponsors, createSponsor, trackSponsorClick, deleteSponsor } from '../controllers/sponsor.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.get('/', getSponsors);
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), upload.single('logo'), auditLog('CREATE', 'Sponsor'), createSponsor);
router.post('/:id/click', trackSponsorClick);
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), auditLog('DELETE', 'Sponsor'), deleteSponsor);

export default router;

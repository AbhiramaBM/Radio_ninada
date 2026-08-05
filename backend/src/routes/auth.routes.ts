import { Router } from 'express';
import { login, refresh, logout, getMe, changePassword } from '../controllers/auth.controller';
import { firebaseLogin } from '../controllers/firebase-auth.controller';
import { authenticate } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.post('/login', auditLog('LOGIN', 'UserAuth'), login);
router.post('/firebase', auditLog('LOGIN', 'FirebaseAuth'), firebaseLogin);
router.post('/refresh', refresh);
router.post('/logout', auditLog('LOGOUT', 'UserAuth'), logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, auditLog('CHANGE_PASSWORD', 'UserAuth'), changePassword);

export default router;

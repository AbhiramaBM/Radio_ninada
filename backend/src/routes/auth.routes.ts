import { Router } from 'express';
import { login, signup, sendOtp, verifyOtp, resetPassword, refresh, logout, getMe, changePassword } from '../controllers/auth.controller';
import { firebaseLogin } from '../controllers/firebase-auth.controller';
import { authenticate } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

router.post('/signup', auditLog('SIGNUP', 'UserAuth'), signup);
router.post('/login', auditLog('LOGIN', 'UserAuth'), login);
router.post('/send-otp', auditLog('SEND_OTP', 'UserAuth'), sendOtp);
router.post('/verify-otp', auditLog('VERIFY_OTP', 'UserAuth'), verifyOtp);
router.post('/reset-password', auditLog('RESET_PASSWORD', 'UserAuth'), resetPassword);
router.post('/firebase', auditLog('LOGIN', 'FirebaseAuth'), firebaseLogin);
router.post('/refresh', refresh);
router.post('/logout', auditLog('LOGOUT', 'UserAuth'), logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, auditLog('CHANGE_PASSWORD', 'UserAuth'), changePassword);

export default router;


import { Router } from 'express';
import {
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from '@/controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;

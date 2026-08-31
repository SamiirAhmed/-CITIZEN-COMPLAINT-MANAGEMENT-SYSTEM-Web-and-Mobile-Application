import { Router } from 'express';
import {
  changePassword,
  getMe,
  login,
  logout,
  registerCitizen,
  updateProfile,
} from '../controllers/authController.js';
import {
  completeAccount,
  completeProfile,
  sendOtp,
  skipAccountSetup,
  verifyOtp,
} from '../controllers/otpController.js';
import { protect, requirePasswordChanged } from '../middleware/auth.js';
import { uploadProfileImageOptional } from '../middleware/uploadProfileImage.js';

const router = Router();

router.post('/register', uploadProfileImageOptional, registerCitizen);
router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.post('/otp/skip', skipAccountSetup);
router.post('/otp/complete-account', completeAccount);
router.put('/complete-profile', protect, completeProfile);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, requirePasswordChanged, uploadProfileImageOptional, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;

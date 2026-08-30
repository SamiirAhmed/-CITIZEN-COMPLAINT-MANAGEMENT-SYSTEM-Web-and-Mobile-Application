import { Router } from 'express';
import {
  changePassword,
  getMe,
  login,
  logout,
  registerCitizen,
  updateProfile,
} from '../controllers/authController.js';
import { protect, requirePasswordChanged } from '../middleware/auth.js';
import { uploadProfileImageOptional } from '../middleware/uploadProfileImage.js';

const router = Router();

router.post('/register', uploadProfileImageOptional, registerCitizen);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, requirePasswordChanged, uploadProfileImageOptional, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;

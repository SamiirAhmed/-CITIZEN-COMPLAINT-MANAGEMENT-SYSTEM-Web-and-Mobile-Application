import { Router } from 'express';
import {
  changePassword,
  getMe,
  login,
  logout,
  registerCitizen,
  updateProfile,
} from '../controllers/authController.js';
import { protect, citizenOnly } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerCitizen);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', ...citizenOnly, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;

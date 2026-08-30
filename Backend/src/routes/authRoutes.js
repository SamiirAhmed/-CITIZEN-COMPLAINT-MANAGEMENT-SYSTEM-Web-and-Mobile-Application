import { Router } from 'express';
import {
  changePassword,
  getMe,
  login,
  logout,
  registerCitizen,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
<<<<<<< HEAD
=======
import { uploadProfileImageOptional } from '../middleware/uploadProfileImage.js';
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706

const router = Router();

router.post('/register', uploadProfileImageOptional, registerCitizen);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
<<<<<<< HEAD
router.put('/profile', protect, updateProfile);
=======
router.put('/profile', protect, uploadProfileImageOptional, updateProfile);
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
router.put('/change-password', protect, changePassword);

export default router;

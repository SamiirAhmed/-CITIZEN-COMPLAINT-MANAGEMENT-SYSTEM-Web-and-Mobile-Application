import { Router } from 'express';
import {
  changePassword,
  getMe,
  login,
  logout,
  registerCitizen,
  updateProfile,
} from '../controllers/authController.js';
<<<<<<< HEAD
import { protect } from '../middleware/auth.js';
=======
import { protect, requirePasswordChanged } from '../middleware/auth.js';
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
import { uploadProfileImageOptional } from '../middleware/uploadProfileImage.js';

const router = Router();

router.post('/register', uploadProfileImageOptional, registerCitizen);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
<<<<<<< HEAD
router.put('/profile', protect, uploadProfileImageOptional, updateProfile);
=======
router.put('/profile', protect, requirePasswordChanged, uploadProfileImageOptional, updateProfile);
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
router.put('/change-password', protect, changePassword);

export default router;

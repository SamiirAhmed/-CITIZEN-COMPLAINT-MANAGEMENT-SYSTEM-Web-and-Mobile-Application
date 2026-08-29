import { Router } from 'express';
import {
  adminCreateOB,
  adminListComplaints,
  adminReviewComplaint,
  getCategories,
  getCitizenDashboard,
  getMyComplaintById,
  getMyComplaints,
  submitComplaint,
} from '../controllers/complaintController.js';
import { adminOnly, citizenOnly, staffOnly } from '../middleware/auth.js';

const router = Router();

router.get('/categories', ...citizenOnly, getCategories);
router.get('/dashboard', ...citizenOnly, getCitizenDashboard);
router.get('/mine', ...citizenOnly, getMyComplaints);
router.get('/mine/:id', ...citizenOnly, getMyComplaintById);
router.post('/', ...citizenOnly, submitComplaint);

router.get('/admin/all', ...staffOnly, adminListComplaints);
router.patch('/admin/:id/review', ...adminOnly, adminReviewComplaint);
router.post('/admin/:id/ob', ...adminOnly, adminCreateOB);

export default router;

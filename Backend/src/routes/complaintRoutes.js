import { Router } from 'express';
import {
  adminCreateComplaint,
  adminCreateOB,
  adminDeleteComplaint,
  adminGetComplaintById,
  adminListComplaints,
  adminReviewComplaint,
  adminUpdateComplaint,
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
router.post('/admin', ...adminOnly, adminCreateComplaint);
router.get('/admin/:id', ...staffOnly, adminGetComplaintById);
router.put('/admin/:id', ...adminOnly, adminUpdateComplaint);
router.delete('/admin/:id', ...adminOnly, adminDeleteComplaint);
router.patch('/admin/:id/review', ...adminOnly, adminReviewComplaint);
router.post('/admin/:id/ob', ...staffOnly, adminCreateOB);

export default router;

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
import { uploadComplaintEvidenceOptional } from '../middleware/uploadEvidence.js';

const router = Router();

router.get('/categories', ...citizenOnly, getCategories);
router.get('/dashboard', ...citizenOnly, getCitizenDashboard);
router.get('/mine', ...citizenOnly, getMyComplaints);
router.get('/mine/:id', ...citizenOnly, getMyComplaintById);
router.post('/', ...citizenOnly, uploadComplaintEvidenceOptional, submitComplaint);

router.get('/admin/all', ...staffOnly, adminListComplaints);
router.post('/admin', ...adminOnly, uploadComplaintEvidenceOptional, adminCreateComplaint);
router.get('/admin/:id', ...staffOnly, adminGetComplaintById);
router.put('/admin/:id', ...adminOnly, uploadComplaintEvidenceOptional, adminUpdateComplaint);
router.patch('/admin/:id/active', ...adminOnly, adminDeleteComplaint);
router.delete('/admin/:id', ...adminOnly, adminDeleteComplaint);
router.patch('/admin/:id/review', ...adminOnly, adminReviewComplaint);
router.post('/admin/:id/ob', ...staffOnly, adminCreateOB);

export default router;

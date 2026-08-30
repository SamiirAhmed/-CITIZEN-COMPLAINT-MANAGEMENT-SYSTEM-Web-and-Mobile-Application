import { Router } from 'express';
import {
  adminAssignOfficer,
  adminDeleteOB,
  adminResolveCloseReopen,
  getMyOBById,
  getMyOBRecords,
  policeUpdateInvestigation,
  staffGetOBById,
  staffListOBs,
} from '../controllers/obController.js';
import { adminOnly, citizenOnly, staffOnly } from '../middleware/auth.js';

const router = Router();

router.get('/mine', ...citizenOnly, getMyOBRecords);
router.get('/mine/:id', ...citizenOnly, getMyOBById);

router.get('/staff', ...staffOnly, staffListOBs);
router.get('/staff/:id', ...staffOnly, staffGetOBById);
router.delete('/admin/:id', ...adminOnly, adminDeleteOB);
router.patch('/admin/:id/assign', ...adminOnly, adminAssignOfficer);
router.patch('/admin/:id/status', ...adminOnly, adminResolveCloseReopen);
router.patch('/police/:id/investigation', ...staffOnly, policeUpdateInvestigation);

export default router;

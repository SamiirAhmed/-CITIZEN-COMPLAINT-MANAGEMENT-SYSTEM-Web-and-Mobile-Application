import { Router } from 'express';
import {
  adminAssignOfficer,
  adminResolveCloseReopen,
  getMyOBById,
  getMyOBRecords,
  getOBMeta,
  policeUpdateInvestigation,
  staffChangeStatus,
  staffCloseOB,
  staffCreateOB,
  staffDeleteOB,
  staffExportOBs,
  staffGetOBById,
  staffListOBs,
  staffOBStats,
  staffReopenOB,
  staffUpdateOB,
} from '../controllers/obController.js';
import { adminOnly, citizenOnly, staffOnly } from '../middleware/auth.js';

const router = Router();

// Citizen
router.get('/mine', ...citizenOnly, getMyOBRecords);
router.get('/mine/:id', ...citizenOnly, getMyOBById);

// Staff meta / stats / export (before :id routes)
router.get('/staff/meta', ...staffOnly, getOBMeta);
router.get('/staff/stats', ...staffOnly, staffOBStats);
router.get('/staff/export', ...staffOnly, staffExportOBs);

// Staff CRUD
router.get('/staff', ...staffOnly, staffListOBs);
router.post('/staff', ...staffOnly, staffCreateOB);
router.get('/staff/:id', ...staffOnly, staffGetOBById);
router.put('/staff/:id', ...staffOnly, staffUpdateOB);
router.patch('/staff/:id/status', ...staffOnly, staffChangeStatus);
router.patch('/staff/:id/close', ...adminOnly, staffCloseOB);
router.patch('/staff/:id/reopen', ...adminOnly, staffReopenOB);
router.delete('/staff/:id', ...adminOnly, staffDeleteOB);

// Existing admin / police workflow
router.patch('/admin/:id/assign', ...adminOnly, adminAssignOfficer);
router.patch('/admin/:id/status', ...adminOnly, adminResolveCloseReopen);
router.patch('/police/:id/investigation', ...staffOnly, policeUpdateInvestigation);

export default router;

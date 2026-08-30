import { Router } from 'express';
import {
  adminAssignOfficer,
  adminDeleteOB,
  adminResolveCloseReopen,
  getMyOBById,
  getMyOBRecords,
<<<<<<< HEAD
  getOBMeta,
  policeUpdateInvestigation,
  staffChangeStatus,
  staffCloseOB,
  staffCreateOB,
  staffDeleteOB,
  staffExportOBs,
=======
  policeAddEvidence,
  policeUpdateInvestigation,
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  staffGetOBById,
  staffListOBs,
  staffOBStats,
  staffReopenOB,
  staffUpdateOB,
} from '../controllers/obController.js';
import { adminOnly, citizenOnly, staffOnly } from '../middleware/auth.js';
import { uploadEvidenceOptional } from '../middleware/uploadEvidence.js';

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
<<<<<<< HEAD
router.post('/staff', ...staffOnly, staffCreateOB);
router.get('/staff/:id', ...staffOnly, staffGetOBById);
router.put('/staff/:id', ...staffOnly, staffUpdateOB);
router.patch('/staff/:id/status', ...staffOnly, staffChangeStatus);
router.patch('/staff/:id/close', ...adminOnly, staffCloseOB);
router.patch('/staff/:id/reopen', ...adminOnly, staffReopenOB);
router.delete('/staff/:id', ...adminOnly, staffDeleteOB);

// Existing admin / police workflow
=======
router.get('/staff/:id', ...staffOnly, staffGetOBById);
router.delete('/admin/:id', ...adminOnly, adminDeleteOB);
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
router.patch('/admin/:id/assign', ...adminOnly, adminAssignOfficer);
router.patch('/admin/:id/status', ...adminOnly, adminResolveCloseReopen);
router.patch('/police/:id/investigation', ...staffOnly, policeUpdateInvestigation);
router.post(
  '/police/:id/evidence',
  ...staffOnly,
  uploadEvidenceOptional,
  policeAddEvidence
);

export default router;

import { Router } from 'express';
import {
  adminAssignOfficer,
  adminDeleteOB,
  adminResolveCloseReopen,
  getMyOBById,
  getMyOBRecords,
  getOBMeta,
  policeAddEvidence,
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
import { uploadEvidenceOptional } from '../middleware/uploadEvidence.js';

const router = Router();

router.get('/mine', ...citizenOnly, getMyOBRecords);
router.get('/mine/:id', ...citizenOnly, getMyOBById);

router.get('/staff', ...staffOnly, staffListOBs);
router.get('/staff/meta', ...staffOnly, getOBMeta);
router.get('/staff/stats', ...staffOnly, staffOBStats);
router.get('/staff/export', ...staffOnly, staffExportOBs);
router.post('/staff', ...staffOnly, staffCreateOB);
router.get('/staff/:id', ...staffOnly, staffGetOBById);
router.put('/staff/:id', ...staffOnly, staffUpdateOB);
router.patch('/staff/:id/status', ...staffOnly, staffChangeStatus);
router.patch('/staff/:id/close', ...adminOnly, staffCloseOB);
router.patch('/staff/:id/reopen', ...adminOnly, staffReopenOB);
router.delete('/staff/:id', ...adminOnly, staffDeleteOB);

router.delete('/admin/:id', ...staffOnly, adminDeleteOB);
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

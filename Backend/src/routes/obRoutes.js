import { Router } from 'express';
import {
  adminAssignOfficer,
  adminDeleteOB,
  adminResolveCloseReopen,
  getMyOBById,
  getMyOBRecords,
  policeAddEvidence,
  policeUpdateInvestigation,
  staffGetOBById,
  staffListOBs,
} from '../controllers/obController.js';
import {
  getOBMeta,
  staffExportOBs,
  staffOBStats,
} from '../controllers/reportsController.js';
import {
  getChatbotStatus,
  policeChatWithAssistant,
} from '../controllers/chatbotController.js';
import { adminOnly, citizenOnly, staffOnly } from '../middleware/auth.js';
import { uploadEvidenceOptional } from '../middleware/uploadEvidence.js';

const router = Router();

router.get('/mine', ...citizenOnly, getMyOBRecords);
router.get('/mine/:id', ...citizenOnly, getMyOBById);

router.get('/staff/meta', ...staffOnly, getOBMeta);
router.get('/staff/chatbot/status', ...staffOnly, getChatbotStatus);
router.post('/staff/chatbot/ask', ...staffOnly, policeChatWithAssistant);
router.get('/staff/stats', ...staffOnly, staffOBStats);
router.get('/staff/export', ...staffOnly, staffExportOBs);
router.get('/staff', ...staffOnly, staffListOBs);
router.get('/staff/:id', ...staffOnly, staffGetOBById);
router.patch('/admin/:id/active', ...staffOnly, adminDeleteOB);
router.delete('/admin/:id', ...adminOnly, adminDeleteOB);
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

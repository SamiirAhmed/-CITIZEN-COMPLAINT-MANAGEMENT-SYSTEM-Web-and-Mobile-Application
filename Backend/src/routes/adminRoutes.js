import { Router } from 'express';
import {
  getAdminDashboard,
  getCitizenById,
  getPermissionsAvailability,
  getStaffUserById,
  getUserPermissions,
  listCitizens,
  listPoliceUsersForPermissions,
  listStaffUsers,
  registerCitizen,
  registerPolice,
  registerStaffUser,
  setCitizenStatus,
  setStaffUserStatus,
  updateCitizen,
  updateStaffUser,
  updateUserPermissions,
} from '../controllers/adminController.js';
import {
  createCategory,
  listCategories,
  setCategoryStatus,
  updateCategory,
} from '../controllers/categoryController.js';
import { listGeographyTable, createGeography, updateGeography, deleteGeography } from '../controllers/geographyController.js';
import { listAuditLogs, getAuditLogById, getAuthTimeline } from '../controllers/auditController.js';
import {
  getSmsBalance,
  getSmsStats,
  listSmsHistory,
  listSmsRecipients,
  sendSms,
} from '../controllers/smsController.js';
import {
  chatWithAssistant,
  getChatbotStatus,
} from '../controllers/chatbotController.js';
import { adminOnly } from '../middleware/auth.js';
import { uploadProfileImageOptional } from '../middleware/uploadProfileImage.js';

const router = Router();

router.use(...adminOnly);

router.get('/dashboard', getAdminDashboard);

router.get('/citizens', listCitizens);
router.post('/citizens', uploadProfileImageOptional, registerCitizen);
router.get('/citizens/:id', getCitizenById);
router.put('/citizens/:id', uploadProfileImageOptional, updateCitizen);
router.patch('/citizens/:id/status', setCitizenStatus);

router.get('/users', listStaffUsers);
router.post('/users/staff', uploadProfileImageOptional, registerStaffUser);
router.post('/users/police', uploadProfileImageOptional, registerPolice);
router.get('/users/:id', getStaffUserById);
router.put('/users/:id', uploadProfileImageOptional, updateStaffUser);
router.patch('/users/:id/status', setStaffUserStatus);

router.get('/permissions/availability', getPermissionsAvailability);
router.get('/permissions/modules', getPermissionsAvailability);
router.get('/permissions/police-users', listPoliceUsersForPermissions);
router.get('/permissions/users/:id', getUserPermissions);
router.put('/permissions/users/:id', updateUserPermissions);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.patch('/categories/:id/status', setCategoryStatus);

router.get('/audit-logs', listAuditLogs);
router.get('/audit-logs/timeline', getAuthTimeline);
router.get('/audit-logs/:id', getAuditLogById);

router.get('/geography', listGeographyTable);
router.post('/geography', createGeography);
router.put('/geography/:id', updateGeography);
router.delete('/geography/:id', deleteGeography);

router.get('/sms/balance', getSmsBalance);
router.get('/sms/stats', getSmsStats);
router.get('/sms/recipients', listSmsRecipients);
router.post('/sms/send', sendSms);
router.get('/sms/history', listSmsHistory);

router.get('/chatbot/status', getChatbotStatus);
router.post('/chatbot/ask', chatWithAssistant);

export default router;

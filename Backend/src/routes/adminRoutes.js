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
  registerPolice,
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
import { listAuditLogs } from '../controllers/auditController.js';
import { adminOnly } from '../middleware/auth.js';
import { uploadProfileImageOptional } from '../middleware/uploadProfileImage.js';

const router = Router();

router.use(...adminOnly);

router.get('/dashboard', getAdminDashboard);

router.get('/citizens', listCitizens);
router.get('/citizens/:id', getCitizenById);
router.put('/citizens/:id', uploadProfileImageOptional, updateCitizen);
router.patch('/citizens/:id/status', setCitizenStatus);

router.get('/users', listStaffUsers);
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

export default router;

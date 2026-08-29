import { Router } from 'express';
import {
  getAdminDashboard,
  getCitizenById,
  getPermissionsAvailability,
  getStaffUserById,
  listCitizens,
  listStaffUsers,
  registerPolice,
  setCitizenStatus,
  setStaffUserStatus,
  updateCitizen,
  updateStaffUser,
} from '../controllers/adminController.js';
import { adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(...adminOnly);

router.get('/dashboard', getAdminDashboard);

router.get('/citizens', listCitizens);
router.get('/citizens/:id', getCitizenById);
router.put('/citizens/:id', updateCitizen);
router.patch('/citizens/:id/status', setCitizenStatus);

router.get('/users', listStaffUsers);
router.post('/users/police', registerPolice);
router.get('/users/:id', getStaffUserById);
router.put('/users/:id', updateStaffUser);
router.patch('/users/:id/status', setStaffUserStatus);

router.get('/permissions/availability', getPermissionsAvailability);

export default router;

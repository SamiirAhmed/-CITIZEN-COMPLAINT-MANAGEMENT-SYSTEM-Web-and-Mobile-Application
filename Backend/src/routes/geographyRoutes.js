import { Router } from 'express';
import {
  listAreas,
  listDistrictsByRegion,
  listRegions,
  listVillages,
  resolveLocationId,
} from '../controllers/geographyController.js';

const router = Router();

router.get('/regions', listRegions);
router.get('/districts', listDistrictsByRegion);
router.get('/villages', listVillages);
router.get('/areas', listAreas);
router.post('/resolve', resolveLocationId);

export default router;

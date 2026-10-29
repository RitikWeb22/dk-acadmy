import { Router } from 'express';
import {
  getAllTestSeries,
  getTestSeriesByIdOrSlug,
  createTestSeries,
  updateTestSeries,
  deleteTestSeries
} from '../controllers/testSeriesController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes for catalog & CBT simulator
router.get('/', getAllTestSeries);
router.get('/:id', getTestSeriesByIdOrSlug);

// Admin & Faculty creation/management routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), createTestSeries);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), updateTestSeries);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), deleteTestSeries);

export default router;

import { Router } from 'express';
import {
  getAllDppPyq,
  getDppPyqByIdOrSlug,
  createDppPyq,
  updateDppPyq,
  deleteDppPyq
} from '../controllers/dppPyqController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes for student catalog & practice view
router.get('/', getAllDppPyq);
router.get('/:id', getDppPyqByIdOrSlug);

// Admin & Faculty creation/management routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), createDppPyq);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), updateDppPyq);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), deleteDppPyq);

export default router;

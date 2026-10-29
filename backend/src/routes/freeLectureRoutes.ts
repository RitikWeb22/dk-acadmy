import { Router } from 'express';
import {
  getFreeLectures,
  getFreeLectureById,
  createFreeLecture,
  updateFreeLecture,
  deleteFreeLecture,
  enforce5FreeRule
} from '../controllers/freeLectureController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', getFreeLectures);
router.get('/:id', getFreeLectureById);
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), createFreeLecture);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), updateFreeLecture);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), deleteFreeLecture);
router.post('/enforce-5-free', protect, authorize('SUPER_ADMIN', 'ADMIN'), enforce5FreeRule);

export default router;

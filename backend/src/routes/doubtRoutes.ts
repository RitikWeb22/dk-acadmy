import { Router } from 'express';
import {
  getDoubts,
  createDoubt,
  answerDoubt,
  updateDoubtStatus,
  deleteDoubt,
  toggleLikeDoubt
} from '../controllers/doubtController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Retrieve doubts (admin & student view)
router.get('/', getDoubts);

// Student submits doubt
router.post('/', createDoubt);

// Like doubt
router.put('/:id/like', toggleLikeDoubt);

// Admin & Faculty answers doubt (broadcasts real-time Socket.IO notification to student)
router.put('/:id/answer', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), answerDoubt);

// Admin moderation
router.put('/:id/status', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateDoubtStatus);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteDoubt);

export default router;

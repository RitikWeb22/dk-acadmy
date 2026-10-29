import { Router } from 'express';
import {
  getAllReviews,
  createReview,
  updateReviewStatus,
  replyToReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Public review retrieval (for courses page) & review submission
router.get('/', getAllReviews);
router.post('/', createReview);

// Review moderation & reply (Admin & Faculty Protected)
router.put('/:id/status', protect, authorize('SUPER_ADMIN', 'ADMIN'), updateReviewStatus);
router.post('/:id/reply', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), replyToReview);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteReview);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import {
  getAllReviews,
  createReview,
  updateReviewStatus,
  replyToReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idParamSchema } from '../middlewares/validateMiddleware.js';

const router = Router();

const createReviewSchema = z
  .object({
    courseId: z.string().trim().min(1, 'courseId is required'),
    courseTitle: z.string().trim().optional(),
    rating: z.union([z.number().min(1).max(5), z.string().regex(/^[1-5]$/).transform(Number)]),
    title: z.string().trim().min(2, 'Review title must be at least 2 characters'),
    content: z.string().trim().min(5, 'Review content must be at least 5 characters'),
    studentName: z.string().optional(),
    studentEmail: z.string().email().optional()
  })
  .strict();

const updateReviewStatusSchema = z
  .object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
  })
  .strict();

const replyToReviewSchema = z
  .object({
    replyContent: z.string().trim().min(1, 'Reply content cannot be empty'),
    responderName: z.string().optional()
  })
  .strict();

// Public review retrieval (for courses page) & review submission
router.get('/', getAllReviews);
router.post('/', validate({ body: createReviewSchema }), createReview);

// Review moderation & reply (Admin & Faculty Protected)
router.put(
  '/:id/status',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idParamSchema, body: updateReviewStatusSchema }),
  updateReviewStatus
);
router.post(
  '/:id/reply',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  validate({ params: idParamSchema, body: replyToReviewSchema }),
  replyToReview
);
router.delete(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idParamSchema }),
  deleteReview
);

export default router;

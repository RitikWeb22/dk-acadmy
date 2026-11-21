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
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';

const router = Router();

const createReviewSchema = z
  .object({
    courseId: z.string().trim().min(1, 'courseId is required'),
    courseTitle: z.string().trim().optional(),
    lectureId: z.string().optional(),
    lectureTitle: z.string().optional(),
    rating: z.union([z.number().min(1).max(5), z.string().regex(/^[1-5](\.\d+)?$/).transform(Number)]),
    confidenceLevel: z.string().optional(),
    satisfiedWithDepth: z.string().optional(),
    title: z.string().trim().optional(),
    content: z.string().trim().optional(),
    studentName: z.string().optional(),
    studentEmail: z.string().optional()
  })
  .passthrough();

const updateReviewStatusSchema = z
  .object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'FLAGGED'])
  })
  .passthrough();

const replyToReviewSchema = z
  .object({
    content: z.string().trim().optional(),
    replyContent: z.string().trim().optional(),
    responderName: z.string().optional()
  })
  .passthrough();

// Public review retrieval (for courses page) & review submission
router.get('/', getAllReviews);
router.post('/', validate({ body: createReviewSchema }), createReview);

// Review moderation & reply (Admin & Faculty Protected)
router.put(
  '/:id/status',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idOrSlugParamSchema, body: updateReviewStatusSchema }),
  updateReviewStatus
);
router.post(
  '/:id/reply',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  validate({ params: idOrSlugParamSchema, body: replyToReviewSchema }),
  replyToReview
);
router.delete(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  deleteReview
);

export default router;

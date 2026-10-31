import { Router } from 'express';
import { z } from 'zod';
import {
  getDoubts,
  createDoubt,
  answerDoubt,
  updateDoubtStatus,
  deleteDoubt,
  toggleLikeDoubt
} from '../controllers/doubtController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idParamSchema } from '../middlewares/validateMiddleware.js';

const router = Router();

const createDoubtSchema = z
  .object({
    courseId: z.string().trim().min(1, 'Course ID is required'),
    courseTitle: z.string().trim().optional(),
    subject: z.string().trim().min(1, 'Subject is required'),
    chapter: z.string().trim().optional(),
    topic: z.string().trim().optional(),
    question: z.string().trim().min(3, 'Question must be at least 3 characters'),
    questionImage: z.string().optional(),
    studentName: z.string().optional(),
    studentEmail: z.string().email().optional(),
    studentPhone: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
  })
  .strict();

const answerDoubtSchema = z
  .object({
    answer: z.string().trim().min(1, 'Answer text is required'),
    facultyName: z.string().optional(),
    answerImage: z.string().optional()
  })
  .strict();

// Retrieve doubts (admin & student view)
router.get('/', getDoubts);

// Student submits doubt
router.post('/', validate({ body: createDoubtSchema }), createDoubt);

// Like doubt
router.put('/:id/like', validate({ params: idParamSchema }), toggleLikeDoubt);

// Admin & Faculty answers doubt (broadcasts real-time Socket.IO notification to student)
router.put(
  '/:id/answer',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  validate({ params: idParamSchema, body: answerDoubtSchema }),
  answerDoubt
);

// Admin moderation
router.put(
  '/:id/status',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  validate({ params: idParamSchema }),
  updateDoubtStatus
);
router.delete(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idParamSchema }),
  deleteDoubt
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import {
  getLiveToken,
  getLiveSessions,
  startLiveSession,
  endLiveSession,
  getLiveSessionById
} from '../controllers/liveController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

const tokenSchema = z
  .object({
    roomId: z.string().trim().min(1, 'Room ID is required'),
    userId: z.string().trim().optional(),
    role: z.string().trim().min(1, 'Role is required'),
    userName: z.string().trim().optional(),
    batchId: z.string().trim().optional()
  })
  .strict();

const createSessionSchema = z
  .object({
    roomId: z.string().trim().min(1, 'Room ID is required'),
    title: z.string().trim().min(1, 'Title is required'),
    subject: z.string().trim().optional(),
    teacherName: z.string().trim().optional(),
    batchId: z.string().trim().optional(),
    scheduledStart: z.string().optional()
  })
  .strict();

// 1. Role-based LiveKit Token Generator
router.post('/token', validate({ body: tokenSchema }), getLiveToken);

// 2. Live Session Management
router.get('/sessions', getLiveSessions);
router.post(
  '/sessions',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  validate({ body: createSessionSchema }),
  startLiveSession
);
router.get('/sessions/:roomId', getLiveSessionById);
router.post('/sessions/:roomId/end', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), endLiveSession);
router.put('/sessions/:roomId/end', protect, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), endLiveSession);

export default router;


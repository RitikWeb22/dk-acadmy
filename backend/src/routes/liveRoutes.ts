import { Router } from 'express';
import {
  getLiveToken,
  getLiveSessions,
  startLiveSession,
  endLiveSession,
  getLiveSessionById
} from '../controllers/liveController.js';

const router = Router();

// 1. Role-based LiveKit Token Generator
router.post('/token', getLiveToken);

// 2. Live Session Management
router.get('/sessions', getLiveSessions);
router.post('/sessions', startLiveSession);
router.get('/sessions/:roomId', getLiveSessionById);
router.post('/sessions/:roomId/end', endLiveSession);
router.put('/sessions/:roomId/end', endLiveSession);

export default router;


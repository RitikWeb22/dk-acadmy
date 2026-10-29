import { Router } from 'express';
import { lmsVideoController } from '../controllers/lmsVideoController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { uploadRawVideo, uploadVideoChunk } from '../middlewares/videoUploadMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for upload endpoint (prevent abuse)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 video upload initiations per 15 min
  message: { success: false, message: 'Too many upload attempts, please try again later.' }
});

// Rate limiter for playback tokens
const tokenLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 token generation requests per min
  message: { success: false, message: 'Too many playback token requests. Rate limit exceeded.' }
});

// 1. Video Upload (Admin / Teacher / Super Admin / CMS Manager)
router.post(
  '/upload',
  uploadLimiter,
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER'),
  uploadRawVideo.single('video'),
  lmsVideoController.uploadVideo
);

// 2. Resumable Chunked Upload (for large videos / network-fail resilience)
router.post(
  '/upload/chunk',
  uploadLimiter,
  protect,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER'),
  uploadVideoChunk.single('chunk'),
  lmsVideoController.uploadChunk
);

// 3. Playback Token Generation (Feature A & B)
router.post('/playback-token', tokenLimiter, protect, lmsVideoController.getPlaybackToken);

// 4. Secure HLS Streaming (Token verified in controller)
router.get('/stream/:videoId/master.m3u8', lmsVideoController.streamMasterPlaylist);
router.get('/stream/:videoId/:assetName', (req, res, next) => {
  const assetName = String(req.params.assetName);
  if (assetName.endsWith('.m3u8')) {
    (req.params as any).playlistName = assetName;
    return lmsVideoController.streamVariantPlaylist(req, res);
  } else if (assetName.endsWith('.ts')) {
    (req.params as any).segmentName = assetName;
    return lmsVideoController.streamSegment(req, res);
  }
  next();
});

// 5. Session and Device Controls (Feature D)
router.post('/session/heartbeat', protect, lmsVideoController.sessionHeartbeat);
router.post('/session/revoke', protect, authorize('ADMIN', 'SUPER_ADMIN'), lmsVideoController.revokeSession);

// 6. Learning Progress Tracking (Feature E)
router.post('/progress/update', protect, lmsVideoController.updateProgress);
router.get('/progress/:courseId', protect, lmsVideoController.getCourseProgress);

// 7. Video Management (Super Admin & Teacher Dashboard)
router.get('/videos', protect, authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'CMS_MANAGER'), lmsVideoController.getVideos);
router.get('/videos/:id/status', lmsVideoController.getVideoStatus);

export default router;

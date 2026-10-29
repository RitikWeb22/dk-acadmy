import type { Response, Request } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { Video } from '../models/Video.js';
import { Course } from '../models/Course.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { PlaybackSession } from '../models/PlaybackSession.js';
import { User } from '../models/User.js';
import { videoTranscodeService } from '../services/videoTranscodeService.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'dk_academy_jwt_super_secret_key_2026_xyz123';

// Input validation schemas using zod
export const uploadMetadataSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  sectionId: z.string().optional(),
  lectureId: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  isFreePreview: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  notesPdfUrl: z.string().optional()
});

export const playbackTokenSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lectureId: z.string().min(1, 'Lecture ID is required'),
  videoId: z.string().optional(),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required')
});

export const watchProgressSchema = z.object({
  courseId: z.string().min(1),
  lectureId: z.string().min(1),
  videoId: z.string().optional(),
  positionSeconds: z.number().min(0),
  durationSeconds: z.number().min(0)
});

// Resumable chunk storage map
const chunkUploads = new Map<string, { totalChunks: number; receivedChunks: Set<number>; tempDir: string; originalName: string; metadata: any }>();

export const lmsVideoController = {
  // 1. Standard Multipart Upload
  uploadVideo: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No video file provided' });
        return;
      }

      const parseResult = uploadMetadataSchema.safeParse(req.body);
      if (!parseResult.success) {
        // Remove uploaded file if validation failed
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
        return;
      }

      const metadata = parseResult.data;
      const rawFilePath = req.file.path;
      const videoId = new (await import('mongoose')).default.Types.ObjectId().toString();
      const hlsDir = path.join(process.cwd(), 'storage', 'private', 'hls', videoId);

      const videoDoc = await Video.create({
        _id: videoId,
        title: metadata.title,
        description: metadata.description || '',
        courseId: metadata.courseId,
        sectionId: metadata.sectionId || '',
        lectureId: metadata.lectureId || '',
        uploaderId: req.user?._id,
        rawFileName: req.file.originalname,
        rawFilePath: rawFilePath,
        hlsDirectory: hlsDir,
        masterPlaylistUrl: '',
        durationSeconds: 0,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        status: 'uploading',
        transcodeProgress: 5,
        isFreePreview: metadata.isFreePreview || false,
        notesPdfUrl: metadata.notesPdfUrl || ''
      });

      // Queue background FFmpeg transcoding
      videoTranscodeService.queueTranscode({
        videoId: videoId,
        rawFilePath: rawFilePath,
        outputDir: hlsDir,
        courseId: metadata.courseId,
        lectureId: metadata.lectureId
      });

      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully. HLS background conversion initiated.',
        data: {
          videoId: videoDoc._id,
          title: videoDoc.title,
          status: 'processing',
          transcodeProgress: 10
        }
      });
    } catch (error: any) {
      console.error('[Upload Video Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Video upload failed' });
    }
  },

  // 2. Resumable Chunked Upload (Tus / Multipart Chunk handler)
  uploadChunk: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { uploadId, chunkIndex, totalChunks, originalName, metadataStr } = req.body;
      const file = req.file;

      if (!uploadId || chunkIndex === undefined || !totalChunks || !file) {
        res.status(400).json({ success: false, message: 'Missing chunk upload parameters' });
        return;
      }

      const index = parseInt(chunkIndex, 10);
      const total = parseInt(totalChunks, 10);

      const tempDir = path.join(process.cwd(), 'storage', 'private', 'chunks', uploadId);
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const chunkFilePath = path.join(tempDir, `chunk_${index}`);
      fs.renameSync(file.path, chunkFilePath);

      let uploadState = chunkUploads.get(uploadId);
      if (!uploadState) {
        let metadata = {};
        try {
          if (metadataStr) metadata = JSON.parse(metadataStr);
        } catch (_) {}
        uploadState = {
          totalChunks: total,
          receivedChunks: new Set<number>(),
          tempDir,
          originalName: originalName || 'video.mp4',
          metadata
        };
        chunkUploads.set(uploadId, uploadState);
      }

      uploadState.receivedChunks.add(index);

      // Check if all chunks have arrived
      if (uploadState.receivedChunks.size === total) {
        // Reassemble chunks
        const rawDir = path.join(process.cwd(), 'storage', 'private', 'raw-videos');
        if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

        const videoId = new (await import('mongoose')).default.Types.ObjectId().toString();
        const extension = path.extname(uploadState.originalName) || '.mp4';
        const finalFilePath = path.join(rawDir, `${videoId}${extension}`);
        const writeStream = fs.createWriteStream(finalFilePath);

        for (let i = 0; i < total; i++) {
          const partPath = path.join(tempDir, `chunk_${i}`);
          if (fs.existsSync(partPath)) {
            const data = fs.readFileSync(partPath);
            writeStream.write(data);
            fs.unlinkSync(partPath);
          }
        }
        writeStream.end();

        // Cleanup temp chunk dir
        try {
          fs.rmdirSync(tempDir);
        } catch (_) {}
        chunkUploads.delete(uploadId);

        const stats = fs.statSync(finalFilePath);
        const hlsDir = path.join(process.cwd(), 'storage', 'private', 'hls', videoId);

        const videoDoc = await Video.create({
          _id: videoId,
          title: uploadState.metadata.title || uploadState.originalName,
          description: uploadState.metadata.description || '',
          courseId: uploadState.metadata.courseId,
          sectionId: uploadState.metadata.sectionId || '',
          lectureId: uploadState.metadata.lectureId || '',
          uploaderId: req.user?._id,
          rawFileName: uploadState.originalName,
          rawFilePath: finalFilePath,
          hlsDirectory: hlsDir,
          masterPlaylistUrl: '',
          durationSeconds: 0,
          fileSizeBytes: stats.size,
          mimeType: 'video/mp4',
          status: 'uploading',
          transcodeProgress: 10,
          isFreePreview: uploadState.metadata.isFreePreview || false
        });

        // Queue background FFmpeg
        videoTranscodeService.queueTranscode({
          videoId: videoId,
          rawFilePath: finalFilePath,
          outputDir: hlsDir,
          courseId: uploadState.metadata.courseId,
          lectureId: uploadState.metadata.lectureId
        });

        res.status(200).json({
          success: true,
          completed: true,
          message: 'All chunks received. Assembled and processing HLS.',
          data: { videoId }
        });
        return;
      }

      res.status(200).json({
        success: true,
        completed: false,
        chunkReceived: index,
        totalReceived: uploadState.receivedChunks.size,
        totalExpected: total
      });
    } catch (error: any) {
      console.error('[Resumable Chunk Upload Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Chunk upload failed' });
    }
  },

  // 3. Short-Lived Playback Token Generator (Features A, B, D)
  getPlaybackToken: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parseResult = playbackTokenSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
        return;
      }

      const { courseId, lectureId, videoId, deviceFingerprint } = parseResult.data;
      const user = req.user;

      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required for video playback' });
        return;
      }

      // Feature A: Course-based Access Control
      let hasAccess = false;

      // 1. Check if user is staff/admin
      if (['ADMIN', 'SUPER_ADMIN', 'CMS_MANAGER', 'LEAD_MANAGER'].includes(user.role)) {
        hasAccess = true;
      }

      // 2. Check if lecture is free preview
      if (!hasAccess) {
        const course = await Course.findById(courseId);
        if (course) {
          for (const section of course.curriculumSections || []) {
            const lecture = section.lectures?.find((l) => l.id === lectureId);
            if (lecture && lecture.isFreePreview) {
              hasAccess = true;
              break;
            }
          }
        }
      }

      // 3. Check if student is enrolled in the course
      if (!hasAccess && user.enrolledCourses) {
        const enrolled = user.enrolledCourses.some((cId) => cId.toString() === courseId);
        if (enrolled) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          code: 'ENROLLMENT_REQUIRED',
          message: 'Enrollment required to access this premium lesson'
        });
        return;
      }

      // Feature D: Session and Device Controls (Track active sessions, detect concurrent play)
      const existingActiveSessions = await PlaybackSession.find({
        studentId: user._id,
        isActive: true,
        revoked: false
      });

      // If session exists on different device, deactivate older sessions to enforce single active device
      for (const oldSession of existingActiveSessions) {
        if (oldSession.deviceFingerprint !== deviceFingerprint) {
          oldSession.isActive = false;
          oldSession.revoked = true;
          oldSession.revokedReason = 'New playback session started on another device';
          await oldSession.save();
        }
      }

      const sessionId = uuidv4();
      await PlaybackSession.create({
        studentId: user._id,
        sessionId,
        deviceFingerprint,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        currentCourseId: courseId,
        currentLectureId: lectureId,
        isActive: true,
        revoked: false,
        lastHeartbeat: new Date()
      });

      // Feature B: Short-lived Playback Token (15 minutes expiry)
      const tokenPayload = {
        studentId: user._id.toString(),
        email: user.email,
        courseId,
        lectureId,
        videoId: videoId || '',
        sessionId
      };

      const playbackToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

      // Unmasked user email for forensic anti-piracy dynamic watermark (Feature C)
      res.status(200).json({
        success: true,
        playbackToken,
        sessionId,
        expiresIn: 900, // 15 mins in seconds
        watermark: {
          text: `${user.email} • ID: ${user._id.toString().slice(-6).toUpperCase()}`,
          studentId: user._id.toString()
        }
      });
    } catch (error: any) {
      console.error('[Playback Token Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate playback token' });
    }
  },

  // 4. Secure Stream Playlist (.m3u8) with Token Verification
  streamMasterPlaylist: async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);

      if (!token) {
        res.status(403).json({ success: false, message: 'Forbidden: Missing playback authorization token' });
        return;
      }

      // Verify token
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(403).json({ success: false, message: 'Forbidden: Playback token expired or invalid' });
        return;
      }

      // Feature D check: verify session has not been revoked
      if (decoded.sessionId) {
        const session = await PlaybackSession.findOne({ sessionId: decoded.sessionId });
        if (session && session.revoked) {
          res.status(403).json({ success: false, message: 'Session terminated: Another device is currently playing' });
          return;
        }
      }

      const baseHlsDir = path.resolve(process.cwd(), 'storage', 'private', 'hls');
      const vId = path.basename(String(req.params.videoId));
      const playlistPath = path.join(baseHlsDir, vId, 'master.m3u8');

      if (!path.resolve(playlistPath).startsWith(baseHlsDir) || !fs.existsSync(playlistPath)) {
        res.status(404).json({ success: false, message: 'HLS master playlist not found or still processing' });
        return;
      }

      // Read playlist and rewrite variant playlist lines to append token parameter
      let content = fs.readFileSync(playlistPath, 'utf-8');
      const rewritten = content
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.endsWith('.m3u8')) {
            return `${trimmed}?token=${encodeURIComponent(token)}`;
          }
          return line;
        })
        .join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(rewritten);
    } catch (error: any) {
      console.error('[Stream Master Error]:', error);
      res.status(500).json({ success: false, message: 'Streaming failed' });
    }
  },

  // 5. Secure Stream Variant Playlist (e.g., 720p.m3u8, 480p.m3u8, 360p.m3u8)
  streamVariantPlaylist: async (req: Request, res: Response): Promise<void> => {
    try {
      const baseHlsDir = path.resolve(process.cwd(), 'storage', 'private', 'hls');
      const vId = path.basename(String(req.params.videoId));
      const pName = path.basename(String(req.params.playlistName));
      const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);

      if (!token) {
        res.status(403).json({ success: false, message: 'Forbidden: Missing playback authorization token' });
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(403).json({ success: false, message: 'Forbidden: Playback token expired or invalid' });
        return;
      }

      const filePath = path.join(baseHlsDir, vId, pName);
      if (!path.resolve(filePath).startsWith(baseHlsDir) || !fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'Variant playlist not found' });
        return;
      }

      // Read and append token to each .ts segment filename so segment fetches are authenticated
      const content = fs.readFileSync(filePath, 'utf-8');
      const rewritten = content
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.endsWith('.ts')) {
            return `${trimmed}?token=${encodeURIComponent(token)}`;
          }
          return line;
        })
        .join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(rewritten);
    } catch (error: any) {
      console.error('[Stream Variant Error]:', error);
      res.status(500).json({ success: false, message: 'Streaming variant failed' });
    }
  },

  // 6. Secure Stream TS Video Segment (e.g., 720p_001.ts)
  streamSegment: async (req: Request, res: Response): Promise<void> => {
    try {
      const baseHlsDir = path.resolve(process.cwd(), 'storage', 'private', 'hls');
      const vId = path.basename(String(req.params.videoId));
      const sName = path.basename(String(req.params.segmentName));
      const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);

      if (!token) {
        res.status(403).json({ success: false, message: 'Forbidden: Missing chunk authorization token' });
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(403).json({ success: false, message: 'Forbidden: Segment authorization expired' });
        return;
      }

      const segmentPath = path.join(baseHlsDir, vId, sName);
      if (!path.resolve(segmentPath).startsWith(baseHlsDir) || !fs.existsSync(segmentPath)) {
        res.status(404).json({ success: false, message: 'Video segment not found' });
        return;
      }

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const fileStream = fs.createReadStream(segmentPath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error('[Stream Segment Error]:', error);
      res.status(500).json({ success: false, message: 'Failed to stream segment' });
    }
  },

  // 7. Session Heartbeat (Feature D)
  sessionHeartbeat: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { sessionId, deviceFingerprint } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'Session ID required' });
        return;
      }

      const session = await PlaybackSession.findOne({ sessionId });
      if (!session) {
        res.status(404).json({ success: false, active: false, message: 'Playback session not found' });
        return;
      }

      if (session.revoked || !session.isActive) {
        res.status(200).json({
          success: true,
          active: false,
          revoked: true,
          reason: session.revokedReason || 'Session terminated on this device'
        });
        return;
      }

      session.lastHeartbeat = new Date();
      await session.save();

      res.status(200).json({ success: true, active: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 8. Learning Progress Update (Feature E)
  updateProgress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parseResult = watchProgressSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ success: false, message: parseResult.error.issues[0].message });
        return;
      }

      const { courseId, lectureId, videoId, positionSeconds, durationSeconds } = parseResult.data;
      const percentage = durationSeconds > 0 ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100)) : 0;
      const isCompleted = percentage >= 90;

      const progress = await WatchProgress.findOneAndUpdate(
        { studentId: user._id, courseId, lectureId },
        {
          $set: {
            videoId: videoId || undefined,
            lastPositionSeconds: positionSeconds,
            totalDurationSeconds: durationSeconds,
            percentageWatched: percentage,
            isCompleted: isCompleted,
            lastWatchedAt: new Date(),
            ...(isCompleted ? { completedAt: new Date() } : {})
          },
          $inc: { watchHistoryCount: 1 }
        },
        { upsert: true, new: true }
      );

      res.status(200).json({ success: true, data: progress });
    } catch (error: any) {
      console.error('[Progress Update Error]:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 9. Fetch Progress for all Lectures in a Course (Feature E)
  getCourseProgress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { courseId } = req.params;

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const progressRecords = await WatchProgress.find({ studentId: user._id, courseId });
      
      const progressMap: Record<string, { lastPosition: number; duration: number; percentage: number; isCompleted: boolean }> = {};
      progressRecords.forEach((rec) => {
        progressMap[rec.lectureId] = {
          lastPosition: rec.lastPositionSeconds,
          duration: rec.totalDurationSeconds,
          percentage: rec.percentageWatched,
          isCompleted: rec.isCompleted
        };
      });

      res.status(200).json({ success: true, data: progressMap });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 10. List Videos (Admin / Teacher Dashboard)
  getVideos: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { courseId } = req.query;
      const filter: any = {};
      if (courseId) filter.courseId = courseId;

      const videos = await Video.find(filter).sort({ createdAt: -1 });
      res.status(200).json({ success: true, count: videos.length, data: videos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 11. Check Video Transcoding Status
  getVideoStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const video = await Video.findById(id).select('status transcodeProgress durationSeconds masterPlaylistUrl errorMessage');
      if (!video) {
        res.status(404).json({ success: false, message: 'Video not found' });
        return;
      }
      res.status(200).json({ success: true, data: video });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 12. Revoke Device Playback Session (Admin API)
  revokeSession: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { sessionId, reason } = req.body;
      const session = await PlaybackSession.findOneAndUpdate(
        { sessionId },
        { isActive: false, revoked: true, revokedReason: reason || 'Revoked by admin' },
        { new: true }
      );
      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Playback session revoked successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

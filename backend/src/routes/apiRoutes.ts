import { Router } from 'express';
import authRoutes from './authRoutes.js';
import leadRoutes from './leadRoutes.js';
import courseRoutes from './courseRoutes.js';
import cmsRoutes from './cmsRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import lmsVideoRoutes from './lmsVideoRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import testSeriesRoutes from './testSeriesRoutes.js';
import dppPyqRoutes from './dppPyqRoutes.js';
import freeLectureRoutes from './freeLectureRoutes.js';
import doubtRoutes from './doubtRoutes.js';
import liveRoutes from './liveRoutes.js';
import couponRoutes from './couponRoutes.js';
import offerRoutes from './offerRoutes.js';
import { getGeminiConfig, updateGeminiConfig } from '../controllers/aiFormatController.js';

import mongoose from 'mongoose';
import os from 'os';
import { getMongoPoolMetrics } from '../config/db.js';
import { optionalProtect, protect, authorize, AuthRequest } from '../middlewares/authMiddleware.js';

const router = Router();

// Standard Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'DK Academy JEE Backend API is operational',
    timestamp: new Date().toISOString()
  });
});

// Liveness probe (process is alive)
router.get('/health/liveness', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (process + database ready to accept traffic)
router.get('/health/readiness', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (isDbReady) {
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      dbReadyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
});

// Operational & Cluster Metrics Endpoint (Sanitized for public; full diagnostics for admins)
router.get('/health/metrics', optionalProtect, (req: AuthRequest, res) => {
  const mem = process.memoryUsage();
  const pool = getMongoPoolMetrics();
  const rawRole = String(req.user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'DIRECTOR'].includes(rawRole);

  const poolSanitized = {
    readyState: pool.readyState,
    maxPoolSize: pool.maxPoolSize,
    minPoolSize: pool.minPoolSize,
    currentCheckedOut: pool.currentCheckedOut,
    peakCheckedOut: pool.peakCheckedOut,
    totalCheckouts: pool.totalCheckouts,
    totalCheckins: pool.totalCheckins,
    totalCheckoutFailures: pool.totalCheckoutFailures,
    waitQueueTimeoutMS: pool.waitQueueTimeoutMS,
    // Database host topology is only revealed to verified administrators
    ...(isAdmin && pool.host ? { host: pool.host } : {})
  };

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    worker: {
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      ...(isAdmin ? { nodeVersion: process.version, platform: process.platform } : {})
    },
    ...(isAdmin
      ? {
          system: {
            freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
            totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
            cpuCores: os.cpus().length
          }
        }
      : {}),
    memoryMB: {
      rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      ...(isAdmin ? { external: Math.round((mem.external / 1024 / 1024) * 100) / 100 } : {})
    },
    databasePool: poolSanitized
  });
});

// Strict Admin-Only Metrics Route (Guaranteed 401/403 for unauthorized requests)
router.get('/health/admin-metrics', protect, authorize('ADMIN', 'SUPER_ADMIN', 'DIRECTOR'), (req: AuthRequest, res) => {
  const mem = process.memoryUsage();
  const pool = getMongoPoolMetrics();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    worker: {
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform
    },
    system: {
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      cpuCores: os.cpus().length
    },
    memoryMB: {
      rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      external: Math.round((mem.external / 1024 / 1024) * 100) / 100
    },
    databasePool: pool
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/contact', leadRoutes);
router.use('/courses', courseRoutes);
router.use('/test-series', testSeriesRoutes);
router.use('/dpp-pyq', dppPyqRoutes);
router.use('/dpp-pyqs', dppPyqRoutes);
router.use('/free-lectures', freeLectureRoutes);
router.use('/cms', cmsRoutes);
router.use('/payment', paymentRoutes);
router.use('/upload', uploadRoutes);
router.use('/lms', lmsVideoRoutes);
router.use('/reviews', reviewRoutes);
router.use('/doubts', doubtRoutes);
router.use('/live', liveRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/coupons', couponRoutes);
router.use('/offers', offerRoutes);

// Gemini AI System Configuration
router.get('/system/gemini-config', getGeminiConfig);
router.post('/system/gemini-config', updateGeminiConfig);

export default router;

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

import mongoose from 'mongoose';

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

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/contact', leadRoutes);
router.use('/courses', courseRoutes);
router.use('/test-series', testSeriesRoutes);
router.use('/dpp-pyq', dppPyqRoutes);
router.use('/free-lectures', freeLectureRoutes);
router.use('/cms', cmsRoutes);
router.use('/payment', paymentRoutes);
router.use('/upload', uploadRoutes);
router.use('/lms', lmsVideoRoutes);
router.use('/reviews', reviewRoutes);
router.use('/doubts', doubtRoutes);
router.use('/analytics', analyticsRoutes);


export default router;

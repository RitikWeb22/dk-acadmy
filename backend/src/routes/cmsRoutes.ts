import { Router } from 'express';
import { getCMSConfig, saveCMSConfig, resetCMSConfig } from '../controllers/cmsController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Publicly readable CMS configs (navbar, footer, pages, academic resources)
router.get('/:type', getCMSConfig);

// Admin-managed CMS updates
router.post('/:type', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), saveCMSConfig);
router.post('/:type/reset', protect, authorize('SUPER_ADMIN', 'ADMIN'), resetCMSConfig);

export default router;

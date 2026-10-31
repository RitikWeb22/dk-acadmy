import { Router } from 'express';
import { z } from 'zod';
import { getCMSConfig, saveCMSConfig, resetCMSConfig } from '../controllers/cmsController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

const typeParamSchema = z
  .object({
    type: z.string().trim().min(1).max(100)
  })
  .strict();

const saveCmsSchema = z
  .object({
    data: z.any()
  })
  .strict();

// Publicly readable CMS configs (navbar, footer, pages, academic resources)
router.get('/:type', validate({ params: typeParamSchema }), getCMSConfig);

// Admin-managed CMS updates
router.post(
  '/:type',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ params: typeParamSchema, body: saveCmsSchema }),
  saveCMSConfig
);
router.post(
  '/:type/reset',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  validate({ params: typeParamSchema }),
  resetCMSConfig
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { getAllTestSeries, getTestSeriesByIdOrSlug, createTestSeries, updateTestSeries, deleteTestSeries } from '../controllers/testSeriesController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';
const router = Router();
const createTestSeriesSchema = z
    .object({
    title: z.string().trim().min(2, 'Title is required'),
    slug: z.string().trim().optional(),
    description: z.string().optional(),
    targetExam: z.string().optional(),
    totalTests: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).optional(),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    originalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    isFree: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    syllabus: z.array(z.string()).optional(),
    tests: z.array(z.any()).optional()
})
    .strict();
// Public routes for catalog & CBT simulator
router.get('/', getAllTestSeries);
router.get('/:id', getTestSeriesByIdOrSlug);
// Admin & Faculty creation/management routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ body: createTestSeriesSchema }), createTestSeries);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ params: idOrSlugParamSchema }), updateTestSeries);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), validate({ params: idOrSlugParamSchema }), deleteTestSeries);
export default router;

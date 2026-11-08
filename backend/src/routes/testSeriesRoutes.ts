import { Router } from 'express';
import { z } from 'zod';
import {
  getAllTestSeries,
  getTestSeriesByIdOrSlug,
  createTestSeries,
  updateTestSeries,
  deleteTestSeries,
  submitTestSeries,
  autosaveTestProgress,
  getTestProgress,
  getTestSeriesSubmissionSolution,
  getTestSeriesSubmissionStatus,
  getTestSeriesSolutionAdminOverview,
  updateTestSeriesSolutionConfig,
  unlockTestSeries
} from '../controllers/testSeriesController.js';
import { formatMathWithAi } from '../controllers/aiFormatController.js';
import { protect, authorize, optionalProtect } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';

const router = Router();

const createTestSeriesSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, 'Title is required'),
    subtitle: z.string().optional(),
    slug: z.string().trim().optional(),
    description: z.string().optional(),
    badgeCode: z.string().optional(),
    examType: z.string().optional(),
    format: z.string().optional(),
    difficulty: z.string().optional(),
    targetExam: z.string().optional(),
    durationMinutes: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).optional(),
    totalQuestions: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).optional(),
    totalMarks: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).optional(),
    subjects: z.array(z.string()).optional(),
    markingScheme: z.any().optional(),
    instructions: z.array(z.string()).optional(),
    questions: z.array(z.any()).optional(),
    batch: z.string().optional(),
    targetBatches: z.array(z.string()).optional(),
    totalTests: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).optional(),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    originalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    isFree: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    status: z.string().optional(),
    schedule: z.any().optional(),
    attemptsCount: z.number().optional(),
    syllabus: z.array(z.string()).optional(),
    tests: z.array(z.any()).optional()
  })
  .passthrough();

// Public routes for catalog & CBT simulator
router.get('/', getAllTestSeries);
router.get('/:id', getTestSeriesByIdOrSlug);

// Submission, Autosave & Student-Specific Solution Scheduling
router.post('/:id/submit', optionalProtect, submitTestSeries);
router.post('/:id/autosave', optionalProtect, autosaveTestProgress);
router.get('/:id/progress', optionalProtect, getTestProgress);
router.get('/submissions/:submissionId/status', getTestSeriesSubmissionStatus);
router.get('/submissions/:submissionId/solution', optionalProtect, getTestSeriesSubmissionSolution);

// Admin Solution Management & Overview
router.get(
  '/:id/solution-admin-overview',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  getTestSeriesSolutionAdminOverview
);
router.patch(
  '/:id/solution-config',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  updateTestSeriesSolutionConfig
);

// Post-payment test unlock
router.post(
  '/:id/unlock',
  unlockTestSeries
);

// Mathematical KaTeX formatting utility
router.post(
  '/ai-format-math',
  formatMathWithAi
);

router.post(
  '/',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ body: createTestSeriesSchema }),
  createTestSeries
);
router.put(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ params: idOrSlugParamSchema }),
  updateTestSeries
);
router.delete(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ params: idOrSlugParamSchema }),
  deleteTestSeries
);

export default router;

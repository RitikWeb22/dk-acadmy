import { Router } from 'express';
import { z } from 'zod';
import { getAllDppPyq, getDppPyqByIdOrSlug, createDppPyq, updateDppPyq, deleteDppPyq } from '../controllers/dppPyqController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';
const router = Router();
const createDppPyqSchema = z
    .object({
    title: z.string().trim().min(2, 'Title is required'),
    moduleType: z.enum(['DPP', 'PYQ', 'BITSAT']).optional(),
    type: z.string().optional(),
    subject: z.string().trim().optional(),
    chapter: z.string().optional(),
    examTarget: z.string().optional(),
    badgeCode: z.string().optional(),
    categoryLabel: z.string().optional(),
    questionsCount: z.number().optional(),
    solutionNote: z.string().optional(),
    status: z.enum(['Published', 'Draft', 'Scheduled', 'Archived']).optional(),
    scheduledDate: z.string().optional(),
    attemptsCount: z.number().optional(),
    slug: z.string().optional(),
    targetExam: z.string().optional(),
    year: z.union([z.number(), z.string()]).optional(),
    shift: z.string().optional(),
    pdfUrl: z.string().optional(),
    solutionPdfUrl: z.string().optional(),
    isFree: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    questions: z.array(z.any()).optional()
})
    .passthrough();
// Public routes for student catalog & practice view
router.get('/', getAllDppPyq);
router.get('/:id', getDppPyqByIdOrSlug);
// Admin & Faculty creation/management routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ body: createDppPyqSchema }), createDppPyq);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ params: idOrSlugParamSchema }), updateDppPyq);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), validate({ params: idOrSlugParamSchema }), deleteDppPyq);
export default router;

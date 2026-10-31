import { Router } from 'express';
import { z } from 'zod';
import { getAllDppPyq, getDppPyqByIdOrSlug, createDppPyq, updateDppPyq, deleteDppPyq } from '../controllers/dppPyqController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';
const router = Router();
const createDppPyqSchema = z
    .object({
    title: z.string().trim().min(2, 'Title is required'),
    type: z.enum(['DPP', 'PYQ']),
    subject: z.string().trim(),
    targetExam: z.string().optional(),
    year: z.union([z.number(), z.string()]).optional(),
    shift: z.string().optional(),
    pdfUrl: z.string().optional(),
    solutionPdfUrl: z.string().optional(),
    isFree: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    questions: z.array(z.any()).optional()
})
    .strict();
// Public routes for student catalog & practice view
router.get('/', getAllDppPyq);
router.get('/:id', getDppPyqByIdOrSlug);
// Admin & Faculty creation/management routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ body: createDppPyqSchema }), createDppPyq);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ params: idOrSlugParamSchema }), updateDppPyq);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), validate({ params: idOrSlugParamSchema }), deleteDppPyq);
export default router;

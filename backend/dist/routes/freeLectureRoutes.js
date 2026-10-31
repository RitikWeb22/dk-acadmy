import { Router } from 'express';
import { z } from 'zod';
import { getFreeLectures, getFreeLectureById, createFreeLecture, updateFreeLecture, deleteFreeLecture, enforce5FreeRule } from '../controllers/freeLectureController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
const router = Router();
const createFreeLectureSchema = z
    .object({
    title: z.string().trim().min(2, 'Title is required'),
    subject: z.string().trim().optional(),
    trackId: z.string().trim().optional(),
    trackTitle: z.string().trim().optional(),
    order: z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).optional(),
    duration: z.string().optional(),
    isFree: z.boolean().optional(),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    discountPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    videoUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    dppName: z.string().optional(),
    dppUrl: z.string().optional(),
    notesPdfUrl: z.string().optional(),
    facultyName: z.string().optional(),
    targetExam: z.string().optional(),
    targetClass: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    badge: z.string().optional(),
    status: z.string().optional()
})
    .strict();
router.get('/', getFreeLectures);
router.get('/:id', getFreeLectureById);
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ body: createFreeLectureSchema }), createFreeLecture);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), updateFreeLecture);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), deleteFreeLecture);
router.post('/enforce-5-free', protect, authorize('SUPER_ADMIN', 'ADMIN'), enforce5FreeRule);
export default router;

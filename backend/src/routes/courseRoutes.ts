import { Router } from 'express';
import { z } from 'zod';
import {
  getAllCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idParamSchema } from '../middlewares/validateMiddleware.js';

const router = Router();

const createCourseSchema = z
  .object({
    title: z.string().trim().min(2, 'Course title is required'),
    slug: z.string().trim().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    category: z.string().optional(),
    targetClass: z.string().optional(),
    targetYear: z.string().optional(),
    targetExam: z.string().optional(),
    instructor: z.string().optional(),
    targetAudience: z.string().optional(),
    learningOutcomes: z.array(z.string()).optional(),
    prerequisites: z.string().optional(),
    language: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number),
    originalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number).optional(),
    level: z.string().optional(),
    tier: z.string().optional(),
    deliveryMode: z.string().optional(),
    mode: z.string().optional(),
    courseType: z.string().optional(),
    tags: z.array(z.string()).optional(),
    badge: z.string().optional(),
    isPopular: z.boolean().optional(),
    isBestValue: z.boolean().optional(),
    startDate: z.string().optional(),
    duration: z.string().optional(),
    coverImage: z.string().optional(),
    bannerImage: z.string().optional(),
    syllabusPdfUrl: z.string().optional(),
    testSchedulePdfUrl: z.string().optional(),
    brochurePdfUrl: z.string().optional(),
    curriculumSections: z.array(z.any()).optional(),
    features: z.array(z.string()).optional(),
    demoVideoUrl: z.string().optional(),
    isPublished: z.boolean().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional()
  })
  .strict();

// Public routes
router.get('/', getAllCourses);
router.get('/:slug', getCourseBySlug);

// Admin & Faculty management
router.post(
  '/',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ body: createCourseSchema }),
  createCourse
);
router.put(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ params: idParamSchema }),
  updateCourse
);
router.delete(
  '/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'),
  validate({ params: idParamSchema }),
  deleteCourse
);

export default router;

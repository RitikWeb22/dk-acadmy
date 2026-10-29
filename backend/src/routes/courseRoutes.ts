import { Router } from 'express';
import {
  getAllCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', getAllCourses);
router.get('/:slug', getCourseBySlug);

// Admin & Faculty management
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), createCourse);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), updateCourse);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), deleteCourse);

export default router;

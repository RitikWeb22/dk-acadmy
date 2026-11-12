import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  googleAuth,
  adminLogin,
  getMe,
  updateProfile,
  enrollCourse,
  getStudentsList,
  getStaffList,
  createStudentByAdmin,
  createStaffByAdmin,
  updateStaffByAdmin,
  updateStaffPasswordByAdmin,
  deleteUserByAdmin
} from '../controllers/authController.js';
import { protect, authorize, directoryProtect } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for authentication endpoints (prevent brute-force attacks)
// Strictly 5 requests per minute per IP per Phase 4 requirement
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // max 5 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 1 minute before trying again.' }
});

// Zod Validation Schemas
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Valid email address required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().trim().optional(),
    targetExam: z.string().trim().optional(),
    targetClass: z.string().trim().optional(),
    targetYear: z.string().trim().optional()
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email('Valid email address required'),
    password: z.string().min(1, 'Password is required')
  })
  .strict();

const googleAuthSchema = z
  .object({
    token: z.string().optional(),
    credential: z.string().optional(),
    idToken: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    googleId: z.string().optional()
  })
  .strict();

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().optional(),
    avatarUrl: z.string().trim().optional(),
    targetExam: z.string().trim().optional(),
    targetClass: z.string().trim().optional(),
    targetYear: z.string().trim().optional(),
    preferredLanguage: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    parentName: z.string().trim().optional(),
    parentPhone: z.string().trim().optional(),
    schoolName: z.string().trim().optional(),
    board: z.string().trim().optional(),
    dob: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    department: z.string().trim().optional()
  })
  .strict();

const enrollCourseSchema = z
  .object({
    courseId: z.string().trim().min(1, 'courseId is required')
  })
  .strict();

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'New password must be at least 6 characters')
  })
  .strict();

// Public Auth Endpoints
router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/google', authLimiter, validate({ body: googleAuthSchema }), googleAuth);
router.post('/admin-login', authLimiter, validate({ body: loginSchema }), adminLogin);

// Protected Student / User Endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, validate({ body: updateProfileSchema }), updateProfile);
router.post('/enroll-course', protect, validate({ body: enrollCourseSchema }), enrollCourse);
router.post('/enroll', protect, validate({ body: enrollCourseSchema }), enrollCourse);

// Admin User Lists & Directory Management (supports valid JWT and admin session)
router.get('/students', directoryProtect, getStudentsList);
router.post('/students', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR'), createStudentByAdmin);
router.get('/staff', directoryProtect, getStaffList);
router.post('/staff', protect, authorize('SUPER_ADMIN', 'ADMIN'), createStaffByAdmin);
router.put(
  '/staff/:id',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  updateStaffByAdmin
);
router.put(
  '/staff/:id/password',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idOrSlugParamSchema, body: updatePasswordSchema }),
  updateStaffPasswordByAdmin
);
router.delete(
  '/staff/:id',
  protect,
  authorize('SUPER_ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  deleteUserByAdmin
);
router.delete(
  '/users/:id',
  protect,
  authorize('SUPER_ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  deleteUserByAdmin
);

export default router;

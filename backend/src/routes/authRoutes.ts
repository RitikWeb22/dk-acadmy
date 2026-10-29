import { Router } from 'express';
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
import { protect, authorize } from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for authentication endpoints (prevent brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 25, // max 25 attempts per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Public Auth Endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/admin-login', authLimiter, adminLogin);

// Protected Student / User Endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/enroll-course', protect, enrollCourse);
router.post('/enroll', protect, enrollCourse);

// Admin-only User Lists & Management
router.get('/students', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'LEAD_MANAGER'), getStudentsList);
router.post('/students', protect, authorize('SUPER_ADMIN', 'ADMIN'), createStudentByAdmin);
router.get('/staff', protect, authorize('SUPER_ADMIN', 'ADMIN'), getStaffList);
router.post('/staff', protect, authorize('SUPER_ADMIN', 'ADMIN'), createStaffByAdmin);
router.put('/staff/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), updateStaffByAdmin);
router.put('/staff/:id/password', protect, authorize('SUPER_ADMIN', 'ADMIN'), updateStaffPasswordByAdmin);
router.delete('/staff/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteUserByAdmin);
router.delete('/users/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteUserByAdmin);

export default router;

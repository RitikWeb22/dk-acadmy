import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  googleAuth,
  adminLogin,
  logout,
  getMe,
  updateProfile,
  enrollCourse,
  getStudentsList,
  getStaffList,
  createStudentByAdmin,
  updateStudentByAdmin,
  createStaffByAdmin,
  updateStaffByAdmin,
  updateStaffPasswordByAdmin,
  unlockStaffByAdmin,
  deleteUserByAdmin,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  checkRecoveryPhone,
  resetPasswordWithFirebase
} from '../controllers/authController.js';
import { protect, authorize, directoryProtect } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for authentication endpoints (prevent brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts from this network. Please wait 1 minute before trying again.' }
});

// Dedicated OTP limiter to prevent SMS/email bombardment
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many recovery requests from this IP. Please wait 15 minutes before requesting again.' }
});

// Zod Validation Schemas
const forgotPasswordSchema = z
  .object({
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    identifier: z.string().trim().optional()
  })
  .refine((data) => data.email || data.phone || data.identifier, {
    message: 'Please provide either registered email address or mobile number'
  });

const verifyOtpSchema = z.object({
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  identifier: z.string().trim().optional(),
  otp: z.string().trim().length(6, 'Recovery code must be exactly 6 digits')
});

const resetPasswordSchema = z
  .object({
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    otp: z.string().trim().length(6, 'Recovery code must be exactly 6 digits'),
    password: z.string().min(6, 'New password must be at least 6 characters').optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional()
  })
  .refine((data) => data.password || data.newPassword, {
    message: 'New password is required'
  });

const checkRecoveryPhoneSchema = z
  .object({
    phone: z.string().trim().optional(),
    identifier: z.string().trim().optional()
  })
  .refine((data) => data.phone || data.identifier, {
    message: 'Mobile number is required'
  });

const resetPasswordFirebaseSchema = z
  .object({
    phone: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    firebaseToken: z.string().trim().min(10, 'Firebase verification token is required'),
    password: z.string().min(6, 'New password must be at least 6 characters').optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional()
  })
  .refine((data) => (data.phone || data.identifier) && (data.password || data.newPassword), {
    message: 'Mobile number and new password are required'
  });

// Zod Validation Schemas
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Valid email address required').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().trim().optional().or(z.literal('')),
    targetExam: z.string().trim().optional(),
    targetClass: z.string().trim().optional(),
    targetYear: z.string().trim().optional()
  })
  .refine((data) => (data.phone && data.phone.trim().length >= 10) || (data.email && data.email.trim().length > 0), {
    message: 'Please provide either a valid 10-digit mobile number or email address'
  });

const loginSchema = z
  .object({
    email: z.string().trim().optional().or(z.literal('')),
    phone: z.string().trim().optional().or(z.literal('')),
    identifier: z.string().trim().optional().or(z.literal('')),
    password: z.string().min(1, 'Password is required')
  })
  .refine((data) => (data.identifier && data.identifier.trim().length > 0) || (data.phone && data.phone.trim().length > 0) || (data.email && data.email.trim().length > 0), {
    message: 'Please provide phone number or email address'
  });

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
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
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
    department: z.string().trim().optional(),
    password: z.string().min(6).optional()
  })
  .passthrough();

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
router.post('/logout', logout);

// Password Recovery & OTP Endpoints
router.post('/forgot-password', otpLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/verify-reset-otp', otpLimiter, validate({ body: verifyOtpSchema }), verifyResetOtp);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), resetPassword);
router.post('/check-recovery-phone', otpLimiter, validate({ body: checkRecoveryPhoneSchema }), checkRecoveryPhone);
router.post('/reset-password-firebase', authLimiter, validate({ body: resetPasswordFirebaseSchema }), resetPasswordWithFirebase);

// Protected Student / User Endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, validate({ body: updateProfileSchema }), updateProfile);
router.post('/enroll-course', protect, validate({ body: enrollCourseSchema }), enrollCourse);
router.post('/enroll', protect, validate({ body: enrollCourseSchema }), enrollCourse);

// Admin User Lists & Directory Management (supports valid JWT and admin session)
router.get('/students', directoryProtect, getStudentsList);
router.post('/students', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR'), createStudentByAdmin);
router.put('/students/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR'), updateStudentByAdmin);
router.patch('/students/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR'), updateStudentByAdmin);
router.delete('/students/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteUserByAdmin);
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
router.put(
  '/staff/:id/unlock',
  protect,
  authorize('SUPER_ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  unlockStaffByAdmin
);
router.post(
  '/staff/:id/unlock',
  protect,
  authorize('SUPER_ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  unlockStaffByAdmin
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

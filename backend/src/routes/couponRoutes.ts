import { Router } from 'express';
import { z } from 'zod';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateAndApplyCoupon
} from '../controllers/couponController.js';
import { protect, authorize, directoryProtect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';

const router = Router();

const createCouponSchema = z
  .object({
    code: z.string().trim().min(2).max(30),
    discountType: z.enum(['percent', 'flat']).optional(),
    discountValue: z.number().positive(),
    label: z.string().trim().optional(),
    description: z.string().trim().optional(),
    usageLimit: z.number().int().min(1).optional(),
    minCoursePrice: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
    applicableCourses: z.array(z.string()).optional(),
    expiryDate: z.string().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

const validateCouponSchema = z
  .object({
    code: z.string().trim().min(1),
    coursePrice: z.number().min(0).optional(),
    apply: z.boolean().optional()
  })
  .strict();

router.get('/', getAllCoupons);
router.post('/', directoryProtect, validate({ body: createCouponSchema }), createCoupon);
router.post('/validate', validate({ body: validateCouponSchema }), validateAndApplyCoupon);
router.put('/:id', directoryProtect, updateCoupon);
router.delete('/:id', directoryProtect, deleteCoupon);

export default router;


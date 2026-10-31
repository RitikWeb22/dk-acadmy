import { Router } from 'express';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateAndApplyCoupon
} from '../controllers/couponController.js';

const router = Router();

router.get('/', getAllCoupons);
router.post('/', createCoupon);
router.post('/validate', validateAndApplyCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;


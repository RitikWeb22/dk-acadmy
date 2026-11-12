import { Router } from 'express';
import { z } from 'zod';
import {
  createOrder,
  verifyPayment,
  getOrdersList,
  getMyOrders,
  createAdminInvoice,
  updateOrderStatus,
  deleteOrder,
  purgeDemoOrders
} from '../controllers/paymentController.js';
import { protect, directoryProtect, optionalProtect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';

const router = Router();

const createOrderSchema = z
  .object({
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform((v) => Number(v)),
    courseId: z.string().trim().optional(),
    courseTitle: z.string().trim().optional(),
    couponCode: z.string().trim().optional(),
    studentName: z.string().trim().optional(),
    studentEmail: z.string().trim().email().optional(),
    studentPhone: z.string().trim().optional()
  })
  .strict();

const verifyPaymentSchema = z
  .object({
    razorpay_order_id: z.string().trim().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().trim().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().trim().min(1, 'Signature is required'),
    courseId: z.string().trim().optional()
  })
  .strict();

const updateOrderStatusSchema = z
  .object({
    status: z.enum(['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED']).optional(),
    refundAmount: z.number().min(0).optional()
  })
  .strict();

const adminInvoiceSchema = z
  .object({
    studentName: z.string().trim().min(1, 'Student name is required'),
    studentEmail: z.string().trim().email().optional(),
    studentPhone: z.string().trim().optional(),
    rollNo: z.string().trim().optional(),
    courseTitle: z.string().trim().optional(),
    courseId: z.string().trim().optional(),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform((v) => Number(v)),
    centerType: z.string().trim().optional(),
    paymentChannel: z.string().trim().optional(),
    paymentRef: z.string().trim().optional(),
    paymentStatus: z.string().trim().optional(),
    installmentNote: z.string().trim().optional()
  })
  .strict();

// Order creation and payment verification
router.post('/create-order', optionalProtect, validate({ body: createOrderSchema }), createOrder);
router.post('/verify', optionalProtect, validate({ body: verifyPaymentSchema }), verifyPayment);

// Student personal orders and fee receipts
router.get('/my-orders', protect, getMyOrders);

// Admin orders list, manual invoice creation, and management (strictly RBAC protected)
router.get('/orders', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR'), getOrdersList);
router.post(
  '/admin-invoice',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ body: adminInvoiceSchema }),
  createAdminInvoice
);
router.patch(
  '/orders/:id/status',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: idOrSlugParamSchema, body: updateOrderStatusSchema }),
  updateOrderStatus
);
router.delete(
  '/orders/:id',
  protect,
  authorize('SUPER_ADMIN'),
  validate({ params: idOrSlugParamSchema }),
  deleteOrder
);
router.post('/orders-purge-demo', protect, authorize('SUPER_ADMIN'), purgeDemoOrders);

export default router;

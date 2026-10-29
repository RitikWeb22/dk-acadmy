import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getOrdersList,
  getMyOrders,
  createAdminInvoice,
  updateOrderStatus,
  deleteOrder
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Order creation and payment verification
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

// Student personal orders and fee receipts
router.get('/my-orders', protect, getMyOrders);

// Admin-only orders list, manual invoice creation, and management
router.get('/orders', protect, authorize('SUPER_ADMIN', 'ADMIN'), getOrdersList);
router.post('/admin-invoice', protect, authorize('SUPER_ADMIN', 'ADMIN'), createAdminInvoice);
router.patch('/orders/:id/status', protect, authorize('SUPER_ADMIN', 'ADMIN'), updateOrderStatus);
router.delete('/orders/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteOrder);

export default router;

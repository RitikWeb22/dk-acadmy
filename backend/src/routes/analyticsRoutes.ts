import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Dashboard analytics overview
router.get('/', protect, authorize('SUPER_ADMIN', 'ADMIN'), getDashboardAnalytics);

export default router;

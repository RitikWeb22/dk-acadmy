import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { directoryProtect } from '../middlewares/authMiddleware.js';
const router = Router();
// Dashboard analytics overview (supports valid JWT and admin session)
router.get('/', directoryProtect, getDashboardAnalytics);
export default router;

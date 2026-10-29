import { Router } from 'express';
import { submitLead, getAllLeads, getLeadById, updateLead, deleteLead } from '../controllers/leadController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for public lead inquiries (prevent spamming)
const leadSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // max 20 submissions per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many inquiries submitted from this connection. Please try again later.' }
});

// Public submission or Admin lead creation
router.post('/', leadSubmissionLimiter, submitLead);

// Admin & Counselor Lead Desk (Protected)
router.get('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER'), getAllLeads);
router.get('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER'), getLeadById);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER'), updateLead);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteLead);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { submitLead, getAllLeads, getLeadById, updateLead, deleteLead } from '../controllers/leadController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idParamSchema } from '../middlewares/validateMiddleware.js';
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
const submitLeadSchema = z
    .object({
    fullName: z.string().trim().optional(),
    name: z.string().trim().optional(),
    mobile: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional().or(z.literal('')),
    subject: z.string().trim().optional(),
    category: z.string().trim().optional(),
    message: z.string().trim().optional(),
    queryNotes: z.string().trim().optional(),
    relatedCourse: z.string().trim().optional(),
    currentClass: z.string().trim().optional(),
    targetBatch: z.string().trim().optional(),
    targetExam: z.string().trim().optional(),
    preferredTime: z.string().trim().optional(),
    city: z.string().trim().optional(),
    source: z.string().trim().optional(),
    priority: z.string().trim().optional(),
    assignedCounselor: z.string().trim().optional(),
    followUpDate: z.string().optional()
})
    .strict();
// Public submission or Admin lead creation
router.post('/', leadSubmissionLimiter, validate({ body: submitLeadSchema }), submitLead);
// Admin & Counselor Lead Desk (Protected)
router.get('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER'), getAllLeads);
router.get('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER'), validate({ params: idParamSchema }), getLeadById);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'LEAD_MANAGER'), validate({ params: idParamSchema }), updateLead);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN'), validate({ params: idParamSchema }), deleteLead);
export default router;

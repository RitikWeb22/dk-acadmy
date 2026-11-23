import { Router } from 'express';
import { z } from 'zod';
import { getAllDppPyq, getDppPyqByIdOrSlug, createDppPyq, updateDppPyq, deleteDppPyq, importPdfQuestions, bulkUploadDppPyqDocuments, getPdfImportHistory, getPdfImportById, updateExtractedQuestionInStaging, getQuestionBank, createOrUpdateQuestionBankItem, batchAddToQuestionBank, deleteQuestionBankItem } from '../controllers/dppPyqController.js';
import { formatMathWithAi } from '../controllers/aiFormatController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { validate, idOrSlugParamSchema } from '../middlewares/validateMiddleware.js';
import { uploadPdfMiddleware } from '../middlewares/uploadMiddleware.js';
const router = Router();
const createDppPyqSchema = z
    .object({
    title: z.string().trim().min(2, 'Title is required'),
    moduleType: z.enum(['DPP', 'PYQ', 'BITSAT']).optional(),
    type: z.string().optional(),
    subject: z.string().trim().optional(),
    chapter: z.string().optional(),
    examTarget: z.string().optional(),
    badgeCode: z.string().optional(),
    categoryLabel: z.string().optional(),
    questionsCount: z.union([z.number(), z.string().transform((v) => Number(v.replace(/\D/g, '')))]).transform(Number).optional(),
    solutionNote: z.string().optional(),
    status: z.enum(['Published', 'Draft', 'Scheduled', 'Archived']).optional(),
    scheduledDate: z.string().optional(),
    attemptsCount: z.union([z.number(), z.string().transform((v) => Number(v.replace(/\D/g, '')))]).transform(Number).optional(),
    slug: z.string().optional(),
    targetExam: z.string().optional(),
    year: z.union([z.number(), z.string()]).optional(),
    shift: z.string().optional(),
    pdfUrl: z.string().optional(),
    solutionPdfUrl: z.string().optional(),
    isFree: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    questions: z.array(z.any()).optional()
})
    .passthrough();
// 1. PDF Studio Import & Extraction Routes
router.post('/ai-format-math', formatMathWithAi);
router.post('/import-pdf', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), uploadPdfMiddleware.single('file'), importPdfQuestions);
router.post('/bulk-upload', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), uploadPdfMiddleware.array('files', 15), bulkUploadDppPyqDocuments);
router.get('/pdf-history', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), getPdfImportHistory);
router.get('/pdf-history/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), getPdfImportById);
router.patch('/pdf-history/:importId/questions/:tempId', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), updateExtractedQuestionInStaging);
// 2. Question Bank Routes
router.get('/question-bank', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), getQuestionBank);
router.post('/question-bank', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), createOrUpdateQuestionBankItem);
router.post('/question-bank/batch', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), batchAddToQuestionBank);
router.delete('/question-bank/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), deleteQuestionBankItem);
// 3. Public catalog & practice view
router.get('/', getAllDppPyq);
router.get('/:id', getDppPyqByIdOrSlug);
// 4. Admin & Faculty creation/management routes
router.post('/', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ body: createDppPyqSchema }), createDppPyq);
router.put('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), validate({ params: idOrSlugParamSchema }), updateDppPyq);
router.delete('/:id', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER'), validate({ params: idOrSlugParamSchema }), deleteDppPyq);
export default router;

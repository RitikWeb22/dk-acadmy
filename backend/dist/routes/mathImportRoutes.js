import { Router } from 'express';
import multer from 'multer';
import { normalizeCanonicalMath, validateQuestion, validateTextField, importQuestionsFromDocxBuffer, parseQuestionsFromMarkdown, performMathpixOcr, repairMathWithGemini } from '../services/mathImport/index.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
const router = Router();
const upload = multer({
    limits: { fileSize: 30 * 1024 * 1024 } // 30 MB
});
/**
 * 1. Bulk DOCX Question Import (Step 2)
 */
router.post('/bulk-docx', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            res.status(400).json({ error: 'Please upload a valid .docx document.' });
            return;
        }
        const { defaultSubject = 'Mathematics', defaultTopic = 'General', defaultTargetExam = 'JEE Main', positiveMarks = '4', negativeMarks = '1' } = req.body;
        const result = await importQuestionsFromDocxBuffer(req.file.buffer, {
            defaultSubject: String(defaultSubject),
            defaultTopic: String(defaultTopic),
            defaultTargetExam: String(defaultTargetExam),
            positiveMarks: parseInt(String(positiveMarks), 10) || 4,
            negativeMarks: parseInt(String(negativeMarks), 10) || 1
        });
        res.status(200).json({
            success: true,
            count: result.questions.length,
            usedPandoc: result.usedPandoc,
            dashboard: result.dashboard,
            questions: result.questions,
            warnings: result.warnings
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to process DOCX file', details: err.message });
    }
});
/**
 * 2. Markdown / Text Bulk Question Import
 */
router.post('/bulk-markdown', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), async (req, res) => {
    try {
        const { text = '', defaultSubject = 'Mathematics', defaultTopic = 'General', defaultTargetExam = 'JEE Main', positiveMarks = 4, negativeMarks = 1 } = req.body;
        if (!text.trim()) {
            res.status(400).json({ error: 'Text content is required' });
            return;
        }
        const result = parseQuestionsFromMarkdown(text, {
            defaultSubject,
            defaultTopic,
            defaultTargetExam,
            positiveMarks,
            negativeMarks
        });
        res.status(200).json({
            success: true,
            count: result.questions.length,
            dashboard: result.dashboard,
            questions: result.questions
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to parse markdown questions', details: err.message });
    }
});
/**
 * 3. Mathpix OCR Fallback for Equation Images (Step 3)
 */
router.post('/ocr', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), upload.single('image'), async (req, res) => {
    try {
        let imagePayload = '';
        let mimeType = 'image/png';
        if (req.file && req.file.buffer) {
            imagePayload = req.file.buffer;
            mimeType = req.file.mimetype || 'image/png';
        }
        else if (req.body.imageBase64) {
            imagePayload = req.body.imageBase64;
        }
        else {
            res.status(400).json({ error: 'No image provided. Upload an image file or provide imageBase64.' });
            return;
        }
        const ocrResult = await performMathpixOcr(imagePayload, mimeType);
        res.status(200).json(ocrResult);
    }
    catch (err) {
        res.status(500).json({ error: 'OCR processing failed', details: err.message });
    }
});
/**
 * 4. Gemini AI LaTeX Formatting Repair (Step 5)
 */
router.post('/ai-repair', protect, authorize('SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'TEACHER'), async (req, res) => {
    try {
        const { statement = '', options = [], stepSolution, dkSirShortcut, targetExam, model } = req.body;
        if (!statement && (!options || options.length === 0)) {
            res.status(400).json({ error: 'Question statement or options are required.' });
            return;
        }
        const repairResult = await repairMathWithGemini({
            statement,
            options,
            stepSolution,
            dkSirShortcut,
            targetExam
        }, { model });
        res.status(200).json(repairResult);
    }
    catch (err) {
        res.status(500).json({ error: 'AI repair failed', details: err.message });
    }
});
/**
 * 5. KaTeX Mathematical Content Validator (Step 6)
 */
router.post('/validate', async (req, res) => {
    try {
        const { statement = '', options = [], isOcrOrAi = false } = req.body;
        const validation = validateQuestion(statement, options, Boolean(isOcrOrAi));
        res.status(200).json({
            success: true,
            validation,
            canPublish: validation.canPublish
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Validation failed', details: err.message });
    }
});
/**
 * 6. Mathematical Normalizer (Step 4 & Storage Rule)
 */
router.post('/normalize', async (req, res) => {
    try {
        const { text = '' } = req.body;
        const normalized = normalizeCanonicalMath(text);
        const validation = validateTextField(normalized);
        res.status(200).json({
            success: true,
            normalized,
            validation
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Normalization failed', details: err.message });
    }
});
export default router;

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { DppPyq } from '../models/DppPyq.js';
import { QuestionBank } from '../models/QuestionBank.js';
import { PdfImportHistory } from '../models/PdfImportHistory.js';
import { extractQuestionsFromPdfBuffer, extractQuestionsFromDocxBuffer, parseQuestionsFromText } from '../utils/pdfQuestionExtractor.js';
import { broadcastDppPyqCreated, broadcastDppPyqUpdated, broadcastDppPyqDeleted } from '../sockets/socket.js';
import { escapeRegex, getPagination } from '../utils/sanitize.js';
const SEED_QUESTIONS = [];
const SEED_DPP_PYQ_ITEMS = [
    {
        id: 'dpp-pyq-1',
        badgeCode: 'DPP • CHM',
        title: 'DPP-02: Organic Reaction Pathways & Inversion',
        slug: 'dpp-02-organic-reaction-pathways',
        moduleType: 'DPP',
        subject: 'Chemistry',
        categoryLabel: 'Chemistry DPP',
        questionsCount: 4,
        solutionNote: '4 with video solution',
        status: 'Published',
        attemptsCount: 1420,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-2',
        badgeCode: 'DPP • PHY',
        title: 'DPP-01: Rotational Dynamics & Rolling Constraints',
        slug: 'dpp-01-rotational-dynamics',
        moduleType: 'DPP',
        subject: 'Physics',
        categoryLabel: 'Physics DPP',
        questionsCount: 5,
        solutionNote: '5 with step PDF',
        status: 'Published',
        attemptsCount: 1890,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-3',
        badgeCode: 'PYQ • MTH',
        title: 'JEE Main 2018–2025: Definite Integration Archive',
        slug: 'pyq-maths-definite-integration',
        moduleType: 'PYQ',
        subject: 'Mathematics',
        categoryLabel: 'Maths PYQ',
        questionsCount: 25,
        solutionNote: '25 with DK Sir 20s tricks',
        status: 'Published',
        attemptsCount: 2450,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-4',
        badgeCode: 'BITSAT',
        title: 'BITSAT 2026 Speed Drill 03: Calculus & Vectors',
        slug: 'bitsat-2026-speed-drill-03',
        moduleType: 'BITSAT',
        subject: 'Mathematics',
        categoryLabel: 'BITSAT Speed Drill',
        questionsCount: 30,
        solutionNote: 'Strict 45s timer logic',
        status: 'Published',
        attemptsCount: 1640,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-5',
        badgeCode: 'DPP • MTH',
        title: 'DPP-04: Complex Numbers & Geometry of Circles',
        slug: 'dpp-04-complex-numbers',
        moduleType: 'DPP',
        subject: 'Mathematics',
        categoryLabel: 'Maths DPP',
        questionsCount: 6,
        solutionNote: 'Drafting answer keys',
        status: 'Draft',
        attemptsCount: 0,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-6',
        badgeCode: 'BITSAT',
        title: 'BITSAT Full Syllabus Speed Drill 04',
        slug: 'bitsat-speed-drill-04',
        moduleType: 'BITSAT',
        subject: 'Mixed',
        categoryLabel: 'BITSAT Speed Drill',
        questionsCount: 30,
        solutionNote: 'Ready for auto-release',
        status: 'Scheduled',
        scheduledDate: '30 Oct 2026 • 09:00 AM',
        attemptsCount: 0,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-7',
        badgeCode: 'PYQ • PHY',
        title: 'JEE Advanced 10-Year Mechanics Archive',
        slug: 'pyq-physics-jee-advanced-mechanics',
        moduleType: 'PYQ',
        subject: 'Physics',
        categoryLabel: 'Physics PYQ',
        questionsCount: 35,
        solutionNote: '35 published',
        status: 'Published',
        attemptsCount: 1540,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-8',
        badgeCode: 'DPP • CHM',
        title: 'DPP-03: Coordination Compounds & Isomerism',
        slug: 'dpp-03-coordination-compounds',
        moduleType: 'DPP',
        subject: 'Chemistry',
        categoryLabel: 'Chemistry DPP',
        questionsCount: 8,
        solutionNote: 'Pending diagrams',
        status: 'Draft',
        attemptsCount: 0,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-9',
        badgeCode: 'PYQ • CHM',
        title: 'JEE Main 2019–2025: Chemical Thermodynamics Archives',
        slug: 'pyq-chem-thermodynamics',
        moduleType: 'PYQ',
        subject: 'Chemistry',
        categoryLabel: 'Chemistry PYQ',
        questionsCount: 22,
        solutionNote: '22 with enthalpy shortcuts',
        status: 'Published',
        attemptsCount: 1120,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-10',
        badgeCode: 'DPP • PHY',
        title: 'DPP-03: Electrostatics, Gauss Law & Dipole Potentials',
        slug: 'dpp-03-electrostatics',
        moduleType: 'DPP',
        subject: 'Physics',
        categoryLabel: 'Physics DPP',
        questionsCount: 10,
        solutionNote: '10 with detailed video solutions',
        status: 'Published',
        attemptsCount: 1320,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-11',
        badgeCode: 'BITSAT',
        title: 'BITSAT 2026 Physics Rapid Fire: Optics & Modern Physics',
        slug: 'bitsat-rapid-fire-optics',
        moduleType: 'BITSAT',
        subject: 'Physics',
        categoryLabel: 'BITSAT Speed Drill',
        questionsCount: 25,
        solutionNote: 'Speed timing test format',
        status: 'Scheduled',
        scheduledDate: '05 Nov 2026 • 10:00 AM',
        attemptsCount: 0,
        questions: SEED_QUESTIONS
    },
    {
        id: 'dpp-pyq-12',
        badgeCode: 'DPP • MTH',
        title: 'DPP-05: Probability, Bayes Theorem & Binomial Distributions',
        slug: 'dpp-05-probability',
        moduleType: 'DPP',
        subject: 'Mathematics',
        categoryLabel: 'Maths DPP',
        questionsCount: 12,
        solutionNote: 'Under faculty editorial review',
        status: 'Draft',
        attemptsCount: 0,
        questions: SEED_QUESTIONS
    }
];
// High-speed in-memory cache for DPP & PYQ sets (TTL: 30 seconds)
let cachedDppPyqList = null;
let lastDppPyqCacheTime = 0;
const DPP_CACHE_TTL = 30000;
export const invalidateDppPyqCache = () => {
    cachedDppPyqList = null;
    lastDppPyqCacheTime = 0;
};
export const getAllDppPyq = async (req, res) => {
    try {
        const { moduleType, subject, status, search, force, page, limit } = req.query;
        const isForce = force === 'true' || force === '1';
        const filter = {};
        if (moduleType && moduleType !== 'ALL') {
            filter.moduleType = { $regex: new RegExp(`^${escapeRegex(String(moduleType).trim())}$`, 'i') };
        }
        if (subject && subject !== 'ALL') {
            filter.subject = { $regex: new RegExp(`^${escapeRegex(String(subject).trim())}$`, 'i') };
        }
        if (status && status !== 'ALL') {
            filter.status = status;
        }
        if (search && typeof search === 'string' && search.trim()) {
            const safeSearch = escapeRegex(search.trim());
            filter.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { slug: { $regex: safeSearch, $options: 'i' } },
                { categoryLabel: { $regex: safeSearch, $options: 'i' } },
                { badgeCode: { $regex: safeSearch, $options: 'i' } },
                { chapter: { $regex: safeSearch, $options: 'i' } }
            ];
        }
        const hasFilters = Object.keys(filter).length > 0;
        // Fast memory cache path
        if (!hasFilters && !isForce && !page && !limit && cachedDppPyqList && (Date.now() - lastDppPyqCacheTime < DPP_CACHE_TTL)) {
            res.status(200).json(cachedDppPyqList);
            return;
        }
        if (page || limit) {
            const pagination = getPagination(page, limit, 20, 100);
            const [items, total] = await Promise.all([
                DppPyq.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(pagination.skip)
                    .limit(pagination.limit)
                    .select('-questions') // Exclude heavy questions array in listing for fast throughput
                    .lean()
                    .maxTimeMS(4000),
                DppPyq.countDocuments(filter)
            ]);
            res.status(200).json({
                success: true,
                count: items.length,
                total,
                page: pagination.page,
                totalPages: Math.ceil(total / pagination.limit),
                hasMore: pagination.page * pagination.limit < total,
                data: items
            });
            return;
        }
        const items = await DppPyq.find(filter).sort({ createdAt: -1 }).lean().maxTimeMS(4000);
        const sanitizedItems = items.map((item) => {
            const doc = { ...item };
            if (Array.isArray(doc.questions) &&
                doc.questions.length === 4 &&
                doc.questions.every((q) => q.id && (String(q.id).startsWith('q-sample-') || String(q.id).startsWith('q-math-')))) {
                doc.questions = [];
                doc.questionsCount = 0;
            }
            return doc;
        });
        if (!hasFilters && !page && !limit) {
            cachedDppPyqList = sanitizedItems;
            lastDppPyqCacheTime = Date.now();
        }
        res.status(200).json(sanitizedItems);
    }
    catch (error) {
        console.error('Error fetching DPP/PYQ items:', error);
        res.status(500).json({ error: 'Failed to fetch DPP/PYQ items', details: error.message });
    }
};
export const getDppPyqByIdOrSlug = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = String(id);
        const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
        const filter = isObjectId
            ? { $or: [{ _id: new mongoose.Types.ObjectId(idStr) }, { id: idStr }, { slug: idStr }] }
            : { $or: [{ id: idStr }, { slug: idStr }] };
        const item = await DppPyq.findOne(filter);
        if (!item) {
            res.status(404).json({ error: 'DPP/PYQ item not found' });
            return;
        }
        const doc = item.toObject ? item.toObject() : item;
        if (Array.isArray(doc.questions) &&
            doc.questions.length === 4 &&
            doc.questions.every((q) => q.id && (String(q.id).startsWith('q-sample-') || String(q.id).startsWith('q-math-')))) {
            doc.questions = [];
            doc.questionsCount = 0;
        }
        res.status(200).json(doc);
    }
    catch (error) {
        console.error('Error fetching DPP/PYQ item:', error);
        res.status(500).json({ error: 'Failed to fetch DPP/PYQ item', details: error.message });
    }
};
export const createDppPyq = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.title || !payload.title.trim()) {
            res.status(400).json({ error: 'Problem set title is required' });
            return;
        }
        const rawType = (payload.moduleType || payload.type || 'DPP').toString().toUpperCase();
        const validModuleType = ['DPP', 'PYQ', 'BITSAT'].includes(rawType) ? rawType : 'DPP';
        let subject = payload.subject || 'Mathematics';
        if (typeof subject === 'string') {
            const lower = subject.toLowerCase();
            if (lower.includes('math'))
                subject = 'Mathematics';
            else if (lower.includes('phys'))
                subject = 'Physics';
            else if (lower.includes('chem'))
                subject = 'Chemistry';
            else if (!['Mathematics', 'Physics', 'Chemistry', 'Mixed'].includes(subject))
                subject = 'Mathematics';
        }
        else {
            subject = 'Mathematics';
        }
        const baseSlug = payload.slug
            ? payload.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            : payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const existingSlug = await DppPyq.findOne({ slug: baseSlug });
        const finalSlug = existingSlug
            ? `${baseSlug}-${Date.now().toString().slice(-4)}`
            : (baseSlug || `drill-${Date.now()}`);
        const isPaperPaid = payload.isFree === false || payload.accessMode === 'paid';
        const sanitizedQuestions = Array.isArray(payload.questions) && payload.questions.length > 0
            ? payload.questions.map((q, idx) => {
                const isNumerical = q.questionType === 'NUMERICAL' ||
                    q.questionType === 'INTEGER' ||
                    ((!Array.isArray(q.options) || q.options.length === 0) && Boolean(q.numericalAnswer));
                return {
                    id: q.id || `q-${Date.now()}-${idx + 1}`,
                    qNum: q.qNum || idx + 1,
                    statement: q.statement || `Question ${idx + 1}`,
                    topic: q.topic || payload.chapter || 'Practice Question',
                    questionType: isNumerical ? 'NUMERICAL' : (q.questionType || 'SINGLE_CORRECT'),
                    options: isNumerical
                        ? []
                        : Array.isArray(q.options) && q.options.length > 0
                            ? q.options.map((opt, optIdx) => ({
                                key: ['A', 'B', 'C', 'D'][optIdx] || opt.key || 'A',
                                text: opt.text || `Option ${optIdx + 1}`
                            }))
                            : [
                                { key: 'A', text: 'Option A' },
                                { key: 'B', text: 'Option B' },
                                { key: 'C', text: 'Option C' },
                                { key: 'D', text: 'Option D' }
                            ],
                    correctKey: ['A', 'B', 'C', 'D'].includes(q.correctKey) ? q.correctKey : 'A',
                    numericalAnswer: isNumerical ? String(q.numericalAnswer ?? '') : '',
                    dkSirShortcut: q.dkSirShortcut || '',
                    stepSolution: q.stepSolution || '',
                    difficulty: ['Easy', 'Moderate', 'Challenging'].includes(q.difficulty)
                        ? q.difficulty
                        : 'Moderate',
                    examYear: q.examYear || '',
                    // If paper is paid, question is locked (isFree = false) unless explicitly set as free preview
                    isFree: isPaperPaid ? Boolean(q.isFree === true) : (q.isFree !== false),
                    videoUrl: q.videoUrl || '',
                    pdfUrl: q.pdfUrl || ''
                };
            })
            : SEED_QUESTIONS;
        const newItem = new DppPyq({
            ...payload,
            id: payload.id || `dpp-pyq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: payload.title.trim(),
            slug: finalSlug,
            moduleType: validModuleType,
            subject,
            badgeCode: payload.badgeCode ||
                (validModuleType === 'BITSAT'
                    ? 'BITSAT'
                    : `${validModuleType} • ${subject.slice(0, 3).toUpperCase()}`),
            categoryLabel: payload.categoryLabel ||
                (validModuleType === 'BITSAT' ? 'BITSAT Speed Drill' : `${subject} ${validModuleType}`),
            questionsCount: sanitizedQuestions.length,
            solutionNote: payload.solutionNote || `${sanitizedQuestions.length} with step solutions`,
            attemptsCount: payload.attemptsCount || 0,
            status: payload.status || 'Published',
            questions: sanitizedQuestions
        });
        const saved = await newItem.save();
        invalidateDppPyqCache();
        broadcastDppPyqCreated(saved);
        res.status(201).json(saved);
    }
    catch (error) {
        console.error('Error creating DPP/PYQ item:', error);
        res.status(500).json({ error: 'Failed to create DPP/PYQ item', details: error.message });
    }
};
export const updateDppPyq = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        // Strip immutable/reserved properties to prevent MongoServerError
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        if (updates.questions && Array.isArray(updates.questions)) {
            updates.questionsCount = updates.questions.length;
        }
        const idStr = String(id);
        const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
        const filter = isObjectId
            ? { $or: [{ _id: new mongoose.Types.ObjectId(idStr) }, { id: idStr }, { slug: idStr }] }
            : { $or: [{ id: idStr }, { slug: idStr }] };
        const updated = await DppPyq.findOneAndUpdate(filter, { $set: updates }, { new: true, runValidators: false });
        if (!updated) {
            res.status(404).json({ error: 'DPP/PYQ item not found' });
            return;
        }
        invalidateDppPyqCache();
        broadcastDppPyqUpdated(updated);
        res.status(200).json(updated);
    }
    catch (error) {
        console.error('Error updating DPP/PYQ item:', error);
        res.status(500).json({ error: 'Failed to update DPP/PYQ item', details: error.message });
    }
};
export const deleteDppPyq = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = String(id);
        const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
        const filter = isObjectId
            ? { $or: [{ _id: new mongoose.Types.ObjectId(idStr) }, { id: idStr }, { slug: idStr }] }
            : { $or: [{ id: idStr }, { slug: idStr }] };
        const deleted = await DppPyq.findOneAndDelete(filter);
        if (!deleted) {
            res.status(404).json({ error: 'DPP/PYQ item not found' });
            return;
        }
        invalidateDppPyqCache();
        broadcastDppPyqDeleted(deleted.id || String(id));
        res.status(200).json({ success: true, message: 'DPP/PYQ set deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting DPP/PYQ item:', error);
        res.status(500).json({ error: 'Failed to delete DPP/PYQ item', details: error.message });
    }
};
/* =========================================================================
   PYQ STUDIO: PDF IMPORT WORKFLOW & STAGING REVIEW
   ========================================================================= */
export const importPdfQuestions = async (req, res) => {
    try {
        const file = req.file;
        const { subject = 'Mathematics', exam = 'JEE Main', year = 2026, paperTitle = '' } = req.body;
        if (!file) {
            res.status(400).json({ error: 'No document file (PDF or Word) was uploaded' });
            return;
        }
        let summary;
        const originalName = (file.originalname || '').toLowerCase();
        if (originalName.endsWith('.docx') || originalName.endsWith('.doc')) {
            summary = await extractQuestionsFromDocxBuffer(file.buffer, String(subject), String(exam));
        }
        else {
            summary = await extractQuestionsFromPdfBuffer(file.buffer, String(subject), String(exam));
        }
        const importId = `pdf-imp-${Date.now()}-${uuidv4().slice(0, 6)}`;
        const status = summary.needsReviewCount > 0 ? 'REVIEW_REQUIRED' : 'COMPLETED';
        let savedHistory = null;
        try {
            const historyRecord = new PdfImportHistory({
                id: importId,
                fileName: file.originalname || 'uploaded-paper.pdf',
                fileSize: file.size || 0,
                status,
                totalDetected: summary.totalDetected,
                successfulCount: summary.successfulCount,
                needsReviewCount: summary.needsReviewCount,
                errorCount: summary.errorCount,
                targetExam: exam,
                subject,
                year,
                paperId: paperTitle ? `pending-${importId}` : '',
                extractedQuestions: summary.questions,
                errorLog: summary.errorLog
            });
            savedHistory = await historyRecord.save();
        }
        catch (saveErr) {
            console.warn('Notice: Could not persist PdfImportHistory record:', saveErr.message);
        }
        res.status(200).json({
            success: true,
            importId,
            summary,
            record: savedHistory
        });
    }
    catch (err) {
        console.error('Error importing PDF questions:', err);
        res.status(500).json({ error: 'Failed to process PDF', details: err.message });
    }
};
/**
 * Bulk Upload Orchestrator for Multi-Document Ingestion (Phase 5 & Phase 7)
 * Accepts multiple files (DOCX, PDF, TXT, JSON), classifies each file,
 * dispatches to independent pipelines, preserves partial progress, and deduplicates.
 */
export const bulkUploadDppPyqDocuments = async (req, res) => {
    try {
        const rawFiles = req.files;
        const singleFile = req.file;
        const files = [];
        if (rawFiles && Array.isArray(rawFiles) && rawFiles.length > 0) {
            files.push(...rawFiles);
        }
        else if (singleFile) {
            files.push(singleFile);
        }
        if (files.length === 0) {
            res.status(400).json({ error: 'No documents uploaded. Please attach at least one DOCX, PDF, or TXT file.' });
            return;
        }
        const { subject = 'Mathematics', exam = 'JEE Main', year = 2026, moduleType = 'PYQ', chapter = '', topic = '' } = req.body;
        const fileSummaries = [];
        const allQuestions = [];
        const seenHashes = new Set();
        let totalPages = 0;
        let successfulCount = 0;
        let needsReviewCount = 0;
        const failedFiles = [];
        for (const file of files) {
            const originalName = (file.originalname || '').toLowerCase();
            let fileType = 'UNKNOWN';
            try {
                let summary;
                if (originalName.endsWith('.docx') || originalName.endsWith('.doc')) {
                    fileType = 'DOCX';
                    summary = await extractQuestionsFromDocxBuffer(file.buffer, String(subject), String(exam));
                }
                else if (originalName.endsWith('.pdf')) {
                    fileType = 'PDF';
                    summary = await extractQuestionsFromPdfBuffer(file.buffer, String(subject), String(exam));
                }
                else if (originalName.endsWith('.txt')) {
                    fileType = 'TXT';
                    const text = file.buffer.toString('utf-8');
                    summary = parseQuestionsFromText(text, String(subject), String(exam));
                }
                else if (originalName.endsWith('.json')) {
                    fileType = 'JSON';
                    const text = file.buffer.toString('utf-8');
                    const parsed = JSON.parse(text);
                    const qList = Array.isArray(parsed) ? parsed : parsed.questions || [];
                    summary = {
                        totalDetected: qList.length,
                        successfulCount: qList.length,
                        needsReviewCount: 0,
                        errorCount: 0,
                        questions: qList,
                        totalPages: 1,
                        errorLog: []
                    };
                }
                else {
                    // Attempt generic buffer inspection
                    fileType = 'GENERIC';
                    summary = await extractQuestionsFromPdfBuffer(file.buffer, String(subject), String(exam));
                }
                totalPages += summary.totalPages || 1;
                // Deduplicate and collect questions
                let fileExtracted = 0;
                let fileReviewNeeded = 0;
                for (const q of summary.questions || []) {
                    // Normalize text fingerprint for deduplication
                    const normKey = (q.statement || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '')
                        .slice(0, 100);
                    if (normKey && seenHashes.has(normKey)) {
                        continue; // Skip duplicate question
                    }
                    if (normKey)
                        seenHashes.add(normKey);
                    const isReview = q.status === 'NEEDS_REVIEW';
                    if (isReview) {
                        needsReviewCount++;
                        fileReviewNeeded++;
                    }
                    else {
                        successfulCount++;
                    }
                    allQuestions.push({
                        ...q,
                        subject: String(subject),
                        chapter: chapter || q.chapter || '',
                        topic: topic || q.topic || `${subject} Drill`,
                        examYear: String(year),
                        year,
                        sourceDocument: file.originalname
                    });
                    fileExtracted++;
                }
                fileSummaries.push({
                    fileName: file.originalname,
                    fileType,
                    status: fileReviewNeeded > 0 ? 'PARTIAL' : 'SUCCESS',
                    detectedCount: fileExtracted,
                    needsReviewCount: fileReviewNeeded
                });
            }
            catch (fileErr) {
                console.error(`[Bulk Upload Error on ${file.originalname}]:`, fileErr);
                failedFiles.push({ fileName: file.originalname, error: fileErr.message || 'Extraction failed' });
                fileSummaries.push({
                    fileName: file.originalname,
                    fileType,
                    status: 'FAILED',
                    detectedCount: 0,
                    needsReviewCount: 0,
                    error: fileErr.message
                });
            }
        }
        // Renumber sequential question numbering
        allQuestions.forEach((q, idx) => {
            q.qNum = idx + 1;
        });
        res.status(200).json({
            success: allQuestions.length > 0 || failedFiles.length === 0,
            totalFiles: files.length,
            processedFiles: files.length - failedFiles.length,
            failedFiles,
            totalPages,
            totalQuestions: allQuestions.length,
            successfulCount,
            needsReviewCount,
            fileSummaries,
            questions: allQuestions
        });
    }
    catch (err) {
        console.error('Fatal error in bulkUploadDppPyqDocuments:', err);
        res.status(500).json({ error: 'Failed to process bulk documents', details: err.message });
    }
};
export const getPdfImportHistory = async (_req, res) => {
    try {
        const history = await PdfImportHistory.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json(history);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch PDF history', details: err.message });
    }
};
export const getPdfImportById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await PdfImportHistory.findOne({ id });
        if (!record) {
            res.status(404).json({ error: 'PDF import record not found' });
            return;
        }
        res.status(200).json(record);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch import record', details: err.message });
    }
};
export const updateExtractedQuestionInStaging = async (req, res) => {
    try {
        const { importId, tempId } = req.params;
        const updates = req.body;
        const record = await PdfImportHistory.findOne({ id: importId });
        if (!record) {
            res.status(404).json({ error: 'PDF import record not found' });
            return;
        }
        const qIndex = record.extractedQuestions.findIndex((q) => q.tempId === tempId);
        if (qIndex === -1) {
            res.status(404).json({ error: 'Question not found in staging' });
            return;
        }
        Object.assign(record.extractedQuestions[qIndex], updates);
        record.needsReviewCount = record.extractedQuestions.filter((q) => q.status === 'NEEDS_REVIEW').length;
        record.successfulCount = record.extractedQuestions.filter((q) => q.status === 'EXTRACTED' || q.status === 'VERIFIED').length;
        record.status = record.needsReviewCount > 0 ? 'REVIEW_REQUIRED' : 'COMPLETED';
        await record.save();
        res.status(200).json({ success: true, updatedQuestion: record.extractedQuestions[qIndex] });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update staged question', details: err.message });
    }
};
/* =========================================================================
   PYQ STUDIO: CENTRALIZED QUESTION BANK
   ========================================================================= */
export const getQuestionBank = async (req, res) => {
    try {
        const { search, subject, exam, year, chapter, difficulty, questionType, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (search) {
            const safeSearch = escapeRegex(String(search).trim());
            filter.$or = [
                { statement: { $regex: safeSearch, $options: 'i' } },
                { chapter: { $regex: safeSearch, $options: 'i' } },
                { topic: { $regex: safeSearch, $options: 'i' } }
            ];
        }
        if (subject && subject !== 'All')
            filter.subject = subject;
        if (exam && exam !== 'All')
            filter.exam = exam;
        if (year && year !== 'All')
            filter.year = isNaN(Number(year)) ? year : Number(year);
        if (chapter && chapter !== 'All')
            filter.chapter = chapter;
        if (difficulty && difficulty !== 'All')
            filter.difficulty = difficulty;
        if (questionType && questionType !== 'All')
            filter.questionType = questionType;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 50));
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            QuestionBank.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            QuestionBank.countDocuments(filter)
        ]);
        res.status(200).json({
            items,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch question bank', details: err.message });
    }
};
export const createOrUpdateQuestionBankItem = async (req, res) => {
    try {
        const data = req.body;
        const id = data.id || `qb-${Date.now()}-${uuidv4().slice(0, 6)}`;
        const saved = await QuestionBank.findOneAndUpdate({ id }, { $set: { ...data, id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.status(200).json(saved);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to save question bank item', details: err.message });
    }
};
export const batchAddToQuestionBank = async (req, res) => {
    try {
        const { questions } = req.body;
        if (!Array.isArray(questions) || questions.length === 0) {
            res.status(400).json({ error: 'Array of questions required' });
            return;
        }
        const operations = questions.map((q) => {
            const id = q.id || `qb-${Date.now()}-${uuidv4().slice(0, 6)}`;
            return {
                updateOne: {
                    filter: { id },
                    update: { $set: { ...q, id } },
                    upsert: true
                }
            };
        });
        const result = await QuestionBank.bulkWrite(operations);
        res.status(200).json({ success: true, count: result.upsertedCount + result.modifiedCount });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to batch add questions', details: err.message });
    }
};
export const deleteQuestionBankItem = async (req, res) => {
    try {
        const { id } = req.params;
        await QuestionBank.findOneAndDelete({ id });
        res.status(200).json({ success: true, message: 'Question removed from question bank' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete question', details: err.message });
    }
};

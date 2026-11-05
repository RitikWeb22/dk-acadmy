import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  ArrowRight,
  ArrowLeft,
  Video,
  FileCheck,
  Search,
  X,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Check,
  Loader2
} from 'lucide-react';
import type {
  PyqPaper,
  PyqQuestion,
  SubjectDomain,
  TargetExamination,
  QuestionType,
  QuestionDifficulty,
  PublicationStatus,
  AccessMode,
  QuestionBankItem
} from './types';
import { SUBJECT_CHAPTERS, EXAM_YEARS } from './types';
import { MathText } from '../../ui/MathText/MathText';
import { apiClient } from '../../../services/apiClient';
import { normalizeMathText } from '../../../utils/questionBulkParser';
import { normalizePastedQuestion } from '../../../utils/universalDocxParser';
import styles from './PyqManagementStudio.module.scss';

interface Props {
  initialPaper?: PyqPaper | null;
  questionBank: QuestionBankItem[];
  onSavePaper: (paper: PyqPaper) => Promise<void>;
  onPreviewPaper: (paper: PyqPaper) => void;
  onCancel: () => void;
}

export const PyqCreateWizard: React.FC<Props> = ({
  initialPaper,
  questionBank,
  onSavePaper,
  onPreviewPaper,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // --- Step 1 State: Paper Details ---
  const [exam, setExam] = useState<TargetExamination>(
    (initialPaper?.targetExam as TargetExamination) || 'JEE Main'
  );
  const [customExam, setCustomExam] = useState('');
  const [year, setYear] = useState<number | string>(initialPaper?.year || 2026);
  const [customYear, setCustomYear] = useState('');
  const [subject, setSubject] = useState<SubjectDomain>(initialPaper?.subject || 'Mathematics');
  const [selectedChapters, setSelectedChapters] = useState<string[]>(
    initialPaper?.chapters && initialPaper.chapters.length > 0
      ? initialPaper.chapters
      : initialPaper?.chapter
      ? [initialPaper.chapter]
      : ['Straight Lines']
  );
  const [chapterSearch, setChapterSearch] = useState('');
  const [customChapterInput, setCustomChapterInput] = useState('');

  const [title, setTitle] = useState(initialPaper?.title || '');
  const [slug, setSlug] = useState(initialPaper?.slug || '');
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(Boolean(initialPaper?.title));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialPaper?.slug));

  // --- Step 2 State: Question Import Studio ---
  const [importMode, setImportMode] = useState<'PDF' | 'MANUAL'>('MANUAL');
  const [questions, setQuestions] = useState<PyqQuestion[]>(
    initialPaper?.questions && initialPaper.questions.length > 0
      ? initialPaper.questions
      : [
          {
            id: `q-init-${Date.now()}-1`,
            qNum: 1,
            statement:
              'Let f(x) = \\int_{0}^{x} \\frac{t}{\\sqrt{1 + t^3}} dt, \\ x > 0. If f(1) = \\alpha, then the value of \\alpha^2 is:',
            subject: 'Mathematics',
            chapter: 'Definite Integration',
            difficulty: 'Moderate',
            questionType: 'Single Correct MCQ',
            options: [
              { key: 'A', text: '\\frac{2}{3}' },
              { key: 'B', text: '\\frac{1}{3}' },
              { key: 'C', text: '\\frac{4}{9}' },
              { key: 'D', text: '1' }
            ],
            correctKey: 'A',
            stepSolution:
              'Differentiating using Leibniz rule: f\'(x) = \\frac{x}{\\sqrt{1 + x^3}}. Integrating by substitution yields \\alpha = \\frac{2}{3}, thus \\alpha^2 = \\frac{4}{9}.',
            dkSirShortcut: 'DK Sir 20s Inspection: Monotonic integrand substitution bounds 0 to 1 directly.',
            videoUrl: '',
            pdfUrl: '',
            isFree: initialPaper?.accessMode === 'paid' || initialPaper?.isFree === false ? false : true
          }
        ]
  );

  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [isStatementPreview, setIsStatementPreview] = useState(false);
  const [isSolutionPreview, setIsSolutionPreview] = useState(false);
  const [isAiFormattingPyq, setIsAiFormattingPyq] = useState(false);

  const handleAiFormatPyqQuestion = async () => {
    const curQ = questions[activeQuestionIndex];
    if (!curQ) return;
    setIsAiFormattingPyq(true);
    try {
      const res = await apiClient.formatMathWithAi({
        statement: curQ.statement,
        options: curQ.options.map((o) => ({ key: o.key, text: o.text })),
        stepSolution: curQ.stepSolution,
        dkSirShortcut: curQ.dkSirShortcut,
        model: 'gemini-2.5-flash'
      });
      if (res?.data) {
        updateActiveQuestion('statement', res.data.statement || normalizeMathText(curQ.statement));
        if (Array.isArray(res.data.options) && res.data.options.length > 0) {
          updateActiveQuestion('options', res.data.options);
        }
        if (res.data.stepSolution) updateActiveQuestion('stepSolution', res.data.stepSolution);
        if (res.data.dkSirShortcut) updateActiveQuestion('dkSirShortcut', res.data.dkSirShortcut);
      }
    } catch {
      updateActiveQuestion('statement', normalizeMathText(curQ.statement));
      updateActiveQuestion('options', curQ.options.map((o) => ({ ...o, text: normalizeMathText(o.text) })));
    } finally {
      setIsAiFormattingPyq(false);
    }
  };

  // ── Paste Handlers (Step D) ─────────────────────────────────────────────────
  const handleStatementPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const result = normalizePastedQuestion(e.clipboardData);
    if (!result.fullNormalizedText) return;
    e.preventDefault();
    if (result.hasQuestionWithOptions) {
      // Full question pasted: fill statement + all 4 options + answer key at once
      updateActiveQuestion('statement', result.statement);
      updateActiveQuestion('options', result.options);
      if (result.correctKey) updateActiveQuestion('correctKey', result.correctKey);
      if (result.stepSolution) updateActiveQuestion('stepSolution', result.stepSolution);
      if (result.dkSirShortcut) updateActiveQuestion('dkSirShortcut', result.dkSirShortcut);
    } else {
      // Statement-only paste: insert at cursor
      const textarea = e.currentTarget;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const current = questions[activeQuestionIndex]?.statement || '';
      updateActiveQuestion('statement', current.substring(0, start) + result.fullNormalizedText + current.substring(end));
    }
  };

  const handleOptionPaste = (optKey: 'A' | 'B' | 'C' | 'D', e: React.ClipboardEvent<HTMLInputElement>) => {
    const result = normalizePastedQuestion(e.clipboardData);
    if (result.fullNormalizedText) {
      e.preventDefault();
      updateActiveOption(optKey, result.fullNormalizedText);
    }
  };

  // PDF Upload & Extraction State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [extractedSummary, setExtractedSummary] = useState<{
    totalDetected: number;
    successfulCount: number;
    needsReviewCount: number;
  } | null>(null);

  // Question Bank Selector Modal
  const [isQbModalOpen, setIsQbModalOpen] = useState(false);
  const [qbSearch, setQbSearch] = useState('');

  // --- Step 3 State: Paper-Level Settings & Resources ---
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialPaper?.durationMinutes || 60
  );
  const [positiveMarks, setPositiveMarks] = useState<number>(
    initialPaper?.positiveMarks ?? 4
  );
  const [negativeMarks, setNegativeMarks] = useState<number>(
    initialPaper?.negativeMarks ?? 1
  );
  const [videoWalkthroughUrl, setVideoWalkthroughUrl] = useState<string>(
    initialPaper?.videoWalkthroughUrl || ''
  );
  const [solutionPdfUrl, setSolutionPdfUrl] = useState<string>(
    initialPaper?.solutionPdfUrl || initialPaper?.pdfUrl || ''
  );

  // --- Step 4 State: Access & Publication ---
  const [accessMode, setAccessMode] = useState<AccessMode>(
    initialPaper?.accessMode || (initialPaper?.isFree === false ? 'paid' : 'free')
  );
  const [status, setStatus] = useState<PublicationStatus>(
    initialPaper?.status || 'Published'
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    initialPaper?.scheduledDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState<string>(
    initialPaper?.scheduledTime || '10:00'
  );

  // Auto-generate title & slug when basic details change unless manually edited
  useEffect(() => {
    const finalExam = exam === 'Custom' ? customExam || 'Exam' : exam;
    const finalYear = year === 'Custom' ? customYear || '2026' : year;
    const chaptersStr = selectedChapters.slice(0, 2).join(' & ') || 'Practice Set';

    if (!titleManuallyEdited) {
      const generatedTitle = `${finalExam} ${finalYear} – ${subject} – ${chaptersStr}`;
      setTitle(generatedTitle);

      if (!slugManuallyEdited) {
        const rawSlug = `/practice/${finalExam}-${finalYear}-${subject}-${chaptersStr}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        setSlug(rawSlug);
      }
    }
  }, [exam, customExam, year, customYear, subject, selectedChapters, titleManuallyEdited, slugManuallyEdited]);

  // Handle chapter multi-select
  const toggleChapter = (ch: string) => {
    setSelectedChapters((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const addCustomChapter = () => {
    if (!customChapterInput.trim()) return;
    const ch = customChapterInput.trim();
    if (!selectedChapters.includes(ch)) {
      setSelectedChapters((prev) => [...prev, ch]);
    }
    setCustomChapterInput('');
  };

  // --- PDF Drag and Drop & Upload Handler ---
  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }
    setPdfFile(file);
    setIsPdfUploading(true);
    setPdfUploadProgress(20);
    setPdfUploadError(null);

    try {
      const res = await apiClient.uploadPdfForExtraction(
        file,
        {
          subject,
          exam: exam === 'Custom' ? customExam : exam,
          year: year === 'Custom' ? customYear : year,
          paperTitle: title
        },
        (progress) => setPdfUploadProgress(progress)
      );

      if (res && res.summary && Array.isArray(res.summary.questions)) {
        const isPaperPaid = accessMode === 'paid' || initialPaper?.accessMode === 'paid' || initialPaper?.isFree === false;
        const newExtracted: PyqQuestion[] = res.summary.questions.map((q: any, idx: number) => {
          const hasOptionText = Array.isArray(q.options) && q.options.some((o: any) => o.text && o.text.trim().length > 0);
          return {
            id: `q-ext-${Date.now()}-${idx + 1}`,
            qNum: q.qNum || idx + 1,
            statement: q.statement,
            subject,
            chapter: q.topic || selectedChapters[0] || 'General',
            difficulty: q.difficulty || 'Moderate',
            questionType: hasOptionText ? 'Single Correct MCQ' : 'Numerical Value',
            options: q.options || [
              { key: 'A', text: '' },
              { key: 'B', text: '' },
              { key: 'C', text: '' },
              { key: 'D', text: '' }
            ],
            correctKey: q.suggestedAnswer || 'A',
            stepSolution: q.stepSolution || '',
            dkSirShortcut: q.dkSirShortcut || '',
            videoUrl: '',
            pdfUrl: '',
            isFree: isPaperPaid ? false : true,
            status: q.status || 'EXTRACTED',
            reviewReason: q.reviewReason || ''
          };
        });

        setQuestions(newExtracted);
        setActiveQuestionIndex(0);
        setExtractedSummary({
          totalDetected: res.summary.totalDetected || newExtracted.length,
          successfulCount: res.summary.successfulCount || 0,
          needsReviewCount: res.summary.needsReviewCount || 0
        });
      }
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setPdfUploadError(err.message || 'Server error during extraction');
    } finally {
      setIsPdfUploading(false);
      setPdfUploadProgress(100);
    }
  };

  // Active question helper
  const activeQ = questions[activeQuestionIndex] || questions[0];

  const updateActiveQuestion = (field: keyof PyqQuestion, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[activeQuestionIndex] = { ...copy[activeQuestionIndex], [field]: value };
      return copy;
    });
  };

  const updateActiveOption = (key: 'A' | 'B' | 'C' | 'D', text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const curQ = copy[activeQuestionIndex];
      const newOpts = curQ.options.map((opt) => (opt.key === key ? { ...opt, text } : opt));
      copy[activeQuestionIndex] = { ...curQ, options: newOpts };
      return copy;
    });
  };

  const handleAddQuestion = () => {
    const newQ: PyqQuestion = {
      id: `q-new-${Date.now()}-${questions.length + 1}`,
      qNum: questions.length + 1,
      statement: '',
      subject,
      chapter: selectedChapters[0] || 'General',
      difficulty: 'Moderate',
      questionType: 'Single Correct MCQ',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      correctKey: 'A',
      stepSolution: '',
      dkSirShortcut: '',
      videoUrl: '',
      pdfUrl: '',
      isFree: accessMode === 'paid' ? false : true
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const dup: PyqQuestion = {
      ...target,
      id: `q-dup-${Date.now()}`,
      qNum: questions.length + 1
    };
    setQuestions((prev) => [...prev, dup]);
    setActiveQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Paper must have at least one question.');
      return;
    }
    const filtered = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, qNum: i + 1 }));
    setQuestions(filtered);
    setActiveQuestionIndex(Math.max(0, idx - 1));
  };

  // Construct paper payload for save
  const constructPaperPayload = (): PyqPaper => {
    const finalExam = exam === 'Custom' ? customExam || 'Custom Exam' : exam;
    const finalYear = year === 'Custom' ? customYear || 2026 : year;

    return {
      id: initialPaper?.id || `pyq-${Date.now()}`,
      _id: initialPaper?._id,
      badgeCode: `PYQ • ${subject.slice(0, 3).toUpperCase()}`,
      title,
      slug: slug || `/practice/${Date.now()}`,
      moduleType: 'PYQ',
      subject,
      targetExam: finalExam,
      year: finalYear,
      chapter: selectedChapters.join(', '),
      chapters: selectedChapters,
      categoryLabel: `${subject} PYQ Practice`,
      questionsCount: questions.length,
      durationMinutes: Number(durationMinutes) || 60,
      totalMarks: questions.length * (Number(positiveMarks) || 4),
      positiveMarks: Number(positiveMarks) || 4,
      negativeMarks: Number(negativeMarks) || 1,
      accessMode,
      isFree: accessMode === 'free',
      solutionPdfUrl,
      pdfUrl: solutionPdfUrl,
      videoWalkthroughUrl,
      videoUrl: videoWalkthroughUrl,
      solutionNote: 'Step-by-step mathematical derivation & DK Sir shortcut',
      status,
      scheduledDate: status === 'Scheduled' ? `${scheduledDate}T${scheduledTime}:00Z` : undefined,
      scheduledTime: status === 'Scheduled' ? scheduledTime : undefined,
      attemptsCount: initialPaper?.attemptsCount || 0,
      questions
    };
  };

  const handleSave = async (forceStatus?: PublicationStatus) => {
    setIsSaving(true);
    try {
      const payload = constructPaperPayload();
      if (forceStatus) payload.status = forceStatus;
      await onSavePaper(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stepper Header */}
      <div className={styles.stepperHeader}>
        <div
          className={`${styles.stepItem} ${currentStep === 1 ? styles.active : ''} ${
            currentStep > 1 ? styles.completed : ''
          }`}
          onClick={() => setCurrentStep(1)}
        >
          <div className={styles.stepNum}>{currentStep > 1 ? <Check size={14} /> : 1}</div>
          <span>1. Paper Details &amp; Basics</span>
        </div>

        <div
          className={`${styles.stepItem} ${currentStep === 2 ? styles.active : ''} ${
            currentStep > 2 ? styles.completed : ''
          }`}
          onClick={() => setCurrentStep(2)}
        >
          <div className={styles.stepNum}>{currentStep > 2 ? <Check size={14} /> : 2}</div>
          <span>2. Question Import Studio</span>
        </div>

        <div
          className={`${styles.stepItem} ${currentStep === 3 ? styles.active : ''} ${
            currentStep > 3 ? styles.completed : ''
          }`}
          onClick={() => setCurrentStep(3)}
        >
          <div className={styles.stepNum}>{currentStep > 3 ? <Check size={14} /> : 3}</div>
          <span>3. Paper Settings &amp; Resources</span>
        </div>

        <div
          className={`${styles.stepItem} ${currentStep === 4 ? styles.active : ''} ${
            currentStep > 4 ? styles.completed : ''
          }`}
          onClick={() => setCurrentStep(4)}
        >
          <div className={styles.stepNum}>4</div>
          <span>4. Access &amp; Publication</span>
        </div>
      </div>

      {/* STEP 1: Paper Details */}
      {currentStep === 1 && (
        <div className={styles.contentCard} style={{ padding: '1.5rem', gap: '1.5rem' }}>
          <div className={styles.cardHeader} style={{ padding: 0, border: 'none' }}>
            <div className={styles.headerTitle}>
              <h2>Step 1: Paper Information</h2>
              <p>Configure examination parameters, subject domain, and covered syllabus chapters.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            {/* Target Exam */}
            <div className={styles.formGroup}>
              <label>Target Examination <span className={styles.required}>*</span></label>
              <select
                className={styles.formControl}
                value={exam}
                onChange={(e) => setExam(e.target.value as TargetExamination)}
              >
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="BITSAT">BITSAT</option>
                <option value="Custom">Other / Custom Examination</option>
              </select>
              {exam === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom examination name..."
                  className={styles.formControl}
                  style={{ marginTop: '0.5rem' }}
                  value={customExam}
                  onChange={(e) => setCustomExam(e.target.value)}
                />
              )}
            </div>

            {/* Examination Year */}
            <div className={styles.formGroup}>
              <label>Examination Year <span className={styles.required}>*</span></label>
              <select
                className={styles.formControl}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {EXAM_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
                <option value="Custom">Add Custom Year</option>
              </select>
              {year === 'Custom' && (
                <input
                  type="text"
                  placeholder="e.g. 2019, 2018..."
                  className={styles.formControl}
                  style={{ marginTop: '0.5rem' }}
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                />
              )}
            </div>

            {/* Subject Domain */}
            <div className={styles.formGroup}>
              <label>Subject Domain <span className={styles.required}>*</span></label>
              <select
                className={styles.formControl}
                value={subject}
                onChange={(e) => {
                  const sub = e.target.value as SubjectDomain;
                  setSubject(sub);
                  setSelectedChapters(SUBJECT_CHAPTERS[sub]?.slice(0, 1) || ['General']);
                }}
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mixed">Mixed / Full Syllabus</option>
              </select>
            </div>
          </div>

          {/* Chapters / Topics Multi-Selector */}
          <div className={styles.formGroup}>
            <label>Chapters / Topics Covered (Multiple Selectable) <span className={styles.required}>*</span></label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search chapter..."
                className={styles.formControl}
                style={{ width: 220 }}
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
              />
              <input
                type="text"
                placeholder="Or type custom chapter & press Add..."
                className={styles.formControl}
                value={customChapterInput}
                onChange={(e) => setCustomChapterInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomChapter()}
              />
              <button type="button" className={styles.btnSecondary} onClick={addCustomChapter}>
                Add Chapter
              </button>
            </div>

            {/* Selected Chapter Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
              {selectedChapters.map((ch) => (
                <span
                  key={ch}
                  style={{
                    background: '#1f6feb',
                    color: '#fff',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 14,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {ch}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleChapter(ch)} />
                </span>
              ))}
            </div>

            {/* Available Chapter Chips from Subject list */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '0.75rem',
                maxHeight: 140,
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.4rem'
              }}
            >
              {(SUBJECT_CHAPTERS[subject] || [])
                .filter((ch) => ch.toLowerCase().includes(chapterSearch.toLowerCase()))
                .map((ch) => {
                  const isSel = selectedChapters.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChapter(ch)}
                      style={{
                        background: isSel ? '#eff6ff' : '#f8fafc',
                        color: isSel ? '#2563eb' : '#475569',
                        border: isSel ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: isSel ? 600 : 500
                      }}
                    >
                      {isSel ? '✓ ' : '+ '} {ch}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Paper Title & URL Slug */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Paper Title (Auto-suggested, Editable) <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.formControl}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleManuallyEdited(true);
                }}
              />
              <span className={styles.helperText}>Example: JEE Main 2026 – Mathematics – Straight Lines</span>
            </div>

            <div className={styles.formGroup}>
              <label>URL Slug (Auto-generated, Editable) <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.formControl}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
              />
              <span className={styles.helperText}>Used for direct practice link: {slug}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Question Import Studio */}
      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Method Selector Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: '#f1f5f9',
              padding: '0.5rem',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => setImportMode('PDF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.85rem',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: importMode === 'PDF' ? '#2563eb' : 'transparent',
                color: importMode === 'PDF' ? '#ffffff' : '#64748b',
                border: 'none',
                boxShadow: importMode === 'PDF' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
              }}
            >
              <Upload size={18} /> Option A: Upload Question Paper PDF
            </button>
            <button
              type="button"
              onClick={() => setImportMode('MANUAL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.85rem',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: importMode === 'MANUAL' ? '#2563eb' : 'transparent',
                color: importMode === 'MANUAL' ? '#ffffff' : '#64748b',
                border: 'none',
                boxShadow: importMode === 'MANUAL' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
              }}
            >
              <FileText size={18} /> Option B: Add Questions Manually &amp; Question Bank
            </button>
          </div>

          {/* OPTION A: PDF DROPZONE & EXTRACTION REVIEW */}
          {importMode === 'PDF' && (
            <div className={styles.contentCard} style={{ padding: '1.5rem', gap: '1.25rem' }}>
              <div
                className={styles.dropzoneContainer}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePdfUpload(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePdfUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className={styles.uploadIcon}>
                  <Upload size={24} />
                </div>
                <h4>Upload Question Paper PDF</h4>
                <p>
                  Supports multi-page question papers, scanned documents with OCR fallback, and LaTeX equation extraction.
                </p>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Computer
                </button>
              </div>

              {/* Upload Error Banner */}
              {pdfUploadError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '0.85rem 1.25rem',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <span><strong>PDF Extraction Issue:</strong> {pdfUploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfUploadError(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#991b1b',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '1rem'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isPdfUploading && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#0f172a' }}>
                    <span>Extracting questions &amp; mathematical symbols from {pdfFile?.name}...</span>
                    <span style={{ fontWeight: 600 }}>{pdfUploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pdfUploadProgress}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}

              {/* Extraction Metrics Review Console */}
              {extractedSummary && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 8,
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Detected</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{extractedSummary.totalDetected}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Extracted OK</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>{extractedSummary.successfulCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Requires Review</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706' }}>{extractedSummary.needsReviewCount}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: '#475569' }}>
                    ✓ Suggested answers require admin verification before publication.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUESTION EDITOR CONSOLE (Used for both Manual authoring and reviewing extracted PDF questions) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: '1.25rem'
            }}
          >
            {/* Sidebar Question List */}
            <div className={styles.contentCard} style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>Questions ({questions.length})</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setIsQbModalOpen(true)}
                    title="Import from Central Question Bank"
                  >
                    + Bank
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddQuestion}
                    title="Add Blank Question"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: activeQuestionIndex === idx ? '#eff6ff' : 'transparent',
                      borderLeft:
                        activeQuestionIndex === idx
                          ? '3px solid #2563eb'
                          : q.status === 'NEEDS_REVIEW'
                          ? '3px solid #d97706'
                          : '3px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: activeQuestionIndex === idx ? '#2563eb' : '#0f172a' }}>
                        Question {idx + 1}
                      </div>
                      <div
                        style={{
                          fontSize: '0.725rem',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 160
                        }}
                      >
                        {q.statement || 'Empty statement...'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {q.status === 'NEEDS_REVIEW' && (
                        <span title="Needs review">
                          <AlertTriangle size={13} color="#d29922" />
                        </span>
                      )}
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#6e7681', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateQuestion(idx);
                        }}
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(idx);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Question Editor Card */}
            {activeQ && (
              <div className={styles.contentCard} style={{ padding: '1.5rem', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                      Editing Question #{activeQuestionIndex + 1}
                    </span>
                    {activeQ.status === 'NEEDS_REVIEW' && (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 10,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        Needs Review: {activeQ.reviewReason || 'Verify options & formula'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => handleDuplicateQuestion(activeQuestionIndex)}
                    >
                      <Copy size={14} /> Duplicate
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleDeleteQuestion(activeQuestionIndex)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Section A: Question Information */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  <div className={styles.formGroup}>
                    <label>Question Type</label>
                    <select
                      className={styles.formControl}
                      value={activeQ.questionType}
                      onChange={(e) => updateActiveQuestion('questionType', e.target.value as QuestionType)}
                    >
                      <option value="Single Correct MCQ">Single Correct MCQ</option>
                      <option value="Multiple Correct MCQ">Multiple Correct MCQ</option>
                      <option value="Numerical Answer">Numerical Answer</option>
                      <option value="Integer Type">Integer Type</option>
                      <option value="Paragraph">Paragraph / Comprehension</option>
                      <option value="Match the Following">Match the Following</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Difficulty Level</label>
                    <select
                      className={styles.formControl}
                      value={activeQ.difficulty}
                      onChange={(e) => updateActiveQuestion('difficulty', e.target.value as QuestionDifficulty)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Challenging">Challenging</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Chapter / Specific Topic</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={activeQ.chapter}
                      onChange={(e) => updateActiveQuestion('chapter', e.target.value)}
                    />
                  </div>
                </div>

                {/* Section B: Question Statement (Rich LaTeX math) */}
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label>Question Statement (LaTeX / KaTeX Math Supported) <span className={styles.required}>*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        disabled={isAiFormattingPyq}
                        style={{
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.75rem',
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isAiFormattingPyq ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                        onClick={handleAiFormatPyqQuestion}
                        title="Reconstruct formulas with Gemini AI"
                      >
                        {isAiFormattingPyq ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span>{isAiFormattingPyq ? 'Formatting...' : '✨ AI Auto-Format'}</span>
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => setIsStatementPreview(!isStatementPreview)}
                      >
                        {isStatementPreview ? 'Edit LaTeX' : 'Preview KaTeX'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Math Toolbar */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.35rem 0' }}>
                    {[
                      { label: '∫ dx', code: '\\int_{0}^{1} f(x)\\,dx ' },
                      { label: '√x', code: '\\sqrt{x} ' },
                      { label: 'a/b', code: '\\frac{a}{b} ' },
                      { label: '∑', code: '\\sum_{i=1}^{n} ' },
                      { label: 'lim', code: '\\lim_{x \\to 0} ' },
                      { label: 'α', code: '\\alpha ' },
                      { label: 'β', code: '\\beta ' },
                      { label: 'π', code: '\\pi ' },
                      { label: 'x²', code: 'x^2 ' },
                      { label: 'vector', code: '\\vec{v} ' }
                    ].map((tool) => (
                      <button
                        key={tool.label}
                        type="button"
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          borderRadius: 4,
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => updateActiveQuestion('statement', (activeQ.statement || '') + tool.code)}
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>

                  {!isStatementPreview ? (
                    <textarea
                      rows={4}
                      className={styles.formControl}
                      placeholder="Enter question statement with LaTeX math (e.g. \int_0^1 x^2 dx)..."
                      value={activeQ.statement}
                      onChange={(e) => updateActiveQuestion('statement', e.target.value)}
                      onPaste={handleStatementPaste}
                    />
                  ) : (
                    <div className={styles.mathPreviewBox}>
                      <MathText text={activeQ.statement || 'Empty statement'} />
                    </div>
                  )}

                  {/* Diagram Attachment */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Optional image/diagram URL (e.g. /images/diagram1.png)..."
                      className={styles.formControl}
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      value={activeQ.diagramUrl || ''}
                      onChange={(e) => updateActiveQuestion('diagramUrl', e.target.value)}
                    />
                  </div>
                </div>

                {/* Section C: Answer Choices & Correct Answer Selector */}
                {activeQ.questionType.includes('MCQ') ? (
                  <div className={styles.formGroup}>
                    <label>Answer Choices &amp; Verified Key</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const opt = activeQ.options.find((o) => o.key === key) || { key, text: '' };
                        const isCorrect = activeQ.correctKey === key;
                        return (
                          <div
                            key={key}
                            style={{
                              background: isCorrect ? '#f0fdf4' : '#f8fafc',
                              border: isCorrect ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                              borderRadius: 6,
                              padding: '0.6rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => updateActiveQuestion('correctKey', key)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isCorrect ? '#16a34a' : '#e2e8f0',
                                color: isCorrect ? '#ffffff' : '#64748b',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                              title="Click to set as correct answer"
                            >
                              {key}
                            </button>
                            <input
                              type="text"
                              className={styles.formControl}
                              style={{ border: 'none', background: 'transparent', padding: 0 }}
                              placeholder={`Option ${key} text / LaTeX...`}
                              value={opt.text}
                              onChange={(e) => updateActiveOption(key, e.target.value)}
                              onPaste={(e) => handleOptionPaste(key, e)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Numerical Answer Input */
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      background: '#f8fafc',
                      padding: '1rem',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label>Correct Numerical Value</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="e.g. 14, 3.5, -2"
                        value={activeQ.numericalAnswer !== undefined ? String(activeQ.numericalAnswer) : ''}
                        onChange={(e) => updateActiveQuestion('numericalAnswer', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Acceptable Tolerance (±)</label>
                      <input
                        type="number"
                        step="0.01"
                        className={styles.formControl}
                        placeholder="0.00"
                        value={activeQ.numericalTolerance ?? 0}
                        onChange={(e) => updateActiveQuestion('numericalTolerance', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}

                {/* Section D: Solution & Explanation */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                      Solution &amp; Explanation
                    </div>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => setIsSolutionPreview(!isSolutionPreview)}
                    >
                      {isSolutionPreview ? 'Edit Solution' : 'Preview KaTeX'}
                    </button>
                  </div>

                  <div className={styles.formGroup}>
                    <label>1. Detailed Step-by-Step Mathematical Derivation</label>
                    {!isSolutionPreview ? (
                      <textarea
                        rows={3}
                        className={styles.formControl}
                        placeholder="Step-by-step mathematical proof or derivation with LaTeX..."
                        value={activeQ.stepSolution || ''}
                        onChange={(e) => updateActiveQuestion('stepSolution', e.target.value)}
                      />
                    ) : (
                      <div className={styles.mathPreviewBox}>
                        <MathText text={activeQ.stepSolution || 'No detailed solution entered.'} />
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>2. Short / Fast Approach (DK Sir Speed Shortcut)</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="e.g. DK Sir Inspection Trick: evaluate boundary points in 15s..."
                      value={activeQ.dkSirShortcut || ''}
                      onChange={(e) => updateActiveQuestion('dkSirShortcut', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>3. Video Explanation URL</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="YouTube or Google Drive URL..."
                        value={activeQ.videoUrl || ''}
                        onChange={(e) => updateActiveQuestion('videoUrl', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>4. Solution PDF URL</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="PDF download URL..."
                        value={activeQ.pdfUrl || ''}
                        onChange={(e) => updateActiveQuestion('pdfUrl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Paper-Level Settings & Resources */}
      {currentStep === 3 && (
        <div className={styles.contentCard} style={{ padding: '1.5rem', gap: '1.5rem' }}>
          <div className={styles.cardHeader} style={{ padding: 0, border: 'none' }}>
            <div className={styles.headerTitle}>
              <h2>Step 3: Paper Parameters &amp; Resources</h2>
              <p>Configure test timing, scoring rules, and overall paper walkthrough video/PDF.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Fixed Timer Duration (Minutes) <span className={styles.required}>*</span></label>
              <input
                type="number"
                className={styles.formControl}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
              <span className={styles.helperText}>Timer starts on student CBT screen</span>
            </div>

            <div className={styles.formGroup}>
              <label>Marks per Correct Answer (+)</label>
              <input
                type="number"
                className={styles.formControl}
                value={positiveMarks}
                onChange={(e) => setPositiveMarks(Number(e.target.value))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Marks Deducted for Incorrect Answer (-)</label>
              <input
                type="number"
                className={styles.formControl}
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Total Questions &amp; Calculated Marks</label>
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 6,
                  padding: '0.65rem 0.85rem',
                  color: '#1d4ed8',
                  fontWeight: 600
                }}
              >
                {questions.length} Questions • Total {questions.length * positiveMarks} Marks
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className={styles.formGroup}>
              <label>Overall Paper Walkthrough Video URL</label>
              <input
                type="text"
                className={styles.formControl}
                placeholder="YouTube or Drive link for full paper discussion..."
                value={videoWalkthroughUrl}
                onChange={(e) => setVideoWalkthroughUrl(e.target.value)}
              />
              <span className={styles.helperText}>Available to students after paper completion</span>
            </div>

            <div className={styles.formGroup}>
              <label>Complete Paper Solution PDF URL</label>
              <input
                type="text"
                className={styles.formControl}
                placeholder="Downloadable complete question paper solution PDF..."
                value={solutionPdfUrl}
                onChange={(e) => setSolutionPdfUrl(e.target.value)}
              />
              <span className={styles.helperText}>Direct PDF download link</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Access & Publication */}
      {currentStep === 4 && (
        <div className={styles.contentCard} style={{ padding: '1.5rem', gap: '1.5rem' }}>
          <div className={styles.cardHeader} style={{ padding: 0, border: 'none' }}>
            <div className={styles.headerTitle}>
              <h2>Step 4: Access Control &amp; Publication Status</h2>
              <p>Control student availability, course locks, and scheduled release time.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Access Mode */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <label style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                Student Access Mode
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    background: accessMode === 'free' ? '#f0fdf4' : '#ffffff',
                    border: accessMode === 'free' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    padding: '0.75rem',
                    borderRadius: 6
                  }}
                >
                  <input
                    type="radio"
                    name="accessMode"
                    checked={accessMode === 'free'}
                    onChange={() => {
                      setAccessMode('free');
                      setQuestions((prev) => prev.map((q) => ({ ...q, isFree: true })));
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>Free Practice Drill</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Accessible to all registered students without payment.
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    background: accessMode === 'paid' ? '#eff6ff' : '#ffffff',
                    border: accessMode === 'paid' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    padding: '0.75rem',
                    borderRadius: 6
                  }}
                >
                  <input
                    type="radio"
                    name="accessMode"
                    checked={accessMode === 'paid'}
                    onChange={() => {
                      setAccessMode('paid');
                      setQuestions((prev) => prev.map((q) => ({ ...q, isFree: false })));
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>Paid / Locked Mastery Course</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Requires enrollment in the 10-Year JEE Chapter-Wise PYQ Mastery Course.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Publication Status */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <label style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                Publication Status
              </label>

              <select
                className={styles.formControl}
                value={status}
                onChange={(e) => setStatus(e.target.value as PublicationStatus)}
              >
                <option value="Published">Published (Live to eligible students)</option>
                <option value="Draft">Draft (Internal editor access only)</option>
                <option value="Scheduled">Scheduled (Auto-publish at specific date/time)</option>
                <option value="Archived">Archived (Hidden from practice catalog)</option>
              </select>

              {status === 'Scheduled' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className={styles.formGroup}>
                    <label>Release Date</label>
                    <input
                      type="date"
                      className={styles.formControl}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Release Time (IST)</label>
                    <input
                      type="time"
                      className={styles.formControl}
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                Current system timezone: <strong>Asia/Kolkata (IST)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Bar */}
      <div className={styles.stickyActionBar}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className={styles.btnSecondary} onClick={onCancel}>
            Cancel
          </button>
          {currentStep > 1 && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => onPreviewPaper(constructPaperPayload())}
          >
            <Eye size={16} /> Preview Student Experience
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            disabled={isSaving}
            onClick={() => handleSave('Draft')}
          >
            Save Draft
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.btnSuccess}
              disabled={isSaving}
              onClick={() => handleSave()}
            >
              <CheckCircle2 size={16} /> {status === 'Scheduled' ? 'Schedule Release' : 'Publish PYQ Paper'}
            </button>
          )}
        </div>
      </div>

      {/* QUESTION BANK SELECTOR MODAL */}
      {isQbModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Import from Central Question Bank</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsQbModalOpen(false)} />
            </div>

            <div className={styles.modalBody}>
              <div className={styles.searchInput}>
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search questions in bank by statement or chapter..."
                  value={qbSearch}
                  onChange={(e) => setQbSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {questionBank
                  .filter((q) => !qbSearch || q.statement.toLowerCase().includes(qbSearch.toLowerCase()))
                  .map((qbItem) => (
                    <div
                      key={qbItem.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        borderRadius: 8,
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{qbItem.subject}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>• {qbItem.chapter}</span>
                          <span style={{ fontSize: '0.75rem', color: '#d97706' }}>• {qbItem.exam}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                          <MathText text={qbItem.statement} />
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.btnPrimary}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          const newQ: PyqQuestion = {
                            id: `q-from-bank-${Date.now()}-${qbItem.id}`,
                            qNum: questions.length + 1,
                            statement: qbItem.statement,
                            subject: qbItem.subject,
                            chapter: qbItem.chapter,
                            topic: qbItem.topic,
                            difficulty: qbItem.difficulty,
                            questionType: qbItem.questionType,
                            options: qbItem.options,
                            correctKey: qbItem.correctKey,
                            correctKeys: qbItem.correctKeys,
                            numericalAnswer: qbItem.numericalAnswer,
                            numericalTolerance: qbItem.numericalTolerance,
                            stepSolution: qbItem.stepSolution,
                            dkSirShortcut: qbItem.dkSirShortcut,
                            videoUrl: qbItem.videoUrl,
                            pdfUrl: qbItem.pdfUrl,
                            diagramUrl: qbItem.diagramUrl,
                            isFree: accessMode === 'paid' || initialPaper?.accessMode === 'paid' || initialPaper?.isFree === false ? false : true
                          };
                          setQuestions((prev) => [...prev, newQ]);
                          setActiveQuestionIndex(questions.length);
                          setIsQbModalOpen(false);
                        }}
                      >
                        + Insert into Paper
                      </button>
                    </div>
                  ))}
                {questionBank.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No questions in question bank. Author questions and save them to bank!
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setIsQbModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

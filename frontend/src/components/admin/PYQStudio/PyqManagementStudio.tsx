import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Database,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type {
  PyqPaper,
  PyqStudioTab,
  QuestionBankItem,
  PdfImportRecord
} from './types';
import { PyqStudioDashboard } from './PyqStudioDashboard';
import { PyqPapersList } from './PyqPapersList';
import { PyqCreateWizard } from './PyqCreateWizard';
import { PyqQuestionBankView } from './PyqQuestionBankView';
import { PyqPdfHistoryView } from './PyqPdfHistoryView';
import { PyqStudentPreviewModal } from './PyqStudentPreviewModal';
import { apiClient } from '../../../services/apiClient';
import styles from './PyqManagementStudio.module.scss';

export const PyqManagementStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PyqStudioTab>('dashboard');
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [pdfHistory, setPdfHistory] = useState<PdfImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editing & Preview Modals
  const [editingPaper, setEditingPaper] = useState<PyqPaper | null>(null);
  const [previewPaper, setPreviewPaper] = useState<PyqPaper | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Papers
  const fetchPapers = useCallback(async () => {
    try {
      const res = await apiClient.get<any[]>('/dpp-pyqs');
      if (Array.isArray(res)) {
        // Map backend objects to PyqPaper
        const mapped: PyqPaper[] = res.map((item: any) => ({
          id: item.id || item._id,
          _id: item._id,
          badgeCode: item.badgeCode || 'PYQ',
          title: item.title,
          slug: item.slug,
          moduleType: item.moduleType || 'PYQ',
          subject: item.subject || 'Mathematics',
          targetExam: item.targetExam || item.examTarget || 'JEE Main',
          year: item.year || 2024,
          chapter: item.chapter || '',
          chapters: item.chapters || (item.chapter ? [item.chapter] : []),
          categoryLabel: item.categoryLabel || 'PYQ Practice',
          questionsCount: item.questionsCount || (item.questions ? item.questions.length : 0),
          durationMinutes: item.durationMinutes || 60,
          totalMarks: item.totalMarks || (item.questions ? item.questions.length * 4 : 24),
          positiveMarks: item.positiveMarks || 4,
          negativeMarks: item.negativeMarks || 1,
          accessMode: item.accessMode || (item.isFree === false ? 'paid' : 'free'),
          isFree: item.isFree !== false,
          solutionPdfUrl: item.solutionPdfUrl || item.pdfUrl || '',
          videoWalkthroughUrl: item.videoWalkthroughUrl || item.videoUrl || '',
          solutionNote: item.solutionNote || '',
          status: item.status || 'Published',
          scheduledDate: item.scheduledDate,
          scheduledTime: item.scheduledTime,
          attemptsCount: item.attemptsCount || 0,
          questions: item.questions || []
        }));
        setPapers(mapped);
      }
    } catch (err) {
      console.error('Failed to load papers:', err);
    }
  }, []);

  // 2. Fetch Question Bank
  const fetchQuestionBank = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/dpp-pyqs/question-bank');
      if (res && Array.isArray(res.items)) {
        setQuestionBank(res.items);
      }
    } catch (err) {
      console.error('Failed to load question bank:', err);
    }
  }, []);

  // 3. Fetch PDF History
  const fetchPdfHistory = useCallback(async () => {
    try {
      const res = await apiClient.get<any[]>('/dpp-pyqs/pdf-history');
      if (Array.isArray(res)) {
        setPdfHistory(res);
      }
    } catch (err) {
      console.error('Failed to load PDF history:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.allSettled([fetchPapers(), fetchQuestionBank(), fetchPdfHistory()]);
      setIsLoading(false);
    };
    init();
  }, [fetchPapers, fetchQuestionBank, fetchPdfHistory]);

  // Handlers for Paper Actions
  const handleSavePaper = async (paper: PyqPaper) => {
    try {
      const isUpdate = papers.some((p) => p.id === paper.id);
      if (isUpdate) {
        await apiClient.put(`/dpp-pyqs/${paper.id}`, paper);
        showToast(`Paper "${paper.title}" updated successfully.`);
      } else {
        await apiClient.post('/dpp-pyqs', paper);
        showToast(`Paper "${paper.title}" created successfully.`);
      }

      // Also automatically save newly authored questions to the central Question Bank
      if (paper.questions && paper.questions.length > 0) {
        const qbItems = paper.questions.map((q) => ({
          id: `qb-${paper.id}-${q.qNum}`,
          statement: q.statement,
          subject: paper.subject,
          exam: paper.targetExam,
          year: paper.year,
          chapter: q.chapter || paper.chapter,
          difficulty: q.difficulty,
          questionType: q.questionType,
          options: q.options,
          correctKey: q.correctKey,
          correctKeys: q.correctKeys,
          numericalAnswer: q.numericalAnswer,
          numericalTolerance: q.numericalTolerance,
          stepSolution: q.stepSolution,
          dkSirShortcut: q.dkSirShortcut,
          videoUrl: q.videoUrl,
          pdfUrl: q.pdfUrl,
          diagramUrl: q.diagramUrl,
          usageCount: 1,
          usedInPapers: [{ paperId: paper.id, paperTitle: paper.title }],
          tags: [paper.targetExam, String(paper.year), paper.subject]
        }));
        apiClient.post('/dpp-pyqs/question-bank/batch', { questions: qbItems }).catch(() => {});
      }

      await fetchPapers();
      await fetchQuestionBank();
      setEditingPaper(null);
      setActiveTab('papers');
    } catch (err: any) {
      alert('Failed to save paper: ' + (err.message || 'Server error'));
    }
  };

  const handleDuplicatePaper = async (paper: PyqPaper) => {
    const duplicated: PyqPaper = {
      ...paper,
      id: `pyq-dup-${Date.now()}`,
      _id: undefined,
      title: `${paper.title} (Copy)`,
      slug: `${paper.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'Draft',
      attemptsCount: 0
    };
    try {
      await apiClient.post('/dpp-pyqs', duplicated);
      showToast('Paper duplicated as Draft.');
      await fetchPapers();
    } catch (err: any) {
      alert('Failed to duplicate paper: ' + err.message);
    }
  };

  const handleArchivePaper = async (paper: PyqPaper) => {
    const newStatus = paper.status === 'Archived' ? 'Published' : 'Archived';
    try {
      await apiClient.put(`/dpp-pyqs/${paper.id}`, { status: newStatus });
      showToast(`Paper marked as ${newStatus}.`);
      await fetchPapers();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeletePaper = async (paper: PyqPaper) => {
    if (!window.confirm(`Are you sure you want to delete "${paper.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await apiClient.delete(`/dpp-pyqs/${paper.id}`);
      showToast('Paper deleted successfully.');
      await fetchPapers();
    } catch (err: any) {
      alert('Failed to delete paper: ' + err.message);
    }
  };

  // Handlers for Question Bank
  const handleSaveQuestionBankItem = async (item: QuestionBankItem) => {
    try {
      await apiClient.post('/dpp-pyqs/question-bank', item);
      showToast('Question saved to Question Bank.');
      await fetchQuestionBank();
    } catch (err: any) {
      alert('Failed to save question bank item: ' + err.message);
    }
  };

  const handleDeleteQuestionBankItem = async (id: string) => {
    if (!window.confirm('Delete this question from question bank?')) return;
    try {
      await apiClient.delete(`/dpp-pyqs/question-bank/${id}`);
      showToast('Question deleted from bank.');
      await fetchQuestionBank();
    } catch (err: any) {
      alert('Failed to delete question: ' + err.message);
    }
  };

  // Handler for Staged PDF Review -> Open in Create Wizard
  const handleReviewPdfBatch = (record: PdfImportRecord) => {
    const stagedPaper: PyqPaper = {
      id: `pyq-from-pdf-${Date.now()}`,
      badgeCode: `PYQ • ${(record.subject || 'MTH').slice(0, 3).toUpperCase()}`,
      title: `${record.targetExam || 'JEE Main'} ${record.year || 2024} – ${record.subject || 'Mathematics'} – Extracted Paper`,
      slug: `/practice/${Date.now()}`,
      moduleType: 'PYQ',
      subject: (record.subject as any) || 'Mathematics',
      targetExam: record.targetExam || 'JEE Main',
      year: record.year || 2024,
      chapter: 'General',
      chapters: ['General'],
      categoryLabel: `${record.subject || 'Mathematics'} PYQ`,
      questionsCount: record.extractedQuestions.length,
      durationMinutes: 60,
      totalMarks: record.extractedQuestions.length * 4,
      positiveMarks: 4,
      negativeMarks: 1,
      accessMode: 'free',
      isFree: true,
      solutionNote: 'Extracted from PDF with verified options',
      status: 'Draft',
      attemptsCount: 0,
      questions: record.extractedQuestions.map((q: any, i: number) => ({
        id: `q-pdf-rev-${Date.now()}-${i + 1}`,
        qNum: q.qNum || i + 1,
        statement: q.statement,
        subject: (record.subject as any) || 'Mathematics',
        chapter: 'General',
        difficulty: q.difficulty || 'Moderate',
        questionType: 'Single Correct MCQ',
        options: q.options || [],
        correctKey: q.suggestedAnswer || 'A',
        stepSolution: q.stepSolution || '',
        dkSirShortcut: q.dkSirShortcut || '',
        status: q.status || 'EXTRACTED',
        reviewReason: q.reviewReason
      }))
    };

    setEditingPaper(stagedPaper);
    setActiveTab('create');
  };

  return (
    <div className={styles.studioContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: '#238636',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header & Primary Navigation */}
      <div className={styles.studioHeader}>
        <div className={styles.brandInfo}>
          <div className={styles.iconBadge}>
            <Layers size={24} />
          </div>
          <div>
            <h1>PYQ Management Studio</h1>
            <p>High-efficiency authoring, PDF equation extraction, and question banking for DK Academy</p>
          </div>
        </div>

        {/* Primary 5-Tab Navigation */}
        <div className={styles.primaryNav}>
          <button
            className={`${styles.navBtn} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => {
              setEditingPaper(null);
              setActiveTab('dashboard');
            }}
          >
            <LayoutDashboard size={16} /> PYQ Dashboard
          </button>

          <button
            className={`${styles.navBtn} ${activeTab === 'papers' ? styles.active : ''}`}
            onClick={() => {
              setEditingPaper(null);
              setActiveTab('papers');
            }}
          >
            <FileText size={16} /> All PYQ Papers ({papers.length})
          </button>

          <button
            className={`${styles.navBtn} ${activeTab === 'create' ? styles.active : ''}`}
            onClick={() => {
              setEditingPaper(null);
              setActiveTab('create');
            }}
          >
            <PlusCircle size={16} /> {editingPaper ? 'Edit Paper' : 'Create New PYQ'}
          </button>

          <button
            className={`${styles.navBtn} ${activeTab === 'question-bank' ? styles.active : ''}`}
            onClick={() => {
              setEditingPaper(null);
              setActiveTab('question-bank');
            }}
          >
            <Database size={16} /> Question Bank ({questionBank.length})
          </button>

          <button
            className={`${styles.navBtn} ${activeTab === 'pdf-history' ? styles.active : ''}`}
            onClick={() => {
              setEditingPaper(null);
              setActiveTab('pdf-history');
            }}
          >
            <History size={16} /> PDF Import History ({pdfHistory.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PYQ DASHBOARD */}
      {activeTab === 'dashboard' && (
        <PyqStudioDashboard
          papers={papers}
          questionBankCount={questionBank.length}
          recentImports={pdfHistory}
          onNavigateTab={(tab) => {
            setEditingPaper(null);
            setActiveTab(tab);
          }}
          onEditPaper={(paper) => {
            setEditingPaper(paper);
            setActiveTab('create');
          }}
          onPreviewPaper={(paper) => setPreviewPaper(paper)}
        />
      )}

      {/* TAB 2: ALL PYQ PAPERS TABLE */}
      {activeTab === 'papers' && (
        <PyqPapersList
          papers={papers}
          onEditPaper={(paper) => {
            setEditingPaper(paper);
            setActiveTab('create');
          }}
          onPreviewPaper={(paper) => setPreviewPaper(paper)}
          onDuplicatePaper={handleDuplicatePaper}
          onArchivePaper={handleArchivePaper}
          onDeletePaper={handleDeletePaper}
          onCreateNew={() => {
            setEditingPaper(null);
            setActiveTab('create');
          }}
        />
      )}

      {/* TAB 3: CREATE / EDIT WIZARD */}
      {activeTab === 'create' && (
        <PyqCreateWizard
          initialPaper={editingPaper}
          questionBank={questionBank}
          onSavePaper={handleSavePaper}
          onPreviewPaper={(paper) => setPreviewPaper(paper)}
          onCancel={() => {
            setEditingPaper(null);
            setActiveTab('papers');
          }}
        />
      )}

      {/* TAB 4: CENTRALIZED QUESTION BANK */}
      {activeTab === 'question-bank' && (
        <PyqQuestionBankView
          items={questionBank}
          onSaveItem={handleSaveQuestionBankItem}
          onDeleteItem={handleDeleteQuestionBankItem}
        />
      )}

      {/* TAB 5: PDF IMPORT HISTORY */}
      {activeTab === 'pdf-history' && (
        <PyqPdfHistoryView
          history={pdfHistory}
          onReviewBatch={handleReviewPdfBatch}
          onRefresh={fetchPdfHistory}
        />
      )}

      {/* STUDENT PRACTICE CBT PREVIEW MODAL */}
      {previewPaper && (
        <PyqStudentPreviewModal
          paper={previewPaper}
          onClose={() => setPreviewPaper(null)}
        />
      )}
    </div>
  );
};


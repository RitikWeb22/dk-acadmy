import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Database,
  Upload,
  Plus,
  Play,
  Pencil,
  Eye,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import type { PyqPaper, PyqStudioTab, PdfImportRecord } from './types';
import styles from './PyqManagementStudio.module.scss';

interface Props {
  papers: PyqPaper[];
  questionBankCount: number;
  recentImports: PdfImportRecord[];
  onNavigateTab: (tab: PyqStudioTab) => void;
  onEditPaper: (paper: PyqPaper) => void;
  onPreviewPaper: (paper: PyqPaper) => void;
}

export const PyqStudioDashboard: React.FC<Props> = ({
  papers,
  questionBankCount,
  recentImports,
  onNavigateTab,
  onEditPaper,
  onPreviewPaper
}) => {
  const publishedCount = papers.filter((p) => p.status === 'Published').length;
  const draftCount = papers.filter((p) => p.status === 'Draft').length;
  const scheduledCount = papers.filter((p) => p.status === 'Scheduled').length;

  const pendingReviewImports = recentImports.filter(
    (imp) => imp.status === 'REVIEW_REQUIRED'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Ribbon */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Total PYQ Papers</div>
            <div className={styles.kpiValue}>{papers.length}</div>
          </div>
          <div className={styles.kpiIconWrapper}>
            <FileText size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Published</div>
            <div className={styles.kpiValue} style={{ color: '#3fb950' }}>
              {publishedCount}
            </div>
          </div>
          <div className={styles.kpiIconWrapper} style={{ color: '#3fb950', background: 'rgba(46,160,67,0.1)' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Drafts</div>
            <div className={styles.kpiValue} style={{ color: '#8b949e' }}>
              {draftCount}
            </div>
          </div>
          <div className={styles.kpiIconWrapper} style={{ color: '#8b949e' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Scheduled Release</div>
            <div className={styles.kpiValue} style={{ color: '#d29922' }}>
              {scheduledCount}
            </div>
          </div>
          <div className={styles.kpiIconWrapper} style={{ color: '#d29922', background: 'rgba(210,153,34,0.1)' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Question Bank</div>
            <div className={styles.kpiValue} style={{ color: '#a371f7' }}>
              {questionBankCount}
            </div>
          </div>
          <div className={styles.kpiIconWrapper} style={{ color: '#a371f7', background: 'rgba(163,113,247,0.1)' }}>
            <Database size={22} />
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div className={styles.actionBanner}>
        <div className={styles.bannerText}>
          <h3> PYQ Management </h3>
          <p>
            Create standardized previous-year question sets, import 200+ questions directly from PDF with automatic equation extraction, and schedule releases.
          </p>
        </div>
        <div className={styles.bannerActions}>
          <button className={styles.btnPrimary} onClick={() => onNavigateTab('create')}>
            <Plus size={16} /> Create New PYQ
          </button>
          <button className={styles.btnSecondary} onClick={() => onNavigateTab('create')}>
            <Upload size={16} /> Upload PDF Question Paper
          </button>
          <button className={styles.btnSecondary} onClick={() => onNavigateTab('question-bank')}>
            <Database size={16} /> Browse Question Bank
          </button>
        </div>
      </div>

      {/* PDF Staging Attention Alert if any */}
      {pendingReviewImports.length > 0 && (
        <div
          style={{
            background: 'rgba(210, 153, 34, 0.1)',
            border: '1px solid rgba(210, 153, 34, 0.3)',
            borderRadius: 8,
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#d29922" />
            <div>
              <div style={{ fontWeight: 600, color: '#f0f6fc', fontSize: '0.9rem' }}>
                {pendingReviewImports.length} PDF Extraction{pendingReviewImports.length > 1 ? 's' : ''} Awaiting Admin Review
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                Extracted questions contain suggestions that must be verified before publishing.
              </div>
            </div>
          </div>
          <button className={styles.btnSecondary} onClick={() => onNavigateTab('pdf-history')}>
            Review Staged Questions <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Recently Updated Papers Table */}
      <div className={styles.contentCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerTitle}>
            <h2>Recently Updated PYQ Papers</h2>
            <p>Directly manage papers, inspect student CBT experience, or edit questions.</p>
          </div>
          <button className={styles.btnSecondary} onClick={() => onNavigateTab('papers')}>
            View All ({papers.length})
          </button>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.saasTable}>
            <thead>
              <tr>
                <th>Paper Title</th>
                <th>Exam</th>
                <th>Year</th>
                <th>Subject</th>
                <th>Questions</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {papers.slice(0, 6).map((paper) => (
                <tr key={paper.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f0f6fc' }}>{paper.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: 2 }}>{paper.slug}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{paper.targetExam || 'JEE Main'}</span>
                  </td>
                  <td>{paper.year || 2024}</td>
                  <td>
                    <span style={{ color: '#79c0ff' }}>{paper.subject}</span>
                    {paper.chapter && (
                      <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>{paper.chapter}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{paper.questions?.length || paper.questionsCount || 0}</span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        paper.status === 'Published'
                          ? styles.published
                          : paper.status === 'Scheduled'
                          ? styles.scheduled
                          : paper.status === 'Archived'
                          ? styles.archived
                          : styles.draft
                      }`}
                    >
                      {paper.status || 'Published'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className={styles.btnSecondary}
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Student Preview"
                        onClick={() => onPreviewPaper(paper)}
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        className={styles.btnPrimary}
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Edit Paper"
                        onClick={() => onEditPaper(paper)}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {papers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8b949e' }}>
                    No PYQ papers found. Click "Create New PYQ" or "Upload PDF Question Paper" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

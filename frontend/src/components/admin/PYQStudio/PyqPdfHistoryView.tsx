import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';
import type { PdfImportRecord, PyqQuestion } from './types';
import { MathText } from '../../ui/MathText/MathText';
import styles from './PyqManagementStudio.module.scss';

interface Props {
  history: PdfImportRecord[];
  onReviewBatch: (record: PdfImportRecord) => void;
  onRefresh: () => void;
}

export const PyqPdfHistoryView: React.FC<Props> = ({
  history,
  onReviewBatch,
  onRefresh
}) => {
  const [selectedRecord, setSelectedRecord] = useState<PdfImportRecord | null>(null);

  return (
    <div className={styles.contentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitle}>
          <h2>PDF Import &amp; Extraction History ({history.length})</h2>
          <p>
            Audit logs of uploaded PDF question papers, equation detection rates, and unverified staged questions.
          </p>
        </div>

        <button className={styles.btnSecondary} onClick={onRefresh}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.saasTable}>
          <thead>
            <tr>
              <th>PDF Document</th>
              <th>Uploaded Date</th>
              <th>Detected</th>
              <th>Extracted OK</th>
              <th>Needs Review</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((rec) => (
              <tr key={rec.id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} color="#58a6ff" />
                    {rec.fileName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: 2 }}>
                    {(rec.fileSize / 1024).toFixed(1)} KB • {rec.targetExam || 'JEE Main'} • {rec.subject || 'Mathematics'}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                    {new Date(rec.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{rec.totalDetected}</span>
                </td>
                <td>
                  <span style={{ color: '#3fb950', fontWeight: 600 }}>{rec.successfulCount}</span>
                </td>
                <td>
                  <span style={{ color: rec.needsReviewCount > 0 ? '#d29922' : '#8b949e', fontWeight: 600 }}>
                    {rec.needsReviewCount}
                  </span>
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      rec.status === 'COMPLETED'
                        ? styles.published
                        : rec.status === 'REVIEW_REQUIRED'
                        ? styles.scheduled
                        : styles.archived
                    }`}
                  >
                    {rec.status === 'REVIEW_REQUIRED' ? 'Needs Review' : rec.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedRecord(rec)}
                    >
                      <Eye size={13} /> Review Staged Questions
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {history.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#8b949e' }}>
                  No PDF imports found in history. Upload a PDF paper in "Create New PYQ" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* STAGED QUESTIONS REVIEW MODAL */}
      {selectedRecord && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: 960 }}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Staged Questions: {selectedRecord.fileName}</h3>
                <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: 3 }}>
                  Total {selectedRecord.totalDetected} questions • {selectedRecord.needsReviewCount} require review
                </div>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(null)} />
            </div>

            <div className={styles.modalBody}>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(selectedRecord.extractedQuestions || []).map((q: any, i: number) => (
                  <div
                    key={q.tempId || i}
                    style={{
                      background: '#0d1117',
                      border: q.status === 'NEEDS_REVIEW' ? '1px solid #d29922' : '1px solid #30363d',
                      borderRadius: 8,
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.9rem' }}>
                        Question {q.qNum || i + 1}
                      </span>
                      {q.status === 'NEEDS_REVIEW' ? (
                        <span style={{ background: 'rgba(210,153,34,0.15)', color: '#d29922', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem' }}>
                          Needs Review: {q.reviewReason || 'Unverified'}
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(46,160,67,0.15)', color: '#3fb950', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem' }}>
                          Verified
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#f0f6fc', lineHeight: 1.6 }}>
                      <MathText text={q.statement} />
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        {q.options.map((opt: any) => (
                          <div
                            key={opt.key}
                            style={{
                              background: opt.key === q.suggestedAnswer ? 'rgba(46,160,67,0.1)' : '#161b22',
                              border: opt.key === q.suggestedAnswer ? '1px solid #2ea043' : '1px solid #21262d',
                              borderRadius: 4,
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            <strong>({opt.key})</strong> <MathText text={opt.text} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  onReviewBatch(selectedRecord);
                  setSelectedRecord(null);
                }}
              >
                Open in Paper Creation Wizard →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { MathText } from '../../ui/MathText/MathText';
import { parseWordQuestions, type ParsedWordQuestion } from '../../../utils/wordPasteParser';
import styles from './PasteWordQuestionModal.module.scss';

export interface PasteWordQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (parsedQuestions: ParsedWordQuestion[]) => void;
  title?: string;
  contextLabel?: string;
  initialText?: string;
}

export const PasteWordQuestionModal: React.FC<PasteWordQuestionModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  title = 'Paste Word / PDF Question',
  contextLabel = 'Test Series & Problem Sets',
  initialText = ''
}) => {
  const [pasteText, setPasteText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      if (initialText) {
        setPasteText(initialText);
      }
    }
  }, [isOpen, initialText]);

  const parsedQuestions = useMemo(() => {
    if (!pasteText.trim()) return [];
    return parseWordQuestions(pasteText);
  }, [pasteText]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleAddClick = () => {
    if (parsedQuestions.length === 0) return;
    onAddQuestions(parsedQuestions);
    setPasteText('');
    onClose();
  };

  const handleLoadSample = () => {
    const sample = `Let $[t]$ denote the greatest integer less than or equal to t. Let $f:[0,\\infty) \\to \\mathbb{R}$ be a function defined by $f(x)=[\\frac{x}{2}+3]-[\\sqrt{x}]$. Let S be the set of all points in the interval $[0,8]$ at which f is not continuous. Then $\\sum_{a \\in S} a$ is equal to _.
JEE Main 2024 (Online) 6th April Evening Shift

2. $\\lim_{n \\to \\infty} \\frac{(1^2-1)(n-1)+(2^2-2)(n-2)+\\cdots+((n-1)^2-(n-1))\\cdot 1}{(1^3+2^3+\\cdots\\cdots+n^3 )-(1^2+2^2+\\cdots\\cdot+n^2 )}$ is equal to :
(A) 1/3
(B) 1/2
(C) 2/3
(D) 1
Ans: (A)`;
    setPasteText(sample);
  };

  return createPortal(
    <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>{title}</h3>
              <p className={styles.modalSub}>
                Paste question statement with options or numerical answer from Word, PDF, or notes.
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.textareaWrap}>
            <div className={styles.textareaLabelRow}>
              <span>Paste Question Statement &amp; Options Here:</span>
              <button
                type="button"
                onClick={handleLoadSample}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 600
                }}
              >
                + Insert Sample Format
              </button>
            </div>
            <textarea
              className={styles.pasteTextarea}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Paste your Word or PDF question here, e.g.:\n\nLet $[t]$ denote the greatest integer less than or equal to t. Let $f(x)=[\\frac{x}{2}+3]-[\\sqrt{x}]$ ... Then the sum is equal to _.\nJEE Main 2024 (Online) 6th April Evening Shift\n\nOr Multiple Choice:\nFind the limit $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.\n(A) 0\n(B) 1\n(C) -1\n(D) Does not exist\nAns: (B)`}
              rows={6}
            />
          </div>

          {/* Live Formatted Math Preview */}
          {parsedQuestions.length > 0 && (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <span>✨ Auto-Extracted Preview ({parsedQuestions.length} Question{parsedQuestions.length > 1 ? 's' : ''} Detected)</span>
                <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ MathJax / KaTeX Rendered</span>
              </div>

              {parsedQuestions.map((q, idx) => (
                <div key={idx} className={styles.questionPreviewCard}>
                  <div className={styles.qMetaRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.qNumberPill}>Question {idx + 1}</span>
                      <span
                        className={styles.qTypeBadge}
                        style={{
                          background: q.type === 'NUMERICAL' ? '#eff6ff' : '#f0fdf4',
                          color: q.type === 'NUMERICAL' ? '#1d4ed8' : '#15803d',
                          border: `1px solid ${q.type === 'NUMERICAL' ? '#bfdbfe' : '#bbf7d0'}`
                        }}
                      >
                        {q.type === 'NUMERICAL' ? 'Numerical Answer' : 'Single Choice MCQ'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {q.examTag && (
                        <span className={styles.examTagBadge}>{q.examTag}</span>
                      )}
                      {q.type === 'NUMERICAL' && q.numericalAnswer && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                          Ans: {q.numericalAnswer}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statement */}
                  <div className={styles.statementBox}>
                    <MathText text={q.statement} />
                  </div>

                  {/* Options (if MCQ) */}
                  {q.type === 'SINGLE_CORRECT' && q.options && q.options.some((o) => o.text && o.text.trim()) && (
                    <div className={styles.optionsGrid}>
                      {q.options.map((opt) => {
                        const isCorrect = q.correctKey === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`${styles.optionItem} ${isCorrect ? styles.correctOption : ''}`}
                          >
                            <span className={`${styles.optionKey} ${isCorrect ? styles.correctKey : ''}`}>
                              {opt.key}
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <MathText text={opt.text || `Option ${opt.key}`} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Solution derivation or shortcut preview if present */}
                  {(q.solution || q.shortcut) && (
                    <div style={{ fontSize: '11.5px', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      {q.solution && <div><strong>Solution:</strong> {q.solution}</div>}
                      {q.shortcut && <div style={{ color: '#2563eb', marginTop: '2px' }}><strong>Shortcut:</strong> {q.shortcut}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.addQuestionsBtn}
            onClick={handleAddClick}
            disabled={parsedQuestions.length === 0}
          >
            <CheckCircle2 size={16} />
            <span>
              Add {parsedQuestions.length > 0 ? `${parsedQuestions.length} Question${parsedQuestions.length > 1 ? 's' : ''}` : 'Question'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


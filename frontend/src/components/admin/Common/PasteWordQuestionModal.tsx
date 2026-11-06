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
  const [parsedList, setParsedList] = useState<ParsedWordQuestion[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialText) {
        setPasteText(initialText);
        setParsedList(parseWordQuestions(initialText));
      } else {
        setParsedList(parseWordQuestions(pasteText));
      }
    }
  }, [isOpen, initialText]);

  // Synchronize parsedList when raw pasteText changes
  useEffect(() => {
    if (!pasteText.trim()) {
      setParsedList([]);
      return;
    }
    const auto = parseWordQuestions(pasteText);
    setParsedList(auto);
  }, [pasteText]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Handlers for modifying extracted fields independently
  const updateStatement = (qIdx: number, val: string) => {
    setParsedList((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, statement: val } : q))
    );
  };

  const updateOptionText = (qIdx: number, optKey: 'A' | 'B' | 'C' | 'D', val: string) => {
    setParsedList((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = q.options.map((o) => (o.key === optKey ? { ...o, text: val } : o));
        return { ...q, options: newOpts };
      })
    );
  };

  const updateCorrectKey = (qIdx: number, optKey: 'A' | 'B' | 'C' | 'D') => {
    setParsedList((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctKey: optKey } : q))
    );
  };

  const updateNumericalAnswer = (qIdx: number, val: string) => {
    setParsedList((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, numericalAnswer: val } : q))
    );
  };

  const handleAllFetchClick = () => {
    if (parsedList.length === 0) return;
    onAddQuestions(parsedList);
    setPasteText('');
    setParsedList([]);
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
              <span>Paste Raw Word / PDF Text Here:</span>
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
              placeholder={`Paste question and options from Word/PDF here...\n\nExample:\nLet $[t]$ denote the greatest integer less than or equal to t. Let $f(x)=[\\frac{x}{2}+3]-[\\sqrt{x}]$ ... Then the sum is equal to _.\nJEE Main 2024 (Online) 6th April Evening Shift\n\nOr Multiple Choice:\nFind the limit $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.\n(A) 0\n(B) 1\n(C) -1\n(D) Does not exist\nAns: (B)`}
              rows={4}
            />
          </div>

          {/* Separated Extracted Question & Options Section */}
          {parsedList.length > 0 && (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <span>✨ Extracted &amp; Separated ({parsedList.length} Question{parsedList.length > 1 ? 's' : ''} Ready)</span>
                <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ Question Alag &amp; Options Alag Se Extracted</span>
              </div>

              <div className={styles.extractedQuestionsList}>
                {parsedList.map((q, idx) => (
                  <div key={idx} className={styles.questionEditCard}>
                    <div className={styles.cardHeaderRow}>
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

                      {q.examTag && (
                        <span className={styles.examTagBadge}>{q.examTag}</span>
                      )}
                    </div>

                    {/* Question Statement (Alag Se) */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldTitle}>
                        <span>Question Statement (Question Alag Se):</span>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>Editable text &amp; KaTeX Preview</span>
                      </label>
                      <textarea
                        className={styles.statementInputTextarea}
                        value={q.statement}
                        onChange={(e) => updateStatement(idx, e.target.value)}
                        placeholder="Extracted Question Statement..."
                        rows={3}
                      />
                      <div className={styles.statementPreviewWrap}>
                        <MathText text={q.statement || 'Empty statement'} />
                      </div>
                    </div>

                    {/* Options (Alag Se) - If MCQ */}
                    {q.type === 'SINGLE_CORRECT' && q.options && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldTitle}>
                          <span>Answer Choices (Options Alag Se - A, B, C, D):</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#16a34a' }}>Click ✓ Key to change correct answer</span>
                        </label>
                        <div className={styles.optionsInputsGrid}>
                          {q.options.map((opt) => {
                            const isCorrect = q.correctKey === opt.key;
                            return (
                              <div
                                key={opt.key}
                                className={`${styles.optionInputCard} ${isCorrect ? styles.isCorrect : ''}`}
                              >
                                <div className={styles.optionHeader}>
                                  <span className={`${styles.optionKeyBadge} ${isCorrect ? styles.correctBadge : ''}`}>
                                    {opt.key}
                                  </span>
                                  <button
                                    type="button"
                                    className={`${styles.correctRadioBtn} ${isCorrect ? styles.activeCorrect : ''}`}
                                    onClick={() => updateCorrectKey(idx, opt.key)}
                                    title={`Mark Option ${opt.key} as correct answer`}
                                  >
                                    {isCorrect ? '✓ Correct Key' : 'Set as Key'}
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  className={styles.optionTextInput}
                                  value={opt.text}
                                  onChange={(e) => updateOptionText(idx, opt.key, e.target.value)}
                                  placeholder={`Option ${opt.key} formula or text...`}
                                />
                                {opt.text && (
                                  <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#334155' }}>
                                    <MathText text={opt.text} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Numerical Answer (Alag Se) - If Numerical */}
                    {q.type === 'NUMERICAL' && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldTitle}>
                          <span>Numerical Answer Key (Answer Alag Se):</span>
                        </label>
                        <div className={styles.numericalInputWrap}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Ans Key =</span>
                          <input
                            type="text"
                            className={styles.numericalInput}
                            value={q.numericalAnswer || ''}
                            onChange={(e) => updateNumericalAnswer(idx, e.target.value)}
                            placeholder="e.g. 16 or 3.14"
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Integer or decimal value</span>
                        </div>
                      </div>
                    )}

                    {/* Solution or Shortcut if present */}
                    {(q.solution || q.shortcut) && (
                      <div style={{ fontSize: '11.5px', color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {q.solution && <div><strong>Solution:</strong> {q.solution}</div>}
                        {q.shortcut && <div style={{ color: '#2563eb', marginTop: '3px' }}><strong>Shortcut:</strong> {q.shortcut}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
            className={styles.allFetchBtn}
            onClick={handleAllFetchClick}
            disabled={parsedList.length === 0}
            title="Auto-fill question statement and options into question inputs"
          >
            <Sparkles size={16} />
            <span>
              ⚡ All Fetch ({parsedList.length > 0 ? `${parsedList.length} Qs` : '0 Qs'}) &amp; Auto-Fill Inputs
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


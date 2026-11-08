import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';
import { MathText } from '../../ui/MathText/MathText';
import { parseWordQuestions, cleanWordMathArtifacts, type ParsedWordQuestion } from '../../../utils/wordPasteParser';
import { extractMathFromHtml, normalizeMathString } from '../../../utils/mathImportRenderSystem/pasteHandler';
import { htmlResultLosesContent } from '../../../utils/pasteContentGuard';
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

  const updateCorrectKey = (qIdx: number, optKey: 'A' | 'B' | 'C' | 'D') => {
    setParsedList((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctKey: optKey } : q))
    );
  };

  const handleAllFetchClick = () => {
    if (parsedList.length === 0) return;
    onAddQuestions(parsedList);
    setPasteText('');
    setParsedList([]);
    onClose();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const cd = e.clipboardData;
    if (!cd) return;
    e.preventDefault();
    const html = cd.getData('text/html') || '';
    const plain = cd.getData('text/plain') || cd.getData('text') || '';

    let textToUse = plain;
    const hasWordLinear = /[■█┤]|\\matrix|\\eqarray|\\cases/.test(plain);

    if (html && (/<(?:m:)?(?:oMath|oMathPara|math)\b|<!--\[if\s+gte\s+msEquation/i.test(html) || /<table|<tr|<p|<span|<div/i.test(html))) {
      const converted = extractMathFromHtml(html);
      const isComplete = converted.trim() && !htmlResultLosesContent(plain, converted);
      const preservesLinear = !hasWordLinear || /\\begin\{(?:cases|matrix|bmatrix|pmatrix|vmatrix|aligned)\}/.test(converted);
      if (isComplete && preservesLinear) {
        textToUse = converted;
      }
    }
    // Clean any accidental warning banner text or leading dots
    textToUse = cleanWordMathArtifacts(textToUse)
      .replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '')
      .replace(/^[\s\u2022\u25E6\u25AA\u25CF.\-—]+\s*/g, '')
      .trim();

    setPasteText(textToUse);
    const parsed = parseWordQuestions(textToUse);
    setParsedList(parsed);
  };

  const handleLoadSample = () => {
    const sample = `If ∫_0^1 1/(5+2x-2x^2 )(1+e^((2-4x)) ) dx=1/α log_e((α+1)/β),α,β>0, then α^4-β^4 is equal to.
A -21.       B 21.       C 19.         D 0
Ans: B`;
    const cleaned = cleanWordMathArtifacts(sample);
    setPasteText(cleaned);
    setParsedList(parseWordQuestions(cleaned));
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
                Paste question statement with options from Word, PDF, or notes.
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
              onChange={(e) => {
                const val = e.target.value;
                setPasteText(val);
                if (val.trim()) {
                  const cleaned = cleanWordMathArtifacts(val);
                  const parsed = parseWordQuestions(cleaned);
                  setParsedList(parsed);
                } else {
                  setParsedList([]);
                }
              }}
              onPaste={handlePaste}
              placeholder={`Paste question and options from Word/PDF here...\n\nExample:\nIf ∫_0^1 1/(5+2x-2x^2 )(1+e^((2-4x)) ) dx=1/α log_e((α+1)/β),α,β>0, then α^4-β^4 is equal to.\nA -21.       B 21.       C 19.         D 0\nAns: B`}
              rows={4}
            />
          </div>

          {/* Clean Extracted Live Preview Only */}
          {parsedList.length > 0 && (
            <div className={styles.previewContainer}>
              <div className={styles.extractedQuestionsList}>
                {parsedList.map((q, idx) => (
                  <div key={idx} className={styles.questionPreviewCard}>
                    {/* Exam Tag if detected */}
                    {q.examTag && (
                      <div className={styles.examTagRow}>
                        <span className={styles.examTagBadge}>{q.examTag}</span>
                      </div>
                    )}

                    {/* Question Statement Live KaTeX Preview */}
                    <div className={styles.statementPreviewBox}>
                      <MathText text={q.statement || 'Empty statement'} />
                    </div>

                    {/* Options Live KaTeX Preview Grid (A, B, C, D) */}
                    <div className={styles.optionsPreviewGrid}>
                      {(q.options && q.options.length > 0
                        ? q.options
                        : [
                            { key: 'A' as const, text: '' },
                            { key: 'B' as const, text: '' },
                            { key: 'C' as const, text: '' },
                            { key: 'D' as const, text: '' }
                          ]
                      ).map((opt) => {
                        const isCorrect = q.correctKey === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`${styles.optionPreviewTile} ${isCorrect ? styles.isCorrectOpt : ''}`}
                            onClick={() => updateCorrectKey(idx, opt.key)}
                            title={`Option ${opt.key} (Click to set as correct answer)`}
                          >
                            <span className={`${styles.optionKeyCircle} ${isCorrect ? styles.correctCircle : ''}`}>
                              {opt.key}
                            </span>
                            <div className={styles.optionMathText}>
                              <MathText text={opt.text || '-'} />
                            </div>
                            {isCorrect && (
                              <span className={styles.correctPillTag}>✓ Correct</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Solution or Shortcut if present */}
                    {(q.solution || q.shortcut) && (
                      <div className={styles.solutionPreviewBox}>
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


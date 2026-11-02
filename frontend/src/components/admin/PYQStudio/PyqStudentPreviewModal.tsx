import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import type { PyqPaper, PyqQuestion } from './types';
import { MathText } from '../../ui/MathText/MathText';
import styles from './PyqManagementStudio.module.scss';

interface Props {
  paper: PyqPaper;
  onClose: () => void;
}

export const PyqStudentPreviewModal: React.FC<Props> = ({ paper, onClose }) => {
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showSolution, setShowSolution] = useState(false);

  const questions = paper.questions || [];
  const currentQ = questions[activeQIndex] || questions[0];

  const handleSelectOption = (key: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [activeQIndex]: key }));
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent} style={{ maxWidth: 1040, maxHeight: '92vh' }}>
        {/* CBT Simulated Header */}
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  background: '#16a34a',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 4
                }}
              >
                STUDENT PRACTICE SIMULATION
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {paper.targetExam || 'JEE Main'} • {paper.year || 2024}
              </span>
            </div>
            <h3 style={{ margin: '0.35rem 0 0 0', fontSize: '1.1rem', color: '#0f172a' }}>
              {paper.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Simulated Live Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                padding: '0.4rem 0.75rem',
                color: '#2563eb',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <Clock size={16} />
              <span>{paper.durationMinutes || 60}:00 Left</span>
            </div>

            <X size={22} style={{ cursor: 'pointer', color: '#64748b' }} onClick={onClose} />
          </div>
        </div>

        {/* Question Palette Strip */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            overflowX: 'auto'
          }}
        >
          {questions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = activeQIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveQIndex(idx)}
                style={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 6,
                  border: isCurrent ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: isCurrent
                    ? '#2563eb'
                    : isAnswered
                    ? '#dcfce7'
                    : '#ffffff',
                  color: isCurrent ? '#ffffff' : isAnswered ? '#166534' : '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* CBT Main Question Area */}
        <div className={styles.modalBody} style={{ padding: '1.75rem 2rem', gap: '1.5rem', background: '#ffffff' }}>
          {currentQ ? (
            <>
              {/* Question Metadata Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    Question {activeQIndex + 1} of {questions.length}
                  </span>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {currentQ.questionType || 'Single Choice MCQ'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    • Chapter: {currentQ.chapter || paper.chapter}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  Marking Scheme: +{paper.positiveMarks || 4} / -{paper.negativeMarks || 1}
                </div>
              </div>

              {/* Statement */}
              <div
                style={{
                  fontSize: '1.05rem',
                  color: '#0f172a',
                  lineHeight: 1.8,
                  padding: '0.5rem 0'
                }}
              >
                <MathText text={currentQ.statement} />
              </div>

              {/* Diagram if present */}
              {currentQ.diagramUrl && (
                <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                  <img
                    src={currentQ.diagramUrl}
                    alt="Question Diagram"
                    style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6, border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}

              {/* Options */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedAnswers[activeQIndex] === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key)}
                        style={{
                          background: isSelected ? '#eff6ff' : '#f8fafc',
                          border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: isSelected ? '#2563eb' : '#e2e8f0',
                            color: isSelected ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {opt.key}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#0f172a', flex: 1 }}>
                          <MathText text={opt.text} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Solution Inspector Toggle */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setShowSolution(!showSolution)}
                >
                  <Sparkles size={15} color="#d97706" />
                  {showSolution ? 'Hide Solution Derivation' : 'Inspect Mathematical Derivation & Shortcuts'}
                </button>

                {showSolution && (
                  <div
                    style={{
                      marginTop: '1rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 700 }}>
                      <CheckCircle2 size={16} /> Verified Correct Option: ({currentQ.correctKey})
                    </div>

                    {currentQ.stepSolution && (
                      <div>
                        <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.85rem', marginBottom: 4 }}>
                          Step-by-Step Mathematical Derivation:
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>
                          <MathText text={currentQ.stepSolution} />
                        </div>
                      </div>
                    )}

                    {currentQ.dkSirShortcut && (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: 6,
                          padding: '0.75rem',
                          color: '#b45309',
                          fontSize: '0.85rem'
                        }}
                      >
                        <strong>DK Sir Kota Speed Shortcut: </strong> {currentQ.dkSirShortcut}
                      </div>
                    )}

                    {(currentQ.videoUrl || paper.videoWalkthroughUrl) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#2563eb' }}>
                        <Video size={16} /> Video Explanation: {currentQ.videoUrl || paper.videoWalkthroughUrl}
                      </div>
                    )}

                    {(currentQ.pdfUrl || paper.solutionPdfUrl) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#2563eb' }}>
                        <FileText size={16} /> Solution PDF: {currentQ.pdfUrl || paper.solutionPdfUrl}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No questions in this paper.
            </div>
          )}
        </div>

        {/* CBT Navigation Footer */}
        <div className={styles.modalFooter} style={{ justifyContent: 'space-between', background: '#f8fafc' }}>
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={activeQIndex === 0}
            onClick={() => setActiveQIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={16} /> Previous Question
          </button>

          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Question {activeQIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            className={styles.btnPrimary}
            disabled={activeQIndex >= questions.length - 1}
            onClick={() => setActiveQIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next Question <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};


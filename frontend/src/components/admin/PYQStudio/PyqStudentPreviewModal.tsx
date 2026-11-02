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
            background: '#0d1117',
            borderBottom: '1px solid #30363d',
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
                  background: '#238636',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 4
                }}
              >
                STUDENT PRACTICE SIMULATION
              </span>
              <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                {paper.targetExam || 'JEE Main'} • {paper.year || 2024}
              </span>
            </div>
            <h3 style={{ margin: '0.35rem 0 0 0', fontSize: '1.1rem', color: '#f0f6fc' }}>
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
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 6,
                padding: '0.4rem 0.75rem',
                color: '#58a6ff',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <Clock size={16} />
              <span>{paper.durationMinutes || 60}:00 Left</span>
            </div>

            <X size={22} style={{ cursor: 'pointer', color: '#8b949e' }} onClick={onClose} />
          </div>
        </div>

        {/* Question Palette Strip */}
        <div
          style={{
            background: '#161b22',
            borderBottom: '1px solid #21262d',
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
                  border: isCurrent ? '2px solid #58a6ff' : '1px solid #30363d',
                  background: isCurrent
                    ? '#1f6feb'
                    : isAnswered
                    ? 'rgba(46,160,67,0.2)'
                    : '#0d1117',
                  color: isCurrent || isAnswered ? '#ffffff' : '#8b949e',
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
        <div className={styles.modalBody} style={{ padding: '1.75rem 2rem', gap: '1.5rem' }}>
          {currentQ ? (
            <>
              {/* Question Metadata Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #21262d'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f6fc' }}>
                    Question {activeQIndex + 1} of {questions.length}
                  </span>
                  <span
                    style={{
                      background: '#21262d',
                      color: '#c9d1d9',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.75rem'
                    }}
                  >
                    {currentQ.questionType || 'Single Choice MCQ'}
                  </span>
                  <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>
                    • Chapter: {currentQ.chapter || paper.chapter}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#3fb950', fontWeight: 600 }}>
                  Marking Scheme: +{paper.positiveMarks || 4} / -{paper.negativeMarks || 1}
                </div>
              </div>

              {/* Statement */}
              <div
                style={{
                  fontSize: '1.05rem',
                  color: '#f0f6fc',
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
                    style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6, border: '1px solid #30363d' }}
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
                          background: isSelected ? 'rgba(31,111,235,0.15)' : '#0d1117',
                          border: isSelected ? '1px solid #58a6ff' : '1px solid #30363d',
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
                            background: isSelected ? '#1f6feb' : '#21262d',
                            color: isSelected ? '#ffffff' : '#8b949e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {opt.key}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#f0f6fc', flex: 1 }}>
                          <MathText text={opt.text} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Solution Inspector Toggle */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid #21262d', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setShowSolution(!showSolution)}
                >
                  <Sparkles size={15} color="#e3b341" />
                  {showSolution ? 'Hide Solution Derivation' : 'Inspect Mathematical Derivation & Shortcuts'}
                </button>

                {showSolution && (
                  <div
                    style={{
                      marginTop: '1rem',
                      background: '#0d1117',
                      border: '1px solid #30363d',
                      borderRadius: 8,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3fb950', fontWeight: 700 }}>
                      <CheckCircle2 size={16} /> Verified Correct Option: ({currentQ.correctKey})
                    </div>

                    {currentQ.stepSolution && (
                      <div>
                        <div style={{ fontWeight: 600, color: '#79c0ff', fontSize: '0.85rem', marginBottom: 4 }}>
                          Step-by-Step Mathematical Derivation:
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#c9d1d9', lineHeight: 1.6 }}>
                          <MathText text={currentQ.stepSolution} />
                        </div>
                      </div>
                    )}

                    {currentQ.dkSirShortcut && (
                      <div
                        style={{
                          background: 'rgba(227,179,65,0.08)',
                          border: '1px solid rgba(227,179,65,0.25)',
                          borderRadius: 6,
                          padding: '0.75rem',
                          color: '#e3b341',
                          fontSize: '0.85rem'
                        }}
                      >
                        <strong>DK Sir Kota Speed Shortcut: </strong> {currentQ.dkSirShortcut}
                      </div>
                    )}

                    {(currentQ.videoUrl || paper.videoWalkthroughUrl) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#58a6ff' }}>
                        <Video size={16} /> Video Explanation: {currentQ.videoUrl || paper.videoWalkthroughUrl}
                      </div>
                    )}

                    {(currentQ.pdfUrl || paper.solutionPdfUrl) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#79c0ff' }}>
                        <FileText size={16} /> Solution PDF: {currentQ.pdfUrl || paper.solutionPdfUrl}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e' }}>
              No questions in this paper.
            </div>
          )}
        </div>

        {/* CBT Navigation Footer */}
        <div className={styles.modalFooter} style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={activeQIndex === 0}
            onClick={() => setActiveQIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={16} /> Previous Question
          </button>

          <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>
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


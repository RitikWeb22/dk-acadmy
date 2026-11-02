import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Check,
  X,
  Filter,
} from 'lucide-react';
import type { TestSeriesItem, TestAttempt } from '../../../types';
import styles from './AnswerReviewView.module.scss';
import { MathText } from '../../ui/MathText/MathText';

type ReviewFilterType = 'All' | 'Incorrect' | 'Unattempted' | 'Marked';

interface AnswerReviewViewProps {
  test: TestSeriesItem;
  attempt: TestAttempt;
  onBackToResults: () => void;
  onBackToCatalog: () => void;
}

export const AnswerReviewView: React.FC<AnswerReviewViewProps> = ({
  test,
  attempt,
  onBackToResults,
  onBackToCatalog,
}) => {
  const [filter, setFilter] = useState<ReviewFilterType>('All');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Safe empty questions fallback
  if (!test?.questions || test.questions.length === 0) {
    return (
      <div className={styles.reviewContainer}>
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '40px auto', background: '#FFFFFF', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Questions to Review</h3>
          <p style={{ color: '#64748B', marginBottom: '20px' }}>This test series currently does not contain authored questions.</p>
          <button type="button" onClick={onBackToCatalog} style={{ padding: '8px 20px', background: '#2563EB', color: '#FFF', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  // Filter questions based on student's performance
  const checkIsCorrect = (q: any, r: any) => {
    if (!r) return false;
    const isAnswered = Boolean(r?.numericalValue?.trim() || r?.selectedOption);
    if (!isAnswered) return false;

    const isNum = q.type === 'NUMERICAL' || q.section === 'B' || (!q.options || q.options.length === 0);
    if (isNum) {
      const studentVal = (r.numericalValue ?? r.selectedOption ?? '').trim();
      const correctVal = String(q.numericalAnswer ?? q.correctAnswer ?? '').trim();
      if (studentVal && correctVal && !isNaN(Number(studentVal)) && !isNaN(Number(correctVal))) {
        return Math.abs(Number(studentVal) - Number(correctVal)) < 0.001;
      }
      return studentVal.toLowerCase() === correctVal.toLowerCase();
    }
    return r.selectedOption === q.correctAnswer;
  };

  const filteredQuestions = (test.questions || []).filter((q) => {
    if (!q) return false;
    const qId = q.id || (q as any)?._id;
    const resp = attempt?.responses?.[qId];
    const isAnswered = Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
    const isCorrect = checkIsCorrect(q, resp);

    if (filter === 'Incorrect') {
      return isAnswered && !isCorrect;
    }
    if (filter === 'Unattempted') {
      return !isAnswered;
    }
    if (filter === 'Marked') {
      return resp?.isMarkedForReview;
    }
    return true;
  });

  const activeQuestion = filteredQuestions[currentIndex] || test.questions[0];
  const activeQId = activeQuestion?.id || (activeQuestion as any)?._id || 'q-0';
  const resp = attempt?.responses?.[activeQId];
  const isSelected = Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
  const isCorrect = checkIsCorrect(activeQuestion, resp);
  const isNumerical = activeQuestion?.type === 'NUMERICAL' || activeQuestion?.section === 'B' || (!activeQuestion?.options || activeQuestion?.options.length === 0);
  const studentVal = (resp?.numericalValue ?? resp?.selectedOption ?? '').trim();
  const correctVal = String(activeQuestion?.numericalAnswer ?? activeQuestion?.correctAnswer ?? '').trim();

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((p) => p - 1);
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) setCurrentIndex((p) => p + 1);
  };

  return (
    <div className={styles.reviewContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.backBtn} onClick={onBackToResults}>
            <ArrowLeft size={16} />
            <span>Back to Score Analysis</span>
          </button>
          <div className={styles.titleGroup}>
            <h2 className={styles.reviewTitle}>Question &amp; Answer Review: {test.title}</h2>
          </div>
        </div>

        <button type="button" className={styles.catalogBtn} onClick={onBackToCatalog}>
          <span>All Mock Tests</span>
        </button>
      </div>

      {/* Filter Tabs Row */}
      <div className={styles.filterTabsRow} role="tablist" aria-label="Filter Review Questions">
        <div className={styles.filterGroup}>
          <Filter size={14} className={styles.filterIcon} />
          <span className={styles.filterLabel}>Filter By:</span>
          {(['All', 'Incorrect', 'Unattempted', 'Marked'] as ReviewFilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ''}`}
                onClick={() => {
                  setFilter(f);
                  setCurrentIndex(0);
                }}
              >
                {f} Questions
              </button>
            );
          })}
        </div>

        <span className={styles.filterCount}>
          Showing {filteredQuestions.length} of {test.questions.length} Questions
        </span>
      </div>

      {/* Main Review Workspace */}
      {filteredQuestions.length > 0 && activeQuestion ? (
        <div className={styles.workspaceGrid}>
          {/* Main Question & Solution */}
          <main className={styles.mainContent}>
            <div className={styles.card}>
              {/* Question Header */}
              <div className={styles.qMetaHeader}>
                <div className={styles.qNumberRow}>
                  <span className={styles.qNumber}>
                    Question {activeQuestion.questionNumber}
                  </span>
                  <span className={styles.subjectTag}>{activeQuestion.subject}</span>
                  <span className={styles.chapterTag}>{activeQuestion.chapter}</span>
                </div>

                {/* Score Status Tag */}
                <div className={styles.statusTagWrap}>
                  {isSelected ? (
                    isCorrect ? (
                      <span className={`${styles.scoreTag} ${styles.scoreCorrect}`}>
                        <CheckCircle2 size={14} />
                        <span>Correct (+{test.markingScheme?.correct ?? 4} Marks)</span>
                      </span>
                    ) : (
                      <span className={`${styles.scoreTag} ${styles.scoreIncorrect}`}>
                        <XCircle size={14} />
                        <span>Incorrect (-{test.markingScheme?.incorrect ?? 1} Mark)</span>
                      </span>
                    )
                  ) : (
                    <span className={`${styles.scoreTag} ${styles.scoreUnattempted}`}>
                      <HelpCircle size={14} />
                      <span>Unattempted (0 Marks)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Statement */}
              <div className={styles.statementArea}>
                <div className={styles.statementText}>
                  <MathText text={activeQuestion.statement} />
                </div>
              </div>

              {/* Options or Numerical Answer Card */}
              {!isNumerical ? (
                <div className={styles.optionsList}>
                  {activeQuestion.options.map((opt) => {
                    const isUserChoice = resp?.selectedOption === opt.id;
                    const isCorrectAnswer = opt.id === activeQuestion.correctAnswer;

                    let optClass = '';
                    if (isCorrectAnswer) {
                      optClass = styles.correctOption;
                    } else if (isUserChoice && !isCorrectAnswer) {
                      optClass = styles.incorrectOption;
                    }

                    return (
                      <div key={opt.id} className={`${styles.optionItem} ${optClass}`}>
                        <div className={styles.radioLetter}>{opt.id}</div>
                        <div className={styles.optionText}>
                          <MathText text={opt.text} />
                        </div>
                        {isCorrectAnswer && (
                          <div className={styles.correctIndicator}>
                            <Check size={16} />
                            <span>Correct Answer</span>
                          </div>
                        )}
                        {isUserChoice && !isCorrectAnswer && (
                          <div className={styles.incorrectIndicator}>
                            <X size={16} />
                            <span>Your Choice</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      Section B • Numerical Value Question
                    </span>
                    {studentVal ? (
                      isCorrect ? (
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803D', background: '#DCFCE7', padding: '3px 10px', borderRadius: '6px' }}>
                          ✓ Correct (+{activeQuestion.marks || 4})
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#B91C1C', background: '#FEE2E2', padding: '3px 10px', borderRadius: '6px' }}>
                          ✗ Incorrect (-{activeQuestion.negativeMarks ?? 1})
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', background: '#F1F5F9', padding: '3px 10px', borderRadius: '6px' }}>
                        Unattempted (0 Marks)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ background: studentVal ? (isCorrect ? '#F0FDF4' : '#FEF2F2') : '#FFFFFF', border: `1.5px solid ${studentVal ? (isCorrect ? '#86EFAC' : '#FECACA') : '#E2E8F0'}`, borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Your Entered Answer
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace', color: studentVal ? (isCorrect ? '#15803D' : '#B91C1C') : '#94A3B8' }}>
                        {studentVal || 'None (Unattempted)'}
                      </div>
                    </div>

                    <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#15803D', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Official Correct Answer
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace', color: '#15803D' }}>
                        {correctVal || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Official Answer & Concept Summary Box */}
              <div className={styles.solutionBox}>
                <div className={styles.solutionHeader}>
                  <CheckCircle2 size={16} className={styles.solIcon} />
                  <span className={styles.solTitle}>Official Verified Answer Key</span>
                </div>

                {activeQuestion.formulaKey && (
                  <div className={styles.formulaRow}>
                    <span className={styles.formulaLabel}>Topic / Core Concept:</span>
                    <div className={styles.formulaCode}>
                      <MathText text={activeQuestion.formulaKey} />
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#0369A1' }}>
                    <strong>Scheduled Solution Release:</strong> Complete PDF derivations &amp; instructor video walkthroughs unlock automatically on your individual schedule.
                  </div>
                  <button
                    type="button"
                    onClick={onBackToResults}
                    style={{
                      background: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View Unlock Timer →
                  </button>
                </div>
              </div>

              {/* Navigation Row */}
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous Review Question"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                <span className={styles.navProgress}>
                  {currentIndex + 1} of {filteredQuestions.length}
                </span>

                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handleNext}
                  disabled={currentIndex === filteredQuestions.length - 1}
                  aria-label="Next Review Question"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </main>

          {/* Palette Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Questions in View</h3>
              <div className={styles.paletteGrid}>
                {filteredQuestions.map((q, idx) => {
                  const qResp = attempt.responses[q.id];
                  const qSelected = Boolean(qResp?.numericalValue?.trim() || qResp?.selectedOption);
                  const qCorrect = checkIsCorrect(q, qResp);
                  const isCurrent = idx === currentIndex;

                  let colorClass = styles.pUnattempted;
                  if (qSelected) {
                    colorClass = qCorrect ? styles.pCorrect : styles.pIncorrect;
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`${styles.paletteBtn} ${colorClass} ${isCurrent ? styles.pActive : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Go to Question ${q.questionNumber}`}
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={styles.emptyFilterBox}>
          <p>No questions matched the selected filter ({filter}).</p>
          <button
            type="button"
            className={styles.resetFilterBtn}
            onClick={() => setFilter('All')}
          >
            Show All Questions
          </button>
        </div>
      )}
    </div>
  );
};

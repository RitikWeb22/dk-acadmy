import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  RotateCcw,
  BookOpen,
  Send,
  Check,
  X,
  Clock,
  ExternalLink,
  Play,
  Zap,
} from 'lucide-react';
import type { DPPSet, DPPQuestionResponse } from '../../../types';
import { MathText } from '../../ui/MathText/MathText';
import { QuestionNavigator } from '../QuestionNavigator/QuestionNavigator';
import { ConfirmSubmitDialog } from '../ConfirmSubmitDialog/ConfirmSubmitDialog';
import styles from './DPPPracticeView.module.scss';

interface DPPPracticeViewProps {
  set: DPPSet;
  initialMode?: 'practice' | 'test';
  isReviewMode?: boolean;
  savedResponses?: Record<string, DPPQuestionResponse>;
  onSaveProgress: (responses: Record<string, DPPQuestionResponse>, mode: 'practice' | 'test') => void;
  onSubmitPractice: (responses: Record<string, DPPQuestionResponse>, mode: 'practice' | 'test') => void;
  onBackToSets: () => void;
}

export const DPPPracticeView: React.FC<DPPPracticeViewProps> = ({
  set,
  initialMode = 'practice',
  isReviewMode = false,
  savedResponses = {},
  onSaveProgress,
  onSubmitPractice,
  onBackToSets,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'practice' | 'test'>(initialMode);
  const [responses, setResponses] = useState<Record<string, DPPQuestionResponse>>(savedResponses);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Live timer states
  const [timeLeft, setTimeLeft] = useState(() => (set.estimatedMinutes || 20) * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const totalQuestions = set.questions.length;
  const currentQuestion = set.questions[currentIndex];
  const currentResponse = responses[currentQuestion.id] || { isMarkedForReview: false };

  // Timer interval handling
  useEffect(() => {
    if (isReviewMode) return;

    const timer = setInterval(() => {
      if (mode === 'test') {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsConfirmOpen(true);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isReviewMode]);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgentTimer = mode === 'test' && timeLeft < 120 && timeLeft > 0;

  // Calculate session summary
  const answeredCount = Object.keys(responses).filter(
    (id) => Boolean(responses[id]?.selectedOption)
  ).length;

  const markedCount = Object.keys(responses).filter(
    (id) => Boolean(responses[id]?.isMarkedForReview)
  ).length;

  const progressPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const progressCircumference = 2 * Math.PI * 22; // r=22 -> ~138.23

  // Handle option selection
  const handleSelectOption = (optionId: string) => {
    // If evaluated in Practice mode or in Review mode, selection is locked
    if (isReviewMode || (mode === 'practice' && currentResponse.isEvaluated)) {
      return;
    }

    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResponse,
        selectedOption: optionId,
      },
    };
    setResponses(updated);
    onSaveProgress(updated, mode);
  };

  // Clear current question selection
  const handleClearSelection = () => {
    if (isReviewMode || (mode === 'practice' && currentResponse.isEvaluated)) {
      return;
    }

    const nextResponse = { ...currentResponse };
    delete nextResponse.selectedOption;

    const updated = {
      ...responses,
      [currentQuestion.id]: nextResponse,
    };
    setResponses(updated);
    onSaveProgress(updated, mode);
  };

  // Toggle Mark for Review
  const handleToggleMark = () => {
    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResponse,
        isMarkedForReview: !currentResponse.isMarkedForReview,
      },
    };
    setResponses(updated);
    onSaveProgress(updated, mode);
  };

  // In Practice Mode: Check Answer & reveal explanation immediately
  const handleCheckAnswer = () => {
    if (!currentResponse.selectedOption) return;

    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResponse,
        isEvaluated: true,
      },
    };
    setResponses(updated);
    onSaveProgress(updated, mode);
  };

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Mode switcher handler
  const handleModeChange = (newMode: 'practice' | 'test') => {
    if (isReviewMode) return;
    setMode(newMode);
    onSaveProgress(responses, newMode);
  };

  // Submission
  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    onSubmitPractice(responses, mode);
  };

  const isEvaluated = Boolean(currentResponse.isEvaluated || isReviewMode);
  const isSelected = Boolean(currentResponse.selectedOption);
  const isCorrect = currentResponse.selectedOption === currentQuestion.correctAnswer;

  return (
    <div className={styles.practiceContainer}>
      {/* 1. Sticky Session Sub-Header Bar */}
      <header className={styles.sessionSubHeader}>
        <div className={styles.subHeaderLeft}>
          <button
            type="button"
            className={styles.exitSessionBtn}
            onClick={onBackToSets}
            aria-label="Exit Practice Session"
          >
            <ArrowLeft size={16} />
            <span>Exit Session</span>
          </button>

          <div className={styles.titleMetadata}>
            <h1 className={styles.sessionTitle}>{set.title}</h1>
            <div className={styles.subjectPillGroup}>
              <span className={`${styles.subjectPill} ${styles[set.subject.toLowerCase()]}`}>
                {set.subject}
              </span>
              <span className={styles.separatorDot}>•</span>
              <span className={styles.chapterPill}>{set.chapter}</span>
            </div>
          </div>
        </div>

        <div className={styles.subHeaderRight}>
          {/* Segmented Mode Switcher */}
          {!isReviewMode ? (
            <div className={styles.modeSegmentedSwitch} role="group" aria-label="Practice Mode Selection">
              <button
                type="button"
                className={`${styles.modeSwitchBtn} ${mode === 'practice' ? styles.activePractice : ''}`}
                onClick={() => handleModeChange('practice')}
              >
                <Zap size={14} className={styles.switchIcon} />
                <span>Practice Mode (Instant Solutions)</span>
              </button>
              <button
                type="button"
                className={`${styles.modeSwitchBtn} ${mode === 'test' ? styles.activeTest : ''}`}
                onClick={() => handleModeChange('test')}
              >
                <Clock size={14} className={styles.switchIcon} />
                <span>Timed Exam Mode</span>
              </button>
            </div>
          ) : (
            <div className={styles.reviewBanner}>
              <BookOpen size={15} />
              <span>Solutions & Performance Review</span>
            </div>
          )}

          {/* Live Timer Tile */}
          {!isReviewMode && (
            <div className={`${styles.liveTimerBadge} ${isUrgentTimer ? styles.urgentPulse : ''}`}>
              <Clock size={15} className={styles.timerClockIcon} />
              <span className={styles.timerText}>
                {mode === 'test'
                  ? `${formatTime(timeLeft)} remaining`
                  : `${formatTime(timeElapsed)} elapsed`}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Practice Workspace: 8-Col Question Canvas vs 4-Col Palette */}
      <div className={styles.workspaceGrid}>
        {/* Left / Main Question Canvas */}
        <main className={styles.questionCanvas}>
          <div className={styles.questionCard}>
            {/* Header Row: Question Counter, Marks Tag & Mark for Review */}
            <div className={styles.cardHeaderRow}>
              <div className={styles.counterGroup}>
                <span className={styles.questionCounterBadge}>
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className={styles.difficultyBadge}>
                  {set.difficulty || 'Medium'} • +4 / -1 Marks
                </span>
              </div>

              <button
                type="button"
                className={`${styles.markReviewBtn} ${
                  currentResponse.isMarkedForReview ? styles.markReviewActive : ''
                }`}
                onClick={handleToggleMark}
                aria-pressed={currentResponse.isMarkedForReview}
              >
                <Bookmark size={15} className={styles.bookmarkIcon} />
                <span>{currentResponse.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            {/* Question Body with High-Contrast Typography & Math/LaTeX */}
            <div className={styles.questionBody}>
              <div className={styles.statementText}>
                <MathText text={currentQuestion.statement} />
              </div>
            </div>

            {/* Multiple-Choice Options (A, B, C, D) */}
            <div
              className={styles.optionsList}
              role="radiogroup"
              aria-label={`Options for Question ${currentIndex + 1}`}
            >
              {currentQuestion.options.map((opt) => {
                const optSelected = currentResponse.selectedOption === opt.id;
                const optIsCorrect = opt.id === currentQuestion.correctAnswer;
                const optIsSelectedWrong = isEvaluated && optSelected && !optIsCorrect;

                let stateClass = styles.defaultOption;
                if (isEvaluated) {
                  if (optIsCorrect) {
                    stateClass = styles.correctOption;
                  } else if (optIsSelectedWrong) {
                    stateClass = styles.incorrectOption;
                  }
                } else if (optSelected) {
                  stateClass = styles.selectedOption;
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={optSelected}
                    disabled={isEvaluated}
                    className={`${styles.optionCard} ${stateClass}`}
                    onClick={() => handleSelectOption(opt.id)}
                  >
                    <div className={styles.optionBadge}>
                      {isEvaluated && optIsCorrect ? (
                        <Check size={18} strokeWidth={2.5} />
                      ) : isEvaluated && optIsSelectedWrong ? (
                        <X size={18} strokeWidth={2.5} />
                      ) : (
                        opt.id
                      )}
                    </div>

                    <div className={styles.optionContent}>
                      <MathText text={opt.text} />
                    </div>

                    {isEvaluated && optIsCorrect && (
                      <span className={styles.stateTagCorrect}>Correct Answer</span>
                    )}
                    {isEvaluated && optIsSelectedWrong && (
                      <span className={styles.stateTagIncorrect}>Your Choice</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Drawer (Appears after Check Answer in Practice Mode or in Review Mode) */}
            {isEvaluated && (
              <div
                className={`${styles.explanationDrawer} ${
                  isSelected
                    ? isCorrect
                      ? styles.drawerCorrect
                      : styles.drawerIncorrect
                    : styles.drawerUnattempted
                }`}
              >
                <div className={styles.drawerHeader}>
                  <div className={styles.drawerTitleWrap}>
                    <Sparkles size={18} className={styles.sparkleIcon} />
                    <span className={styles.drawerTitle}>
                      DK Sir's 20s Shortcut Inspection Logic
                    </span>
                  </div>
                  <div className={styles.marksBadge}>
                    {isSelected ? (
                      isCorrect ? (
                        <span className={styles.marksPositive}>+4 Marks • Correct</span>
                      ) : (
                        <span className={styles.marksNegative}>-1 Mark • Incorrect</span>
                      )
                    ) : (
                      <span className={styles.marksNeutral}>0 Marks • Unattempted</span>
                    )}
                  </div>
                </div>

                {/* Core Concept & Formula Key */}
                {currentQuestion.formulaKey && (
                  <div className={styles.formulaKeyBox}>
                    <div className={styles.formulaHeader}>
                      <Lightbulb size={15} className={styles.bulbIcon} />
                      <span className={styles.formulaLabel}>Core Concept & Shortcut Rule:</span>
                    </div>
                    <div className={styles.formulaContent}>
                      <MathText text={currentQuestion.formulaKey} />
                    </div>
                  </div>
                )}

                {/* Detailed Step-by-Step Explanation */}
                <div className={styles.stepByStepBox}>
                  <div className={styles.stepLabel}>Step-by-Step Mechanism:</div>
                  <div className={styles.stepText}>
                    <MathText text={currentQuestion.explanation} />
                  </div>
                </div>

                {/* Video Solution Timestamp Link */}
                <div className={styles.videoTimestampLink}>
                  <div className={styles.videoLeft}>
                    <Play size={15} className={styles.playIcon} />
                    <span className={styles.videoText}>
                      Watch DK Sir's Step-by-Step Video Breakdown (02:15)
                    </span>
                  </div>
                  <span className={styles.videoLinkBadge}>
                    Open Video Solution <ExternalLink size={12} />
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Question Canvas Action Bar */}
            <div className={styles.canvasActionBar}>
              <div className={styles.actionLeft}>
                <button
                  type="button"
                  className={styles.prevBtn}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous Question"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                {isSelected && !isEvaluated && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClearSelection}
                    aria-label="Clear current question selection"
                  >
                    <RotateCcw size={14} />
                    <span>Clear Selection</span>
                  </button>
                )}
              </div>

              <div className={styles.actionCenter}>
                {mode === 'practice' && !isEvaluated && (
                  <button
                    type="button"
                    className={styles.checkBtn}
                    onClick={handleCheckAnswer}
                    disabled={!isSelected}
                  >
                    <CheckCircle2 size={16} />
                    <span>Check Answer & Reveal Logic</span>
                  </button>
                )}
              </div>

              <div className={styles.actionRight}>
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={handleNext}
                    aria-label="Next Question"
                  >
                    <span>Save & Next</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  !isReviewMode && (
                    <button
                      type="button"
                      className={styles.submitFinalBtn}
                      onClick={() => setIsConfirmOpen(true)}
                    >
                      <Send size={15} />
                      <span>Submit Practice Session</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sticky Sidebar (4 Columns): Question Palette & Progress */}
        <aside className={styles.sidebar}>
          {/* Progress Summary Bento Card */}
          <div className={styles.progressSummaryCard}>
            <div className={styles.progressCardHeader}>
              <span className={styles.progressHeading}>Session Progress</span>
              <span className={styles.progressCounter}>
                {answeredCount} / {totalQuestions} Answered
              </span>
            </div>

            <div className={styles.progressRingWrapper}>
              <svg className={styles.progressRingSvg} width="64" height="64" viewBox="0 0 56 56">
                <circle
                  className={styles.progressRingBg}
                  cx="28"
                  cy="28"
                  r="22"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  className={styles.progressRingFill}
                  cx="28"
                  cy="28"
                  r="22"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={progressCircumference}
                  strokeDashoffset={progressCircumference - (progressCircumference * answeredCount) / totalQuestions}
                />
              </svg>
              <div className={styles.progressPercentText}>{progressPercentage}%</div>
            </div>

            <div className={styles.progressModeNotice}>
              {mode === 'practice' ? (
                <>
                  <Zap size={13} className={styles.noticeIcon} />
                  <span>Practice Mode: Instant solutions enabled</span>
                </>
              ) : (
                <>
                  <Clock size={13} className={styles.noticeIcon} />
                  <span>Timed Exam Mode: Real-time countdown active</span>
                </>
              )}
            </div>
          </div>

          {/* Modernized Question Palette */}
          <QuestionNavigator
            questions={set.questions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            responses={responses}
            isReviewMode={isReviewMode}
          />

          {/* Submit Session Button */}
          {!isReviewMode && (
            <button
              type="button"
              className={styles.sidebarSubmitBtn}
              onClick={() => setIsConfirmOpen(true)}
            >
              <Send size={16} />
              <span>Submit Practice Session</span>
            </button>
          )}
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmSubmitDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        markedCount={markedCount}
      />
    </div>
  );
};

export default DPPPracticeView;

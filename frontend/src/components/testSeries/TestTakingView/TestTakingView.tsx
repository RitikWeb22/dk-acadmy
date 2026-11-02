import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  RotateCcw,
  Send,
  Check,
  ShieldAlert,
} from 'lucide-react';
import type { TestSeriesItem, TestQuestionResponse } from '../../../types';
import { CountdownTimer } from '../CountdownTimer/CountdownTimer';
import { QuestionPalette, isSectionBQuestion } from '../QuestionPalette/QuestionPalette';
import { SubmitConfirmationModal } from '../SubmitConfirmationModal/SubmitConfirmationModal';
import styles from './TestTakingView.module.scss';
import { MathText } from '../../ui/MathText/MathText';
import { requestFullScreen, exitFullScreen, isFullScreenActive } from '../../../utils/fullscreen';

interface TestTakingViewProps {
  test: TestSeriesItem;
  startTime: number;
  savedResponses?: Record<string, TestQuestionResponse>;
  onSaveProgress: (responses: Record<string, TestQuestionResponse>) => void;
  onSubmitTest: (responses: Record<string, TestQuestionResponse>) => void;
  onExitTest: () => void;
}

export const TestTakingView: React.FC<TestTakingViewProps> = ({
  test,
  startTime,
  savedResponses = {},
  onSaveProgress,
  onSubmitTest,
  onExitTest,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, TestQuestionResponse>>(() => {
    const initial = { ...savedResponses };
    // Mark first question as visited safely
    if (test?.questions && test.questions.length > 0) {
      const q1 = test.questions[0];
      const q1Id = q1?.id || (q1 as any)?._id || 'q-0';
      if (!initial[q1Id]) {
        initial[q1Id] = { isMarkedForReview: false, isVisited: true };
      } else {
        initial[q1Id].isVisited = true;
      }
    }
    return initial;
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExitWarningOpen, setIsExitWarningOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Active Automated Proctoring & Anti-Cheating Engine
  // ─────────────────────────────────────────────────────────────
  const fullScreenLock = test?.schedule?.fullScreenLock !== false;
  const tabSwitchLimit = test?.schedule?.tabSwitchLimit ?? 3;
  const disableCopyPaste = test?.schedule?.disableCopyPaste !== false;
  const autoSaveSeconds = test?.schedule?.autoSaveInterval || 10;

  const [tabStrikes, setTabStrikes] = useState(0);
  const [isTabWarningOpen, setIsTabWarningOpen] = useState(false);
  const [isFullscreenWarningOpen, setIsFullscreenWarningOpen] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [cloudSyncText, setCloudSyncText] = useState('☁️ Cloud Synced');
  const [isFullscreenActiveState, setIsFullscreenActiveState] = useState<boolean>(() => isFullScreenActive());

  const enterFullscreen = async () => {
    const success = await requestFullScreen();
    if (success) {
      setIsFullscreenActiveState(true);
    }
  };

  // Active CBT examination isolation mode: hides public website navbar & footer, locks viewport
  useEffect(() => {
    document.body.classList.add('cbt-exam-active');
    return () => {
      document.body.classList.remove('cbt-exam-active');
    };
  }, []);

  // Auto-enter fullscreen upon mount if not already in fullscreen
  useEffect(() => {
    if (fullScreenLock && !isFullScreenActive()) {
      requestFullScreen().then((success) => {
        if (success) {
          setIsFullscreenActiveState(true);
        }
      });
    }
  }, [fullScreenLock]);

  // Fullscreen monitor with grace period
  useEffect(() => {
    let proctorArmed = false;
    const graceTimer = setTimeout(() => {
      proctorArmed = true;
    }, 1500);

    const handleFullscreenChange = () => {
      const isFs = isFullScreenActive();
      setIsFullscreenActiveState(isFs);
      if (proctorArmed && fullScreenLock && !isFs && !isDisqualified) {
        setIsFullscreenWarningOpen(true);
        setTabStrikes((prev) => {
          const next = prev + 1;
          if (tabSwitchLimit < 999 && next >= tabSwitchLimit) {
            setIsDisqualified(true);
          }
          return next;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      clearTimeout(graceTimer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [fullScreenLock, tabSwitchLimit, isDisqualified]);

  // Tab switch & focus loss monitor
  useEffect(() => {
    if (tabSwitchLimit >= 999) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isDisqualified) {
        setTabStrikes((prev) => {
          const next = prev + 1;
          if (next >= tabSwitchLimit) {
            setIsDisqualified(true);
          } else {
            setIsTabWarningOpen(true);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabSwitchLimit, isDisqualified]);

  // Disable clipboard, right-click & DevTools inspection
  useEffect(() => {
    if (!disableCopyPaste) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) {
        e.preventDefault();
      }
      // Prevent Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+V, Ctrl+A
      if (e.ctrlKey && ['u', 'U', 's', 'S', 'p', 'P', 'c', 'C', 'v', 'V'].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disableCopyPaste]);

  // Periodic cloud response auto-save
  useEffect(() => {
    if (!autoSaveSeconds || autoSaveSeconds <= 0) return;

    const interval = setInterval(() => {
      onSaveProgress(responses);
      setCloudSyncText('☁️ Cloud Saved');
      const timer = setTimeout(() => setCloudSyncText('☁️ Cloud Synced'), 3000);
      return () => clearTimeout(timer);
    }, autoSaveSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoSaveSeconds, responses, onSaveProgress]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Safe empty questions fallback
  if (!test?.questions || test.questions.length === 0) {
    return (
      <div className={styles.testContainer}>
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '520px', margin: '40px auto', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
            No Questions Available
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
            Questions for <strong>"{test?.title || 'this mock exam'}"</strong> are currently being authored or synced by the faculty.
          </p>
          <button
            type="button"
            style={{ padding: '10px 24px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            onClick={onExitTest}
          >
            ← Return to Test Series Catalog
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = test.questions.length;
  const currentQuestion = test.questions[currentIndex] || test.questions[0];
  const currentQuestionId = currentQuestion?.id || (currentQuestion as any)?._id || `q-${currentIndex}`;
  const currentResponse = (currentQuestionId && responses[currentQuestionId]) || { isMarkedForReview: false, isVisited: true };

  // Helper to change question index and mark target question as visited
  const navigateToQuestion = (targetIndex: number) => {
    setCurrentIndex(targetIndex);
    const targetQ = test.questions[targetIndex];
    const targetQId = targetQ?.id || (targetQ as any)?._id;
    if (targetQId && !responses[targetQId]?.isVisited) {
      const updated = {
        ...responses,
        [targetQId]: {
          ...(responses[targetQId] || { isMarkedForReview: false }),
          isVisited: true,
        },
      };
      setResponses(updated);
      onSaveProgress(updated);
    }
  };

  // Derived counts
  const answeredCount = Object.keys(responses).filter(
    (id) => Boolean(responses[id]?.numericalValue?.trim() || responses[id]?.selectedOption)
  ).length;

  const markedCount = Object.keys(responses).filter(
    (id) => Boolean(responses[id]?.isMarkedForReview)
  ).length;

  // Current Subject & Section calculations
  const currentSubject = currentQuestion.subject || 'General';
  const currentSubjectQuestions = test.questions.filter((q) => q.subject === currentSubject);
  const currentSubjectIndex = currentSubjectQuestions.indexOf(currentQuestion);
  const isCurrentSectionB = isSectionBQuestion(currentQuestion, currentSubjectIndex);
  const currentSection: 'A' | 'B' = isCurrentSectionB ? 'B' : 'A';

  const currentSubjectSecA = currentSubjectQuestions.filter((q, idx) => !isSectionBQuestion(q, idx));
  const currentSubjectSecB = currentSubjectQuestions.filter((q, idx) => isSectionBQuestion(q, idx));

  const secAAnsweredCount = currentSubjectSecA.filter((q) => {
    const qId = q.id || (q as any)?._id;
    const resp = qId ? responses[qId] : undefined;
    return Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
  }).length;

  const secBAnsweredCount = currentSubjectSecB.filter((q) => {
    const qId = q.id || (q as any)?._id;
    const resp = qId ? responses[qId] : undefined;
    return Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
  }).length;

  // NTA Rule: Maximum 5 questions in Section B
  const isSectionBLimitReached = isCurrentSectionB && secBAnsweredCount >= 5 && !Boolean(currentResponse.numericalValue?.trim() || currentResponse.selectedOption);

  // Handle option selection for Section A (MCQs)
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestionId) return;
    const updated = {
      ...responses,
      [currentQuestionId]: {
        ...currentResponse,
        selectedOption: optionId,
        isVisited: true,
      },
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  // Handle Numerical Input for Section B
  const handleNumericalChange = (val: string) => {
    if (!currentQuestionId) return;
    const sanitized = val.replace(/[^0-9.-]/g, '');
    const updated = {
      ...responses,
      [currentQuestionId]: {
        ...currentResponse,
        selectedOption: sanitized,
        numericalValue: sanitized,
        isVisited: true,
      },
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  const handleKeypadPress = (char: string) => {
    if (isSectionBLimitReached) return;
    const currentVal = currentResponse.numericalValue ?? currentResponse.selectedOption ?? '';
    if (char === '.' && currentVal.includes('.')) return;
    if (char === '-') {
      if (currentVal.startsWith('-')) {
        handleNumericalChange(currentVal.substring(1));
      } else {
        handleNumericalChange('-' + currentVal);
      }
      return;
    }
    handleNumericalChange(currentVal + char);
  };

  const handleKeypadBackspace = () => {
    const currentVal = currentResponse.numericalValue ?? currentResponse.selectedOption ?? '';
    if (currentVal.length > 0) {
      handleNumericalChange(currentVal.slice(0, -1));
    }
  };

  // Clear current response (both MCQ and Numerical)
  const handleClearResponse = () => {
    if (!currentQuestionId) return;
    const nextResponse = { ...currentResponse };
    delete nextResponse.selectedOption;
    delete nextResponse.numericalValue;

    const updated = {
      ...responses,
      [currentQuestionId]: nextResponse,
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  // Switch between Section A and Section B
  const handleSectionTabClick = (targetSection: 'A' | 'B') => {
    if (targetSection === 'A') {
      const firstSecAQ = currentSubjectSecA[0];
      if (firstSecAQ) {
        const globalIdx = test.questions.findIndex((q) => (q.id || (q as any)?._id) === (firstSecAQ.id || (firstSecAQ as any)?._id));
        if (globalIdx !== -1) navigateToQuestion(globalIdx);
      }
    } else {
      const firstSecBQ = currentSubjectSecB[0];
      if (firstSecBQ) {
        const globalIdx = test.questions.findIndex((q) => (q.id || (q as any)?._id) === (firstSecBQ.id || (firstSecBQ as any)?._id));
        if (globalIdx !== -1) navigateToQuestion(globalIdx);
      }
    }
  };

  // Toggle Mark for Review
  const handleToggleMark = () => {
    if (!currentQuestionId) return;
    const updated = {
      ...responses,
      [currentQuestionId]: {
        ...currentResponse,
        isMarkedForReview: !currentResponse.isMarkedForReview,
        isVisited: true,
      },
    };
    setResponses(updated);
    onSaveProgress(updated);
  };

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  };

  // Automatic submission when timer expires
  const handleTimerExpire = React.useCallback(() => {
    exitFullScreen().catch(() => {});
    setIsConfirmOpen(false);
    onSubmitTest(responses);
  }, [onSubmitTest, responses]);

  // Final submission confirmed by student
  const handleConfirmSubmit = () => {
    exitFullScreen().catch(() => {});
    setIsConfirmOpen(false);
    onSubmitTest(responses);
  };

  // Subject sections filter tabs (e.g. Physics, Chemistry, Math)
  const handleSubjectTabClick = (sub: string) => {
    const firstQIndex = test.questions.findIndex((q) => q.subject === sub);
    if (firstQIndex !== -1) {
      navigateToQuestion(firstQIndex);
    }
  };

  return (
    <div className={styles.testContainer}>
      {/* Top Test Navigation Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            className={styles.exitBtn}
            onClick={() => setIsExitWarningOpen(true)}
            aria-label="Pause or exit mock test"
          >
            <ArrowLeft size={16} />
            <span>Leave Test</span>
          </button>

          <div className={styles.testTitleGroup}>
            <h2 className={styles.testTitle}>{test.title}</h2>
            <div className={styles.badgeGroup}>
              <span className={styles.examTag}>{test.examType}</span>
              <span className={styles.formatTag}>{test.format}</span>
            </div>
          </div>
        </div>

        {/* Right Header Area: Timer & Submit */}
        <div className={styles.topBarRight}>
          <div className={styles.proctorStatusRow}>
            <span className={`${styles.proctorShieldBadge} ${tabStrikes > 0 ? styles.proctorShieldBadgeWarning : ''}`}>
              <ShieldAlert size={12} />
              Proctored {tabSwitchLimit < 999 && `(Strikes: ${tabStrikes}/${tabSwitchLimit})`}
            </span>
            <span className={styles.cloudSyncBadge}>{cloudSyncText}</span>
            {fullScreenLock && !isFullscreenActiveState && (
              <button
                type="button"
                className={styles.fullscreenBtn}
                onClick={enterFullscreen}
                title="Enter Fullscreen Mode"
              >
                ⛶ Go Fullscreen
              </button>
            )}
          </div>

          <CountdownTimer
            startTime={startTime}
            durationMinutes={test.durationMinutes}
            onTimeExpire={handleTimerExpire}
          />

          <button
            type="button"
            className={styles.headerSubmitBtn}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Send size={15} />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Subject Section Tabs (for multi-subject full mocks) */}
      {test.subjects.length > 1 && (
        <nav className={styles.subjectTabsBar} aria-label="Subject Sections">
          <span className={styles.subjectTabsLabel}>Subjects:</span>
          {test.subjects.map((sub) => {
            const isActive = sub === currentSubject;
            const subQuestions = test.questions.filter((q) => q.subject === sub);
            const subAnswered = subQuestions.filter((q) => {
              const qId = q.id || (q as any)?._id;
              const resp = qId ? responses[qId] : undefined;
              return Boolean(resp?.numericalValue?.trim() || resp?.selectedOption);
            }).length;

            return (
              <button
                key={sub}
                type="button"
                className={`${styles.subjectTab} ${isActive ? styles.subjectTabActive : ''}`}
                onClick={() => handleSubjectTabClick(sub)}
              >
                <span>{sub}</span>
                <span className={styles.subCount}>
                  ({subAnswered}/{subQuestions.length})
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Section A & Section B Sub-sections Bar */}
      <div className={styles.subSectionsBar}>
        <div className={styles.subSectionTabs}>
          <button
            type="button"
            className={`${styles.subSecTab} ${currentSection === 'A' ? styles.subSecTabActiveA : ''}`}
            onClick={() => handleSectionTabClick('A')}
          >
            <span className={styles.secLetterBadgeA}>Section A</span>
            <span className={styles.secTitleLabel}>MCQs</span>
            <span className={styles.secBadgeCount}>
              {secAAnsweredCount}/{currentSubjectSecA.length}
            </span>
          </button>

          {currentSubjectSecB.length > 0 && (
            <button
              type="button"
              className={`${styles.subSecTab} ${currentSection === 'B' ? styles.subSecTabActiveB : ''}`}
              onClick={() => handleSectionTabClick('B')}
            >
              <span className={styles.secLetterBadgeB}>Section B</span>
              <span className={styles.secTitleLabel}>Numerical</span>
              <span className={styles.secBadgeCount}>
                {secBAnsweredCount}/{currentSubjectSecB.length} {currentSubjectSecB.length >= 10 && <span className={styles.ntaLimit}>(NTA Max 5)</span>}
              </span>
            </button>
          )}
        </div>

        <div className={styles.secStatusInfo}>
          {currentSection === 'A' ? (
            <span className={styles.secInfoText}>
              Compulsory Questions • +{test.markingScheme?.correct ?? 4} / -{test.markingScheme?.incorrect ?? 1} Marks
            </span>
          ) : (
            <span className={styles.secInfoTextAmber}>
              NTA Rule: Attempt any 5 of {currentSubjectSecB.length} • Integer or Decimal
            </span>
          )}
        </div>
      </div>

      {/* Main Examination Layout */}
      <div className={styles.workspaceGrid}>
        {/* Left Column: Question Area */}
        <main className={styles.questionPanel}>
          <div className={styles.questionCard}>
            {/* Question Meta Header */}
            <div className={styles.questionMetaHeader}>
              <div className={styles.questionNumGroup}>
                <span className={styles.qNumber}>Question {currentIndex + 1}</span>
                <span className={styles.qTotal}>of {totalQuestions}</span>
                <span className={styles.subjectBadge}>{currentQuestion.subject}</span>
                <span className={isCurrentSectionB ? styles.sectionTagBadgeB : styles.sectionTagBadgeA}>
                  {isCurrentSectionB ? 'Section B • Numerical' : 'Section A • MCQ'}
                </span>
                <span className={styles.chapterBadge}>{currentQuestion.chapter}</span>
              </div>

              <div className={styles.marksBadge}>
                +{test.markingScheme?.correct ?? 4} / -{isCurrentSectionB && currentQuestion.negativeMarks === 0 ? 0 : (test.markingScheme?.incorrect ?? 1)} Marks
              </div>
            </div>

            {/* Question Statement */}
            <div className={styles.statementArea}>
              <div className={styles.statementText}>
                <MathText text={currentQuestion.statement} />
              </div>
            </div>

            {/* Section A: MCQ Options List */}
            {!isCurrentSectionB ? (
              <div
                className={styles.optionsList}
                role="radiogroup"
                aria-label={`Options for Question ${currentIndex + 1}`}
              >
                {(currentQuestion.options || []).map((opt, oIdx) => {
                  const optId = opt.id || ['A', 'B', 'C', 'D'][oIdx] || 'A';
                  const isSelected = currentResponse.selectedOption === optId;

                  return (
                    <button
                      key={optId}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`${styles.optionBtn} ${isSelected ? styles.selectedOption : ''}`}
                      onClick={() => handleSelectOption(optId)}
                    >
                      <div className={styles.radioLetter}>{optId}</div>
                      <div className={styles.optionText}>
                        <MathText text={opt.text} />
                      </div>
                      {isSelected && (
                        <div className={styles.selectedCheckWrap}>
                          <Check size={18} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Section B: Numerical Value Input & NTA Virtual Keypad */
              <div className={styles.numericalEntryCard}>
                <div className={styles.numericalHeader}>
                  <span className={styles.secBBadge}>Section B • Numerical Value Type</span>
                  <span className={styles.secBAttemptCounter}>
                    Attempted: <strong>{secBAnsweredCount}</strong> / 5 Allowed (Max 5)
                  </span>
                </div>

                <p className={styles.numericalInstructions}>
                  Enter the correct numerical value in the box below using the on-screen keypad or your physical keyboard. Can be an integer (e.g. <code>14</code>) or a decimal (e.g. <code>3.5</code> or <code>-2</code>).
                </p>

                {isSectionBLimitReached && (
                  <div className={styles.ntaLimitAlertBanner}>
                    <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>NTA Limit Reached:</strong> You have already attempted 5 questions in Section B for {currentSubject}.
                      To attempt this question, please clear the response on one of your previously attempted Section B questions.
                    </div>
                  </div>
                )}

                <div className={styles.numericalInputWrapper}>
                  <label htmlFor="numerical-answer-input" className={styles.numericalInputLabel}>
                    Your Answer:
                  </label>
                  <div className={styles.inputWithStatus}>
                    <input
                      id="numerical-answer-input"
                      type="text"
                      inputMode="decimal"
                      className={styles.numericalInput}
                      placeholder="Enter value..."
                      value={currentResponse.numericalValue ?? currentResponse.selectedOption ?? ''}
                      onChange={(e) => handleNumericalChange(e.target.value)}
                      disabled={isSectionBLimitReached}
                    />
                    {(currentResponse.numericalValue || currentResponse.selectedOption) && (
                      <span className={styles.inputSavedBadge}>
                        <Check size={14} /> Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Virtual NTA Numeric Keypad */}
                <div className={styles.virtualKeypad}>
                  <div className={styles.keypadRow}>
                    {['1', '2', '3'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={styles.keypadBtn}
                        onClick={() => handleKeypadPress(key)}
                        disabled={isSectionBLimitReached}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <div className={styles.keypadRow}>
                    {['4', '5', '6'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={styles.keypadBtn}
                        onClick={() => handleKeypadPress(key)}
                        disabled={isSectionBLimitReached}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <div className={styles.keypadRow}>
                    {['7', '8', '9'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={styles.keypadBtn}
                        onClick={() => handleKeypadPress(key)}
                        disabled={isSectionBLimitReached}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <div className={styles.keypadRow}>
                    <button
                      type="button"
                      className={styles.keypadBtn}
                      onClick={() => handleKeypadPress('.')}
                      disabled={isSectionBLimitReached}
                    >
                      .
                    </button>
                    <button
                      type="button"
                      className={styles.keypadBtn}
                      onClick={() => handleKeypadPress('0')}
                      disabled={isSectionBLimitReached}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      className={styles.keypadBtn}
                      onClick={() => handleKeypadPress('-')}
                      disabled={isSectionBLimitReached}
                    >
                      -
                    </button>
                  </div>
                  <div className={styles.keypadActionRow}>
                    <button
                      type="button"
                      className={styles.keypadBackspaceBtn}
                      onClick={handleKeypadBackspace}
                    >
                      ⌫ Backspace
                    </button>
                    <button
                      type="button"
                      className={styles.keypadClearBtn}
                      onClick={handleClearResponse}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className={styles.actionRow}>
              <div className={styles.actionLeft}>
                <button
                  type="button"
                  className={`${styles.markBtn} ${currentResponse.isMarkedForReview ? styles.markActive : ''}`}
                  onClick={handleToggleMark}
                  aria-pressed={currentResponse.isMarkedForReview}
                >
                  <Bookmark size={14} />
                  <span>
                    {currentResponse.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                  </span>
                </button>

                {(currentResponse.selectedOption || currentResponse.numericalValue) && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClearResponse}
                  >
                    <RotateCcw size={14} />
                    <span>Clear Response</span>
                  </button>
                )}
              </div>

              <div className={styles.actionRight}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous Question"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

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
                  <button
                    type="button"
                    className={styles.submitFinalBtn}
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    <Send size={15} />
                    <span>Submit Test</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Column: Palette & Progress Panel */}
        <aside className={styles.sidebar}>
          {/* Progress Card */}
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Attempt Progress</span>
              <span className={styles.progressScore}>
                {answeredCount} / {totalQuestions} Answered
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Palette */}
          <QuestionPalette
            questions={test.questions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => navigateToQuestion(idx)}
            responses={responses}
            activeSubject={currentSubject}
            onSelectSubject={handleSubjectTabClick}
            subjects={test.subjects}
          />

          {/* Primary Submit Button in Sidebar */}
          <button
            type="button"
            className={styles.sidebarSubmitBtn}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Send size={16} />
            <span>Submit Full Test</span>
          </button>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        markedCount={markedCount}
      />

      {/* Exit Test Warning Modal */}
      {isExitWarningOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={styles.exitModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
        >
          <div className={styles.exitModalCard}>
            <div className={styles.warnIconWrap}>
              <ShieldAlert size={28} />
            </div>
            <h3 id="exit-modal-title" className={styles.exitModalTitle}>
              Leave Examination?
            </h3>
            <p className={styles.exitModalText}>
              Your current answers and elapsed time are saved in local session storage, but the test timer continues running. Do you want to return to the catalog?
            </p>
            <div className={styles.exitModalActions}>
              <button
                type="button"
                className={styles.stayBtn}
                onClick={() => setIsExitWarningOpen(false)}
              >
                Stay in Test
              </button>
              <button
                type="button"
                className={styles.leaveBtn}
                onClick={() => {
                  exitFullScreen().catch(() => {});
                  setIsExitWarningOpen(false);
                  onExitTest();
                }}
              >
                Yes, Leave Test
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Proctoring Warning Modal: Fullscreen Exited */}
      {isFullscreenWarningOpen && !isDisqualified && typeof document !== 'undefined' && createPortal(
        <div className={styles.proctorModalOverlay} role="alertdialog" aria-modal="true">
          <div className={styles.proctorModalCard}>
            <div className={styles.proctorModalIconWarning}>⚠️</div>
            <h3 className={styles.proctorModalTitle}>Fullscreen Mode Required</h3>
            <p className={styles.proctorModalText}>
              You have exited Fullscreen mode. To maintain test integrity, this examination must remain in Fullscreen until final submission. A strike has been recorded.
            </p>
            {tabSwitchLimit < 999 && (
              <div className={styles.proctorStrikesBadge}>
                Security Strike: {tabStrikes} of {tabSwitchLimit} infractions logged
              </div>
            )}
            <button
              type="button"
              className={styles.proctorResumeBtn}
              onClick={() => {
                enterFullscreen();
                setIsFullscreenWarningOpen(false);
              }}
            >
              Re-Enter Fullscreen &amp; Continue Test
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Proctoring Warning Modal: Tab Switch Detected */}
      {isTabWarningOpen && !isDisqualified && typeof document !== 'undefined' && createPortal(
        <div className={styles.proctorModalOverlay} role="alertdialog" aria-modal="true">
          <div className={styles.proctorModalCard}>
            <div className={styles.proctorModalIconWarning}>⚠️</div>
            <h3 className={styles.proctorModalTitle}>Focus Lost / Tab Switch Detected</h3>
            <p className={styles.proctorModalText}>
              Navigating away from the examination window or switching tabs is strictly monitored by automated proctoring.
            </p>
            {tabSwitchLimit < 999 && (
              <div className={styles.proctorStrikesBadge}>
                Warning {tabStrikes} of {tabSwitchLimit} • {Math.max(0, tabSwitchLimit - tabStrikes)} more will terminate your exam
              </div>
            )}
            <button
              type="button"
              className={styles.proctorResumeBtn}
              onClick={() => setIsTabWarningOpen(false)}
            >
              I Understand &amp; Return to Exam
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Proctoring Disqualification Modal */}
      {isDisqualified && typeof document !== 'undefined' && createPortal(
        <div className={styles.proctorModalOverlay} role="alertdialog" aria-modal="true">
          <div className={`${styles.proctorModalCard} ${styles.proctorModalCardDanger}`}>
            <div className={styles.proctorModalIconDanger}>❌</div>
            <h3 className={styles.proctorModalTitle}>Examination Terminated</h3>
            <p className={styles.proctorModalText}>
              You have accumulated {tabStrikes} proctoring infractions, exceeding the permitted limit of {tabSwitchLimit} strikes. Your answers have been locked and automatically submitted for academic evaluation.
            </p>
            <button
              type="button"
              className={styles.proctorDisqualifiedBtn}
              onClick={() => {
                exitFullScreen().catch(() => {});
                setIsDisqualified(false);
                onSubmitTest(responses);
              }}
            >
              View Examination Scorecard
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

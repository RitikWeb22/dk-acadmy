import React from 'react';
import { CheckCircle2, XCircle, Lightbulb, Calculator, FileText, Download, Lock } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
import { MathText } from '../../ui/MathText/MathText';
import type { PYQQuestion } from '../../../types';
import styles from './AnswerExplanation.module.scss';

interface AnswerExplanationProps {
  question: PYQQuestion;
  userAnswer?: string;
  isCorrect: boolean;
  isUnlocked?: boolean;
  onWatchVideo?: () => void;
  onDownloadPdf?: () => void;
}

export const AnswerExplanation: React.FC<AnswerExplanationProps> = ({
  question,
  userAnswer,
  isCorrect,
  isUnlocked = true,
  onWatchVideo,
  onDownloadPdf
}) => {
  const hasVideo = Boolean(question.youtubeUrl || question.videoUrl);
  const hasPdf = Boolean(question.pdfUrl);

  return (
    <div className={styles.explanationWrapper} aria-live="polite">
      {/* Evaluation Banner */}
      <div className={`${styles.statusBanner} ${isCorrect ? styles.bannerCorrect : styles.bannerIncorrect}`}>
        <div className={styles.bannerIcon}>
          {isCorrect ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
        </div>
        <div className={styles.bannerText}>
          <span className={styles.bannerHeading}>
            {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
          </span>
          <span className={styles.bannerSub}>
            Correct Option: <strong>({question.correctAnswer})</strong>
            {userAnswer && !isCorrect && ` • You selected (${userAnswer})`}
          </span>
        </div>
      </div>

      {/* Formula Key */}
      {question.formulaKey && (
        <div className={styles.formulaBox}>
          <div className={styles.formulaHeader}>
            <Calculator size={16} className={styles.formulaIcon} />
            <span className={styles.formulaTitle}>Key Formula / Core Principle</span>
          </div>
          <code className={styles.formulaCode}>{question.formulaKey}</code>
        </div>
      )}

      {/* Step-by-Step Solution */}
      <div className={styles.solutionSection}>
        <div className={styles.solutionHeader}>
          <Lightbulb size={16} className={styles.bulbIcon} />
          <h4 className={styles.solutionTitle}>Step-by-Step Solution</h4>
        </div>
        <div className={styles.solutionBody}>
          <MathText text={question.explanation || 'Step-by-step mathematical derivation.'} />
        </div>

        {/* Video Solution and PDF Solution embedded directly in Step-by-Step Solution */}
        {(hasVideo || hasPdf) && (
          <div className={styles.solutionActionsGrid}>
            {hasVideo && (
              <button
                type="button"
                onClick={onWatchVideo}
                className={`${styles.actionBtn} ${styles.videoBtn} ${!isUnlocked ? styles.btnLocked : ''}`}
                title={isUnlocked ? 'Watch video explanation' : 'Unlock full course to watch'}
              >
                <div className={styles.iconCircle}>
                  <YoutubeIcon size={18} className={styles.ytIcon} />
                </div>
                <div className={styles.btnText}>
                  <span className={styles.btnPrimaryText}>
                    {isUnlocked ? 'Watch Video Solution' : 'Video Solution (Locked)'}
                  </span>
                  <span className={styles.btnSubText}>
                    {isUnlocked ? 'DK Sir Walkthrough' : 'Requires Course Enrollment'}
                  </span>
                </div>
                {!isUnlocked ? <Lock size={14} className={styles.lockBadge} /> : <span className={styles.playPill}>Play</span>}
              </button>
            )}

            {hasPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className={`${styles.actionBtn} ${styles.pdfBtn} ${!isUnlocked ? styles.btnLocked : ''}`}
                title={isUnlocked ? 'Download step-by-step solution PDF' : 'Unlock full course to download PDF'}
              >
                <div className={styles.iconCircle}>
                  <FileText size={18} className={styles.pdfIcon} />
                </div>
                <div className={styles.btnText}>
                  <span className={styles.btnPrimaryText}>
                    {isUnlocked ? 'Download Solution PDF' : 'Solution PDF (Locked)'}
                  </span>
                  <span className={styles.btnSubText}>
                    {isUnlocked ? 'High-res Kota notes & derivation' : 'Requires Course Enrollment'}
                  </span>
                </div>
                {!isUnlocked ? (
                  <Lock size={14} className={styles.lockBadge} />
                ) : (
                  <Download size={14} className={styles.downloadBadge} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

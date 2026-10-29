import React from 'react';
import { CheckCircle2, XCircle, Lightbulb, Calculator } from 'lucide-react';
import type { PYQQuestion } from '../../../types';
import styles from './AnswerExplanation.module.scss';

interface AnswerExplanationProps {
  question: PYQQuestion;
  userAnswer?: string;
  isCorrect: boolean;
}

export const AnswerExplanation: React.FC<AnswerExplanationProps> = ({
  question,
  userAnswer,
  isCorrect
}) => {
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
          <p>{question.explanation}</p>
        </div>

        {/* Media & Resource Links */}
        {(question.youtubeUrl || question.pdfUrl) && (
          <div className={styles.explanationMediaRow}>
            {question.youtubeUrl && (
              <a
                href={question.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ytLink}
              >
                <span>Watch DK Sir Video Solution on YouTube</span>
              </a>
            )}
            {question.pdfUrl && (
              <a
                href={question.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pdfLink}
              >
                <span>Download Solution PDF</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

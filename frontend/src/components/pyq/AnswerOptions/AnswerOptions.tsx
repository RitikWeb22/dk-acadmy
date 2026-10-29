import React from 'react';
import { Check, X } from 'lucide-react';
import type { PYQOption } from '../../../types';
import styles from './AnswerOptions.module.scss';

interface AnswerOptionsProps {
  options: PYQOption[];
  selectedOption?: string;
  correctAnswer: string;
  isEvaluated: boolean;
  onSelectOption: (optionId: string) => void;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  selectedOption,
  correctAnswer,
  isEvaluated,
  onSelectOption
}) => {
  return (
    <div
      className={styles.optionsList}
      role="radiogroup"
      aria-label="Question Multiple Choice Options"
    >
      {options.map((opt) => {
        const isSelected = selectedOption === opt.id;
        const isCorrectOption = opt.id === correctAnswer;
        const isSelectedWrong = isEvaluated && isSelected && !isCorrectOption;

        let statusClass = '';
        if (isEvaluated) {
          if (isCorrectOption) {
            statusClass = styles.correctOption;
          } else if (isSelectedWrong) {
            statusClass = styles.incorrectOption;
          }
        } else if (isSelected) {
          statusClass = styles.selectedOption;
        }

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isEvaluated}
            className={`${styles.optionBtn} ${statusClass}`}
            onClick={() => onSelectOption(opt.id)}
          >
            <div className={styles.radioCircle}>
              <span className={styles.optionLetter}>{opt.id}</span>
            </div>

            <div className={styles.optionText}>{opt.text}</div>

            {isEvaluated && (
              <div className={styles.feedbackIconWrap}>
                {isCorrectOption && (
                  <span className={styles.correctIconBadge} aria-label="Correct Option">
                    <Check size={16} strokeWidth={3} />
                  </span>
                )}
                {isSelectedWrong && (
                  <span className={styles.wrongIconBadge} aria-label="Your Incorrect Answer">
                    <X size={16} strokeWidth={3} />
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

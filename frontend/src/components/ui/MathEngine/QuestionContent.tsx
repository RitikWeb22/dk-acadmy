import React from 'react';
import { MathRenderer } from './MathRenderer';
import type { MathContentBlock } from './mathParser';
import styles from './MathEngine.module.scss';

export interface QuestionContentProps {
  statement: string;
  statementBlocks?: MathContentBlock[];
  options?: Array<{
    id?: string;
    key?: string;
    text: string;
    blocks?: MathContentBlock[];
  }>;
  selectedOptionKey?: string;
  onSelectOption?: (key: string) => void;
  correctAnswerKey?: string;
  showSolution?: boolean;
  explanation?: string;
  explanationBlocks?: MathContentBlock[];
  className?: string;
}

export const QuestionContent: React.FC<QuestionContentProps> = ({
  statement,
  statementBlocks,
  options = [],
  selectedOptionKey,
  onSelectOption,
  correctAnswerKey,
  showSolution = false,
  explanation,
  explanationBlocks,
  className = ''
}) => {
  return (
    <div className={`${styles.questionContentRoot} ${className}`}>
      {/* 1. Main Problem Statement */}
      <div style={{ marginBottom: '1.25rem', fontSize: '1.05rem', color: '#0f172a' }}>
        <MathRenderer content={statement} blocks={statementBlocks} />
      </div>

      {/* 2. Options Grid if present */}
      {options && options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
          {options.map((opt) => {
            const key = opt.key || opt.id || 'A';
            const isSelected = selectedOptionKey === key;
            const isCorrect = showSolution && correctAnswerKey === key;
            const isWrong = showSolution && isSelected && !isCorrect;

            let borderColor = '#e2e8f0';
            let bgColor = '#ffffff';

            if (isCorrect) {
              borderColor = '#22c55e';
              bgColor = '#f0fdf4';
            } else if (isWrong) {
              borderColor = '#ef4444';
              bgColor = '#fef2f2';
            } else if (isSelected) {
              borderColor = '#2563eb';
              bgColor = '#eff6ff';
            }

            return (
              <div
                key={key}
                onClick={() => onSelectOption && onSelectOption(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1.5px solid ${borderColor}`,
                  background: bgColor,
                  cursor: onSelectOption ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: isSelected || isCorrect ? (isCorrect ? '#22c55e' : '#2563eb') : '#f1f5f9',
                    color: isSelected || isCorrect ? '#ffffff' : '#475569',
                    flexShrink: 0
                  }}
                >
                  {key}
                </div>
                <div style={{ flex: 1, fontSize: '0.95rem' }}>
                  <MathRenderer content={opt.text} blocks={opt.blocks} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Detailed Explanation if showSolution is active */}
      {showSolution && explanation && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '14px 18px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>
            Detailed Mathematical Derivation:
          </div>
          <MathRenderer content={explanation} blocks={explanationBlocks} />
        </div>
      )}
    </div>
  );
};

export default QuestionContent;

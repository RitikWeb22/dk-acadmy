import React from 'react';
import { MathRenderer } from '../MathEngine/MathRenderer';

export interface MathTextProps {
  text?: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * Universal MathText component (Backward-compatible adapter for MathRenderer)
 * Powered by MathRenderer (MathJax + KaTeX hybrid engine)
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  displayMode = false
}) => {
  if (!text || typeof text !== 'string') return null;

  return (
    <MathRenderer
      content={text}
      displayMode={displayMode}
      className={className}
    />
  );
};

export default MathText;

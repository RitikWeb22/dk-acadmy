import React from 'react';
import { MathRenderer } from './MathRenderer';
import type { MathContentBlock } from './mathParser';

export interface MathPreviewProps {
  content?: string;
  blocks?: MathContentBlock[];
}

export const MathPreview: React.FC<MathPreviewProps> = ({
  content = '',
  blocks
}) => {
  return (
    <div
      style={{
        width: '100%',
        background: '#ffffff',
        borderRadius: '8px',
        padding: '14px 16px',
        minHeight: '100px'
      }}
    >
      {content.trim() ? (
        <MathRenderer content={content} blocks={blocks} />
      ) : (
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
          Type or paste text to see formatted preview...
        </span>
      )}
    </div>
  );
};

export default MathPreview;

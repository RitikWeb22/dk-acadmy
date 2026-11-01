import React, { useState } from 'react';
import { MathRenderer } from './MathRenderer';
import type { MathContentBlock } from './mathParser';
import styles from './MathEngine.module.scss';
import { CheckCircle2, AlertCircle, Smartphone, Monitor } from 'lucide-react';

export interface MathPreviewProps {
  content?: string;
  blocks?: MathContentBlock[];
  title?: string;
}

export const MathPreview: React.FC<MathPreviewProps> = ({
  content = '',
  blocks,
  title = 'Live Mathematical Preview'
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  // Check if there are any unclosed dollars or brackets
  const validation = React.useMemo(() => {
    if (!content.trim()) {
      return { isValid: true, message: 'Ready for input' };
    }

    // Check dollar parity
    const dollarMatches = content.match(/(?<!\\)\$/g);
    if (dollarMatches && dollarMatches.length % 2 !== 0) {
      return { isValid: false, message: 'Unmatched $ delimiter detected' };
    }

    // Check open/close braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { isValid: false, message: `Mismatched braces: { ${openBraces} vs } ${closeBraces}` };
    }

    return { isValid: true, message: 'LaTeX Syntactically Valid' };
  }, [content]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {title}
          </span>
          <span className={`${styles.validationBadge} ${validation.isValid ? styles.valid : styles.warning}`}>
            {validation.isValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {validation.message}
          </span>
        </div>

        {/* Device simulation toggle */}
        <div className={styles.viewModePills}>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${deviceView === 'desktop' ? styles.activeViewMode : ''}`}
            onClick={() => setDeviceView('desktop')}
            title="Desktop Width View"
          >
            <Monitor size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Desktop
          </button>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${deviceView === 'mobile' ? styles.activeViewMode : ''}`}
            onClick={() => setDeviceView('mobile')}
            title="Mobile Width View (360px)"
          >
            <Smartphone size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Mobile
          </button>
        </div>
      </div>

      {/* Rendered Canvas */}
      <div
        style={{
          width: deviceView === 'mobile' ? '360px' : '100%',
          margin: deviceView === 'mobile' ? '0 auto' : '0',
          transition: 'width 0.2s ease',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: deviceView === 'mobile' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
        }}
      >
        {content.trim() ? (
          <MathRenderer content={content} blocks={blocks} />
        ) : (
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Mathematical rendering will appear here in real time...
          </span>
        )}
      </div>
    </div>
  );
};

export default MathPreview;

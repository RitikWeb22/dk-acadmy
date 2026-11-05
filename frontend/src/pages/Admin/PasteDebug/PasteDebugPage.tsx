import React, { useState } from 'react';
import { MathText } from '../../../components/ui/MathText/MathText';
import { traceMathInputPaste, type PastePipelineTrace } from '../../../utils/pastePipelineTrace';

const STAGES: Array<{ key: keyof PastePipelineTrace; label: string }> = [
  { key: 'rawPlain', label: '1. Raw text/plain' },
  { key: 'rawHtml', label: '2. Raw text/html' },
  { key: 'afterOmmlExtraction', label: '3. After OMML extraction' },
  { key: 'afterLatexConversion', label: '4. After LaTeX conversion' },
  { key: 'afterNormalizer', label: '5. After normalizer' },
  { key: 'afterDelimiterWrapping', label: '6. After delimiter wrapping' },
  { key: 'afterPasteHandler', label: '7. After MathInput paste handler' },
  { key: 'mathInputOnChange', label: '8. MathInput onChange value' },
  { key: 'mathTextInput', label: '9. MathText input' },
];

function stageText(trace: PastePipelineTrace, key: keyof PastePipelineTrace): string {
  const value = trace[key];
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export const PasteDebugPage: React.FC = () => {
  const [trace, setTrace] = useState<PastePipelineTrace | null>(null);

  const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const next = traceMathInputPaste(event.clipboardData);
    setTrace(next);
    event.currentTarget.value = next.mathInputOnChange;
  };

  const download = () => {
    if (!trace) return;
    const blob = new Blob([JSON.stringify(trace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'capture.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 20px 48px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Paste capture</h1>
      <p style={{ color: '#475569', marginTop: 0 }}>
        Admin-only. Paste from Word. This records every stage of the Test Series MathInput path and does not save a question.
      </p>
      <textarea
        rows={6}
        onPaste={onPaste}
        placeholder="Paste a Word question here"
        style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 10 }}
      />
      {trace && (
        <>
          <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
            <button type="button" onClick={download}>Download capture.json</button>
            <span style={{ color: '#64748b', fontSize: 13 }}>
              source {trace.sourceType}
              {trace.usedPlainFallback ? ' · plain-text fallback used' : ''}
              {trace.ommlNeedsReview ? ' · OMML needs review' : ''}
              {trace.delimiterWrappedByPipeline ? '' : ' · stored text has no $ delimiters'}
            </span>
          </div>
          {trace.warnings.length > 0 && (
            <pre style={{ background: '#fff7ed', color: '#9a3412', padding: 12, whiteSpace: 'pre-wrap' }}>
              {trace.warnings.join('\n')}
            </pre>
          )}
          {STAGES.map((stage) => (
            <section key={stage.key} style={{ marginTop: 14 }}>
              <h2 style={{ fontSize: 14, marginBottom: 6 }}>{stage.label}</h2>
              <pre style={{ background: '#f8fafc', padding: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {stageText(trace, stage.key) || '(empty)'}
              </pre>
            </section>
          ))}
          <section style={{ marginTop: 14 }}>
            <h2 style={{ fontSize: 14 }}>10. MathText preview of the stored value</h2>
            <div style={{ border: '1px solid #e2e8f0', padding: 12, background: '#fff' }}>
              <MathText text={trace.mathTextInput} />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PasteDebugPage;

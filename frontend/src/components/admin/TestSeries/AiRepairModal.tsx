import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';
import { MathPreview } from '../../ui/MathEngine/MathPreview';

export interface AiRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApplyRepaired: (repairedText: string) => void;
}

export const AiRepairModal: React.FC<AiRepairModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApplyRepaired
}) => {
  const [repairedText, setRepairedText] = useState<string>('');
  const [diffNotes, setDiffNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleRunGeminiRepair = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/math-import/ai-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: originalText })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'AI repair request failed');
      }

      setRepairedText(json.repairedText);
      setDiffNotes(json.diffNotes || 'LaTeX formatted cleanly with KaTeX delimiters.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to repair equation with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!repairedText) return;
    onApplyRepaired(repairedText);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafafa'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                AI LaTeX Repair Engine (Google Gemini 2.5 Flash)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Strict formula repair without altering numbers, symbols, or mathematical meaning.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Original vs Repaired Side-by-side or stacked */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {/* Original Card */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Current Statement / Equation:
              </label>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {originalText}
              </div>
            </div>

            {/* Repaired Card */}
            {repairedText ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
                    ✨ Gemini-Repaired LaTeX:
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: activeTab === 'preview' ? '#2563eb' : '#f1f5f9',
                        color: activeTab === 'preview' ? '#ffffff' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('raw')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: activeTab === 'raw' ? '#2563eb' : '#f1f5f9',
                        color: activeTab === 'raw' ? '#ffffff' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Raw LaTeX
                    </button>
                  </div>
                </div>

                {activeTab === 'preview' ? (
                  <div style={{ border: '1px solid #bbf7d0', borderRadius: '8px', overflow: 'hidden' }}>
                    <MathPreview content={repairedText} />
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={repairedText}
                    onChange={(e) => setRepairedText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontFamily: 'monospace',
                      lineHeight: '1.4'
                    }}
                  />
                )}

                {diffNotes && (
                  <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                    Diff Notes: {diffNotes}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Click below to send this question to Gemini 2.5 Flash for automated LaTeX syntax and delimiter repair.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          {!repairedText ? (
            <button
              type="button"
              onClick={handleRunGeminiRepair}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <Sparkles size={14} />
              {isLoading ? 'Repairing with Gemini 2.5...' : 'Repair Formatting'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Check size={14} />
              Apply Repaired LaTeX
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

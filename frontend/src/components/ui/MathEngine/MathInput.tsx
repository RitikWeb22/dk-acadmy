import React, { useState, useRef, useCallback } from 'react';
import styles from './MathEngine.module.scss';
import { JEE_MATH_TOOLBAR } from './mathToolbarData';
import type { MathToolbarItem } from './mathToolbarData';
import { MathPreview } from './MathPreview';
import { parseContentToBlocks } from './mathParser';
import type { MathContentBlock } from './mathParser';
import { resolveMathInputPaste } from '../../../utils/mathInputPaste';
import { parseWordQuestions } from '../../../utils/wordPasteParser';
import {
  extractMathFromHtml,
  normalizeMathString,
  normalizeOptionMath,
  handleSmartMathPaste
} from '../../../utils/mathImportRenderSystem/pasteHandler';
import { Eye, Code, Columns, Sparkles } from 'lucide-react';

export interface MathInputProps {
  value: string;
  onChange: (value: string, blocks: MathContentBlock[]) => void;
  onExtractOptions?: (
    statement: string,
    options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>,
    correctKey?: 'A' | 'B' | 'C' | 'D'
  ) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
  defaultViewMode?: 'edit' | 'preview';
  compact?: boolean;
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  onExtractOptions,
  placeholder = 'Type normal text or equations ($x^2$, \\frac{a}{b}, \\int, \\begin{cases})... Or paste directly from Word!',
  rows = 4,
  label,
  className = '',
  defaultViewMode = 'edit',
  compact = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(
    defaultViewMode === 'preview' ? 'preview' : 'edit'
  );
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);

  // Inserts a mathematical symbol or template at current cursor location
  const handleInsertTemplate = useCallback(
    (item: MathToolbarItem) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        const newValue = value ? `${value} ${item.template}` : item.template;
        onChange(newValue, parseContentToBlocks(newValue));
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let insertText = item.template;
      // If user highlighted text, substitute it into simple templates like \sqrt{x}
      if (selectedText) {
        if (insertText.includes('{x}')) {
          insertText = insertText.replace('{x}', `{${selectedText}}`);
        } else if (insertText.includes('(x)')) {
          insertText = insertText.replace('(x)', `(${selectedText})`);
        }
      }

      const newValue = value.substring(0, start) + insertText + value.substring(end);
      onChange(newValue, parseContentToBlocks(newValue));

      // Restore focus & position cursor after inserted template
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + insertText.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
    },
    [value, onChange]
  );

  // Handles text change & automatically produces structured blocks
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const blocks = parseContentToBlocks(raw);
    onChange(raw, blocks);
  };

  // Handles pasting from Word, Google Docs, MathML, OMML, or plain text clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setPasteWarning(null);

    const cd = e.clipboardData;
    if (!cd) return;

    const html = cd.getData('text/html') || '';
    const plain = cd.getData('text/plain') || cd.getData('text') || '';

    // 1. If options extractor is present (e.g. Question Statement editor), check if pasted text has questions with options
    if (onExtractOptions) {
      let textToUse = plain;
      if (html && (/<(?:m:)?(?:oMath|oMathPara|math)\b|<!--\[if\s+gte\s+msEquation/i.test(html))) {
        const converted = extractMathFromHtml(html);
        if (converted.trim()) {
          textToUse = converted;
        }
      }
      textToUse = textToUse.replace(/Word HTML dropped part of the question\.\s*The plain-text version was kept and needs review\.\s*/gi, '');

      const parsedList = parseWordQuestions(textToUse);
      if (parsedList.length > 0) {
        const q0 = parsedList[0];
        const hasOptions = q0.options.filter(o => o.text && o.text.trim().length > 0).length >= 2;
        if (hasOptions) {
          onExtractOptions(q0.statement, q0.options as any, q0.correctKey);
          onChange(q0.statement, parseContentToBlocks(q0.statement));
          return;
        }
      }
    }

    // 2. Extract rich math from HTML (OMML / MathML / KaTeX annotations) if present
    let converted = '';
    if (html && (/<(?:m:)?(?:oMath|oMathPara|math)\b|<!--\[if\s+gte\s+msEquation/i.test(html) || /<table|<tr|<p|<span|<div/i.test(html))) {
      converted = extractMathFromHtml(html);
    }
    const baseText = converted.trim() || plain;

    // If this input is an Option field (compact or label starts with Option), use normalizeOptionMath
    // Otherwise use full statement normalizer normalizeMathString
    const isOptionField = compact || Boolean(label && /^Option\s+[A-D]/i.test(label));
    const normalized = isOptionField ? normalizeOptionMath(baseText) : normalizeMathString(baseText);

    if (!normalized) return;

    const textarea = textareaRef.current;
    if (!textarea) {
      const next = value ? `${value}\n${normalized}` : normalized;
      onChange(next, parseContentToBlocks(next));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = value.substring(0, start) + normalized + value.substring(end);
    onChange(next, parseContentToBlocks(next));

    setTimeout(() => {
      textarea.focus();
      const pos = start + normalized.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className={`${styles.mathInputContainer} ${className}`} style={compact ? { borderRadius: '8px' } : undefined}>
      {/* Top Controls Bar - Only Edit & Preview Buttons */}
      <div
        className={styles.inputControlsBar}
        style={{
          padding: compact ? '4px 8px' : '6px 12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {label && (
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: compact ? '0.78rem' : '0.85rem' }}>
              {label}
            </span>
          )}
        </div>

        {/* View Mode Switcher: Only Edit and Preview */}
        <div className={styles.viewModePills} style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${viewMode === 'edit' ? styles.activeViewMode : ''}`}
            onClick={() => setViewMode('edit')}
            title="Edit question statement"
            style={compact ? { padding: '2px 6px', fontSize: '0.68rem' } : undefined}
          >
            <Code size={compact ? 11 : 13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Edit
          </button>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${viewMode === 'preview' ? styles.activeViewMode : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview formatted mathematics"
            style={compact ? { padding: '2px 6px', fontSize: '0.68rem' } : undefined}
          >
            <Eye size={compact ? 11 : 13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Preview
          </button>
        </div>
      </div>



      {/* Editor Body */}
      <div className={styles.editorBody} style={compact ? { minHeight: 'auto' } : undefined}>
        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={styles.textareaField}
            style={compact ? { padding: '6px 10px', fontSize: '0.84rem', lineHeight: '1.4' } : undefined}
          />
        ) : (
          <div
            style={{
              padding: compact ? '6px 10px' : '12px 14px',
              background: '#ffffff',
              minHeight: compact ? '44px' : '130px',
              maxHeight: compact ? '180px' : '450px',
              overflowY: 'auto',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <MathPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MathInput;

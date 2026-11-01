import React, { useState, useRef, useCallback } from 'react';
import styles from './MathEngine.module.scss';
import { JEE_MATH_TOOLBAR } from './mathToolbarData';
import type { MathToolbarItem } from './mathToolbarData';
import { MathPreview } from './MathPreview';
import { parseContentToBlocks } from './mathParser';
import type { MathContentBlock } from './mathParser';
import { extractStatementAndOptions, normalizeMathText } from '../../../utils/questionBulkParser';
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
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  onExtractOptions,
  placeholder = 'Type normal text or equations ($x^2$, \\frac{a}{b}, \\int, \\begin{cases})... Or paste directly from Word!',
  rows = 4,
  label,
  className = '',
  defaultViewMode = 'edit'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(
    defaultViewMode === 'preview' ? 'preview' : 'edit'
  );

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

  // Handles pasting from Word or clipboard, auto-normalizing UnicodeMath and extracting options
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;

    // 1. Check if pasted content contains question options (e.g. A -21. B 21. C 19. D 0)
    if (onExtractOptions) {
      const extracted = extractStatementAndOptions(pasted);
      const hasOptions =
        extracted.options &&
        extracted.options.length === 4 &&
        (extracted.options[0].text !== 'Option A' || extracted.options[1].text !== 'Option B') &&
        extracted.statement.length > 0;

      if (hasOptions) {
        e.preventDefault();
        const cleanStmt = normalizeMathText(extracted.statement);
        const cleanOpts = extracted.options.map((o) => ({
          key: o.key,
          text: normalizeMathText(o.text)
        }));
        onExtractOptions(cleanStmt, cleanOpts, extracted.correctKey);
        onChange(cleanStmt, parseContentToBlocks(cleanStmt));
        return;
      }
    }

    // 2. Normalize any pasted text to clean Word artifacts, hair spaces, powers, and fractions
    e.preventDefault();
    const normalized = normalizeMathText(pasted);
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
    <div className={`${styles.mathInputContainer} ${className}`}>
      {/* Top Controls Bar - Only Edit & Preview Buttons */}
      <div className={styles.inputControlsBar} style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {label && (
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
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
          >
            <Code size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Edit
          </button>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${viewMode === 'preview' ? styles.activeViewMode : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview formatted mathematics"
          >
            <Eye size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className={styles.editorBody}>
        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={styles.textareaField}
          />
        ) : (
          <div style={{ padding: '12px 14px', background: '#ffffff', minHeight: '120px' }}>
            <MathPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MathInput;

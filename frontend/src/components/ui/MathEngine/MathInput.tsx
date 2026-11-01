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
  showToolbar?: boolean;
  defaultViewMode?: 'split' | 'tabs' | 'editor';
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  onExtractOptions,
  placeholder = 'Type normal text or LaTeX ($x^2$, \\frac{a}{b}, \\int, \\begin{cases})...',
  rows = 4,
  label,
  className = '',
  showToolbar = true,
  defaultViewMode = 'split'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Algebra');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>(
    defaultViewMode === 'split' ? 'split' : 'edit'
  );
  const [isToolbarOpen, setIsToolbarOpen] = useState<boolean>(showToolbar);

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

  const currentCategoryItems = JEE_MATH_TOOLBAR.find((c) => c.name === activeCategory)?.items || [];

  return (
    <div className={`${styles.mathInputContainer} ${className}`}>
      {/* Top Controls Bar */}
      <div className={styles.inputControlsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {label && (
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
              {label}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: isToolbarOpen ? '#eff6ff' : '#f8fafc',
              color: isToolbarOpen ? '#2563eb' : '#64748b',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={12} />
            {isToolbarOpen ? 'Hide Math Toolbar' : 'Insert Math Symbol'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!value) return;
              const formatted = normalizeMathText(value);
              onChange(formatted, parseContentToBlocks(formatted));
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              cursor: 'pointer'
            }}
            title="Clean Word formatting, fix powers & convert formulas into textbook LaTeX"
          >
            <Sparkles size={12} color="#2563eb" />
            Format Math &amp; LaTeX
          </button>
        </div>

        {/* View Mode Switcher: Split / Edit / Preview */}
        <div className={styles.viewModePills}>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${viewMode === 'edit' ? styles.activeViewMode : ''}`}
            onClick={() => setViewMode('edit')}
            title="Editor only"
          >
            <Code size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Edit
          </button>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${viewMode === 'split' ? styles.activeViewMode : ''}`}
            onClick={() => setViewMode('split')}
            title="Split side-by-side view"
          >
            <Columns size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Split
          </button>
          <button
            type="button"
            className={`${styles.viewModeBtn} ${viewMode === 'preview' ? styles.activeViewMode : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview only"
          >
            <Eye size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Preview
          </button>
        </div>
      </div>

      {/* Math Symbol Toolbar */}
      {isToolbarOpen && (
        <div className={styles.toolbarHeader}>
          {/* Category Tabs */}
          <div className={styles.toolbarCategoryTabs}>
            {JEE_MATH_TOOLBAR.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`${styles.categoryTabBtn} ${activeCategory === cat.name ? styles.activeCategoryTab : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Buttons for active category */}
          <div className={styles.symbolGrid}>
            {currentCategoryItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.symbolBtn}
                onClick={() => handleInsertTemplate(item)}
                title={`${item.description} (${item.template})`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className={`${styles.editorBody} ${viewMode === 'split' ? styles.splitActive : ''}`}>
        {/* Textarea for editing */}
        {viewMode !== 'preview' && (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={styles.textareaField}
          />
        )}

        {/* Live Preview Side Pane */}
        {viewMode !== 'edit' && (
          <div className={styles.previewSidePane}>
            <MathPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MathInput;

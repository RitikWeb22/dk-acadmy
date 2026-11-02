import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Database,
  Filter,
  CheckCircle2,
  Video,
  FileText,
  X
} from 'lucide-react';
import type { QuestionBankItem, QuestionType, QuestionDifficulty, SubjectDomain } from './types';
import { SUBJECT_CHAPTERS, EXAM_YEARS } from './types';
import { MathText } from '../../ui/MathText/MathText';
import styles from './PyqManagementStudio.module.scss';

interface Props {
  items: QuestionBankItem[];
  onSaveItem: (item: QuestionBankItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const PyqQuestionBankView: React.FC<Props> = ({
  items,
  onSaveItem,
  onDeleteItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  // Modal State for Create / Edit
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.statement.toLowerCase().includes(q) ||
        (item.chapter && item.chapter.toLowerCase().includes(q)) ||
        (item.topic && item.topic.toLowerCase().includes(q));

      const matchesSubject = selectedSubject === 'ALL' || item.subject === selectedSubject;
      const matchesExam = selectedExam === 'ALL' || item.exam === selectedExam;
      const matchesDiff = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty;

      return matchesSearch && matchesSubject && matchesExam && matchesDiff;
    });
  }, [items, searchQuery, selectedSubject, selectedExam, selectedDifficulty]);

  const handleOpenNew = () => {
    setEditingItem({
      id: `qb-${Date.now()}`,
      statement: '',
      subject: 'Mathematics',
      exam: 'JEE Main',
      year: 2024,
      chapter: 'Definite Integration',
      topic: 'Definite Integrals',
      difficulty: 'Moderate',
      questionType: 'Single Correct MCQ',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      correctKey: 'A',
      stepSolution: '',
      dkSirShortcut: '',
      videoUrl: '',
      pdfUrl: '',
      usageCount: 0,
      tags: [],
      createdAt: new Date().toISOString()
    });
    setIsEditorOpen(true);
  };

  const handleSaveModal = async () => {
    if (!editingItem || !editingItem.statement.trim()) {
      alert('Question statement cannot be empty.');
      return;
    }
    await onSaveItem(editingItem);
    setIsEditorOpen(false);
    setEditingItem(null);
  };

  return (
    <div className={styles.contentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitle}>
          <h2>Centralized Question Bank ({filteredItems.length})</h2>
          <p>Search, curate, and reuse verified questions across any PYQ paper or test series.</p>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.searchInput}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search statements or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.selectInput}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="ALL">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mixed">Mixed</option>
          </select>

          <select
            className={styles.selectInput}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="ALL">All Exams</option>
            <option value="JEE Main">JEE Main</option>
            <option value="JEE Advanced">JEE Advanced</option>
            <option value="BITSAT">BITSAT</option>
          </select>

          <select
            className={styles.selectInput}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="ALL">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Challenging">Challenging</option>
          </select>

          <button className={styles.btnPrimary} onClick={handleOpenNew}>
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              borderRadius: 8,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {item.subject}
                </span>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 4,
                    fontSize: '0.75rem'
                  }}
                >
                  {item.exam} {item.year}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {item.chapter}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color:
                      item.difficulty === 'Challenging'
                        ? '#dc2626'
                        : item.difficulty === 'Moderate'
                        ? '#d97706'
                        : '#16a34a'
                  }}
                >
                  • {item.difficulty}
                </span>
                {item.usageCount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#7c3aed' }}>
                    • Used in {item.usageCount} paper{item.usageCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ padding: '0.25rem 0.5rem' }}
                  onClick={() => {
                    setEditingItem(item);
                    setIsEditorOpen(true);
                  }}
                  title="Edit question"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ padding: '0.25rem 0.5rem' }}
                  onClick={async () => {
                    const dup = {
                      ...item,
                      id: `qb-dup-${Date.now()}`
                    };
                    await onSaveItem(dup);
                  }}
                  title="Duplicate in bank"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  style={{ padding: '0.25rem 0.5rem' }}
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete from bank"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Statement */}
            <div style={{ fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.6 }}>
              <MathText text={item.statement} />
            </div>

            {/* Options */}
            {item.options && item.options.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {item.options.map((opt) => (
                  <div
                    key={opt.key}
                    style={{
                      background: opt.key === item.correctKey ? '#f0fdf4' : '#f8fafc',
                      border: opt.key === item.correctKey ? '1px solid #86efac' : '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#1e293b'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: opt.key === item.correctKey ? '#16a34a' : '#2563eb' }}>
                      ({opt.key})
                    </span>
                    <MathText text={opt.text} />
                  </div>
                ))}
              </div>
            )}

            {/* Solution note preview */}
            {item.stepSolution && (
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 6,
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  borderLeft: '3px solid #2563eb'
                }}
              >
                <strong style={{ color: '#0f172a' }}>Derivation: </strong>
                <MathText text={item.stepSolution} />
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            No questions found in question bank matching the filters.
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isEditorOpen && editingItem && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingItem.statement ? 'Edit Question in Bank' : 'Add New Question to Bank'}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsEditorOpen(false)} />
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Subject</label>
                  <select
                    className={styles.formControl}
                    value={editingItem.subject}
                    onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value as SubjectDomain })}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Target Exam</label>
                  <select
                    className={styles.formControl}
                    value={editingItem.exam}
                    onChange={(e) => setEditingItem({ ...editingItem, exam: e.target.value })}
                  >
                    <option value="JEE Main">JEE Main</option>
                    <option value="JEE Advanced">JEE Advanced</option>
                    <option value="BITSAT">BITSAT</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Difficulty</label>
                  <select
                    className={styles.formControl}
                    value={editingItem.difficulty}
                    onChange={(e) => setEditingItem({ ...editingItem, difficulty: e.target.value as QuestionDifficulty })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Challenging">Challenging</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Chapter / Topic</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={editingItem.chapter}
                  onChange={(e) => setEditingItem({ ...editingItem, chapter: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Question Statement (LaTeX supported)</label>
                <textarea
                  rows={3}
                  className={styles.formControl}
                  value={editingItem.statement}
                  onChange={(e) => setEditingItem({ ...editingItem, statement: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Options &amp; Verified Key</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const opt = editingItem.options.find((o) => o.key === key) || { key, text: '' };
                    const isCorrect = editingItem.correctKey === key;
                    return (
                      <div
                        key={key}
                        style={{
                          background: isCorrect ? '#f0fdf4' : '#f8fafc',
                          border: isCorrect ? '1px solid #86efac' : '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, correctKey: key })}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isCorrect ? '#16a34a' : '#e2e8f0',
                            color: isCorrect ? '#fff' : '#64748b',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {key}
                        </button>
                        <input
                          type="text"
                          className={styles.formControl}
                          style={{ border: 'none', background: 'transparent', padding: 0 }}
                          placeholder={`Option ${key}...`}
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = editingItem.options.map((o) =>
                              o.key === key ? { ...o, text: e.target.value } : o
                            );
                            setEditingItem({ ...editingItem, options: newOpts });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Step-by-Step Derivation</label>
                <textarea
                  rows={2}
                  className={styles.formControl}
                  value={editingItem.stepSolution}
                  onChange={(e) => setEditingItem({ ...editingItem, stepSolution: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>DK Sir Speed Shortcut (Optional)</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={editingItem.dkSirShortcut || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, dkSirShortcut: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setIsEditorOpen(false)}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSaveModal}>
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


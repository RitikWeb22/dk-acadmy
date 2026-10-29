import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle2,
  Video,
  FileText,
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { adminService } from '../../../services/adminService';
import type { PYQQuestion, Subject, PYQExam } from '../../../types';
import styles from './AdminPYQPage.module.scss';

export const AdminPYQPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [pyqs, setPyqs] = useState<PYQQuestion[]>(() => cmsService.getPYQs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [editingQuestion, setEditingQuestion] = useState<PYQQuestion | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newForm, setNewForm] = useState({
    exam: 'JEE Main' as PYQExam,
    year: 2024,
    subject: 'Mathematics' as Subject,
    chapter: 'Integral Calculus',
    topic: 'Definite Integrals',
    type: 'Single Choice MCQ' as PYQQuestion['type'],
    marks: '+4 / -1',
    statement: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctAnswer: 'A',
    formulaKey: '',
    explanation: '',
    isFree: false,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    courseName: '10-Year JEE Chapter-Wise PYQ Mastery Course'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshPyqs = () => {
    setPyqs(cmsService.getPYQs());
  };

  useEffect(() => {
    const handleCmsUpdate = () => refreshPyqs();
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);
    return () => window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
  }, []);

  const filteredPyqs = pyqs.filter((q) => {
    const matchesSearch =
      q.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = selectedExam === 'All' || q.exam === selectedExam;
    const matchesSubject = selectedSubject === 'All' || q.subject === selectedSubject;
    return matchesSearch && matchesExam && matchesSubject;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.statement.trim() || !newForm.chapter.trim()) return;

    const options = [
      { id: 'A', text: newForm.optA || 'Option A' },
      { id: 'B', text: newForm.optB || 'Option B' },
      { id: 'C', text: newForm.optC || 'Option C' },
      { id: 'D', text: newForm.optD || 'Option D' }
    ];

    const created = cmsService.createPYQ({
      exam: newForm.exam,
      year: Number(newForm.year),
      subject: newForm.subject,
      chapter: newForm.chapter.trim(),
      topic: newForm.topic.trim(),
      type: newForm.type,
      marks: newForm.marks,
      statement: newForm.statement.trim(),
      options,
      correctAnswer: newForm.correctAnswer,
      formulaKey: newForm.formulaKey.trim() || undefined,
      explanation: newForm.explanation.trim(),
      isFree: Boolean(newForm.isFree),
      youtubeUrl: newForm.youtubeUrl.trim() || undefined,
      pdfUrl: newForm.pdfUrl.trim() || undefined,
      courseId: 'jee-pyq-archive-mastery',
      courseName: newForm.courseName.trim() || '10-Year JEE Chapter-Wise PYQ Mastery Course'
    });

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'COURSE_CREATED',
        module: 'PYQ Bank',
        details: `Added ${created.exam} ${created.year} question: "${created.statement.slice(0, 40)}..."`,
        status: 'SUCCESS'
      });
    }

    showToast('PYQ question added successfully.');
    setIsCreateModalOpen(false);
    refreshPyqs();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    cmsService.updatePYQ(editingQuestion.id, editingQuestion);

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'COURSE_UPDATED',
        module: 'PYQ Bank',
        details: `Updated PYQ question ID: ${editingQuestion.id}`,
        status: 'SUCCESS'
      });
    }

    showToast('PYQ question updated.');
    setEditingQuestion(null);
    refreshPyqs();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this PYQ question?')) return;
    cmsService.deletePYQ(id);
    showToast('PYQ question deleted.');
    refreshPyqs();
  };

  const handleReset = () => {
    if (!window.confirm('Reset PYQ bank to original defaults?')) return;
    cmsService.resetPYQs();
    showToast('PYQ bank reset.');
    refreshPyqs();
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>15-Year PYQ Bank Management</h1>
          <p className={styles.pageSubtitle}>
            Full CRUD: Add, edit, and organize previous years solved questions by Exam, Subject, 5 Free preview vs Course Paid, YouTube solutions &amp; PDF attachments.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
            title="Reset question bank back to default"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add New PYQ</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className={styles.filtersCard}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search questions by chapter, topic, or statement keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="All">All Exams</option>
            <option value="JEE Main">JEE Main</option>
            <option value="JEE Advanced">JEE Advanced</option>
          </select>

          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="All">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
          </select>
        </div>
      </div>

      {/* Question Cards */}
      <div className={styles.questionsList}>
        {filteredPyqs.map((q, idx) => (
          <div key={q.id} className={styles.pyqCard}>
            <div className={styles.cardTopRow}>
              <div className={styles.badgeRow}>
                <span className={styles.examBadge}>{q.exam}</span>
                <span className={styles.yearBadge}>{q.year}</span>
                <span className={styles.subjectBadge}>{q.subject} • {q.chapter}</span>
                
                {/* Free vs Course Locked Tag */}
                {q.isFree || idx < 5 ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#15803d',
                    backgroundColor: '#dcfce7',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles size={11} /> Free (Q{idx + 1})
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#b45309',
                    backgroundColor: '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Lock size={11} /> Course Only
                  </span>
                )}
              </div>

              <div className={styles.actionBtns}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => setEditingQuestion({ ...q })}
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className={styles.delBtn}
                  onClick={() => handleDelete(q.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <p className={styles.statement}>{q.statement}</p>

            {/* Media & Resources Summary */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '6px 0' }}>
              {q.youtubeUrl && (
                <a
                  href={q.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  <Video size={12} /> YouTube Solution <ExternalLink size={10} />
                </a>
              )}
              {q.pdfUrl && (
                <a
                  href={q.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  <FileText size={12} /> Solution PDF <ExternalLink size={10} />
                </a>
              )}
              <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                Course: {q.courseName || 'JEE PYQ Mastery Course'}
              </span>
            </div>

            <div className={styles.optionsGrid}>
              {q.options?.map((opt) => (
                <div
                  key={opt.id}
                  className={`${styles.optionItem} ${opt.id === q.correctAnswer ? styles.correctOption : ''}`}
                >
                  <strong>({opt.id})</strong>
                  <span>{opt.text}</span>
                  {opt.id === q.correctAnswer && <CheckCircle2 size={13} style={{ marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>

            <div className={styles.footerRow}>
              <span className={styles.shortcutInfo}>
                {q.formulaKey ? `Shortcut / Formula: ${q.formulaKey}` : `Marks: ${q.marks}`}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {q.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── MODAL: Create Question ─── */}
      {isCreateModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Solved PYQ Question</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className={styles.editForm}>
              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Exam</label>
                  <select
                    value={newForm.exam}
                    onChange={(e) => setNewForm({ ...newForm, exam: e.target.value as PYQExam })}
                  >
                    <option value="JEE Main">JEE Main</option>
                    <option value="JEE Advanced">JEE Advanced</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label>Year</label>
                  <input
                    type="number"
                    value={newForm.year}
                    onChange={(e) => setNewForm({ ...newForm, year: Number(e.target.value) })}
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Subject</label>
                  <select
                    value={newForm.subject}
                    onChange={(e) => setNewForm({ ...newForm, subject: e.target.value as Subject })}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Chapter</label>
                  <input
                    type="text"
                    value={newForm.chapter}
                    onChange={(e) => setNewForm({ ...newForm, chapter: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Topic</label>
                  <input
                    type="text"
                    value={newForm.topic}
                    onChange={(e) => setNewForm({ ...newForm, topic: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Question Statement</label>
                <textarea
                  rows={3}
                  value={newForm.statement}
                  onChange={(e) => setNewForm({ ...newForm, statement: e.target.value })}
                  required
                />
              </div>

              {/* Options */}
              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Option A</label>
                  <input
                    type="text"
                    value={newForm.optA}
                    onChange={(e) => setNewForm({ ...newForm, optA: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Option B</label>
                  <input
                    type="text"
                    value={newForm.optB}
                    onChange={(e) => setNewForm({ ...newForm, optB: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Option C</label>
                  <input
                    type="text"
                    value={newForm.optC}
                    onChange={(e) => setNewForm({ ...newForm, optC: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Option D</label>
                  <input
                    type="text"
                    value={newForm.optD}
                    onChange={(e) => setNewForm({ ...newForm, optD: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Correct Answer</label>
                  <select
                    value={newForm.correctAnswer}
                    onChange={(e) => setNewForm({ ...newForm, correctAnswer: e.target.value })}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label>Formula Key / Shortcut Rule</label>
                  <input
                    type="text"
                    placeholder="e.g. King's Property"
                    value={newForm.formulaKey}
                    onChange={(e) => setNewForm({ ...newForm, formulaKey: e.target.value })}
                  />
                </div>
              </div>

              {/* Course, 5 Free, YouTube & PDF inputs */}
              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>YouTube Video Solution URL</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newForm.youtubeUrl}
                    onChange={(e) => setNewForm({ ...newForm, youtubeUrl: e.target.value })}
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Solution PDF URL</label>
                  <input
                    type="url"
                    placeholder="https://.../solution.pdf"
                    value={newForm.pdfUrl}
                    onChange={(e) => setNewForm({ ...newForm, pdfUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Associated Course Name</label>
                  <input
                    type="text"
                    value={newForm.courseName}
                    onChange={(e) => setNewForm({ ...newForm, courseName: e.target.value })}
                  />
                </div>
                <div className={styles.formRow} style={{ justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '1.25rem' }}>
                    <input
                      type="checkbox"
                      checked={newForm.isFree}
                      onChange={(e) => setNewForm({ ...newForm, isFree: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Free Preview Question (No purchase required)</span>
                  </label>
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Step-by-Step Solution &amp; Explanation</label>
                <textarea
                  rows={3}
                  value={newForm.explanation}
                  onChange={(e) => setNewForm({ ...newForm, explanation: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save PYQ Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Question ─── */}
      {editingQuestion && (
        <div className={styles.modalBackdrop} onClick={() => setEditingQuestion(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit PYQ Question #{editingQuestion.id}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setEditingQuestion(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.editForm}>
              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Chapter</label>
                  <input
                    type="text"
                    value={editingQuestion.chapter}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, chapter: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Topic</label>
                  <input
                    type="text"
                    value={editingQuestion.topic}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, topic: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Question Statement</label>
                <textarea
                  rows={3}
                  value={editingQuestion.statement}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, statement: e.target.value })
                  }
                />
              </div>

              {/* YouTube and PDF URLs */}
              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>YouTube Video Solution URL</label>
                  <input
                    type="url"
                    value={editingQuestion.youtubeUrl || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, youtubeUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Solution PDF URL</label>
                  <input
                    type="url"
                    value={editingQuestion.pdfUrl || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, pdfUrl: e.target.value })
                    }
                    placeholder="https://.../solution.pdf"
                  />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={editingQuestion.courseName || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, courseName: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formRow} style={{ justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '1.25rem' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingQuestion.isFree)}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, isFree: e.target.checked })
                      }
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Free Preview Question</span>
                  </label>
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Correct Answer</label>
                  <select
                    value={editingQuestion.correctAnswer}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })
                    }
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label>Formula Shortcut</label>
                  <input
                    type="text"
                    value={editingQuestion.formulaKey || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, formulaKey: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Explanation</label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import type { PyqPaper, PublicationStatus, SubjectDomain } from './types';
import styles from './PyqManagementStudio.module.scss';

interface Props {
  papers: PyqPaper[];
  onEditPaper: (paper: PyqPaper) => void;
  onPreviewPaper: (paper: PyqPaper) => void;
  onDuplicatePaper: (paper: PyqPaper) => void;
  onArchivePaper: (paper: PyqPaper) => void;
  onDeletePaper: (paper: PyqPaper) => void;
  onCreateNew: () => void;
}

export const PyqPapersList: React.FC<Props> = ({
  papers,
  onEditPaper,
  onPreviewPaper,
  onDuplicatePaper,
  onArchivePaper,
  onDeletePaper,
  onCreateNew
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [examFilter, setExamFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.chapter && p.chapter.toLowerCase().includes(q));

      const matchesExam =
        examFilter === 'ALL' ||
        (p.targetExam && p.targetExam.toLowerCase().includes(examFilter.toLowerCase()));

      const matchesYear =
        yearFilter === 'ALL' || String(p.year) === String(yearFilter);

      const matchesSubject =
        subjectFilter === 'ALL' || p.subject === subjectFilter;

      const matchesStatus =
        statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesExam && matchesYear && matchesSubject && matchesStatus;
    });
  }, [papers, searchQuery, examFilter, yearFilter, subjectFilter, statusFilter]);

  return (
    <div className={styles.contentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitle}>
          <h2>All Previous Year Question Papers ({filteredPapers.length})</h2>
          <p>Complete archive of JEE Main, JEE Advanced, and BITSAT practice sets.</p>
        </div>

        <div className={styles.filtersRow}>
          {/* Search */}
          <div className={styles.searchInput}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search paper or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Exam */}
          <select
            className={styles.selectInput}
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
          >
            <option value="ALL">All Examinations</option>
            <option value="JEE Main">JEE Main</option>
            <option value="JEE Advanced">JEE Advanced</option>
            <option value="BITSAT">BITSAT</option>
          </select>

          {/* Year */}
          <select
            className={styles.selectInput}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="ALL">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
          </select>

          {/* Subject */}
          <select
            className={styles.selectInput}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="ALL">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mixed">Mixed</option>
          </select>

          {/* Status */}
          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Archived">Archived</option>
          </select>

          <button className={styles.btnPrimary} onClick={onCreateNew}>
            <Plus size={14} /> Create PYQ
          </button>
        </div>
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.saasTable}>
          <thead>
            <tr>
              <th>Paper</th>
              <th>Exam</th>
              <th>Year</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.map((paper) => (
              <tr key={paper.id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{paper.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{paper.slug}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 500 }}>{paper.targetExam || 'JEE Main'}</span>
                </td>
                <td>{paper.year || 2024}</td>
                <td>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>{paper.subject}</span>
                  {paper.chapter && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{paper.chapter}</div>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{paper.questions?.length || paper.questionsCount || 0}</span>
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      paper.status === 'Published'
                        ? styles.published
                        : paper.status === 'Scheduled'
                        ? styles.scheduled
                        : paper.status === 'Archived'
                        ? styles.archived
                        : styles.draft
                    }`}
                  >
                    {paper.status || 'Published'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button
                      className={styles.btnSecondary}
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Preview Student Experience"
                      onClick={() => onPreviewPaper(paper)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Edit Paper"
                      onClick={() => onEditPaper(paper)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles.btnSecondary}
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Duplicate Paper"
                      onClick={() => onDuplicatePaper(paper)}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className={styles.btnSecondary}
                      style={{ padding: '0.35rem 0.6rem' }}
                      title={paper.status === 'Archived' ? 'Restore' : 'Archive'}
                      onClick={() => onArchivePaper(paper)}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      className={styles.btnDanger}
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Delete Paper"
                      onClick={() => onDeletePaper(paper)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPapers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                  No matching PYQ papers found. Adjust your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


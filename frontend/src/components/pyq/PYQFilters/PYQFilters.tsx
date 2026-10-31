import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import type { Subject } from '../../../types';
import { PYQ_SUBJECTS, PYQ_YEARS } from '../../../data/pyqData';
import styles from './PYQFilters.module.scss';

interface PYQFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSubject: 'All' | Subject;
  onSelectSubject: (s: 'All' | Subject) => void;
  selectedYear: number | string;
  onSelectYear: (y: number | string) => void;
  selectedChapter: string;
  onSelectChapter: (c: string) => void;
  availableChapters: string[];
  availableYears?: number[];
  isFilterActive: boolean;
  onResetFilters: () => void;
  resultCount: number;
}

export const PYQFilters: React.FC<PYQFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSelectSubject,
  selectedYear,
  onSelectYear,
  selectedChapter,
  onSelectChapter,
  availableChapters,
  availableYears,
  isFilterActive,
  onResetFilters,
  resultCount
}) => {
  return (
    <div className={styles.filtersContainer}>
      {/* Search Input */}
      <div className={styles.searchRow}>
        <div className={styles.searchInputWrap}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions by keyword or topic..."
            className={styles.searchInput}
            aria-label="Search questions"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className={styles.clearSearchBtn}
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Year Dropdown */}
        <div className={styles.dropdownWrap}>
          <label htmlFor="year-select" className={styles.visuallyHidden}>Filter by Year</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => {
              const val = e.target.value === 'All' ? 'All' : Number(e.target.value);
              onSelectYear(val);
            }}
            className={styles.selectInput}
          >
            <option value="All">All Years</option>
            {(availableYears && availableYears.length > 0 ? availableYears : PYQ_YEARS).map((yr) => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>
        </div>

        {/* Chapter Dropdown */}
        {availableChapters.length > 0 && (
          <div className={styles.dropdownWrap}>
            <label htmlFor="chapter-select" className={styles.visuallyHidden}>Filter by Chapter</label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={(e) => onSelectChapter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="All">All Chapters</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Subject Pills & Results Row */}
      <div className={styles.bottomRow}>
        <div className={styles.subjectControlsGroup}>
          <div className={styles.subjectPills} role="tablist" aria-label="Filter by Subject">
            {PYQ_SUBJECTS.map((sub) => {
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`${styles.pillBtn} ${isSelected ? styles.activePill : ''}`}
                  onClick={() => onSelectSubject(sub)}
                >
                  {sub === 'All' ? 'All Subjects' : sub}
                </button>
              );
            })}
          </div>

          <span className={styles.countText} aria-live="polite">
            <strong>{resultCount}</strong> {resultCount === 1 ? 'question' : 'questions'} available
          </span>
        </div>

        {isFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className={styles.resetBtn}
            aria-label="Clear all PYQ filters"
          >
            <RotateCcw size={14} className={styles.resetIcon} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

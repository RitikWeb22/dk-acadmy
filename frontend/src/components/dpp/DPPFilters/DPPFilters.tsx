import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { DPPDifficulty } from '../../../types';
import styles from './DPPFilters.module.scss';

export type DifficultyFilterValue = 'All' | DPPDifficulty;
export type StatusFilterValue = 'All' | 'Not Started' | 'In Progress' | 'Completed';

interface DPPFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDifficulty: DifficultyFilterValue;
  onDifficultyChange: (difficulty: DifficultyFilterValue) => void;
  selectedStatus: StatusFilterValue;
  onStatusChange: (status: StatusFilterValue) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalResults: number;
}

export const DPPFilters: React.FC<DPPFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  totalResults,
}) => {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterRow}>
        {/* Search input */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by topic, chapter, or problem set title..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search DPP Sets"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className={styles.selectGroup}>
          <div className={styles.selectWrapper}>
            <label htmlFor="dpp-difficulty-select" className={styles.visuallyHidden}>
              Filter by Difficulty
            </label>
            <select
              id="dpp-difficulty-select"
              className={styles.selectControl}
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value as DifficultyFilterValue)}
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy Level</option>
              <option value="Medium">Medium (JEE Main)</option>
              <option value="Hard">Hard (JEE Advanced)</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <label htmlFor="dpp-status-select" className={styles.visuallyHidden}>
              Filter by Practice Status
            </label>
            <select
              id="dpp-status-select"
              className={styles.selectControl}
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as StatusFilterValue)}
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={onClearFilters}
              aria-label="Clear all active filters"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results summary bar */}
      <div className={styles.resultsMeta}>
        <div className={styles.resultsCount}>
          <SlidersHorizontal size={14} className={styles.metaIcon} />
          <span>
            Showing <strong>{totalResults}</strong> {totalResults === 1 ? 'practice set' : 'practice sets'}
          </span>
        </div>
      </div>
    </div>
  );
};

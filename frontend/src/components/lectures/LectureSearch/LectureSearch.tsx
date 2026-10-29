import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './LectureSearch.module.scss';

interface LectureSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export const LectureSearch: React.FC<LectureSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch
}) => {
  return (
    <div className={styles.searchWrapper}>
      <label htmlFor="lecture-search-input" className={styles.visuallyHidden}>
        Search lectures, chapters or topics
      </label>
      <div className={styles.inputContainer}>
        <Search size={18} className={styles.searchIcon} aria-hidden="true" />
        <input
          id="lecture-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search lectures, chapters or topics..."
          className={styles.input}
          autoComplete="off"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={onClearSearch}
            className={styles.clearBtn}
            aria-label="Clear lecture search input"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

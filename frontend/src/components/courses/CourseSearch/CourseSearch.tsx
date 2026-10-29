import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './CourseSearch.module.scss';

interface CourseSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export const CourseSearch: React.FC<CourseSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch
}) => {
  return (
    <div className={styles.searchWrapper}>
      <label htmlFor="course-search-input" className={styles.visuallyHidden}>
        Search courses by name or subject
      </label>
      <div className={styles.inputContainer}>
        <Search size={18} className={styles.searchIcon} aria-hidden="true" />
        <input
          id="course-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search courses by name or subject..."
          className={styles.input}
          autoComplete="off"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={onClearSearch}
            className={styles.clearBtn}
            aria-label="Clear search input"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

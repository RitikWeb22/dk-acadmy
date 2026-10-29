import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './NotificationFilters.module.scss';

export type FilterCategory = 'all' | 'unread' | 'announcement' | 'course' | 'practice_test';

interface NotificationFiltersProps {
  activeCategory: FilterCategory;
  onSelectCategory: (cat: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    unread: number;
    announcement: number;
    course: number;
    practice_test: number;
  };
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  counts
}) => {
  // 250ms Debounced search input
  const [localInput, setLocalInput] = useState(searchQuery);

  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInput !== searchQuery) {
        onSearchChange(localInput);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [localInput, onSearchChange, searchQuery]);

  const handleClear = () => {
    setLocalInput('');
    onSearchChange('');
  };

  const filterTabs: { id: FilterCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unread', label: 'Unread', count: counts.unread },
    { id: 'announcement', label: 'Announcements', count: counts.announcement },
    { id: 'course', label: 'Courses', count: counts.course },
    { id: 'practice_test', label: 'Practice & Tests', count: counts.practice_test }
  ];

  return (
    <div className={styles.filterBar}>
      {/* Category Tabs: Horizontal scrolling on mobile */}
      <div className={styles.tabList} role="tablist" aria-label="Notification Categories">
        {filterTabs.map((tab) => {
          const isSelected = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectCategory(tab.id)}
              className={`${styles.tabBtn} ${isSelected ? styles.activeTab : ''}`}
            >
              <span>{tab.label}</span>
              <span
                className={`${styles.countBadge} ${
                  tab.id === 'unread' && tab.count > 0 ? styles.unreadBadge : ''
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyword Search with 250ms debounce */}
      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder="Search notifications..."
          className={styles.searchInput}
          aria-label="Search notifications"
        />
        {localInput && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearBtn}
            aria-label="Clear search input"
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

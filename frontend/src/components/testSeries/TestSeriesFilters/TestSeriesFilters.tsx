import React from 'react';
import { Search, X, SlidersHorizontal, Layers, GraduationCap, Flame, Zap } from 'lucide-react';
import type { TestFormat, TestDifficulty, TestExamType } from '../../../types';
import styles from './TestSeriesFilters.module.scss';

export type FormatFilterValue = 'All' | TestFormat;
export type DifficultyFilterValue = 'All' | TestDifficulty;
export type StatusFilterValue = 'All' | 'Not Started' | 'In Progress' | 'Completed';
export type ExamFilterValue = 'All' | TestExamType | 'MathSpeed';

interface PrimaryTabItem {
  value: ExamFilterValue;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const PRIMARY_EXAM_TABS: PrimaryTabItem[] = [
  { value: 'All', label: 'All India CBT Mock', icon: Layers },
  { value: 'JEE Main', label: 'JEE Main Filter', icon: GraduationCap },
  { value: 'JEE Advanced', label: 'JEE Advanced Engine', icon: Flame },
  { value: 'MathSpeed', label: 'DK Sir Math Speed', icon: Zap, badge: 'HOT' },
];

interface TestSeriesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFormat: FormatFilterValue;
  onFormatChange: (format: FormatFilterValue) => void;
  selectedDifficulty: DifficultyFilterValue;
  onDifficultyChange: (diff: DifficultyFilterValue) => void;
  selectedStatus: StatusFilterValue;
  onStatusChange: (status: StatusFilterValue) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalResults: number;
  selectedExam?: ExamFilterValue;
  onSelectExam?: (exam: ExamFilterValue) => void;
  examCounts?: Record<ExamFilterValue, number>;
}

export const TestSeriesFilters: React.FC<TestSeriesFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedFormat,
  onFormatChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  totalResults,
  selectedExam = 'All',
  onSelectExam,
  examCounts = { All: 0, 'JEE Main': 0, 'JEE Advanced': 0, BITSAT: 0, MathSpeed: 0 }
}) => {
  return (
    <div className={styles.toolbarContainer} aria-label="Mock Test Filters and Search Toolbar">
      {/* 1. Primary Exam Tabs: "All India CBT Mock", "JEE Main Filter", "JEE Advanced Engine", "DK Sir Math Speed" */}
      {onSelectExam && (
        <div className={styles.primaryTabsRow} role="tablist" aria-label="Primary Mock Test Categories">
          {PRIMARY_EXAM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedExam === tab.value;
            const count = examCounts[tab.value] ?? 0;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.primaryTabBtn} ${isSelected ? styles.primaryTabActive : ''}`}
                onClick={() => onSelectExam(tab.value)}
              >
                <Icon size={16} className={styles.tabIcon} aria-hidden="true" />
                <span className={styles.tabTitle}>{tab.label}</span>
                {tab.badge && <span className={styles.hotBadge}>{tab.badge}</span>}
                <span className={styles.tabCountPill}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Secondary Dropdowns & Search in a Single Responsive Row */}
      <div className={styles.secondaryControlsRow}>
        {/* Search Input */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by mock title, chapter, or topic..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search Mock Tests"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Dropdowns Group: Format, Difficulty, Status */}
        <div className={styles.selectGroup}>
          {/* Format Dropdown */}
          <div className={styles.selectWrapper}>
            <label htmlFor="test-format-select" className={styles.visuallyHidden}>
              Filter by Format
            </label>
            <select
              id="test-format-select"
              className={styles.selectControl}
              value={selectedFormat}
              onChange={(e) => onFormatChange(e.target.value as FormatFilterValue)}
            >
              <option value="All">All Formats</option>
              <option value="Full Mock">Full-Length Mocks</option>
              <option value="Part Test">Part Tests</option>
              <option value="Chapter Test">Chapter Tests</option>
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div className={styles.selectWrapper}>
            <label htmlFor="test-diff-select" className={styles.visuallyHidden}>
              Filter by Difficulty
            </label>
            <select
              id="test-diff-select"
              className={styles.selectControl}
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value as DifficultyFilterValue)}
            >
              <option value="All">All Difficulties</option>
              <option value="Moderate">Moderate (Main Level)</option>
              <option value="Challenging">Challenging</option>
              <option value="Advanced">Advanced (IIT Ranker)</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className={styles.selectWrapper}>
            <label htmlFor="test-status-select" className={styles.visuallyHidden}>
              Filter by Status
            </label>
            <select
              id="test-status-select"
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

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={onClearFilters}
              aria-label="Clear all active test filters"
            >
              <X size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta Footer Bar */}
      <div className={styles.resultsMeta} aria-live="polite" aria-atomic="true">
        <div className={styles.resultsCount}>
          <SlidersHorizontal size={14} className={styles.metaIcon} aria-hidden="true" />
          <span>
            Showing <strong>{totalResults}</strong> {totalResults === 1 ? 'mock test' : 'mock tests'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestSeriesFilters;

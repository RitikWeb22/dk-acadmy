import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Search,
  X,
  Pause,
  Play
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { AchieverCard } from './AchieverCard';
import { AchieverAdminModal } from './AchieverAdminModal';
import {
  achieverService,
  type AchieverData
} from '../../../services/achieverService';
import styles from './AchieversSection.module.scss';

export interface AchieversSectionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  showAdminControls?: boolean;
}

export const AchieversSection: React.FC<AchieversSectionProps> = ({
  badge,
  title,
  subtitle
}) => {
  const [achievers, setAchievers] = useState<AchieverData[]>(() =>
    achieverService.getAchievers()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedExam, setSelectedExam] = useState<'All' | 'JEE Advanced' | 'JEE Main' | 'BITSAT'>('All');
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchiever, setEditingAchiever] = useState<AchieverData | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Subscribe to changes from localStorage or admin CRUD actions
  useEffect(() => {
    const unsubscribe = achieverService.subscribe(() => {
      setAchievers(achieverService.getAchievers());
    });
    return unsubscribe;
  }, []);

  // Dynamic available years list
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(achievers.map((a) => a.year).filter(Boolean)));
    return years.sort((a, b) => Number(b) - Number(a));
  }, [achievers]);

  // Real-time search and filter logic
  const filteredAchievers = useMemo(() => {
    return achievers.filter((student) => {
      // 1. Year filter
      if (selectedYear !== 'All' && student.year !== selectedYear) {
        return false;
      }

      // 2. Exam filter
      if (selectedExam === 'JEE Advanced') {
        const hasAdv = Boolean(student.advRank && student.advRank.trim().length > 0) || student.examTag === 'JEE Advanced';
        if (!hasAdv) return false;
      } else if (selectedExam === 'JEE Main') {
        const hasMain = Boolean(student.jeeMainsScore || student.score);
        if (!hasMain) return false;
      } else if (selectedExam === 'BITSAT') {
        const hasBitsat = Boolean(student.bitsatRank && student.bitsatRank.trim().length > 0);
        if (!hasBitsat) return false;
      }

      // 3. Search query
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const matchName = student.name.toLowerCase().includes(q);
      const matchScore = student.score?.toLowerCase().includes(q) || false;
      const matchMains = student.jeeMainsScore?.toLowerCase().includes(q) || false;
      const matchAdv = student.advRank?.toLowerCase().includes(q) || false;
      const matchBitsat = student.bitsatRank?.toLowerCase().includes(q) || false;
      const matchTopic = student.highlightTopic?.toLowerCase().includes(q) || false;
      const matchYear = student.year?.toLowerCase().includes(q) || false;

      return matchName || matchScore || matchMains || matchAdv || matchBitsat || matchTopic || matchYear;
    });
  }, [achievers, selectedYear, selectedExam, searchQuery]);

  const isFiltered = Boolean(searchQuery.trim() || selectedYear !== 'All' || selectedExam !== 'All');

  const handleOpenAdd = () => {
    setEditingAchiever(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (achiever: AchieverData) => {
    setEditingAchiever(achiever);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const target = achievers.find((a) => a.id === id);
    if (!target) return;
    const confirmed = window.confirm(`Are you sure you want to delete the record for "${target.name}"?`);
    if (confirmed) {
      achieverService.deleteAchiever(id);
    }
  };

  const handleSaveModal = (data: Omit<AchieverData, 'id'>) => {
    if (editingAchiever) {
      achieverService.updateAchiever(editingAchiever.id, data);
    } else {
      achieverService.createAchiever(data);
    }
    setIsModalOpen(false);
    setEditingAchiever(null);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedYear('All');
    setSelectedExam('All');
  };

  return (
    <section className={styles.section} id="achievers" aria-labelledby="achievers-heading">
      {/* Background ambient lighting */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide">
        {/* ─── Section Header ─── */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            {/* Eyebrow Badge */}
            <div className={styles.eyebrowBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <Trophy size={14} className={styles.trophyIcon} aria-hidden="true" />
              <span>{badge || "ACADEMIC MILESTONES • MERIT LIST"}</span>
            </div>

            {/* Title with Gradient Accent */}
            <h2 id="achievers-heading" className={styles.sectionTitle}>
              {title ? (
                title
              ) : (
                <>
                  Meet Our <span className={styles.titleGradient}>JEE Achievers</span>
                </>
              )}
            </h2>

            {/* Subtitle */}
            <p className={styles.sectionSubtitle}>
              {subtitle ||
                "Official verified percentiles and All-India ranks from our 2 Year Classroom Program mentored under DK Sir."}
            </p>
          </div>

          {/* Top Actions: Marquee Pause / Resume */}
          <div className={styles.topActions}>
            {!isFiltered && (
              <button
                type="button"
                className={styles.marqueeToggleBtn}
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? "Resume auto-scroll marquee" : "Pause auto-scroll marquee"}
                title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
              >
                {isPaused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Search & Year/Exam Filters Bar ─── */}
        <div className={styles.filterBarWrapper}>
          {/* Real-time Search Input */}
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, percentile, rank, batch..."
              className={styles.searchInput}
              aria-label="Search student achievers"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchBtn}
                aria-label="Clear search text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Year and Exam Filter Chips */}
          <div className={styles.filterGroupsRow}>
            {/* Year Filters */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Year:</span>
              <div className={styles.chipsScrollList}>
                <button
                  type="button"
                  className={`${styles.filterChip} ${selectedYear === 'All' ? styles.filterChipActive : ''}`}
                  onClick={() => setSelectedYear('All')}
                >
                  All
                </button>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    className={`${styles.filterChip} ${selectedYear === yr ? styles.filterChipActive : ''}`}
                    onClick={() => setSelectedYear(yr)}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Filters */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Exam:</span>
              <div className={styles.chipsScrollList}>
                {(['All', 'JEE Advanced', 'JEE Main', 'BITSAT'] as const).map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    className={`${styles.filterChip} ${selectedExam === ex ? styles.filterChipActive : ''}`}
                    onClick={() => setSelectedExam(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ─── Case A: Filters Applied -> 4-Column Responsive Grid ─── */}
      {isFiltered ? (
        <Container size="wide">
          {filteredAchievers.length > 0 ? (
            <div className={styles.cardsGrid} role="list" aria-label="Filtered Achievers Grid">
              {filteredAchievers.map((achiever) => (
                <div key={achiever.id} role="listitem">
                  <AchieverCard
                    achiever={achiever}
                    isAdmin={false}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyStateCard}>
              <h3 className={styles.emptyTitle}>No achievers found</h3>
              <p className={styles.emptyText}>
                No student records matched &quot;{searchQuery}&quot; with selected filters.
              </p>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            </div>
          )}
        </Container>
      ) : (
        /* ─── Case B: Default View -> Continuous Marquee with Hover Pause ─── */
        <div
          ref={marqueeRef}
          className={styles.marqueeWrapper}
          role="region"
          aria-label="Meet Our JEE Achievers auto-scroll showcase"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`${styles.beltTrack} ${isPaused ? styles.pausedTrack : ''}`}>
            {[...achievers, ...achievers, ...achievers, ...achievers].map((achiever, index) => (
              <div key={`${achiever.id}-${index}`} className={styles.cardItemWrap}>
                <AchieverCard
                  achiever={achiever}
                  isAdmin={false}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Admin Add / Edit Modal ─── */}
      <AchieverAdminModal
        isOpen={isModalOpen}
        achieverToEdit={editingAchiever}
        onSave={handleSaveModal}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAchiever(null);
        }}
      />
    </section>
  );
};

export default AchieversSection;

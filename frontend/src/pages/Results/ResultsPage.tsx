import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Zap,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  Search,
  X,
  Info,
  ShieldCheck,
  Quote,
  Star,
  Calendar
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { AchieverCard } from '../../components/home/AchieversSection/AchieverCard';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import { SUCCESS_STORIES } from '../../data/homepageRedesignData';
import type { AchieverItem } from '../../types';
import styles from './ResultsPage.module.scss';

type FilterTab = 'All' | 'JEE Advanced' | 'JEE Main' | 'Top 1% Club' | 'Year 2024 / 2025';

export const ResultsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [achieversList, setAchieversList] = useState<AchieverItem[]>(() => cmsService.getResults());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "JEE Achievers & Hall of Fame | DK Academy Kota Mentorship";
    window.scrollTo(0, 0);

    const handleUpdate = () => setAchieversList(cmsService.getResults());
    window.addEventListener(CMS_EVENT_KEY, handleUpdate);
    return () => window.removeEventListener(CMS_EVENT_KEY, handleUpdate);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic tab counts calculation
  const tabCounts = useMemo(() => {
    return {
      All: achieversList.length,
      'JEE Advanced': achieversList.filter((a) => a.examTag === 'JEE Advanced').length,
      'JEE Main': achieversList.filter((a) => a.examTag === 'JEE Main').length,
      'Top 1% Club': achieversList.filter(
        (a) =>
          a.score.includes('99.') ||
          (Boolean(a.rankOrCollege) && /AIR\s*([1-9][0-9]{0,3}|[1-2][0-9]{3})\b/i.test(a.rankOrCollege || '')) ||
          /AIR\s*([1-9][0-9]{0,3}|[1-2][0-9]{3})\b/i.test(a.score)
      ).length,
      'Year 2024 / 2025': achieversList.filter((a) => a.year === '2024' || a.year === '2025').length
    };
  }, [achieversList]);

  // Filter & Search Logic
  const filteredAchievers = useMemo(() => {
    return achieversList.filter((item) => {
      // 1. Tab filter
      let matchesTab = true;
      if (selectedFilter === 'JEE Advanced') {
        matchesTab = item.examTag === 'JEE Advanced';
      } else if (selectedFilter === 'JEE Main') {
        matchesTab = item.examTag === 'JEE Main';
      } else if (selectedFilter === 'Top 1% Club') {
        matchesTab =
          item.score.includes('99.') ||
          (Boolean(item.rankOrCollege) && /AIR\s*([1-9][0-9]{0,3}|[1-2][0-9]{3})\b/i.test(item.rankOrCollege || '')) ||
          /AIR\s*([1-9][0-9]{0,3}|[1-2][0-9]{3})\b/i.test(item.score);
      } else if (selectedFilter === 'Year 2024 / 2025') {
        matchesTab = item.year === '2024' || item.year === '2025';
      }

      if (!matchesTab) return false;

      // 2. Search query filter
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        (item.rankOrCollege && item.rankOrCollege.toLowerCase().includes(q)) ||
        item.score.toLowerCase().includes(q) ||
        item.highlightTopic.toLowerCase().includes(q) ||
        item.examTag.toLowerCase().includes(q)
      );
    });
  }, [achieversList, selectedFilter, searchQuery]);

  const handleResetFilters = () => {
    setSelectedFilter('All');
    setSearchQuery('');
  };

  return (
    <main className={styles.pageWrap}>
      {/* ─── 1. Hero Header & Quick Stats Strip ─── */}
      <section className={styles.heroSection}>
        {/* Ambient atmospheric gradients & mathematical grid */}
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div className={styles.mathGridOverlay} aria-hidden="true" />

        <Container size="wide">
          <div className={styles.breadcrumb}>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className={styles.heroContent}>
            {/* Header Eyebrow Badge */}
            <div className={styles.badgePill}>
              <span className={styles.badgePulseDot} aria-hidden="true" />
              <Trophy size={13} className={styles.trophyIcon} aria-hidden="true" />
              <span>OFFICIAL KOTA METHODOLOGY • 100% AUDITED JEE SELECTIONS</span>
            </div>

            {/* Title & Subheadline */}
            <h1 className={styles.pageTitle}>
              JEE Achievers &amp; <span className={styles.titleGradient}>Hall of Fame</span>
            </h1>
            <p className={styles.pageDesc}>
              A transparent, 100% verified showcase of students mentored under DK Sir&apos;s proprietary 20–30s
              speed inspection algorithms — mastering non-routine problems to secure top IIT, NIT &amp; BITS Pilani ranks.
            </p>

            {/* Quick Metric Counter Strip (4-column executive cards) */}
            <div className={styles.statsStrip}>
              {/* Stat 1: IITians Mentored */}
              <div className={`${styles.statItem} ${styles.statItemBlue}`}>
                <div className={styles.statTopRow}>
                  <div className={styles.statIconWrap}>
                    <GraduationCap size={22} aria-hidden="true" />
                  </div>
                  <span className={styles.statTag}>SELECTIONS</span>
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statNumberRow}>
                    <strong className={styles.statNumber}>450+</strong>
                  </div>
                  <span className={styles.statLabel}>IITians Mentored</span>
                  <span className={styles.statSub}>Across IIT Bombay, Delhi &amp; Top IITs</span>
                </div>
              </div>

              {/* Stat 2: Peak Score */}
              <div className={`${styles.statItem} ${styles.statItemAmber}`}>
                <div className={styles.statTopRow}>
                  <div className={styles.statIconWrap}>
                    <Trophy size={22} aria-hidden="true" />
                  </div>
                  <span className={styles.statTag}>TOP 0.1% KOTA</span>
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statNumberRow}>
                    <strong className={styles.statNumber}>99.8%ile</strong>
                  </div>
                  <span className={styles.statLabel}>Peak Score Achieved</span>
                  <span className={styles.statSub}>In JEE Main Physics &amp; Mathematics</span>
                </div>
              </div>

              {/* Stat 3: Under AIR 1000 */}
              <div className={`${styles.statItem} ${styles.statItemPurple}`}>
                <div className={styles.statTopRow}>
                  <div className={styles.statIconWrap}>
                    <Zap size={22} aria-hidden="true" />
                  </div>
                  <span className={styles.statTag}>AIR TOP 1000</span>
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statNumberRow}>
                    <strong className={styles.statNumber}>35+</strong>
                  </div>
                  <span className={styles.statLabel}>Under AIR 1000</span>
                  <span className={styles.statSub}>JEE Advanced Top Rank Selections</span>
                </div>
              </div>

              {/* Stat 4: 100% Verified */}
              <div className={`${styles.statItem} ${styles.statItemEmerald}`}>
                <div className={styles.statTopRow}>
                  <div className={styles.statIconWrap}>
                    <ShieldCheck size={22} aria-hidden="true" />
                  </div>
                  <span className={styles.statTag}>100% AUDITED</span>
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statNumberRow}>
                    <strong className={styles.statNumber}>100%</strong>
                  </div>
                  <span className={styles.statLabel}>Verified NTA Scores</span>
                  <span className={styles.statSub}>Official Scorecards On File</span>
                </div>
              </div>
            </div>

            {/* ─── 2. Filter Toolbar & Search Bar ─── */}
            <div className={styles.toolbarWrapper}>
              {/* Segmented Tab Control with Counts & Icons */}
              <div className={styles.filterTabs} role="tablist" aria-label="Filter results by achiever category">
                {(
                  [
                    { id: 'All', label: 'All Achievers', icon: Sparkles },
                    { id: 'JEE Advanced', label: 'JEE Advanced', icon: GraduationCap },
                    { id: 'JEE Main', label: 'JEE Main', icon: Trophy },
                    { id: 'Top 1% Club', label: 'Top 1% Club', icon: Zap },
                    { id: 'Year 2024 / 2025', label: 'Year 2024 / 2025', icon: Calendar }
                  ] as const
                ).map((tab) => {
                  const count = tabCounts[tab.id];
                  const isActive = selectedFilter === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`${styles.filterBtn} ${isActive ? styles.activeFilter : ''}`}
                      onClick={() => setSelectedFilter(tab.id)}
                    >
                      <TabIcon size={14} className={styles.tabBtnIcon} aria-hidden="true" />
                      <span>{tab.label}</span>
                      <span className={styles.tabCountBadge}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Search Input with Enhanced Visuals & Chips */}
              <div className={styles.searchBarContainer}>
                <div className={styles.searchFieldWrapper}>
                  <Search size={18} className={styles.searchIcon} aria-hidden="true" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, college, score (e.g. Rishabh, IIT Delhi, 99.8)..."
                    className={styles.searchInput}
                    aria-label="Search achievers by name, college, score, or batch"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={styles.clearSearchBtn}
                      aria-label="Clear search query"
                    >
                      <X size={15} />
                    </button>
                  ) : (
                    <span className={styles.searchHintBadge} title="Press / to quickly search">
                      <kbd className={styles.kbdKey}>/</kbd>
                    </span>
                  )}
                </div>

                {/* Popular Search Chips for Quick Discovery */}
                <div className={styles.searchChipsRow}>
                  <span className={styles.chipsLabel}>Quick Search:</span>
                  {[
                    'AIR 2146',
                    'IIT Bombay',
                    '99.8%ile',
                    'Calculus',
                    'Dwarka'
                  ].map((chip) => {
                    const isSelected = searchQuery.toLowerCase() === chip.toLowerCase();
                    return (
                      <button
                        key={chip}
                        type="button"
                        className={`${styles.quickChip} ${isSelected ? styles.quickChipActive : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSearchQuery('');
                          } else {
                            setSearchQuery(chip);
                            searchInputRef.current?.focus();
                          }
                        }}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>

                {/* Live Count & Status Feedback */}
                <div className={styles.searchFeedbackBar}>
                  <div className={styles.feedbackLeft}>
                    <ShieldCheck size={13} className={styles.shieldVerifyIcon} />
                    <span>
                      Showing <strong>{filteredAchievers.length}</strong> of {achieversList.length} verified records
                    </span>
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.clearFilterLink}
                      onClick={handleResetFilters}
                    >
                      Clear search filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 3. Official Results Banner Showcase ─── */}
      <section className={styles.bannerSection}>
        <Container size="wide">
          <div className={styles.resultsBannerCard}>
            <div className={styles.bannerImageContainer}>
              <img
                src="/img/dk-results-banner.jpeg"
                alt="DK Academy Official Results & Achievers Felicitation"
                className={styles.bannerImg}
                loading="lazy"
              />
            </div>
            <div className={styles.bannerInfoBar}>
              <div className={styles.bannerTagRow}>
                <span className={styles.bannerTag}>
                  <Sparkles size={13} />
                  <span>KOTA SHORTCUT INSPECTION ARCHIVE</span>
                </span>
                <span className={styles.bannerSubtext}>
                  Felicitation of top-rank students trained at Dwarka Sector 12 Center &amp; Online Batches
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 4. Achiever Card 4-Column Responsive Grid ─── */}
      <section className={styles.gridSection}>
        <Container size="wide">
          <div className={styles.gridHeaderRow}>
            <div className={styles.gridTitleCol}>
              <div className={styles.gridEyebrow}>
                <Sparkles size={13} className={styles.sparkleIcon} aria-hidden="true" />
                <span>NTA &amp; IIT Confirmed Results</span>
              </div>
              <h2 className={styles.sectionTitle}>
                {selectedFilter === 'All' ? 'All Verified Student Achievers' : `${selectedFilter} Achievers`}
              </h2>
            </div>
            <div className={styles.showingCountBadge}>
              <CheckCircle2 size={14} className={styles.countCheckIcon} aria-hidden="true" />
              <span>Showing {filteredAchievers.length} of {achieversList.length} verified records</span>
            </div>
          </div>

          {filteredAchievers.length > 0 ? (
            <div className={styles.resultsGrid}>
              {filteredAchievers.map((achiever) => (
                <AchieverCard
                  key={achiever.id}
                  achiever={achiever}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyStateIcon}>
                <Search size={32} />
              </div>
              <h3 className={styles.emptyStateTitle}>No achievers found</h3>
              <p className={styles.emptyStateText}>
                No student records matched &quot;{searchQuery}&quot; under the &quot;{selectedFilter}&quot; filter.
              </p>
              <button
                type="button"
                className={styles.resetFilterBtn}
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* ─── 5. IIT Alumni Success Stories ─── */}
          <div className={styles.storiesContainer}>
            <div className={styles.storiesHeader}>
              <div className={styles.storiesEyebrow}>
                <Sparkles size={14} className={styles.eyebrowIcon} />
                <span>AUTHENTIC STUDENT JOURNEYS • PROVEN PEDAGOGY</span>
              </div>
              <h2 className={styles.storiesTitle}>
                How DK Sir Mentored Them To <span className={styles.titleGradient}>Top Ranks</span>
              </h2>
              <p className={styles.storiesSubtitle}>
                Real experiences of students who transformed their Mathematics scores from negative-marking traps to <strong>99+ percentiles</strong> and dream IIT admissions.
              </p>
            </div>

            <div className={styles.storiesGrid}>
              {SUCCESS_STORIES.slice(0, 3).map((story) => (
                <div key={story.id} className={styles.storyCard}>
                  {/* Decorative quote mark in top corner */}
                  <Quote size={52} className={styles.quoteWatermark} aria-hidden="true" />

                  {/* Header: Avatar, Name & Ratings */}
                  <div className={styles.storyHeader}>
                    <div className={styles.storyAvatarWrap}>
                      <img src={story.image} alt={story.name} className={styles.storyAvatar} />
                      <span className={styles.verifiedDot} title="Verified Mentee">
                        <ShieldCheck size={11} strokeWidth={3} />
                      </span>
                    </div>
                    <div className={styles.storyMeta}>
                      <div className={styles.storyNameRow}>
                        <h4 className={styles.storyName}>{story.name}</h4>
                        <div className={styles.starRow} aria-label="5 out of 5 stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={styles.starFilled} />
                          ))}
                        </div>
                      </div>
                      <span className={styles.examTagPill}>{story.examTag}</span>
                    </div>
                  </div>

                  {/* Badges: College & Achievement */}
                  <div className={styles.achievementPillRow}>
                    <div className={styles.storyCollege}>
                      <GraduationCap size={13} className={styles.metaIcon} />
                      <span>{story.college}</span>
                    </div>
                    <div className={styles.achievementPill}>
                      <Trophy size={12} className={styles.trophyIcon} />
                      <span>{story.achievement}</span>
                    </div>
                  </div>

                  {/* The Quote */}
                  <p className={styles.storyQuote}>&ldquo;{story.quote}&rdquo;</p>

                  {/* Breakthrough Takeaway */}
                  <div className={styles.storyTakeaway}>
                    <div className={styles.takeawayLabelCol}>
                      <Zap size={13} className={styles.takeawayIcon} />
                      <span className={styles.takeawayTag}>Key Breakthrough</span>
                    </div>
                    <span className={styles.takeawayText}>{story.keyTakeaway}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── 6. Legal / Scorecard Disclaimer Box ─── */}
          <div className={styles.disclaimerBox} role="note" aria-label="Official Results Disclaimer">
            <div className={styles.disclaimerIconWrap}>
              <Info size={22} className={styles.disclaimerIcon} aria-hidden="true" />
            </div>
            <div className={styles.disclaimerContent}>
              <h4 className={styles.disclaimerHeadline}>
                Official Results Disclaimer: All scores are verified against NTA application numbers and admit cards.
              </h4>
              <p className={styles.disclaimerBody}>
                All percentiles, All India Ranks (AIR), and college allocations displayed on this page are strictly of students
                enrolled in DK Academy classroom, test series, or mentorship programs. Individual results may vary based on student
                dedication and study consistency. Scorecards are archived with student and guardian consent in accordance with NTA
                and Consumer Protection Guidelines.
              </p>
            </div>
          </div>

          {/* ─── 7. Bottom Conversion Banner ─── */}
          <div className={styles.ctaBanner}>
            <div className={styles.ctaTextCol}>
              <span className={styles.ctaEyebrow}>JOIN THE NEXT BATCH OF ACHIEVERS</span>
              <h3 className={styles.ctaTitle}>Aiming for 99+ Percentile in JEE Mathematics?</h3>
              <p className={styles.ctaSubtitle}>
                Join DK Sir&apos;s small batch mentorship at Dwarka / Janakpuri center and master 20-30s speed inspection algorithms.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <a href="/#callback" className={styles.ctaPrimaryBtn}>
                <span>Book Free Demo Class</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link to="/courses" className={styles.ctaSecondaryBtn}>
                <span>Explore Batches</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
};

export default ResultsPage;


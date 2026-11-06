import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  X,
  Trophy,
  CheckCircle2,
  Landmark
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import { TrophyHeroIllustration } from './TrophyHeroIllustration';
import styles from './ResultsBannerStrip.module.scss';

export interface Ranker {
  id: string;
  name: string;
  score: string;
  scoreDenominator: string;
  college: string;
  examCategory: 'IIT Advanced' | 'IIT Main' | 'BITSAT';
  examIndicator: string;
  image: string;
  badgeColor?: string;
}

export const TOP_RANKERS_LIST: Ranker[] = [
  {
    id: 'ranker-1',
    name: 'Rishabh Anand',
    score: '99.81',
    scoreDenominator: '/100',
    college: 'IIT Bombay - CSE',
    examCategory: 'IIT Advanced',
    examIndicator: 'IIT Adv.',
    image: '/img/IMG_5099.JPG.jpeg',
    badgeColor: '#0755D9'
  },
  {
    id: 'ranker-2',
    name: 'Swayam Singh',
    score: '99.50',
    scoreDenominator: '/100',
    college: 'BITS Pilani - CSE',
    examCategory: 'BITSAT',
    examIndicator: 'BITSAT',
    image: '/img/achivers3.jpeg',
    badgeColor: '#16A34A'
  },
  {
    id: 'ranker-3',
    name: 'Okhayan Sethi',
    score: '99.50',
    scoreDenominator: '/100',
    college: 'IIT Roorkee - CSE',
    examCategory: 'IIT Main',
    examIndicator: 'JEE Main',
    image: '/img/shaurya-singh.jpg',
    badgeColor: '#0755D9'
  },
  {
    id: 'ranker-4',
    name: 'Rudraksh Shukla',
    score: '99.44',
    scoreDenominator: '/100',
    college: 'IIT Kanpur - Electrical',
    examCategory: 'IIT Main',
    examIndicator: 'JEE Main',
    image: '/img/achivers2.jpeg',
    badgeColor: '#0755D9'
  },
  {
    id: 'ranker-5',
    name: 'Dipesh Kumar',
    score: '98.99',
    scoreDenominator: '/100',
    college: 'IIT Delhi - CSE',
    examCategory: 'IIT Main',
    examIndicator: 'JEE Main',
    image: '/img/achivers4.jpeg',
    badgeColor: '#0755D9'
  },
  {
    id: 'ranker-6',
    name: 'Harshit Kumar',
    score: '97.56',
    scoreDenominator: '/100',
    college: 'IIT Bombay - Mechanical',
    examCategory: 'IIT Advanced',
    examIndicator: 'IIT Adv.',
    image: '/img/achivers5.jpeg',
    badgeColor: '#0755D9'
  },
  {
    id: 'ranker-7',
    name: 'Tushar Gupta',
    score: '97.73',
    scoreDenominator: '/100',
    college: 'IIT Delhi - ECE',
    examCategory: 'IIT Main',
    examIndicator: 'JEE Main',
    image: '/img/achivers1.jpeg',
    badgeColor: '#0755D9'
  }
];

export interface ResultsBannerStripProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const ResultsBannerStrip: React.FC<ResultsBannerStripProps> = ({ badge, title, subtitle }) => {
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<'All' | 'IIT Advanced' | 'IIT Main' | 'BITSAT'>('All');
  const [homeConfig, setHomeConfig] = useState(() => cmsService.getPageConfig('home'));

  React.useEffect(() => {
    const handleCmsUpdate = () => setHomeConfig(cmsService.getPageConfig('home'));
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_pages_v1') {
        setHomeConfig(cmsService.getPageConfig('home'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const bannerSec = homeConfig.customSections?.find(
    (s) => s.id === 'sec_home_results_banner' || s.title?.toUpperCase().includes('OFFICIAL RESULTS')
  );

  const displayBadge = badge || bannerSec?.badge || '🏆 Our Results Speak';
  const displaySubtitle =
    subtitle ||
    bannerSec?.subtitle ||
    'Celebrating the success of our students who made it to the top institutes with their hard work and dedication.';

  const filteredRankers = useMemo(() => {
    if (selectedExam === 'All') return TOP_RANKERS_LIST;
    if (selectedExam === 'IIT Advanced') {
      return TOP_RANKERS_LIST.filter((r) => r.examCategory === 'IIT Advanced');
    }
    if (selectedExam === 'IIT Main') {
      return TOP_RANKERS_LIST.filter((r) => r.examCategory === 'IIT Main');
    }
    if (selectedExam === 'BITSAT') {
      return TOP_RANKERS_LIST.filter((r) => r.examCategory === 'BITSAT');
    }
    return TOP_RANKERS_LIST;
  }, [selectedExam]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className={styles.section} id="merit-records" aria-label="Official IIT JEE Merit List & Selection Records">
      {/* Decorative Dots matrix on bottom corners */}
      <div className={styles.decorativeDotsLeft} aria-hidden="true" />
      <div className={styles.decorativeDotsRight} aria-hidden="true" />

      {/* Subtle Background Glow and curved wave */}
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.ambientWave} aria-hidden="true" />

      <Container size="wide" className={styles.sectionContainer}>
        {/* Top Hero Showcase Row */}
        <div className={styles.heroRow}>
          {/* Left Column: Badge, Heading, Subtitle & Exam Filters */}
          <div className={styles.heroLeftCol}>
            {/* Small premium badge: "🏆 Our Results Speak" */}
            <div className={styles.heroBadge}>
              <span className={styles.badgeText}>{displayBadge}</span>
            </div>

            {/* Main heading with royal blue and subtle gold underline */}
            <h2 className={styles.heroHeading}>
              Official IIT JEE Merit List &amp;
              <br />
              <span className={styles.selectionHighlight}>
                Selection Records
                <svg
                  className={styles.goldCurvedLine}
                  viewBox="0 0 280 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5C80 2 195 2 277 8.5"
                    stroke="#FFC629"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            {/* Supporting description */}
            <p className={styles.heroDescription}>{displaySubtitle}</p>

            {/* Pill-style Exam Filters: All | IIT Advanced | IIT Main | BITSAT */}
            <div className={styles.examFiltersRow} role="tablist" aria-label="Filter results by exam">
              {(['All', 'IIT Advanced', 'IIT Main', 'BITSAT'] as const).map((filterKey) => {
                const isActive = selectedExam === filterKey;
                return (
                  <button
                    key={filterKey}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.filterPillBtn} ${isActive ? styles.filterPillActive : ''}`}
                    onClick={() => setSelectedExam(filterKey)}
                  >
                    <span>{filterKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: 3D Trophy Illustration, Ribbon & CTA Button */}
          <div className={styles.heroRightCol}>
            <div className={styles.trophyWrapper}>
              <TrophyHeroIllustration className={styles.trophySvg} />
            </div>

            <Link to="/results" className={styles.viewAllCtaBtn} aria-label="View All Selected Students">
              <span>View All Selected</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Student Achievement Cards Grid (Horizontal card layout on Desktop) */}
        <div className={styles.cardsGrid}>
          {filteredRankers.map((ranker) => (
            <div key={ranker.id} className={styles.studentCard}>
              {/* Left Side: Student Photo with Exam Badge */}
              <div className={styles.photoContainer}>
                <img
                  src={ranker.image}
                  alt={ranker.name}
                  className={styles.studentImage}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className={styles.monogramFallback} style={{ display: 'none' }}>
                  <span>{getInitials(ranker.name)}</span>
                </div>

                {/* Exam Category Pill Badge on Image */}
                <span className={styles.categoryBadgeOnPhoto}>{ranker.examCategory}</span>
              </div>

              {/* Right Side: Details, Selected Tag, Institute, Score & Indicator */}
              <div className={styles.detailsContainer}>
                {/* Top: Green "✓ Selected" status badge */}
                <div className={styles.selectedRow}>
                  <span className={styles.selectedBadge}>
                    <CheckCircle2 size={12} className={styles.checkIcon} aria-hidden="true" />
                    <span>Selected</span>
                  </span>
                </div>

                {/* Center: Student Name and Selected Institute */}
                <div className={styles.studentMetaBlock}>
                  <h3 className={styles.studentName} title={ranker.name}>
                    {ranker.name}
                  </h3>
                  <div className={styles.instituteRow} title={ranker.college}>
                    <Landmark size={12} className={styles.landmarkIcon} aria-hidden="true" />
                    <span className={styles.instituteText}>{ranker.college}</span>
                  </div>
                </div>

                {/* Bottom: Percentile Score + Category Indicator */}
                <div className={styles.scoreBottomRow}>
                  <div className={styles.scoreBlock}>
                    <span className={styles.scoreNumber}>{ranker.score}</span>
                    <span className={styles.scoreDenominator}>{ranker.scoreDenominator}</span>
                  </div>
                  <span className={styles.examIndicator}>{ranker.examIndicator}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Poster Lightbox Modal (Preserved for Affidavit Verification) */}
      {isBannerModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsBannerModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Official Results Poster Modal"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <Trophy size={16} />
                <span>DK Academy JEE — Official Merit List &amp; Scorecard Affidavit</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsBannerModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <img
                src="/img/dk-results-banner.jpeg"
                alt="Full resolution DK Academy JEE Official Results Merit List"
                className={styles.modalBannerImg}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default ResultsBannerStrip;

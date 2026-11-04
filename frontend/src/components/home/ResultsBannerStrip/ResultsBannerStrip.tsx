import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Star,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  FileCheck,
  PhoneCall,
  Target,
  TrendingUp,
  Award,
  Trophy
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { CallbackModal } from '../../leads/CallbackModal/CallbackModal';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import styles from './ResultsBannerStrip.module.scss';

export interface Ranker {
  id: string;
  name: string;
  percentile: string;
  rank: string;
  college: string;
  exam: string;
  image: string;
  badgeColor?: string;
}

export const TOP_RANKERS_LIST: Ranker[] = [
  {
    id: 'ranker-1',
    name: 'Rishabh Anand',
    percentile: '99.814 %ile',
    rank: 'AIR 2146',
    college: 'IIT Bombay · Computer Science',
    exam: 'JEE Advanced',
    image: '/img/IMG_5099.JPG.jpeg',
    badgeColor: '#2563eb'
  },
  {
    id: 'ranker-shaurya',
    name: 'Shaurya Singh',
    percentile: '99.5 %ile',
    rank: 'Top 0.5% (2026)',
    college: 'JEE Mains 99.5%ile · National Ranker',
    exam: 'JEE Main',
    image: '/img/shaurya-singh.jpg',
    badgeColor: '#4f46e5'
  },
  {
    id: 'ranker-2',
    name: 'Chirayu Sethia',
    percentile: '99.5 %ile',
    rank: 'AIR 6781 · BITS 292',
    college: 'BITS Pilani · CS & Tech',
    exam: 'JEE Main & BITSAT',
    image: '/img/achivers3.jpeg',
    badgeColor: '#059669'
  },
  {
    id: 'ranker-3',
    name: 'Ashutosh Shukla',
    percentile: '99.44 %ile',
    rank: 'Top 0.5% Nationally',
    college: 'IIT Roorkee · Electrical',
    exam: 'JEE Main',
    image: '/img/achivers2.jpeg',
    badgeColor: '#7c3aed'
  },
  {
    id: 'ranker-4',
    name: 'Tejas Itankar',
    percentile: '98.99 %ile',
    rank: 'Consistent Top Scorer',
    college: 'IIT Kharagpur · Engineering',
    exam: 'JEE Main',
    image: '/img/achivers4.jpeg',
    badgeColor: '#d97706'
  },
  {
    id: 'ranker-5',
    name: 'Harsh Kumar',
    percentile: '97.56 %ile',
    rank: 'AIR 10964',
    college: 'IIT Delhi · Mechanical',
    exam: 'JEE Advanced',
    image: '/img/achivers5.jpeg',
    badgeColor: '#2563eb'
  },
  {
    id: 'ranker-6',
    name: 'Tanishq Gupta',
    percentile: '97.75 %ile',
    rank: '100/100 in Maths Section',
    college: 'Delhi Technological Univ (DTU)',
    exam: 'JEE Main',
    image: '/img/achivers1.jpeg',
    badgeColor: '#dc2626'
  }
];

export interface ResultsBannerStripProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const ResultsBannerStrip: React.FC<ResultsBannerStripProps> = ({ badge, title, subtitle }) => {
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<'All' | 'JEE Advanced' | 'JEE Main' | 'BITSAT'>('All');
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

  const displayBadge = badge || bannerSec?.badge || 'OFFICIAL RESULTS & SOCIAL PROOF';
  const displayTitle = title || (bannerSec?.title === 'OFFICIAL RESULTS & SOCIAL PROOF'
    ? 'Official IIT JEE Merit List & Selection Records'
    : (bannerSec?.title || 'Official IIT JEE Merit List & Selection Records'));
  const displaySubtitle =
    subtitle || bannerSec?.subtitle || 'Verified academic milestones from our official merit list.';

  const filteredRankers = useMemo(() => {
    if (selectedExam === 'All') return TOP_RANKERS_LIST;
    if (selectedExam === 'JEE Advanced') {
      return TOP_RANKERS_LIST.filter((r) => r.exam.toLowerCase().includes('advanced'));
    }
    if (selectedExam === 'JEE Main') {
      return TOP_RANKERS_LIST.filter((r) => r.exam.toLowerCase().includes('main'));
    }
    if (selectedExam === 'BITSAT') {
      return TOP_RANKERS_LIST.filter((r) => r.exam.toLowerCase().includes('bitsat'));
    }
    return TOP_RANKERS_LIST;
  }, [selectedExam]);

  // Helper to extract student initials for monogram fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to parse clean percentile number
  const parsePercentileParts = (raw: string) => {
    const cleanNum = raw.replace(/%ile/gi, '').trim();
    return {
      number: cleanNum,
      suffix: '%ile'
    };
  };

  return (
    <section className={styles.section} id="merit-records" aria-label="Official IIT JEE Merit List & Selection Records">
      {/* Background ambient lighting */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide" className={styles.sectionContainer}>
        {/* 1. Section Header */}
        <div className={styles.headerBlock}>
          <div className={styles.headerLeft}>
            {/* Eyebrow Pill */}
            <div className={styles.eyebrowPill}>
              <Star size={13} fill="#4F46E5" color="#4F46E5" aria-hidden="true" />
              <span>{displayBadge}</span>
            </div>

            {/* H1 Title with tight tracking (-0.03em) */}
            <h1 className={styles.mainTitle}>
              Official IIT JEE Merit List &amp;{' '}
              <span className={styles.accentSpan}>Selection Records</span>
            </h1>

            {/* Subtext */}
            <p className={styles.subtext}>{displaySubtitle}</p>
          </div>

          {/* Right-side primary CTA button */}
          <div className={styles.headerRight}>
            <Link to="/results" className={styles.exploreAllBtn} aria-label="Explore all verified achievers">
              <span>Explore all achievers</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 2. Filter Chips: All | JEE Advanced | JEE Main | BITSAT */}
        <div className={styles.filterChipsRow} role="tablist" aria-label="Filter achievers by exam">
          {(['All', 'JEE Advanced', 'JEE Main', 'BITSAT'] as const).map((examKey) => {
            const isActive = selectedExam === examKey;
            return (
              <button
                key={examKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
                onClick={() => setSelectedExam(examKey)}
              >
                <span>{examKey}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Achievers Grid: 4 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className={styles.achieversGrid}>
          {filteredRankers.map((ranker, index) => {
            const isFeatured = index === 0;
            const { number: pNumber, suffix: pSuffix } = parsePercentileParts(ranker.percentile);

            if (isFeatured) {
              return (
                <div key={ranker.id} className={styles.featuredCard}>
                  {/* Photo Area */}
                  <div className={styles.featuredPhotoArea}>
                    <img
                      src={ranker.image}
                      alt={`${ranker.name} - ${ranker.rank}`}
                      className={styles.featuredImg}
                      loading="eager"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className={styles.monogramFallback} style={{ display: 'none' }}>
                      <span>{getInitials(ranker.name)}</span>
                    </div>

                    {/* Top-Left Tag: Exam Name */}
                    <span className={styles.examTag}>{ranker.exam}</span>

                    {/* Bottom-Right Verified Badge */}
                    <span className={styles.verifiedBadge} title="Verified Marksheet & Roll Number">
                      <ShieldCheck size={14} className={styles.verifiedShieldIcon} aria-hidden="true" />
                      <span>Verified</span>
                    </span>
                  </div>

                  {/* Featured Hero Metric Row */}
                  <div className={styles.featuredHeroRow}>
                    <div className={styles.featuredPercentileWrap}>
                      <span className={styles.featuredPercentileVal}>{pNumber}</span>
                      <span className={styles.featuredPercentileSuffix}>{pSuffix}</span>
                    </div>
                    <span className={styles.rankPill}>{ranker.rank}</span>
                  </div>

                  {/* Student Name */}
                  <h2 className={styles.featuredName}>{ranker.name}</h2>

                  {/* College + Branch Line */}
                  <div className={styles.featuredCollegeLine}>
                    <GraduationCap size={18} className={styles.collegeIcon} aria-hidden="true" />
                    <span>{ranker.college}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={ranker.id} className={styles.standardCard}>
                {/* 4:3 Ratio Photo Area */}
                <div className={styles.cardPhotoArea}>
                  <img
                    src={ranker.image}
                    alt={`${ranker.name} - ${ranker.rank}`}
                    className={styles.cardImg}
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

                  {/* Top-Left Tag: Exam Name */}
                  <span className={styles.examTag}>{ranker.exam}</span>

                  {/* Bottom-Right Verified Badge */}
                  <span className={styles.verifiedBadge} title="Verified Marksheet & Roll Number">
                    <ShieldCheck size={13} className={styles.verifiedShieldIcon} aria-hidden="true" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Hero Row: Space-between, align-end */}
                <div className={styles.cardHeroRow}>
                  <div className={styles.cardPercentileWrap}>
                    <span className={styles.cardPercentileVal}>{pNumber}</span>
                    <span className={styles.cardPercentileSuffix}>{pSuffix}</span>
                  </div>
                  <span className={styles.rankPill}>{ranker.rank}</span>
                </div>

                {/* Name */}
                <h3 className={styles.cardName}>{ranker.name}</h3>

                {/* College + Branch Line */}
                <div className={styles.cardCollegeLine}>
                  <GraduationCap size={15} className={styles.collegeIcon} aria-hidden="true" />
                  <span>{ranker.college}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audited Merit Affidavit Deck Banner */}
        <div className={styles.meritSummaryBanner}>
          <div className={styles.meritHeader}>
            <div className={styles.meritTitleBlock}>
              <div className={styles.meritIconCircle}>
                <FileCheck size={20} className={styles.meritShieldIcon} aria-hidden="true" />
              </div>
              <div>
                <div className={styles.meritHeadlineRow}>
                  <h3 className={styles.meritHeading}>Official NTA Scorecards &amp; Selection Records</h3>
                  <span className={styles.meritTrustPill}>
                    <Sparkles size={11} /> 100% Marksheet Verified
                  </span>
                </div>
                <p className={styles.meritSub}>
                  Audited &amp; verified selections from Dwarka Sector 12 &amp; Janakpuri centers
                </p>
              </div>
            </div>

            <button
              type="button"
              className={styles.viewAffidavitBtn}
              onClick={() => setIsBannerModalOpen(true)}
              aria-label="View official merit certificate affidavit"
            >
              <FileCheck size={14} aria-hidden="true" />
              <span>View Full Merit Affidavit</span>
              <ArrowRight size={13} className={styles.btnArrow} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.meritStatsRow}>
            <div className={styles.meritStatItem}>
              <div className={`${styles.statIconBadge} ${styles.badgeBlue}`}>
                <Trophy size={16} />
              </div>
              <div className={styles.statCol}>
                <span className={styles.meritStatVal}>1,420+</span>
                <span className={styles.meritStatLabel}>IITian Selections</span>
              </div>
            </div>

            <div className={styles.meritStatDivider} aria-hidden="true" />

            <div className={styles.meritStatItem}>
              <div className={`${styles.statIconBadge} ${styles.badgeEmerald}`}>
                <Target size={16} />
              </div>
              <div className={styles.statCol}>
                <span className={styles.meritStatVal}>98.8%</span>
                <span className={styles.meritStatLabel}>Batch Qualification Rate</span>
              </div>
            </div>

            <div className={styles.meritStatDivider} aria-hidden="true" />

            <div className={styles.meritStatItem}>
              <div className={`${styles.statIconBadge} ${styles.badgeAmber}`}>
                <Award size={16} />
              </div>
              <div className={styles.statCol}>
                <span className={styles.meritStatVal}>100/100</span>
                <span className={styles.meritStatLabel}>Perfect Maths Scores</span>
              </div>
            </div>

            <div className={styles.meritStatDivider} aria-hidden="true" />

            <div className={styles.meritStatItem}>
              <div className={`${styles.statIconBadge} ${styles.badgePurple}`}>
                <TrendingUp size={16} />
              </div>
              <div className={styles.statCol}>
                <span className={styles.meritStatVal}>AIR 24</span>
                <span className={styles.meritStatLabel}>Highest National Rank</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Floating Request Callback Pill */}
      <button
        type="button"
        className={styles.floatingCallbackPill}
        onClick={() => setIsCallbackModalOpen(true)}
        aria-label="Request an academic counseling callback"
      >
        <PhoneCall size={18} className={styles.phoneIcon} aria-hidden="true" />
        <span>Request Callback</span>
      </button>

      {/* Full-Resolution Poster Modal Lightbox */}
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
                <X size={20} />
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

      {/* Counselor Callback Modal */}
      {isCallbackModalOpen && (
        <CallbackModal
          isOpen={isCallbackModalOpen}
          onClose={() => setIsCallbackModalOpen(false)}
        />
      )}
    </section>
  );
};

export default ResultsBannerStrip;

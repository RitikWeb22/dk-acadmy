import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  FileCheck,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
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

const TOP_RANKERS_LIST: Ranker[] = [
  {
    id: 'ranker-1',
    name: 'Rishabh Anand',
    percentile: '99.814 %ile',
    rank: 'AIR 2146',
    college: 'IIT Bombay • Computer Science',
    exam: 'JEE Advanced',
    image: '/img/IMG_5099.JPG.jpeg',
    badgeColor: '#2563eb'
  },
  {
    id: 'ranker-2',
    name: 'Chirayu Sethia',
    percentile: '99.5 %ile',
    rank: 'AIR 6781 • BITS 292',
    college: 'BITS Pilani • CS & Tech',
    exam: 'JEE Main & BITSAT',
    image: '/img/achivers3.jpeg',
    badgeColor: '#059669'
  },
  {
    id: 'ranker-3',
    name: 'Ashutosh Shukla',
    percentile: '99.44 %ile',
    rank: 'Top 0.5% Nationally',
    college: 'IIT Roorkee • Electrical',
    exam: 'JEE Main',
    image: '/img/achivers2.jpeg',
    badgeColor: '#7c3aed'
  },
  {
    id: 'ranker-4',
    name: 'Tejas Itankar',
    percentile: '98.99 %ile',
    rank: 'Consistent Top Scorer',
    college: 'IIT Kharagpur',
    exam: 'JEE Main & Adv',
    image: '/img/achivers4.jpeg',
    badgeColor: '#d97706'
  },
  {
    id: 'ranker-5',
    name: 'Harsh Kumar',
    percentile: '97.56 %ile',
    rank: 'AIR 10964',
    college: 'IIT Delhi • Mechanical',
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
    subtitle || bannerSec?.subtitle || 'Audited marksheet records of students trained under DK Sir’s Kota pedagogy';

  return (
    <section className={styles.section} aria-label="Top JEE Results and Social Proof">
      <div className={styles.ambientGlow} aria-hidden="true" />

      <Container size="wide">
        {/* Section Header */}
        <div className={styles.headerBlock}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrowBadge}>
              <Trophy size={13} className={styles.trophyIcon} aria-hidden="true" />
              <span>{displayBadge}</span>
            </div>
            <h2 className={styles.title}>
              {displayTitle.includes('&') ? (
                <>
                  {displayTitle.split('&')[0]} &amp;{' '}
                  <span className={styles.titleGradient}>{displayTitle.split('&')[1]}</span>
                </>
              ) : (
                displayTitle
              )}
            </h2>
            <p className={styles.subtitle}>{displaySubtitle}</p>
          </div>

          <div className={styles.headerActions}>
            <Link to="/results" className={styles.allResultsLink}>
              <span>Explore All Achievers</span>
              <ArrowRight size={15} className={styles.linkArrow} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* High-Conversion Modern Achiever Cards Grid */}
        <div className={styles.rankersGrid}>
          {TOP_RANKERS_LIST.map((ranker) => (
            <div key={ranker.id} className={styles.rankerCard}>
              <div className={styles.avatarWrap}>
                <img
                  src={ranker.image}
                  alt={`${ranker.name} - ${ranker.rank}`}
                  className={styles.avatarImg}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className={styles.avatarOverlay} />

                {/* Top Exam Badge */}
                <span className={styles.examYearBadge}>{ranker.exam}</span>

                {/* Bottom Verified NTA Pill */}
                <span className={styles.verifiedCheckPill} title="Verified Marksheet & Roll Number">
                  <ShieldCheck size={11} strokeWidth={2.5} />
                  <span>Verified</span>
                </span>
              </div>

              <div className={styles.rankerInfo}>
                <div className={styles.scoreRow}>
                  <span className={styles.rankBadge}>{ranker.rank}</span>
                  <span className={styles.percentileBadge}>{ranker.percentile}</span>
                </div>

                <h3 className={styles.rankerName}>{ranker.name}</h3>

                <div className={styles.collegeTag}>
                  <GraduationCap size={12} className={styles.collegeIcon} aria-hidden="true" />
                  <span>{ranker.college}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audited Merit Affidavit Deck */}
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
    </section>
  );
};

export default ResultsBannerStrip;

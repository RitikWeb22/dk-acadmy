import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  ArrowRight,
  Sparkles,
  MapPin,
  Zap,
  Star,
  ShieldCheck,
  Trophy,
  TrendingUp,
  PhoneCall
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import styles from './SplitHero.module.scss';

export interface SplitHeroProps {
  headline?: React.ReactNode;
  subtitle?: string;
  badgeText?: string;
}

export const SplitHero: React.FC<SplitHeroProps> = ({
  headline,
  subtitle,
  badgeText
}) => {
  const [homeConfig, setHomeConfig] = React.useState(() => cmsService.getPageConfig('home'));

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

  const displayBadge = badgeText || homeConfig.heroBadge || "JEE Main & Advanced 2026–27 Admissions Open";
  const displaySubtitle = subtitle || homeConfig.heroSubheading || "Delhi’s premier coaching institute combining offline Janakpuri & Dwarka classroom rigor with DK Sir’s proprietary 20–30 second calculus shortcuts and small batches of 25 students.";

  const scrollToCallback = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('callback-form') || document.getElementById('callback');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('callback-name') || document.querySelector('input[type="text"]');
      if (nameInput) {
        setTimeout(() => (nameInput as HTMLElement).focus(), 500);
      }
    } else {
      window.location.hash = 'callback-form';
    }
  };

  const defaultStats = [
    { id: 'stat_1', label: 'Selections in JEE Advanced', value: '450+', subtext: 'Since 2018' },
    { id: 'stat_2', label: 'Top AIR Achieved', value: 'AIR 47', subtext: 'In JEE Advanced' },
    { id: 'stat_3', label: 'Max Batch Size', value: '25 Students', subtext: 'Individual Mentorship' },
    { id: 'stat_4', label: 'Average Score Boost', value: '+42 Marks', subtext: 'In Mathematics' }
  ];
  const statsList = (homeConfig.stats && homeConfig.stats.length > 0) ? homeConfig.stats : defaultStats;

  return (
    <section className={styles.heroSection} aria-label="DK Academy JEE Admissions Hero">
      <div className={styles.heroBackgroundGlow} aria-hidden="true" />

      <Container size="wide">
        {/* Main 2-Column Split Hero Layout */}
        <div className={styles.heroGrid}>
          {/* Left Column: Bold Typography, Pitch, CTAs & Social Proof */}
          <div className={styles.contentCol}>
            {/* Admissions Badge */}
            <div className={styles.badgeWrap}>
              <div className={styles.admissionsBadge}>
                <span className={styles.pulseContainer}>
                  <span className={styles.pulseDot} />
                  <span className={styles.pulseRing} />
                </span>
                <Sparkles size={13} className={styles.sparkleIcon} aria-hidden="true" />
                <span className={styles.badgeMainText}>{displayBadge}</span>
                <span className={styles.badgePillAccent}>Limited 25/Batch</span>
              </div>
            </div>

            {/* Main H1 Headline with punchy styling */}
            <h1 className={styles.headline}>
              {headline ? (
                headline
              ) : (
                <>
                  Prepare Smarter. Aim Higher.{' '}
                  <span className={styles.highlightText}>Crack JEE with DK Sir.</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className={styles.subtitle}>{displaySubtitle}</p>

            {/* Key Value Props in Sleek Modern Cards */}
            <div className={styles.benefitsDeck} aria-label="Key academy features">
              <div className={styles.benefitCard}>
                <div className={`${styles.benefitIconWrap} ${styles.iconWrapAmber}`}>
                  <Zap size={16} />
                </div>
                <div className={styles.benefitText}>
                  <strong>20–30s Inspection Shortcuts</strong>
                  <span>Proprietary Calculus &amp; Algebra methods</span>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <div className={`${styles.benefitIconWrap} ${styles.iconWrapBlue}`}>
                  <Users size={16} />
                </div>
                <div className={styles.benefitText}>
                  <strong>Strictly Max 25 Students</strong>
                  <span>Personalized 1:1 doubt mentorship</span>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <div className={`${styles.benefitIconWrap} ${styles.iconWrapEmerald}`}>
                  <MapPin size={16} />
                </div>
                <div className={styles.benefitText}>
                  <strong>Delhi Offline Campuses</strong>
                  <span>Janakpuri &amp; Dwarka Sector 12</span>
                </div>
              </div>
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className={styles.ctaGroup}>
              {homeConfig.primaryCtaUrl?.startsWith('#') ? (
                <a
                  href={homeConfig.primaryCtaUrl}
                  onClick={scrollToCallback}
                  className={styles.primaryBtn}
                  id="hero-book-demo-btn"
                  aria-label="Book a free demo class at DK Academy JEE"
                >
                  <span>{homeConfig.primaryCtaText || 'Explore Flagship Batches'}</span>
                  <ArrowRight size={17} className={styles.btnArrow} aria-hidden="true" />
                </a>
              ) : (
                <Link
                  to={homeConfig.primaryCtaUrl || '/courses'}
                  className={styles.primaryBtn}
                  id="hero-book-demo-btn"
                  aria-label="Explore flagship batches"
                >
                  <span>{homeConfig.primaryCtaText || 'Explore Flagship Batches'}</span>
                  <ArrowRight size={17} className={styles.btnArrow} aria-hidden="true" />
                </Link>
              )}

              {homeConfig.secondaryCtaUrl?.startsWith('#') ? (
                <a
                  href={homeConfig.secondaryCtaUrl}
                  onClick={scrollToCallback}
                  className={styles.secondaryBtn}
                  id="hero-explore-courses-btn"
                  aria-label="Request free counseling call"
                >
                  <PhoneCall size={16} className={styles.phoneIcon} aria-hidden="true" />
                  <span>{homeConfig.secondaryCtaText || 'Request Free Counseling Call'}</span>
                </a>
              ) : (
                <Link
                  to={homeConfig.secondaryCtaUrl || '#callback-form'}
                  className={styles.secondaryBtn}
                  id="hero-explore-courses-btn"
                  aria-label="Secondary CTA action"
                >
                  <PhoneCall size={16} className={styles.phoneIcon} aria-hidden="true" />
                  <span>{homeConfig.secondaryCtaText || 'Request Free Counseling Call'}</span>
                </Link>
              )}
            </div>

            {/* Micro reassurance line */}
            <div className={styles.ctaMicroNote}>
              <ShieldCheck size={14} className={styles.microShield} />
              <span>Free 1-on-1 Academic Counseling &amp; Batch Diagnostic • Zero Fee Commitment</span>
            </div>

            {/* Trust & Social Proof Row */}
            <div className={styles.socialProofRow}>
              {/* Overlapping student avatar stack */}
              <div className={styles.studentAvatarStack} aria-hidden="true">
                <img src="/images/students/aarav.jpg" alt="Aarav Sharma - IIT Bombay" className={styles.avatarImg} />
                <img src="/images/students/priya.jpg" alt="Priya Singhania - IIT Delhi" className={styles.avatarImg} />
                <img src="/images/students/rohan.jpg" alt="Rohan Verma - IIT Roorkee" className={styles.avatarImg} />
                <span className={styles.avatarMore}>+10k</span>
              </div>

              <div className={styles.ratingBox}>
                <div className={styles.starsGroup} aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <div className={styles.ratingText}>
                  <strong>4.9/5 Student Rating</strong>
                  <span>10,000+ JEE Aspirants Mentored</span>
                </div>
              </div>

              <div className={styles.proofDivider} aria-hidden="true" />

              <div className={styles.centersPill}>
                <span className={styles.centerDot} />
                <MapPin size={13} className={styles.mapIcon} aria-hidden="true" />
                <span>Dwarka &amp; Janakpuri Centers</span>
              </div>
            </div>
          </div>

          {/* Right Column: Modern Mentor Spotlight Showcase */}
          <div className={styles.visualCol}>
            <div className={styles.cardContainer}>
              {/* Ambient aura glow behind the card */}
              <div className={styles.cardGlowAura} aria-hidden="true" />

              {/* Floating Badge 1: Top Result (Floats gracefully at top left) */}
              <div className={`${styles.floatingPill} ${styles.pillTopLeft}`}>
                <div className={styles.pillIconTrophy}>
                  <Trophy size={16} aria-hidden="true" />
                </div>
                <div className={styles.pillContent}>
                  <span className={styles.pillHeading}>99.814 %ile</span>
                  <span className={styles.pillSub}>AIR 2146 in JEE Advanced</span>
                </div>
              </div>

              {/* Floating Badge 2: 20-30s Shortcuts (Floats gracefully at bottom right) */}
              <div className={`${styles.floatingPill} ${styles.pillBottomRight}`}>
                <div className={styles.pillIconZap}>
                  <Zap size={16} aria-hidden="true" />
                </div>
                <div className={styles.pillContent}>
                  <span className={styles.pillHeading}>20–30s Method</span>
                  <span className={styles.pillSub}>Calculus &amp; Algebra Mastery</span>
                </div>
              </div>

              {/* Experience Pill at top right */}
              <div className={styles.pedagogyPill}>
                <Sparkles size={12} className={styles.pedagogySparkle} />
                <span>18+ Yrs Kota Pedagogy</span>
              </div>

              <div className={styles.mentorCard}>
                {/* Image Frame with DK Sir Portrait */}
                <div className={styles.portraitWrap}>
                  <img
                    src="/img/founder.jpeg"
                    alt="Dharmendra Kumar (DK Sir) - Senior IIT-JEE Mathematics Mentor"
                    className={styles.portraitImg}
                    width={480}
                    height={520}
                    fetchPriority="high"
                    loading="eager"
                  />
                  <div className={styles.portraitOverlay} />

                  {/* Mentor Info Glass Tag at bottom of portrait */}
                  <div className={styles.mentorInfoTag}>
                    <div className={styles.mentorTitleRow}>
                      <span className={styles.mentorName}>Dharmendra Kumar (DK Sir)</span>
                      <span className={styles.mentorVerifiedBadge} title="Verified Senior IIT-JEE Faculty">
                        <ShieldCheck size={14} />
                      </span>
                    </div>
                    <div className={styles.mentorRole}>Founder &amp; Senior IIT-JEE Mathematics Mentor</div>
                  </div>
                </div>

                {/* Verified Mentorship Strip */}
                <div className={styles.mentorFooterStrip}>
                  <span className={styles.footerPill}>⚡ 20–30s Shortcuts</span>
                  <span className={styles.footerDot}>•</span>
                  <span className={styles.footerPill}>👥 Max 25 Batch</span>
                  <span className={styles.footerDot}>•</span>
                  <span className={styles.footerPill}>📍 Offline Delhi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Modern 4-Column Stats Ribbon (CMS Reactive) */}
        <div className={styles.statsRibbon} role="region" aria-label="Verified Institute Milestones">
          {statsList.map((stat, idx) => {
            const isRank = stat.value?.includes('AIR') || stat.label?.toLowerCase().includes('air') || idx === 1;
            const isBatch = stat.label?.toLowerCase().includes('batch') || idx === 2;
            const isScore = stat.label?.toLowerCase().includes('score') || stat.label?.toLowerCase().includes('boost') || idx === 3;
            const isRating = idx === 3 || stat.label?.toLowerCase().includes('rating');

            const IconComp = isScore ? TrendingUp : isRank ? Award : isBatch ? Users : Trophy;
            const themeClass = isScore
              ? styles.statIconAmber
              : isRank
              ? styles.statIconPurple
              : isBatch
              ? styles.statIconEmerald
              : styles.statIconBlue;

            return (
              <React.Fragment key={stat.id || idx}>
                {idx > 0 && <div className={styles.statDivider} aria-hidden="true" />}
                <div className={styles.statCard}>
                  <div className={`${styles.statIconWrap} ${themeClass}`}>
                    <IconComp
                      size={20}
                      {...(isRating ? { fill: '#f59e0b', color: '#f59e0b' } : {})}
                      aria-hidden="true"
                    />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div className={styles.statLabel}>{stat.label}</div>
                    {stat.subtext && <div className={styles.statSubtext}>{stat.subtext}</div>}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default SplitHero;

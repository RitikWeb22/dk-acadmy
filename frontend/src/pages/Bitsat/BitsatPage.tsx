import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Zap,
  Target,
  Brain,
  Award,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  Calendar,
  Users,
  Flame,
  Check
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import styles from './BitsatPage.module.scss';

interface FAQItem {
  question: string;
  answer: string;
}

const BITSAT_FAQS: FAQItem[] = [
  {
    question: 'How is BITSAT preparation different from JEE Main & Advanced?',
    answer: 'JEE Main and Advanced test deep conceptual derivation with 2–3 minutes per question. BITSAT is an extreme speed sprint: 130 questions in 180 minutes (~83 seconds per question). In addition, BITSAT includes 30 questions (90 marks) of English Proficiency and Logical Reasoning, which JEE does not test. DK Sir trains students specifically in 20–30s inspection shortcuts, rapid option substitution, and dedicated English/LR score-boosting modules.'
  },
  {
    question: 'How do the 12 BITSAT Bonus Questions work?',
    answer: 'If you complete and attempt all 130 questions before the 180 minutes expire, the BITSAT test engine unlocks 12 Bonus Questions (4 Mathematics, 4 Physics, 4 Chemistry) worth an extra 36 marks. However, once unlocked, you cannot go back to change answers in the original 130 questions. Our CBT Mock Engine simulates this exact bonus unlock condition so you know when to trigger it without risking negative marks.'
  },
  {
    question: 'Does this course cover both BITSAT Session 1 and Session 2?',
    answer: 'Yes! The BITSAT Speed Master Crash Course provides continuous mentorship, revision classes, and CBT test access covering both Session 1 (May) and Session 2 (June). Students can fine-tune their strategy and boost their score by 40–60 marks between sessions.'
  },
  {
    question: 'What is the minimum score needed for Computer Science at BITS Pilani?',
    answer: 'For the Pilani campus, Computer Science typically requires 330+ marks out of 390. Mathematics & Computing requires around 310+, and Electronics & Communication around 295+. For Goa and Hyderabad campuses, CS cutoffs generally range from 295 to 305.'
  },
  {
    question: 'Are English Proficiency and Logical Reasoning taught from scratch?',
    answer: 'Yes. We dedicate 40+ hours exclusively to BITSAT English (Grammar rules, sentence completion, high-frequency vocabulary, idioms) and Logical Reasoning (analogy, deductive reasoning, pattern sequences, syllogisms), ensuring students secure 75+ out of 90 marks in Part 3.'
  }
];

export const BitsatPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    targetClass: 'Class 12th',
    targetCampus: 'BITS Pilani (Main Campus)',
    mode: 'Online Live Batch'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className={styles.bitsatPageWrapper}>
      {/* 1. Breadcrumb Bar */}
      <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
        <Container size="wide">
          <div className={styles.breadcrumbInner}>
            <Link to="/" className={styles.breadcrumbLink}>
              <Home size={14} />
              <span>Home</span>
            </Link>
            <span className={styles.breadcrumbSep}><ChevronRight size={13} /></span>
            <span className={styles.breadcrumbCurrent}>BITSAT Speed Math &amp; CBT Mastery</span>
          </div>
        </Container>
      </nav>

      {/* 2. Hero Section - Executive Light Design matching site styling */}
      <section className={styles.heroSection}>
        <div className={styles.ambientGlow} aria-hidden="true" />
        <Container size="wide">
          <div className={styles.heroContent}>
            {/* Urgency Eyebrow Badge */}
            <div className={styles.heroBadge}>
              <Flame size={14} className={styles.flameIcon} />
              <span>BITSAT 2026 &amp; 2027 • ADMISSIONS OPEN</span>
            </div>

            {/* Main Page Headline */}
            <h1 className={styles.heroHeading}>
              Conquer BITSAT with DK Sir's <br />
              <span className={styles.highlightText}>20–30s Speed Math &amp; CBT Mastery</span>
            </h1>

            {/* Subtitle */}
            <p className={styles.heroSubtext}>
              <strong>130 Questions in 180 Minutes</strong> gives you just 83 seconds per question. Learn rapid option elimination, master English &amp; Logical Reasoning (90 marks), and train with our exact <strong>12-Bonus Questions CBT simulation engine</strong> to score 330+ for BITS Pilani CS.
            </p>

            {/* Action CTAs */}
            <div className={styles.heroCtas}>
              <a href="#batches" className={styles.primaryCtaBtn}>
                <Zap size={16} />
                <span>Explore BITSAT Batches</span>
                <ArrowRight size={15} />
              </a>
              <a href="#diagnostic-form" className={styles.secondaryCtaBtn}>
                <Target size={16} />
                <span>Book Free Diagnostic Test</span>
              </a>
            </div>

            {/* Reassurance Micro-copy */}
            <div className={styles.heroMicroNote}>
              <ShieldCheck size={14} className={styles.microShield} />
              <span>Strictly Max 25 Students/Batch • 1-on-1 Speed Diagnostic Included</span>
            </div>

            {/* 4 Elevated Quick KPI Stat Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  <Clock size={18} />
                </div>
                <div className={styles.statValue}>83 Sec</div>
                <p className={styles.statLabel}>Avg. Speed per Question Target</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  <Award size={18} />
                </div>
                <div className={styles.statValue}>330+</div>
                <p className={styles.statLabel}>Target Score for BITS Pilani CS</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  <Sparkles size={18} />
                </div>
                <div className={styles.statValue}>+36 Marks</div>
                <p className={styles.statLabel}>12 Bonus Questions Strategy</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  <Brain size={18} />
                </div>
                <div className={styles.statValue}>90 Marks</div>
                <p className={styles.statLabel}>English &amp; Logical Reasoning Focus</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. BITSAT Exam Pattern Blueprint */}
      <section className={styles.section} id="pattern">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Sparkles size={12} />
              <span>EXAM ARCHITECTURE</span>
            </div>
            <h2 className={styles.sectionTitle}>
              BITSAT Blueprint: <span className={styles.titleGradient}>130 Questions, 390 Marks, 180 Mins</span>
            </h2>
            <p className={styles.sectionDescription}>
              Mathematics carries the highest weightage (40 questions), while English &amp; Logic (30 questions) form the make-or-break scoring zone.
            </p>
          </div>

          <div className={styles.patternGrid}>
            {/* Part IV - Mathematics */}
            <div className={styles.patternCard}>
              <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
              <div className={styles.patternTop}>
                <span className={`${styles.subjectBadge} ${styles.mathBadge}`}>Part IV</span>
                <Clock size={16} className={styles.accentClock} />
              </div>
              <h3 className={styles.patternTitle}>Mathematics</h3>
              <div className={styles.patternStatsRow}>
                <span className={styles.patternQuestions}>40 Qs</span>
                <span className={styles.patternMarks}>• 120 Marks (+3, -1)</span>
              </div>
              <p className={styles.patternNote}>
                Highest scoring section. DK Sir's 20-30s shortcuts eliminate 2 options instantly in Coordinate Geometry, Calculus, &amp; Vectors.
              </p>
            </div>

            {/* Part III - English & Logic */}
            <div className={styles.patternCard}>
              <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
              <div className={styles.patternTop}>
                <span className={`${styles.subjectBadge} ${styles.lrBadge}`}>Part III</span>
                <Brain size={16} className={styles.accentBrain} />
              </div>
              <h3 className={styles.patternTitle}>English &amp; Logical Reasoning</h3>
              <div className={styles.patternStatsRow}>
                <span className={styles.patternQuestions}>30 Qs</span>
                <span className={styles.patternMarks}>• 90 Marks (10 Eng + 20 LR)</span>
              </div>
              <p className={styles.patternNote}>
                Neglected by 85% of JEE students. We dedicate 40+ structured hours to grammar, vocabulary, syllogisms, and sequence deduction.
              </p>
            </div>

            {/* Part I - Physics */}
            <div className={styles.patternCard}>
              <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
              <div className={styles.patternTop}>
                <span className={`${styles.subjectBadge} ${styles.phyBadge}`}>Part I</span>
                <Zap size={16} className={styles.accentZap} />
              </div>
              <h3 className={styles.patternTitle}>Physics</h3>
              <div className={styles.patternStatsRow}>
                <span className={styles.patternQuestions}>30 Qs</span>
                <span className={styles.patternMarks}>• 90 Marks (+3, -1)</span>
              </div>
              <p className={styles.patternNote}>
                Formula recall speed drills and dimensional boundary condition checks to solve kinematics and electrodynamics in under 60 seconds.
              </p>
            </div>

            {/* Part II - Chemistry */}
            <div className={styles.patternCard}>
              <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #059669, #34d399)' }} />
              <div className={styles.patternTop}>
                <span className={`${styles.subjectBadge} ${styles.chemBadge}`}>Part II</span>
                <Award size={16} className={styles.accentAward} />
              </div>
              <h3 className={styles.patternTitle}>Chemistry</h3>
              <div className={styles.patternStatsRow}>
                <span className={styles.patternQuestions}>30 Qs</span>
                <span className={styles.patternMarks}>• 90 Marks (+3, -1)</span>
              </div>
              <p className={styles.patternNote}>
                100% NCERT memory retention maps for Inorganic trends, direct reaction mechanisms in Organic, and rapid Physical Chem formulas.
              </p>
            </div>
          </div>

          {/* 12 Bonus Questions Round Highlight Banner */}
          <div className={styles.bonusBanner}>
            <div className={styles.bonusGlowAura} aria-hidden="true" />
            <div className={styles.bonusLeft}>
              <span className={styles.bonusPill}>
                <Sparkles size={12} /> THE BITSAT ADVANTAGE
              </span>
              <h3 className={styles.bonusTitle}>Unlock the 12 Bonus Questions Engine</h3>
              <p className={styles.bonusDesc}>
                If you attempt all 130 questions, BITSAT unlocks 12 extra questions (4 Math, 4 Physics, 4 Chemistry) for <strong>+36 bonus marks</strong>. DK Sir trains students on the exact time-budgeting and risk-mitigation algorithm to safely trigger the bonus round without negative marking penalties.
              </p>
            </div>
            <div className={styles.bonusRight}>
              <div className={styles.bonusStatBox}>
                <span className={styles.bonusNumber}>+36</span>
                <span className={styles.bonusLabel}>Bonus Marks Potential</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Why DK Sir's Pedagogy Outperforms in BITSAT */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="pedagogy">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Zap size={12} />
              <span>SPEED-FIRST METHODOLOGY</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Why JEE Main Coaching Fails in BITSAT <span className={styles.titleGradient}>Without Speed Conditioning</span>
            </h2>
            <p className={styles.sectionDescription}>
              In JEE, you have time to derive from fundamentals. In BITSAT, a 3-minute solution is equivalent to a failure. Here is how DK Sir rewires your exam reflexes.
            </p>
          </div>

          <div className={styles.methodsGrid}>
            {/* Card 01 */}
            <div className={styles.methodCard}>
              <span className={styles.numberWatermark} aria-hidden="true">01</span>
              <div className={styles.methodHeader}>
                <div className={`${styles.methodIcon} ${styles.iconAmber}`}>
                  <Zap size={22} />
                </div>
                <span className={`${styles.methodBadge} ${styles.badgeAmber}`}>Signature Technique</span>
              </div>
              <h3 className={styles.methodTitle}>20–30s Option Elimination</h3>
              <p className={styles.methodText}>
                Substitute boundary values, test dimensional symmetry, and evaluate extreme cases. In 70% of BITSAT math problems, 2 options are mathematically impossible within 15 seconds.
              </p>

              <div className={styles.methodDivider} />

              <ul className={styles.methodPointsList}>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkAmber}`} />
                  <span>Boundary value &amp; extreme-case substitution</span>
                </li>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkAmber}`} />
                  <span>Eliminate 2 choices in under 15 seconds</span>
                </li>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkAmber}`} />
                  <span>Bypasses 6–7 lines of lengthy algebraic derivations</span>
                </li>
              </ul>

              <div className={`${styles.methodFooter} ${styles.footerAmber}`}>
                <div className={styles.methodMetricBox}>
                  <Clock size={15} />
                  <span className={styles.methodMetricVal}>15–20 Mins Saved</span>
                </div>
                <span className={styles.methodMetricLabel}>Per BITSAT Paper</span>
              </div>
            </div>

            {/* Card 02 */}
            <div className={styles.methodCard}>
              <span className={styles.numberWatermark} aria-hidden="true">02</span>
              <div className={styles.methodHeader}>
                <div className={`${styles.methodIcon} ${styles.iconIndigo}`}>
                  <Brain size={22} />
                </div>
                <span className={`${styles.methodBadge} ${styles.badgeIndigo}`}>Scoring Multiplier</span>
              </div>
              <h3 className={styles.methodTitle}>English &amp; Logic Maximization</h3>
              <p className={styles.methodText}>
                30 questions (90 marks) can elevate your rank from an MSc branch to Computer Science. We teach systematic verbal analogy algorithms, high-frequency root words, and pattern recognition.
              </p>

              <div className={styles.methodDivider} />

              <ul className={styles.methodPointsList}>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkIndigo}`} />
                  <span>30 questions (90 marks) rank multiplier strategy</span>
                </li>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkIndigo}`} />
                  <span>Verbal analogies, roots &amp; contextual deduction</span>
                </li>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkIndigo}`} />
                  <span>Syllogisms, pattern sequences &amp; logic algorithms</span>
                </li>
              </ul>

              <div className={`${styles.methodFooter} ${styles.footerIndigo}`}>
                <div className={styles.methodMetricBox}>
                  <Award size={15} />
                  <span className={styles.methodMetricVal}>Target: 75+ / 90</span>
                </div>
                <span className={styles.methodMetricLabel}>English &amp; LR Score</span>
              </div>
            </div>

            {/* Card 03 */}
            <div className={styles.methodCard}>
              <span className={styles.numberWatermark} aria-hidden="true">03</span>
              <div className={styles.methodHeader}>
                <div className={`${styles.methodIcon} ${styles.iconBlue}`}>
                  <Target size={22} />
                </div>
                <span className={`${styles.methodBadge} ${styles.badgeBlue}`}>TCS-iON Clone</span>
              </div>
              <h3 className={styles.methodTitle}>CBT Simulation &amp; Bonus Trigger</h3>
              <p className={styles.methodText}>
                Practice on an interface identical to the official BITSAT TCS-iON engine with the live question palette, section jumper, and authentic 12 bonus questions prompt.
              </p>

              <div className={styles.methodDivider} />

              <ul className={styles.methodPointsList}>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkBlue}`} />
                  <span>Authentic TCS-iON UI test simulation environment</span>
                </li>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkBlue}`} />
                  <span>Official 12 Bonus Questions trigger algorithm</span>
                </li>
                <li className={styles.methodPointItem}>
                  <CheckCircle2 size={15} className={`${styles.methodPointIcon} ${styles.checkBlue}`} />
                  <span>Time-budgeting &amp; negative mark mitigation</span>
                </li>
              </ul>

              <div className={`${styles.methodFooter} ${styles.footerBlue}`}>
                <div className={styles.methodMetricBox}>
                  <Sparkles size={15} />
                  <span className={styles.methodMetricVal}>15 Full Mocks</span>
                </div>
                <span className={styles.methodMetricLabel}>CBT with AIR Ranking</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Active BITSAT Batches - Matching PopularCourses Award-Winning Design */}
      <section className={styles.section} id="batches">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Flame size={12} />
              <span>ENROLLMENT OPEN 2026–27</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Active BITSAT Batches &amp; <span className={styles.titleGradient}>Tuition Plans</span>
            </h2>
            <p className={styles.sectionDescription}>
              Target BITS Pilani, Goa, and Hyderabad with targeted crash courses, speed math boosters, and full-length CBT test series.
            </p>
          </div>

          <div className={styles.batchesGrid}>
            {/* Batch 1: Complete Crash Course (Most Popular) */}
            <article className={`${styles.batchCard} ${styles.popularBatch}`}>
              <div className={styles.cardTopAccent} style={{ background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
              
              <div className={styles.batchTopBadgeRow}>
                <span className={styles.batchFlagshipBadge}>
                  <Sparkles size={11} /> MOST POPULAR BITSAT BATCH
                </span>
                <span className={styles.batchTargetYear}>
                  <Calendar size={12} /> Target 2026/27
                </span>
              </div>

              <h3 className={styles.batchTitle}>BITSAT 2026 Speed Master Crash Program</h3>

              {/* Rigor Meta Pills */}
              <div className={styles.metaPillsRow}>
                <div className={styles.metaPillBatch}>
                  <Users size={12} />
                  <span>Strictly Max 25 / Batch</span>
                </div>
                <div className={styles.metaPillMode}>
                  <Zap size={12} />
                  <span>Online Live • Sessions 1 &amp; 2</span>
                </div>
              </div>

              {/* Key Deliverables */}
              <ul className={styles.featuresList}>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>120+ Live Interactive Speed Hack Sessions</strong> by DK Sir &amp; Team</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Full Math (40 Qs), Physics, Chem, English &amp; LR</strong> covered end-to-end</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>15 Full-length BITSAT CBT Mocks</strong> with Bonus 12 Questions simulator</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>BITSAT Formula Handbooks</strong> &amp; High-Frequency English Vocab Bank</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Daily 1:1 Live Doubt Counter</strong> &amp; BITS Pilani Alumni Mentorship</span>
                </li>
              </ul>

              {/* Pricing Box */}
              <div className={styles.pricingBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹14,999</span>
                  <span className={styles.originalPrice}>₹24,999</span>
                  <span className={styles.discountBadge}>Save 40%</span>
                </div>
                <div className={styles.taxSubtext}>Incl. 18% GST • 5 Subjects + 15 Mocks</div>
              </div>

              {/* Action Buttons */}
              <div className={styles.cardActionsRow}>
                <a href="#diagnostic-form" className={styles.enrollPrimaryBtn}>
                  <span>Enroll in Speed Master</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </article>

            {/* Batch 2: Math + LR & English Super Booster */}
            <article className={styles.batchCard}>
              <div className={styles.cardTopAccent} style={{ background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
              
              <div className={styles.batchTopBadgeRow}>
                <span className={styles.batchBoosterBadge}>
                  <Brain size={11} /> 210 MARKS SCORING BOOSTER
                </span>
                <span className={styles.batchTargetYear}>
                  <Calendar size={12} /> Target 2026/27
                </span>
              </div>

              <h3 className={styles.batchTitle}>BITSAT Math + LR &amp; English Super Booster</h3>

              {/* Rigor Meta Pills */}
              <div className={styles.metaPillsRow}>
                <div className={styles.metaPillBatch}>
                  <Users size={12} />
                  <span>Strictly Max 25 / Batch</span>
                </div>
                <div className={styles.metaPillMode}>
                  <Zap size={12} />
                  <span>Online Live • 70/130 Qs Focus</span>
                </div>
              </div>

              {/* Key Deliverables */}
              <ul className={styles.featuresList}>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Complete BITSAT Mathematics (40 Qs)</strong> with DK Sir's 20-30s techniques</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>40+ Hours English &amp; Logical Reasoning drills</strong> for 75+ mark score</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>10 Targeted Math + LR Subject Mocks</strong> with timer diagnostics</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Daily Speed Practice Sheets (DPS)</strong> with video solution keys</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Full access to recorded lecture library</strong> till BITSAT Session 2</span>
                </li>
              </ul>

              {/* Pricing Box */}
              <div className={styles.pricingBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹8,999</span>
                  <span className={styles.originalPrice}>₹14,999</span>
                  <span className={styles.discountBadge}>Save 40%</span>
                </div>
                <div className={styles.taxSubtext}>Incl. 18% GST • Math, English &amp; LR Special</div>
              </div>

              {/* Action Buttons */}
              <div className={styles.cardActionsRow}>
                <a href="#diagnostic-form" className={styles.enrollPrimaryBtn}>
                  <span>Enroll in Booster</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </article>

            {/* Batch 3: All-India BITSAT CBT Test Series */}
            <article className={styles.batchCard}>
              <div className={styles.cardTopAccent} style={{ background: 'linear-gradient(90deg, #059669, #34d399)' }} />
              
              <div className={styles.batchTopBadgeRow}>
                <span className={styles.batchTestBadge}>
                  <Target size={11} /> CBT ENGINE SIMULATION
                </span>
                <span className={styles.batchTargetYear}>
                  <Calendar size={12} /> Target 2026/27
                </span>
              </div>

              <h3 className={styles.batchTitle}>All India BITSAT CBT Online Test Series</h3>

              {/* Rigor Meta Pills */}
              <div className={styles.metaPillsRow}>
                <div className={styles.metaPillBatch}>
                  <Users size={12} />
                  <span>10,000+ Rank Pool</span>
                </div>
                <div className={styles.metaPillMode}>
                  <Zap size={12} />
                  <span>Self-Paced • 15 Full CBT Mocks</span>
                </div>
              </div>

              {/* Key Deliverables */}
              <ul className={styles.featuresList}>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>15 Full-length BITSAT mock tests</strong> strictly aligned with 2026 pattern</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Authentic Bonus Question trigger</strong> when all 130 Qs are completed</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Question-wise time analytics</strong> (Time spent per question vs topper)</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>All India Rank (AIR) &amp; BITS Campus cutoff predictor</strong> algorithms</span>
                </li>
                <li>
                  <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                  <span><strong>Detailed step-by-step video solutions</strong> for every math question</span>
                </li>
              </ul>

              {/* Pricing Box */}
              <div className={styles.pricingBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹3,499</span>
                  <span className={styles.originalPrice}>₹6,999</span>
                  <span className={styles.discountBadge}>Save 50%</span>
                </div>
                <div className={styles.taxSubtext}>Incl. 18% GST • Full TCS-iON Interface Simulator</div>
              </div>

              {/* Action Buttons */}
              <div className={styles.cardActionsRow}>
                <a href="#diagnostic-form" className={styles.enrollPrimaryBtn}>
                  <span>Join Test Series</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </article>
          </div>
        </Container>
      </section>

      {/* 6. BITSAT Campus Cutoffs & Target Score Benchmarks */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="cutoffs">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Award size={12} />
              <span>CAMPUS BENCHMARKS</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Target Scores for Top BITS Campuses <span className={styles.titleGradient}>(Out of 390)</span>
            </h2>
            <p className={styles.sectionDescription}>
              Reference cutoffs from previous official admissions to help you target your score threshold.
            </p>
          </div>

          <div className={styles.cutoffsCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.cutoffTable}>
                <thead>
                  <tr>
                    <th>Branch / Discipline</th>
                    <th>
                      <div className={styles.thCampus}>
                        <span>BITS Pilani</span>
                        <span className={styles.campusFlagshipBadge}>Flagship Campus</span>
                      </div>
                    </th>
                    <th>
                      <div className={styles.thCampus}>
                        <span>BITS K.K. Birla Goa</span>
                      </div>
                    </th>
                    <th>
                      <div className={styles.thCampus}>
                        <span>BITS Hyderabad</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.highlightRow}>
                    <td className={styles.branchCell}>
                      <span className={styles.branchDot} />
                      <strong>Computer Science &amp; Engineering (CSE)</strong>
                    </td>
                    <td><span className={`${styles.scorePill} ${styles.scorePillTop}`}>331 Marks</span></td>
                    <td><span className={styles.scorePill}>301 Marks</span></td>
                    <td><span className={styles.scorePill}>298 Marks</span></td>
                  </tr>
                  <tr className={styles.highlightRow}>
                    <td className={styles.branchCell}>
                      <span className={styles.branchDot} />
                      <strong>Mathematics &amp; Computing (MnC)</strong>
                    </td>
                    <td><span className={`${styles.scorePill} ${styles.scorePillTop}`}>310 Marks</span></td>
                    <td><span className={styles.scorePill}>288 Marks</span></td>
                    <td><span className={styles.scorePill}>285 Marks</span></td>
                  </tr>
                  <tr>
                    <td className={styles.branchCell}>Electronics &amp; Communication (ECE)</td>
                    <td><span className={styles.scorePill}>296 Marks</span></td>
                    <td><span className={styles.scorePill}>278 Marks</span></td>
                    <td><span className={styles.scorePill}>275 Marks</span></td>
                  </tr>
                  <tr>
                    <td className={styles.branchCell}>Electrical &amp; Electronics (EEE)</td>
                    <td><span className={styles.scorePill}>272 Marks</span></td>
                    <td><span className={styles.scorePill}>256 Marks</span></td>
                    <td><span className={styles.scorePill}>252 Marks</span></td>
                  </tr>
                  <tr>
                    <td className={styles.branchCell}>Mechanical Engineering</td>
                    <td><span className={styles.scorePill}>244 Marks</span></td>
                    <td><span className={styles.scorePill}>223 Marks</span></td>
                    <td><span className={styles.scorePill}>221 Marks</span></td>
                  </tr>
                  <tr>
                    <td className={styles.branchCell}>Chemical Engineering</td>
                    <td><span className={styles.scorePill}>224 Marks</span></td>
                    <td><span className={styles.scorePill}>207 Marks</span></td>
                    <td><span className={styles.scorePill}>204 Marks</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.cutoffTableFooter}>
              <ShieldCheck size={14} className={styles.footerShield} />
              <span>Cutoffs reflect Round 1–5 Iteration standards. Safe target for Pilani CS is 330+ with bonus question conditioning.</span>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. Free BITSAT Diagnostic & Speed Test Registration Form */}
      <section className={styles.section} id="diagnostic-form">
        <Container size="wide">
          <div className={styles.bookingWrapper}>
            <div className={styles.bookingRow}>
              {/* Left Column: Value Proposition & Reassurance */}
              <div className={styles.bookingLeft}>
                <span className={styles.bookingBadge}>
                  <ShieldCheck size={13} /> ZERO COST SPEED DIAGNOSTIC
                </span>
                <h2 className={styles.bookingTitle}>
                  Book Free BITSAT Speed Diagnostic &amp; <span className={styles.titleGradient}>Strategy Consultation</span>
                </h2>
                <p className={styles.bookingDesc}>
                  Take our 45-minute mini BITSAT Diagnostic Speed Test. DK Sir and our senior academic mentors will evaluate your question inspection speed, option elimination accuracy, and recommend your personalized preparation schedule.
                </p>

                <ul className={styles.bookingPerks}>
                  <li>
                    <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                    <span><strong>Full Speed &amp; Accuracy Diagnostic Report</strong> with percentile benchmarking</span>
                  </li>
                  <li>
                    <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                    <span><strong>1-on-1 Strategy Call</strong> with DK Sir or senior Kota academic mentor</span>
                  </li>
                  <li>
                    <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                    <span><strong>Free BITSAT Speed Math Formula Sheet PDF</strong> &amp; English vocab bank</span>
                  </li>
                  <li>
                    <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                    <span><strong>Direct WhatsApp Guidance</strong> for batch allotment &amp; diagnostic test slot</span>
                  </li>
                </ul>

                {/* Mentor Quick Note Card */}
                <div className={styles.mentorBriefCard}>
                  <img
                    src="/img/dk-sir.jpg"
                    alt="Dharmendra Kumar (DK Sir)"
                    className={styles.mentorMiniAvatar}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('founder')) {
                        img.src = '/img/founder.jpeg';
                      }
                    }}
                  />
                  <div className={styles.mentorMiniText}>
                    <strong>Dharmendra Kumar (DK Sir)</strong>
                    <span>"In BITSAT, a 3-minute correct solution is an exam failure. Speed conditioning makes all the difference."</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Lead Form Card with Clean Floating Styling */}
              <div className={styles.bookingRight}>
                <div className={styles.bookingFormCard}>
                  {isSubmitted ? (
                    <div className={styles.successCard}>
                      <div className={styles.successIcon}>
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className={styles.successTitle}>Diagnostic Test Booked!</h3>
                      <p className={styles.successText}>
                        Thank you, <strong>{formData.name}</strong>. Our BITSAT admissions team has reserved your test slot and sent access credentials to <strong>{formData.phone}</strong>.
                      </p>
                      <a
                        href={`https://wa.me/919325987875?text=Hello%20DK%20Academy,%20I%20have%20booked%20the%20BITSAT%20Diagnostic%20Test%20for%20${encodeURIComponent(formData.name)}.%20Please%20share%20my%20test%20credentials.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappConfirmBtn}
                      >
                        <MessageSquare size={16} />
                        <span>Confirm on WhatsApp Instantly</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  ) : (
                    <>
                      <h3 className={styles.formTitle}>Register for Free Diagnostic Test</h3>
                      <p className={styles.formSubtitle}>Zero fees • No credit card required • Instant Slot Allocation</p>

                      <form onSubmit={handleSubmit} className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label htmlFor="student-name">Student Full Name *</label>
                          <input
                            id="student-name"
                            type="text"
                            placeholder="Enter student's name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="student-phone">Mobile / WhatsApp Number *</label>
                          <div className={styles.phoneInputWrap}>
                            <span className={styles.phonePrefix}>🇮🇳 +91</span>
                            <input
                              id="student-phone"
                              type="tel"
                              placeholder="10-digit mobile number"
                              pattern="[0-9]{10}"
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="target-class">Current Class / Cohort</label>
                          <select
                            id="target-class"
                            value={formData.targetClass}
                            onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                          >
                            <option value="Class 12th">Class 12th (Appearing 2026/27)</option>
                            <option value="Dropper / Repeater">Dropper / Repeater (Dedicated Target)</option>
                            <option value="Class 11th">Class 11th (Early Foundation)</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="target-campus">Dream BITS Campus</label>
                          <select
                            id="target-campus"
                            value={formData.targetCampus}
                            onChange={(e) => setFormData({ ...formData, targetCampus: e.target.value })}
                          >
                            <option value="BITS Pilani (Main Campus)">BITS Pilani (Main Campus)</option>
                            <option value="BITS K.K. Birla Goa Campus">BITS K.K. Birla Goa Campus</option>
                            <option value="BITS Hyderabad Campus">BITS Hyderabad Campus</option>
                            <option value="Open to Any Campus">Open to Any Campus (Branch Priority)</option>
                          </select>
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                          <Send size={15} />
                          <span>Reserve My Free Diagnostic Test</span>
                          <ArrowRight size={15} />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 8. FAQs Accordion */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="faq">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Brain size={12} />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className={styles.sectionTitle}>
              Everything You Need to Know <span className={styles.titleGradient}>About BITSAT</span>
            </h2>
            <p className={styles.sectionDescription}>
              Exam pattern, 12 bonus questions engine, cutoffs, and speed preparation methodology with DK Sir.
            </p>
          </div>

          <div className={styles.faqList}>
            {BITSAT_FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.faqButton}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className={styles.faqChevronWrap}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswer}>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
};

export default BitsatPage;

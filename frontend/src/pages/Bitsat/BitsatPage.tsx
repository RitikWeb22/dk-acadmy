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
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  Send,
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
      <div className={styles.breadcrumbBar}>
        <Container size="wide">
          <div className={styles.breadcrumbInner}>
            <Link to="/" className={styles.breadcrumbLink}>
              <Home size={14} />
              <span>Home</span>
            </Link>
            <span className={styles.breadcrumbSep}><ChevronRight size={14} /></span>
            <span className={styles.breadcrumbCurrent}>BITSAT 2026/2027 Mastery</span>
          </div>
        </Container>
      </div>

      {/* 2. Hero Section */}
      <section className={styles.heroSection}>
        <Container size="wide">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Flame size={14} />
              <span>BITSAT 2026 &amp; 2027 • ADMISSIONS OPEN</span>
            </div>

            <h1 className={styles.heroHeading}>
              Conquer BITSAT with DK Sir's
              <span className={styles.highlightText}>20–30s Speed Math &amp; CBT Mastery</span>
            </h1>

            <p className={styles.heroSubtext}>
              <strong>130 Questions in 180 Minutes</strong> gives you just 83 seconds per question. Learn rapid option elimination, master English &amp; Logical Reasoning (60 marks), and train with our exact <strong>12-Bonus Questions CBT simulation engine</strong> to score 330+ for BITS Pilani CS.
            </p>

            <div className={styles.heroCtas}>
              <a href="#batches" className={styles.primaryCtaBtn}>
                <Zap size={16} />
                <span>Explore BITSAT Batches</span>
              </a>
              <a href="#diagnostic-form" className={styles.secondaryCtaBtn}>
                <Target size={16} />
                <span>Book Free Diagnostic Test</span>
              </a>
            </div>

            {/* Hero Quick Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>83 Sec</span>
                <p className={styles.statLabel}>Avg. Speed per Question Target</p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>330+</span>
                <p className={styles.statLabel}>Target Score for BITS Pilani CS</p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>+36 Marks</span>
                <p className={styles.statLabel}>12 Bonus Questions Strategy</p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>90 Marks</span>
                <p className={styles.statLabel}>English &amp; Logical Reasoning Focus</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. BITSAT Exam Pattern Blueprint */}
      <section className={`${styles.section} ${styles.sectionLight}`} id="pattern">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Exam Architecture</span>
            <h2 className={styles.sectionTitle}>BITSAT Blueprint: 130 Questions, 390 Marks, 180 Mins</h2>
            <p className={styles.sectionDescription}>
              Mathematics carries the highest weightage (40 questions), while English &amp; Logic (30 questions) form the make-or-break scoring zone.
            </p>
          </div>

          <div className={styles.patternGrid}>
            <div className={styles.patternCard}>
              <div className={styles.patternTop}>
                <span className={`${styles.subjectBadge} ${styles.mathBadge}`}>Part IV</span>
                <Clock size={16} color="#b45309" />
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

            <div className={styles.patternCard}>
              <div className={styles.patternTop}>
                <span className={`${styles.subjectBadge} ${styles.lrBadge}`}>Part III</span>
                <Brain size={16} color="#4338ca" />
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

            <div className={styles.patternCard}>
              <div className={styles.patternTop}>
                <span className={styles.subjectBadge}>Part I</span>
                <Zap size={16} color="#2563eb" />
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

            <div className={styles.patternCard}>
              <div className={styles.patternTop}>
                <span className={styles.subjectBadge}>Part II</span>
                <Award size={16} color="#059669" />
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
            <div className={styles.bonusLeft}>
              <span className={styles.bonusPill}>
                <SparkleIcon /> THE BITSAT ADVANTAGE
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
      <section className={styles.section} id="pedagogy">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Speed-First Methodology</span>
            <h2 className={styles.sectionTitle}>Why JEE Main Coaching Fails in BITSAT Without Speed Conditioning</h2>
            <p className={styles.sectionDescription}>
              In JEE, you have time to derive from fundamentals. In BITSAT, a 3-minute solution is equivalent to a failure. Here is how DK Sir rewires your exam reflexes.
            </p>
          </div>

          <div className={styles.methodsGrid}>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <Zap size={28} />
              </div>
              <h3 className={styles.methodTitle}>20–30 Second Option Elimination</h3>
              <p className={styles.methodText}>
                Substitute boundary values, test dimensional symmetry, and evaluate extreme cases. In 70% of BITSAT math problems, 2 options are mathematically impossible within 15 seconds.
              </p>
            </div>

            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <Brain size={28} />
              </div>
              <h3 className={styles.methodTitle}>English &amp; Logic Score Maximization</h3>
              <p className={styles.methodText}>
                30 questions (90 marks) can elevate your rank from an MSc branch to Computer Science. We teach systematic verbal analogy algorithms, high-frequency root words, and pattern recognition.
              </p>
            </div>

            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <Target size={28} />
              </div>
              <h3 className={styles.methodTitle}>CBT Simulation with Bonus Trigger</h3>
              <p className={styles.methodText}>
                Practice on an interface identical to the official BITSAT TCS-iON engine with the live question palette, section jumper, and official bonus prompt.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Active BITSAT Batches */}
      <section className={`${styles.section} ${styles.sectionLight}`} id="batches">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Enrollment Open 2026–27</span>
            <h2 className={styles.sectionTitle}>Active BITSAT Batches &amp; Pricing</h2>
            <p className={styles.sectionDescription}>
              Target BITS Pilani, Goa, and Hyderabad with targeted crash courses, speed math boosters, and full-length CBT test series.
            </p>
          </div>

          <div className={styles.batchesGrid}>
            {/* Batch 1: Complete Crash Course (Most Popular) */}
            <div className={`${styles.batchCard} ${styles.popularBatch}`}>
              <div className={styles.popularRibbon}>MOST POPULAR BITSAT BATCH</div>
              <div className={styles.batchTop}>
                <span className={styles.batchTypeBadge}>Full 5-Subject Crash Course</span>
                <h3 className={styles.batchTitle}>BITSAT 2026 Speed Master Crash Program</h3>
                <span className={styles.batchTargetYear}>Target BITSAT Sessions 1 &amp; 2 • Class 12th &amp; Droppers</span>
              </div>

              <div className={styles.pricingBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹14,999</span>
                  <span className={styles.originalPrice}>₹24,999</span>
                  <span className={styles.discountBadge}>40% OFF</span>
                </div>
                <p className={styles.priceNote}>Complete 5-subject course + 15 Full BITSAT Mocks</p>
              </div>

              <ul className={styles.featuresList}>
                <li><CheckCircle size={15} className={styles.checkIcon} /> 120+ Live Interactive Speed Hack Sessions by DK Sir &amp; Team</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Full Math (40 Qs), Physics, Chem, English &amp; Logical Reasoning</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> 15 Full-length BITSAT CBT Mocks with Bonus 12 Questions simulator</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> BITSAT Formula Handbooks &amp; High-Frequency English Vocab Bank</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Daily 1:1 Live Doubt Counters &amp; BITS Pilani Alumni Mentorship</li>
              </ul>

              <a
                href="#diagnostic-form"
                className={`${styles.batchActionBtn} ${styles.enrollBtnPrimary}`}
              >
                <span>Enroll in Speed Master Batch</span>
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Batch 2: Math + LR & English Super Booster */}
            <div className={styles.batchCard}>
              <div className={styles.batchTop}>
                <span className={styles.batchTypeBadge}>Targeted Scoring Booster (210 Marks)</span>
                <h3 className={styles.batchTitle}>BITSAT Math + LR &amp; English Super Booster</h3>
                <span className={styles.batchTargetYear}>For students confident in Physics &amp; Chemistry</span>
              </div>

              <div className={styles.pricingBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹8,999</span>
                  <span className={styles.originalPrice}>₹14,999</span>
                  <span className={styles.discountBadge}>40% OFF</span>
                </div>
                <p className={styles.priceNote}>Covers 70 out of 130 Questions (210 Marks)</p>
              </div>

              <ul className={styles.featuresList}>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Complete BITSAT Mathematics (40 Qs) with DK Sir's 20-30s techniques</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> 40+ Hours of dedicated English &amp; Logical Reasoning drills</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> 10 Targeted Math + LR Subject Mocks</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Daily Speed Practice Sheets (DPS) with Video Solutions</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Full access to recorded lecture library till BITSAT Session 2</li>
              </ul>

              <a
                href="#diagnostic-form"
                className={`${styles.batchActionBtn} ${styles.enrollBtnOutline}`}
              >
                <span>Enroll in Math &amp; LR Booster</span>
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Batch 3: All-India BITSAT CBT Test Series */}
            <div className={styles.batchCard}>
              <div className={styles.batchTop}>
                <span className={styles.batchTypeBadge}>Computer-Based Simulation</span>
                <h3 className={styles.batchTitle}>All India BITSAT CBT Online Test Series</h3>
                <span className={styles.batchTargetYear}>15 Full Mocks with Exact TCS-iON Interface</span>
              </div>

              <div className={styles.pricingBlock}>
                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>₹3,499</span>
                  <span className={styles.originalPrice}>₹6,999</span>
                  <span className={styles.discountBadge}>50% OFF</span>
                </div>
                <p className={styles.priceNote}>Includes 12 Bonus Questions algorithm simulation</p>
              </div>

              <ul className={styles.featuresList}>
                <li><CheckCircle size={15} className={styles.checkIcon} /> 15 Full-length BITSAT mock tests strictly aligned with 2026 pattern</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Authentic Bonus Question trigger when all 130 Qs are completed</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Question-wise time analytics (Time spent per question vs topper)</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> All India Rank (AIR) and BITS Campus cutoff predictor</li>
                <li><CheckCircle size={15} className={styles.checkIcon} /> Detailed step-by-step video solutions for every math problem</li>
              </ul>

              <a
                href="#diagnostic-form"
                className={`${styles.batchActionBtn} ${styles.enrollBtnOutline}`}
              >
                <span>Join BITSAT Test Series</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. BITSAT Campus Cutoffs & Target Score Benchmarks */}
      <section className={styles.section} id="cutoffs">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Campus Benchmarks</span>
            <h2 className={styles.sectionTitle}>Target Scores for Top BITS Campuses (Out of 390)</h2>
            <p className={styles.sectionDescription}>
              Reference cutoffs to determine the score threshold required for your dream branch.
            </p>
          </div>

          <div className={styles.cutoffsCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.cutoffTable}>
                <thead>
                  <tr>
                    <th>Branch / Discipline</th>
                    <th>BITS Pilani (Main)</th>
                    <th>BITS K.K. Birla Goa</th>
                    <th>BITS Hyderabad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.branchCell}>Computer Science &amp; Engineering (CSE)</td>
                    <td><span className={styles.scorePill}>331 Marks</span></td>
                    <td><span className={styles.scorePill}>301 Marks</span></td>
                    <td><span className={styles.scorePill}>298 Marks</span></td>
                  </tr>
                  <tr>
                    <td className={styles.branchCell}>Mathematics &amp; Computing (MnC)</td>
                    <td><span className={styles.scorePill}>310 Marks</span></td>
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
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. Free BITSAT Diagnostic & Speed Test Registration Form */}
      <section className={styles.section} id="diagnostic-form">
        <Container size="wide">
          <div className={styles.bookingWrapper}>
            <div className={styles.bookingRow}>
              <div className={styles.bookingLeft}>
                <span className={styles.bookingBadge}>
                  <ShieldCheck size={14} /> ZERO COST DIAGNOSTIC
                </span>
                <h2 className={styles.bookingTitle}>
                  Book Free BITSAT Speed Diagnostic &amp; Strategy Consultation
                </h2>
                <p className={styles.bookingDesc}>
                  Take our 45-minute mini BITSAT Diagnostic Speed Test. DK Sir and our academic team will evaluate your question inspection speed, option elimination accuracy, and recommend your personalized preparation schedule.
                </p>

                <ul className={styles.bookingPerks}>
                  <li><Check size={16} className={styles.perkCheck} /> Full Speed &amp; Accuracy Diagnostic Report</li>
                  <li><Check size={16} className={styles.perkCheck} /> 1-on-1 Strategy Call with DK Sir or Senior Mentor</li>
                  <li><Check size={16} className={styles.perkCheck} /> Free BITSAT Speed Math Formula Sheet PDF</li>
                  <li><Check size={16} className={styles.perkCheck} /> Instant WhatsApp counseling support</li>
                </ul>
              </div>

              <div className={styles.bookingRight}>
                <div className={styles.bookingFormCard}>
                  {isSubmitted ? (
                    <div className={styles.successCard}>
                      <div className={styles.successIcon}>
                        <CheckCircle size={36} />
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
                      </a>
                    </div>
                  ) : (
                    <>
                      <h3 className={styles.formTitle}>Register for Free Diagnostic Test</h3>
                      <p className={styles.formSubtitle}>Zero fees • No credit card required</p>

                      <form onSubmit={handleSubmit} className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label htmlFor="student-name">Student Full Name *</label>
                          <input
                            id="student-name"
                            type="text"
                            placeholder="Enter student name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="student-phone">Mobile / WhatsApp Number *</label>
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
                          <Send size={15} style={{ display: 'inline', marginRight: '6px' }} />
                          <span>Reserve My Free Diagnostic Test</span>
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
      <section className={`${styles.section} ${styles.sectionLight}`} id="faq">
        <Container size="wide">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Got Questions?</span>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions about BITSAT</h2>
            <p className={styles.sectionDescription}>
              Everything you need to know about exam pattern, bonus questions, and preparation with DK Academy.
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
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <p className={styles.faqAnswer}>{faq.answer}</p>
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

// Mini Sparkle Icon component
function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

export default BitsatPage;

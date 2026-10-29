import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Sparkles,
  Lock,
  Play,
  PhoneCall,
  MessageCircle,
  CheckCircle2,
  GraduationCap,
  FileText,
  Clock,
  Layers,
  Search,
  HelpCircle,
  ChevronDown,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  Maximize2
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { FREE_COURSES_CATALOG } from '../../data/coursesData';
import { ReferenceCourseCard } from '../../components/courses/ReferenceCourseCard/ReferenceCourseCard';
import { useStudentAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CallbackModal } from '../../components/leads/CallbackModal/CallbackModal';
import { getStudentWhatsAppUrl } from '../../utils/whatsapp';
import { apiClient } from '../../services/apiClient';
import type { Course } from '../../types';
import styles from './FreeLecturesPage.module.scss';

// Mock curriculum details for the 5 unlocked demo masterclasses
const DEMO_SYLLABUS_DETAILS: Record<string, { lectures: { title: string; duration: string; isFree: boolean; dppName: string }[] }> = {
  'free-math-calculus-shortcuts': {
    lectures: [
      { title: 'Lecture 1: Limits & Indeterminate Forms — 20s Inspection Rule', duration: '54 min', isFree: true, dppName: 'DPP-01: Limits & L-Hopital Shortcuts' },
      { title: 'Lecture 2: Continuity & Differentiability — Graphical Edge Cases', duration: '58 min', isFree: true, dppName: 'DPP-02: Non-Differentiable Cusps & Corners' },
      { title: 'Lecture 3: Definite Integration — King & Queen Property Shortcuts', duration: '62 min', isFree: true, dppName: 'DPP-03: Definite Integral Symmetry Drills' },
      { title: 'Lecture 4: Leibniz Rule & Differential Equations Formation', duration: '51 min', isFree: true, dppName: 'DPP-04: Variable Separable & Integrating Factors' },
      { title: 'Lecture 5: Maxima & Minima Optimization Problems without Second Derivative', duration: '59 min', isFree: true, dppName: 'DPP-05: Optimization & Tangent Constraints' },
      { title: 'Lecture 6: Area Under Curves & Bounding Polygons (Full Batch)', duration: '65 min', isFree: false, dppName: 'DPP-06: Parabola-Line Intersections' },
      { title: 'Lecture 7: Vector Calculus & 3D Geometry Projections (Full Batch)', duration: '70 min', isFree: false, dppName: 'DPP-07: Coplanarity & Shortest Distance' },
      { title: 'Lecture 8: Complex Numbers Geometry & De Moivre (Full Batch)', duration: '68 min', isFree: false, dppName: 'DPP-08: Argand Planes & Rotation Theorem' },
      { title: 'Lecture 9: Probability & Bayes Theorem Tree Method (Full Batch)', duration: '60 min', isFree: false, dppName: 'DPP-09: Conditional Probability Matrices' },
      { title: 'Lecture 10: JEE Advanced Multi-Concept Calculus Sprint (Full Batch)', duration: '75 min', isFree: false, dppName: 'DPP-10: Advanced Mixed Problems Master Sheet' }
    ]
  },
  'free-physics-mechanics-mastery': {
    lectures: [
      { title: "Lecture 1: Newton's Laws & Constraint Relations (String & Wedge)", duration: '56 min', isFree: true, dppName: 'DPP-01: Pulley Constraints & Virtual Work' },
      { title: 'Lecture 2: Friction & Pseudo-Force in Non-Inertial Frames', duration: '52 min', isFree: true, dppName: 'DPP-02: Two-Block Friction & Wedges' },
      { title: 'Lecture 3: Work-Energy Theorem & Conservative Field Potential Wells', duration: '60 min', isFree: true, dppName: 'DPP-03: Variable Force Work & Springs' },
      { title: 'Lecture 4: Center of Mass Velocity, Truncated Bodies & Momentum Conservation', duration: '57 min', isFree: true, dppName: 'DPP-04: Explosion & Collision Kinetics' },
      { title: 'Lecture 5: Rotational Kinematics & Instantaneous Center of Zero Velocity', duration: '64 min', isFree: true, dppName: 'DPP-05: Pure Rolling & Slipping Transitions' },
      { title: 'Lecture 6: Moment of Inertia Tensor & Parallel Axis Shortcuts (Full Batch)', duration: '62 min', isFree: false, dppName: 'DPP-06: Composite Bodies MOI' },
      { title: 'Lecture 7: Angular Momentum Conservation in Collisions (Full Batch)', duration: '66 min', isFree: false, dppName: 'DPP-07: Eccentric Impacts & Hinges' },
      { title: 'Lecture 8: Simple Harmonic Motion & Phasor Vector Diagrams (Full Batch)', duration: '58 min', isFree: false, dppName: 'DPP-08: Compound Pendulums' },
      { title: 'Lecture 9: Fluid Dynamics — Bernoulli with Non-Ideal Constraints (Full Batch)', duration: '61 min', isFree: false, dppName: 'DPP-09: Torricelli & Siphon Mechanics' },
      { title: 'Lecture 10: Advanced Mechanics Olympiad-Grade Problem Workshop (Full Batch)', duration: '78 min', isFree: false, dppName: 'DPP-10: Irodov & Krotov Level Challenges' }
    ]
  },
  'free-chemistry-goc-mechanisms': {
    lectures: [
      { title: 'Lecture 1: Electronic Displacement Effects (Inductive, Hyperconjugation & Mesomeric)', duration: '53 min', isFree: true, dppName: 'DPP-01: Carbocation & Free Radical Stabilities' },
      { title: 'Lecture 2: Aromaticity, Anti-Aromaticity & Hückel (4n+2) Annulene Exceptions', duration: '49 min', isFree: true, dppName: 'DPP-02: Heterocyclic Ring Aromaticity' },
      { title: 'Lecture 3: Acidic & Basic Strengths in Substituted Benzenes (Ortho & SIR Effect)', duration: '57 min', isFree: true, dppName: 'DPP-03: pKa Comparison & Basicity Orders' },
      { title: 'Lecture 4: Nucleophilic Substitution Mechanisms: SN1 vs SN2 Kinetic Profiles', duration: '63 min', isFree: true, dppName: 'DPP-04: Stereochemical Inversion & Retention' },
      { title: 'Lecture 5: Elimination Reactions: E1, E2 & E1cB Regioselectivity (Saytzeff vs Hofmann)', duration: '55 min', isFree: true, dppName: 'DPP-05: Dehydrohalogenation Substrates' },
      { title: 'Lecture 6: Electrophilic Aromatic Substitution (EAS) Regiospecificity (Full Batch)', duration: '62 min', isFree: false, dppName: 'DPP-06: Friedel-Crafts Alkylation & Acylation' },
      { title: 'Lecture 7: Aldol, Cannizzaro & Carbonyl Enolate Addition Mechanisms (Full Batch)', duration: '67 min', isFree: false, dppName: 'DPP-07: Cross-Aldol & Michael Additions' },
      { title: 'Lecture 8: Named Organic Rearrangements (Pinacol, Beckmann, Hoffmann) (Full Batch)', duration: '64 min', isFree: false, dppName: 'DPP-08: Molecular Rearrangement Pathways' },
      { title: 'Lecture 9: Biomolecules & Polymer Synthesis Reaction Maps (Full Batch)', duration: '50 min', isFree: false, dppName: 'DPP-09: Peptide Bonds & Glucose Conformations' },
      { title: 'Lecture 10: Multi-Step Organic Synthesis for JEE Advanced (Full Batch)', duration: '72 min', isFree: false, dppName: 'DPP-10: Reagent Matrices & Roadmaps' }
    ]
  },
  'free-advanced-option-elimination': {
    lectures: [
      { title: 'Lecture 1: Boundary Value & Extreme Limits Substitution Technique', duration: '52 min', isFree: true, dppName: 'DPP-01: Boundary Limits Elimination Drills' },
      { title: 'Lecture 2: Dimensional Analysis & Symmetry Trapping in Multi-Correct MCQs', duration: '55 min', isFree: true, dppName: 'DPP-02: Dimensional Check & Symmetric Roots' },
      { title: 'Lecture 3: Integer & Matrix Match Strategic Solving Protocols', duration: '58 min', isFree: true, dppName: 'DPP-03: Matrix Match Cross-Elimination' },
      { title: 'Lecture 4: Eliminating Common Distractors in Negative-Marking Environments', duration: '50 min', isFree: true, dppName: 'DPP-04: Trap Answer Recognition Sheets' },
      { title: 'Lecture 5: Live Solving Past 5-Year JEE Advanced Dilemmas in 20-30s', duration: '65 min', isFree: true, dppName: 'DPP-05: Real Exam Timed Inspection Drills' },
      { title: 'Lecture 6: Multi-Option Differential Equations Verification (Full Batch)', duration: '63 min', isFree: false, dppName: 'DPP-06: Reverse Substitution Protocols' },
      { title: 'Lecture 7: Coordinate Geometry Rapid Tangent Slopes (Full Batch)', duration: '59 min', isFree: false, dppName: 'DPP-07: Conic Sections Fast Slopes' },
      { title: 'Lecture 8: Electromagnetism Lenz Law Direction Verification (Full Batch)', duration: '61 min', isFree: false, dppName: 'DPP-08: Flux Right-Hand Inspection' },
      { title: 'Lecture 9: Modern Physics Energy Shell Shortcuts (Full Batch)', duration: '54 min', isFree: false, dppName: 'DPP-09: De Broglie & Binding Energy Trends' },
      { title: 'Lecture 10: Full JEE Advanced Simulation: Solving 18 Questions in 35 Mins (Full Batch)', duration: '80 min', isFree: false, dppName: 'DPP-10: Ultimate Rank Booster Speed Test' }
    ]
  }
};

const FAQS = [
  {
    q: 'Are the 5 demo masterclasses truly 100% free?',
    a: 'Yes, completely free. You do not need a credit card, payment details, or subscription commitment. The first 5 comprehensive masterclasses in every subject track are immediately unlocked in our LMS player upon registration.'
  },
  {
    q: 'Do I get the lecture notes and DPPs for these free lectures?',
    a: 'Absolutely. Every unlocked lecture includes high-resolution downloadable PDF handwritten blackboard notes and a Kota Daily Practice Problem (DPP) sheet with answer keys.'
  },
  {
    q: 'What is DK Sir’s 20-30s problem-solving technique?',
    a: 'It is a proprietary inspection methodology developed by Dharmendra Kumar (DK Sir) over 18+ years of Kota coaching. It teaches JEE aspirants how to visualize symmetry, boundary limits, and physical constraints to identify correct answers in 20 to 30 seconds without pages of lengthy algebra.'
  },
  {
    q: 'Can I watch these lectures on my mobile phone or tablet?',
    a: 'Yes. Our LMS is optimized for modern mobile, tablet, and desktop browsers with 1080p Full HD video streaming, 0.5x to 2x speed adjustment, and responsive playback.'
  },
  {
    q: 'How do I unlock lectures 6 through 10 and full test series?',
    a: 'If you find the pedagogy effective and want the complete 2-year or 1-year comprehensive course, you can upgrade right inside your LMS or speak with our academic counselors for batch enrollment.'
  }
];

export const FreeLecturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { student, isAuthenticated, enrollCourse } = useStudentAuth();
  const { showToast } = useToast();

  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'All' | 'Mathematics' | 'Physics' | 'Chemistry'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<Course | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [liveLecturesMap, setLiveLecturesMap] = useState<
    Record<string, { lectures: { title: string; duration: string; isFree: boolean; price?: number; dppName: string }[] }>
  >(DEMO_SYLLABUS_DETAILS);

  // Fetch live video masterclasses from MongoDB Atlas
  useEffect(() => {
    const fetchLiveLectures = async () => {
      try {
        const res = await apiClient.get('/free-lectures');
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const map: Record<string, { lectures: any[] }> = {};
          res.data.forEach((lec: any) => {
            const trackKey = lec.trackId;
            if (!map[trackKey]) {
              map[trackKey] = { lectures: [] };
            }
            map[trackKey].lectures.push({
              title: lec.title,
              duration: lec.duration || '45 min',
              isFree: lec.isFree,
              price: lec.price || (lec.isFree ? 0 : 499),
              dppName: lec.dppName || 'DPP Practice Sheet'
            });
          });
          setLiveLecturesMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('Using default demo syllabus:', err);
      }
    };

    fetchLiveLectures();
  }, []);

  const handleEnrollAndStart = (course: Course) => {
    const isPaid = course.tier !== 'Free' && (!course.numericPrice || course.numericPrice > 0);
    if (isPaid) {
      if (!isAuthenticated || !student) {
        navigate(`/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`);
        return;
      }
      navigate(`/payment/${course.id}`);
      return;
    }
    enrollCourse(course.id);
    showToast(`Enrolled in free preview of "${course.title}"! Opening LMS...`, 'success');
    navigate(`/learn/${course.id}`);
  };

  const filteredCourses = FREE_COURSES_CATALOG.filter((c) => {
    const matchesSubject = selectedSubjectFilter === 'All' || c.subjects?.includes(selectedSubjectFilter);
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetExam.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const whatsappUrl = getStudentWhatsAppUrl({
    targetBatch: 'Free Demo Lectures & Kota LMS',
    question: 'Hello DK Academy, I would like guidance on exploring the free demo masterclasses.'
  });

  return (
    <main className={styles.page}>
      {/* 1. Academic Counselor Top Notice Bar */}
      <section className={styles.counselorBar} aria-label="Counselor Support Hotline">
        <Container size="wide">
          <div className={styles.counselorInner}>
            <div className={styles.counselorLeft}>
              <span className={styles.helpdeskBadge}>Academic Helpdesk</span>
              <span>Talk to Senior Kota Academic Advisors for Course Guidance &amp; Backlog Strategies</span>
            </div>
            <div className={styles.counselorActions}>
              <a href="tel:+919876543210" className={styles.counselorLink}>
                <PhoneCall size={14} />
                <span>+91 98765 43210</span>
              </a>
              <span className={styles.dividerDot} aria-hidden="true">•</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.counselorWaLink}
              >
                <MessageCircle size={14} />
                <span>WhatsApp Counselor</span>
              </a>
              <span className={styles.dividerDot} aria-hidden="true">•</span>
              <button
                type="button"
                className={styles.requestCallbackBtn}
                onClick={() => setIsCallbackModalOpen(true)}
              >
                Request Callback
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Hero Section with Breadcrumbs & Modern Pedagogy Showcase */}
      <section className={styles.heroSection}>
        <Container size="wide">
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol className={styles.breadcrumbList}>
              <li className={styles.breadcrumbItem}>
                <Link to="/" className={styles.breadcrumbLink}>
                  <Home size={14} />
                  <span>Home</span>
                </Link>
              </li>
              <li className={styles.breadcrumbSeparator} aria-hidden="true">
                <ChevronRight size={14} />
              </li>
              <li className={styles.breadcrumbItem}>
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  Free Lectures &amp; Demo Courses
                </span>
              </li>
            </ol>
          </nav>

          <div className={styles.heroGrid}>
            {/* Left Column: Heading, Subtitle, LMS Features, CTAs */}
            <div className={styles.heroContent}>
              <div className={styles.eyebrowBadge}>
                <span className={styles.livePulseDot} aria-hidden="true">
                  <span className={styles.pulseRing} />
                  <span className={styles.pulseCore} />
                </span>
                <span className={styles.eyebrowHighlight}>Kota Pedagogy Demo Access</span>
                <span className={styles.eyebrowDivider}>•</span>
                <span className={styles.eyebrowTag}>No Card Required</span>
              </div>

              <h1 className={styles.heroTitle}>
                Experience Kota Classroom Pedagogy — <span className={styles.heroTitleHighlight}>100% Free</span>
              </h1>

              <p className={styles.heroDescription}>
                Evaluate DK Sir’s proprietary 20-second shortcut techniques and deep conceptual mechanics before taking any admission decision. Every track unlocks <strong>5 free video masterclasses</strong> in our interactive LMS with chapter notes and Kota DPP practice sheets.
              </p>

              {/* 3-Pillar Modern LMS Features Grid */}
              <div className={styles.lmsFeatureGrid}>
                <div className={styles.lmsFeatureCard}>
                  <div className={`${styles.featureIconBox} ${styles.iconBoxBlue}`}>
                    <Zap size={18} aria-hidden="true" />
                  </div>
                  <div className={styles.featureTextBox}>
                    <span className={styles.featureTitle}>HD 1080p &amp; 2x Speed</span>
                    <span className={styles.featureSub}>Adaptive Bitrate Player</span>
                  </div>
                </div>

                <div className={styles.lmsFeatureCard}>
                  <div className={`${styles.featureIconBox} ${styles.iconBoxEmerald}`}>
                    <FileText size={18} aria-hidden="true" />
                  </div>
                  <div className={styles.featureTextBox}>
                    <span className={styles.featureTitle}>Kota DPP &amp; Notes</span>
                    <span className={styles.featureSub}>Handwritten PDF Solutions</span>
                  </div>
                </div>

                <div className={styles.lmsFeatureCard}>
                  <div className={`${styles.featureIconBox} ${styles.iconBoxAmber}`}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </div>
                  <div className={styles.featureTextBox}>
                    <span className={styles.featureTitle}>5 Free Masterclasses</span>
                    <span className={styles.featureSub}>Instant LMS Enrollment</span>
                  </div>
                </div>
              </div>

              {/* High-Conversion Direct Action CTAs */}
              <div className={styles.heroCtaRow}>
                <button
                  type="button"
                  className={styles.heroWatchBtn}
                  onClick={() => handleEnrollAndStart(filteredCourses[0] || FREE_COURSES_CATALOG[0])}
                  aria-label="Start watching free masterclasses"
                >
                  <Play size={18} fill="currentColor" aria-hidden="true" />
                  <span>Start Free Masterclass</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={styles.heroCounselorBtn}
                  onClick={() => setIsCallbackModalOpen(true)}
                  aria-label="Request academic counseling callback"
                >
                  <PhoneCall size={16} aria-hidden="true" />
                  <span>Talk to Counselor</span>
                </button>
              </div>

              {/* Trust Guarantees */}
              <div className={styles.trustStrip}>
                <span className={styles.trustItem}>
                  <ShieldCheck size={14} className={styles.trustIcon} aria-hidden="true" />
                  <span>Instant LMS Access</span>
                </span>
                <span className={styles.trustDot}>•</span>
                <span className={styles.trustItem}>
                  <ShieldCheck size={14} className={styles.trustIcon} aria-hidden="true" />
                  <span>No Credit Card Required</span>
                </span>
                <span className={styles.trustDot}>•</span>
                <span className={styles.trustItem}>
                  <ShieldCheck size={14} className={styles.trustIcon} aria-hidden="true" />
                  <span>Mobile &amp; Web Compatible</span>
                </span>
              </div>
            </div>

            {/* Right Column: High-Tech Masterclass Video Player Showcase */}
            <div className={styles.heroVideoWrap}>
              <div
                className={styles.videoPlayerCard}
                onClick={() => handleEnrollAndStart(filteredCourses[0] || FREE_COURSES_CATALOG[0])}
                role="button"
                tabIndex={0}
                aria-label="Play featured demo masterclass by DK Sir"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEnrollAndStart(filteredCourses[0] || FREE_COURSES_CATALOG[0]);
                  }
                }}
              >
                {/* Masterclass Thumbnail */}
                <img
                  src="/img/dk-sir.jpg"
                  alt="Dharmendra Kumar (DK Sir) delivering Calculus Masterclass"
                  className={styles.videoThumbnailImg}
                />
                <div className={styles.videoOverlayGradient} />

                {/* Top Video Chrome Bar */}
                <div className={styles.videoTopBar}>
                  <div className={styles.videoFreeBadge}>
                    <Sparkles size={13} aria-hidden="true" />
                    <span>Free Masterclass Preview</span>
                  </div>
                  <div className={styles.durationPill}>
                    <Clock size={12} aria-hidden="true" />
                    <span>45 mins</span>
                    <span className={styles.hdBadge}>1080p</span>
                  </div>
                </div>

                {/* Center Animated Play Button */}
                <div className={styles.playGlowWrapper}>
                  <div className={styles.playGlowBtn}>
                    <Play size={26} fill="currentColor" className={styles.playIconSvg} aria-hidden="true" />
                  </div>
                  <span className={styles.clickToPlayPill}>Click to Watch in LMS</span>
                </div>

                {/* Bottom Video Player Console Bar */}
                <div className={styles.videoPlayerConsole}>
                  {/* Fake Scrub Bar */}
                  <div className={styles.simulatedScrubBar} aria-hidden="true">
                    <div className={styles.scrubProgress} />
                  </div>

                  <div className={styles.consoleControlsRow}>
                    <div className={styles.consoleLeft}>
                      <span className={styles.videoMentorTag}>Taught by DK Sir (18+ Yrs Kota)</span>
                      <h2 className={styles.videoOverlayTitle}>
                        Limits &amp; Indeterminate Forms: 20s Inspection Rule
                      </h2>
                    </div>

                    <div className={styles.consoleIcons} aria-hidden="true">
                      <Volume2 size={16} className={styles.playerControlIcon} />
                      <Maximize2 size={16} className={styles.playerControlIcon} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Subject Filter & Search Bar */}
      <section className={styles.filterSection}>
        <Container size="wide">
          <div className={styles.filterBar}>
            <div className={styles.subjectFilterGroup}>
              <span className={styles.filterGroupLabel}>
                <GraduationCap size={16} aria-hidden="true" />
                <span>Track:</span>
              </span>
              <div className={styles.scrollablePillsWrap} role="tablist" aria-label="Topic filters">
                {[
                  { id: 'All', label: 'All Free Batches' },
                  { id: 'Mathematics', label: 'Mathematics' },
                  { id: 'Physics', label: 'Physics' },
                  { id: 'Chemistry', label: 'Chemistry' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedSubjectFilter === item.id}
                    className={`${styles.filterPill} ${selectedSubjectFilter === item.id ? styles.filterPillActive : ''}`}
                    onClick={() => setSelectedSubjectFilter(item.id as any)}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search demo tracks, topics, or exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search free demo masterclasses"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className={styles.coursesCountBadge}>
              Showing <strong>{filteredCourses.length}</strong> Demo Tracks
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Professional Free Courses Catalog Grid */}
      <section className={styles.catalogSection} aria-label="Free Demo Courses Catalog">
        <Container size="wide">
          {filteredCourses.length === 0 ? (
            <div className={styles.emptyResultsCard}>
              <HelpCircle size={40} className={styles.emptyIcon} aria-hidden="true" />
              <h3>No demo courses found matching "{searchQuery}"</h3>
              <p>Try clearing your search query or selecting "All Free Batches" above.</p>
              <button
                type="button"
                className={styles.resetFilterBtn}
                onClick={() => {
                  setSelectedSubjectFilter('All');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {filteredCourses.map((course) => (
                <ReferenceCourseCard
                  key={course.id}
                  course={course}
                  actionLabel="Start Free"
                  onEnroll={(c) => handleEnrollAndStart(c)}
                  onDemo={(c) => handleEnrollAndStart(c)}
                  onSyllabus={(c) => setSelectedSyllabusCourse(c)}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 5. How It Works: Sequential 1-2-3 Connected Step Timeline */}
      <section className={styles.howItWorksSection} aria-label="How Free Demo Lectures Work">
        <Container size="wide">
          <div className={styles.howItWorksCard}>
            <div className={styles.timelineHeaderBlock}>
              <span className={styles.timelineEyebrow}>EVALUATION WORKFLOW</span>
              <h2 className={styles.timelineTitle}>How Free Demo Lectures Work</h2>
              <p className={styles.timelineSubtitle}>
                A transparent, zero-risk pathway for students and parents to evaluate classroom rigor before enrolling in full batches.
              </p>
            </div>

            {/* Sequential 1-2-3 Connected Timeline */}
            <div className={styles.timelineContainer}>
              <div className={styles.timelineConnectingLine} aria-hidden="true" />

              <div className={styles.timelineStepsGrid}>
                {/* Step 1 */}
                <div className={styles.timelineStepCard}>
                  <div className={styles.stepBadgeWrap}>
                    <div className={styles.stepBadge}>01</div>
                    <div className={styles.stepIconBubble}>
                      <Layers size={18} aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className={styles.stepHeading}>Pick Your Subject Track</h3>
                  <p className={styles.stepDescription}>
                    Select from Mathematics (DK Sir 20s Inspection Rule), Physics Mechanics, or Organic Chemistry Mechanisms.
                  </p>
                </div>

                {/* Step 2 */}
                <div className={styles.timelineStepCard}>
                  <div className={styles.stepBadgeWrap}>
                    <div className={styles.stepBadge}>02</div>
                    <div className={styles.stepIconBubble}>
                      <Play size={18} fill="currentColor" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className={styles.stepHeading}>Watch 5 Free Masterclasses</h3>
                  <p className={styles.stepDescription}>
                    Access full HD 1080p video lectures in our LMS player with 0.5x–2.0x playback speed and interactive navigation.
                  </p>
                </div>

                {/* Step 3 */}
                <div className={styles.timelineStepCard}>
                  <div className={styles.stepBadgeWrap}>
                    <div className={styles.stepBadge}>03</div>
                    <div className={styles.stepIconBubble}>
                      <FileText size={18} aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className={styles.stepHeading}>Solve DPPs &amp; Upgrade</h3>
                  <p className={styles.stepDescription}>
                    Download matching Kota DPP problem sheets with answer keys, and upgrade to the complete batch whenever ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Academic Counselor Support Banner */}
      <section className={styles.counselorBannerSection}>
        <Container size="wide">
          <div className={styles.counselorBannerCard}>
            <div className={styles.counselorBannerContent}>
              <span className={styles.counselorEyebrow}>1-ON-1 ADMISSION &amp; STRATEGY GUIDANCE</span>
              <h2 className={styles.counselorBannerTitle}>
                Have Questions About Syllabus Backlog or Batch Timings?
              </h2>
              <p className={styles.counselorBannerSubtitle}>
                Speak directly with senior academic counselors who understand the current JEE exam patterns and can recommend the right track for your class level.
              </p>
              <div className={styles.counselorBannerCtas}>
                <button
                  type="button"
                  className={styles.bannerCallbackBtn}
                  onClick={() => setIsCallbackModalOpen(true)}
                >
                  <PhoneCall size={16} />
                  <span>Request Academic Callback</span>
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.bannerWaBtn}
                >
                  <MessageCircle size={16} />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. Frequently Asked Questions */}
      <section className={styles.faqSection}>
        <Container size="wide">
          <div className={styles.faqWrapper}>
            <div className={styles.faqHeader}>
              <span className={styles.sectionEyebrow}>COMMON QUESTIONS</span>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <p className={styles.sectionSubtitle}>
                Everything you need to know about accessing our free masterclasses and Kota LMS.
              </p>
            </div>

            <div className={styles.faqList}>
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                    <button
                      type="button"
                      className={styles.faqQuestionBtn}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={18} className={styles.faqChevron} />
                    </button>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* 8. Syllabus Modal / Drawer */}
      {selectedSyllabusCourse && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedSyllabusCourse(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalSubtitle}>{selectedSyllabusCourse.targetExam} • {selectedSyllabusCourse.targetClass || 'Class 11 & 12'}</span>
                <h3 className={styles.modalTitle}>{selectedSyllabusCourse.title}</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedSyllabusCourse(null)}
                aria-label="Close syllabus modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalNotice}>
                <Sparkles size={16} />
                <span>
                  <strong>Lectures 1 to 5 are completely free.</strong> Watch them inside the LMS without any payment. Lectures 6 to 10 are unlocked upon full course enrollment.
                </span>
              </div>

              <div className={styles.syllabusLecturesList}>
                {(liveLecturesMap[selectedSyllabusCourse.id]?.lectures || []).map((lec, idx) => (
                  <div
                    key={idx}
                    className={`${styles.syllabusLectureRow} ${lec.isFree ? styles.lectureRowFree : styles.lectureRowLocked}`}
                  >
                    <div className={styles.lectureIconCol}>
                      {lec.isFree ? (
                        <div className={styles.freeIconCircle}>
                          <Play size={12} fill="currentColor" />
                        </div>
                      ) : (
                        <div className={styles.lockedIconCircle}>
                          <Lock size={12} />
                        </div>
                      )}
                    </div>
                    <div className={styles.lectureDetailsCol}>
                      <div className={styles.lectureTitleRow}>
                        <h4 className={styles.lectureHeading}>{lec.title}</h4>
                        <span className={styles.lectureDurationBadge}>{lec.duration}</span>
                      </div>
                      <div className={styles.lectureDppRow}>
                        <FileText size={12} />
                        <span>{lec.dppName}</span>
                        {lec.isFree ? (
                          <span className={styles.unlockedTag}>100% Free Demo (₹0)</span>
                        ) : (
                          <span className={styles.lockedTag}>Paid Masterclass • ₹{lec.price || 499}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalStartBtn}
                onClick={() => {
                  const c = selectedSyllabusCourse;
                  setSelectedSyllabusCourse(null);
                  handleEnrollAndStart(c);
                }}
              >
                <Play size={16} fill="currentColor" />
                <span>Start Free Preview in LMS</span>
              </button>
              <button
                type="button"
                className={styles.modalDismissBtn}
                onClick={() => setSelectedSyllabusCourse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counselor Callback Modal */}
      {isCallbackModalOpen && (
        <CallbackModal
          isOpen={isCallbackModalOpen}
          onClose={() => setIsCallbackModalOpen(false)}
          source="Free Lectures Page"
        />
      )}
    </main>
  );
};

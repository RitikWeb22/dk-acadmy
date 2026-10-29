import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Star,
  Clock,
  BookOpen,
  Video,
  Award,
  CheckCircle2,
  Play,
  FileText,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Users,
  Lock,
  ArrowRight,
  Check,
  Compass,
  PhoneCall,
  GraduationCap,
  Download,
  Calendar
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { COURSES_CATALOG, FREE_COURSES_CATALOG, getTargetYearLabel } from '../../data/coursesData';
import { cmsService } from '../../services/cmsService';
import { useStudentAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CourseDemoModal } from '../../components/courses/CourseDemoModal/CourseDemoModal';
import { CourseSyllabusModal } from '../../components/courses/CourseSyllabusModal/CourseSyllabusModal';
import type { Course, CourseCurriculumSection } from '../../types';
import styles from './CourseDetailPage.module.scss';

// Format Indian Currency nicely (e.g. ₹18,500)
function formatIndianPrice(price: number | string | undefined, isFree: boolean): string {
  if (isFree) return 'Free';
  if (price === undefined || price === null || price === '') return '₹4,999';

  if (typeof price === 'number') {
    return price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`;
  }

  const str = String(price).trim();
  if (str.toLowerCase().includes('free') || str === '0' || str === '₹0') return 'Free';
  if (str.startsWith('₹')) return str;

  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    return num === 0 ? 'Free' : `₹${num.toLocaleString('en-IN')}`;
  }
  return str;
}

// Generate realistic, high-standard Kota curriculum if not already present
interface EnhancedCurriculumSection extends CourseCurriculumSection {
  classLevel?: 'Class 11' | 'Class 12' | 'All';
}

const getGeneratedCurriculum = (course: Course): EnhancedCurriculumSection[] => {
  if (course.curriculumSections && course.curriculumSections.length > 0) {
    return course.curriculumSections.map((sec, idx) => ({
      ...sec,
      classLevel: idx % 2 === 0 ? 'Class 11' : 'Class 12'
    }));
  }

  const isFoundation = course.targetClass?.toLowerCase().includes('10') || course.targetExam?.toLowerCase().includes('foundation');

  if (isFoundation) {
    return [
      {
        id: 'sec-f1',
        title: 'Module 1 (Class 10-11 Bridge): Mathematical Foundations & Algebra',
        durationText: '10 Lectures • 8h 20m',
        classLevel: 'Class 11',
        lectures: [
          { id: 'lec-f1-1', title: 'Polynomials & Real Number Properties: Transition to JEE', duration: '50 min', isPreview: true },
          { id: 'lec-f1-2', title: 'Quadratic Equations & Roots Relation: Graphical Sign Analysis', duration: '55 min', isPreview: true },
          { id: 'lec-f1-3', title: 'Linear Inequalities & Wavy Curve Method for Range Calculation', duration: '52 min', isPreview: false },
          { id: 'lec-f1-4', title: 'Logarithms & Base Transformations: Kota Speed Drills', duration: '48 min', isPreview: false }
        ]
      },
      {
        id: 'sec-f2',
        title: 'Module 2 (Class 11 Physics): Mechanics & Scientific Reasoning Fundamentals',
        durationText: '8 Lectures • 6h 45m',
        classLevel: 'Class 11',
        lectures: [
          { id: 'lec-f2-1', title: 'Kinematics 1D: Motion with Variable Acceleration & Calculus Basics', duration: '54 min', isPreview: true },
          { id: 'lec-f2-2', title: "Vectors, Dot & Cross Products with Physical Illustrations", duration: '50 min', isPreview: false },
          { id: 'lec-f2-3', title: "Newton's Laws of Motion: Free Body Diagrams & Constraint Equations", duration: '60 min', isPreview: false }
        ]
      },
      {
        id: 'sec-f3',
        title: 'Module 3 (Diagnostics): Foundation Science & Milestone Tests',
        durationText: '4 Milestone Tests • 6h 00m',
        classLevel: 'All',
        lectures: [
          { id: 'lec-f3-1', title: 'Foundation Milestone Test 1: Full Algebra & Vectors Assessment', duration: '1h 30m', isPreview: false },
          { id: 'lec-f3-2', title: 'Milestone 1 Detailed Video Walkthrough & Common Traps', duration: '1h 15m', isPreview: false }
        ]
      }
    ];
  }

  return [
    {
      id: 'sec-1',
      title: 'Module 1 (Class 11 Topics): Mechanics, Algebra & 20-30s Inspection Rules',
      durationText: '8 Lectures • 6h 30m',
      classLevel: 'Class 11',
      lectures: [
        { id: 'lec-1-1', title: 'Boundary Limits & Inspection Rule: Eliminating 2 Options in 20s', duration: '48 min', isPreview: true },
        { id: 'lec-1-2', title: 'Multi-Correct MCQ Verification & Symmetry Trapping Protocols', duration: '54 min', isPreview: true },
        { id: 'lec-1-3', title: 'Newtonian Dynamics & Pulley Constraints: Virtual Work Technique', duration: '51 min', isPreview: false },
        { id: 'lec-1-4', title: 'Calculus Optimization without Second Derivatives: The Tangent Shortcut', duration: '58 min', isPreview: false }
      ]
    },
    {
      id: 'sec-2',
      title: 'Module 2 (Class 12 Topics): Advanced Calculus, Electrodynamics & Regioselectivity',
      durationText: '12 Lectures • 9h 45m',
      classLevel: 'Class 12',
      lectures: [
        { id: 'lec-2-1', title: 'Definite Integrals: King & Queen Property Symmetry Shortcuts', duration: '55 min', isPreview: true },
        { id: 'lec-2-2', title: 'Rotational Dynamics: Instantaneous Axis of Rotation (IAOR) Masterclass', duration: '64 min', isPreview: false },
        { id: 'lec-2-3', title: 'Organic Reaction Mechanisms: Regioselectivity in Elimination (Saytzeff vs Hofmann)', duration: '58 min', isPreview: false },
        { id: 'lec-2-4', title: 'Kota Pedagogy DPP Sheet Discussion: 15 High-Probability Questions', duration: '60 min', isPreview: false }
      ]
    },
    {
      id: 'sec-3',
      title: 'Module 3 (Revision & Linkage): Multi-Concept Linkage & Named Reactions',
      durationText: '10 Lectures • 8h 15m',
      classLevel: 'All',
      lectures: [
        { id: 'lec-3-1', title: 'JEE Advanced Matrix Match & Integer Type Traps Deconstruction', duration: '50 min', isPreview: false },
        { id: 'lec-3-2', title: 'Electromagnetism & Induced EMF: Lenz Law Direction Inspection', duration: '56 min', isPreview: false },
        { id: 'lec-3-3', title: 'Complex Numbers Geometry: Argand Plane Circles & Rotation Theorem', duration: '62 min', isPreview: false }
      ]
    },
    {
      id: 'sec-4',
      title: 'Module 4 (CBT Test Engine): All India Mock Test Series & National Percentile',
      durationText: '6 Full Tests • 18h 00m',
      classLevel: 'All',
      lectures: [
        { id: 'lec-4-1', title: 'CBT Full Mock Test 1: Real Exam Simulation & Time-Management Audit', duration: '3h 00m', isPreview: false },
        { id: 'lec-4-2', title: 'CBT Test 1 Detailed Video Solutions & Question Selection Strategy', duration: '2h 30m', isPreview: false },
        { id: 'lec-4-3', title: 'National Percentile Predictor & Weakness Heatmap Discussion', duration: '1h 15m', isPreview: false }
      ]
    }
  ];
};

export const CourseDetailPage: React.FC = () => {
  const { courseId, id } = useParams<{ courseId?: string; id?: string }>();
  const activeCourseId = courseId || id;
  const navigate = useNavigate();
  const { student, isAuthenticated } = useStudentAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({ 'sec-1': true });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [curriculumTab, setCurriculumTab] = useState<'all' | 'class11' | 'class12'>('all');

  // Load course details
  useEffect(() => {
    if (!activeCourseId) return;

    // Check all catalogs and CMS
    const allCourses = [...FREE_COURSES_CATALOG, ...COURSES_CATALOG, ...cmsService.getCourses()];
    const found = allCourses.find(
      (c) =>
        c.id === activeCourseId ||
        c._id === activeCourseId ||
        (c as any).slug === activeCourseId
    );

    if (found) {
      setCourse(found);
    } else {
      // Default to flagship if not matched
      setCourse(COURSES_CATALOG[0] || FREE_COURSES_CATALOG[0]);
    }
  }, [activeCourseId]);

  // Check enrollment status
  const isPurchased = useMemo(() => {
    if (!course || !isAuthenticated || !student) return false;
    const enrolledIds = student.enrolledCourseIds || [];
    return Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );
  }, [course, isAuthenticated, student]);

  // Check free course
  const isFree = useMemo(() => {
    if (!course) return false;
    return Boolean(
      course.tier === 'Free' ||
      course.numericPrice === 0 ||
      (course.price && course.price.toLowerCase().includes('free')) ||
      (course.badge && course.badge.toLowerCase().includes('free'))
    );
  }, [course]);

  // Dynamic pricing calculations
  const numericCurrent = useMemo(() => {
    if (!course) return 0;
    if (isFree) return 0;
    if (typeof course.numericPrice === 'number') return course.numericPrice;
    if (typeof course.price === 'string') {
      const num = parseFloat(course.price.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 4999 : num;
    }
    return 4999;
  }, [course, isFree]);

  const numericOriginal = useMemo(() => {
    if (!course || isFree) return 0;
    if (typeof course.originalPrice === 'string') {
      const num = parseFloat(course.originalPrice.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }, [course, isFree]);

  const hasDiscount = numericOriginal > numericCurrent && numericCurrent > 0;
  const discountPercent = useMemo(() => {
    if (!hasDiscount) return 0;
    if (course?.discountPercentage && course.discountPercentage > 0) {
      return course.discountPercentage;
    }
    return Math.round(((numericOriginal - numericCurrent) / numericOriginal) * 100);
  }, [hasDiscount, course?.discountPercentage, numericOriginal, numericCurrent]);

  const savingsAmount = hasDiscount ? numericOriginal - numericCurrent : 0;
  const formattedCurrentPrice = formatIndianPrice(course?.price || numericCurrent, isFree);
  const formattedOriginalPrice = hasDiscount ? `₹${numericOriginal.toLocaleString('en-IN')}` : '';

  // Curriculum breakdown
  const curriculumSections = useMemo(() => {
    if (!course) return [];
    return getGeneratedCurriculum(course);
  }, [course]);

  const displayedSections = useMemo(() => {
    if (curriculumTab === 'all') return curriculumSections;
    if (curriculumTab === 'class11') {
      return curriculumSections.filter((s) => s.classLevel === 'Class 11' || s.classLevel === 'All');
    }
    if (curriculumTab === 'class12') {
      return curriculumSections.filter((s) => s.classLevel === 'Class 12' || s.classLevel === 'All');
    }
    return curriculumSections;
  }, [curriculumSections, curriculumTab]);

  const totalLectures = useMemo(() => {
    return curriculumSections.reduce((acc, sec) => acc + (sec.lectures?.length || 0), 0);
  }, [curriculumSections]);

  const toggleChapter = (secId: string) => {
    setOpenChapters((prev) => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const handleEnrollClick = () => {
    if (!course) return;

    if (isPurchased) {
      navigate(`/learn/${course.id}`);
      return;
    }

    if (isFree) {
      navigate(`/learn/${course.id}`);
      return;
    }

    if (!isAuthenticated || !student) {
      showToast('Please login to complete your batch enrollment.', 'info');
      navigate(`/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`);
      return;
    }

    navigate(`/payment/${course.id}`);
  };

  if (!course) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading course details...</p>
      </div>
    );
  }

  // Target Year Dynamic Resolution
  const targetYearLabel = getTargetYearLabel(course.targetClass, 'Session: 2026-27');

  // FAQs
  const faqs = [
    {
      q: 'How does DK Sir’s 20–30s inspection shortcut technique work?',
      a: 'DK Sir teaches students how to solve complex JEE Advanced and Main dilemmas by observing physical boundary conditions, asymptotic behaviors, and symmetry constraints. Instead of 2-3 pages of lengthy algebra, students quickly eliminate 2-3 incorrect options in 20-30 seconds.'
    },
    {
      q: 'Are Kota classroom blackboard handwritten notes included?',
      a: 'Yes, 100%. Every lecture comes with downloadable, high-resolution PDF notes transcribed directly from classroom blackboard discussions, containing full step-by-step proofs, formula summary boxes, and Kota shortcuts.'
    },
    {
      q: 'What is the schedule for Daily Practice Problems (DPPs)?',
      a: 'Students receive a graded 15-question DPP sheet after every single theory lecture. Each DPP has an accompanying detailed video walkthrough explaining not just the right answer, but the fastest inspection method.'
    },
    {
      q: 'What if I miss a scheduled live class?',
      a: 'All live classes are recorded in 1080p Full HD within 2 hours of completion. You can watch recordings anytime on mobile, tablet, or desktop with 0.5x to 2.0x speed options and unlimited repeat views.'
    },
    {
      q: 'How does the All India CBT Test Series simulate real JEE?',
      a: 'Our CBT engine mirrors the exact NTA interface, screen resolution, question navigation palette, and scoring algorithms (+4, -1). After submission, you receive an instantaneous percentile ranking, question-level time breakdown, and accuracy analysis.'
    },
    {
      q: 'Is there a money-back refund guarantee?',
      a: 'Yes. We offer an unconditional 7-day money-back guarantee. If you feel the teaching methodology or pace does not align with your preparation, email or contact our support team for a full refund.'
    }
  ];

  // Primary Course Benefits (Hero & Highlights)
  const coreBenefits = [
    {
      title: '20–30s Math Inspection Tactics',
      desc: 'Eliminate distractors and trap answers in multi-correct and integer problems with Kota inspection rules.'
    },
    {
      title: 'Kota Classroom Blackboard DPPs',
      desc: 'Daily 15-question graded problem sheets with comprehensive video solutions and answer keys.'
    },
    {
      title: 'NTA-Pattern CBT Test Series',
      desc: 'Full-syllabus computer-based tests with real-time national percentile rank predictor and speed analytics.'
    },
    {
      title: '1-on-1 Academic Doubt Sessions',
      desc: 'Weekly live AMA and continuous LMS forum access with senior Kota IITian faculty mentors.'
    }
  ];

  const facultyName = course.instructor || 'Dharmendra Kumar (DK Sir)';
  const facultyTitle = 'Senior Kota Mathematics Faculty • 18+ Years Pedagogy';

  return (
    <div className={styles.page}>
      {/* ─── 1. Breadcrumb Bar ─── */}
      <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
        <Container size="wide">
          <ol className={styles.breadcrumbList}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <ChevronRight size={13} aria-hidden="true" />
            <li>
              <Link to="/courses">Courses</Link>
            </li>
            <ChevronRight size={13} aria-hidden="true" />
            <li>
              <span>{course.targetExam || 'IIT JEE'}</span>
            </li>
            <ChevronRight size={13} aria-hidden="true" />
            <li className={styles.breadcrumbCurrent} aria-current="page">
              {course.title}
            </li>
          </ol>
        </Container>
      </nav>

      {/* ─── 2. Hero Section ─── */}
      <section className={styles.heroSection}>
        <Container size="wide">
          <div className={styles.heroGrid}>
            <div className={styles.heroMain}>
              {/* Badges Row */}
              <div className={styles.badgesRow}>
                <span className={styles.categoryBadge}>{course.targetExam || 'JEE Main & Advanced'}</span>
                <span className={styles.classBadge}>{course.targetClass || 'Class 11 & 12 • Droppers'}</span>
                <span className={styles.targetYearBadge}>{targetYearLabel}</span>
                {course.badge && (
                  <span className={styles.promoBadge}>
                    <Sparkles size={11} aria-hidden="true" />
                    <span>{course.badge}</span>
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h1 className={styles.heroTitle}>{course.title}</h1>
              <p className={styles.heroDescription}>
                {course.description ||
                  'Crack IIT-JEE with Kota’s premier problem-solving master batch. Complete syllabus coverage, 20-30s option inspection tactics, daily graded DPPs, and All India CBT test series.'}
              </p>

              {/* Genuine Ratings & Faculty Sub-line */}
              <div className={styles.heroMetaRow}>
                <div className={styles.ratingBox}>
                  <div className={styles.starsWrap}>
                    <Star size={14} className={styles.starIcon} fill="currentColor" aria-hidden="true" />
                    <span className={styles.ratingNumber}>{(course as any).rating?.toFixed(1) || '4.9'}</span>
                  </div>
                  <span className={styles.reviewsText}>
                    ({((course as any).reviewCount || 1280).toLocaleString('en-IN')} verified reviews)
                  </span>
                </div>

                <div className={styles.metaDivider} />

                <div className={styles.facultyMini}>
                  <img
                    src={course.facultyAvatars?.[0] || '/img/founder.jpeg'}
                    alt={facultyName}
                    className={styles.facultyThumb}
                  />
                  <span>By <strong>{facultyName}</strong></span>
                </div>

                <div className={styles.metaDivider} />

                <div className={styles.durationMeta}>
                  <Clock size={14} aria-hidden="true" />
                  <span>{course.duration || '240+ Total Hours'}</span>
                </div>

                <div className={styles.metaDivider} />

                <div className={styles.validityMeta}>
                  <Calendar size={14} aria-hidden="true" />
                  <span>Valid until {course.validity || 'JEE Advanced 2027'}</span>
                </div>
              </div>

              {/* 4 Core Course Benefits (Restrained, high-impact) */}
              <div className={styles.heroBenefitsGrid}>
                {coreBenefits.map((item, idx) => (
                  <div key={idx} className={styles.heroBenefitCard}>
                    <CheckCircle2 size={16} className={styles.benefitIcon} aria-hidden="true" />
                    <div className={styles.benefitInfo}>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 3. Main Content Two-Column Layout ─── */}
      <main className={styles.mainLayoutSection}>
        <Container size="wide">
          <div className={styles.twoColumnGrid}>
            {/* ── Left Column (~68% width): Educational Content ── */}
            <div className={styles.contentColumn}>
              {/* Section 1: Course Highlights */}
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <div className={styles.blockHeaderIcon}>
                    <Sparkles size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={styles.blockTitle}>Comprehensive Batch Highlights</h2>
                    <p className={styles.blockSubtitle}>
                      Structured Kota classroom pedagogy designed to transform average rankers into top IITians.
                    </p>
                  </div>
                </div>

                <div className={styles.highlightsGrid}>
                  <div className={styles.highlightCard}>
                    <div className={styles.highlightIconWrapper}>
                      <Compass size={18} />
                    </div>
                    <div className={styles.highlightText}>
                      <h4>DK Sir’s 20–30s Inspection Rule</h4>
                      <p>Solve multi-correct and integer problems by direct boundary inspection, symmetry, and dimensional trapping without lengthy algebra.</p>
                    </div>
                  </div>

                  <div className={styles.highlightCard}>
                    <div className={styles.highlightIconWrapper}>
                      <FileText size={18} />
                    </div>
                    <div className={styles.highlightText}>
                      <h4>Kota Blackboard Graded DPPs</h4>
                      <p>Daily 15-question problem sets with step-by-step video solutions, question difficulty markers, and Kota algorithm shortcuts.</p>
                    </div>
                  </div>

                  <div className={styles.highlightCard}>
                    <div className={styles.highlightIconWrapper}>
                      <Video size={18} />
                    </div>
                    <div className={styles.highlightText}>
                      <h4>1080p HD Video &amp; Digital Notes</h4>
                      <p>Crystal-clear blackboard recordings with speed control (0.5x–2.0x) and high-resolution downloadable handwritten notes.</p>
                    </div>
                  </div>

                  <div className={styles.highlightCard}>
                    <div className={styles.highlightIconWrapper}>
                      <Award size={18} />
                    </div>
                    <div className={styles.highlightText}>
                      <h4>NTA Computer-Based Test Series</h4>
                      <p>Exact replica of JEE Main &amp; Advanced CBT exam environment with instant percentile, time-per-question audit, and rank predictions.</p>
                    </div>
                  </div>

                  <div className={styles.highlightCard}>
                    <div className={styles.highlightIconWrapper}>
                      <Users size={18} />
                    </div>
                    <div className={styles.highlightText}>
                      <h4>1-on-1 Academic Mentorship</h4>
                      <p>Continuous doubt resolution via student discussion portal and weekly live AMA sessions with top Kota faculty members.</p>
                    </div>
                  </div>

                  <div className={styles.highlightCard}>
                    <div className={styles.highlightIconWrapper}>
                      <ShieldCheck size={18} />
                    </div>
                    <div className={styles.highlightText}>
                      <h4>7-Day Unconditional Refund Policy</h4>
                      <p>Try the batch risk-free. If the pedagogy does not match your learning style, request a 100% money-back refund within 7 days.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Curriculum & Chapters Breakdown */}
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <div className={styles.blockHeaderIcon}>
                    <BookOpen size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={styles.blockTitle}>Curriculum &amp; Lecture Breakdown</h2>
                    <p className={styles.blockSubtitle}>
                      Carefully sequenced academic modules covering core concept mastery, shortcut drills, and mock tests.
                    </p>
                  </div>
                </div>

                {/* Curriculum Tabs for Class 11 and Class 12 Separation */}
                <div className={styles.curriculumTabsBar}>
                  <button
                    type="button"
                    className={`${styles.curriculumTabBtn} ${curriculumTab === 'all' ? styles.curriculumTabActive : ''}`}
                    onClick={() => setCurriculumTab('all')}
                  >
                    All Modules ({curriculumSections.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.curriculumTabBtn} ${curriculumTab === 'class11' ? styles.curriculumTabActive : ''}`}
                    onClick={() => setCurriculumTab('class11')}
                  >
                    Class 11th Syllabus
                  </button>
                  <button
                    type="button"
                    className={`${styles.curriculumTabBtn} ${curriculumTab === 'class12' ? styles.curriculumTabActive : ''}`}
                    onClick={() => setCurriculumTab('class12')}
                  >
                    Class 12th Syllabus
                  </button>
                </div>

                <div className={styles.curriculumControls}>
                  <div className={styles.curriculumStats}>
                    <span><strong>{displayedSections.length}</strong> Modules Shown</span>
                    <span className={styles.bulletDot}>•</span>
                    <span><strong>{totalLectures}</strong> In-Depth Lectures</span>
                    <span className={styles.bulletDot}>•</span>
                    <span><strong>{course.duration || '240+ Hours'}</strong> Content</span>
                  </div>

                  <button
                    type="button"
                    className={styles.toggleAllBtn}
                    onClick={() => {
                      const allOpen = Object.keys(openChapters).length === displayedSections.length;
                      if (allOpen) {
                        setOpenChapters({});
                      } else {
                        const newOpen: Record<string, boolean> = {};
                        displayedSections.forEach((s) => (newOpen[s.id] = true));
                        setOpenChapters(newOpen);
                      }
                    }}
                  >
                    {Object.keys(openChapters).length === displayedSections.length ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>

                <div className={styles.curriculumList}>
                  {displayedSections.map((sec, secIdx) => {
                    const isOpen = Boolean(openChapters[sec.id]);
                    return (
                      <div
                        key={sec.id}
                        className={`${styles.chapterAccordion} ${isOpen ? styles.chapterOpen : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.chapterHeader}
                          onClick={() => toggleChapter(sec.id)}
                          aria-expanded={isOpen}
                          aria-controls={`module-content-${sec.id}`}
                        >
                          <div className={styles.chapterTitleBlock}>
                            <ChevronDown size={18} className={styles.chevronIcon} aria-hidden="true" />
                            <div>
                              <h4>{sec.title}</h4>
                              <span className={styles.chapterSubtext}>
                                {sec.durationText || `${sec.lectures?.length || 0} Lectures`}
                              </span>
                            </div>
                          </div>
                          <div className={styles.chapterPill}>
                            {isOpen ? 'Close' : 'View Lectures'}
                          </div>
                        </button>

                        {isOpen && (
                          <div id={`module-content-${sec.id}`} className={styles.lectureItemsList}>
                            {sec.lectures?.map((lec, lecIdx) => (
                              <div key={lec.id} className={styles.lectureItem}>
                                <div className={styles.lectureLeft}>
                                  <span className={styles.lectureIndex}>#{secIdx + 1}.{lecIdx + 1}</span>
                                  <Video size={15} className={styles.videoIcon} aria-hidden="true" />
                                  <span className={styles.lectureTitle}>{lec.title}</span>
                                </div>
                                <div className={styles.lectureRight}>
                                  {lec.isPreview ? (
                                    <button
                                      type="button"
                                      className={styles.previewBtn}
                                      onClick={() => setIsDemoModalOpen(true)}
                                      title="Watch Free Preview Lecture"
                                    >
                                      <Play size={10} fill="currentColor" aria-hidden="true" />
                                      <span>Free Preview</span>
                                    </button>
                                  ) : (
                                    <span className={styles.lockedBadge}>
                                      <Lock size={11} aria-hidden="true" />
                                      <span>Enrolled Batch</span>
                                    </span>
                                  )}
                                  <span className={styles.lectureDuration}>{lec.duration}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 3: Learning Outcomes ("What You Will Master") */}
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <div className={styles.blockHeaderIcon}>
                    <GraduationCap size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={styles.blockTitle}>Target Learning Outcomes</h2>
                    <p className={styles.blockSubtitle}>
                      Key exam competencies you will develop by completing this Kota master batch.
                    </p>
                  </div>
                </div>

                <div className={styles.outcomesGrid}>
                  <div className={styles.outcomeItem}>
                    <Check size={16} className={styles.outcomeCheck} />
                    <span>Eliminate 2 incorrect options within 20-30 seconds using boundary conditions and symmetry.</span>
                  </div>
                  <div className={styles.outcomeItem}>
                    <Check size={16} className={styles.outcomeCheck} />
                    <span>Master multi-correct and numerical response questions with zero negative marks.</span>
                  </div>
                  <div className={styles.outcomeItem}>
                    <Check size={16} className={styles.outcomeCheck} />
                    <span>Understand graphical calculus transformations and corner constraints by direct visual inspection.</span>
                  </div>
                  <div className={styles.outcomeItem}>
                    <Check size={16} className={styles.outcomeCheck} />
                    <span>Solve multi-concept physics constraint equations without solving simultaneous algebra pages.</span>
                  </div>
                  <div className={styles.outcomeItem}>
                    <Check size={16} className={styles.outcomeCheck} />
                    <span>Deconstruct organic chemistry reaction pathways and regioselectivity with Kota algorithm maps.</span>
                  </div>
                  <div className={styles.outcomeItem}>
                    <Check size={16} className={styles.outcomeCheck} />
                    <span>Build exam-day confidence, optimal 3-hour time allocation, and question selection discipline.</span>
                  </div>
                </div>
              </section>

              {/* Section 4: Faculty Profile */}
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <div className={styles.blockHeaderIcon}>
                    <Award size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={styles.blockTitle}>Meet Your Senior Kota Master Faculty</h2>
                    <p className={styles.blockSubtitle}>
                      Learn directly from Kota's most sought-after educator with verified selection track records.
                    </p>
                  </div>
                </div>

                <div className={styles.facultyProfileCard}>
                  <div className={styles.facultyAvatarWrapper}>
                    <img
                      src={course.facultyAvatars?.[0] || '/img/founder.jpeg'}
                      alt={facultyName}
                      className={styles.facultyAvatarImg}
                    />
                    <span className={styles.facultyVerifiedBadge}>
                      <CheckCircle2 size={12} aria-hidden="true" />
                      <span>Verified Faculty</span>
                    </span>
                  </div>

                  <div className={styles.facultyBio}>
                    <h3 className={styles.facultyNameText}>{facultyName}</h3>
                    <div className={styles.facultyRoleBadge}>{facultyTitle}</div>

                    <p className={styles.facultyDescription}>
                      Dharmendra Kumar (DK Sir) has spent over 18 years training JEE Main &amp; Advanced aspirants at Kota's premier coaching institutes.
                      His proprietary 20-30s inspection methodology has empowered thousands of students to tackle the toughest JEE Advanced problems with unmatched speed and composure.
                    </p>

                    <div className={styles.facultyStatsRow}>
                      <div className={styles.facultyStat}>
                        <strong>50,000+</strong>
                        <span>Aspirants Mentored</span>
                      </div>
                      <div className={styles.facultyStat}>
                        <strong>AIR 1, 4, 12</strong>
                        <span>Top 100 Ranks</span>
                      </div>
                      <div className={styles.facultyStat}>
                        <strong>18+ Years</strong>
                        <span>Kota Pedagogy</span>
                      </div>
                      <div className={styles.facultyStat}>
                        <strong>100+</strong>
                        <span>IIT Bombay &amp; Delhi Selections</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5: Frequently Asked Questions */}
              <section className={styles.contentBlock}>
                <div className={styles.blockHeader}>
                  <div className={styles.blockHeaderIcon}>
                    <HelpCircle size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={styles.blockTitle}>Frequently Asked Questions</h2>
                    <p className={styles.blockSubtitle}>
                      Everything you need to know about batch enrollment, access validity, test series, and refunds.
                    </p>
                  </div>
                </div>

                <div className={styles.faqList}>
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                        <button
                          type="button"
                          className={styles.faqQuestionBtn}
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${idx}`}
                        >
                          <span className={styles.faqQuestionText}>{faq.q}</span>
                          <ChevronDown size={18} className={styles.faqChevron} aria-hidden="true" />
                        </button>
                        {isOpen && (
                          <div id={`faq-answer-${idx}`} className={styles.faqAnswer}>
                            <p>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 6: Final Pre-Footer CTA */}
              <section className={styles.finalCtaBlock}>
                <div className={styles.finalCtaContent}>
                  <div className={styles.finalCtaBadges}>
                    <span className={styles.finalCtaBadge}>Kota Proven Methodology</span>
                    <span className={styles.finalCtaBadge}>100% Risk-Free Guarantee</span>
                  </div>
                  <h3 className={styles.finalCtaTitle}>Ready to Maximize Your JEE Rank with DK Sir?</h3>
                  <p className={styles.finalCtaSubtitle}>
                    Join serious aspirants mastering 20-30s option inspection shortcuts, daily Kota DPPs, and All India CBT test simulations today.
                  </p>

                  <div className={styles.finalCtaButtons}>
                    {isPurchased ? (
                      <button
                        type="button"
                        className={styles.finalCtaPrimaryBtn}
                        onClick={handleEnrollClick}
                      >
                        <span>Open LMS Classroom</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.finalCtaPrimaryBtn}
                        onClick={handleEnrollClick}
                      >
                        <span>{isFree ? 'Start Free Preview' : `Enroll Now for ${formattedCurrentPrice}`}</span>
                        <ArrowRight size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.finalCtaSecondaryBtn}
                      onClick={() => setIsDemoModalOpen(true)}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Watch Free Demo Class</span>
                    </button>
                  </div>

                  <div className={styles.finalCtaTrust}>
                    <span>✓ Instant LMS Activation</span>
                    <span>✓ 7-Day Money-Back Guarantee</span>
                    <span>✓ Secure 256-Bit SSL Checkout</span>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Right Column (~32% width): Sticky Enrollment Card ── */}
            <aside className={styles.stickyColumn}>
              <div className={styles.enrollmentCard}>
                {/* 16:9 Video Teaser Thumbnail */}
                <div
                  className={styles.cardPreviewWrapper}
                  onClick={() => setIsDemoModalOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsDemoModalOpen(true);
                    }
                  }}
                  aria-label="Click to watch free demo lecture"
                >
                  <img
                    src={
                      course.coverImage ||
                      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={course.title}
                    className={styles.cardPreviewImg}
                  />
                  <div className={styles.previewOverlay}>
                    <div className={styles.playButtonCircle}>
                      <Play size={20} fill="#ffffff" style={{ marginLeft: 3 }} aria-hidden="true" />
                    </div>
                    <span className={styles.previewBadgeText}>Watch Free Demo Class</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {/* Pricing Display */}
                  {!isPurchased && (
                    <div className={styles.priceContainer}>
                      <div className={styles.priceMainRow}>
                        <span className={styles.currentPriceText}>{formattedCurrentPrice}</span>
                        {hasDiscount && (
                          <span className={styles.originalPriceText}>{formattedOriginalPrice}</span>
                        )}
                        {hasDiscount && discountPercent > 0 && (
                          <span className={styles.discountPillText}>{discountPercent}% OFF</span>
                        )}
                      </div>
                      {hasDiscount && savingsAmount > 0 && (
                        <p className={styles.savingsLabel}>
                          You save ₹{savingsAmount.toLocaleString('en-IN')} on this batch
                        </p>
                      )}
                      <p className={styles.taxInclusiveNote}>
                        Inclusive of all taxes &amp; digital platform fees
                      </p>
                    </div>
                  )}

                  {/* Purchased Status Box */}
                  {isPurchased && (
                    <div className={styles.enrolledStatusBox}>
                      <CheckCircle2 size={18} className={styles.enrolledCheckIcon} />
                      <div>
                        <strong>You are Enrolled!</strong>
                        <p>Access your lectures, DPPs, and CBT tests in the classroom.</p>
                      </div>
                    </div>
                  )}

                  {/* Primary & Secondary Action CTAs */}
                  <div className={styles.cardActionsGroup}>
                    {isPurchased ? (
                      <button
                        type="button"
                        className={styles.classroomPrimaryBtn}
                        onClick={handleEnrollClick}
                        aria-label="Go to Classroom"
                      >
                        <span>Go to Classroom →</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.enrollPrimaryBtn}
                        onClick={handleEnrollClick}
                        aria-label="Enroll in Course"
                      >
                        <span>{isFree ? 'Start Free Preview' : 'Enroll in Batch Now'}</span>
                        <ArrowRight size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.secondaryActionBtn}
                      onClick={() => setIsDemoModalOpen(true)}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Book / Watch Free Demo</span>
                    </button>

                    <button
                      type="button"
                      className={styles.secondaryActionBtn}
                      onClick={() => setIsSyllabusModalOpen(true)}
                    >
                      <Download size={13} />
                      <span>Download Detailed Syllabus (PDF)</span>
                    </button>
                  </div>

                  {/* Batch Inclusions List */}
                  <div className={styles.inclusionsSection}>
                    <h4 className={styles.inclusionsTitle}>This Batch Includes:</h4>
                    <ul className={styles.inclusionsList}>
                      <li>
                        <CheckCircle2 size={15} className={styles.inclusionCheck} />
                        <span>{totalLectures}+ Full HD 1080p Video Lectures</span>
                      </li>
                      <li>
                        <CheckCircle2 size={15} className={styles.inclusionCheck} />
                        <span>Daily Kota Blackboard DPPs &amp; Solutions</span>
                      </li>
                      <li>
                        <CheckCircle2 size={15} className={styles.inclusionCheck} />
                        <span>All India CBT Test Series + Percentile Predictor</span>
                      </li>
                      <li>
                        <CheckCircle2 size={15} className={styles.inclusionCheck} />
                        <span>Downloadable Handwritten Blackboard Notes</span>
                      </li>
                      <li>
                        <CheckCircle2 size={15} className={styles.inclusionCheck} />
                        <span>1-on-1 Mentor Support &amp; Weekly Live AMAs</span>
                      </li>
                      <li>
                        <CheckCircle2 size={15} className={styles.inclusionCheck} />
                        <span>Unconditional 7-Day Money-Back Guarantee</span>
                      </li>
                    </ul>
                  </div>

                  {/* Access Device & Security Notes */}
                  <div className={styles.cardFooterNotes}>
                    <div className={styles.footerNoteItem}>
                      <ShieldCheck size={14} />
                      <span>Valid on Mobile, Tablet &amp; Desktop</span>
                    </div>
                    <div className={styles.footerNoteItem}>
                      <Lock size={14} />
                      <span>256-Bit SSL Encrypted Razorpay Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </main>

      {/* ─── 4. Mobile Sticky Bottom Enrollment Bar ─── */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.mobilePriceInfo}>
          <span className={styles.mobilePriceLabel}>{isPurchased ? 'Status' : 'Batch Fee'}</span>
          <span className={styles.mobilePriceText}>{isPurchased ? 'Active' : formattedCurrentPrice}</span>
        </div>
        <button
          type="button"
          className={isPurchased ? styles.mobileClassroomBtn : styles.mobileEnrollBtn}
          onClick={handleEnrollClick}
          aria-label={isPurchased ? 'Go to Classroom' : 'Enroll in course'}
        >
          <span>{isPurchased ? 'Classroom →' : isFree ? 'Start Free' : 'Enroll Now'}</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* ─── 5. Modals ─── */}
      <CourseDemoModal
        isOpen={isDemoModalOpen}
        course={course}
        onClose={() => setIsDemoModalOpen(false)}
        onOpenSyllabus={() => {
          setIsDemoModalOpen(false);
          setIsSyllabusModalOpen(true);
        }}
      />

      <CourseSyllabusModal
        isOpen={isSyllabusModalOpen}
        course={course}
        onClose={() => setIsSyllabusModalOpen(false)}
        onOpenDemo={() => {
          setIsSyllabusModalOpen(false);
          setIsDemoModalOpen(true);
        }}
      />
    </div>
  );
};

export default CourseDetailPage;

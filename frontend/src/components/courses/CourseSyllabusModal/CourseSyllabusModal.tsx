import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Video,
  FileCheck,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Play,
  GraduationCap
} from 'lucide-react';
import type { Course } from '../../../types';
import { useStudentAuth } from '../../../context/AuthContext';
import styles from './CourseSyllabusModal.module.scss';

interface CourseSyllabusModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDemo?: (course: Course) => void;
}

interface ChapterItem {
  chapter: string;
  lectures: number;
  duration: string;
  subtopics: string[];
  dpp: string;
  kotaAlgorithm: string;
  isDemo: boolean;
}

const SYLLABUS_ROADMAP: Record<'maths' | 'physics' | 'chemistry', ChapterItem[]> = {
  maths: [
    {
      chapter: 'Differential Calculus & Limits',
      lectures: 14,
      duration: '22 Hours',
      subtopics: [
        'Limits of indeterminate forms (0/0, ∞/∞, 1^∞)',
        'Continuity & boundary cusp analysis',
        'Differentiability & tangent slopes',
        'Rolle & Mean Value Theorems',
        'Maxima & Minima optimization'
      ],
      dpp: '14 DPP Sets (140 Problems)',
      kotaAlgorithm: '20s Inspection Rule for L’Hôpital bypass & standard series expansion matching without lengthy algebra.',
      isDemo: true
    },
    {
      chapter: 'Integral Calculus & Differential Equations',
      lectures: 18,
      duration: '28 Hours',
      subtopics: [
        'Indefinite integrals & substitution shortcuts',
        'King & Queen properties of definite integrals',
        'Leibniz differentiation under integral sign',
        'Area under standard & reciprocal curves',
        'Linear differential equations (Integrating Factor method)'
      ],
      dpp: '18 DPP Sets (180 Problems)',
      kotaAlgorithm: 'Definite symmetry folding algorithm (King’s Rule in 2 lines) and bounding curves root-inspection.',
      isDemo: false
    },
    {
      chapter: 'Coordinate Geometry & Conic Sections',
      lectures: 16,
      duration: '25 Hours',
      subtopics: [
        'Pair of straight lines & angle bisectors',
        'Circles: orthogonal families & radical axis',
        'Parabola focal chords & reflection laws',
        'Ellipse & Hyperbola eccentricity invariants',
        'Common tangents to conics'
      ],
      dpp: '16 DPP Sets (160 Problems)',
      kotaAlgorithm: 'T=0 and S1=T² parameter replacement for instant common tangent equations.',
      isDemo: false
    },
    {
      chapter: 'Vectors & 3D Geometry Projections',
      lectures: 12,
      duration: '18 Hours',
      subtopics: [
        'Dot & Cross products geometrical interpretation',
        'Scalar & Vector triple products',
        'Shortest distance between skew lines',
        'Plane & line intersection conditions',
        'Coplanarity determinants'
      ],
      dpp: '12 DPP Sets (120 Problems)',
      kotaAlgorithm: 'Shortest distance vector projection formula without formulating 3-variable equations.',
      isDemo: false
    },
    {
      chapter: 'Algebra, Complex Numbers & Probability',
      lectures: 22,
      duration: '34 Hours',
      subtopics: [
        'Complex geometry & rotation formula (Euler form)',
        'Quadratic equation location of roots',
        'Matrices & Determinants adjoint shortcuts',
        'Permutation & Combination distribution principles',
        'Bayes’ theorem conditional probability tree'
      ],
      dpp: '22 DPP Sets (220 Problems)',
      kotaAlgorithm: 'Complex vector rotation method and 30-second root placement inequality bounds.',
      isDemo: false
    }
  ],
  physics: [
    {
      chapter: 'Kinematics & Classical Mechanics',
      lectures: 16,
      duration: '24 Hours',
      subtopics: [
        '1D & 2D motion with variable acceleration',
        'Relative velocity in 2D (Rain-man & River-boat)',
        'Constraint relations in pulley systems',
        'Pseudo force & non-inertial reference frames',
        'Work-Energy theorem with conservative forces'
      ],
      dpp: '16 DPP Sets (160 Problems)',
      kotaAlgorithm: 'Virtual work method on multi-pulley systems to solve tension & accelerations in under 25 seconds.',
      isDemo: true
    },
    {
      chapter: 'Rotational Motion & Rigid Body Dynamics',
      lectures: 12,
      duration: '20 Hours',
      subtopics: [
        'Moment of inertia integration & parallel/perpendicular axes',
        'Torque & Angular momentum conservation',
        'Pure rolling on rough incline & friction direction',
        'Toppling vs slipping criteria',
        'Instantaneous center of zero velocity (ICR)'
      ],
      dpp: '12 DPP Sets (120 Problems)',
      kotaAlgorithm: 'Instantaneous Center of Rotation (ICOR) method for velocity & acceleration analysis of rolling bodies.',
      isDemo: false
    },
    {
      chapter: 'Electrodynamics & Magnetism',
      lectures: 20,
      duration: '32 Hours',
      subtopics: [
        'Gauss’s law for symmetric charge distributions',
        'Electrostatic potential & conductor cavities',
        'Capacitors with dielectric slabs & circuit charging',
        'Biot-Savart law & Ampere’s circuital law',
        'Faraday’s law of induction & motional EMF'
      ],
      dpp: '20 DPP Sets (200 Problems)',
      kotaAlgorithm: 'Equivalent capacitance & nodal potential shortcut without setting up full Kirchhoff mesh equations.',
      isDemo: false
    },
    {
      chapter: 'Optics, Wave Mechanics & Sound',
      lectures: 14,
      duration: '22 Hours',
      subtopics: [
        'Refraction at spherical surfaces & thin lenses',
        'Prisms: minimum deviation & dispersion',
        'Young’s double slit experiment (YDSE) with tilted slits',
        'Doppler effect in sound with moving sources & wind',
        'Standing waves in open & closed organ pipes'
      ],
      dpp: '14 DPP Sets (140 Problems)',
      kotaAlgorithm: 'Optical path difference shortcut for multi-layer dielectric slabs in YDSE fringe shifts.',
      isDemo: false
    },
    {
      chapter: 'Modern Physics & Thermodynamics',
      lectures: 14,
      duration: '21 Hours',
      subtopics: [
        'Photoelectric effect & stopping potential graphs',
        'Bohr hydrogen model & de Broglie matter waves',
        'Nuclear binding energy & radioactive decay kinetics',
        'First & second laws of thermodynamics (PV indicator diagrams)',
        'Heat engines & Carnot cycle efficiency'
      ],
      dpp: '14 DPP Sets (140 Problems)',
      kotaAlgorithm: 'PV diagram cyclical work evaluation using geometric area invariants in 15 seconds.',
      isDemo: false
    }
  ],
  chemistry: [
    {
      chapter: 'General Organic Chemistry (GOC) & Mechanisms',
      lectures: 15,
      duration: '24 Hours',
      subtopics: [
        'Inductive, resonance, hyperconjugation & aromaticity',
        'Acidic & basic strength comparison orders',
        'Carbocation & carbanion stability rules',
        'SN1 vs SN2 reaction pathways & stereochemistry',
        'E1 vs E2 elimination & Saytzeff vs Hofmann products'
      ],
      dpp: '15 DPP Sets (150 Problems)',
      kotaAlgorithm: 'Aromaticity (4n+2 rule) & stability ordering matrix without drawing full resonance hybrids.',
      isDemo: true
    },
    {
      chapter: 'Reaction Mechanisms & Named Reactions',
      lectures: 18,
      duration: '28 Hours',
      subtopics: [
        'Electrophilic aromatic substitution (Nitration, Friedel-Crafts)',
        'Aldol, Cannizzaro & Perkin condensation reactions',
        'Grignard reagent addition to carbonyls & esters',
        'Diazonium salt reactions & azo dye coupling',
        'Multi-step organic synthesis roadmaps'
      ],
      dpp: '18 DPP Sets (180 Problems)',
      kotaAlgorithm: 'Carbonyl alpha-hydrogen reactivity tree for immediate product deduction in crossed Aldol.',
      isDemo: false
    },
    {
      chapter: 'Physical Chemistry & Chemical Kinetics',
      lectures: 16,
      duration: '25 Hours',
      subtopics: [
        'Mole concept & redox titrations (n-factor calculations)',
        'Thermodynamics: enthalpy, entropy & Gibbs free energy',
        'Chemical & ionic equilibrium (pH of buffer mixtures & solubility product)',
        'Electrochemistry: Nernst equation & Faraday laws',
        'Chemical kinetics: integrated rate laws & Arrhenius equation'
      ],
      dpp: '16 DPP Sets (160 Problems)',
      kotaAlgorithm: 'Equivalent concept shortcut for n-factor calculations in multi-element redox balancing.',
      isDemo: false
    },
    {
      chapter: 'Inorganic Chemistry & Coordination Compounds',
      lectures: 14,
      duration: '22 Hours',
      subtopics: [
        'Periodic trends & effective nuclear charge',
        'Chemical bonding: VSEPR, hybridization & MOT',
        'Coordination compounds: IUPAC nomenclature & Werner theory',
        'Crystal Field Theory (CFT) high/low spin complexes',
        'Qualitative salt analysis (cation & anion detection)'
      ],
      dpp: '14 DPP Sets (140 Problems)',
      kotaAlgorithm: 'Molecular Orbital Theory (MOT) bond order & magnetism 14-electron benchmark rule.',
      isDemo: false
    }
  ]
};

export const CourseSyllabusModal: React.FC<CourseSyllabusModalProps> = ({
  course,
  isOpen,
  onClose,
  onOpenDemo
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'maths' | 'physics' | 'chemistry'>('maths');
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({
    'maths-0': true,
    'physics-0': true,
    'chemistry-0': true
  });

  const { student, isAuthenticated } = useStudentAuth();

  const isPurchased = React.useMemo(() => {
    if (!course || typeof window === 'undefined') return false;
    if (!isAuthenticated || !student) return false;
    const enrolledIds = student?.enrolledCourseIds || [];
    return Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );
  }, [course, isAuthenticated, student?.enrolledCourseIds]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !course) return null;

  const toggleAccordion = (index: number) => {
    const key = `${activeTab}-${index}`;
    setExpandedIndices(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEnrollNow = () => {
    onClose();
    if (!isAuthenticated || !student) {
      navigate(`/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`);
      return;
    }
    if (isPurchased) {
      navigate(`/learn/${course.id}`);
    } else {
      navigate(`/payment/${course.id}`);
    }
  };

  const handleDownloadSyllabus = () => {
    const content = `DK ACADEMY JEE — OFFICIAL ACADEMIC SYLLABUS & CURRICULUM BREAKDOWN
Course: ${course.title}
Target Exam: ${course.targetExam} (${course.targetClass || 'Class 11/12'})
Batch Validity: Complete Academic Session (2026-28)
Official Accreditation: Aligned with NTA & IIT JEE Advanced Standards

============================================================
1. MATHEMATICS CURRICULUM (5 Chapters • 120 Hours)
============================================================
${SYLLABUS_ROADMAP.maths
  .map(
    (m, i) => `Chapter 0${i + 1}: ${m.chapter}
Duration: ${m.duration} | Lectures: ${m.lectures} | DPPs: ${m.dpp}
Core Topics:
  ${m.subtopics.map(t => `- ${t}`).join('\n  ')}
DK Sir Kota Algorithm:
  ${m.kotaAlgorithm}
Access: ${m.isDemo ? 'FREE DEMO UNLOCKED' : 'FULL BATCH ACCESS'}
`
  )
  .join('\n------------------------------------------------------------\n')}

============================================================
2. PHYSICS CURRICULUM (5 Chapters • 115 Hours)
============================================================
${SYLLABUS_ROADMAP.physics
  .map(
    (p, i) => `Chapter 0${i + 1}: ${p.chapter}
Duration: ${p.duration} | Lectures: ${p.lectures} | DPPs: ${p.dpp}
Core Topics:
  ${p.subtopics.map(t => `- ${t}`).join('\n  ')}
DK Sir Kota Algorithm:
  ${p.kotaAlgorithm}
Access: ${p.isDemo ? 'FREE DEMO UNLOCKED' : 'FULL BATCH ACCESS'}
`
  )
  .join('\n------------------------------------------------------------\n')}

============================================================
3. CHEMISTRY CURRICULUM (4 Chapters • 115 Hours)
============================================================
${SYLLABUS_ROADMAP.chemistry
  .map(
    (c, i) => `Chapter 0${i + 1}: ${c.chapter}
Duration: ${c.duration} | Lectures: ${c.lectures} | DPPs: ${c.dpp}
Core Topics:
  ${c.subtopics.map(t => `- ${t}`).join('\n  ')}
DK Sir Kota Algorithm:
  ${c.kotaAlgorithm}
Access: ${c.isDemo ? 'FREE DEMO UNLOCKED' : 'FULL BATCH ACCESS'}
`
  )
  .join('\n------------------------------------------------------------\n')}

============================================================
DELIVERABLES SUMMARY:
- 350+ Hours Live & Recorded Kota Pedagogy Masterclasses
- 120+ Daily Practice Problem (DPP) Sets with Video Solutions
- 40 CBT Full Mock Tests with All-India NTA Percentile Analysis
- Direct Doubt Clearing with DK Sir & Senior Kota IITian Mentors
============================================================
Website: https://dkacademy.in | Support: contact@dkacademy.in
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course.title.replace(/\s+/g, '_')}_Detailed_Syllabus.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeChapters = SYLLABUS_ROADMAP[activeTab];

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* ─── 1. FIXED MODAL HEADER & META STRIP ─── */}
        <header className={styles.modalHeader}>
          <div className={styles.headerTopRow}>
            <div className={styles.tagGroup}>
              <span className={styles.examTag}>
                {course.targetExam} • {course.targetClass || 'Class 11th'}
              </span>
              <span className={styles.ntaTag}>
                <CheckCircle2 size={13} className={styles.tagIcon} />
                Complete NTA JEE Syllabus 2026-28
              </span>
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close syllabus breakdown modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.titleBlock}>
            <h2 className={styles.modalTitle}>
              {course.title}: Detailed Academic Syllabus
            </h2>
            <p className={styles.modalSubtitle}>
              Week-by-week lecture milestones, Kota speed inspection algorithms, printed module coverage, and DPP problem sets.
            </p>
          </div>
        </header>

        {/* ─── 2. 4-COLUMN COMPACT DELIVERABLES RIBBON ─── */}
        <section className={styles.deliverablesRibbon} aria-label="Course deliverables metrics">
          <div className={styles.deliverableTile}>
            <div className={`${styles.tileIconWrap} ${styles.blueIcon}`}>
              <Video size={17} />
            </div>
            <div>
              <div className={styles.tileValue}>350+ Hours</div>
              <div className={styles.tileLabel}>Live &amp; Recorded Lectures</div>
            </div>
          </div>

          <div className={styles.deliverableTile}>
            <div className={`${styles.tileIconWrap} ${styles.emeraldIcon}`}>
              <FileCheck size={17} />
            </div>
            <div>
              <div className={styles.tileValue}>120+ DPP Sets</div>
              <div className={styles.tileLabel}>1,400+ Solved Problems</div>
            </div>
          </div>

          <div className={styles.deliverableTile}>
            <div className={`${styles.tileIconWrap} ${styles.purpleIcon}`}>
              <Target size={17} />
            </div>
            <div>
              <div className={styles.tileValue}>40 CBT Mocks</div>
              <div className={styles.tileLabel}>All-India NTA Rank Tests</div>
            </div>
          </div>

          <div className={styles.deliverableTile}>
            <div className={`${styles.tileIconWrap} ${styles.amberIcon}`}>
              <Zap size={17} />
            </div>
            <div>
              <div className={`${styles.tileValue} ${styles.highlightSpeed}`}>20-30s Speed</div>
              <div className={styles.tileLabel}>DK Sir Inspection Rules</div>
            </div>
          </div>
        </section>

        {/* ─── 3. SEGMENTED SUBJECT FILTER TABS ─── */}
        <nav className={styles.filterStrip} aria-label="Subject curriculum selector">
          <div className={styles.segmentedSwitcher} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'maths'}
              className={`${styles.segmentBtn} ${activeTab === 'maths' ? styles.segmentActive : ''}`}
              onClick={() => setActiveTab('maths')}
            >
              <span>📐 Mathematics (5 Chapters • 120 hrs)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'physics'}
              className={`${styles.segmentBtn} ${activeTab === 'physics' ? styles.segmentActive : ''}`}
              onClick={() => setActiveTab('physics')}
            >
              <span>⚡ Physics (5 Chapters • 115 hrs)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chemistry'}
              className={`${styles.segmentBtn} ${activeTab === 'chemistry' ? styles.segmentActive : ''}`}
              onClick={() => setActiveTab('chemistry')}
            >
              <span>🧪 Chemistry (4 Chapters • 115 hrs)</span>
            </button>
          </div>

          <div className={styles.roadmapStatus}>
            Showing Term 1 &amp; 2 Roadmap
          </div>
        </nav>

        {/* ─── 4. SCROLLABLE CHAPTER CURRICULUM ACCORDIONS ─── */}
        <main className={styles.curriculumBody}>
          {activeChapters.map((item, idx) => {
            const isExpanded = !!expandedIndices[`${activeTab}-${idx}`];
            const chapterIndexNumber = String(idx + 1).padStart(2, '0');

            return (
              <article
                key={idx}
                className={`${styles.chapterCard} ${isExpanded ? styles.chapterCardExpanded : ''}`}
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  className={styles.chapterHeaderTrigger}
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isExpanded}
                >
                  <div className={styles.headerLeft}>
                    <div className={styles.chapterIndexBadge}>
                      {chapterIndexNumber}
                    </div>

                    <div className={styles.chapterTitleBlock}>
                      <h3 className={styles.chapterName}>{item.chapter}</h3>
                      <div className={styles.metricsStrip}>
                        <span className={styles.metricItem}>
                          <Clock size={12} />
                          {item.duration}
                        </span>
                        <span className={styles.metricDot}>•</span>
                        <span className={styles.metricItem}>
                          <BookOpen size={12} />
                          {item.lectures} Lectures
                        </span>
                        <span className={styles.metricDot}>•</span>
                        <span className={styles.metricItem}>
                          <FileCheck size={12} />
                          {item.dpp}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.headerRight}>
                    {item.isDemo ? (
                      <span className={styles.demoUnlockedBadge}>
                        <Unlock size={12} />
                        Free Demo Unlocked
                      </span>
                    ) : (
                      <span className={styles.enrolledBadge}>
                        <Lock size={12} />
                        Batch Enrolled Only
                      </span>
                    )}

                    <div className={styles.chevronWrap}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </button>

                {/* Collapsible Accordion Body */}
                {isExpanded && (
                  <div className={styles.chapterDetailsArea}>
                    {/* Subtopics Covered */}
                    <div className={styles.subtopicsBlock}>
                      <div className={styles.subtopicsTitle}>Key Concept Milestones &amp; Derivations:</div>
                      <div className={styles.subtopicPills}>
                        {item.subtopics.map((sub, sIdx) => (
                          <div key={sIdx} className={styles.subtopicPill}>
                            <span className={styles.bulletDot} />
                            <span>{sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DK Sir Kota Algorithm Callout Box */}
                    <div className={styles.algorithmCallout}>
                      <div className={styles.algorithmHeader}>
                        <div className={styles.zapIconWrap}>
                          <Zap size={14} />
                        </div>
                        <span className={styles.algorithmTitle}>
                          DK Sir Kota Algorithm &amp; Speed Shortcut:
                        </span>
                      </div>
                      <p className={styles.algorithmText}>
                        {item.kotaAlgorithm}
                      </p>
                    </div>

                    {/* Deliverables Checklist for Chapter */}
                    <div className={styles.chapterDeliverablesRow}>
                      <div className={styles.deliverableTag}>
                        <CheckCircle2 size={13} className={styles.deliverableCheck} />
                        <span>Kota Theory Module (Ex 1 &amp; 2)</span>
                      </div>
                      <div className={styles.deliverableTag}>
                        <CheckCircle2 size={13} className={styles.deliverableCheck} />
                        <span>{item.dpp} with Hints</span>
                      </div>
                      <div className={styles.deliverableTag}>
                        <CheckCircle2 size={13} className={styles.deliverableCheck} />
                        <span>Previous 15-Yr JEE Advanced PYQs</span>
                      </div>

                      {item.isDemo && onOpenDemo && (
                        <button
                          type="button"
                          className={styles.watchMasterclassInlineBtn}
                          onClick={() => {
                            onClose();
                            onOpenDemo(course);
                          }}
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Watch Free Demo (54m)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </main>

        {/* ─── 5. FIXED HIGH-CONVERSION ALIGNED FOOTER ─── */}
        <footer className={styles.modalFooter}>
          <div className={styles.footerPricing}>
            <div className={styles.priceRow}>
              <span className={styles.priceAmount}>{course.price || '₹84,000'}</span>
              <span className={styles.priceBadge}>Academic Session</span>
            </div>
            <div className={styles.priceSubtext}>
              Inclusive of 18% GST • Printed Modules &amp; CBT Test Series Included
            </div>
          </div>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.downloadSyllabusBtn}
              onClick={handleDownloadSyllabus}
              aria-label="Download detailed syllabus breakdown"
            >
              <Download size={15} />
              <span>Download Syllabus</span>
            </button>

            {onOpenDemo && (
              <button
                type="button"
                className={styles.watchDemoBtn}
                onClick={() => {
                  onClose();
                  onOpenDemo(course);
                }}
                aria-label="Watch free demo masterclass"
              >
                <Play size={14} fill="currentColor" />
                <span>Watch Free Demo</span>
              </button>
            )}

            <button
              type="button"
              className={styles.enrollNowBtn}
              onClick={handleEnrollNow}
              aria-label={isPurchased ? "Go to Classroom" : "Enroll in full batch"}
            >
              {isPurchased ? (
                <>
                  <GraduationCap size={16} />
                  <span>Go to Classroom</span>
                  <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Enroll In Full Batch</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>,
    document.body
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Tv,
  Lock,
  Download,
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
  PhoneCall,
  CheckCircle,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import type { Course } from '../../../types';
import { DynamicWatermark } from '../../lms/DynamicWatermark/DynamicWatermark';
import styles from './CourseCurriculumLMS.module.scss';

export interface CurriculumLecture {
  id: string;
  title: string;
  duration: string;
  isPreview: boolean; // Exactly 5 lectures across the course are true
  videoUrl?: string;
  youtubeId?: string;
  description?: string;
  notesPdfUrl?: string;
  notesTitle?: string;
  dppPdfUrl?: string;
  dppTitle?: string;
  externalDocLink?: string;
  externalDocTitle?: string;
}

export interface CurriculumSection {
  id: string;
  title: string;
  lecturesCount: number;
  durationText: string;
  lectures: CurriculumLecture[];
}

interface CourseCurriculumLMSProps {
  course: Course;
  isEnrolled?: boolean;
  onOpenEnrollModal?: () => void;
}

export const CourseCurriculumLMS: React.FC<CourseCurriculumLMSProps> = ({
  course,
  isEnrolled = false,
  onOpenEnrollModal
}) => {
  // Course curriculum structured into 6 sections matching Udemy hierarchy
  // Exactly 5 lectures in total have isPreview: true (Free demo lectures)
  const isMathSpecial = course.category === 'JEE Advanced' || course.title.toLowerCase().includes('math');

  const defaultSections: CurriculumSection[] = [
    {
      id: 'sec-1',
      title: 'Section 1: Course Orientation & Foundational Framework',
      lecturesCount: 2,
      durationText: '2 lectures • 21min',
      lectures: [
        {
          id: `${course.id}-l1`,
          title: 'Course Orientation & Roadmap: Cracking Top 500 AIR with DK Sir',
          duration: '8:45',
          isPreview: true, // Free Lecture 1
          description: 'Introduction to pedagogy, syllabus pacing, time-distribution, and master formula notebook setup.'
        },
        {
          id: `${course.id}-l2`,
          title: 'Purpose of this Course & Exam Temperament Psychology',
          duration: '12:15',
          isPreview: true, // Free Lecture 2
          description: 'How to transition from standard school derivations to rapid 20-30s direct option elimination.'
        }
      ]
    },
    {
      id: 'sec-2',
      title: isMathSpecial
        ? 'Section 2: Functions, Domain, Range & Periodic Function Traps'
        : 'Section 2: Mechanics & Rotational Dynamics Fundamentals',
      lecturesCount: 4,
      durationText: '4 lectures • 1hr 42min',
      lectures: [
        {
          id: `${course.id}-l3`,
          title: isMathSpecial
            ? 'Domain, Range & Algebraic Inequalities Deconstruction'
            : 'Rotational Motion: Moment of Inertia for Composite Geometries',
          duration: '28:30',
          isPreview: true, // Free Lecture 3
          description: 'Mastering composite bodies, parallel axis theorem, and calculating moment of inertia in 30 seconds.'
        },
        {
          id: `${course.id}-l4`,
          title: isMathSpecial
            ? "DK Sir's 20-30s Graph Symmetry, Inversion & Transformation Hacks"
            : 'Torque Equilibrium, Pure Rolling & Friction Direction Traps',
          duration: '35:20',
          isPreview: true, // Free Lecture 4
          description: 'Instant option elimination via boundary checks and testing symmetry without sketching full graphs.'
        },
        {
          id: `${course.id}-l5`,
          title: isMathSpecial
            ? 'Composite Functions & Periodicity with Extreme Value Traps'
            : "Angular Momentum Conservation & Collision Mechanics",
          duration: '24:10',
          isPreview: true, // Free Lecture 5 (Last free preview lecture!)
          description: 'Systematic approach to periodicities of nested trigonometric and fractional part functions.'
        },
        {
          id: `${course.id}-l6`,
          title: isMathSpecial
            ? 'Kota DPP Discussion: Functions & Graph Transformation Graded Drills'
            : 'Kota DPP Discussion: Rolling Motion Hardcopy Problem Set',
          duration: '14:25',
          isPreview: false, // Locked Lecture 6
          description: 'Step-by-step video solution of Kota hardcopy study module questions.'
        }
      ]
    },
    {
      id: 'sec-3',
      title: isMathSpecial
        ? 'Section 3: Limits, Continuity & 20s Inspection Shortcuts'
        : 'Section 3: Electrostatics, Gauss’s Law & Dipole Dynamics',
      lecturesCount: 5,
      durationText: '5 lectures • 3hr 15min',
      lectures: [
        {
          id: `${course.id}-l7`,
          title: isMathSpecial
            ? "Indeterminate Forms: DK Sir's 20-30s L'Hopital & Series Expansion Hacks"
            : "Gauss's Law Applications & Non-Conducting Spherical Charge Distribution",
          duration: '42:50',
          isPreview: false,
          description: 'Direct substitution and expansion tricks to eliminate options without 2-page derivations.'
        },
        {
          id: `${course.id}-l8`,
          title: isMathSpecial
            ? 'Continuity on Closed Intervals & Intermediate Value Theorem'
            : 'Electric Dipole in Uniform vs Non-Uniform Electric Fields',
          duration: '38:15',
          isPreview: false,
          description: 'Discontinuity classification and tackling existence of roots without solving polynomials.'
        },
        {
          id: `${course.id}-l9`,
          title: isMathSpecial
            ? 'Differentiability: Corner Points, Modulus Traps & Mean Value Theorems'
            : 'Capacitance & Dielectric Polarisation Boundary Conditions',
          duration: '45:30',
          isPreview: false,
          description: 'Rolle’s and LMVT shortcuts with direct geometric interpretations.'
        },
        {
          id: `${course.id}-l10`,
          title: isMathSpecial
            ? 'Application of Derivatives: Tangents, Normals & Rate Measure Drills'
            : 'Electric Potential & Self-Energy Calculations for Shells',
          duration: '36:45',
          isPreview: false,
          description: 'Finding orthogonal trajectories and slope angles in under 30 seconds.'
        },
        {
          id: `${course.id}-l11`,
          title: isMathSpecial
            ? 'Previous 15-Year JEE Main & Advanced Calculus PYQ Deconstruction'
            : 'JEE Advanced Electrostatics PYQ Master Drill with Error Log',
          duration: '32:10',
          isPreview: false,
          description: 'Deconstructing tricky trap questions from 2010 to 2025.'
        }
      ]
    },
    {
      id: 'sec-4',
      title: isMathSpecial
        ? 'Section 4: Integral Calculus & King’s Property Symmetry Bounding'
        : 'Section 4: Organic Chemistry Reaction Mechanisms (SN1, SN2, E1, E2)',
      lecturesCount: 5,
      durationText: '5 lectures • 3hr 40min',
      lectures: [
        {
          id: `${course.id}-l12`,
          title: isMathSpecial
            ? 'Definite Integration: King’s & Queen’s Property Symmetric Traps'
            : 'Haloalkanes: SN1 vs SN2 Stereochemical Pathways & Solvents',
          duration: '52:10',
          isPreview: false,
          description: 'Using reflection symmetry around bounds to solve complex trigonometric integrals.'
        },
        {
          id: `${course.id}-l13`,
          title: isMathSpecial
            ? 'Leibniz Rule for Differentiating Under the Integral Sign'
            : 'Elimination Reactions: E1 vs E2 Saytzeff vs Hofmann Regioselectivity',
          duration: '40:20',
          isPreview: false,
          description: 'Boundary limit differentiation and finding function relations from integral equations.'
        },
        {
          id: `${course.id}-l14`,
          title: isMathSpecial
            ? 'Area Under Curves: Bounding Symmetric Regions Without Full Integration'
            : 'Carbocation Rearrangements: Hydride & Methyl Shift Traps',
          duration: '44:15',
          isPreview: false,
          description: 'Standard geometric bounding formulas for parabolas, ellipses, and common tangents.'
        },
        {
          id: `${course.id}-l15`,
          title: isMathSpecial
            ? 'Differential Equations: Variable Separable, Linear & Bernoulli Forms'
            : 'Optical Isomerism: Enantiomers, Diastereomers & Meso Compounds',
          duration: '48:30',
          isPreview: false,
          description: 'Integrating factor rapid determination and family of orthogonal curves.'
        },
        {
          id: `${course.id}-l16`,
          title: isMathSpecial
            ? 'Calculus Milestone Test Discussion & Rank Diagnosis'
            : 'Organic Synthesis Roadmap & Multi-Step Conversion Hacks',
          duration: '34:45',
          isPreview: false,
          description: 'Comprehensive milestone test analysis and time-management review.'
        }
      ]
    },
    {
      id: 'sec-5',
      title: isMathSpecial
        ? 'Section 5: Coordinate Geometry, Conics & Tangent Director Circles'
        : 'Section 5: Chemical Bonding, Molecular Orbitals & Coordination Complexes',
      lecturesCount: 4,
      durationText: '4 lectures • 2hr 55min',
      lectures: [
        {
          id: `${course.id}-l17`,
          title: isMathSpecial
            ? 'Standard Parabola: Tangents, Normals & Director Circle Hacks'
            : 'Molecular Orbital Theory: Diatomic MOT Diagrams & Bond Order',
          duration: '46:30',
          isPreview: false,
          description: 'Slope and point form tangent equations and focal chord length formulas.'
        },
        {
          id: `${course.id}-l18`,
          title: isMathSpecial
            ? 'Ellipse & Hyperbola: Auxiliary Circles, Eccentricity & Asymptotes'
            : 'Crystal Field Theory: Splitting in Octahedral & Tetrahedral Fields',
          duration: '44:50',
          isPreview: false,
          description: 'Conic section shortcuts avoiding 2-page algebraic coordinate geometry.'
        },
        {
          id: `${course.id}-l19`,
          title: isMathSpecial
            ? 'Circles: Orthogonal Circles, Radical Axis & Common Tangents'
            : 'Isomerism in Coordination Complexes: Facial vs Meridional',
          duration: '42:15',
          isPreview: false,
          description: 'Equation of radical axis and chord of contact in 20 seconds.'
        },
        {
          id: `${course.id}-l20`,
          title: isMathSpecial
            ? 'Conics Mixed PYQ Elimination in 30 Seconds'
            : 'Inorganic NCERT Memory Maps: Coordination Compounds',
          duration: '41:25',
          isPreview: false,
          description: 'Speed drills eliminating wrong options through extreme value testing.'
        }
      ]
    },
    {
      id: 'sec-6',
      title: isMathSpecial
        ? 'Section 6: Vectors, 3D Geometry & Probability Bayes Theorem'
        : 'Section 6: Thermal Physics, Thermodynamics & CBT Mock Engine Drills',
      lecturesCount: 4,
      durationText: '4 lectures • 2hr 45min',
      lectures: [
        {
          id: `${course.id}-l21`,
          title: isMathSpecial
            ? 'Vectors: Dot, Cross & Scalar Triple Products in 20 Seconds'
            : 'First Law of Thermodynamics: P-V Cyclic Efficiency & Heat Engines',
          duration: '40:10',
          isPreview: false,
          description: 'Geometric interpretation of scalar triple product and coplanarity checks.'
        },
        {
          id: `${course.id}-l22`,
          title: isMathSpecial
            ? '3D Geometry: Shortest Distance Between Skew Lines (DK Method)'
            : 'Kinetic Theory of Gases & Maxwell-Boltzmann Speed Distribution',
          duration: '45:20',
          isPreview: false,
          description: 'Direct formula shortcut for skew lines without solving 3 simultaneous equations.'
        },
        {
          id: `${course.id}-l23`,
          title: isMathSpecial
            ? 'Conditional Probability & Bayes Theorem Speed Hacks'
            : 'Thermodynamics Milestone CBT Test Discussion & Rank Analysis',
          duration: '41:30',
          isPreview: false,
          description: 'Tree diagrams and Bayesian probability deconstructed into 30s steps.'
        },
        {
          id: `${course.id}-l24`,
          title: isMathSpecial
            ? 'Full Syllabus Mock Test CBT Discussion & Rank Predictor'
            : 'Full All-India NTA Simulation Mock Test 1 Detailed Analysis',
          duration: '38:00',
          isPreview: false,
          description: 'Final exam strategy, question selection algorithm, and negative mark elimination.'
        }
      ]
    }
  ];

  const sections: CurriculumSection[] = (course.curriculumSections && course.curriculumSections.length > 0)
    ? course.curriculumSections.map((sec, idx) => ({
        id: sec.id || `sec-${idx + 1}`,
        title: sec.title,
        lecturesCount: sec.lectures.length,
        durationText: sec.durationText || `${sec.lectures.length} lectures`,
        lectures: sec.lectures.map((l) => ({
          ...l,
          isPreview: Boolean(l.isPreview)
        }))
      }))
    : defaultSections;

  // State to manage open/collapsed sections
  const [openSectionIds, setOpenSectionIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((s, idx) => {
      initial[s.id] = idx < 2;
    });
    return initial;
  });

  const [activePreviewLecture, setActivePreviewLecture] = useState<CurriculumLecture | null>(null);
  const [lockedModalLecture, setLockedModalLecture] = useState<CurriculumLecture | null>(null);

  // Toggle single section
  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Expand all / Collapse all toggle
  const allOpen = Object.values(openSectionIds).every(Boolean);
  const handleToggleAll = () => {
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    sections.forEach((s) => {
      updated[s.id] = nextState;
    });
    setOpenSectionIds(updated);
  };

  // Handle clicking a lecture row
  const handleLectureClick = (lec: CurriculumLecture) => {
    if (lec.isPreview || isEnrolled) {
      setActivePreviewLecture(lec);
    } else {
      setLockedModalLecture(lec);
    }
  };

  // Calculate totals
  const totalSections = sections.length;
  const totalLectures = sections.reduce((acc, s) => acc + s.lecturesCount, 0);
  const freePreviewsCount = sections.reduce(
    (acc, s) => acc + s.lectures.filter((l) => l.isPreview).length,
    0
  );

  return (
    <section className={styles.courseContentWrapper} id="course-content" aria-labelledby="course-content-heading">
      {/* 1. Header (Udemy style: Title, counts & Expand all sections button) */}
      <div className={styles.contentHeader}>
        <h2 id="course-content-heading" className={styles.contentTitle}>
          Course content
        </h2>

        <div className={styles.contentMetaRow}>
          <span className={styles.metaText}>
            {totalSections} sections • {totalLectures} lectures • 14h 33m total length
          </span>

          <button
            type="button"
            className={styles.expandAllBtn}
            onClick={handleToggleAll}
          >
            {allOpen ? 'Collapse all sections' : 'Expand all sections'}
          </button>
        </div>
      </div>

      {/* 2. Free Trial Indicator (Exactly 5 free demo lectures) */}
      <div className={styles.freeNoticeBanner}>
        <div className={styles.freeNoticeLeft}>
          <Sparkles size={16} className={styles.freeSparkleIcon} />
          <span>
            <strong>{freePreviewsCount} Video Lectures Free to Preview:</strong> Watch the first 5 full-length demo lectures below with zero sign-in. Subsequent lectures require course enrollment.
          </span>
        </div>

        {isEnrolled && (
          <span className={styles.enrolledBadge}>
            <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
            All Lectures Unlocked (Enrolled)
          </span>
        )}
      </div>

      {/* 3. Accordion Group of Sections (Exact Udemy styling) */}
      <div className={styles.accordionGroup}>
        {sections.map((sec) => {
          const isOpen = Boolean(openSectionIds[sec.id]);

          return (
            <div key={sec.id} className={styles.sectionItem}>
              {/* Section Header Button */}
              <button
                type="button"
                className={styles.sectionHeaderBtn}
                onClick={() => toggleSection(sec.id)}
                aria-expanded={isOpen}
              >
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.chevronIcon}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                  <h3 className={styles.sectionTitle}>{sec.title}</h3>
                </div>

                <span className={styles.sectionHeaderRight}>
                  {sec.durationText}
                </span>
              </button>

              {/* Collapsible Lecture Rows */}
              {isOpen && (
                <div className={styles.lecturesList}>
                  {sec.lectures.map((lec) => {
                    const canPlay = lec.isPreview || isEnrolled;

                    return (
                      <div
                        key={lec.id}
                        className={`${styles.lectureRow} ${!canPlay ? styles.isLockedRow : ''}`}
                        onClick={() => handleLectureClick(lec)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleLectureClick(lec);
                          }
                        }}
                      >
                        {/* Left: TV/Video Icon + Lecture Title + Badges */}
                        <div className={styles.lectureRowLeft}>
                          <Tv size={15} className={styles.videoIcon} aria-hidden="true" />
                          <span className={styles.lectureTitleText}>{lec.title}</span>
                          <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>
                            {lec.notesPdfUrl && (
                              <span
                                title="Downloadable PDF Notes"
                                style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}
                              >
                                PDF
                              </span>
                            )}
                            {lec.dppPdfUrl && (
                              <span
                                title="Practice DPP Sheet"
                                style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}
                              >
                                DPP
                              </span>
                            )}
                            {lec.externalDocLink && (
                              <span
                                title="Reference Link / Document"
                                style={{ fontSize: '0.68rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}
                              >
                                Doc
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Preview Button (if free) + Duration / Lock */}
                        <div className={styles.lectureRowRight}>
                          {canPlay && lec.isPreview ? (
                            <span
                              className={styles.previewLink}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePreviewLecture(lec);
                              }}
                            >
                              <Play size={10} className={styles.previewPlayIcon} />
                              <span>Preview</span>
                            </span>
                          ) : !canPlay ? (
                            <span className={styles.lockIndicator} title="Course Enrolled Only">
                              <Lock size={13} />
                            </span>
                          ) : null}

                          <span className={styles.lectureDuration}>{lec.duration}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Modal 1: Free Video Player Modal (Triggered on Preview click) ── */}
      {activePreviewLecture && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePreviewLecture(null)}
        >
          <div
            className={styles.videoModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setActivePreviewLecture(null)}
              aria-label="Close preview video"
            >
              <X size={20} />
            </button>

            {/* Video Player Display Screen */}
            <div className={styles.screenArea}>
              {activePreviewLecture.youtubeId || (activePreviewLecture.videoUrl && activePreviewLecture.videoUrl.includes('youtu')) ? (
                <iframe
                  style={{ width: '100%', height: '100%', minHeight: '320px', border: 'none' }}
                  src={`https://www.youtube-nocookie.com/embed/${
                    activePreviewLecture.youtubeId ||
                    (activePreviewLecture.videoUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/) || [])[1] || 'dQw4w9WgXcQ'
                  }?autoplay=1`}
                  title={activePreviewLecture.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activePreviewLecture.videoUrl && (activePreviewLecture.videoUrl.endsWith('.mp4') || activePreviewLecture.videoUrl.includes('/video')) ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '320px', overflow: 'hidden' }}>
                  <video
                    src={activePreviewLecture.videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', minHeight: '320px', objectFit: 'contain', display: 'block' }}
                  />
                  <DynamicWatermark />
                </div>
              ) : (
                <>
                  <div className={styles.screenTop}>
                    <span className={styles.screenBadge}>
                      FREE LECTURE PREVIEW • DK ACADEMY JEE
                    </span>
                    <span>{activePreviewLecture.duration}</span>
                  </div>

                  <div className={styles.screenCenter}>
                    <div className={styles.playCircle}>
                      <Play size={28} fill="currentColor" />
                    </div>
                    <h3 className={styles.screenTitle}>{activePreviewLecture.title}</h3>
                    <span className={styles.screenSub}>
                      DK Sir (Ex-IITian) • Kota Pedagogy Masterclass
                    </span>
                  </div>

                  <div className={styles.screenBottom}>
                    <span>1080p Crystal HD • Zero Paywall</span>
                    <span>Speed Math Inspection Mode</span>
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalBody}>
              <h4 className={styles.modalTitle}>{activePreviewLecture.title}</h4>
              <p className={styles.modalDesc}>{activePreviewLecture.description || 'Comprehensive conceptual derivation and 20-30s problem solving shortcuts with DK Sir.'}</p>

              <div className={styles.resourcesRow}>
                {activePreviewLecture.notesPdfUrl ? (
                  <a
                    href={activePreviewLecture.notesPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceLink}
                  >
                    <Download size={14} />
                    <span>{activePreviewLecture.notesTitle || 'Download Lecture Notes (PDF)'}</span>
                  </a>
                ) : (
                  <span className={styles.resourceLink}>
                    <Download size={14} />
                    <span>Download Handwritten Lecture Notes (PDF)</span>
                  </span>
                )}

                {activePreviewLecture.dppPdfUrl ? (
                  <a
                    href={activePreviewLecture.dppPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceLink}
                  >
                    <BookOpen size={14} />
                    <span>{activePreviewLecture.dppTitle || 'Class DPP Problem Sheet (PDF)'}</span>
                  </a>
                ) : (
                  <span className={styles.resourceLink}>
                    <BookOpen size={14} />
                    <span>Class DPP Problem Sheet with Solutions</span>
                  </span>
                )}

                {activePreviewLecture.externalDocLink && (
                  <a
                    href={activePreviewLecture.externalDocLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceLink}
                  >
                    <ExternalLink size={14} />
                    <span>{activePreviewLecture.externalDocTitle || 'Reference Document / Link'}</span>
                  </a>
                )}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  to={`/learn/${course.id}?lesson=${activePreviewLecture.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#024ebb',
                    color: '#ffffff',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 8px rgba(2, 78, 187, 0.25)'
                  }}
                >
                  <Play size={14} fill="#ffffff" />
                  <span>Open in Fullscreen LMS Player</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Locked Lecture Paywall Modal (Triggered on paid lectures) ── */}
      {lockedModalLecture && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setLockedModalLecture(null)}
        >
          <div
            className={styles.paywallModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setLockedModalLecture(null)}
              aria-label="Close paywall"
            >
              <X size={20} />
            </button>

            <div className={styles.paywallHeader}>
              <div className={styles.lockCircle}>
                <Lock size={32} />
              </div>
              <h3 className={styles.paywallTitle}>Course Enrollment Required</h3>
              <p className={styles.paywallSub}>
                You have accessed the 5 free preview lectures. To unlock this lecture and the remaining {totalLectures - 5} lectures of <strong>{course.title}</strong>, enroll now.
              </p>
            </div>

            <div className={styles.paywallBody}>
              <ul className={styles.perksList}>
                <li>
                  <CheckCircle size={15} className={styles.perkCheckIcon} />
                  <span>Full access to 450+ Hours live &amp; recorded HD video lectures</span>
                </li>
                <li>
                  <CheckCircle size={15} className={styles.perkCheckIcon} />
                  <span>DK Sir's complete 20–30s inspection shortcuts and formula cheatsheets</span>
                </li>
                <li>
                  <CheckCircle size={15} className={styles.perkCheckIcon} />
                  <span>Daily graded DPPs with complete step-by-step video solutions</span>
                </li>
                <li>
                  <CheckCircle size={15} className={styles.perkCheckIcon} />
                  <span>All India Computer-Based Test (CBT) mock series with rank analysis</span>
                </li>
              </ul>

              <div className={styles.pricingCallout}>
                <div>
                  <span className={styles.calloutPrice}>{course.price}</span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', marginLeft: '6px' }}>
                    (was <span style={{ textDecoration: 'line-through' }}>{course.originalPrice}</span>)
                  </span>
                </div>
                {course.emiText && (
                  <span className={styles.calloutEmi}>{course.emiText}</span>
                )}
              </div>

              <div className={styles.paywallActions}>
                <button
                  type="button"
                  className={styles.enrollNowBtn}
                  onClick={() => {
                    setLockedModalLecture(null);
                    if (onOpenEnrollModal) {
                      onOpenEnrollModal();
                    }
                  }}
                >
                  <span>Enroll &amp; Unlock All Lectures Now</span>
                  <ArrowRight size={16} />
                </button>

                <a
                  href={`https://wa.me/919325987875?text=Hello%20DK%20Academy,%20I%20want%20to%20enroll%20in%20${encodeURIComponent(course.title)}%20to%20unlock%20all%20lectures.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.counselorWaBtn}
                >
                  <PhoneCall size={14} />
                  <span>Talk to Counselor on WhatsApp (+91 93259 87875)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

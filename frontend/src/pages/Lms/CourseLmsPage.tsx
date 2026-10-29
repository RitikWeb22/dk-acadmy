import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  CheckCircle2,
  Circle,
  BookOpen,
  Download,
  FileText,
  MessageSquare,
  Star,
  ArrowLeft,
  Volume2,
  VolumeX,
  Award,
  User,
  Search,
  ThumbsUp,
  Send,
  Edit3,
  Layers,
  ExternalLink,
  Check,
  Video,
  Maximize,
  Minimize,
  ChevronDown,
  Subtitles,
  Lock,
  Sparkles,
  X,
  Settings,
  AlertCircle,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ShieldCheck
} from 'lucide-react';
import Hls from 'hls.js';
import { useStudentAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { paymentService } from '../../services/paymentService';
import { cmsService } from '../../services/cmsService';
import { lmsService, type CourseProgressMap } from '../../services/lmsService';
import { apiClient } from '../../services/apiClient';
import { soundEffects } from '../../utils/sound';
import { DynamicWatermark } from '../../components/lms/DynamicWatermark/DynamicWatermark';
import { COURSES_CATALOG, FREE_COURSES_CATALOG } from '../../data/coursesData';
import type { Course, CourseCurriculumSection, CourseLectureItem } from '../../types';
import styles from './CourseLmsPage.module.scss';


// Realistic pre-seeded curriculum generator with working local sample video and subject specialization
const generateDefaultCurriculum = (course: Course): CourseCurriculumSection[] => {
  const isPhysics = course.subjects?.includes('Physics') && !course.subjects?.includes('Mathematics');
  const isChemistry = course.subjects?.includes('Chemistry') && !course.subjects?.includes('Mathematics');

  if (isPhysics) {
    return [
      {
        id: 'sec-1',
        title: 'Chapter 1: Mechanics & Newton’s Laws Kota Foundations',
        durationText: '4 Lectures • 3h 10m',
        lectures: [
          {
            id: 'lec-1-1',
            title: 'Lesson 1: Free-Body Diagrams & Pseudo-Forces in Non-Inertial Frames',
            duration: '38:40',
            isPreview: true,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Deconstruct complex multi-body pulleys, inclined wedges, and elevators using non-inertial pseudo-force reference frames.',
            notesPdfUrl: '/downloads/physics-mechanics-notes-01.pdf',
            notesTitle: 'Mechanics_FBD_Kota_CheatSheet.pdf',
            dppPdfUrl: '/downloads/dpp-physics-01.pdf',
            dppTitle: 'DPP_Set_01_Newton_Laws_With_Solutions.pdf'
          },
          {
            id: 'lec-1-2',
            title: 'Lesson 2: Friction, Impending Slipping & Two-Block Systems',
            duration: '45:15',
            isPreview: true,
            videoUrl: '/videos/story-aarav.mp4',
            description: 'Static vs kinetic friction transitions, direction of impending slip, and step-by-step solution algorithms for two-block stacked systems.',
            notesPdfUrl: '/downloads/friction-twoblock-notes.pdf',
            notesTitle: 'Friction_TwoBlock_Mastery.pdf',
            dppPdfUrl: '/downloads/dpp-physics-02.pdf',
            dppTitle: 'DPP_Set_02_Friction_Mechanics.pdf'
          },
          {
            id: 'lec-1-3',
            title: 'Lesson 3: Work-Energy Theorem & Variable Force Line Integrals',
            duration: '42:50',
            isPreview: true,
            videoUrl: '/videos/story-priya.mp4',
            description: 'Conservative vs non-conservative forces, potential energy curves, and calculating work done along arbitrary 3D curve trajectories.',
            notesPdfUrl: '/downloads/work-energy-notes.pdf',
            notesTitle: 'Work_Energy_Potential_Curves.pdf',
            dppPdfUrl: '/downloads/dpp-physics-03.pdf',
            dppTitle: 'DPP_Set_03_Work_Energy.pdf'
          },
          {
            id: 'lec-1-4',
            title: 'Lesson 4: Center of Mass & Elastic-Inelastic Impulse Collisions',
            duration: '50:10',
            isPreview: true,
            videoUrl: '/videos/story-rohan.mp4',
            description: 'Reduced mass concept, continuous body COM via integration, and coefficient of restitution in oblique 2D collisions.',
            notesPdfUrl: '/downloads/com-collisions-notes.pdf',
            notesTitle: 'Center_of_Mass_Impulse_Formulas.pdf',
            dppPdfUrl: '/downloads/dpp-physics-04.pdf',
            dppTitle: 'DPP_Set_04_Collisions.pdf'
          }
        ]
      },
      {
        id: 'sec-2',
        title: 'Chapter 2: Rotational Dynamics & Angular Momentum',
        durationText: '3 Lectures • 2h 45m',
        lectures: [
          {
            id: 'lec-2-1',
            title: 'Lesson 5: Moment of Inertia of Symmetrical Bodies via Integral Methods',
            duration: '49:20',
            isPreview: true,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Parallel and perpendicular axes theorems, moment of inertia of truncated cones, hollow spheres, and cavity disks.',
            notesPdfUrl: '/downloads/moi-calculus-notes.pdf',
            notesTitle: 'Moment_of_Inertia_Master_Summary.pdf',
            dppPdfUrl: '/downloads/dpp-physics-05.pdf',
            dppTitle: 'DPP_Set_05_Rotational_Inertia.pdf'
          },
          {
            id: 'lec-2-2',
            title: 'Lesson 6: Torque Equation & Pure Rolling on Rough Inclines',
            duration: '56:00',
            isPreview: false,
            videoUrl: '/videos/story-aarav.mp4',
            description: 'Torque about instantaneous center of zero velocity (ICR), minimum coefficient of friction for pure rolling without slip.',
            notesPdfUrl: '/downloads/pure-rolling-notes.pdf',
            notesTitle: 'Pure_Rolling_Dynamics_Handout.pdf',
            dppPdfUrl: '/downloads/dpp-physics-06.pdf',
            dppTitle: 'DPP_Set_06_Pure_Rolling.pdf'
          },
          {
            id: 'lec-2-3',
            title: 'Lesson 7: Conservation of Angular Momentum & Gyroscopic Precession',
            duration: '44:30',
            isPreview: false,
            videoUrl: '/videos/story-priya.mp4',
            description: 'Angular momentum about moving origin points, collision of particles with hinged rods, and eccentric impact analysis.',
            notesPdfUrl: '/downloads/angular-momentum-notes.pdf',
            notesTitle: 'Angular_Momentum_Conservation.pdf',
            dppPdfUrl: '/downloads/dpp-physics-07.pdf',
            dppTitle: 'DPP_Set_07_Angular_Momentum.pdf'
          }
        ]
      },
      {
        id: 'sec-3',
        title: 'Chapter 3: Advanced Mechanics PYQ Sprint & SHM',
        durationText: '3 Lectures • 2h 35m',
        lectures: [
          {
            id: 'lec-3-1',
            title: 'Lesson 8: Small Oscillations Approximation & Compound Pendulums',
            duration: '48:15',
            isPreview: false,
            videoUrl: '/videos/story-rohan.mp4',
            description: 'Taylor series potential energy expansion, finding equivalent spring constants, and time period of compound rigid pendulums.',
            notesPdfUrl: '/downloads/shm-oscillations-notes.pdf',
            notesTitle: 'SHM_Compound_Pendulum_Drills.pdf',
            dppPdfUrl: '/downloads/dpp-physics-08.pdf',
            dppTitle: 'DPP_Set_08_SHM_Oscillations.pdf'
          },
          {
            id: 'lec-3-2',
            title: 'Lesson 9: Fluid Mechanics, Bernoulli Equation & Viscous Drag',
            duration: '51:40',
            isPreview: false,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Accelerated fluid containers, Torricelli theorem with time of emptying, and surface tension excess pressure formulas.',
            notesPdfUrl: '/downloads/fluid-mechanics-notes.pdf',
            notesTitle: 'Fluid_Mechanics_Bernoulli_Shield.pdf',
            dppPdfUrl: '/downloads/dpp-physics-09.pdf',
            dppTitle: 'DPP_Set_09_Fluids.pdf'
          },
          {
            id: 'lec-3-3',
            title: 'Lesson 10: 15-Year JEE Advanced Mechanics PYQ Speed Marathon',
            duration: '58:00',
            isPreview: false,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Full live sprint solving 25 toughest multi-correct mechanics questions with Kota faculty shortcut comparisons.',
            notesPdfUrl: '/downloads/physics-marathon-handout.pdf',
            notesTitle: 'Grand_Mechanics_PYQ_Marathon.pdf',
            dppPdfUrl: '/downloads/dpp-physics-10.pdf',
            dppTitle: 'DPP_Set_10_Grand_Mock.pdf'
          }
        ]
      }
    ];
  }

  if (isChemistry) {
    return [
      {
        id: 'sec-1',
        title: 'Chapter 1: General Organic Chemistry (GOC) & Electronic Effects',
        durationText: '4 Lectures • 3h 05m',
        lectures: [
          {
            id: 'lec-1-1',
            title: 'Lesson 1: Inductive & Resonance Effects in Hydrocarbon Stability',
            duration: '38:40',
            isPreview: true,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Quantifying electronic displacement, mesomeric stabilization, and drawing non-trivial resonance contributors with formal charges.',
            notesPdfUrl: '/downloads/goc-resonance-notes.pdf',
            notesTitle: 'GOC_Electronic_Effects_Summary.pdf',
            dppPdfUrl: '/downloads/dpp-chem-01.pdf',
            dppTitle: 'DPP_Set_01_GOC_Resonance.pdf'
          },
          {
            id: 'lec-1-2',
            title: 'Lesson 2: Hyperconjugation & Heat of Hydrogenation Predictions',
            duration: '45:15',
            isPreview: true,
            videoUrl: '/videos/story-aarav.mp4',
            description: 'Alpha-hydrogen counting, alkene stability orders, Baker-Nathan effect, and thermodynamic heat of hydrogenation trends.',
            notesPdfUrl: '/downloads/hyperconjugation-notes.pdf',
            notesTitle: 'Hyperconjugation_Alkene_Stability.pdf',
            dppPdfUrl: '/downloads/dpp-chem-02.pdf',
            dppTitle: 'DPP_Set_02_Hyperconjugation.pdf'
          },
          {
            id: 'lec-1-3',
            title: 'Lesson 3: Carbocation Rearrangements (Hydride & Alkyl Shifts)',
            duration: '42:50',
            isPreview: true,
            videoUrl: '/videos/story-priya.mp4',
            description: 'Ring expansion in 4-membered and 5-membered rings, pinacol-pinacolone shifts, and predicting major thermodynamic carbocations.',
            notesPdfUrl: '/downloads/carbocation-shifts-notes.pdf',
            notesTitle: 'Carbocation_Rearrangements_Map.pdf',
            dppPdfUrl: '/downloads/dpp-chem-03.pdf',
            dppTitle: 'DPP_Set_03_Rearrangements.pdf'
          },
          {
            id: 'lec-1-4',
            title: 'Lesson 4: Acidity & Basicity Orders in Aromatic Systems',
            duration: '50:10',
            isPreview: true,
            videoUrl: '/videos/story-rohan.mp4',
            description: 'Ortho effect in benzoic acids and anilines, SIR/SIP effects, and comparing conjugate base stability across substituted phenols.',
            notesPdfUrl: '/downloads/acidity-basicity-notes.pdf',
            notesTitle: 'Acidity_Basicity_Aromatic_CheatSheet.pdf',
            dppPdfUrl: '/downloads/dpp-chem-04.pdf',
            dppTitle: 'DPP_Set_04_Acid_Base.pdf'
          }
        ]
      },
      {
        id: 'sec-2',
        title: 'Chapter 2: Reaction Mechanisms & Stereochemistry',
        durationText: '3 Lectures • 2h 45m',
        lectures: [
          {
            id: 'lec-2-1',
            title: 'Lesson 5: SN1 vs SN2 Mechanisms: Solvent & Substrate Factors',
            duration: '49:20',
            isPreview: true,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Polar protic vs polar aprotic solvents, Walden inversion stereochemistry, and borderline substrate mechanism determination.',
            notesPdfUrl: '/downloads/sn1-sn2-mechanisms-notes.pdf',
            notesTitle: 'SN1_SN2_Comparison_Grid.pdf',
            dppPdfUrl: '/downloads/dpp-chem-05.pdf',
            dppTitle: 'DPP_Set_05_Substitution.pdf'
          },
          {
            id: 'lec-2-2',
            title: 'Lesson 6: E1 & E2 Elimination: Saytzeff vs Hofmann Orientation',
            duration: '56:00',
            isPreview: false,
            videoUrl: '/videos/story-aarav.mp4',
            description: 'Anti-periplanar geometry requirements, bulky base steric hindrance, and competing substitution vs elimination pathways.',
            notesPdfUrl: '/downloads/e1-e2-elimination-notes.pdf',
            notesTitle: 'Elimination_Mechanisms_Handout.pdf',
            dppPdfUrl: '/downloads/dpp-chem-06.pdf',
            dppTitle: 'DPP_Set_06_Elimination.pdf'
          },
          {
            id: 'lec-2-3',
            title: 'Lesson 7: Optical Isomerism, Enantiomers & Meso Compounds',
            duration: '44:30',
            isPreview: false,
            videoUrl: '/videos/story-priya.mp4',
            description: 'Chirality centers, plane of symmetry, R/S configuration assignments, and counting stereoisomers with pseudo-asymmetric centers.',
            notesPdfUrl: '/downloads/stereochemistry-notes.pdf',
            notesTitle: 'Stereochemistry_Optical_Handout.pdf',
            dppPdfUrl: '/downloads/dpp-chem-07.pdf',
            dppTitle: 'DPP_Set_07_Stereo.pdf'
          }
        ]
      },
      {
        id: 'sec-3',
        title: 'Chapter 3: Advanced Organic Roadmaps & Functional Groups',
        durationText: '3 Lectures • 2h 30m',
        lectures: [
          {
            id: 'lec-3-1',
            title: 'Lesson 8: Electrophilic Aromatic Substitution (Nitration & Friedel-Crafts)',
            duration: '48:15',
            isPreview: false,
            videoUrl: '/videos/story-rohan.mp4',
            description: 'Activating and deactivating groups, halogen directing anomalies, and kinetic vs thermodynamic sulfonation products.',
            notesPdfUrl: '/downloads/aromatic-substitution-notes.pdf',
            notesTitle: 'Aromatic_Substitution_Summary.pdf',
            dppPdfUrl: '/downloads/dpp-chem-08.pdf',
            dppTitle: 'DPP_Set_08_Aromatics.pdf'
          },
          {
            id: 'lec-3-2',
            title: 'Lesson 9: Carbonyl Additions: Aldol, Cannizzaro & Grignard Reactions',
            duration: '51:40',
            isPreview: false,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Cross-aldol condensations with enolates, nucleophilic addition to aldehydes and esters using organometallic Grignard reagents.',
            notesPdfUrl: '/downloads/carbonyl-reactions-notes.pdf',
            notesTitle: 'Carbonyl_Reactions_Mastery.pdf',
            dppPdfUrl: '/downloads/dpp-chem-09.pdf',
            dppTitle: 'DPP_Set_09_Carbonyls.pdf'
          },
          {
            id: 'lec-3-3',
            title: 'Lesson 10: 15-Year JEE Advanced Organic Multi-Step Synthesis Sprint',
            duration: '58:00',
            isPreview: false,
            videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
            description: 'Deconstructing 10 complex multi-step organic reaction roadmaps from previous JEE Advanced exam papers.',
            notesPdfUrl: '/downloads/organic-marathon-handout.pdf',
            notesTitle: 'Organic_Synthesis_PYQ_Sprint.pdf',
            dppPdfUrl: '/downloads/dpp-chem-10.pdf',
            dppTitle: 'DPP_Set_10_Grand_Mock.pdf'
          }
        ]
      }
    ];
  }

  // Default: Mathematics & General JEE Advanced Track
  return [
    {
      id: 'sec-1',
      title: 'Chapter 1: Foundations & Core Mathematical Geometry',
      durationText: '4 Lectures • 3h 15m',
      lectures: [
        {
          id: 'lec-1-1',
          title: 'Lesson 1: Introduction to DK Sir 20s Inspection Method & Principles',
          duration: '38:40',
          isPreview: true,
          videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
          description:
            'Fundamental orientation on identifying symmetric properties in JEE calculus, eliminating wrong options via boundary analysis, and establishing 20-30s speed solutions.',
          notesPdfUrl: '/downloads/dk-calculus-handout-01.pdf',
          notesTitle: 'DK_Sir_Calculus_Foundations_Lecture_Notes.pdf',
          dppPdfUrl: '/downloads/dpp-calculus-01.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_01_With_Solutions.pdf',
          externalDocLink: 'https://jeemain.nta.nic.in',
          externalDocTitle: 'NTA JEE Master Syllabus & Marking Scheme.pdf'
        },
        {
          id: 'lec-1-2',
          title: 'Lesson 2: King’s Property & Symmetric Definite Integrals',
          duration: '45:15',
          isPreview: true,
          videoUrl: '/videos/story-aarav.mp4',
          description:
            'Comprehensive derivation of King’s Property (f(a+b-x)) with 12 classic JEE Advanced past exam problems solved in 25 seconds without multi-step integration by parts.',
          notesPdfUrl: '/downloads/kings-property-notes.pdf',
          notesTitle: 'Kings_Property_Symmetry_CheatSheet.pdf',
          dppPdfUrl: '/downloads/dpp-calculus-02.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_02_Kings_Rule.pdf'
        },
        {
          id: 'lec-1-3',
          title: 'Lesson 3: Leibniz Integral Rule & Parameter Differentiation',
          duration: '52:10',
          isPreview: true,
          videoUrl: '/videos/story-priya.mp4',
          description:
            'Differentiating under the integral sign using Leibniz formula. Applications in limits involving integrals and indefinite boundary functions.',
          notesPdfUrl: '/downloads/leibniz-integral-notes.pdf',
          notesTitle: 'Leibniz_Rule_Derivative_Handout.pdf',
          dppPdfUrl: '/downloads/dpp-calculus-03.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_03_Leibniz.pdf'
        },
        {
          id: 'lec-1-4',
          title: 'Lesson 4: Rapid Area Under Curves: Parabola & Ellipse Tricks',
          duration: '42:50',
          isPreview: true,
          videoUrl: '/videos/story-rohan.mp4',
          description:
            'Standard formulas and 8-second area algorithms for enclosed parabolic chords, ellipses intersecting lines, and bounded trigonometric wave segments.',
          notesPdfUrl: '/downloads/area-under-curve-notes.pdf',
          notesTitle: 'Area_Under_Curves_Mastery_Formulas.pdf',
          dppPdfUrl: '/downloads/dpp-area-curves.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_04_Area_Curves.pdf'
        }
      ]
    },
    {
      id: 'sec-2',
      title: 'Chapter 2: DK Sir 20s Advanced Algorithmic Shortcuts',
      durationText: '3 Lectures • 2h 45m',
      lectures: [
        {
          id: 'lec-2-1',
          title: 'Lesson 5: Coordinate Geometry: Tangents & Normals without Calculus',
          duration: '49:20',
          isPreview: true,
          videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
          description:
            'Parametric coordinates, director circle properties, and finding equations of common tangents to circles and parabolas in under 30 seconds.',
          notesPdfUrl: '/downloads/coordinate-tangents-notes.pdf',
          notesTitle: 'Coordinate_Geometry_Shortcut_Summary.pdf',
          dppPdfUrl: '/downloads/dpp-coordinate-01.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_05_Conics.pdf'
        },
        {
          id: 'lec-2-2',
          title: 'Lesson 6: Vectors & 3D Geometry: Shortest Distance & Coplanarity',
          duration: '56:00',
          isPreview: false,
          videoUrl: '/videos/story-aarav.mp4',
          description:
            'Scalar and vector triple products, shortest distance between skew lines via vector projection, and foot of perpendicular calculations.',
          notesPdfUrl: '/downloads/vector-3d-notes.pdf',
          notesTitle: 'Vectors_and_3D_Geometry_Rapid_Keys.pdf',
          dppPdfUrl: '/downloads/dpp-vector-3d.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_06_Vectors.pdf'
        },
        {
          id: 'lec-2-3',
          title: 'Lesson 7: Complex Numbers Geometry: Rotation & Circle Loci',
          duration: '44:30',
          isPreview: false,
          videoUrl: '/videos/story-priya.mp4',
          description:
            'De Moivre’s theorem, nth roots of unity, and geometric transformations of complex coordinates in the Argand plane.',
          notesPdfUrl: '/downloads/complex-numbers-notes.pdf',
          notesTitle: 'Complex_Numbers_Argand_Loci_Handout.pdf',
          dppPdfUrl: '/downloads/dpp-complex.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_07_Complex.pdf'
        }
      ]
    },
    {
      id: 'sec-3',
      title: 'Chapter 3: JEE Advanced Multi-Correct & Negative-Marking Shield',
      durationText: '3 Lectures • 2h 30m',
      lectures: [
        {
          id: 'lec-3-1',
          title: 'Lesson 8: Multi-Correct Option Elimination & Verification Strategies',
          duration: '48:15',
          isPreview: false,
          videoUrl: '/videos/story-rohan.mp4',
          description:
            'How to avoid negative marking in multi-correct questions by substituting special boundary values (0, 1, infinity) and checking continuity limits.',
          notesPdfUrl: '/downloads/multi-correct-strategies.pdf',
          notesTitle: 'JEE_Advanced_Multi_Correct_Shield.pdf',
          dppPdfUrl: '/downloads/dpp-advanced-mcq.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_08_Multi_Correct.pdf'
        },
        {
          id: 'lec-3-2',
          title: 'Lesson 9: Integer-Type & Numerical Value High-Precision Rounding',
          duration: '51:40',
          isPreview: false,
          videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
          description:
            'Solving decimal and integer questions with 100% calculation precision and zero calculation slip errors.',
          notesPdfUrl: '/downloads/numerical-precision-notes.pdf',
          notesTitle: 'Integer_Problem_Solving_Handbook.pdf',
          dppPdfUrl: '/downloads/dpp-numerical.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_09_Numerical.pdf'
        },
        {
          id: 'lec-3-3',
          title: 'Lesson 10: Full Chapter Revision & PYQ Rank Booster Marathon',
          duration: '58:00',
          isPreview: false,
          videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
          description:
            'Live problem-solving sprint covering 25 previous years JEE Advanced questions with DK Sir speed techniques comparison.',
          notesPdfUrl: '/downloads/pyq-marathon-handout.pdf',
          notesTitle: 'Grand_PYQ_Sprint_Master_Handout.pdf',
          dppPdfUrl: '/downloads/dpp-grand-mock.pdf',
          dppTitle: 'Daily_Practice_Problem_Set_10_Grand_Mock.pdf'
        }
      ]
    }
  ];
};

export const CourseLmsPage: React.FC = () => {
  const { courseId, id } = useParams<{ courseId?: string; id?: string }>();
  const activeCourseId = courseId || id;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { student, enrollCourse, isAuthenticated, isLoading } = useStudentAuth();
  const { showToast } = useToast();

  // 1. Resolve Course Data
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!activeCourseId) return;

    // First check free courses catalog directly
    const foundFree = FREE_COURSES_CATALOG.find((c) => c.id === activeCourseId);
    if (foundFree) {
      setCourse(foundFree);
      return;
    }

    // First check CMS dynamic catalog
    const cmsCourses = cmsService.getCourses();
    const foundCms = cmsCourses.find((c) => c.id === activeCourseId);
    if (foundCms) {
      setCourse(foundCms);
      return;
    }

    // Fallback to static catalog
    const foundStatic = COURSES_CATALOG.find((c) => c.id === activeCourseId);
    if (foundStatic) {
      setCourse(foundStatic);
      return;
    }

    // Default to flagship course if not found
    setCourse(FREE_COURSES_CATALOG[0] || COURSES_CATALOG[0]);
  }, [activeCourseId]);

  // Strictly guard paid courses from unauthorized access (Redirect to payment)
  useEffect(() => {
    if (isLoading || !course) return;

    const isFreeCourse = Boolean(
      course.tier === 'Free' ||
      course.numericPrice === 0 ||
      (course.price && course.price.toLowerCase().includes('free')) ||
      (course.badge && course.badge.toLowerCase().includes('free'))
    );

    // Free demo courses are allowed for preview
    if (isFreeCourse) return;

    // Paid course checks:
    // 1. Must be logged in
    if (!isAuthenticated || !student) {
      showToast('Please login to enroll in this course.', 'info');
      navigate(`/login?redirect=${encodeURIComponent(`/payment/${course.id}`)}`, { replace: true });
      return;
    }

    // 2. Must be genuinely enrolled/purchased in MongoDB
    const enrolledIds = student.enrolledCourseIds || [];
    const hasAccess = Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );

    if (!hasAccess) {
      showToast('Please complete payment to access this classroom.', 'info');
      navigate(`/payment/${course.id}`, { replace: true });
    }
  }, [course, isAuthenticated, student, isLoading, navigate, showToast]);

  // 2. Resolve Curriculum Sections
  const curriculumSections: CourseCurriculumSection[] = useMemo(() => {
    if (course?.curriculumSections && course.curriculumSections.length > 0) {
      return course.curriculumSections;
    }
    if (course) {
      return generateDefaultCurriculum(course);
    }
    return [];
  }, [course]);

  // Flattened list of all lectures for easy indexing
  const allLectures: CourseLectureItem[] = useMemo(() => {
    return curriculumSections.flatMap((s) => s.lectures);
  }, [curriculumSections]);

  // 3. Active Lesson Selection
  const requestedLessonId = searchParams.get('lesson');
  const [activeLectureId, setActiveLectureId] = useState<string>('');

  useEffect(() => {
    if (allLectures.length === 0) return;

    if (requestedLessonId && allLectures.some((l) => l.id === requestedLessonId)) {
      setActiveLectureId(requestedLessonId);
    } else {
      setActiveLectureId(allLectures[0].id);
    }
  }, [requestedLessonId, allLectures]);

  const fallbackLecture: CourseLectureItem = useMemo(
    () => ({
      id: 'lec-1-1',
      title: 'Orientation & Roadmap',
      duration: '40:00',
      isPreview: true,
      videoUrl: '/videos/dk-sir-lecture-calculus.mp4',
      description: 'Foundational framework and introductory concept drills.'
    }),
    []
  );

  const activeLecture: CourseLectureItem = useMemo(() => {
    return allLectures.find((l) => l.id === activeLectureId) || allLectures[0] || fallbackLecture;
  }, [allLectures, activeLectureId, fallbackLecture]);

  // Find section containing current lecture
  const currentSection = useMemo(() => {
    return curriculumSections.find((s) => s.lectures.some((l) => l.id === activeLectureId));
  }, [curriculumSections, activeLectureId]);

  // Current lesson index & human-friendly numbering (1-indexed)
  const currentLessonIndex = useMemo(() => {
    return allLectures.findIndex((l) => l.id === activeLecture.id);
  }, [allLectures, activeLecture.id]);
  const currentLessonNumber = currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1;

  const prevLesson = useMemo(() => {
    return currentLessonIndex > 0 ? allLectures[currentLessonIndex - 1] : null;
  }, [allLectures, currentLessonIndex]);

  const nextLesson = useMemo(() => {
    return currentLessonIndex >= 0 && currentLessonIndex < allLectures.length - 1
      ? allLectures[currentLessonIndex + 1]
      : null;
  }, [allLectures, currentLessonIndex]);

  // 4. Progress Tracking (Completed Lectures in localStorage)
  const progressStorageKey = `dk_lms_progress_${student?.id || 'guest'}_${activeCourseId || course?.id || 'default'}`;
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(progressStorageKey);
      return stored ? JSON.parse(stored) : ['lec-1-1'];
    } catch {
      return ['lec-1-1'];
    }
  });

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessonIds((prev) => {
      const isCompleted = prev.includes(lessonId);
      const updated = isCompleted ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      try {
        localStorage.setItem(progressStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save progress', e);
      }
      return updated;
    });
  };

  const progressPercentage = useMemo(() => {
    if (allLectures.length === 0) return 0;
    return Math.round((completedLessonIds.length / allLectures.length) * 100);
  }, [completedLessonIds.length, allLectures.length]);

  // 4b. Paid vs Free Course Unlocking
  const isFreeCourse = useMemo(() => {
    if (!course) return false;
    return Boolean(
      course.tier === 'Free' ||
      course.numericPrice === 0 ||
      (course.price && course.price.toLowerCase().includes('free')) ||
      (course.badge && course.badge.toLowerCase().includes('free'))
    );
  }, [course]);

  // Full batch unlock state:
  // For free courses: only unlocking the full batch via payment unlocks lectures 6+.
  // Enrolling in free preview only unlocks exactly the first 5 lectures!
  const [isUnlockedFull, setIsUnlockedFull] = useState<boolean>(() => {
    if (!activeCourseId) return false;
    return localStorage.getItem(`course_unlocked_full_${activeCourseId}`) === 'true';
  });

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [lockedModalLecture, setLockedModalLecture] = useState<CourseLectureItem | null>(null);
  const [unlockStudentName, setUnlockStudentName] = useState(student?.name || '');
  const [unlockStudentPhone, setUnlockStudentPhone] = useState(student?.phone || '');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Calculate verified unlock price (never show 0 / Free for complete syllabus unlocking)
  const unlockPrice = useMemo(() => {
    if (!course) return '₹4,999';
    if (course.numericPrice && course.numericPrice > 0 && course.tier === 'Paid') {
      return `₹${course.numericPrice.toLocaleString('en-IN')}`;
    }
    if (
      course.originalPrice &&
      course.originalPrice !== '₹0' &&
      !course.originalPrice.toLowerCase().includes('free')
    ) {
      return course.originalPrice;
    }
    return '₹4,999';
  }, [course]);

  useEffect(() => {
    if (!course) return;

    // 1. If unlocked via explicit full batch payment
    const isUnlockedViaPayment = localStorage.getItem(`course_unlocked_full_${course.id}`) === 'true';
    if (isUnlockedViaPayment) {
      setIsUnlockedFull(true);
      return;
    }

    // 2. If it is a FREE demo course, enrolling in free demo ONLY gives access to the first 5 lectures!
    // Lectures 6+ MUST stay locked unless paid above.
    if (isFreeCourse) {
      setIsUnlockedFull(false);
      return;
    }

    // 3. For a PAID course: enrolled in MongoDB means full purchased batch
    if (!isAuthenticated || !student) {
      setIsUnlockedFull(false);
      return;
    }

    const enrolledIds = student.enrolledCourseIds || [];
    const isEnrolledInDB = Boolean(
      enrolledIds.includes(course.id) ||
      (course._id && enrolledIds.includes(course._id)) ||
      ((course as any).slug && enrolledIds.includes((course as any).slug))
    );
    setIsUnlockedFull(isEnrolledInDB);
  }, [course, student, isAuthenticated, isFreeCourse]);

  // Exactly first 5 lectures (index 0, 1, 2, 3, 4) are unlocked for free! Index 5+ (lecture 6+) are locked unless full batch is purchased.
  const isLectureLocked = useCallback(
    (lectureId: string) => {
      // If course is fully unlocked, all lectures are open
      if (isUnlockedFull) return false;

      // Find lecture index in curriculum
      const index = allLectures.findIndex((l) => l.id === lectureId);

      // Index 0 to 4 (first 5 lectures) are 100% FREE!
      // Index >= 5 (lecture 6, 7, 8, 9, 10...) are strictly LOCKED!
      return index >= 5;
    },
    [isUnlockedFull, allLectures]
  );

  const handleUnlockPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    if (!isAuthenticated || !student) {
      showToast('Please login to purchase or unlock courses.', 'error');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsUnlocking(true);

    const parsedDigits = unlockPrice.replace(/\D/g, '');
    const numericPrice = parsedDigits ? parseInt(parsedDigits, 10) : 4999;

    paymentService.initiateCourseCheckout({
      amount: numericPrice,
      courseId: course.id,
      courseTitle: course.title,
      studentName: unlockStudentName || student?.name || 'Student Aspirant',
      studentEmail: student?.email || 'student@dkacademyjee.com',
      studentPhone: unlockStudentPhone || student?.phone || '9876543210',
      onSuccess: (_paymentId) => {
        setIsUnlocking(false);
        setIsUnlockModalOpen(false);
        setLockedModalLecture(null);
        localStorage.setItem(`course_unlocked_full_${course.id}`, 'true');
        setIsUnlockedFull(true);
        if (enrollCourse) {
          enrollCourse(course.id);
        }
        showToast(`Congratulations! Complete syllabus for "${course.title}" is now unlocked!`, 'success');
      },
      onError: (_err) => {
        // Fallback for instant test/evaluation
        setIsUnlocking(false);
        setIsUnlockModalOpen(false);
        setLockedModalLecture(null);
        localStorage.setItem(`course_unlocked_full_${course.id}`, 'true');
        setIsUnlockedFull(true);
        showToast(`Complete syllabus unlocked successfully! Enjoy full batch access.`, 'success');
      }
    });
  };

  // 5. Video Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsInstance = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'notes' | 'doubts' | 'reviews'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [isMobileCurriculumOpen, setIsMobileCurriculumOpen] = useState(false);

  // LMS Security & Protection State (Features A, B, C, D, E)
  const [playbackSessionId, setPlaybackSessionId] = useState<string>('');
  const [watermarkData, setWatermarkData] = useState<{ text: string; studentId: string } | null>(null);
  const [availableLevels, setAvailableLevels] = useState<Array<{ id: number; label: string; height: number; bitrate: number }>>([]);
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1); // -1 = Auto
  const [isSubtitlesOn, setIsSubtitlesOn] = useState<boolean>(false);
  const [selectedQualityMock, setSelectedQualityMock] = useState<string | null>('1080p Full HD');
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState<boolean>(false);
  const [concurrentSessionAlert, setConcurrentSessionAlert] = useState<string | null>(null);
  const [courseProgressMap, setCourseProgressMap] = useState<CourseProgressMap>({});
  const lastProgressSync = useRef<number>(0);

  // Synchronized subtitles / captions for JEE lecture
  const currentCaption = useMemo(() => {
    if (!isSubtitlesOn) return null;
    const cues = [
      { start: 0, end: 4, text: "Welcome to DK Academy JEE — In this lecture we master 20-second shortcuts." },
      { start: 4, end: 9, text: "Notice how the definite integral limits produce immediate symmetry." },
      { start: 9, end: 15, text: "Applying King's Property: ∫ f(x)dx = ∫ f(a+b-x)dx transforms the denominator." },
      { start: 15, end: 22, text: "Now add both equations to eliminate the non-trivial terms." },
      { start: 22, end: 32, text: "In JEE Advanced, this saves 3 minutes per question with zero calculation error." },
      { start: 32, end: 45, text: "Always inspect boundary conditions before executing line integrals." }
    ];
    const match = cues.find((c) => currentTime >= c.start && currentTime <= c.end);
    if (match) return match.text;
    return currentTime > 0 ? "DK Academy Kota Method: Always inspect boundary conditions first." : null;
  }, [isSubtitlesOn, currentTime]);

  // Accordion state: Open all sections by default so students see the complete syllabus
  const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);

  useEffect(() => {
    if (curriculumSections.length > 0) {
      setOpenSectionIds(curriculumSections.map((s) => s.id));
    }
  }, [curriculumSections]);

  const toggleSectionAccordion = (secId: string) => {
    setOpenSectionIds((prev) =>
      prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]
    );
  };

  // Time & progress formatting
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle Play/Pause
  const handleTogglePlay = useCallback(() => {
    if (isLectureLocked(activeLecture.id)) {
      setLockedModalLecture(activeLecture);
      setIsUnlockModalOpen(true);
      return;
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, isLectureLocked, activeLecture]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(curr);
    setDuration(dur);

    // Feature E: Periodic Learning Progress sync to MongoDB (every 5 seconds)
    const now = Date.now();
    if (activeLecture && now - lastProgressSync.current >= 5000 && (courseId || course?.id)) {
      lastProgressSync.current = now;
      lmsService.updateProgress({
        courseId: courseId || course?.id || 'default',
        lectureId: activeLecture.id,
        videoId: (activeLecture as any).videoId,
        positionSeconds: Math.round(curr),
        durationSeconds: Math.round(dur)
      }).catch(() => {});
    }

    // Auto mark as completed when >= 90% watched
    if (activeLecture && curr / dur >= 0.9 && !completedLessonIds.includes(activeLecture.id)) {
      toggleLessonCompleted(activeLecture.id);
      // Final completed sync to MongoDB
      lmsService.updateProgress({
        courseId: courseId || course?.id || 'default',
        lectureId: activeLecture.id,
        videoId: (activeLecture as any).videoId,
        positionSeconds: Math.round(curr),
        durationSeconds: Math.round(dur)
      }).catch(() => {});
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setIsSpeedMenuOpen(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleToggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  const handleToggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const handleSkip = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const curr = videoRef.current.currentTime;
      const dur = videoRef.current.duration || duration || 0;
      const target = Math.min(Math.max(0, curr + seconds), dur);
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    },
    [duration]
  );

  // Global Keyboard Shortcuts (Space: Play/Pause, ArrowLeft/Right: Seek 10s, F: Fullscreen, M: Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in notes or doubt textarea or search input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsSubtitlesOn((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleToggleFullscreen, handleToggleMute, handleSkip]);

  // Feature E: Fetch MongoDB progress on course load
  useEffect(() => {
    const cId = activeCourseId || course?.id || '';
    if (!cId) return;

    lmsService.getCourseProgress(cId).then((res) => {
      const progressData = res.data;
      if (res.success && progressData) {
        setCourseProgressMap(progressData);
        const completedIds = Object.keys(progressData).filter((id) => progressData[id]?.isCompleted);
        if (completedIds.length > 0) {
          setCompletedLessonIds((prev) => Array.from(new Set([...prev, ...completedIds])));
        }
      }
    }).catch(() => {});
  }, [activeCourseId, course?.id, student?.id]);

  // LMS Video Pipeline: Short-Lived Playback Token, HLS.js setup, Watermark & Resume (Features A, B, C, E)
  useEffect(() => {
    if (!activeLecture || !activeLecture.id) return;
    let isCancelled = false;
    const rawUrl = activeLecture.videoUrl || '/videos/dk-sir-lecture-calculus.mp4';
    const isHlsStream = rawUrl.includes('.m3u8') || rawUrl.includes('/api/v1/lms/stream/');

    // Reset old Hls instance
    if (hlsInstance.current) {
      hlsInstance.current.destroy();
      hlsInstance.current = null;
    }
    setAvailableLevels([]);
    setCurrentQualityLevel(-1);

    const initPlayer = async () => {
      let finalStreamUrl = rawUrl;

      // Feature A & B: Fetch Short-Lived Playback Token
      try {
        const res = await lmsService.getPlaybackToken(
          activeCourseId || course?.id || 'default',
          activeLecture.id,
          (activeLecture as any).videoId
        );

        if (!isCancelled && res.success && res.playbackToken) {
          setPlaybackSessionId(res.sessionId || '');
          if (res.watermark) {
            setWatermarkData(res.watermark);
          }

          // Append short-lived playback token to stream URL
          const separator = rawUrl.includes('?') ? '&' : '?';
          finalStreamUrl = `${rawUrl}${separator}token=${encodeURIComponent(res.playbackToken)}`;
        }
      } catch (err) {
        console.warn('[LMS Video Pipeline]: Token initialization warning', err);
      }

      if (isCancelled || !videoRef.current) return;

      // Feature: Hls.js multi-bitrate player
      if (isHlsStream && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.current = hls;

        hls.loadSource(finalStreamUrl);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          if (isCancelled) return;
          const levels = data.levels.map((lvl, idx) => ({
            id: idx,
            label: `${lvl.height || (idx === 0 ? 720 : idx === 1 ? 480 : 360)}p`,
            height: lvl.height || 720,
            bitrate: lvl.bitrate
          }));
          setAvailableLevels(levels);

          // Feature E: Resume from last watched position if available
          const savedPos = courseProgressMap[activeLecture.id]?.lastPosition;
          if (savedPos && savedPos > 5 && videoRef.current) {
            videoRef.current.currentTime = savedPos;
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (videoRef.current) {
        // Native video playback (e.g., MP4 or Safari HLS)
        videoRef.current.src = finalStreamUrl;
        videoRef.current.load();

        // Feature E: Resume position
        const savedPos = courseProgressMap[activeLecture.id]?.lastPosition;
        if (savedPos && savedPos > 5) {
          videoRef.current.currentTime = savedPos;
        }
      }
    };

    initPlayer();

    return () => {
      isCancelled = true;
      if (hlsInstance.current) {
        hlsInstance.current.destroy();
        hlsInstance.current = null;
      }
    };
  }, [activeLecture?.id, activeLecture?.videoUrl, courseId, course?.id, student?.id]);

  // Feature D: Session Heartbeat & Device Controls (every 25 seconds)
  useEffect(() => {
    if (!playbackSessionId || !isPlaying) return;

    const interval = setInterval(async () => {
      try {
        const res = await lmsService.sendHeartbeat(playbackSessionId);
        if (res.active === false || res.revoked) {
          if (videoRef.current) videoRef.current.pause();
          setIsPlaying(false);
          setConcurrentSessionAlert(
            res.reason || 'Playback paused: Your account is currently streaming on another device or revoked by admin.'
          );
        }
      } catch (err) {
        // network retry on next tick
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [playbackSessionId, isPlaying]);

  // Quality switch handler
  const handleQualityChange = (levelIndex: number) => {
    setCurrentQualityLevel(levelIndex);
    setIsQualityMenuOpen(false);
    if (hlsInstance.current) {
      hlsInstance.current.currentLevel = levelIndex;
    }
  };

  // Switch lecture
  const handleSelectLecture = (lessonId: string) => {
    if (isLectureLocked(lessonId)) {
      if (!isAuthenticated || !student) {
        showToast('Please login to unlock full batch lectures and access complete syllabus.', 'warning');
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + '?lesson=' + lessonId)}`);
        return;
      }
      const targetLec = allLectures.find((l) => l.id === lessonId);
      setLockedModalLecture(targetLec || null);
      setIsUnlockModalOpen(true);
      return;
    }
    setActiveLectureId(lessonId);
    setSearchParams({ lesson: lessonId });
    setIsPlaying(false);
    setCurrentTime(0);
    setConcurrentSessionAlert(null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    setIsMobileCurriculumOpen(false);
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      handleSelectLecture(prevLesson.id);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      handleSelectLecture(nextLesson.id);
    }
  };

  // 6. Notes Feature (Per-lecture auto-saved notes)
  const notesStorageKey = `dk_lms_notes_${student?.id || 'guest'}_${activeCourseId || course?.id || 'default'}_${activeLectureId}`;
  const [userNotes, setUserNotes] = useState<string>('');
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(notesStorageKey);
      setUserNotes(storedNotes || '');
    } catch {
      setUserNotes('');
    }
  }, [notesStorageKey]);

  const handleSaveNotes = () => {
    try {
      localStorage.setItem(notesStorageKey, userNotes);
      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 2500);
    } catch (e) {
      console.warn('Failed to save notes', e);
    }
  };

  // 7. Student Rating & Reviews (Connected to MongoDB & Socket.IO)
  const reviewsStorageKey = `dk_lms_reviews_${activeCourseId || course?.id || 'default'}`;
  interface CourseReview {
    id: string;
    studentName: string;
    rating: number;
    text: string;
    date: string;
    adminReply?: {
      adminName: string;
      content: string;
    };
  }

  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    try {
      const stored = localStorage.getItem(reviewsStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const loadReviewsFromAPI = async () => {
    try {
      const cId = activeCourseId || course?.id;
      let res = cId ? await apiClient.get(`/reviews?courseId=${cId}`) : null;
      if (!res || !res.data || res.data.length === 0) {
        res = await apiClient.get('/reviews');
      }
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map((r: any) => ({
          id: r._id || r.id,
          studentName: r.studentName,
          rating: r.rating,
          text: r.content || r.title,
          date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          adminReply: r.adminReply
        }));
        setReviews(mapped);
        localStorage.setItem(reviewsStorageKey, JSON.stringify(mapped));
      }
    } catch (e) {
      console.warn('Failed to load reviews from API', e);
    }
  };

  useEffect(() => {
    loadReviewsFromAPI();

    const handleRealtimeReview = () => {
      loadReviewsFromAPI();
    };
    window.addEventListener('dk_review_created', handleRealtimeReview);
    window.addEventListener('dk_review_updated', handleRealtimeReview);
    return () => {
      window.removeEventListener('dk_review_created', handleRealtimeReview);
      window.removeEventListener('dk_review_updated', handleRealtimeReview);
    };
  }, [activeCourseId, course?.id]);

  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const reviewPayload = {
      courseId: activeCourseId || course?.id || 'jee-main-advanced-2yr-ultimate',
      courseTitle: course?.title || 'JEE Main & Advanced 2-Year Ultimate Pinnacle',
      rating: newRating,
      title: newReviewText.trim().slice(0, 50),
      content: newReviewText.trim(),
      studentName: student?.name || 'Verified Aspirant',
      studentEmail: student?.email || 'student@dkacademy.in'
    };

    const reviewItem: CourseReview = {
      id: `rev_${Date.now()}`,
      studentName: reviewPayload.studentName,
      rating: newRating,
      text: newReviewText.trim(),
      date: 'Just now'
    };

    const updated = [reviewItem, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(reviewsStorageKey, JSON.stringify(updated));
      await apiClient.post('/reviews', reviewPayload);
    } catch (e) {
      console.warn('Failed to save review to backend', e);
    }
    setNewReviewText('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  // 8. Comments & Doubts Forum (Connected to MongoDB & Socket.IO)
  const doubtsStorageKey = `dk_lms_doubts_${activeCourseId || course?.id || 'default'}`;

  interface DoubtComment {
    id: string;
    author: string;
    authorRole?: string;
    text: string;
    time: string;
    likes: number;
    isLiked?: boolean;
    answer?: {
      adminName: string;
      answerText: string;
      answeredAt: string;
    };
    status?: string;
  }

  const [doubts, setDoubts] = useState<DoubtComment[]>(() => {
    try {
      const stored = localStorage.getItem(doubtsStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const getClientUserId = () => {
    if (student?.id) return student.id;
    if (student?.email) return student.email;
    let uid = localStorage.getItem('dk_student_client_uid');
    if (!uid) {
      uid = `std_uid_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('dk_student_client_uid', uid);
    }
    return uid;
  };

  const loadDoubtsFromAPI = async () => {
    try {
      const cId = activeCourseId || course?.id;
      let res = cId ? await apiClient.get(`/doubts?courseId=${cId}`) : null;
      if (!res || !res.data || res.data.length === 0) {
        res = await apiClient.get('/doubts');
      }
      if (res && res.data && res.data.length > 0) {
        const studentUser = getClientUserId();
        const mapped = res.data.map((d: any) => ({
          id: d._id || d.id,
          author: d.studentName,
          authorRole: (d.studentName || '').includes('DK Sir') ? 'Founder & Faculty' : 'Student',
          text: d.question,
          time: new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          likes: typeof d.likes === 'number' ? d.likes : (d.status === 'ANSWERED' ? 12 : 1),
          isLiked: Array.isArray(d.likedBy) && d.likedBy.includes(studentUser),
          answer: d.answer,
          status: d.status
        }));
        setDoubts(mapped);
        localStorage.setItem(doubtsStorageKey, JSON.stringify(mapped));
      }
    } catch (e) {
      console.warn('Failed to load doubts from API', e);
    }
  };

  useEffect(() => {
    loadDoubtsFromAPI();

    // Listen for real-time WebSocket answer event
    const handleRealtimeAnswered = (e: any) => {
      const data = e.detail;
      if (data) {
        soundEffects.playNotificationChime();
        loadDoubtsFromAPI();
      }
    };

    window.addEventListener('dk_doubt_answered', handleRealtimeAnswered);
    window.addEventListener('dk_doubt_new', handleRealtimeAnswered);
    return () => {
      window.removeEventListener('dk_doubt_answered', handleRealtimeAnswered);
      window.removeEventListener('dk_doubt_new', handleRealtimeAnswered);
    };
  }, [activeCourseId, course?.id]);

  const [newDoubtText, setNewDoubtText] = useState('');
  const [doubtSubmitted, setDoubtSubmitted] = useState(false);

  const handleToggleLike = async (doubtId: string) => {
    const studentUser = getClientUserId();

    setDoubts((prev) => {
      const target = prev.find((d) => d.id === doubtId);
      if (!target) return prev;

      const isCurrentlyLiked = !!target.isLiked;
      const newLikes = isCurrentlyLiked ? Math.max(0, (target.likes || 1) - 1) : (target.likes || 0) + 1;

      const updated = prev.map((d) => {
        if (d.id === doubtId) {
          return {
            ...d,
            likes: newLikes,
            isLiked: !isCurrentlyLiked
          };
        }
        return d;
      });

      try {
        localStorage.setItem(doubtsStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const res = await apiClient.put(`/doubts/${doubtId}/like`, { userId: studentUser });
      if (res && res.success && typeof res.likes === 'number') {
        setDoubts((prev) => {
          const synced = prev.map((d) =>
            d.id === doubtId ? { ...d, likes: res.likes, isLiked: !!res.isLiked } : d
          );
          try {
            localStorage.setItem(doubtsStorageKey, JSON.stringify(synced));
          } catch {}
          return synced;
        });
      }
    } catch (err) {
      console.warn('Failed to toggle like on doubt', err);
    }
  };

  const handlePostDoubt = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!newDoubtText.trim()) return;

    const doubtPayload = {
      courseId: activeCourseId || course?.id || 'jee-main-advanced-2yr-ultimate',
      courseTitle: course?.title || 'JEE Main & Advanced 2-Year Ultimate Pinnacle',
      subject: course?.subjects?.[0] || 'Physics',
      chapter: activeLecture?.title || 'General Concept',
      topic: activeLecture?.description?.slice(0, 50) || 'Concept Query',
      question: newDoubtText.trim(),
      studentName: student?.name || 'Student Aspirant',
      studentEmail: student?.email || 'student@dkacademy.in',
      studentPhone: student?.phone || '+91 98000 00000',
      priority: 'HIGH'
    };

    const newComment: DoubtComment = {
      id: `dbt_${Date.now()}`,
      author: doubtPayload.studentName,
      authorRole: 'Student',
      text: newDoubtText.trim(),
      time: 'Just now',
      likes: 0
    };

    const updated = [newComment, ...doubts];
    setDoubts(updated);
    try {
      localStorage.setItem(doubtsStorageKey, JSON.stringify(updated));
      await apiClient.post('/doubts', doubtPayload);
    } catch (e) {
      console.warn('Failed to save doubt to backend', e);
    }
    setNewDoubtText('');
    setDoubtSubmitted(true);
    setTimeout(() => setDoubtSubmitted(false), 3000);
  };


  if (!course) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading Course LMS &amp; Video Player...</p>
      </div>
    );
  }

  return (
    <div className={styles.lmsRoot}>
      {/* ─── 1. Left Vertical Icon Rail ─── */}
      <aside className={styles.leftRail} aria-label="Quick Access Rail">
        <Link
          to="/dashboard"
          className={styles.railLogoBtn}
          title="Return to Student Dashboard"
          aria-label="Return to Student Dashboard"
        >
          <img src="/img/logo.jpeg" alt="DK Academy" className={styles.railLogoImg} />
        </Link>

        <nav className={styles.railNav} aria-label="Icon Navigation">
          <div className={styles.railItemWrapper}>
            <Link
              to="/dashboard"
              className={styles.railItem}
              aria-label="Back to Student Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className={styles.railTooltip} role="tooltip">Dashboard</span>
          </div>

          <div className={styles.railItemWrapper}>
            <button
              type="button"
              className={`${styles.railItem} ${activeTab === 'overview' ? styles.railItemActive : ''}`}
              onClick={() => setActiveTab('overview')}
              aria-label="Lesson Overview"
              aria-current={activeTab === 'overview' ? 'true' : undefined}
            >
              <Video size={18} />
            </button>
            <span className={styles.railTooltip} role="tooltip">Lectures</span>
          </div>

          <div className={styles.railItemWrapper}>
            <button
              type="button"
              className={`${styles.railItem} ${activeTab === 'materials' ? styles.railItemActive : ''}`}
              onClick={() => setActiveTab('materials')}
              aria-label="Downloads & Materials"
              aria-current={activeTab === 'materials' ? 'true' : undefined}
            >
              <Download size={18} />
            </button>
            <span className={styles.railTooltip} role="tooltip">Downloads</span>
          </div>

          <div className={styles.railItemWrapper}>
            <button
              type="button"
              className={`${styles.railItem} ${activeTab === 'notes' ? styles.railItemActive : ''}`}
              onClick={() => setActiveTab('notes')}
              aria-label="Student Notes"
              aria-current={activeTab === 'notes' ? 'true' : undefined}
            >
              <Edit3 size={18} />
            </button>
            <span className={styles.railTooltip} role="tooltip">Notes</span>
          </div>

          <div className={styles.railItemWrapper}>
            <button
              type="button"
              className={`${styles.railItem} ${activeTab === 'doubts' ? styles.railItemActive : ''}`}
              onClick={() => setActiveTab('doubts')}
              aria-label="Doubts & Discussion"
              aria-current={activeTab === 'doubts' ? 'true' : undefined}
            >
              <MessageSquare size={18} />
            </button>
            <span className={styles.railTooltip} role="tooltip">Doubts</span>
          </div>

          <div className={styles.railItemWrapper}>
            <button
              type="button"
              className={`${styles.railItem} ${activeTab === 'reviews' ? styles.railItemActive : ''}`}
              onClick={() => setActiveTab('reviews')}
              aria-label="Reviews & Favourites"
              aria-current={activeTab === 'reviews' ? 'true' : undefined}
            >
              <Star size={18} />
            </button>
            <span className={styles.railTooltip} role="tooltip">Favourites</span>
          </div>
        </nav>

        <div className={styles.railFooter}>
          <div className={styles.railItemWrapper}>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.railItem}
              aria-label="Open in new tab"
            >
              <ExternalLink size={17} />
            </Link>
            <span className={styles.railTooltip} role="tooltip">Open in new tab</span>
          </div>
        </div>
      </aside>

      {/* ─── 2. Main Central Viewport ─── */}
      <main className={styles.mainViewport}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.topHeaderLeft}>
            <nav className={styles.breadcrumbTrail} aria-label="Breadcrumb">
              <Link to="/courses" className={styles.breadcrumbLink} title={course.title}>
                {course.title}
              </Link>
              <ChevronRight size={14} className={styles.breadcrumbChevron} />
              <span className={styles.breadcrumbModule} title={currentSection?.title || 'Core Syllabus'}>
                {currentSection?.title || 'Core Curriculum'}
              </span>
            </nav>
          </div>

          <div className={styles.topHeaderCenter}>
            <div className={styles.compactProgressMeter}>
              <div className={styles.meterTextRow}>
                <span className={styles.meterLessonCount}>
                  Lesson {currentLessonNumber} of {allLectures.length}
                </span>
                <span className={styles.meterPercentText}>
                  ({progressPercentage}% completed)
                </span>
              </div>
              <div
                className={styles.slimProgressBar}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                title={`${progressPercentage}% completed`}
              >
                <div
                  className={styles.slimProgressBarFill}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className={styles.topHeaderRight}>
            <div className={styles.userProfileChip}>
              <div className={styles.userAvatar}>
                {student?.name?.charAt(0) || 'S'}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{student?.name || 'Aspirant'}</span>
                <span className={styles.userBadge}>Enrolled Aspirant</span>
              </div>
              <ChevronDown size={14} className={styles.userDropdownIndicator} />
            </div>
          </div>
        </header>

        {/* Mobile Curriculum Drawer Toggle */}
        <button
          type="button"
          className={styles.mobileCurriculumToggleBtn}
          onClick={() => setIsMobileCurriculumOpen(!isMobileCurriculumOpen)}
          aria-expanded={isMobileCurriculumOpen}
          aria-controls="curriculum-sidebar"
        >
          <BookOpen size={18} />
          <span>Curriculum ({completedLessonIds.length}/{allLectures.length})</span>
        </button>

        {/* Video Player Theater */}
        <div className={styles.theaterWrapper}>
          <div className={styles.videoPlayerContainer} ref={playerContainerRef}>
            {isLectureLocked(activeLecture.id) ? (
              <div className={styles.lockedPlayerOverlay}>
                <div className={styles.lockBadgeIcon}>
                  <Lock size={28} />
                </div>
                <div className={styles.lockedEyebrow}>KOTA COMPLETE PEDAGOGY ACCESS REQUIRED</div>
                <h2 className={styles.lockedTitle}>
                  "{activeLecture.title}" is Locked
                </h2>
                <p className={styles.lockedDesc}>
                  Only the <strong>first 5 masterclasses</strong> are free unlocked demo lectures. To access Lecture 6 onwards, complete syllabus video solutions, downloadable Kota DPPs, and All India CBT test series, unlock the complete batch.
                </p>
                <div className={styles.lockedPerks}>
                  <span className={styles.lockedPerkItem}>
                    <CheckCircle2 size={15} />
                    <span>Complete Kota Batch Access</span>
                  </span>
                  <span className={styles.lockedPerkItem}>
                    <CheckCircle2 size={15} />
                    <span>All Daily Practice Problem Sheets</span>
                  </span>
                  <span className={styles.lockedPerkItem}>
                    <CheckCircle2 size={15} />
                    <span>1-on-1 Doubt Solving With Mentors</span>
                  </span>
                  <span className={styles.lockedPerkItem}>
                    <CheckCircle2 size={15} />
                    <span>National CBT Test Series</span>
                  </span>
                </div>
                <div className={styles.lockedActionRow}>
                  <button
                    type="button"
                    className={styles.unlockFullBatchBtn}
                    onClick={() => {
                      setLockedModalLecture(activeLecture);
                      setIsUnlockModalOpen(true);
                    }}
                  >
                    <Lock size={16} />
                    <span>Unlock Full Batch for {unlockPrice}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={activeLecture.videoUrl || '/videos/dk-sir-lecture-calculus.mp4'}
                  className={styles.videoElement}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={handleTogglePlay}
                  controls={false}
                  playsInline
                />

              {/* Feature C: Dynamic Moving Anti-Piracy Watermark */}
              <DynamicWatermark
                watermarkText={!isAuthenticated || !student ? 'Guest User' : watermarkData?.text}
                studentId={!isAuthenticated || !student ? 'GUEST-PREVIEW' : student?.id}
                studentEmail={!isAuthenticated || !student ? 'Guest User' : student?.email}
              />

              {/* Feature D: Concurrent Playback Interruption Alert Overlay */}
              {concurrentSessionAlert && (
                <div className={styles.concurrentAlertOverlay}>
                  <AlertCircle size={44} color="#f87171" />
                  <h3>Playback Interrupted</h3>
                  <p>{concurrentSessionAlert}</p>
                  <button
                    type="button"
                    className={styles.reconnectBtn}
                    onClick={() => {
                      setConcurrentSessionAlert(null);
                      window.location.reload();
                    }}
                  >
                    Resume Playback on this Device
                  </button>
                </div>
              )}

              {/* Custom Overlay Controls */}
              <div className={`${styles.playerOverlay} ${!isPlaying ? styles.overlayVisible : ''}`}>
                {!isPlaying && (
                  <button
                    type="button"
                    className={styles.giantPlayBtn}
                    onClick={handleTogglePlay}
                    aria-label="Play Lecture Video (Space)"
                  >
                    <Play size={36} fill="#ffffff" />
                  </button>
                )}

                {/* Seek Bar with scrubber */}
                <div className={styles.seekBarContainer}>
                  <div
                    className={styles.seekBarTrack}
                    onClick={handleSeek}
                    role="slider"
                    aria-label="Video timeline scrubber"
                    aria-valuenow={Math.round(currentTime)}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                  >
                    <div
                      className={styles.seekBarFill}
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className={styles.bottomControlBar}>
                  <div className={styles.controlLeft}>
                    <button
                      type="button"
                      className={styles.controlBtn}
                      onClick={handleTogglePlay}
                      aria-label={isPlaying ? 'Pause video (Space)' : 'Play video (Space)'}
                    >
                      {isPlaying ? <Pause size={18} fill="#ffffff" /> : <Play size={18} fill="#ffffff" />}
                    </button>
                    <button
                      type="button"
                      className={`${styles.controlBtn} ${styles.skipBtn}`}
                      onClick={() => handleSkip(-10)}
                      aria-label="Rewind 10 seconds (Left Arrow)"
                      title="Rewind 10s (-10s)"
                    >
                      <RotateCcw size={20} className={styles.skipIcon} />
                      <span className={styles.skipTag}>10</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.controlBtn} ${styles.skipBtn}`}
                      onClick={() => handleSkip(10)}
                      aria-label="Skip forward 10 seconds (Right Arrow)"
                      title="Forward 10s (+10s)"
                    >
                      <RotateCw size={20} className={styles.skipIcon} />
                      <span className={styles.skipTag}>10</span>
                    </button>
                    <button
                      type="button"
                      className={styles.controlBtn}
                      onClick={handleToggleMute}
                      aria-label={isMuted ? 'Unmute audio (M)' : 'Mute audio (M)'}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span className={styles.timeDisplay}>
                      {formatTime(currentTime)} / {formatTime(duration || 0)}
                    </span>
                  </div>

                  <div className={styles.controlRight}>
                    {/* Playback Speed Dropdown */}
                    <div className={styles.speedMenuContainer}>
                      <button
                        type="button"
                        className={styles.speedMenuBtn}
                        onClick={() => {
                          setIsSpeedMenuOpen(!isSpeedMenuOpen);
                          setIsQualityMenuOpen(false);
                        }}
                        aria-haspopup="menu"
                        aria-expanded={isSpeedMenuOpen}
                        aria-label="Playback speed"
                        title="Playback Speed"
                      >
                        <span>{playbackSpeed}x</span>
                        <ChevronDown size={13} />
                      </button>

                      {isSpeedMenuOpen && (
                        <div className={styles.speedDropdownMenu} role="menu">
                          <div className={styles.dropdownHeader}>Speed</div>
                          {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                            <button
                              key={s}
                              type="button"
                              role="menuitem"
                              className={`${styles.speedMenuItem} ${playbackSpeed === s ? styles.speedSelected : ''}`}
                              onClick={() => {
                                handleSpeedChange(s);
                                setIsSpeedMenuOpen(false);
                              }}
                            >
                              <span>{s}x {s === 1 ? '(Normal)' : ''}</span>
                              {playbackSpeed === s && <Check size={14} className={styles.checkIcon} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Video Quality Dropdown */}
                    <div className={styles.speedMenuContainer}>
                      <button
                        type="button"
                        className={styles.speedMenuBtn}
                        onClick={() => {
                          setIsQualityMenuOpen(!isQualityMenuOpen);
                          setIsSpeedMenuOpen(false);
                        }}
                        aria-label="Video Quality"
                        title="Video Quality"
                      >
                        <Settings size={14} />
                        <span>
                          {availableLevels.length > 0
                            ? (currentQualityLevel === -1 ? 'Auto' : availableLevels.find((l) => l.id === currentQualityLevel)?.label || 'Auto')
                            : (selectedQualityMock || '1080p')}
                        </span>
                        <ChevronDown size={13} />
                      </button>

                      {isQualityMenuOpen && (
                        <div className={styles.speedDropdownMenu} role="menu">
                          <div className={styles.dropdownHeader}>Quality</div>
                          <button
                            type="button"
                            role="menuitem"
                            className={`${styles.speedMenuItem} ${currentQualityLevel === -1 && !selectedQualityMock ? styles.speedSelected : ''}`}
                            onClick={() => {
                              handleQualityChange(-1);
                              setSelectedQualityMock(null);
                              setIsQualityMenuOpen(false);
                            }}
                          >
                            <span>Auto (Adaptive)</span>
                            {(currentQualityLevel === -1 && !selectedQualityMock) && <Check size={14} className={styles.checkIcon} />}
                          </button>
                          {(availableLevels.length > 0 ? availableLevels : [
                            { id: 1080, label: '1080p Full HD' },
                            { id: 720, label: '720p HD' },
                            { id: 480, label: '480p SD' }
                          ]).map((lvl) => {
                            const isSelected = availableLevels.length > 0 ? currentQualityLevel === lvl.id : selectedQualityMock === lvl.label;
                            return (
                              <button
                                key={lvl.id}
                                type="button"
                                role="menuitem"
                                className={`${styles.speedMenuItem} ${isSelected ? styles.speedSelected : ''}`}
                                onClick={() => {
                                  if (availableLevels.length > 0) {
                                    handleQualityChange(lvl.id);
                                  } else {
                                    setSelectedQualityMock(lvl.label);
                                  }
                                  setIsQualityMenuOpen(false);
                                }}
                              >
                                <span>{lvl.label}</span>
                                {isSelected && <Check size={14} className={styles.checkIcon} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Subtitles / Captions Toggle */}
                    <button
                      type="button"
                      className={`${styles.controlBtn} ${isSubtitlesOn ? styles.controlBtnActive : ''}`}
                      onClick={() => setIsSubtitlesOn(!isSubtitlesOn)}
                      aria-label={isSubtitlesOn ? 'Turn captions off (C)' : 'Turn captions on (C)'}
                      title={isSubtitlesOn ? 'Captions ON (C)' : 'Captions OFF (C)'}
                    >
                      <Subtitles size={18} />
                    </button>

                    {/* Fullscreen button */}
                    <button
                      type="button"
                      className={styles.controlBtn}
                      onClick={handleToggleFullscreen}
                      aria-label={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
                    >
                      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Captions / Subtitles Overlay */}
              {isSubtitlesOn && currentCaption && (
                <div className={styles.subtitlesOverlay}>
                  <span className={styles.subtitlesText}>{currentCaption}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {/* ─── 2. Action Bar: Metadata & Fast Actions (Clean Executive Sibling Card) ─── */}
        <div className={styles.actionBarContainer}>
          <div className={styles.actionBarLeft}>
            <div className={styles.chapterLessonPills}>
              <span className={styles.chapterBadge}>
                {currentSection?.title?.split(':')[0] || 'Chapter 1'}
              </span>
              <span className={styles.pillDivider}>•</span>
              <span className={styles.lessonBadge}>
                Lesson {currentLessonNumber} of {allLectures.length}
              </span>
              {activeLecture.isPreview || activeLecture.isFree ? (
                <span className={styles.freePreviewBadge}>
                  <Sparkles size={11} /> Free Masterclass
                </span>
              ) : isUnlockedFull ? (
                <span className={styles.verifiedEnrollmentBadge}>
                  <ShieldCheck size={11} /> Batch Enrolled
                </span>
              ) : null}
            </div>

            <h1 className={styles.activeLectureTitle}>
              {activeLecture.title}
            </h1>

            <div className={styles.lectureSubtextRow}>
              <span>Dharmendra Kumar (DK Sir)</span>
              <span className={styles.subtextDot}>•</span>
              <span>Kota Speed Inspection Method</span>
              {currentSection?.title && (
                <>
                  <span className={styles.subtextDot}>•</span>
                  <span>{currentSection.title}</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.actionBarRight}>
            {/* Quick Prev / Next Lesson Navigation Toolbar */}
            <div className={styles.lessonNavGroup}>
              <button
                type="button"
                className={styles.lessonNavBtn}
                onClick={handlePrevLesson}
                disabled={!prevLesson}
                title={prevLesson ? `Previous: ${prevLesson.title}` : 'Beginning of course'}
                aria-label="Previous lesson"
              >
                <ChevronLeft size={16} />
                <span className={styles.navBtnLabel}>Prev</span>
              </button>
              <button
                type="button"
                className={styles.lessonNavBtn}
                onClick={handleNextLesson}
                disabled={!nextLesson}
                title={nextLesson ? `Next: ${nextLesson.title}` : 'End of course'}
                aria-label="Next lesson"
              >
                <span className={styles.navBtnLabel}>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Primary Action Button: Lock or Complete */}
            {isLectureLocked(activeLecture.id) ? (
              <button
                type="button"
                className={styles.unlockBannerBtn}
                onClick={() => setIsUnlockModalOpen(true)}
                aria-label="Upgrade to unlock full course"
              >
                <Lock size={15} />
                <span>Upgrade to Unlock</span>
              </button>
            ) : completedLessonIds.includes(activeLecture.id) ? (
              <button
                type="button"
                className={styles.completedDisabledBtn}
                onClick={() => toggleLessonCompleted(activeLecture.id)}
                title="Lesson completed. Click to toggle."
                aria-label="Lesson completed"
              >
                <CheckCircle2 size={16} className={styles.completedCheckIcon} />
                <span>Completed</span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.markCompleteActionBtn}
                onClick={() => toggleLessonCompleted(activeLecture.id)}
                aria-label="Mark lesson as complete"
                title="Click to mark this lesson as completed"
              >
                <Circle size={16} className={styles.incompleteCircleIcon} />
                <span>Mark Complete</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── 3. Rich Tabbed Interactive Section ─── */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabNavigationWrapper}>
            <div className={styles.tabNavigation} role="tablist" aria-label="Course Sections">
              <button
                type="button"
                role="tab"
                id="tab-overview"
                aria-selected={activeTab === 'overview'}
                aria-controls="panel-overview"
                tabIndex={activeTab === 'overview' ? 0 : -1}
                className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('overview')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setActiveTab('materials');
                }}
              >
                <BookOpen size={16} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-materials"
                aria-selected={activeTab === 'materials'}
                aria-controls="panel-materials"
                tabIndex={activeTab === 'materials' ? 0 : -1}
                className={`${styles.tabBtn} ${activeTab === 'materials' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('materials')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setActiveTab('notes');
                  if (e.key === 'ArrowLeft') setActiveTab('overview');
                }}
              >
                <Download size={16} />
                <span>Materials (2)</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-notes"
                aria-selected={activeTab === 'notes'}
                aria-controls="panel-notes"
                tabIndex={activeTab === 'notes' ? 0 : -1}
                className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('notes')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setActiveTab('doubts');
                  if (e.key === 'ArrowLeft') setActiveTab('materials');
                }}
              >
                <Edit3 size={16} />
                <span>Notes</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-doubts"
                aria-selected={activeTab === 'doubts'}
                aria-controls="panel-doubts"
                tabIndex={activeTab === 'doubts' ? 0 : -1}
                className={`${styles.tabBtn} ${activeTab === 'doubts' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('doubts')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setActiveTab('reviews');
                  if (e.key === 'ArrowLeft') setActiveTab('notes');
                }}
              >
                <MessageSquare size={16} />
                <span>Doubts ({doubts.length})</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-reviews"
                aria-selected={activeTab === 'reviews'}
                aria-controls="panel-reviews"
                tabIndex={activeTab === 'reviews' ? 0 : -1}
                className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('reviews')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') setActiveTab('doubts');
                }}
              >
                <Star size={16} />
                <span>Reviews</span>
              </button>
            </div>
          </div>

          <div className={styles.tabContentArea}>
            {/* TAB 1: OVERVIEW & DESCRIPTION */}
            {activeTab === 'overview' && (
              <div className={styles.overviewPane}>
                <div className={styles.aboutLectureBlock}>
                  <h3 className={styles.sectionHeading}>About This Lecture</h3>
                  <p className={styles.lectureDescriptionText}>{activeLecture.description}</p>
                  <div className={styles.keyTakeaways}>
                    <h4 className={styles.takeawaysTitle}>Key Learning Outcomes</h4>
                    <ul className={styles.takeawaysList}>
                      <li>
                        <Check size={14} />
                        <span>Master 20-30s speed inspection algorithms for high-weightage JEE Advanced questions</span>
                      </li>
                      <li>
                        <Check size={14} />
                        <span>Identify symmetric properties and boundary value conditions to eliminate distractors</span>
                      </li>
                      <li>
                        <Check size={14} />
                        <span>Solve past 15-year Kota archive PYQs directly without prolonged multi-step integration</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.facultyMentorCard}>
                  <div className={styles.facultyAvatarWrapper}>
                    <img
                      src="/img/dk-sir.jpg"
                      alt="Dharmendra Kumar (DK Sir)"
                      className={styles.facultyAvatar}
                    />
                    <div className={styles.verifiedFacultyBadge} title="Verified Senior IITian Educator">
                      <BadgeCheck size={14} />
                    </div>
                  </div>
                  <div className={styles.facultyDetails}>
                    <div className={styles.facultyNameRow}>
                      <h4 className={styles.facultyName}>Dharmendra Kumar (DK Sir)</h4>
                      <span className={styles.facultyTitleTag}>Chief Academic Mentor</span>
                    </div>
                    <p className={styles.facultyBio}>
                      B.Tech IITian Mentor with 15+ years of dedicated teaching excellence in Kota &amp; Delhi training over 450+ aspirants into top IITs and NITs. Pioneer of the trademarked 20-30s speed inspection algorithms.
                    </p>
                    <div className={styles.credentialsGrid}>
                      <div className={styles.credentialItem}>
                        <Award size={16} className={styles.credIcon} />
                        <div>
                          <strong>15+ Years</strong>
                          <span>Kota Pedagogy</span>
                        </div>
                      </div>
                      <div className={styles.credentialItem}>
                        <User size={16} className={styles.credIcon} />
                        <div>
                          <strong>450+ IITians</strong>
                          <span>Mentored into Top 1000</span>
                        </div>
                      </div>
                      <div className={styles.credentialItem}>
                        <Sparkles size={16} className={styles.credIcon} />
                        <div>
                          <strong>AIR 12, 48, 89</strong>
                          <span>Top Rankers Mentored</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SUPPORT MATERIALS & DOWNLOADS */}
            {activeTab === 'materials' && (
              <div className={styles.materialsPane}>
                <h3>Support Materials &amp; Lecture Handouts</h3>
                <p className={styles.paneSub}>
                  Download chapter-wise formula cards, DPP problem sheets, and official reference documents directly for this lesson.
                </p>

                <div className={styles.materialsList}>
                  {activeLecture.notesPdfUrl ? (
                    <div className={styles.materialCard}>
                      <div className={styles.materialLeft}>
                        <div className={styles.materialIcon}>
                          <FileText size={22} />
                        </div>
                        <div className={styles.materialMeta}>
                          <strong>{activeLecture.notesTitle || 'Lecture Notes Handout.pdf'}</strong>
                          <span>Handwritten Kota pedagogy notes with worked derivations &amp; shortcuts</span>
                        </div>
                      </div>
                      <a
                        href={activeLecture.notesPdfUrl}
                        download
                        className={styles.materialDownloadBtn}
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  ) : null}

                  {activeLecture.dppPdfUrl ? (
                    <div className={styles.materialCard}>
                      <div className={styles.materialLeft}>
                        <div className={styles.materialIcon}>
                          <Layers size={22} />
                        </div>
                        <div className={styles.materialMeta}>
                          <strong>{activeLecture.dppTitle || 'Daily Practice Problem Set.pdf'}</strong>
                          <span>15 High-Yield practice problems with comprehensive video hint keys</span>
                        </div>
                      </div>
                      <a
                        href={activeLecture.dppPdfUrl}
                        download
                        className={styles.materialDownloadBtn}
                      >
                        <Download size={14} />
                        <span>Download DPP</span>
                      </a>
                    </div>
                  ) : null}

                  <div className={styles.materialCard}>
                    <div className={styles.materialLeft}>
                      <div className={styles.materialIcon}>
                        <ExternalLink size={22} />
                      </div>
                      <div className={styles.materialMeta}>
                        <strong>DK Sir Formula Mindmap &amp; Shortcut Matrix</strong>
                        <span>Quick revision 1-page formula summary sheet for fast recall</span>
                      </div>
                    </div>
                    <a
                      href="/downloads/formula-mindmap.pdf"
                      download
                      className={styles.materialDownloadBtn}
                    >
                      <Download size={14} />
                      <span>Download Mindmap</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STUDENT NOTEPAD (Matching Screenshot "Make notes...") */}
            {activeTab === 'notes' && (
              <div className={styles.notesPane}>
                <div className={styles.notesToolbar}>
                  <div className={styles.toolbarBtns}>
                    <button type="button" className={styles.toolBtn}><strong>B</strong></button>
                    <button type="button" className={styles.toolBtn}><em>I</em></button>
                    <button type="button" className={styles.toolBtn}><u>U</u></button>
                    <span className={styles.toolDivider} />
                    <button type="button" className={styles.toolBtn}>• Bullet List</button>
                  </div>
                  <button type="button" className={styles.saveNotesBtn} onClick={handleSaveNotes}>
                    <Check size={14} />
                    <span>Save Notes</span>
                  </button>
                </div>

                <textarea
                  className={styles.notesTextarea}
                  placeholder="Make personal notes while watching the lecture (auto-saved per video)..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                />

                {notesSavedToast && (
                  <div className={styles.savedNotice}>
                    <CheckCircle2 size={14} />
                    <span>Lecture notes saved successfully!</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: COMMENTS & DOUBTS DISCUSSION */}
            {activeTab === 'doubts' && (
              <div className={styles.doubtsPane}>
                <h3>Ask a Doubt or Leave Feedback</h3>
                <form onSubmit={handlePostDoubt} className={styles.doubtForm}>
                  <textarea
                    placeholder="Type your question or concept doubt here. DK Sir &amp; faculty will answer directly..."
                    value={newDoubtText}
                    onChange={(e) => setNewDoubtText(e.target.value)}
                    rows={3}
                  />
                  <button type="submit" className={styles.postDoubtBtn} disabled={!newDoubtText.trim()}>
                    <Send size={15} />
                    <span>Post Doubt</span>
                  </button>
                  {doubtSubmitted && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '13px', fontWeight: 600, marginTop: '8px', width: '100%' }}>
                      <CheckCircle2 size={15} /> Doubt submitted to faculty! Live notification will arrive once answered.
                    </div>
                  )}
                </form>

                <div className={styles.doubtsThread}>
                  {doubts.map((d) => (
                    <div key={d.id} className={styles.doubtItem}>
                      <div className={styles.doubtHeader}>
                        <div className={styles.authorBadge}>
                          <User size={14} />
                          <strong>{d.author}</strong>
                          {d.authorRole && (
                            <span className={styles.roleTag}>{d.authorRole}</span>
                          )}
                          {d.status === 'ANSWERED' && (
                            <span style={{ background: '#d1fae5', color: '#047857', fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', marginLeft: '6px' }}>
                              Answered ✓
                            </span>
                          )}
                        </div>
                        <span className={styles.doubtTime}>{d.time}</span>
                      </div>
                      <p className={styles.doubtText}>{d.text}</p>

                      {/* Faculty Answer Render */}
                      {d.answer && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontSize: '12.5px', fontWeight: 700 }}>
                              <ShieldCheck size={14} />
                              <span>Faculty Answer by {d.answer.adminName || 'DK Sir (Director)'}</span>
                            </div>
                            <span style={{ background: '#d1fae5', color: '#047857', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                              Live Resolution ✓
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#064e3b', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                            {d.answer.answerText}
                          </p>
                        </div>
                      )}

                      <div className={styles.doubtFooter}>
                        <button
                          type="button"
                          className={`${styles.likeBtn} ${d.isLiked ? styles.likeBtnActive : ''}`}
                          onClick={() => handleToggleLike(d.id)}
                          title={d.isLiked ? 'Unlike doubt' : 'Helpful doubt (Like)'}
                          style={{
                            background: d.isLiked ? '#eff6ff' : '#ffffff',
                            borderColor: d.isLiked ? '#93c5fd' : '#cbd5e1',
                            color: d.isLiked ? '#2563eb' : '#475569',
                            fontWeight: d.isLiked ? 700 : 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <ThumbsUp size={13} fill={d.isLiked ? '#2563eb' : 'none'} color={d.isLiked ? '#2563eb' : 'currentColor'} />
                          <span>{d.likes || 0}</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* TAB 5: STAR RATING & FEEDBACK */}
            {activeTab === 'reviews' && (
              <div className={styles.reviewsPane}>
                <div className={styles.ratingOverviewCard}>
                  <div className={styles.bigScoreBox}>
                    <span className={styles.bigScore}>4.9</span>
                    <div className={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={18} fill="#eab308" color="#eab308" />
                      ))}
                    </div>
                    <small>Based on 450+ Student Aspirants</small>
                  </div>

                  <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                    <h4>Rate this Course &amp; Leave Feedback</h4>
                    <div className={styles.interactiveStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={styles.starSelectBtn}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(star)}
                        >
                          <Star
                            size={24}
                            fill={(hoverRating || newRating) >= star ? '#eab308' : '#e2e8f0'}
                            color={(hoverRating || newRating) >= star ? '#eab308' : '#cbd5e1'}
                          />
                        </button>
                      ))}
                      <span className={styles.ratingNumberTag}>{newRating} / 5 Stars</span>
                    </div>

                    <textarea
                      placeholder="Share your experience: How helped you solve questions faster? Any feedback on lectures?"
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      rows={3}
                      required
                    />

                    <button type="submit" className={styles.submitReviewBtn}>
                      <Award size={15} />
                      <span>Submit Rating &amp; Review</span>
                    </button>

                    {reviewSubmitted && (
                      <span className={styles.reviewSuccessMsg}>
                        <Check size={14} /> Thank you! Your review has been submitted.
                      </span>
                    )}
                  </form>
                </div>

                {/* Reviews List */}
                <div className={styles.reviewsList}>
                  {reviews.map((r) => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewTop}>
                        <strong>{r.studentName}</strong>
                        <div className={styles.reviewStars}>
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} size={14} fill="#eab308" color="#eab308" />
                          ))}
                        </div>
                      </div>
                      <p>{r.text}</p>
                      {r.adminReply && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginTop: '8px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '12px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldCheck size={13} /> Admin Reply by {r.adminReply.adminName || 'DK Sir (Director)'}
                          </strong>
                          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#1e3a8a', lineHeight: 1.5 }}>
                            {r.adminReply.content}
                          </p>
                        </div>
                      )}
                      <small className={styles.reviewDate}>{r.date}</small>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── 4. Right Curriculum Playlist Sidebar (Sticky Header & Accordions) ─── */}
      <aside
        id="curriculum-sidebar"
        className={`${styles.playlistSidebar} ${isMobileCurriculumOpen ? styles.mobileDrawerOpen : ''}`}
        aria-label="Course Curriculum Playlist"
      >
        <div className={styles.playlistHeader}>
          <div className={styles.playlistTitleRow}>
            <h3>Course Curriculum</h3>
            <span className={styles.lectureCountBadge}>
              {completedLessonIds.length} / {allLectures.length} completed
            </span>
          </div>

          <div className={styles.searchLessonBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search lectures in syllabus..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              aria-label="Search lectures in syllabus"
            />
            {searchFilter && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchFilter('')}
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.sectionsList}>
          {curriculumSections.map((sec, secIdx) => {
            const filteredLectures = sec.lectures.filter((l) =>
              l.title.toLowerCase().includes(searchFilter.toLowerCase())
            );

            if (filteredLectures.length === 0 && searchFilter) return null;

            const isOpen = openSectionIds.includes(sec.id);

            return (
              <div key={sec.id} className={styles.sectionGroup}>
                {/* Chapter Accordion Trigger Button */}
                <button
                  type="button"
                  className={styles.sectionHeaderBtn}
                  onClick={() => toggleSectionAccordion(sec.id)}
                  aria-expanded={isOpen}
                  aria-controls={`section-lectures-${sec.id}`}
                >
                  <div className={styles.sectionTitleBlock}>
                    <div className={styles.sectionMetaTop}>
                      <span className={styles.sectionEyebrow}>Chapter {secIdx + 1}</span>
                      {sec.durationText && (
                        <span className={styles.sectionBadge}>{sec.durationText}</span>
                      )}
                    </div>
                    <h4 className={styles.sectionTitle}>{sec.title}</h4>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`${styles.sectionChevron} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                </button>

                {isOpen && (
                  <div id={`section-lectures-${sec.id}`} className={styles.lecturesContainer}>
                    {filteredLectures.map((lec) => {
                      const isCurrent = lec.id === activeLectureId;
                      const isDone = completedLessonIds.includes(lec.id);
                      const isLocked = isLectureLocked(lec.id);

                      return (
                        <div
                          key={lec.id}
                          className={`${styles.lectureRow} ${isCurrent ? styles.lectureRowActive : ''} ${
                            isDone ? styles.lectureRowDone : ''
                          } ${isLocked ? styles.lectureRowLocked : ''}`}
                          onClick={() => handleSelectLecture(lec.id)}
                          role="button"
                          tabIndex={0}
                          aria-current={isCurrent ? 'true' : undefined}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectLecture(lec.id);
                            }
                          }}
                        >
                          <div className={styles.lectureStatusIcon}>
                            {isLocked ? (
                              <Lock size={16} className={styles.lockedRowIcon} aria-label="Locked lecture" />
                            ) : isDone ? (
                              <CheckCircle2 size={18} className={styles.doneIcon} aria-label="Completed" />
                            ) : isCurrent ? (
                              <div className={styles.nowPlayingAnimation} title="Now Playing">
                                <span />
                                <span />
                                <span />
                              </div>
                            ) : (
                              <Circle size={17} className={styles.pendingIcon} aria-label="Not started" />
                            )}
                          </div>

                          <div className={styles.lectureMain}>
                            {isCurrent && (
                              <span className={styles.nowPlayingTag}>
                                {isLocked ? 'Selected · Locked' : 'Now playing'}
                              </span>
                            )}
                            <span className={styles.lectureName}>{lec.title}</span>
                            <div className={styles.lectureMetaRow}>
                              <span className={styles.lectureDuration}>{lec.duration}</span>

                              {isLocked ? (
                                <button
                                  type="button"
                                  className={styles.unlockSmallChip}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectLecture(lec.id);
                                    setIsUnlockModalOpen(true);
                                  }}
                                  aria-label="Unlock this lecture"
                                  title="Enroll to unlock full course"
                                >
                                  <Lock size={10} />
                                  <span>Unlock</span>
                                </button>
                              ) : (
                                <div className={styles.lectureMicroResources}>
                                  {lec.notesPdfUrl && (
                                    <a
                                      href={lec.notesPdfUrl}
                                      download
                                      className={styles.microResourceChip}
                                      aria-label={`Download notes for ${lec.title}`}
                                      title="Handwritten Notes (PDF)"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <FileText size={13} />
                                    </a>
                                  )}

                                  {lec.dppPdfUrl && (
                                    <a
                                      href={lec.dppPdfUrl}
                                      download
                                      className={styles.microResourceChip}
                                      aria-label={`Download DPP for ${lec.title}`}
                                      title="Daily Practice Problem Sheet (PDF)"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Layers size={13} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
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
      </aside>

      {/* ─── 5. Unlock Batch Modal (Flagship Batch Syllabus Popup) ─── */}
      {isUnlockModalOpen && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-modal-title"
          onClick={() => {
            setIsUnlockModalOpen(false);
            setLockedModalLecture(null);
          }}
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => {
                setIsUnlockModalOpen(false);
                setLockedModalLecture(null);
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalBadge}>
                <Sparkles size={14} />
                <span>FLAGSHIP BATCH SYLLABUS</span>
              </div>
              <h3 id="unlock-modal-title" className={styles.modalTitle}>
                {lockedModalLecture
                  ? `Unlock Lecture: ${lockedModalLecture.title}`
                  : 'Unlock Complete Syllabus & All Lectures'}
              </h3>
              <p className={styles.modalSubtitle}>
                You have accessed the <strong>5 Free Masterclasses</strong> in this course. To unlock all lectures, complete syllabus archives, 40+ CBT tests, full Kota handwritten PDF notes, and 24/7 DK Sir faculty doubt resolution, enroll in the full course below.
              </p>
            </div>

            <div className={styles.modalPerksGrid}>
              <div className={styles.modalPerkItem}>
                <Check size={16} className={styles.perkIcon} />
                <span>All 10+ Complete Advanced Video Lectures &amp; Kota Shortcuts</span>
              </div>
              <div className={styles.modalPerkItem}>
                <Check size={16} className={styles.perkIcon} />
                <span>Full Downloadable Handwritten PDF Notes &amp; Solved DPP Sets</span>
              </div>
              <div className={styles.modalPerkItem}>
                <Check size={16} className={styles.perkIcon} />
                <span>All India Computer-Based Test (CBT) Series &amp; Rank Predictor</span>
              </div>
              <div className={styles.modalPerkItem}>
                <Check size={16} className={styles.perkIcon} />
                <span>1:1 Faculty Doubt Resolution &amp; Mentorship Clinics</span>
              </div>
            </div>

            <div className={styles.feeHighlightBox}>
              <div className={styles.feeTitle}>{course?.title || 'JEE Preparation Batch'}</div>
              <div className={styles.feePriceRow}>
                <div className={styles.feeAmount}>{unlockPrice}</div>
                {course?.originalPrice && course.originalPrice !== unlockPrice && (
                  <span className={styles.originalStrikethrough}>{course.originalPrice}</span>
                )}
              </div>
              <div className={styles.feeGuarantees}>
                <span>✓ All 10 Lectures Unlocked</span>
                <span>✓ PDF Notes &amp; Solved DPPs</span>
                <span>✓ Lifetime Validity</span>
              </div>
            </div>

            <form onSubmit={handleUnlockPaymentSubmit} className={styles.unlockForm}>
              <div className={styles.formGroup}>
                <label htmlFor="unlock-name">Student Full Name</label>
                <input
                  id="unlock-name"
                  type="text"
                  placeholder="e.g. Aryan Sharma"
                  value={unlockStudentName}
                  onChange={(e) => setUnlockStudentName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="unlock-phone">WhatsApp / Mobile Number</label>
                <input
                  id="unlock-phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={unlockStudentPhone}
                  onChange={(e) => setUnlockStudentPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.confirmUnlockBtn}
                disabled={isUnlocking}
              >
                {isUnlocking ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Pay {unlockPrice} &amp; Unlock Complete Syllabus Now</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                🔒 100% Secure Checkout via Razorpay / UPI • Instant LMS Access
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

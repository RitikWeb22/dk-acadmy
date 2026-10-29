import type { Course } from '../types';

export interface CourseBatch extends Course {
  batchCode?: string;
  enrolledStudentsCount?: number;
  availableSeats?: number;
  startDateFormatted?: string;
  targetExamYear?: string;
  hasFreeDemo?: boolean;
  emiMonthlyAmount?: number;
  syllabusHighlights?: string[];
  instructorTitle?: string;
  instructorAvatar?: string;
}

export const MOCK_COURSES: CourseBatch[] = [
  // =========================================================================
  // 1. LIVE CLASSROOM BATCHES
  // =========================================================================
  {
    id: 'jee-2028-ultimate-live-2yr',
    title: 'Pratham 2-Year Ultimate Live Batch - Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    targetExamYear: '2028',
    badge: 'Flagship Live Batch',
    badgeUrgency: 'urgency',
    batchStartDate: '2026-11-10',
    startDateFormatted: 'Starts 10 Nov 2026',
    tier: 'Paid',
    price: '₹74,999',
    originalPrice: '₹1,05,000',
    numericPrice: 74999,
    discountPercentage: 28,
    includesGst: true,
    emiText: 'EMI from ₹6,250/month',
    emiMonthlyAmount: 6250,
    hasFreeDemo: true,
    courseType: 'live',
    mode: 'Live',
    duration: '2 Years (1200+ Live Hours)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    instructor: 'DK Sir & Kota Senior Faculty Team',
    instructorTitle: 'Dharmendra Kumar & IITian HODs',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: true,
    isBestValue: true,
    enrolledCount: 3420,
    availableSeats: 8,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    description: 'Comprehensive 2-year live interactive master program for Class 11 students targeting top 100 AIR in JEE Main & Advanced 2028. Daily live classes, Kota DPP sheets, 20-30s shortcuts, and 1:1 mentor checks.',
    features: [
      '1,200+ Hours Live Interactive Classes with 2-way audio doubt clearance',
      'Daily Practice Problem (DPP) sets with video solutions by DK Sir',
      'Proprietary 20-30s inspection shortcuts for calculus, vectors, and coordinate geometry'
    ],
    curriculumSections: [
      {
        id: 'math-class-11',
        title: 'Mathematics: Functions, Calculus & Algebra (Class 11)',
        durationText: '84 Lectures • 126 Hours',
        lectures: [
          { id: 'm1', title: 'Sets, Relations & Function Domain/Range Inspection', duration: '1h 45m', isPreview: true },
          { id: 'm2', title: 'Quadratic Equations & Location of Roots in 30 Seconds', duration: '1h 50m', isPreview: true },
          { id: 'm3', title: 'Trigonometric Equations & Symmetric Transformations', duration: '2h 10m', isPreview: false },
          { id: 'm4', title: 'Straight Lines & Family of Lines Speed Shortcuts', duration: '1h 40m', isPreview: false },
          { id: 'm5', title: 'Conic Sections: Parabola Tangents & Normals', duration: '2h 15m', isPreview: false }
        ]
      },
      {
        id: 'physics-class-11',
        title: 'Physics: Mechanics, Waves & Thermodynamics (Class 11)',
        durationText: '92 Lectures • 138 Hours',
        lectures: [
          { id: 'p1', title: 'Vectors, Relative Motion & 2D Kinematics', duration: '1h 35m', isPreview: true },
          { id: 'p2', title: 'Newton Laws of Motion & Pseudo Force Elimination', duration: '2h 00m', isPreview: false },
          { id: 'p3', title: 'Work Power Energy & Conservative Field Dynamics', duration: '1h 45m', isPreview: false },
          { id: 'p4', title: 'Center of Mass & Impulse Momentum Collision', duration: '2h 10m', isPreview: false },
          { id: 'p5', title: 'Rotational Motion: Moment of Inertia Matrix', duration: '2h 30m', isPreview: false }
        ]
      },
      {
        id: 'chemistry-class-11',
        title: 'Chemistry: Physical, Inorganic & Organic GOC (Class 11)',
        durationText: '78 Lectures • 117 Hours',
        lectures: [
          { id: 'c1', title: 'Mole Concept & Stoichiometry Quick Calculation', duration: '1h 30m', isPreview: true },
          { id: 'c2', title: 'Atomic Structure & Quantum Numbers Visualized', duration: '1h 40m', isPreview: false },
          { id: 'c3', title: 'Chemical Bonding & VSEPR Molecular Geometry', duration: '2h 00m', isPreview: false },
          { id: 'c4', title: 'Thermodynamics & Gibbs Free Energy Criteria', duration: '1h 50m', isPreview: false },
          { id: 'c5', title: 'General Organic Chemistry (GOC) & Electronic Effects', duration: '2h 15m', isPreview: false }
        ]
      }
    ]
  },
  {
    id: 'jee-2027-zenith-live-1yr',
    title: 'Zenith 1-Year Fast-Track Live Batch - Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Seats Filling Fast',
    badgeUrgency: 'urgency',
    batchStartDate: '2026-11-15',
    startDateFormatted: 'Starts 15 Nov 2026',
    tier: 'Paid',
    price: '₹54,999',
    originalPrice: '₹75,000',
    numericPrice: 54999,
    discountPercentage: 27,
    includesGst: true,
    emiText: 'EMI from ₹4,583/month',
    emiMonthlyAmount: 4583,
    hasFreeDemo: true,
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year (750+ Live Hours)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'DK Sir & Team',
    instructorTitle: 'Dharmendra Kumar & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: true,
    enrolledCount: 2890,
    availableSeats: 5,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    description: 'Intensive 1-year live batch covering the entire Class 12 syllabus alongside rapid high-yield Class 11 revision. Designed for high-scoring students targeting IIT Bombay, Delhi, and Kanpur.',
    features: [
      '750+ Live Interactive Hours covering complete 12th + rapid 11th recap',
      'Dual focus on CBSE 12th Board marks (90%+) and JEE Advanced rank (AIR < 500)',
      'Weekly CBT Mock Tests with NTA AI percentile analytics'
    ],
    curriculumSections: [
      {
        id: 'math-class-12',
        title: 'Mathematics: Differential & Integral Calculus, Vectors 3D',
        durationText: '70 Lectures • 105 Hours',
        lectures: [
          { id: 'zm1', title: 'Limits, Continuity & Differentiability Shortcut Vault', duration: '1h 45m', isPreview: true },
          { id: 'zm2', title: 'Definite Integration & Area Under Curve Inspection', duration: '2h 00m', isPreview: true },
          { id: 'zm3', title: 'Differential Equations: Variable Separable & Homogeneous', duration: '1h 50m', isPreview: false }
        ]
      }
    ]
  },
  {
    id: 'jee-2027-rankers-dropper-live',
    title: 'Rankers Super-30 Dropper Live Batch - Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Dropper',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Droppers Top Choice',
    badgeUrgency: 'popular',
    batchStartDate: '2026-11-05',
    startDateFormatted: 'Batch Starts 5 Nov',
    tier: 'Paid',
    price: '₹59,999',
    originalPrice: '₹85,000',
    numericPrice: 59999,
    discountPercentage: 29,
    includesGst: true,
    emiText: 'EMI from ₹4,999/month',
    emiMonthlyAmount: 4999,
    hasFreeDemo: true,
    courseType: 'live',
    mode: 'Live',
    duration: 'Full-Year Repeater Cohort',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'DK Sir (Mathematics Specialist)',
    instructorTitle: 'Dharmendra Kumar & Kota Mentors',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: true,
    isBestValue: false,
    enrolledCount: 4120,
    availableSeats: 3,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
    description: 'Engineered specifically for repeaters and drop-year candidates who want to leapfrog from 90%ile to 99.8%ile. Rigorous problem-solving, mistake-book audits, and full-length simulated CBTs.',
    features: [
      '6 Days / Week high-tempo problem solving and conceptual deep-dives',
      'DK Sir’s 20-30s speed drills on multi-correct & matrix-match problems',
      'Personal IITian mentor assigned with weekly progress accountability'
    ],
    curriculumSections: [
      {
        id: 'dropper-sprint',
        title: 'High-Yield JEE Advanced Problem Architecture',
        durationText: '110 Lectures • 165 Hours',
        lectures: [
          { id: 'dr1', title: 'Multi-Concept Questions: Calculus + Coordinate Geometry', duration: '2h 15m', isPreview: true },
          { id: 'dr2', title: 'Electrodynamics & Optics High Weightage Shortcuts', duration: '2h 00m', isPreview: false }
        ]
      }
    ]
  },
  {
    id: 'jee-2029-pre-jee-foundation-live',
    title: 'Aryabhata Class 10 Pre-JEE Foundation Batch - Target JEE 2029',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2029',
    targetExamYear: '2029',
    badge: 'Early Prodigy Cohort',
    badgeUrgency: 'category',
    batchStartDate: '2026-11-20',
    startDateFormatted: 'Starts 20 Nov 2026',
    tier: 'Paid',
    price: '₹29,999',
    originalPrice: '₹42,000',
    numericPrice: 29999,
    discountPercentage: 28,
    includesGst: true,
    emiText: 'EMI from ₹2,500/month',
    emiMonthlyAmount: 2500,
    hasFreeDemo: true,
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year Foundation (Weekend Batch)',
    language: 'English & Hinglish',
    validity: '12 Months Access',
    taughtByIitians: true,
    instructor: 'DK Sir & Foundation Mentors',
    instructorTitle: 'Dharmendra Kumar & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 1680,
    availableSeats: 12,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    description: 'Nurture mathematical intuition and analytical scientific thinking early in Class 10. Bridging school boards with competitive Olympiads (IOQM, PRMO) and high-level JEE concepts.',
    features: [
      'Bridge Class 10 NCERT to Class 11 competitive JEE foundations without stress',
      'IOQM & Science Olympiad specific speed techniques & visual proofs',
      'Small batch size (max 30 students) for personalized mentor interaction'
    ],
    curriculumSections: [
      {
        id: 'found-class-10',
        title: 'Mathematical Reasoning & Fundamental Physics',
        durationText: '48 Lectures • 72 Hours',
        lectures: [
          { id: 'f1', title: 'Polynomials & Number Theory Intuition for Olympiads', duration: '1h 30m', isPreview: true },
          { id: 'f2', title: 'Optics & Ray Diagram Geometry Breakdowns', duration: '1h 45m', isPreview: false }
        ]
      }
    ]
  },
  {
    id: 'jee-2027-crash-course-rapid',
    title: 'Sankalp 60-Day Rapid Revision Crash Course - Target JEE 2027',
    targetExam: 'Crash Course',
    category: 'Crash Course',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Rank Booster Sprint',
    badgeUrgency: 'urgency',
    batchStartDate: '2026-11-18',
    startDateFormatted: 'Starts 18 Nov 2026',
    tier: 'Paid',
    price: '₹14,999',
    originalPrice: '₹22,000',
    numericPrice: 14999,
    discountPercentage: 32,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'live',
    mode: 'Live + Recorded',
    duration: '60 Days Sprint',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Main Session 2',
    taughtByIitians: true,
    instructor: 'DK Sir & Team',
    instructorTitle: 'Kota Master Faculty',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 2240,
    availableSeats: 15,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    description: 'High-yield 60-day intensive crash course targeting the top 40% weightage topics that contribute to 75% of JEE Main marks. Formula sheets, shortcut tricks, and 10 full CBT mocks.',
    features: [
      'Top 45 high-yield chapters covered with DK Sir 20-30s speed tricks',
      'Daily 2-hour Live Doubt Clinic + 500 handpicked high-probability questions',
      '10 Full-Length CBT NTA-Pattern Mock Tests with Instant Percentile Analysis'
    ],
    curriculumSections: [
      {
        id: 'crash-pcm',
        title: 'High Weightage Chapter Speed Drills',
        durationText: '60 Lectures • 90 Hours',
        lectures: [
          { id: 'cr1', title: 'Modern Physics & Dual Nature in 45 Minutes', duration: '1h 30m', isPreview: true },
          { id: 'cr2', title: 'Matrices & Determinants Option Elimination Tactics', duration: '1h 45m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-2027-english-zenith-live',
    title: 'Apex Pure English Batch (Pan-India) - Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: '100% English Delivery',
    badgeUrgency: 'category',
    batchStartDate: '2026-11-22',
    startDateFormatted: 'Starts 22 Nov 2026',
    tier: 'Paid',
    price: '₹56,999',
    originalPrice: '₹79,000',
    numericPrice: 56999,
    discountPercentage: 28,
    includesGst: true,
    emiText: 'EMI from ₹4,750/month',
    emiMonthlyAmount: 4750,
    hasFreeDemo: true,
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year Live Program',
    language: 'English',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'Senior IITian Faculty Team',
    instructorTitle: 'Ex-IIT Madras & Bombay Faculty',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 1530,
    availableSeats: 10,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    description: 'Conducted 100% in fluent English for students from South India, Gulf (NRI), and international CBSE schools. Uncompromised Kota rigor with clear English instruction.',
    features: [
      'Entire syllabus taught in English with comprehensive English study notes',
      'Specially designed for non-Hindi speaking and international NRI aspirants',
      'Live interactive audio doubt clearing in every single lecture'
    ],
    curriculumSections: [
      {
        id: 'eng-curriculum',
        title: 'Core JEE Advanced Master Modules',
        durationText: '80 Lectures • 120 Hours',
        lectures: [
          { id: 'en1', title: 'Calculus Conceptions & Real Analysis', duration: '1h 45m', isPreview: true }
        ]
      }
    ]
  },

  // =========================================================================
  // 2. SELF-STUDY (DLP) PACKAGES
  // =========================================================================
  {
    id: 'jee-dlp-complete-kota-pack',
    title: 'Kota Pedagogy Self-Study DLP Pack & 18 Books - Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    targetExamYear: '2028',
    badge: 'Books Delivered Home',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹18,500',
    originalPrice: '₹26,000',
    numericPrice: 18500,
    discountPercentage: 29,
    includesGst: true,
    emiText: 'EMI from ₹3,083/month (6 mos)',
    emiMonthlyAmount: 3083,
    hasFreeDemo: true,
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '2 Years Full Access',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    instructor: 'DK Sir & Kota Senior Team',
    instructorTitle: 'Dharmendra Kumar & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: true,
    isBestValue: true,
    enrolledCount: 5410,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    description: 'Complete Distance Learning Program: 760+ hours of Kota recorded video vault + 18 physical printed theory and workbook modules shipped to your doorstep with zero delivery fee.',
    features: [
      '18 Printed Theory & Exercise workbooks delivered across India',
      'Full HD 760+ Hours recorded lecture vault with chapter-wise navigation',
      'Daily Practice Problem (DPP) PDFs with detailed video explanations'
    ],
    curriculumSections: [
      {
        id: 'dlp-math',
        title: 'Complete Mathematics Recorded Master Series',
        durationText: '180 Lectures • 250 Hours',
        lectures: [
          { id: 'dm1', title: 'DK Sir Calculus Inspection Formulas', duration: '1h 45m', isPreview: true },
          { id: 'dm2', title: 'Coordinate Geometry Speed Solution Matrix', duration: '2h 10m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'free-math-calculus-shortcuts',
    title: 'DK Sir 20-30s Math Shortcuts & Calculus Foundations - Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    targetExamYear: '2028',
    badge: '100% Free Demo Access',
    badgeUrgency: 'instant',
    tier: 'Free',
    price: '₹0 Free',
    originalPrice: '₹12,000',
    numericPrice: 0,
    discountPercentage: 100,
    includesGst: true,
    emiText: '100% Free Access • No Card Needed',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '10 Lectures (5 Unlocked Free)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    instructor: 'DK Sir (Dharmendra Kumar)',
    instructorTitle: 'IIT JEE Mathematics Guru',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: true,
    isBestValue: false,
    enrolledCount: 8920,
    subjects: ['Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    description: 'Master DK Sir’s proprietary 20-to-30-second inspection shortcuts for Calculus, definite integrals, and symmetric curves. First 5 masterclasses unlocked free with downloadable DPPs.',
    features: [
      '5 Full conceptual masterclasses unlocked with Kota pedagogy',
      'Handwritten lecture notes & formula cheat sheets included',
      'Daily Practice Problems (DPP) with video hint explanations'
    ],
    curriculumSections: [
      {
        id: 'free-calc',
        title: 'DK Sir Signature Calculus Sprints',
        durationText: '10 Masterclasses • 15 Hours',
        lectures: [
          { id: 'fcl1', title: 'Definite Integral Symmetry Property P4 in 20 Seconds', duration: '55m', isPreview: true },
          { id: 'fcl2', title: 'Leibnitz Rule of Differentiation under Integral Sign', duration: '1h 10m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-dlp-physics-mastery',
    title: 'Mechanics & Electrodynamics Mastery DLP Video Series - Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Self-Paced Video Vault',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹12,499',
    originalPrice: '₹18,000',
    numericPrice: 12499,
    discountPercentage: 30,
    includesGst: true,
    emiText: 'EMI from ₹2,083/month (6 mos)',
    emiMonthlyAmount: 2083,
    hasFreeDemo: true,
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '220 Recorded Masterclasses',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'Dr. Devendra Verma (Ph.D. Physics)',
    instructorTitle: '14+ Yrs Physics Kota Faculty',
    instructorAvatar: '/images/students/aarav.jpg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 3180,
    subjects: ['Physics'],
    coverImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80',
    description: 'Transform Physics from a nightmare into your top scoring subject. Intuitive visual breakdowns of complex rotational dynamics, Gauss Law, EMI, and Wave Optics.',
    features: [
      '220 High-definition recorded video masterclasses with animations',
      '300+ Solved advanced JEE problems with multi-angle diagrams',
      'Comprehensive physics formula vault and mind maps'
    ],
    curriculumSections: [
      {
        id: 'phys-mastery',
        title: 'Advanced Mechanics & Electromagnetism',
        durationText: '65 Lectures • 95 Hours',
        lectures: [
          { id: 'pm1', title: 'FBD and Pulley Constraints Simplified', duration: '1h 20m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-dlp-organic-chemistry-goc',
    title: 'Organic Chemistry & Reaction Mechanisms Vault - Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Visual Mechanism Maps',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹9,999',
    originalPrice: '₹15,000',
    numericPrice: 9999,
    discountPercentage: 33,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '160 High-Yield Modules',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'Yashwant Kumar Sir (Ex-IIT Bombay)',
    instructorTitle: 'Organic Chemistry Guru',
    instructorAvatar: '/images/students/rohan.jpg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 2940,
    subjects: ['Chemistry'],
    coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    description: 'Stop cramming reactions. Understand electron movement, carbocation stability, aromaticity, and retrosynthetic pathways for 100% accuracy in Organic Chemistry.',
    features: [
      'Complete roadmaps covering GOC, Hydrocarbons, Carbonyls, and Amines',
      'Named reaction cheat cards and stereochemistry models',
      'Over 600 past JEE Advanced multi-step synthesis solved'
    ],
    curriculumSections: [
      {
        id: 'chem-goc',
        title: 'GOC & Reaction Mechanisms',
        durationText: '45 Lectures • 68 Hours',
        lectures: [
          { id: 'cg1', title: 'Carbocation Rearrangements & Ring Expansion', duration: '1h 15m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-dlp-class11-selfstudy',
    title: 'Class 11 Complete Self-Paced PCM Video Vault - Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    targetExamYear: '2028',
    badge: 'Self-Study Favorite',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹15,999',
    originalPrice: '₹24,000',
    numericPrice: 15999,
    discountPercentage: 33,
    includesGst: true,
    emiText: 'EMI from ₹2,666/month (6 mos)',
    emiMonthlyAmount: 2666,
    hasFreeDemo: true,
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '380 Recorded Lectures',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    instructor: 'DK Sir & Kota Senior Team',
    instructorTitle: 'Dharmendra Kumar & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 2650,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&auto=format&fit=crop&q=80',
    description: 'Full-year Class 11 video package designed for students enrolled in dummy schools or offline local coaching who need top Kota pedagogy for concept backing.',
    features: [
      'Entire Class 11 PCM covered from fundamental basics to JEE Advanced level',
      'Chapter-wise downloadable PDF notes and solution keys',
      'LMS dashboard with playback speed control (up to 2x) and progress tracking'
    ],
    curriculumSections: [
      {
        id: 'c11-dlp',
        title: 'Class 11 PCM Foundations',
        durationText: '120 Lectures • 180 Hours',
        lectures: [
          { id: 'c11_1', title: 'Calculus Prerequisites & Coordinate Setup', duration: '1h 30m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-pyq-archive-mastery',
    title: '10-Year JEE Chapter-Wise PYQ Video Solutions - Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: '5 Free Questions Preview',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹1,499',
    originalPrice: '₹4,999',
    numericPrice: 1499,
    discountPercentage: 70,
    includesGst: true,
    emiText: 'Instant Access • First 5 PYQs Free',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '500+ Questions Archive',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'DK Sir & IITian Faculty',
    instructorTitle: 'DK Sir & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: true,
    isBestValue: false,
    enrolledCount: 6840,
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
    description: 'Comprehensive deconstruction of past 10 years JEE Main and JEE Advanced previous year questions with DK Sir shortcut inspection methods and downloadable Kota PDF notes.',
    features: [
      '500+ Video Solutions showing 20-30s shortcuts vs traditional lengthy derivations',
      'Categorized by chapter, difficulty level, and multi-concept tag',
      'Downloadable step-by-step PDF answer keys with formula references'
    ],
    curriculumSections: [
      {
        id: 'pyq-archive',
        title: '10-Year Video Archive by Chapter',
        durationText: '250 Video Clips • 85 Hours',
        lectures: [
          { id: 'pyq1', title: 'Definite Integration PYQ 2024 to 2018', duration: '1h 10m', isPreview: true }
        ]
      }
    ]
  },

  // =========================================================================
  // 3. TEST SERIES (ONLINE CBT)
  // =========================================================================
  {
    id: 'jee-all-india-cbt-grand',
    title: 'All India CBT Grand Test Series & Analysis - Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    targetExamYear: '2028',
    badge: 'NTA CBT Interface',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹6,499',
    originalPrice: '₹9,999',
    numericPrice: 6499,
    discountPercentage: 35,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '75 Full & Part Tests',
    language: 'English Interface',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    instructor: 'DK Academy National Test Cell',
    instructorTitle: 'Former NTA Test Paper Setters',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: true,
    isBestValue: true,
    enrolledCount: 7890,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80',
    description: 'Exact NTA computer-based simulation environment. 30 Full-Length Mocks + 45 Chapter-wise Speed Tests with AI-powered weak area diagnostics and All India Rank predictions.',
    features: [
      'Exact 1:1 replica of the official NTA computer-based examination screen',
      'In-depth AI diagnostic report: time spent per question, accuracy rate & negative marks audit',
      'Complete video solutions for all tough questions by DK Sir & Team'
    ],
    curriculumSections: [
      {
        id: 'cbt-tests',
        title: 'Full CBT Test Calendar',
        durationText: '75 Online CBT Tests',
        lectures: [
          { id: 'cb1', title: 'Free Diagnostic Mock Test 1 (All India Open)', duration: '3h 00m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-dropper-advanced-cbt-pro',
    title: 'JEE Advanced Paper 1 & 2 Pro Ranker CBT - Target JEE 2027',
    targetExam: 'JEE Advanced',
    category: 'JEE Advanced',
    targetClass: 'Dropper',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Advanced Pattern Only',
    badgeUrgency: 'urgency',
    tier: 'Paid',
    price: '₹7,999',
    originalPrice: '₹12,000',
    numericPrice: 7999,
    discountPercentage: 33,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '25 Full Advanced Tests',
    language: 'English Interface',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    instructor: 'DK Sir & IITian Faculty Cell',
    instructorTitle: 'Dharmendra Kumar & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 3410,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=80',
    description: 'Tailored for students confident in clearing JEE Main who want to conquer multi-correct, comprehension, matrix-match, and integer-type questions in JEE Advanced.',
    features: [
      '25 Two-session (Paper 1: 9-12 AM, Paper 2: 2:30-5:30 PM) stamina building tests',
      'Focus on multi-correct negative marking minimization strategies',
      'Video analysis of each test paper by top IITian mentors'
    ],
    curriculumSections: [
      {
        id: 'adv-tests',
        title: 'JEE Advanced 2-Session Mock Calendar',
        durationText: '25 Paper 1 & 2 Sets',
        lectures: [
          { id: 'ad1', title: 'Advanced Simulation Paper 1 & 2 Demo Test', duration: '6h 00m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'bitsat-jee-combo-cbt-series',
    title: 'BITSAT Speed Test Series + Logical Reasoning - Target JEE 2027',
    targetExam: 'Crash Course',
    category: 'Crash Course',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Bonus Speed Drills',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹3,999',
    originalPrice: '₹6,000',
    numericPrice: 3999,
    discountPercentage: 33,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '20 Full-Length Mocks',
    language: 'English Interface',
    validity: 'Till BITSAT Session 2',
    taughtByIitians: true,
    instructor: 'DK Academy BITSAT Experts',
    instructorTitle: 'Ex-BITS Pilani Mentors',
    instructorAvatar: '/images/students/aditya.jpg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 2980,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&auto=format&fit=crop&q=80',
    description: '130 questions in 180 minutes: Master the speed and stamina required for BITS Pilani. Includes 20 full BITSAT mocks plus English Proficiency & Logical Reasoning classes.',
    features: [
      '20 Full BITSAT online mock tests with bonus question unlock feature',
      'Special classes on English Proficiency & Logical Reasoning',
      'Time-management coaching to attempt 120+ questions comfortably'
    ],
    curriculumSections: [
      {
        id: 'bitsat-tests',
        title: 'BITSAT Mock Exam Series',
        durationText: '20 Online Tests + 15 Video Lessons',
        lectures: [
          { id: 'bt1', title: 'BITSAT Full Mock 1 (Diagnostic)', duration: '3h 00m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-foundation-all-india-cbt',
    title: 'Junior Olympiad & Pre-JEE National CBT Test Series - Target JEE 2029',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2029',
    targetExamYear: '2029',
    badge: 'Junior Prodigy League',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹3,499',
    originalPrice: '₹5,000',
    numericPrice: 3499,
    discountPercentage: 30,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '1 Year Validity (30 Tests)',
    language: 'English Interface',
    validity: '12 Months Access',
    taughtByIitians: true,
    instructor: 'DK Sir (Dharmendra Kumar)',
    instructorTitle: 'Dharmendra Kumar & Team',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 1820,
    subjects: ['Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    description: 'Fortnightly Sunday CBT tests modeled on IOQM, PRMO, and early competitive exams to build time management and fearless testing psychology before high school.',
    features: [
      '30 Olympiad-pattern online tests with detailed video hint solutions',
      'Step-by-step problem deconstruction by DK Sir',
      'National percentile prediction among junior prodigies'
    ],
    curriculumSections: [
      {
        id: 'junior-cbt',
        title: 'Junior Olympiad CBT Test Schedule',
        durationText: '30 Online Tests',
        lectures: [
          { id: 'jc1', title: 'IOQM Mock Test 1 with Detailed Video Solution', duration: '2h 00m', isPreview: true }
        ]
      }
    ]
  },
  {
    id: 'jee-chapter-wise-speed-drills',
    title: 'Chapter-Wise Speed Drills & Question Bank CBT - Target JEE 2027',
    targetExam: 'JEE Main',
    category: 'JEE Main',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    targetExamYear: '2027',
    badge: 'Chapter-Wise Tests',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹2,999',
    originalPrice: '₹4,500',
    numericPrice: 2999,
    discountPercentage: 33,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    emiMonthlyAmount: 0,
    hasFreeDemo: true,
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '90 Chapter-Wise Tests',
    language: 'English Interface',
    validity: 'Till JEE Main 2027',
    taughtByIitians: true,
    instructor: 'DK Academy Academic Team',
    instructorTitle: 'Senior Test Creators',
    instructorAvatar: '/img/founder.jpeg',
    isPopular: false,
    isBestValue: false,
    enrolledCount: 2430,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    coverImage: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=80',
    description: 'Targeted chapter-by-chapter 45-minute sprint tests. Test yourself immediately after finishing any chapter in class to pinpoint misconceptions before proceeding.',
    features: [
      '90 Chapter tests covering all PCM topics in Class 11 and 12',
      'Immediate answer breakdown with formula reminders',
      'Personalized mistake log highlighting repeated formula errors'
    ],
    curriculumSections: [
      {
        id: 'speed-drills',
        title: 'PCM Chapter-Wise Testing Vault',
        durationText: '90 Online Tests',
        lectures: [
          { id: 'sd1', title: 'Calculus Chapter Drill 1: Derivatives', duration: '45m', isPreview: true }
        ]
      }
    ]
  }
];

// --- Complementary Page Data ---

export const WHY_US_FEATURES = [
  {
    title: 'Mentored by DK Sir (Dharmendra Kumar)',
    desc: '15+ years of dedicated Kota pedagogy, demystifying tough JEE Advanced problems with unmatched clarity.',
    iconName: 'GraduationCap'
  },
  {
    title: 'Proprietary 20-30s Short Tricks',
    desc: 'Save critical minutes in examinations with inspection shortcuts for Calculus, Vectors, and Matrices.',
    iconName: 'Target'
  },
  {
    title: 'Hybrid: Online + Janakpuri Center',
    desc: 'Attend live interactive virtual classes anywhere across India or in-person at our New Delhi center.',
    iconName: 'Laptop'
  },
  {
    title: '1:1 Progress Audits & Kota DPPs',
    desc: 'Daily practice problem sheets, continuous error-log tracking, and bi-weekly IITian mentor reviews.',
    iconName: 'ShieldCheck'
  }
];

export const PLAN_COMPARISON = {
  columns: [
    { title: 'Live Classroom', subtitle: 'Most Comprehensive & Interactive', isPopular: true },
    { title: 'Self-Study (DLP)', subtitle: 'Flexible Video Vault & Books', isPopular: false },
    { title: 'Test Series (CBT)', subtitle: 'NTA Exam Simulation & Analysis', isPopular: false }
  ],
  rows: [
    { feature: 'Live Interactive Lectures', live: '1,200+ Hours (2-Way Audio)', dlp: 'Recorded Archive (760+ Hrs)', test: '—' },
    { feature: 'Kota Pedagogy Faculty', live: 'Live Daily with DK Sir', dlp: 'Full Recorded Library', test: 'Video Solutions Only' },
    { feature: 'Physical Books at Home', live: 'Included (18 Volumes)', dlp: 'Included (18 Volumes)', test: 'Downloadable PDFs' },
    { feature: 'CBT Mock Tests with Percentile', live: '75 Full & Part Tests', dlp: '30 Full Tests', test: '75 Full & Part Tests' },
    { feature: '1:1 IITian Mentor Assigned', live: 'Yes (Bi-Weekly Check-in)', dlp: 'Monthly Mentor Review', test: '—' },
    { feature: '24/7 Doubt Resolution', live: 'Live Counter + Chat Portal', dlp: 'Dedicated Discussion Portal', test: 'Step-by-Step Video Hints' },
    { feature: 'Access Validity', live: 'Till JEE Advanced 2028', dlp: 'Till JEE Advanced 2028', test: '2 Years Validity' },
    { feature: 'Price Starting From', live: '₹54,999 (Incl. GST)', dlp: '₹9,999 (Incl. GST)', test: '₹2,999 (Incl. GST)' }
  ]
};

export const TESTIMONIALS_DATA = [
  {
    name: 'Aarav Sharma',
    rank: 'AIR 48 • JEE Advanced',
    batch: '2-Year Ultimate Live Batch',
    college: 'IIT Bombay • Computer Science',
    quote: 'DK Sir’s 20-to-30-second shortcut techniques completely transformed my speed in Mathematics. I went from panicking over time to finishing Math 25 minutes early in JEE Advanced.',
    avatar: '/images/students/aarav.jpg',
    verified: true
  },
  {
    name: 'Priya Iyer',
    rank: 'AIR 112 • JEE Advanced (99.94%ile)',
    batch: 'Class 11th Nurture Live Batch',
    college: 'IIT Delhi • Electrical Engg',
    quote: 'DK Sir explains Calculus and Coordinate Geometry with unmatched conceptual depth. The daily Kota DPP breakdowns and 1:1 mentor checks kept me disciplined throughout.',
    avatar: '/images/students/priya.jpg',
    verified: true
  },
  {
    name: 'Rohan Deshmukh',
    rank: 'AIR 284 • JEE Advanced',
    batch: 'Rankers Dropper Batch + CBT Series',
    college: 'IIT Kanpur • Mechanical Engg',
    quote: 'After scoring 92%ile in my first attempt, DK Academy’s Rankers Batch helped me jump to 99.85%ile. The error-book audits and CBT mocks made all the difference.',
    avatar: '/images/students/rohan.jpg',
    verified: true
  },
  {
    name: 'Ananya Gupta',
    rank: 'AIR 410 • JEE Advanced',
    batch: 'Self-Study DLP + All India CBT',
    college: 'IIT Roorkee • Data Science',
    quote: 'The 18 printed modules shipped to my home in Varanasi were comprehensive. Whenever I got stuck, the recorded video explanations gave immediate clarity.',
    avatar: '/images/students/ananya.jpg',
    verified: true
  }
];

export const FACULTY_MEMBERS = [
  {
    name: 'DK Sir (Dharmendra Kumar)',
    designation: 'Founder & Head of Mathematics',
    experience: '15+ Years Mentoring • Kota Pedagogy',
    specialty: 'Calculus, Algebra & 20-30s Inspection Tricks',
    avatar: '/img/founder.jpeg',
    bio: 'Renowned IIT JEE Mathematics mentor who has trained over 12,000 students into top IITs and NITs. Pioneer of the 20-30s inspection shortcuts.'
  },
  {
    name: 'Dr. Devendra Verma',
    designation: 'Senior Physics Faculty',
    experience: '14+ Years Experience • Ph.D. Physics',
    specialty: 'Mechanics, Rotational Motion & Electrodynamics',
    avatar: '/images/students/aarav.jpg',
    bio: 'Former senior faculty at Kota top coaching institutes. Known for crystal-clear visual diagrams and simplifying the toughest rotational dynamics problems.'
  },
  {
    name: 'Yashwant Kumar Sir',
    designation: 'Head of Chemistry',
    experience: '9+ Years Experience • Ex-IIT Bombay',
    specialty: 'Organic Mechanisms, GOC & Chemical Bonding',
    avatar: '/images/students/rohan.jpg',
    bio: 'IIT Bombay alumnus who makes Organic Chemistry logical and intuitive without rote memorization. Master of reaction mechanism roadmaps.'
  },
  {
    name: 'Er. Aditya Singhal',
    designation: 'Head of Academic Testing',
    experience: '8+ Years Experience • B.Tech IIT Delhi',
    specialty: 'CBT Test Architecture & Error Analytics',
    avatar: '/images/students/aditya.jpg',
    bio: 'Passionate educator focused on test-taking psychology, multi-correct negative mark elimination, and precision time management for JEE aspirants.'
  }
];

export const TRUST_PILLARS = [
  {
    icon: 'ShieldCheck',
    title: '100% Secure Payment',
    description: 'Encrypted 256-bit Razorpay gateway supporting UPI, Cards & NetBanking'
  },
  {
    icon: 'RotateCcw',
    title: '7-Day Refund Guarantee',
    description: 'Attend batch lectures for 7 days; if not satisfied, receive 100% tuition refund'
  },
  {
    icon: 'Zap',
    title: 'Instant LMS Access',
    description: 'Unlock lecture notes, DPPs, and video recordings within 60 seconds of checkout'
  },
  {
    icon: 'CreditCard',
    title: 'Flexible No-Cost EMI',
    description: 'Zero interest 3, 6, 9 & 12-month EMI options starting at just ₹2,500/month'
  }
];

export const FAQ_TOPICS_DATA = [
  {
    topic: 'Admissions & Batches',
    items: [
      {
        question: 'How do live online classes work at DK Academy?',
        answer: 'Live classes are conducted 4 to 6 days a week via our high-speed interactive learning platform. Students can unmute to ask audio questions directly or type in live chat. Full HD recorded backups of every class are available within 2 hours with lifetime validity.'
      },
      {
        question: 'What is the refund and cancellation policy?',
        answer: 'We provide a transparent 7-Day Academic Money-Back Guarantee. If within 7 calendar days of your first batch class you feel the course does not meet your expectations, simply request a refund via your portal for a 100% tuition fee return.'
      },
      {
        question: 'What is the teaching language in these batches?',
        answer: 'Our flagship batches are conducted in Hinglish (explanations in conversational Hindi with terminology, formulas, notes, and study material in English). We also offer pure English batches for students from South India and NRI schools.'
      }
    ]
  },
  {
    topic: 'Study Material & Tests',
    items: [
      {
        question: 'Are physical printed books included with online batches?',
        answer: 'Yes! All 2-Year Ultimate Live Batches and Self-Study DLP packages include complete sets of printed theory modules and exercise workbooks (18 comprehensive volumes covering PCM) shipped to your address across India at no shipping fee.'
      },
      {
        question: 'How do the Computer-Based Tests (CBT) work?',
        answer: 'Our testing portal reproduces the exact 1:1 user interface of the official NTA JEE exam screen. Upon completion, you receive an instantaneous AI diagnostic report detailing accuracy, speed per question, and All India percentile ranking.'
      },
      {
        question: 'How does doubt resolution work?',
        answer: 'Doubts are cleared via 3 integrated channels: (1) Live interactive doubt clearance during the class, (2) Daily scheduled 1-hour faculty doubt clinics after lecture hours, and (3) Our digital student portal where you upload question snapshots.'
      }
    ]
  },
  {
    topic: 'Payments & EMI',
    items: [
      {
        question: 'Is No-Cost EMI available for course fees?',
        answer: 'Yes, we provide 3, 6, 9, and 12-month No-Cost EMI options on major credit cards and debit cards via Razorpay and ShopSe with zero interest surcharge and instant paperless verification.'
      },
      {
        question: 'Can I upgrade from DLP or Test Series to Live Classroom later?',
        answer: 'Yes, students can upgrade to Live Batches at any point by paying only the pro-rated fee difference. All your previous progress and test scores will seamlessly carry forward.'
      }
    ]
  }
];

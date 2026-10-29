import type { Course, CourseCategory } from '../types';

export const COURSE_CATEGORIES: { label: string; value: 'All' | CourseCategory }[] = [
  { label: 'All Courses', value: 'All' },
  { label: 'JEE Main', value: 'JEE Main' },
  { label: 'JEE Advanced', value: 'JEE Advanced' },
  { label: 'Foundation', value: 'Foundation' },
  { label: 'Crash Course', value: 'Crash Course' },
];

/**
 * Calculates a data-driven consistent Target Year label based on class and session.
 * For Class 11th in session 2026-27, Target JEE is 2028.
 */
export function getTargetYearLabel(targetClass?: string, session: string = 'Session: 2026-27'): string {
  const is2027Session = session.includes('2027');

  switch (targetClass) {
    case 'Class 11th':
      return is2027Session ? 'Target JEE 2029' : 'Target JEE 2028';
    case 'Class 12th':
      return is2027Session ? 'Target JEE 2028' : 'Target JEE 2027';
    case 'Dropper':
      return is2027Session ? 'Target JEE 2028' : 'Target JEE 2027';
    case 'Class 10th Foundation':
      return is2027Session ? 'Target JEE 2030' : 'Target JEE 2029';
    default:
      return 'Target JEE 2028';
  }
}

/**
 * Dynamically resolves batch date badge text and urgency status.
 * Hides automatically if date has passed.
 */
export function getDynamicBatchBadge(course: Course): {
  label: string;
  urgency: 'urgency' | 'instant' | 'popular' | 'category';
} | null {
  if (course.courseType === 'dlp' || course.mode === 'Self-Paced') {
    return { label: 'Instant Digital Access', urgency: 'instant' };
  }
  if (course.courseType === 'test-series') {
    return { label: 'Active CBT Calendar', urgency: 'category' };
  }

  const now = new Date();

  // If admissions close date is provided
  if (course.batchCloseDate) {
    const closeDate = new Date(course.batchCloseDate);
    if (now > closeDate) return null; // Expired, hide badge
    return {
      label: `Admissions close ${closeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      urgency: 'urgency'
    };
  }

  // If next batch start date is provided
  if (course.batchStartDate) {
    const startDate = new Date(course.batchStartDate);
    if (now > startDate) return null; // Expired, hide badge
    return {
      label: `Next batch starts ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      urgency: 'urgency'
    };
  }

  if (course.lastBatchDate) {
    return { label: course.lastBatchDate, urgency: course.badgeUrgency || 'urgency' };
  }

  return null;
}

export const FREE_COURSES_CATALOG: Course[] = [
  {
    id: 'free-math-calculus-shortcuts',
    title: 'DK Sir Special: 20-30s Math Shortcuts & Calculus Foundations',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: '100% Free Demo Access',
    badgeUrgency: 'instant',
    tier: 'Free',
    price: '₹0 Free',
    originalPrice: '₹12,000',
    numericPrice: 0,
    discountPercentage: 100,
    includesGst: true,
    emiText: '100% Free Access • Zero Payment Required',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '10 Lectures (5 Unlocked Free)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    isBestValue: true,
    enrolledCount: 4890,
    facultyAvatars: ['/img/founder.jpeg'],
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    description: 'Master DK Sir’s proprietary 20-to-30-second inspection shortcuts for Calculus, definite integrals, and symmetric curves. First 5 masterclasses unlocked free with downloadable DPPs.',
    features: [
      '5 Full conceptual masterclasses unlocked with Kota pedagogy',
      'Handwritten lecture notes & formula cheat sheets included',
      'Daily Practice Problems (DPP) with video hint explanations',
      'Upgrade anytime to unlock full 14h+ advanced calculus syllabus'
    ],
    schedule: 'Self-Paced • Instant LMS Video Access',
    subjects: ['Mathematics']
  },
  {
    id: 'free-physics-mechanics-mastery',
    title: "JEE Physics: Mechanics, Newton's Laws & Rotational Motion Booster",
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Free Foundation Series',
    badgeUrgency: 'instant',
    tier: 'Free',
    price: '₹0 Free',
    originalPrice: '₹9,500',
    numericPrice: 0,
    discountPercentage: 100,
    includesGst: true,
    emiText: '100% Free Access • Zero Payment Required',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '10 Lectures (5 Unlocked Free)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 3620,
    facultyAvatars: ['/img/founder.jpeg'],
    coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
    description: 'Unpack tricky free-body diagrams, pseudo-forces, rotational dynamics, and work-energy theorem without cumbersome multi-page algebra.',
    features: [
      '5 Comprehensive mechanics masterclasses unlocked',
      'FBD visualization cards & rotational dynamics shortcuts',
      'Downloadable Kota physics problem sheets with solutions',
      'Seamless LMS integration with full progress tracking'
    ],
    schedule: 'Self-Paced • Instant LMS Video Access',
    subjects: ['Physics']
  },
  {
    id: 'free-chemistry-goc-mechanisms',
    title: 'JEE Chemistry: Organic Reaction Mechanisms & GOC Masterclass',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Open Access Masterclass',
    badgeUrgency: 'instant',
    tier: 'Free',
    price: '₹0 Free',
    originalPrice: '₹8,500',
    numericPrice: 0,
    discountPercentage: 100,
    includesGst: true,
    emiText: '100% Free Access • Zero Payment Required',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '10 Lectures (5 Unlocked Free)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 3150,
    facultyAvatars: ['/img/founder.jpeg'],
    coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    description: 'General Organic Chemistry (GOC), carbocation stability, aromaticity rules, and electrophilic aromatic substitution mechanisms explained visually.',
    features: [
      '5 High-yield organic chemistry video lectures unlocked',
      'Complete reaction pathway maps & electronic effect summaries',
      'Chapter-wise DPP sets with stepwise solution keys',
      'Direct access to student doubt discussions in LMS'
    ],
    schedule: 'Self-Paced • Instant LMS Video Access',
    subjects: ['Chemistry']
  },
  {
    id: 'free-advanced-option-elimination',
    title: 'JEE Advanced: Strategic Option Elimination & 20s Speed Drills',
    targetExam: 'JEE Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    badge: 'Strategic Rank Booster',
    badgeUrgency: 'instant',
    tier: 'Free',
    price: '₹0 Free',
    originalPrice: '₹10,000',
    numericPrice: 0,
    discountPercentage: 100,
    includesGst: true,
    emiText: '100% Free Access • Zero Payment Required',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '10 Lectures (5 Unlocked Free)',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 4210,
    facultyAvatars: ['/img/founder.jpeg'],
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    description: 'Master the test-taking psychology of top AIR rankers: eliminating 2 options in multi-correct questions using boundary values and dimensional constraints.',
    features: [
      '5 Advanced problem-solving video sessions unlocked',
      'Multi-correct verification shields & integer-type precision drills',
      'Downloadable Kota pedagogy test paper analysis handouts',
      'Full LMS dashboard tracking watched percentage and lecture notes'
    ],
    schedule: 'Self-Paced • Instant LMS Video Access',
    subjects: ['Mathematics', 'Physics']
  }
];

export const COURSES_CATALOG: Course[] = [
  ...FREE_COURSES_CATALOG,
  {
    id: 'jee-pyq-archive-mastery',
    title: '10-Year JEE Chapter-Wise PYQ Video Solutions & PDF Archive Course',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2026/2027',
    badge: '5 Free Questions Preview',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹1,499',
    originalPrice: '₹4,999',
    numericPrice: 1499,
    discountPercentage: 70,
    includesGst: true,
    emiText: 'Instant Access • First 5 PYQs Free',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '500+ Questions Archive',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: true,
    isBestValue: true,
    enrolledCount: 6420,
    facultyAvatars: ['/img/founder.jpeg', '/images/students/aarav.jpg'],
    description: 'Complete deconstruction of 10+ years JEE Main & Advanced Previous Year Questions with DK Sir YouTube video solutions and downloadable Kota PDF solutions. First 5 questions are 100% free preview.',
    features: [
      'First 5 Chapter-wise PYQ questions 100% free for all students',
      'Side-by-side YouTube video solutions with Kota shortcuts',
      'High-resolution PDF solutions & question papers ready to download',
      'Detailed formula keys, scoring marks distribution, and topic mastery'
    ],
    schedule: 'Self-Paced • Instant Practice & Solution Unlocked',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  // --- Class 11th Live Online Courses ---
  {
    id: 'jee-main-advanced-2yr-ultimate',
    title: 'Ultimate 2-Year Live Classroom: Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Flagship Batch',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹84,000',
    originalPrice: '₹1,10,000',
    numericPrice: 84000,
    discountPercentage: 24,
    includesGst: true,
    emiText: 'or ₹7,000/mo – No-cost EMI available',
    batchStartDate: '2026-11-15',
    batchCloseDate: '2026-11-30',
    courseType: 'live',
    mode: 'Live',
    duration: '2 Years',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    isBestValue: true,
    enrolledCount: 3820,
    facultyAvatars: ['/images/students/rohan.jpg', '/img/founder.jpeg'],
    description: 'Complete 2-year live interactive coaching covering Class 11 & 12 PCM syllabus aligned with NTA and IIT JEE Advanced standards.',
    features: [
      '1200+ hrs. of LIVE interactive classes with DK Academy Kota-pedagogy faculty',
      'Up to 40 online CBT mock tests with all-India percentile prediction',
      '24/7 doubt resolution, 1:1 academic mentorship & formula cheat sheets',
      'Daily Practice Problem (DPP) sets with detailed video hint solutions',
      'Handwritten Kota lecture notes & chapter-wise conceptual mind maps',
      'Monthly parent-teacher performance & diagnostic error review'
    ],
    schedule: 'Mon to Sat • Evening Live Sessions (4:30 PM – 8:30 PM)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-nurture-1yr-live',
    title: 'Nurture 1-Year Online Course: Target JEE 2028',
    targetExam: 'JEE Main',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Class 11 Rigor',
    badgeUrgency: 'urgency',
    tier: 'Paid',
    price: '₹52,000',
    originalPrice: '₹68,000',
    numericPrice: 52000,
    discountPercentage: 23,
    includesGst: true,
    emiText: 'or ₹4,333/mo – No-cost EMI available',
    batchStartDate: '2026-11-20',
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year',
    language: 'Hinglish (Hindi + Eng)',
    validity: '12 Months Access',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 2450,
    facultyAvatars: ['/images/students/aarav.jpg', '/img/founder.jpeg'],
    description: 'Specialized 1-year live coaching building unshakeable mathematical rigor, mechanics, and physical chemistry foundations for Class 11 aspirants.',
    features: [
      '600+ hrs. of LIVE interactive classes covering complete Class 11 PCM syllabus',
      'Up to 20 chapter-wise & cumulative online CBT tests',
      'Personalized error log analysis and weekly doubt clearing sessions',
      'Topic-wise revision booklets & formula cheat sheets',
      'Live in-class quizzes with instant speed & accuracy leaderboard'
    ],
    schedule: '4 Days / Week • 3 Hours / Day (5:00 PM – 8:00 PM)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-maths-mastery-dk-sir',
    title: "DK Sir Special: 20-30s Shortcuts & Math Mastery: Target JEE 2028",
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'DK Sir Flagship',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹38,000',
    originalPrice: '₹50,000',
    numericPrice: 38000,
    discountPercentage: 24,
    includesGst: true,
    emiText: 'or ₹3,166/mo – No-cost EMI available',
    batchStartDate: '2026-11-15',
    batchCloseDate: '2026-11-30',
    courseType: 'live',
    mode: 'Live',
    duration: '2 Years',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 3120,
    facultyAvatars: ['/images/students/rohan.jpg', '/img/founder.jpeg'],
    description: 'Exclusive IIT JEE Mathematics program mentored directly by DK Sir (Dharmendra Kumar). Master concept clarity, time-saving graphical tricks, and 20-to-30-second problem-solving challenges.',
    features: [
      'Personally taught by DK Sir (Dharmendra Kumar) – Renowned IIT JEE Math Mentor',
      'Exclusive 20-to-30-second problem-solving challenges & shortcut techniques',
      'Chapter-wise Previous Year Question (PYQ) video solutions (2010–2026)',
      '1:1 personal academic mentorship and weekly doubt-solving clinics',
      'Hybrid access: Attend online or at Janakpuri, New Delhi center'
    ],
    schedule: 'Mon, Wed, Fri • Evening Live Sessions + Weekend Sprints',
    subjects: ['Mathematics']
  },

  // --- Self-Study Courses with CBT Test Series (DLP) ---
  {
    id: 'jee-dlp-self-study-complete',
    title: 'Self-Study Distance Learning Package (DLP + CBT Series)',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Instant Access',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹18,500',
    originalPrice: '₹25,000',
    numericPrice: 18500,
    discountPercentage: 26,
    includesGst: true,
    emiText: 'or ₹3,083/mo (6 months EMI)',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '2 Years Access',
    language: 'English & Hinglish',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 4190,
    facultyAvatars: ['/images/students/rohan.jpg', '/images/students/aarav.jpg'],
    description: 'Comprehensive distance learning program with complete video modules, printed study material delivered home, and full computer-based test series.',
    features: [
      'Complete Class 11 & 12 structured video lecture archive (760+ HD videos)',
      '18 Printed theory & exercise modules delivered to your doorstep at no extra cost',
      '15+ Years topic-wise solved PYQ bank with step-by-step reasoning',
      'Up to 25 all-India online CBT mock tests with percentile prediction',
      'Telegram doubt assistance group with verified senior teaching assistants'
    ],
    schedule: 'Flexible Online Self-Paced • 24/7 Video Library Access',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-dlp-math-mechanics-specialist',
    title: 'Mathematics & Mechanics Advanced DLP Pack: Target JEE 2028',
    targetExam: 'JEE Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Specialized Track',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹12,000',
    originalPrice: '₹16,000',
    numericPrice: 12000,
    discountPercentage: 25,
    includesGst: true,
    emiText: 'or ₹2,000/mo (6 months EMI)',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '18 Months',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 1680,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'Targeted self-study program for students seeking mastery over Calculus, Coordinate Geometry, Rotational Motion, and Classical Mechanics.',
    features: [
      'Flagship 112-video Calculus & Definite Integration deep-dive series',
      'Calculus integration in non-inertial frames and rotational dynamics',
      'Downloadable homework booklets with numerical answer keys',
      '10 Subject-wise CBT milestone tests with question status palette'
    ],
    schedule: 'Self-Paced with Monthly Live Mentor Check-ins',
    subjects: ['Physics', 'Mathematics']
  },
  {
    id: 'jee-dlp-pyq-vault-dk-sir',
    title: 'DK Sir Chapter-wise Math PYQ Video Vault & Short Tricks: Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'PYQ Video Vault',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹8,999',
    originalPrice: '₹14,000',
    numericPrice: 8999,
    discountPercentage: 36,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '2 Years Access',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2028',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 3950,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'Master 15+ years of JEE Main and Advanced Mathematics questions deconstructed chapter-by-chapter with DK Sir’s proprietary 20-to-30-second shortcut techniques.',
    features: [
      'Over 2,200+ Math PYQs solved with DK Sir’s concept clarity & shortcut methods',
      '20-to-30-second problem-solving challenge breakdowns',
      'Detailed printable handwritten solution booklets & formula cheat sheets',
      'Topic-wise diagnostic quizzes with instant speed metrics'
    ],
    schedule: 'Flexible Online 24/7 Access • HD Video Archive',
    subjects: ['Mathematics']
  },

  // --- Online Test Series Packages ---
  {
    id: 'jee-all-india-test-series',
    title: 'All India Online CBT Test Series: Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'CBT Simulation',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹6,499',
    originalPrice: '₹9,999',
    numericPrice: 6499,
    discountPercentage: 35,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '2 Years Validity',
    language: 'English & Hindi Interface',
    validity: 'Till June 2028',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 6540,
    facultyAvatars: ['/images/students/rohan.jpg'],
    description: 'High-fidelity NTA CBT simulation matching real exam screen, palette, and marking rules with detailed question-wise analytics.',
    features: [
      '30 Full syllabus mock tests + 45 chapter-wise tests matching 2028 pattern',
      'Exact NTA exam interface with question status palette & timer',
      'Instant scorecards with question-wise time analysis and negative mark breakdown',
      'Step-by-step video explanations for every tricky problem from Kota teachers',
      'National percentile & AIR rank prediction against 20,000+ active aspirants'
    ],
    schedule: 'Bi-Weekly Tests on Sundays (9:00 AM & 2:00 PM Slots)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-maths-speed-cbt-series',
    title: 'DK Sir JEE Mathematics Speed & Accuracy CBT Series: Target JEE 2028',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Math Speed Sprint',
    badgeUrgency: 'urgency',
    tier: 'Paid',
    price: '₹3,999',
    originalPrice: '₹6,000',
    numericPrice: 3999,
    discountPercentage: 33,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '2 Years Validity',
    language: 'English & Hindi Interface',
    validity: 'Till June 2028',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 2890,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'Specialized timed CBT testing targeting speed, eliminating calculation errors, and mastering time-saving techniques under strict NTA exam conditions.',
    features: [
      '40 Topic-wise speed tests designed for 20-30s problem solving',
      'Negative mark diagnostic identifying calculation vs conceptual errors',
      'Video analysis of tough problems by DK Sir (Dharmendra Kumar)',
      'All India leaderboard comparing time spent per question'
    ],
    schedule: 'Weekly Online Timed Tests (Every Wednesday & Saturday)',
    subjects: ['Mathematics']
  },

  // --- Class 12th Live Online Courses ---
  {
    id: 'jee-advanced-mastery',
    title: 'Enthusiast 1-Year Live Online: Target JEE 2027',
    targetExam: 'JEE Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    badge: 'Class 12 Focus',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹64,000',
    originalPrice: '₹85,000',
    numericPrice: 64000,
    discountPercentage: 25,
    includesGst: true,
    emiText: 'or ₹5,333/mo – No-cost EMI available',
    batchStartDate: '2026-11-15',
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 3100,
    facultyAvatars: ['/images/students/rohan.jpg', '/images/students/aarav.jpg'],
    description: 'Advanced multi-concept problem solving, rigorous subjective analysis, and high-difficulty comprehension questions tailored for top IIT rank aspirants.',
    features: [
      '750+ hrs. of LIVE advanced problem-solving & tricky derivations',
      'Previous 15-year Advanced questions deconstruction',
      'Up to 35 full-length CBT tests matching latest IIT pattern',
      'Dedicated faculty doubt counter & error reduction sprints'
    ],
    schedule: 'Mon to Sat • Live Advanced Sessions (5:00 PM – 9:00 PM)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-maths-class12-dk-sir',
    title: 'DK Sir Class 12th Advanced Math & Calculus Mastery: Target JEE 2027',
    targetExam: 'JEE Advanced',
    category: 'JEE Advanced',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    badge: 'DK Sir Flagship',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹42,000',
    originalPrice: '₹56,000',
    numericPrice: 42000,
    discountPercentage: 25,
    includesGst: true,
    emiText: 'or ₹3,500/mo – No-cost EMI available',
    batchStartDate: '2026-11-18',
    batchCloseDate: '2026-11-30',
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 2870,
    facultyAvatars: ['/img/founder.jpeg', '/images/students/rohan.jpg'],
    description: 'Master Differential & Integral Calculus, Vectors, 3D Geometry, and Probability with DK Sir’s proprietary 20-30s shortcuts and deep graphical visualization.',
    features: [
      'Personally taught by DK Sir (Dharmendra Kumar) – Renowned IIT JEE Math Mentor',
      'Exclusive Calculus shortcut techniques & graphical transformation drills',
      'Class 12 Board Exam 100/100 revision modules included',
      '15+ Years JEE Advanced chapter-wise PYQ masterclass'
    ],
    schedule: 'Tue, Thu, Sat • Evening Live Sessions (6:00 PM – 9:00 PM)',
    subjects: ['Mathematics']
  },

  // --- Dropper / Repeater Live Courses ---
  {
    id: 'jee-dropper-achiever-batch',
    title: 'Achiever Dropper Super-30 Live Sprint: Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Dropper',
    targetYear: 'Target JEE 2027',
    badge: 'Super-30 Cohort',
    badgeUrgency: 'urgency',
    tier: 'Paid',
    price: '₹54,000',
    originalPrice: '₹72,000',
    numericPrice: 54000,
    discountPercentage: 25,
    includesGst: true,
    emiText: 'or ₹4,500/mo – No-cost EMI available',
    batchStartDate: '2026-11-15',
    courseType: 'live',
    mode: 'Live',
    duration: '10 Months',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 1540,
    facultyAvatars: ['/images/students/rohan.jpg', '/images/students/aarav.jpg'],
    description: 'Exclusive 30-student cohort with personalized daily milestone targets, 1:1 DK Sir doubt clinic, and top-1000 rank targeted test series.',
    features: [
      'Strictly capped at 30 students with dedicated daily mentor tracking',
      'Daily 20-to-30-second speed challenges with DK Sir',
      'Weekly full-length CBT tests with in-depth psychological temperament review',
      'Personalized formula cheat-sheets and error-correction logbook'
    ],
    schedule: 'Daily Intensive Sessions (8:30 AM – 1:00 PM)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-leader-dropper-batch',
    title: 'Leader Dropper Live Batch: Target JEE 2027',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Dropper',
    targetYear: 'Target JEE 2027',
    badge: 'High-Tempo Sprint',
    badgeUrgency: 'urgency',
    tier: 'Paid',
    price: '₹48,000',
    originalPrice: '₹65,000',
    numericPrice: 48000,
    discountPercentage: 26,
    includesGst: true,
    emiText: 'or ₹4,000/mo – No-cost EMI available',
    batchStartDate: '2026-11-15',
    courseType: 'live',
    mode: 'Live',
    duration: '10 Months',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 2280,
    facultyAvatars: ['/img/founder.jpeg', '/images/students/aarav.jpg'],
    description: 'Intensive single-year live sprint covering both Class 11 & 12 syllabus with high-tempo problem shortcuts, error analysis, and time-management drills.',
    features: [
      '900+ hrs. high-tempo PCM revision with speed inspection tricks',
      'Over 2,500 curated numerical & MCQ questions',
      'Weekly CBT mock test with detailed negative mark diagnostic',
      '1:1 mentorship from IITian alumni for test temperament'
    ],
    schedule: 'Daily 4-Hour Intensive Sprints (9:00 AM – 1:30 PM)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },

  {
    id: 'jee-dropper-maths-dk-sir',
    title: 'DK Sir Dropper Math Rank Booster: 20-30s Shortcut Mastery',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Advanced',
    targetClass: 'Dropper',
    targetYear: 'Target JEE 2027',
    badge: 'DK Sir Rank Booster',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹36,000',
    originalPrice: '₹48,000',
    numericPrice: 36000,
    discountPercentage: 25,
    includesGst: true,
    emiText: 'or ₹3,000/mo – No-cost EMI available',
    batchStartDate: '2026-11-20',
    courseType: 'live',
    mode: 'Live',
    duration: '10 Months',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: true,
    isBestValue: true,
    enrolledCount: 2940,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'DK Sir’s dedicated dropper program designed to boost Mathematics scores from 40 to 90+ percentile using proprietary 20-30s speed hacks and intense PYQ breakdowns.',
    features: [
      'Personally taught by DK Sir – High-speed concept clarity & graphical shortcut methods',
      'Daily 20-to-30-second problem-solving challenges in Calculus, Algebra, and Coordinate',
      'Chapter-wise PYQ deconstruction of the past 15 years (2012–2026)',
      '1:1 weekly mentor diagnosis to eradicate calculation slips and negative marks'
    ],
    schedule: 'Mon, Wed, Fri • Morning Live Mastery (10:00 AM – 1:00 PM)',
    subjects: ['Mathematics']
  },
  {
    id: 'jee-dropper-dlp-cbt-pack',
    title: 'Dropper Comprehensive Self-Study DLP + All India CBT Engine',
    targetExam: 'JEE Main & Advanced',
    category: 'JEE Main',
    targetClass: 'Dropper',
    targetYear: 'Target JEE 2027',
    badge: 'Self-Paced Sprint',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹19,500',
    originalPrice: '₹28,000',
    numericPrice: 19500,
    discountPercentage: 30,
    includesGst: true,
    emiText: 'or ₹3,250/mo (6 months EMI)',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '1 Year',
    language: 'English & Hinglish',
    validity: 'Till JEE Advanced 2027',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 1850,
    facultyAvatars: ['/images/students/rohan.jpg', '/images/students/aarav.jpg'],
    description: 'Complete high-yield dropper library with printed theory books, chapter worksheets, and full-length CBT mock exams replicating real NTA interface.',
    features: [
      'Complete Class 11 & 12 video archives tailored for repeaters (800+ videos)',
      '18 Printed Kota theory workbooks & 3,000-question practice problem sets',
      '35 All-India full syllabus CBT mock tests with national rank benchmarking'
    ],
    schedule: 'Self-Paced 24/7 Access with Weekly Faculty Doubt Clearing',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },

  // --- Foundation & Early Starter Programs ---
  {
    id: 'jee-foundation-class-9',
    title: 'Class 9th Pre-JEE & Math Olympiad Foundation (DK Sir Special)',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2030',
    badge: 'Class 9 Rigor',
    badgeUrgency: 'popular',
    tier: 'Paid',
    price: '₹24,000',
    originalPrice: '₹32,000',
    numericPrice: 24000,
    discountPercentage: 25,
    includesGst: true,
    emiText: 'or ₹2,000/mo (12 months)',
    batchStartDate: '2026-11-20',
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year',
    language: 'Hinglish (Hindi + Eng)',
    validity: '12 Months Access',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 1680,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'Develop supreme mathematical intuition, number theory, geometry visualization, and algebraic dexterity under DK Sir’s direct coaching.',
    features: [
      'DK Sir’s foundational mathematical trick sessions and Olympiad training (IOQM/PRMO)',
      'Bridging school curriculum with competitive analytical reasoning',
      'Weekly mental math sprints and conceptual diagnostic assignments'
    ],
    schedule: '3 Days / Week • Evening Interactive Live Sessions',
    subjects: ['Mathematics']
  },
  {
    id: 'jee-foundation-class-8',
    title: 'Class 8th Junior Math & Science Discovery Cohort: Target JEE 2031',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2031',
    badge: 'Junior Cohort',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹18,000',
    originalPrice: '₹25,000',
    numericPrice: 18000,
    discountPercentage: 28,
    includesGst: true,
    emiText: 'or ₹1,500/mo (12 months)',
    batchStartDate: '2026-11-25',
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year',
    language: 'English & Hinglish',
    validity: '12 Months Access',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 1120,
    facultyAvatars: ['/images/students/aarav.jpg'],
    description: 'Ignite curious minds with intuitive science and mathematics problem-solving techniques before high school.',
    features: [
      'Interactive visual experiments & creative mathematics puzzle breakdowns',
      'Building foundational speed and logical thinking early without academic stress',
      'Small batch format with individual mentor attention'
    ],
    schedule: '2 Days / Week (Saturday & Sunday Weekend Batch)',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-foundation-concept',
    title: 'Class 10th Pre-JEE & Early Olympiad Builder: Target JEE 2029',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2029',
    badge: 'Early Starter',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹28,000',
    originalPrice: '₹38,000',
    numericPrice: 28000,
    discountPercentage: 26,
    includesGst: true,
    emiText: 'or ₹2,333/mo (12 months)',
    batchStartDate: '2026-11-25',
    courseType: 'live',
    mode: 'Live',
    duration: '1 Year',
    language: 'English & Hinglish',
    validity: '12 Months',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 1450,
    facultyAvatars: ['/images/students/rohan.jpg'],
    description: 'Strong foundation building in Mathematics, Mechanics, and Chemical Bonding to ease the transition from Class 10 to competitive JEE preparation.',
    features: [
      'Fundamental concept visualization and algebraic intuition',
      'Gradual progression from NCERT basics to competitive level',
      'Step-by-step problem deconstruction & weekly quizzes',
      'Monthly parent-mentor progress review'
    ],
    schedule: '3 Days / Week • Evening Weekend Focus',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-rapid-crash-course',
    title: 'JEE Main Rapid Revision Crash Course',
    targetExam: 'Crash Course',
    category: 'Crash Course',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    badge: 'High-Yield Topics',
    badgeUrgency: 'urgency',
    tier: 'Paid',
    price: '₹14,999',
    originalPrice: '₹22,000',
    numericPrice: 14999,
    discountPercentage: 32,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    courseType: 'recorded',
    mode: 'Structured Recorded',
    duration: '60 Days',
    language: 'Hinglish (Hindi + Eng)',
    validity: 'Till JEE Main Session 2',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 1890,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'Fast-paced structured revision targeting high-weightage topics across PCM, quick problem shortcuts, and 500+ curated questions.',
    features: [
      'Condensed high-yield concept summaries for top 35 chapters',
      'Top 500 hand-picked practice questions per subject',
      'Speed and accuracy enhancement drills',
      '10 Full-length CBT mock tests with percentile analysis'
    ],
    schedule: 'Daily Intensive Sessions • 60-Day Sprint',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-foundation-dlp-complete',
    title: 'Class 8–10 Pre-JEE Foundation Self-Study DLP Pack & Books',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2029',
    badge: 'Printed Books + Videos',
    badgeUrgency: 'instant',
    tier: 'Paid',
    price: '₹14,500',
    originalPrice: '₹20,000',
    numericPrice: 14500,
    discountPercentage: 27,
    includesGst: true,
    emiText: 'or ₹2,416/mo (6 months EMI)',
    courseType: 'dlp',
    mode: 'Self-Paced',
    duration: '2 Years Access',
    language: 'English & Hinglish',
    validity: '24 Months Access',
    taughtByIitians: true,
    isPopular: true,
    enrolledCount: 2150,
    facultyAvatars: ['/images/students/aarav.jpg'],
    description: 'Foundational video library and printed modules for building early mathematical aptitude, science concepts, and Olympiad problem-solving skills.',
    features: [
      'Complete Class 8, 9 & 10 conceptual video lecture library (350+ videos)',
      '12 Printed Foundation workbooks delivered home at no extra charge',
      'Math Olympiad & Science Aptitude test series with nationwide ranks'
    ],
    schedule: 'Flexible Online Self-Paced • 24/7 Access',
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  },
  {
    id: 'jee-foundation-all-india-cbt',
    title: 'Junior Math Olympiad & Pre-JEE National CBT Test Series',
    targetExam: 'Foundation',
    category: 'Foundation',
    targetClass: 'Class 10th Foundation',
    targetYear: 'Target JEE 2029',
    badge: 'Olympiad Sprints',
    badgeUrgency: 'category',
    tier: 'Paid',
    price: '₹3,499',
    originalPrice: '₹5,000',
    numericPrice: 3499,
    discountPercentage: 30,
    includesGst: true,
    emiText: 'Single one-time payment (Incl. GST)',
    courseType: 'test-series',
    mode: 'Online Test Series',
    duration: '1 Year Validity',
    language: 'English Interface',
    validity: '12 Months',
    taughtByIitians: true,
    isPopular: false,
    enrolledCount: 1820,
    facultyAvatars: ['/img/founder.jpeg'],
    description: 'Timed online CBT tests tailored for IOQM, PRMO, NSEJS, and early competitive test-taking speed.',
    features: [
      '20 Olympiad-pattern online tests with detailed video hint solutions',
      'Step-by-step problem deconstruction by DK Sir (Dharmendra Kumar)',
      'National percentile prediction among junior prodigies'
    ],
    schedule: 'Fortnightly Sunday Tests (10:00 AM Slot)',
    subjects: ['Mathematics']
  }
];

// --- Why DK Academy Trust Points ---
export const WHY_DK_ACADEMY = [
  {
    title: 'Mentored by DK Sir (Dharmendra Kumar)',
    desc: 'Led by renowned IIT JEE Mathematics mentor DK Sir, specializing in deep conceptual clarity and 20-to-30-second problem-solving techniques.',
    iconName: 'GraduationCap'
  },
  {
    title: 'Short Tricks & Speed Challenges',
    desc: 'Master time-saving methods and shortcut techniques designed to solve complex multi-concept JEE Advanced problems with maximum precision.',
    iconName: 'Target'
  },
  {
    title: 'Online + Offline Janakpuri Center',
    desc: 'Attend live online batches from anywhere or physical classroom sessions at our modern coaching center in Janakpuri, New Delhi.',
    iconName: 'Laptop'
  },
  {
    title: 'Chapter-wise PYQs & 1:1 Mentorship',
    desc: 'Exhaustive chapter-by-chapter Previous Year Question (PYQ) video solutions and individual one-on-one progress tracking.',
    iconName: 'MessageSquare'
  }
];

// --- Student Testimonials ---
export const STUDENT_TESTIMONIALS = [
  {
    name: 'Aarav Sharma',
    rank: 'AIR 48 • JEE Advanced',
    batch: 'Class 11 & 12 2-Year Live Classroom',
    quote: 'DK Sir’s 20-to-30-second shortcut techniques completely transformed my speed in Mathematics. I went from struggling with time to finishing Math 20 minutes early in JEE Advanced.',
    avatar: '/images/students/aarav.jpg'
  },
  {
    name: 'Priya Iyer',
    rank: 'AIR 112 • JEE Advanced (99.94%ile)',
    batch: 'Class 11th Nurture Live Batch',
    quote: 'DK Sir explains Calculus and Coordinate Geometry with unmatched conceptual clarity. The 1:1 mentorship and chapter-wise PYQ breakdowns are unmatched.',
    avatar: '/images/students/priya.jpg'
  },
  {
    name: 'Rohan Deshmukh',
    rank: 'AIR 284 • JEE Advanced',
    batch: 'Self-Study DLP + All India CBT Series',
    quote: 'The PYQ solutions and video vault by DK Sir gave me the confidence to crack tough multi-correct questions. Outstanding methodology and mentor guidance.',
    avatar: '/images/students/rohan.jpg'
  }
];

// --- Faculty Highlights ---
export const FACULTY_HIGHLIGHTS = [
  {
    name: 'DK Sir (Dharmendra Kumar)',
    role: 'Founder & Chief Mathematics Mentor',
    experience: '15+ Years Mentoring • IIT JEE Math Specialist',
    avatar: '/img/founder-profile.jpeg',
    specialty: 'Concept Clarity, Shortcuts & 20-30s Techniques'
  },
  {
    name: 'Dr. Devendra Verma',
    role: 'Senior Physics Faculty',
    experience: '14+ Years Experience • Ph.D. Physics',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    specialty: 'Mechanics & Electrodynamics'
  },
  {
    name: 'Yashwant Kumar Sir',
    role: 'Head of Chemistry',
    experience: '8+ Years Experience • Ex-IIT Bombay',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    specialty: 'Physical & Organic Mechanisms'
  }
];

// --- FAQs for Courses Page ---
export const COURSES_FAQS = [
  {
    question: 'How do live online classes work at DK Academy?',
    answer: 'Live classes are conducted 4 to 6 days a week via our high-speed interactive learning platform. Students can ask audio doubts in real time or type questions in the chat. Full HD recorded backups of every lecture are published within 2 hours and remain available 24/7.'
  },
  {
    question: 'What is the refund and cancellation policy?',
    answer: 'We provide a transparent 7-Day Academic Money-Back Guarantee. If within 7 calendar days of your first batch lecture you feel the program does not suit your learning style, you can request a 100% tuition fee refund with no questions asked.'
  },
  {
    question: 'Are printed study modules included with online courses?',
    answer: 'Yes! Our 2-Year Ultimate Live Course and Self-Study DLP packages include complete sets of printed theory and exercise booklets (18 volumes covering PCM) shipped directly to your residential address across India at zero shipping cost.'
  },
  {
    question: 'Can I attend classes on mobile, tablet, or laptop?',
    answer: 'Yes. The DK Academy platform runs seamlessly on Android, iOS, Windows, macOS, and Linux web browsers. Computer-based tests (CBT) are best attempted on laptop or desktop to simulate the real NTA test environment.'
  },
  {
    question: 'What is the teaching language in these batches?',
    answer: 'Our flagship batches are conducted in Hinglish (concept explanations in Hindi with terminology, formulas, problem statements, and notes in English). We also provide pure English batches upon student preference.'
  },
  {
    question: 'How does the 24/7 doubt resolution system operate?',
    answer: 'Doubts are answered in 3 ways: (1) Live interactive doubt counter during class, (2) Daily scheduled 1-hour faculty doubt clinics after lecture hours, and (3) Our digital student portal where you upload a question photo for text & video solutions.'
  },
  {
    question: 'Is No-Cost EMI available for course fees?',
    answer: 'Yes, we provide 3, 6, 9, and 12-month No-Cost EMI options on major credit cards and debit cards via Razorpay/ShopSe with zero interest surcharge and instant approval.'
  }
];

// --- Course Comparison Matrix ---
export const COURSE_COMPARISON_MATRIX = {
  columns: ['Ultimate 2-Year Live', 'Self-Study DLP', 'Online CBT Test Series'],
  rows: [
    { feature: 'Live Interactive Lectures', live: '1200+ Hours (Live)', dlp: 'Recorded Archive (760+ Hrs)', test: '—' },
    { feature: 'Kota Pedagogy Faculty', live: 'Yes (Live Interaction)', dlp: 'Yes (Recorded)', test: 'Video Solutions Only' },
    { feature: 'Printed Modules at Home', live: 'Included (18 Books)', dlp: 'Included (18 Books)', test: 'PDF Notes Only' },
    { feature: 'Computer-Based Mock Tests', live: '40 Full Tests + 60 Chapter Tests', dlp: '25 Full Tests', test: '30 Full + 45 Chapter Tests' },
    { feature: '1:1 IITian Mentor Assigned', live: 'Yes (Bi-Weekly Check-in)', dlp: 'Monthly Check-in', test: '—' },
    { feature: 'Doubt Resolution Support', live: 'Live Counter + Portal 24/7', dlp: 'Telegram Community', test: 'Video Explanations' },
    { feature: 'Access Validity', live: 'Till JEE Advanced 2028', dlp: 'Till JEE Advanced 2028', test: '2 Years Validity' },
    { feature: 'Course Fee', live: '₹84,000 (Incl. GST)', dlp: '₹18,500 (Incl. GST)', test: '₹6,499 (Incl. GST)' }
  ]
};

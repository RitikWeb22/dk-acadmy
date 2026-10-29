import type { Course, Lecture, PracticeFeature, ValueProp, LearningStep, Testimonial, FaqItem } from '../types';

export const COURSES_DATA: Course[] = [
  {
    id: 'jee-main-comprehensive',
    title: 'JEE Main Comprehensive Batch',
    targetExam: 'JEE Main',
    targetYear: 'Target 2026/2027',
    badge: 'Flagship Curriculum',
    tier: 'Paid',
    description: 'Complete syllabus coverage for Physics, Chemistry, and Mathematics aligned with NTA JEE Main pattern with chapter-wise DPPs and tests.',
    features: [
      'Full Class 11 & 12 syllabus coverage',
      'Daily Practice Problem (DPP) sets with solutions',
      'Chapter-wise mock test series & CBT simulations',
      'Formula sheets & consolidated revision notes'
    ],
    schedule: 'Mon to Sat • Structured Schedule',
    mode: 'Live + Recorded',
    isPopular: true
  },
  {
    id: 'jee-advanced-mastery',
    title: 'JEE Advanced Mastery Program',
    targetExam: 'JEE Advanced',
    targetYear: 'Target 2026',
    badge: 'Problem Solving Focus',
    tier: 'Paid',
    description: 'Advanced multi-concept problem solving, rigorous subjective analysis, and high-difficulty comprehension questions for IIT aspirants.',
    features: [
      'Multi-concept question-solving methodology',
      'Deep dive into tricky derivations and proofs',
      'Previous 15-year Advanced question analysis',
      'Detailed analytical test series with error logs'
    ],
    schedule: '4 Days / Week • Advanced Sessions',
    mode: 'Live + Recorded',
    isPopular: false
  },
  {
    id: 'jee-rapid-crash-course',
    title: 'JEE Crash Course & Rapid Revision',
    targetExam: 'JEE Main',
    targetYear: 'Target 2026',
    badge: 'High-Yield Topics',
    tier: 'Paid',
    description: 'Fast-paced structured revision targeting high-weightage topics across PCM, quick problem shortcuts, and intensive formula recaps.',
    features: [
      'Condensed high-yield concept summaries',
      'Top 500 hand-picked practice questions per subject',
      'Speed and accuracy enhancement drills',
      'Full-length CBT mock tests'
    ],
    schedule: 'Daily Intensive Sessions',
    mode: 'Structured Recorded',
    isPopular: false
  },
  {
    id: 'jee-foundation-concept',
    title: 'JEE Foundation & Concept Builder',
    targetExam: 'Foundation',
    targetYear: 'Class 11 / Early Starters',
    badge: 'Core Fundamentals',
    tier: 'Paid',
    description: 'Strong foundation building in Mathematics, Mechanics, and Chemical Bonding to ease the transition from 10th to competitive JEE preparation.',
    features: [
      'Fundamental concept visualization',
      'Gradual progression from NCERT to JEE level',
      'Step-by-step problem deconstruction',
      'Weekly doubt resolution sessions'
    ],
    schedule: '3 Days / Week',
    mode: 'Self-Paced'
  }
];

export const FEATURED_LECTURES: Lecture[] = [
  {
    id: 'lec-physics-rotational',
    title: 'Rotational Motion: Moment of Inertia & Torque Analysis',
    subject: 'Physics',
    chapter: 'Rigid Body Dynamics',
    duration: '48 mins',
    level: 'JEE Advanced',
    instructor: 'Physics Faculty',
    description: 'Systematic approach to calculating moment of inertia for composite bodies and applying Newton’s 2nd Law in rotational form.'
  },
  {
    id: 'lec-chem-reaction-mechanism',
    title: 'Organic Chemistry: SN1, SN2, E1 & E2 Reaction Pathways',
    subject: 'Chemistry',
    chapter: 'Haloalkanes & Alkyl Halides',
    duration: '42 mins',
    level: 'JEE Main & Advanced',
    instructor: 'Chemistry Faculty',
    description: 'Comprehensive stereochemical outcomes, solvent effects, substrate stability, and carbocation rearrangement pathways.'
  },
  {
    id: 'lec-math-calculus-limits',
    title: 'Definite Integration & Area Under Curves with Symmetry',
    subject: 'Mathematics',
    chapter: 'Integral Calculus',
    duration: '55 mins',
    level: 'JEE Advanced',
    instructor: 'Mathematics Faculty',
    description: 'Mastering Queen’s and King’s properties of definite integrals, Leibniz theorem for differentiating integrals, and bounding areas.'
  },
  {
    id: 'lec-chem-chemical-bonding',
    title: 'Chemical Bonding: Hybridization & Molecular Orbital Theory',
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    duration: '38 mins',
    level: 'JEE Main',
    instructor: 'Chemistry Faculty',
    description: 'MOT diagrams for homo & hetero nuclear diatomics, calculating bond order, magnetic behavior, and VSEPR geometry.'
  }
];

export const PRACTICE_FEATURES: PracticeFeature[] = [
  {
    id: 'pyq-bank',
    title: 'PYQ Question Bank',
    shortTag: '15+ Years Coverage',
    description: 'Chapter-wise, topic-segregated previous year questions from JEE Main and JEE Advanced with step-by-step solution steps.',
    bulletPoints: [
      'Filtered by topic and difficulty level',
      'Detailed analytical solution methodologies',
      'Downloadable PDF question sets with keys'
    ],
    route: '/pyq',
    badgeText: 'Updated 2026'
  },
  {
    id: 'dpp-system',
    title: 'Daily Practice Problems (DPP)',
    shortTag: 'Daily Habit Building',
    description: 'Structured daily 10-15 question problem sets mapped directly to lecture topics to reinforce concept retention every single day.',
    bulletPoints: [
      'Graded levels: Foundation to Advanced',
      'Comprehensive hint and step-by-step guidance',
      'Topic-level concept reinforcement'
    ],
    route: '/dpp',
    badgeText: 'Curated Daily'
  },
  {
    id: 'mock-tests',
    title: 'Online Mock Test Series',
    shortTag: 'NTA Exam Simulation',
    description: 'Computer-based test (CBT) environment matching the real JEE interface to build exam temperament, time management, and accuracy.',
    bulletPoints: [
      'Identical NTA test interface with palette & timer',
      'Subject-wise and full-syllabus tests',
      'Instant scorecards with question-wise time analysis'
    ],
    route: '/test-series',
    badgeText: 'CBT Interface'
  },
  {
    id: 'video-solutions',
    title: 'Detailed Video Explanations',
    shortTag: 'Step-by-Step Clarity',
    description: 'Video walkthroughs dissecting challenging problems, identifying common student pitfalls, and demonstrating alternative solution shortcuts.',
    bulletPoints: [
      'Focus on problem breakdown logic',
      'Highlighting calculation traps and edge cases',
      'Alternative conceptual methods shown'
    ],
    route: '/free-lectures',
    badgeText: 'High Clarity'
  }
];

export const WHY_CHOOSE_US: ValueProp[] = [
  {
    id: 'all-in-one',
    title: 'All Resources in One Place',
    description: 'No more switching between random PDFs and scattered links. Lectures, notes, DPPs, and tests stay organized under one dashboard.',
    iconName: 'Layers'
  },
  {
    id: 'structured-workflow',
    title: 'Structured Preparation Routine',
    description: 'Follow a coherent academic pathway designed to guide you from foundational concepts up to rigorous JEE Advanced multi-concept problem solving.',
    iconName: 'Compass'
  },
  {
    id: 'free-quality-education',
    title: 'Genuine Free Learning Material',
    description: 'Access essential chapter lectures, core concept tutorials, and practice questions completely free without artificial paywalls on core basics.',
    iconName: 'Sparkles'
  },
  {
    id: 'systematic-practice',
    title: 'Organized Practice & Revision',
    description: 'Systematic daily problem sheets (DPPs) and chapter-wise previous year questions (PYQs) reinforce concepts before they fade.',
    iconName: 'CheckCircle2'
  }
];

export const LEARNING_JOURNEY: LearningStep[] = [
  {
    stepNumber: 1,
    title: 'Explore & Choose Track',
    description: 'Review the JEE syllabus, identify your target year, and choose between structured full batches or free chapter lectures.',
    iconName: 'Search'
  },
  {
    stepNumber: 2,
    title: 'Master Concepts with Lectures',
    description: 'Attend video lectures with crystal-clear theory explanations, mathematical derivations, and illustrative model problems.',
    iconName: 'BookOpen'
  },
  {
    stepNumber: 3,
    title: 'Daily Practice with DPP & PYQ',
    description: 'Solve graded problem sets right after every lecture and tackle chapter-wise past 15 years of JEE Main & Advanced questions.',
    iconName: 'PenTool'
  },
  {
    stepNumber: 4,
    title: 'Attempt CBT Mock Tests & Review',
    description: 'Simulate real exam conditions with timed CBT tests, analyze time spent per question, and review video solutions to eliminate weaknesses.',
    iconName: 'BarChart3'
  }
];

export const QUICK_ACCESS_ITEMS = [
  {
    id: 'qa-courses',
    title: 'Structured Courses',
    description: 'Comprehensive batches for JEE Main & Advanced with year-long roadmap.',
    route: '/courses',
    badge: 'Popular',
    iconName: 'GraduationCap'
  },
  {
    id: 'qa-free-lectures',
    title: 'Free Lectures',
    description: 'High-quality concept videos and problem breakdowns available at zero cost.',
    route: '/free-lectures',
    badge: 'Free Access',
    iconName: 'PlayCircle'
  },
  {
    id: 'qa-pyq',
    title: 'PYQ Question Bank',
    description: 'Chapter-wise previous year questions with verified detailed solutions.',
    route: '/pyq',
    badge: 'Updated 2026',
    iconName: 'FileCheck'
  },
  {
    id: 'qa-dpp',
    title: 'Daily Practice Problems',
    description: 'Topic-wise daily challenge sheets to build speed and conceptual accuracy.',
    route: '/dpp',
    badge: 'Daily',
    iconName: 'CheckSquare'
  },
  {
    id: 'qa-test-series',
    title: 'Online Test Series',
    description: 'Computer-based mock tests simulating real NTA exam interface & timing.',
    route: '/test-series',
    badge: 'CBT Mode',
    iconName: 'Award'
  }
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Aarav Sharma',
    avatarText: 'AS',
    image: '/images/students/aarav.jpg',
    score: '99.85 %ile in JEE Maths',
    rankOrCollege: 'IIT Bombay (CSE)',
    examTag: 'JEE Advanced',
    quote: 'The 112-video series on Limits, Continuity & Differentiability completely changed my perception of calculus. Sir\'s shortcut methods saved me at least 15 precious minutes in the real JEE Main exam!',
    highlightTopic: 'LCD & Calculus Series',
    rating: 5,
    verified: true
  },
  {
    id: 'test-2',
    name: 'Priya Singhania',
    avatarText: 'PS',
    image: '/images/students/priya.jpg',
    score: 'AIR 894 in JEE Advanced',
    rankOrCollege: 'IIT Delhi (Mechanical)',
    examTag: 'JEE Advanced',
    quote: 'Solving King\'s and Queen\'s properties in definite integration used to take me 6 to 7 long steps. DK Academy\'s rapid inspection techniques made tricky integral problems intuitive and error-free.',
    highlightTopic: 'Definite Integration',
    rating: 5,
    verified: true
  },
  {
    id: 'test-3',
    name: 'Rohan Verma',
    avatarText: 'RV',
    image: '/images/students/rohan.jpg',
    score: '99.4 %ile in JEE Main Math',
    rankOrCollege: 'IIT Roorkee',
    examTag: 'JEE Main',
    quote: 'No superficial formulas — each PYQ breakdown highlights exactly where examiners set trap options. The Telegram formula sheets and daily practice routine were my daily revision bible.',
    highlightTopic: 'Differential Equations & PYQs',
    rating: 5,
    verified: true
  },
  {
    id: 'test-4',
    name: 'Ananya Deshmukh',
    avatarText: 'AD',
    image: '/images/students/ananya.jpg',
    score: '100/100 in Boards Math',
    rankOrCollege: 'JEE Main 99.2 %ile',
    examTag: 'Boards & JEE',
    quote: 'The transition from Class 11 to 12 can be intimidating, but the structured concept builds gave me total clarity in algebraic progressions, straight lines, and coordinate geometry.',
    highlightTopic: 'Coordinate & Algebra',
    rating: 5,
    verified: true
  },
  {
    id: 'test-5',
    name: 'Aditya Nair',
    avatarText: 'AN',
    image: '/images/students/aditya.jpg',
    score: '99.6 %ile in Math',
    rankOrCollege: 'Dropper Batch Success',
    examTag: 'JEE Main',
    quote: 'As a repeater, I needed speed without wasting time on elementary theory. The Crash Course & Fast-Track drills gave me high-speed tricks that turned math into my highest scoring subject.',
    highlightTopic: 'Fast-Track Shortcut Drills',
    rating: 5,
    verified: true
  },
  {
    id: 'test-6',
    name: 'Kavya Patel',
    avatarText: 'KP',
    image: '/images/students/kavya.jpg',
    score: 'Foundation Topper',
    rankOrCollege: 'JEE 2027 Aspirant',
    examTag: 'Foundation',
    quote: 'The Class 9 & 10 Foundation program built my analytical mindset early. I am already solving Class 11 sequences and quadratic equations comfortably before starting school coaching!',
    highlightTopic: 'Foundation Analytics',
    rating: 5,
    verified: true
  }
];

export const FAQS_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Are all the lectures on the official DK Academy JEE YouTube channel completely free?',
    answer: 'Yes, 100%! All 760+ chapter-wise lectures, including our flagship 112-video Limits, Continuity & Differentiability (LCD) series, Definite Integration playlists, and Differential Equations walkthroughs, are completely free with zero hidden paywalls.',
    category: 'Lectures & YouTube'
  },
  {
    id: 'faq-2',
    question: 'How do I practice Daily Practice Problems (DPP) and Previous Year Questions (PYQs)?',
    answer: 'You can directly visit our interactive DPP portal at /dpp and PYQ Question Bank at /pyq. Both feature full practice and test modes, instant score evaluation, hints, and step-by-step solutions without requiring any login.',
    category: 'Practice & PYQ'
  },
  {
    id: 'faq-3',
    question: 'Which batch should a Class 12 dropper or repeating student choose?',
    answer: 'Droppers should follow our "JEE Main & Advanced Comprehensive Coaching" batch combined with the "Crash Courses & Fast-Track Problem Solving" playlist. This dual approach sharpens speed shortcuts while closing theoretical conceptual gaps.',
    category: 'Batches & Courses'
  },
  {
    id: 'faq-4',
    question: 'Where can I access handwritten PDF lecture notes and formula shortcut sheets?',
    answer: 'All session notes, curated formula cheat sheets, and assignment PDFs are shared natively via our primary teaching channel and our active Telegram community. Direct links are provided across lectures and the About section.',
    category: 'Mentorship & Notes'
  },
  {
    id: 'faq-5',
    question: 'What is "The Main Mentor Podcast" and how does it help aspirants?',
    answer: 'The Main Mentor Podcast is our dedicated mentorship show covering time-management strategies, parent-to-topper guidance sessions, mock test error analysis, and mental preparation required for cracking JEE Main and Advanced.',
    category: 'Mentorship & Notes'
  },
  {
    id: 'faq-6',
    question: 'Does DK Academy offer guidance for Class 9 & 10 Foundation students?',
    answer: 'Yes! We run specialized Foundation courses for Class 9 and 10 students that cultivate mathematical curiosity, algebraic logic, and early competitive aptitude to provide a huge head start before entering Class 11.',
    category: 'Batches & Courses'
  }
];

import type {
  HeroSlide,
  TrendingSlide,
  AchieverItem,
  SuccessStoryItem,
  OnlineCategoryItem,
  LearningFeatureChip
} from '../types';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-dk-results-banner',
    badge: 'Results & Top Performers',
    title: 'Our JEE Results Speak — Consistent Top Performers',
    subtitle: 'Mentored by DK Sir (IIT-JEE Mathematics). Small batches with personalized attention for Class 8th–10th Foundation and Class 11th–12th & Droppers at Dwarka Sector 12.',
    highlightText: '99.814%ile Top JEE Score',
    primaryCta: { label: 'Explore Batches', to: '/courses' },
    secondaryCta: { label: 'Center Details', to: '/about' },
    stats: [
      { label: 'Highest Score', value: '99.814 %ile' },
      { label: 'Faculty Mentor', value: 'DK Sir (IIT-JEE)' },
      { label: 'Center Location', value: 'Dwarka Sector 12' }
    ],
    features: [
      'Shaurya Singh (99.5%ile), Rishabh Anand (99.814%ile, AIR 2146)',
      'Small batch size for individual problem-solving & conceptual depth',
      'Foundation (8th–10th) + Class 11th–12th & Dropper IIT-JEE Mathematics'
    ],
    theme: 'navy',
    visualType: 'jee-main',
    bannerImage: '/img/dk-results-banner.jpeg'
  },
  {
    id: 'slide-jee-main',
    badge: 'NTA JEE Main 2026–2027',
    title: 'Crack JEE Main with Proven Methodology',
    subtitle: 'Comprehensive Class 11 & 12 syllabus coverage for Physics, Chemistry, and Mathematics strictly aligned with NTA pattern.',
    highlightText: '99.85 %ile Top Mathematics Score',
    primaryCta: { label: 'Explore JEE Main Batch', to: '/courses?category=JEE+Main' },
    secondaryCta: { label: 'Watch Free Lectures', to: '/free-lectures' },
    stats: [
      { label: 'Practice Bank', value: '15+ Yrs PYQs' },
      { label: 'Free Lectures', value: '760+ Videos' },
      { label: 'CBT Simulation', value: '100% NTA Format' }
    ],
    features: [
      'Complete PCM Class 11 & 12 syllabus coverage',
      'Daily Practice Problem (DPP) sets with solution steps',
      'Computer-based mock test series with instant analytics'
    ],
    theme: 'blue',
    visualType: 'jee-main'
  },
  {
    id: 'slide-jee-advanced',
    badge: 'IIT Rankers Program',
    title: 'Master Multi-Concept & Tough Derivations',
    subtitle: 'Rigorous analytical treatment, non-standard physics problem setups, and advanced calculus integration designed for top IIT ranks.',
    highlightText: 'AIR 894 in JEE Advanced',
    primaryCta: { label: 'Explore JEE Advanced', to: '/courses?category=JEE+Advanced' },
    secondaryCta: { label: 'Solve Advanced PYQs', to: '/pyq' },
    stats: [
      { label: 'Advanced Questions', value: '2,500+ Solved' },
      { label: 'Calculus Series', value: '112 Masterclasses' },
      { label: 'Preparation Mode', value: 'Live + Recorded' }
    ],
    features: [
      'Multi-concept question-solving methodology',
      'Calculus integration in mechanics & electrodynamics',
      'Detailed analytical test series with error logs'
    ],
    theme: 'indigo',
    visualType: 'jee-advanced'
  },
  {
    id: 'slide-dpp-pyq',
    badge: '100% Free Practice Ecosystem',
    title: '15+ Years PYQ Bank & Daily DPP Challenge',
    subtitle: 'Build daily speed, accuracy, and examination temperament with chapter-wise solved questions and timed challenge sheets.',
    highlightText: 'Zero Paywall on Practice Sheets',
    primaryCta: { label: 'Solve Daily DPP', to: '/dpp' },
    secondaryCta: { label: 'Browse PYQ Papers', to: '/pyq' },
    stats: [
      { label: 'Questions Curated', value: '10,000+' },
      { label: 'Years Covered', value: '2011–2025' },
      { label: 'Answer Explanations', value: 'Step-by-Step' }
    ],
    features: [
      'Topic-level concept reinforcement every single day',
      'Instant scorecards with question-wise time analysis',
      'Complete solution steps, hints, and formulas'
    ],
    theme: 'emerald',
    visualType: 'dpp-pyq'
  },
  {
    id: 'slide-free-lectures',
    badge: 'Transparent Education',
    title: '760+ Free High-Clarity Video Masterclasses',
    subtitle: 'From foundational mechanics and chemical bonding to our flagship 112-video Limits, Continuity & Differentiability playlist.',
    highlightText: 'Open for Every Aspirant',
    primaryCta: { label: 'Start Free Learning', to: '/free-lectures' },
    secondaryCta: { label: 'Foundation Program', to: '/courses?category=Foundation' },
    stats: [
      { label: 'Free Videos', value: '760+ Lectures' },
      { label: 'Flagship Series', value: 'Calculus 112' },
      { label: 'PDF Notes', value: 'Telegram Access' }
    ],
    features: [
      'Zero subscription required for core theory masterclasses',
      'Handwritten formula sheets and question walk-throughs',
      'Shortcut inspection methods for fast examination solving'
    ],
    theme: 'navy',
    visualType: 'free-mastery'
  }
];

export interface ExploreCardItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  iconName: 'Video' | 'BookOpen' | 'FileCheck' | 'Award';
  route: string;
  themeColor: string;
}

export const EXPLORE_LEARNING_ITEMS: ExploreCardItem[] = [
  {
    id: 'exp-live',
    title: 'Live Batches',
    subtitle: 'Structured interactive cohorts with faculty guidance and weekly schedules.',
    badge: 'Flagship',
    iconName: 'Video',
    route: '/courses',
    themeColor: '#2563EB'
  },
  {
    id: 'exp-courses',
    title: 'Self-Paced Courses',
    subtitle: 'Comprehensive Class 11 & 12 video modules with formula sheets.',
    badge: 'Flexible',
    iconName: 'BookOpen',
    route: '/courses',
    themeColor: '#7C3AED'
  },
  {
    id: 'exp-self-study',
    title: 'Self Study & DPP',
    subtitle: 'Daily 10-15 problem sheets and 15-year chapter-wise PYQ question bank.',
    badge: '100% Free',
    iconName: 'FileCheck',
    route: '/dpp',
    themeColor: '#059669'
  },
  {
    id: 'exp-test-series',
    title: 'Online Test Series',
    subtitle: 'Real NTA CBT interface simulation with instant percentile scorecards.',
    badge: 'CBT Interface',
    iconName: 'Award',
    route: '/test-series',
    themeColor: '#D97706'
  }
];

export const TRENDING_SLIDES: TrendingSlide[] = [
  {
    id: 'trend-1',
    tag: 'Syllabus Strategy',
    title: 'JEE 2026 High-Weightage Chapter Blueprint',
    description: 'Systematic weightage breakdown across Modern Physics, Calculus, and Organic Chemistry with historical marks trends.',
    badge: 'Recommended Guide',
    ctaText: 'View Course Syllabus',
    ctaLink: '/courses',
    theme: 'cyan',
    stat: 'Top 35 High-Yield Chapters'
  },
  {
    id: 'trend-2',
    tag: 'PYQ Question Bank',
    title: '15-Year Topic-Wise PYQ Marathon with Detailed Solutions',
    description: 'Every JEE Main & Advanced question from 2011 to 2025 classified by topic with analytical steps and examiner trap notes.',
    badge: 'Updated 2026',
    ctaText: 'Solve PYQ Bank',
    ctaLink: '/pyq',
    theme: 'purple',
    stat: '2,500+ Solved Questions'
  },
  {
    id: 'trend-3',
    tag: 'Daily Habit Builder',
    title: 'Daily Practice Problems (DPP) Challenge Series',
    description: 'Solve 10-15 handpicked problems daily right after concept lectures to build accuracy and eliminate calculation errors.',
    badge: 'Daily Sprint',
    ctaText: 'Attempt Daily DPP',
    ctaLink: '/dpp',
    theme: 'amber',
    stat: '10-15 Mins Practice'
  },
  {
    id: 'trend-4',
    tag: 'Calculus Flagship',
    title: '112-Video Free Limits, Continuity & Calculus Masterclass',
    description: 'Master King’s and Queen’s integral properties, symmetry tricks, and Leibniz derivations with zero paywalls.',
    badge: 'Zero Paywall',
    ctaText: 'Watch Free Series',
    ctaLink: '/free-lectures',
    theme: 'emerald',
    stat: '100% Free on YouTube'
  }
];

export const ACHIEVERS_LIST: AchieverItem[] = [
  {
    id: 'ach-rishabh',
    name: 'Rishabh Anand',
    image: '/img/IMG_5099.JPG.jpeg',
    score: '99.814 %ile in JEE Mains',
    rankOrCollege: 'AIR 2146 • JEE Advanced',
    examTag: 'JEE Advanced',
    highlightTopic: 'Calculus & Integration Series (Janakpuri)',
    year: '2024',
    verified: true,
    storySnippet: 'DK Sir’s non-standard calculus drills and shortcut inspection methods made tackling tough multi-concept questions second nature.'
  },
  {
    id: 'ach-chirayu',
    name: 'Chirayu Sethia',
    image: '/img/achivers3.jpeg',
    score: '99.5 %ile in JEE Mains',
    rankOrCollege: 'AIR 6781 • BITS Rank 292',
    examTag: 'JEE Advanced',
    highlightTopic: 'Advanced Mathematics & BITSAT Crash Batch',
    year: '2024',
    verified: true,
    storySnippet: 'The small batch size at DK Academy ensured every single doubt was analyzed conceptually rather than rushed through.'
  },
  {
    id: 'ach-ashutosh',
    name: 'Ashutosh Shukla',
    image: '/img/achivers2.jpeg',
    score: '99.44 %ile in JEE Mains',
    rankOrCollege: 'AIR 4820 • Top Percentile Scorer',
    examTag: 'JEE Main',
    highlightTopic: 'Algebra & Coordinate Geometry Module',
    year: '2024',
    verified: true,
    storySnippet: 'Daily practice problem sets with step-by-step reasoning helped me eliminate negative marking traps and achieve 99.44%ile.'
  },
  {
    id: 'ach-tejas',
    name: 'Tejas Itankar',
    image: '/img/achivers4.jpeg',
    score: '98.99 %ile in JEE Mains',
    rankOrCollege: 'NIT Nagpur • Consistent Top Performer',
    examTag: 'JEE Main',
    highlightTopic: 'Vectors 3D & Differential Calculus',
    year: '2024',
    verified: true,
    storySnippet: 'Systematic 15-year PYQ chapter analysis turned Mathematics into my highest-scoring paper on exam day.'
  },
  {
    id: 'ach-harsh',
    name: 'Harsh Kumar',
    image: '/img/achivers5.jpeg',
    score: '97.56 %ile in JEE Mains',
    rankOrCollege: 'AIR 10964 • JEE Advanced Qualified',
    examTag: 'JEE Advanced',
    highlightTopic: 'Analytical Mathematics Series (Janakpuri)',
    year: '2024',
    verified: true,
    storySnippet: 'Rigorous classroom mentoring under DK Sir built strong exam stamina and deep conceptual foundations for Advanced.'
  },
  {
    id: 'ach-tanishq',
    name: 'Tanishq Gupta',
    image: '/img/achivers1.jpeg',
    score: '97.75 %ile in JEE Mains',
    rankOrCollege: 'Top JEE Main Achiever',
    examTag: 'JEE Main',
    highlightTopic: 'Trigonometry & Functions Crash Course',
    year: '2024',
    verified: true,
    storySnippet: 'Clear geometric visualization and constant revision sheets kept formulas sharp without rote memorization.'
  }
];

export const SUCCESS_STORIES: SuccessStoryItem[] = [
  {
    id: 'story-1',
    name: 'Aarav Sharma',
    image: '/images/students/aarav.jpg',
    achievement: '99.85 %ile in Mathematics',
    college: 'IIT Bombay • Computer Science',
    examTag: 'JEE Advanced',
    quote: 'The 112-video series on Limits, Continuity & Differentiability completely changed my perception of calculus. Sir\'s inspection shortcuts saved me at least 15 minutes during the actual exam.',
    videoDuration: '4:15 min story',
    keyTakeaway: 'Calculus mastery & rapid inspection methods',
    rating: 5
  },
  {
    id: 'story-2',
    name: 'Priya Singhania',
    image: '/images/students/priya.jpg',
    achievement: 'AIR 894 in JEE Advanced',
    college: 'IIT Delhi • Mechanical Engineering',
    examTag: 'JEE Advanced',
    quote: 'Solving properties in definite integration used to take 6 to 7 lines of tedious algebra. DK Academy taught me conceptual symmetry that made multi-concept problems intuitive.',
    videoDuration: '3:45 min story',
    keyTakeaway: 'Integral properties & symmetry breakdowns',
    rating: 5
  },
  {
    id: 'story-3',
    name: 'Rohan Verma',
    image: '/images/students/rohan.jpg',
    achievement: '99.4 %ile in JEE Main',
    college: 'IIT Roorkee',
    examTag: 'JEE Main',
    quote: 'The daily Telegram formula sheets and the chapter-wise 15-year PYQ portal were my daily revision companion. No superficial formulas, only deep conceptual accuracy.',
    videoDuration: '5:02 min story',
    keyTakeaway: 'PYQ error reduction & daily consistency',
    rating: 5
  },
  {
    id: 'story-4',
    name: 'Ananya Deshmukh',
    image: '/images/students/ananya.jpg',
    achievement: '100/100 in Boards Math • 99.2 %ile',
    college: 'Engineering Aspirant',
    examTag: 'Boards & JEE',
    quote: 'Balancing Class 12 board preparations with rigorous JEE problem solving felt overwhelming until I started following the structured chapter sequence here.',
    videoDuration: '3:20 min story',
    keyTakeaway: 'Dual preparation for CBSE & JEE Main',
    rating: 5
  },
  {
    id: 'story-5',
    name: 'Aditya Nair',
    image: '/images/students/aditya.jpg',
    achievement: '99.6 %ile Dropper Turnaround',
    college: 'NIT Trichy / IIT Aspirant',
    examTag: 'JEE Main',
    quote: 'As a repeater, I needed speed without wasting time re-reading elementary theory. The Crash Course problem sprints gave me the high-tempo drills I needed.',
    videoDuration: '4:30 min story',
    keyTakeaway: 'Dropper sprint strategy & speed accuracy',
    rating: 5
  },
  {
    id: 'story-6',
    name: 'Kavya Patel',
    image: '/images/students/kavya.jpg',
    achievement: 'Foundation Excellence',
    college: 'JEE 2027 Aspirant',
    examTag: 'Foundation',
    quote: 'Starting in Class 10 gave me a solid mathematical foundation. The gradual ramp up from NCERT to competitive JEE level removed all intimidation from higher math.',
    videoDuration: '3:50 min story',
    keyTakeaway: 'Early foundation & conceptual visualization',
    rating: 5
  }
];

export const ONLINE_CATEGORIES: OnlineCategoryItem[] = [
  {
    id: 'cat-jee-main',
    title: 'JEE Main Programs',
    targetClass: 'Class 11, Class 12 & Droppers',
    description: 'Structured comprehensive batches covering Physics, Chemistry, and Mathematics strictly aligned with NTA pattern, chapter-wise DPPs, and CBT mocks.',
    iconName: 'Target',
    highlights: ['Full PCM Syllabus', 'Daily Practice Problems', 'NTA Pattern Mock Tests'],
    categoryValue: 'JEE Main',
    accentColor: '#2563EB'
  },
  {
    id: 'cat-jee-advanced',
    title: 'JEE Advanced Mastery',
    targetClass: 'Top 1000 IIT Rank Aspirants',
    description: 'Rigorous multi-concept problem deconstruction, non-standard physics setups, calculus proofs, and previous 15-year Advanced question analysis.',
    iconName: 'Zap',
    highlights: ['Multi-Concept Solving', 'Calculus Deep Dive', 'Subjective Proofs & Analysis'],
    categoryValue: 'JEE Advanced',
    accentColor: '#7C3AED'
  },
  {
    id: 'cat-foundation',
    title: 'Foundation Programs',
    targetClass: 'Class 9 & 10 Early Starters',
    description: 'Early analytical skill development in Mathematics, Mechanics, and Chemical Bonding to make the transition into competitive Class 11 seamless.',
    iconName: 'BookMarked',
    highlights: ['Core Fundamentals', 'Math Logic & Equations', 'NCERT to JEE Transition'],
    categoryValue: 'Foundation',
    accentColor: '#059669'
  },
  {
    id: 'cat-crash',
    title: 'Rapid Crash Courses',
    targetClass: 'Sprint Revision (Class 12 & Droppers)',
    description: 'Fast-paced structured revision targeting high-frequency chapters across PCM, time-saving shortcuts, and 500+ curated practice questions.',
    iconName: 'Sparkles',
    highlights: ['High-Yield Topic Sprint', '500 Hand-Picked Problems', 'Formula Cheat Sheets'],
    categoryValue: 'Crash Course',
    accentColor: '#D97706'
  }
];

export const LEARNING_FEATURE_CHIPS: LearningFeatureChip[] = [
  {
    id: 'feat-free-lectures',
    title: 'Free Lectures',
    description: '760+ chapter videos on YouTube',
    iconName: 'Video',
    route: '/free-lectures'
  },
  {
    id: 'feat-dpp',
    title: 'Daily Practice Problems',
    description: '10-15 daily problem sheets',
    iconName: 'CheckSquare',
    route: '/dpp'
  },
  {
    id: 'feat-pyq',
    title: 'PYQ Question Bank',
    description: '15+ years solved papers',
    iconName: 'FileCheck',
    route: '/pyq'
  },
  {
    id: 'feat-video-sol',
    title: 'Video Solutions',
    description: 'Step-by-step problem walkthroughs',
    iconName: 'PlayCircle',
    route: '/free-lectures'
  },
  {
    id: 'feat-test-series',
    title: 'Mock Test Series',
    description: 'NTA CBT simulation & analytics',
    iconName: 'Award',
    route: '/test-series'
  },
  {
    id: 'feat-chapter-prac',
    title: 'Chapter-wise Practice',
    description: 'Graded Easy to Advanced',
    iconName: 'Layers',
    route: '/dpp'
  },
  {
    id: 'feat-study-resources',
    title: 'Formula Cheat Sheets',
    description: 'Consolidated revision notes',
    iconName: 'BookOpen',
    route: '/about'
  },
  {
    id: 'feat-revision',
    title: 'Revision Material',
    description: 'High-speed inspection shortcuts',
    iconName: 'Compass',
    route: '/free-lectures'
  },
  {
    id: 'feat-progress',
    title: 'Scorecard Analytics',
    description: 'Time per question tracking',
    iconName: 'BarChart3',
    route: '/test-series'
  }
];

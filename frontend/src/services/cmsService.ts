/**
 * DK Academy JEE - Centralized CMS Service
 * Manages dynamic configuration for Navbar, Footer, Page Contents, and Course Catalog.
 * Fully persisted in LocalStorage with real-time broadcast events.
 */

import type { Course, TestSeriesItem, PYQQuestion, DPPSet, AchieverItem, ClassroomBatch, LiveClassSession } from '../types';
import type {
  NavbarMenuItem,
  NavbarDropdownItem,
  FooterConfig,
  FooterLinkItem,
  PageContentConfig,
  PageSectionItem
} from '../types/admin';
import { COURSES_CATALOG } from '../data/coursesData';
import { TEST_SERIES_DATA } from '../data/testSeriesData';
import { PYQ_QUESTIONS } from '../data/pyqData';
import { DPP_SETS } from '../data/dppData';
import { ACHIEVERS_LIST } from '../data/homepageRedesignData';
import { apiClient } from './apiClient';

const NAVBAR_STORAGE_KEY = 'dk_academy_cms_navbar_v1';
const FOOTER_STORAGE_KEY = 'dk_academy_cms_footer_v1';
const COURSES_STORAGE_KEY = 'dk_academy_cms_courses_v1';
const PAGES_STORAGE_KEY = 'dk_academy_cms_pages_v1';
const TEST_SERIES_STORAGE_KEY = 'dk_academy_cms_test_series_v1';
const PYQ_STORAGE_KEY = 'dk_academy_cms_pyq_v1';
const DPP_STORAGE_KEY = 'dk_academy_cms_dpp_v1';
const RESULTS_STORAGE_KEY = 'dk_academy_cms_results_v2';
const CLASSROOM_STORAGE_KEY = 'dk_academy_cms_classroom_v1';
const LIVE_SESSIONS_STORAGE_KEY = 'dk_academy_cms_live_sessions_v1';
const PAGES_LIST_STORAGE_KEY = 'dk_academy_cms_pages_list_v1';
export const CMS_EVENT_KEY = 'dk_cms_updated';

// ----------------------------------------------------
// DEFAULT SEED DATA
// ----------------------------------------------------

export const DEFAULT_NAVBAR_ITEMS: NavbarMenuItem[] = [
  {
    id: 'nav_courses',
    label: 'Courses',
    path: '/courses',
    isDropdown: true,
    isVisible: true,
    order: 1,
    dropdownItems: [
      {
        id: 'sub_jee_main',
        label: 'JEE Main & Advanced Batches',
        subtitle: 'Targeted preparation & speed methods',
        icon: 'Target',
        path: '/courses?category=JEE%20Main',
        isVisible: true,
        order: 1,
        badge: 'Popular'
      },
      {
        id: 'sub_bitsat',
        label: 'BITSAT Speed Crash Course',
        subtitle: 'Speed drill & shortcut techniques',
        icon: 'BookOpen',
        path: '/bitsat',
        isVisible: true,
        order: 2,
        badge: 'New'
      },
      {
        id: 'sub_math_special',
        label: 'Class 11 & 12 Math Special (DK Sir)',
        subtitle: '20-30s speed methods & core calculus',
        icon: 'Clock',
        path: '/courses?subject=Mathematics',
        isVisible: true,
        order: 3
      },
      {
        id: 'sub_foundation',
        label: 'Class 8–10 Foundation Program',
        subtitle: 'Olympiad prep & strong conceptual base',
        icon: 'GraduationCap',
        path: '/courses?category=Foundation',
        isVisible: true,
        order: 4
      },
      {
        id: 'sub_dropper',
        label: 'Dropper & Repeater Full Year Batches',
        subtitle: 'Complete curriculum & rigorous mock tests',
        icon: 'UserCheck',
        path: '/courses?category=Dropper',
        isVisible: true,
        order: 5
      },
      {
        id: 'sub_all_courses',
        label: 'Explore All Courses Catalog',
        subtitle: 'Browse our full range of programs',
        icon: 'ArrowRight',
        path: '/courses',
        isVisible: true,
        order: 6
      }
    ]
  },
  {
    id: 'nav_test_series',
    label: 'Test Series',
    path: '/test-series',
    isDropdown: true,
    isVisible: true,
    order: 2,
    dropdownItems: [
      {
        id: 'sub_cbt_all_india',
        label: 'All India CBT Test Series (Class 11 & 12)',
        subtitle: 'Full syllabus NTA simulation for Class 11 & 12',
        icon: 'Monitor',
        path: '/test-series',
        isVisible: true,
        order: 1,
        badge: 'Live NTA'
      },
      {
        id: 'sub_cbt_math_speed',
        label: 'DK Sir 20-30s Speed & Accuracy Math CBT',
        subtitle: 'Speed drills & shortcut techniques by DK Sir',
        icon: 'Zap',
        path: '/test-series?subject=Mathematics',
        isVisible: true,
        order: 2,
        badge: 'High Yield'
      },
      {
        id: 'sub_cbt_chapter_tests',
        label: 'Chapter-Wise Topic Tests',
        subtitle: 'Physics, Chemistry & Math practice modules',
        icon: 'Layers',
        path: '/test-series?format=Chapter%20Test',
        isVisible: true,
        order: 3
      },
      {
        id: 'sub_cbt_advanced_accelerator',
        label: 'JEE Advanced Rank Accelerator',
        subtitle: 'High-difficulty multi-concept mocks',
        icon: 'Trophy',
        path: '/test-series?format=Full%20Mock',
        isVisible: true,
        order: 4,
        badge: 'Advanced'
      },
      {
        id: 'sub_all_tests',
        label: 'Explore Full CBT Test Dashboard',
        subtitle: 'View all 9 mock tests, syllabus breakdown & analysis',
        icon: 'ArrowRight',
        path: '/test-series',
        isVisible: true,
        order: 5
      }
    ]
  },
  {
    id: 'nav_free_lectures',
    label: 'Free Lectures',
    path: '/free-lectures',
    isDropdown: false,
    isVisible: true,
    order: 3,
    badge: 'Free'
  },
  {
    id: 'nav_pyq',
    label: 'PYQ Bank',
    path: '/pyq',
    isDropdown: false,
    isVisible: true,
    order: 4
  },
  {
    id: 'nav_dpp',
    label: 'DPP',
    path: '/dpp',
    isDropdown: false,
    isVisible: true,
    order: 5
  },
  {
    id: 'nav_results',
    label: 'Results',
    path: '/results',
    isDropdown: false,
    isVisible: true,
    order: 6
  },
  {
    id: 'nav_classroom',
    label: 'Live Classroom',
    path: '/classroom',
    isDropdown: false,
    isVisible: true,
    order: 7,
    badge: 'Live'
  },
  {
    id: 'nav_about',
    label: 'About Us',
    path: '/about',
    isDropdown: false,
    isVisible: true,
    order: 8
  },
  {
    id: 'nav_contact',
    label: 'Contact Us',
    path: '/contact',
    isDropdown: false,
    isVisible: true,
    order: 9
  }
];

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  brandName: 'DK ACADEMY',
  brandTag: 'JEE',
  description:
    'Premier offline & online coaching institute combining Janakpuri classroom rigor with high-speed 20s mathematical techniques taught exclusively by Dharmendra Kumar (DK Sir).',
  logoUrl: '/img/logo.jpeg',
  phone1: '+91 93259 87875',
  phone2: '+91 97171 59062',
  whatsappNumber: '919325987875',
  emailAdmissions: 'admissions@dkacademy.com',
  emailDirector: 'director@dkacademy.com',
  janakpuriAddress: 'C4F/33, behind F Market, Janakpuri, New Delhi, Delhi 110058',
  dwarkaAddress: 'Dwarka Sector 12 Metro Station Campus, New Delhi 110078',
  learningLinks: [
    { id: 'll_1', label: 'JEE Courses for Class 11th', path: '/courses?category=JEE%20Main', isVisible: true },
    { id: 'll_2', label: 'Class 12th & Advanced Batches', path: '/courses?category=JEE%20Advanced', isVisible: true },
    { id: 'll_3', label: 'BITSAT Speed Crash Course', path: '/bitsat', isVisible: true, badge: 'New' },
    { id: 'll_4', label: 'Free Video Lectures Archive', path: '/free-lectures', isVisible: true },
    { id: 'll_5', label: 'Topic-wise PYQ Question Bank', path: '/pyq', isVisible: true },
    { id: 'll_6', label: 'Daily Practice Problems (DPP)', path: '/dpp', isVisible: true },
    { id: 'll_7', label: 'All India Online CBT Test Series', path: '/test-series', isVisible: true }
  ],
  policyLinks: [
    { id: 'pl_1', label: 'Refund & Cancellation Policy', path: '/privacy#refunds', isVisible: true },
    { id: 'pl_2', label: 'Shipping & Delivery Policy (Printed Modules)', path: '/privacy#shipping', isVisible: true },
    { id: 'pl_3', label: 'Privacy Policy', path: '/privacy', isVisible: true },
    { id: 'pl_4', label: 'Terms & Conditions', path: '/terms', isVisible: true },
    { id: 'pl_5', label: 'Contact Us & Center Helpdesk', path: '/contact', isVisible: true }
  ],
  subjectLinks: [
    { id: 'sl_1', label: 'Physics for JEE (Mechanics & Electrodynamics)', path: '/courses?subject=physics', isVisible: true },
    { id: 'sl_2', label: 'Chemistry for JEE (Organic, Inorganic & Physical)', path: '/courses?subject=chemistry', isVisible: true },
    { id: 'sl_3', label: 'Mathematics for JEE (Calculus & Algebra by DK Sir)', path: '/courses?subject=mathematics', isVisible: true }
  ],
  socialLinks: {
    youtube: 'https://youtube.com/@dkacademyjee',
    telegram: 'https://t.me/dkacademyjee',
    whatsapp: 'https://wa.me/919325987875',
    instagram: 'https://instagram.com/dkacademyjee'
  },
  copyrightText: 'DK Academy JEE. All rights reserved. Transforming JEE Aspirants into Rankers with DK Sir.'
};

export const DEFAULT_PAGE_CONFIGS: Record<string, PageContentConfig> = {
  home: {
    pageId: 'home',
    pageTitle: 'Home Page',
    metaTitle: "DK Academy JEE | Crack JEE with DK Sir's 20–30s Math Techniques",
    metaDescription:
      'Join DK Academy JEE for concept-first IIT JEE Mathematics mentoring under DK Sir. Small batch size (max 25), 20–30s inspection shortcuts, Dwarka & Janakpuri centers. Admissions open 2026–27.',
    metaKeywords: 'JEE Main 2026, JEE Advanced 2027, IIT JEE coaching Delhi, DK Sir Math techniques, Janakpuri IIT coaching',
    heroBadge: 'JEE Main & Advanced 2026–27 Admissions Open',
    heroHeading: 'Prepare Smarter. Aim Higher. Crack JEE with DK Sir.',
    heroSubheading:
      'Delhi’s premier coaching institute combining offline Janakpuri & Dwarka classroom rigor with DK Sir’s proprietary 20–30 second calculus shortcuts and small batches of 25 students.',
    primaryCtaText: 'Explore Flagship Batches',
    primaryCtaUrl: '/courses',
    secondaryCtaText: 'Request Free Counseling Call',
    secondaryCtaUrl: '#callback-form',
    bannerNotice: '⚡ Early Bird Scholarship: Up to 90% fee waiver on merit test. Limited batch seats left!',
    stats: [
      { id: 'stat_1', label: 'Students Mentored', value: '10,000+', subtext: 'JEE Aspirants' },
      { id: 'stat_2', label: 'Students per Batch', value: 'Max 25', subtext: 'Individual Mentorship' },
      { id: 'stat_3', label: 'Dwarka & Janakpuri, Delhi', value: '2 Centers', subtext: 'Offline Smart Campuses' },
      { id: 'stat_4', label: 'Student Rating (500+ Reviews)', value: '4.9 / 5.0', subtext: 'Verified Reviews' }
    ],
    customSections: [
      {
        id: 'sec_home_results_banner',
        type: 'banner',
        title: 'Official IIT JEE Merit List & Selection Records',
        subtitle: 'Academic milestones • Official merit list',
        content: 'Official IIT JEE Merit List & Selection Records. Audited & verified selections from Dwarka Sector 12 & Janakpuri centers. 450+ students in IITs and top engineering institutes.',
        badge: 'OFFICIAL RESULTS & SOCIAL PROOF',
        buttonText: 'View All Achievers',
        buttonUrl: '/results',
        imageUrl: '/img/dk-results-banner.jpeg',
        order: 1,
        isVisible: true
      },
      {
        id: 'sec_home_why_us',
        type: 'cards',
        title: 'Why Serious JEE Aspirants Choose DK Sir',
        subtitle: 'Concept-first derivations, 20-30s calculus shortcuts, small batches of 25, and high-frequency CBT mocks',
        badge: 'THE DK ACADEMY ADVANTAGE',
        content: 'Cracking IIT-JEE Mathematics requires sharp mathematical intuition, time-saving problem inspection, and personal faculty feedback.',
        columns: 4,
        order: 2,
        isVisible: true,
        cards: [
          {
            id: 'hac_1',
            title: '20–30s Inspection Shortcuts',
            description: 'Solve multi-concept calculus, coordinate geometry, and algebraic limits by structural inspection rather than tedious multi-page derivations.',
            badge: 'Signature Method',
            linkText: 'Explore Pedagogy',
            linkUrl: '/about'
          },
          {
            id: 'hac_2',
            title: 'Concept-First, Zero Rote',
            description: 'Master rigorous mathematical derivations from scratch. We build genuine problem-solving intuition so unexpected trap questions are easily navigated.',
            badge: 'First Principles',
            linkText: 'Learn More',
            linkUrl: '/about'
          },
          {
            id: 'hac_3',
            title: 'Strictly Max 25 Students',
            description: 'Unlike commercial mega-coaching halls with 200+ students, our strictly capped small batches ensure DK Sir personally reviews every student’s homework.',
            badge: 'Personal Attention',
            linkText: 'View Batches',
            linkUrl: '/courses'
          },
          {
            id: 'hac_4',
            title: 'Complete CBT & DPP Bank',
            description: '15+ years topic-classified JEE Main and Advanced previous year questions with step-by-step reasoning and timed computer-based mock tests.',
            badge: 'NTA Exam Rigor',
            linkText: 'Explore CBT',
            linkUrl: '/test-series'
          }
        ]
      },
      {
        id: 'sec_home_courses',
        type: 'cards',
        title: 'Flagship Classroom & Online Batches',
        subtitle: 'Rigorous year-round programs designed for Class 11th, 12th, and Droppers targeting JEE Main, Advanced & BITSAT.',
        badge: 'ACADEMIC PROGRAMS',
        content: 'Proven programs taught with DK Sir\'s concept-first techniques, strictly limited batch sizes (max 25), and comprehensive test series.',
        buttonText: 'View All Batches',
        buttonUrl: '/courses',
        columns: 3,
        order: 3,
        isVisible: true
      },
      {
        id: 'sec_home_achievers',
        type: 'banner',
        title: 'Live Hall of Fame & Top Rankers',
        subtitle: 'Verified percentiles and ranks achieved under DK Sir\'s concept-first mathematical guidance.',
        badge: 'ACADEMIC MILESTONES • OFFICIAL MERIT LIST',
        content: 'Continuous live rankers marquee featuring top performers in JEE Advanced, Main, and BITSAT.',
        buttonText: 'View All Results',
        buttonUrl: '/results',
        order: 4,
        isVisible: true
      },
      {
        id: 'sec_home_founder',
        type: 'banner',
        title: 'Meet Our Founder — Dharmendra Kumar (DK Sir)',
        subtitle: 'Senior IIT-JEE Mathematics Mentor • 18+ Years Kota Pedagogy',
        badge: 'ABOUT THE FOUNDER',
        content: 'Mathematics isn’t about memorizing 50 formulas; it’s about recognizing the hidden symmetry of a curve in the first 20 seconds. We mentor students with pure mathematical intuition.',
        buttonText: 'Explore Math Pedagogy',
        buttonUrl: '/about',
        imageUrl: '/img/founder.jpeg',
        order: 5,
        isVisible: true
      },
      {
        id: 'sec_home_stories',
        type: 'cards',
        title: 'Hear Directly From Our Top Achievers',
        subtitle: 'Real student experiences on how DK Sir\'s concept-first methodology and small batch guidance transformed their problem-solving speed.',
        badge: 'PROVEN SUCCESS',
        content: 'Watch interactive 9:16 Instagram-style reels and read verified stories from IIT Bombay, Delhi, and Roorkee alumni.',
        columns: 3,
        order: 6,
        isVisible: true
      },
      {
        id: 'sec_home_faqs',
        type: 'cards',
        title: 'Frequently Asked Questions',
        subtitle: 'Find direct answers regarding batch schedules, fees, classroom policies, and student support.',
        badge: 'CLEAR & TRANSPARENT GUIDANCE',
        content: 'Everything parents and students need to know before enrolling in offline or live online batches.',
        columns: 2,
        order: 7,
        isVisible: true
      },
      {
        id: 'sec_home_callback',
        type: 'banner',
        title: 'Request a Free Counseling Callback',
        subtitle: 'Speak with our academic counseling team for a personalized study roadmap tailored to your strengths.',
        badge: 'ACADEMIC COUNSELING & ADMISSIONS',
        content: '1-on-1 personalized study roadmap, batch recommendation, and strategy discussion with senior IIT JEE faculty.',
        buttonText: 'Call Admissions',
        buttonUrl: 'tel:+919325987875',
        order: 8,
        isVisible: true
      }
    ],
    faqs: [
      {
        id: 'faq_1',
        question: 'What is the batch size at DK Academy classroom centers?',
        answer: 'Every classroom batch at Janakpuri and Dwarka is strictly capped at a maximum of 25 students to ensure that DK Sir and senior mentors personally review every student’s homework and test analysis.'
      },
      {
        id: 'faq_2',
        question: 'Are online classes also conducted by DK Sir personally?',
        answer: 'Yes! Both classroom lectures and live online sessions in Mathematics are conducted directly by Dharmendra Kumar (DK Sir).'
      }
    ],
    updatedAt: new Date().toISOString()
  },
  about: {
    pageId: 'about',
    pageTitle: 'About DK Academy',
    metaTitle: 'About DK Academy JEE | Founded by Dharmendra Kumar (DK Sir)',
    metaDescription: 'Empowering JEE Aspirants with Conceptual Depth & 20s Speed Mastery. Mentored by Dharmendra Kumar (DK Sir).',
    heroBadge: 'FOUNDED BY DK SIR • 15+ YEARS OF EXCELLENCE',
    heroHeading: 'Empowering JEE Aspirants with Conceptual Depth & 20s Speed Mastery',
    heroSubheading:
      'DK Academy JEE is a dedicated learning platform engineered to make IIT JEE Mathematics intuitive, structured, and scoring. Founded on the principle that true problem-solving mastery comes from crystal-clear fundamentals coupled with trademarked 20s speed algorithms.',
    primaryCtaText: 'Join Classroom Program',
    primaryCtaUrl: '/#callback',
    secondaryCtaText: 'Watch Free Masterclasses',
    secondaryCtaUrl: '/free-lectures',
    stats: [
      { id: 'astat_1', label: 'Years of Teaching', value: '15+', subtext: 'Mentoring IITians' },
      { id: 'astat_2', label: 'IITian Alumni Network', value: '1200+', subtext: 'Across Top IITs' },
      { id: 'astat_3', label: 'Campuses in Delhi', value: '2 Centers', subtext: 'Janakpuri & Dwarka' },
      { id: 'astat_4', label: 'Speed Advantage', value: '20s', subtext: 'Inspection Algorithm' }
    ],
    customSections: [
      {
        id: 'sec_about_methodology',
        type: 'cards',
        title: 'The Three Pillars of Our Academic Approach',
        subtitle: 'Our pedagogy bridges the gap between deep theoretical understanding and high-speed exam execution, transforming mathematics into an aspirant\'s highest-scoring subject.',
        content: 'Three foundational academic pillars: in-depth theoretical derivations, proprietary 20-30s speed algorithms, and exhaustive 15-year chapter-wise PYQ analysis.',
        badge: 'TEACHING METHODOLOGY',
        columns: 3,
        cards: [
          {
            id: 'c_meth_1',
            title: 'In-Depth Conceptual Theory',
            badge: 'Foundation First',
            description: 'Deconstruct every formula and theorem with geometric and algebraic intuition from first principles. Zero rote memorization.',
            linkText: 'Learn Pedagogy',
            linkUrl: '/about'
          },
          {
            id: 'c_meth_2',
            title: 'Proprietary 20s Speed Algorithms',
            badge: 'Speed & Efficiency',
            description: 'Trademarked 20–30 second inspection shortcuts for King’s integral properties, LCD, and matrices. Eliminate algebraic fatigue.',
            linkText: 'Explore Shortcuts',
            linkUrl: '/free-lectures'
          },
          {
            id: 'c_meth_3',
            title: 'Exhaustive 15-Year PYQ Rigor',
            badge: 'Real Exam Alignment',
            description: 'Every single question from 2011 to 2025 classified by chapter weightage and examiner trap patterns with CBT shift simulations.',
            linkText: 'Practice PYQs',
            linkUrl: '/pyq'
          }
        ],
        order: 1,
        isVisible: true
      },
      {
        id: 'sec_about_batches',
        type: 'cards',
        title: 'Course Offerings & Structured Batches',
        subtitle: 'Personalized offline and live-online mentorship programs tailored to every stage of JEE preparation.',
        content: 'Flagship batches designed for Class 11 Foundation, Class 12 & Droppers, and high-intensity speed crash courses with strictly capped 25-student cohorts.',
        badge: 'ACADEMIC PROGRAMS',
        columns: 3,
        cards: [
          {
            id: 'c_batch_1',
            title: 'JEE Main & Advanced 2-Year Foundation',
            badge: 'Foundation 11th',
            description: 'Complete Class 11 syllabus integrated with NCERT and Olympiad-level analytical depth. Max 25-30 seats.',
            linkText: 'Enroll 2-Year Batch',
            linkUrl: '/courses'
          },
          {
            id: 'c_batch_2',
            title: 'JEE Advanced & Mains 1-Year Flagship',
            badge: 'Target 12th & Droppers',
            description: 'Comprehensive 11th & 12th revision with intensive Kota problem-solving tempo and 20s speed shortcuts.',
            linkText: 'Enroll 1-Year Batch',
            linkUrl: '/courses'
          },
          {
            id: 'c_batch_3',
            title: 'Fast-Track Problem Solving & Shortcuts',
            badge: 'Specialized Speed Crash Course',
            description: 'Final Sprint Revision module engineered for maximum score acceleration before JEE exams.',
            linkText: 'Enroll Fast-Track',
            linkUrl: '/courses'
          }
        ],
        order: 2,
        isVisible: true
      },
      {
        id: 'sec_about_playlists',
        type: 'video',
        title: 'Major Chapter-Wise YouTube Playlists',
        subtitle: 'Access 760+ high-definition concept lectures and 20s shortcut walkthroughs completely free on YouTube.',
        content: 'Free structured YouTube masterclasses and topic-wise playlists covering Calculus, Algebra, and Coordinate Geometry by DK Sir.',
        badge: 'FREE VIDEO LECTURES & SPEED DRILLS',
        videoUrl: 'https://www.youtube.com/@dkacademyjee',
        videoCaption: 'Comprehensive JEE Mathematics Playlists by DK Sir',
        order: 3,
        isVisible: true
      },
      {
        id: 'sec_about_mentorship',
        type: 'cards',
        title: 'Study Materials & Mentorship Content',
        subtitle: 'Academic preparation is only half the battle. We equip students with structured handwritten classroom notes, graded daily practice problems, and continuous performance analytics.',
        content: 'Handwritten Kota classroom notes, graded daily practice problem sets, formula compendiums, and regular doubt resolution counters.',
        badge: 'SELF-STUDY & ACADEMIC RIGOR',
        columns: 2,
        cards: [
          {
            id: 'c_mat_1',
            title: 'Handwritten Classroom Notes & Mind Maps',
            badge: 'Digital Study Vault',
            description: 'Over 2,400+ pages of handwritten concept summaries, geometric proofs, and 20s speed shortcut algorithms.',
            linkText: 'Download Notes Preview',
            linkUrl: '/dpp'
          },
          {
            id: 'c_mat_2',
            title: 'Graded Daily Practice Problems (DPP)',
            badge: 'Level 1 to Olympiad',
            description: 'Topic-by-topic daily assignments containing 10 curated questions spanning JEE Main foundations to Advanced multi-correct problems.',
            linkText: 'Solve Daily DPPs',
            linkUrl: '/dpp'
          }
        ],
        order: 4,
        isVisible: true
      },
      {
        id: 'sec_about_cta',
        type: 'banner',
        title: 'Ready to Master IIT JEE Mathematics?',
        subtitle: 'Join DK Sir\'s small batch mentorship at Dwarka / Janakpuri center or master trademarked 20s speed inspection algorithms through our structured video course modules.',
        content: 'Limited 25 seats per batch. Schedule a personal counseling call with DK Sir and secure your admissions early.',
        badge: 'SMALL BATCH KOTA MENTORSHIP',
        buttonText: 'Enroll in Classroom Batch',
        buttonUrl: '/#callback',
        order: 5,
        isVisible: true
      }
    ],
    updatedAt: new Date().toISOString()
  },
  classroom: {
    pageId: 'classroom',
    pageTitle: 'Classroom Programs & Centers',
    metaTitle: 'Janakpuri & Dwarka Classroom Centers | DK Academy JEE',
    metaDescription: 'Experience rigorous offline classroom coaching at Janakpuri and Dwarka. Air-conditioned smart classrooms, library, and daily doubt clinics.',
    heroBadge: 'OFFLINE JANAKPURI & DWARKA CENTERS',
    heroHeading: 'Immersive Offline Coaching with Personalized Daily Mentoring.',
    heroSubheading:
      'Join our high-focus offline classrooms equipped with digital interactive boards, soundproof library cubicles, and face-to-face problem solving with DK Sir.',
    primaryCtaText: 'Book Center Campus Tour',
    primaryCtaUrl: '/courses',
    secondaryCtaText: 'Download Center Brochure',
    secondaryCtaUrl: '/courses',
    customSections: [
      {
        id: 'sec_janakpuri',
        title: 'Janakpuri Center Campus',
        subtitle: 'C4F/33, behind F Market, Janakpuri, New Delhi 110058',
        content: 'Smart digital classrooms, individual study pods, 24x7 AC library, separate doubt counters for Physics, Chemistry, and Mathematics.',
        order: 1,
        isVisible: true
      },
      {
        id: 'sec_dwarka',
        title: 'Dwarka Sector 12 Campus',
        subtitle: 'Adjoining Sector 12 Metro Station, New Delhi 110078',
        content: 'State-of-the-art CBT computer lab with 50+ terminals replicating the official NTA examination environment.',
        order: 2,
        isVisible: true
      }
    ],
    updatedAt: new Date().toISOString()
  },
  'free-lectures': {
    pageId: 'free-lectures',
    pageTitle: 'Free Video Lectures Archive',
    metaTitle: 'Free JEE Video Lectures & Masterclasses | DK Academy JEE',
    metaDescription: 'Watch free concept videos and 20s shortcut problem solving lectures by DK Sir on Calculus, Coordinate Geometry, and Algebra.',
    heroBadge: 'FREE JEE MASTERCLASSES',
    heroHeading: 'Master Core Concepts with DK Sir’s High-Speed Video Lectures.',
    heroSubheading: 'Full-length recorded masterclasses designed to break down high-weightage JEE Main and Advanced topics with shortcut inspection methods.',
    primaryCtaText: 'Subscribe on YouTube',
    primaryCtaUrl: 'https://youtube.com/@dkacademyjee',
    secondaryCtaText: 'Attempt Practice DPPs',
    secondaryCtaUrl: '/dpp',
    updatedAt: new Date().toISOString()
  },
  bitsat: {
    pageId: 'bitsat',
    pageTitle: 'BITSAT Speed Crash Course',
    metaTitle: 'BITSAT 2026 Speed Crash Course & Mock Series | DK Academy JEE',
    metaDescription: 'Crack BITSAT 2026 with 450+ score strategy, speed drills, English proficiency & Logical reasoning modules by DK Academy.',
    heroBadge: 'BITSAT 2026 SPECIAL BATCH',
    heroHeading: 'Accelerate Speed & Accuracy to Score 340+ in BITSAT 2026.',
    heroSubheading: 'Specialized 45-day speed training covering bonus questions, speed shortcuts in Mathematics, Logical Reasoning, and English Proficiency.',
    primaryCtaText: 'Enroll in BITSAT Batch',
    primaryCtaUrl: '/courses',
    updatedAt: new Date().toISOString()
  },
  results: {
    pageId: 'results',
    pageTitle: 'Results & Hall of Fame',
    metaTitle: 'DK Academy JEE Results | Top Rankers & Selections',
    metaDescription: 'Explore our outstanding JEE Advanced & Main results. Over 450+ students in IITs and NITs with 99.8+ percentile in Mathematics.',
    heroBadge: 'OFFICIAL HALL OF FAME',
    heroHeading: 'Consistent Top Ranks Year After Year in JEE Advanced & Main.',
    heroSubheading: 'Real ranks from real classrooms. See how small batches and DK Sir’s mentorship produce top 100 AIRs every academic session.',
    primaryCtaText: 'View All Rankers',
    primaryCtaUrl: '/results',
    updatedAt: new Date().toISOString()
  },
  courses: {
    pageId: 'courses',
    pageTitle: 'Courses Catalog & Batches',
    layoutTemplate: 'cards-grid',
    metaTitle: 'Courses & Batches Catalog | DK Academy JEE',
    metaDescription: 'Explore comprehensive Kota-pedagogy courses for JEE Main, Advanced & BITSAT. Small batches of 25 students with DK Sir.',
    heroBadge: 'FLAGSHIP IIT JEE & BITSAT BATCHES',
    heroHeading: 'Comprehensive Kota-Pedagogy Batches for JEE Main, Advanced & BITSAT.',
    heroSubheading: 'Live interactive lectures with DK Sir, 20–30s speed elimination drills, printed Kota study material, and daily doubt clearance clinics.',
    primaryCtaText: 'Enroll in Batch',
    primaryCtaUrl: '/courses',
    secondaryCtaText: 'Download Prospectus',
    secondaryCtaUrl: '/courses',
    customSections: [
      {
        id: 'sec_courses_banner',
        type: 'banner',
        title: 'Admissions Open for Class 11, 12 & Droppers',
        subtitle: 'Limited to strictly 25 seats per batch for personal guidance with DK Sir',
        content: 'Small batches guarantee that every student gets direct 1-on-1 homework review and daily doubt resolution.',
        badge: 'ADMISSIONS OPEN',
        buttonText: 'Apply for Admission',
        buttonUrl: '/contact',
        imageUrl: '/img/dk-results-banner.jpeg',
        order: 1,
        isVisible: true
      },
      {
        id: 'sec_courses_cards',
        type: 'cards',
        title: 'Flagship Curriculum Tracks',
        subtitle: 'Tailored preparation programs from foundational building to dropper sprints',
        content: '',
        columns: 3,
        order: 2,
        isVisible: true,
        cards: [
          {
            id: 'cc_1',
            title: 'Class 11th — 2-Year Comprehensive Program',
            description: 'Concept-first derivations, coordinate geometry, calculus foundations, and daily Kota DPP sheets.',
            badge: 'Most Popular',
            linkText: 'Explore Batch',
            linkUrl: '/courses?category=JEE%20Main'
          },
          {
            id: 'cc_2',
            title: 'Class 12th — 1-Year Fastrack Program',
            description: 'Complete Class 12 syllabus coverage + Class 11 revision marathon and negative marking reduction drills.',
            badge: 'Fastrack',
            linkText: 'Explore Batch',
            linkUrl: '/courses?category=JEE%20Advanced'
          },
          {
            id: 'cc_3',
            title: 'Dropper / Repeater — Super-30 Intensive Sprint',
            description: 'Daily 4.5 hours problem solving with DK Sir, 15+ years solved question vault, and weekly CBT mock tests.',
            badge: 'Super-30 Cohort',
            linkText: 'Explore Batch',
            linkUrl: '/courses?category=Dropper'
          }
        ]
      },
      {
        id: 'sec_courses_assets',
        type: 'assets',
        title: 'Official Academic Prospectus & Schedules',
        subtitle: 'Download course brochures, batch timings, and fee structures',
        content: '',
        order: 3,
        isVisible: true,
        assets: [
          {
            id: 'ca_1',
            title: '2026-27 Academic Year Full Curriculum & Fee Structure',
            fileType: 'pdf',
            fileUrl: '/docs/prospectus-2026.pdf',
            fileSize: '5.2 MB',
            buttonText: 'Download Prospectus'
          },
          {
            id: 'ca_2',
            title: 'DK Academy JEE Mathematics Speed Solving Handbook',
            fileType: 'pdf',
            fileUrl: '/docs/formula-handbook.pdf',
            fileSize: '3.8 MB',
            buttonText: 'Download Handbook'
          }
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  },
  'test-series': {
    pageId: 'test-series',
    pageTitle: 'All-India CBT Test Series & NTA Mocks',
    layoutTemplate: 'video-showcase',
    metaTitle: 'All-India CBT Test Series & Mock Exam Engine | DK Academy JEE',
    metaDescription: 'Replicate exact NTA JEE examination user interface. Real-time percentile rank, question speed analytics, and video explanations by DK Sir.',
    heroBadge: 'OFFICIAL NTA JEE & BITSAT CBT PLATFORM',
    heroHeading: 'Experience True NTA CBT Software Exam Temperament Before the Real Test.',
    heroSubheading: 'Exact NTA examination interface, percentile prediction engine, in-depth speed analytics per question, and video solutions by DK Sir.',
    primaryCtaText: 'Attempt Free Mock Test',
    primaryCtaUrl: '/test-series',
    secondaryCtaText: 'View Syllabus Breakdown',
    secondaryCtaUrl: '/test-series',
    customSections: [
      {
        id: 'sec_ts_video',
        type: 'video',
        title: 'NTA CBT Interface Tour & 20s Inspection Tactics',
        subtitle: 'Watch DK Sir explain how to navigate multi-correct questions with speed',
        content: 'Learn how to manage the 3-hour clock, skip time-trap questions, and maximize score using shortcut inspection methods.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoThumbnail: '/img/dk-results-banner.jpeg',
        videoCaption: 'CBT Engine Strategy: Solving JEE Advanced Problems in Under 30 Seconds',
        order: 1,
        isVisible: true
      },
      {
        id: 'sec_ts_cards',
        type: 'cards',
        title: 'CBT Simulation Test Formats',
        subtitle: 'Rigorous tests modeled after official examination patterns',
        content: '',
        columns: 3,
        order: 2,
        isVisible: true,
        cards: [
          {
            id: 'tc_1',
            title: 'Full-Syllabus JEE Advanced CBTs',
            description: 'Paper 1 & Paper 2 identical pattern tests with negative marking and all-India rank prediction.',
            badge: 'Flagship Mocks',
            linkText: 'Take Test',
            linkUrl: '/test-series'
          },
          {
            id: 'tc_2',
            title: 'Speed & Accuracy Math CBT Drills',
            description: 'Topic-level 30-minute speed tests for Calculus, Coordinate Geometry, and Vectors.',
            badge: 'Speed Drill',
            linkText: 'Take Test',
            linkUrl: '/test-series'
          },
          {
            id: 'tc_3',
            title: 'BITSAT 450+ Speed Run Series',
            description: '130 questions in 180 minutes with speed algorithms, English proficiency, and Logical Reasoning.',
            badge: 'BITSAT Special',
            linkText: 'Take Test',
            linkUrl: '/test-series'
          }
        ]
      },
      {
        id: 'sec_ts_assets',
        type: 'assets',
        title: 'CBT Syllabus & Scoring Guidelines',
        subtitle: 'Download official guidelines and high-yield topic weightage',
        content: '',
        order: 3,
        isVisible: true,
        assets: [
          {
            id: 'ta_1',
            title: 'JEE Advanced High-Yield Topics & CBT Weightage Blueprint',
            fileType: 'pdf',
            fileUrl: '/docs/prospectus-2026.pdf',
            fileSize: '2.4 MB',
            buttonText: 'Download Blueprint'
          }
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  },
  pyq: {
    pageId: 'pyq',
    pageTitle: '15+ Years Solved PYQ Question Vault',
    layoutTemplate: 'cards-grid',
    metaTitle: '15+ Years Chapter-wise Solved PYQs | DK Academy JEE',
    metaDescription: 'Solve 15+ years of chapter-wise solved JEE Advanced and Main questions with DK Sir 20-30s speed solutions.',
    heroBadge: 'OFFICIAL IIT JEE & BITSAT ARCHIVES',
    heroHeading: 'Master 15+ Years of Solved JEE Advanced & Main Question Papers.',
    heroSubheading: 'Detailed step-by-step video solutions, 20s shortcut methods by DK Sir, and chapter-wise question breakdowns from 2011 to 2025.',
    primaryCtaText: 'Solve PYQs Online',
    primaryCtaUrl: '/pyq',
    secondaryCtaText: 'Download PYQ Booklets',
    secondaryCtaUrl: '/pyq',
    customSections: [
      {
        id: 'sec_pyq_cards',
        type: 'cards',
        title: 'Chapter-Wise Solved Archives',
        subtitle: 'Topic-wise question collections categorized by difficulty and exam year',
        content: '',
        columns: 3,
        order: 1,
        isVisible: true,
        cards: [
          {
            id: 'pq_1',
            title: 'Calculus & Functions Vault',
            description: 'Limits, Continuity, Derivatives, and Definite Integrals solved with 20s inspection shortcuts.',
            badge: 'High Yield',
            linkText: 'View Questions',
            linkUrl: '/pyq'
          },
          {
            id: 'pq_2',
            title: 'Coordinate Geometry & Vectors',
            description: 'Parabola, Ellipse, Hyperbola, and 3D Planes questions with geometric visual derivations.',
            badge: 'Kota Rigor',
            linkText: 'View Questions',
            linkUrl: '/pyq'
          },
          {
            id: 'pq_3',
            title: 'Algebra, Matrices & Complex Numbers',
            description: 'Quadratic equations, Sequences & Series, and Determinants trap questions solved.',
            badge: 'Core Algebra',
            linkText: 'View Questions',
            linkUrl: '/pyq'
          }
        ]
      },
      {
        id: 'sec_pyq_assets',
        type: 'assets',
        title: 'Downloadable Chapter-wise PYQ Booklets',
        subtitle: 'Curated question sheets with detailed answer keys and solutions',
        content: '',
        order: 2,
        isVisible: true,
        assets: [
          {
            id: 'pqa_1',
            title: '15-Year Solved Calculus Archive with DK Sir 20s Shortcuts',
            fileType: 'pdf',
            fileUrl: '/docs/formula-handbook.pdf',
            fileSize: '6.4 MB',
            buttonText: 'Download PDF'
          }
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  },
  dpp: {
    pageId: 'dpp',
    pageTitle: 'Daily Practice Problem (DPP) Drills',
    layoutTemplate: 'academic-syllabus',
    metaTitle: 'Daily DPP Problem Drills & Answer Keys | DK Academy JEE',
    metaDescription: 'Attempt daily concept and speed drills modeled after Kota pedagogy. Daily 10 questions with DK Sir video explanations.',
    heroBadge: 'DAILY CONCEPT RIGOUR • 20S SHORTCUT DRILLS',
    heroHeading: 'Transform Theory into Speed with Kota-Pattern Daily DPP Sets.',
    heroSubheading: 'Curated problem sets designed to drill calculation speed, eliminate trap options, and reinforce fundamental derivations.',
    primaryCtaText: 'Start Today’s DPP',
    primaryCtaUrl: '/dpp',
    secondaryCtaText: 'Download Drill Sheets',
    secondaryCtaUrl: '/dpp',
    customSections: [
      {
        id: 'sec_dpp_cards',
        type: 'cards',
        title: 'Daily Practice Drill Formats',
        subtitle: 'Targeted short problem sprints for consistent score acceleration',
        content: '',
        columns: 3,
        order: 1,
        isVisible: true,
        cards: [
          {
            id: 'dc_1',
            title: 'Calculus 20s Speed Sprints',
            description: 'Daily 10 questions focused on option elimination and inspection without tedious page-long derivations.',
            badge: 'Daily Sprint',
            linkText: 'Attempt Drill',
            linkUrl: '/dpp'
          },
          {
            id: 'dc_2',
            title: 'Trap Option Elimination Sets',
            description: 'Identifies common exam mistakes, negative marking traps, and misread questions in JEE Advanced.',
            badge: 'Negative Filter',
            linkText: 'Attempt Drill',
            linkUrl: '/dpp'
          },
          {
            id: 'dc_3',
            title: 'Multi-Correct & Matrix Match Sets',
            description: 'Deep conceptual reasoning problems replicating Section B of JEE Advanced papers.',
            badge: 'JEE Advanced',
            linkText: 'Attempt Drill',
            linkUrl: '/dpp'
          }
        ]
      },
      {
        id: 'sec_dpp_assets',
        type: 'assets',
        title: 'Downloadable Weekly DPP Worksheets',
        subtitle: 'Printed practice workbooks with official marking keys',
        content: '',
        order: 2,
        isVisible: true,
        assets: [
          {
            id: 'da_1',
            title: 'Weekly Mathematics DPP Compilation Sheet #14',
            fileType: 'pdf',
            fileUrl: '/docs/prospectus-2026.pdf',
            fileSize: '3.1 MB',
            buttonText: 'Download Sheet'
          }
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  },
  contact: {
    pageId: 'contact',
    pageTitle: 'Contact Admissions & Helpdesk',
    layoutTemplate: 'standard',
    metaTitle: 'Contact DK Academy JEE | Janakpuri & Dwarka Centers',
    metaDescription: 'Get in touch with DK Academy JEE admissions helpdesk. Call 9325987875, visit Janakpuri or Dwarka center campuses in Delhi.',
    heroBadge: 'DELHI JANAKPURI & DWARKA CAMPUSES',
    heroHeading: 'Visit Our Delhi Centers or Request a Personalized Counseling Session.',
    heroSubheading: 'Our academic mentors and Dharmendra Kumar (DK Sir) are available for 1-on-1 student counseling, diagnostic performance testing, and batch admissions.',
    primaryCtaText: 'Call Helpline: 9325987875',
    primaryCtaUrl: 'tel:9325987875',
    secondaryCtaText: 'Request Callback',
    secondaryCtaUrl: '#callback-form',
    customSections: [
      {
        id: 'sec_contact_banner',
        type: 'banner',
        title: 'Visit Delhi Janakpuri & Dwarka Offline Classrooms',
        subtitle: 'Experience smart digital boards, 24x7 AC library, and direct doubt counters',
        content: 'Campus tours and diagnostic tests are conducted Monday to Saturday from 10:00 AM to 7:00 PM.',
        badge: 'CAMPUS TOURS OPEN',
        buttonText: 'Get Directions',
        buttonUrl: '#centers',
        imageUrl: '/img/dk-results-banner.jpeg',
        order: 1,
        isVisible: true
      },
      {
        id: 'sec_contact_cards',
        type: 'cards',
        title: 'Campus Amenities & Student Facilities',
        subtitle: 'Dedicated infrastructure designed for high-focus academic preparation',
        content: '',
        columns: 3,
        order: 2,
        isVisible: true,
        cards: [
          {
            id: 'con_1',
            title: 'Janakpuri Center Campus',
            description: 'C4F/33, behind F Market, Janakpuri, New Delhi 110058. 5 min from Janakpuri West Metro Station.',
            badge: 'Flagship Center',
            linkText: 'View Map',
            linkUrl: '/classroom'
          },
          {
            id: 'con_2',
            title: 'Dwarka Sector 12 Campus',
            description: 'Adjoining Sector 12 Metro Station, New Delhi 110078. State-of-the-art CBT computer lab.',
            badge: 'Metro Connected',
            linkText: 'View Map',
            linkUrl: '/classroom'
          },
          {
            id: 'con_3',
            title: 'Direct Doubt Solving Clinics',
            description: 'Separate doubt counters for Physics, Chemistry, and Mathematics available 6 days a week.',
            badge: 'Daily Doubts',
            linkText: 'Learn More',
            linkUrl: '/about'
          }
        ]
      },
      {
        id: 'sec_contact_assets',
        type: 'assets',
        title: 'Download Admissions Documentation & Fee Structure',
        subtitle: 'Official admission form, scholarship criteria, and fee schedule',
        content: '',
        order: 3,
        isVisible: true,
        assets: [
          {
            id: 'cona_1',
            title: 'Offline Classroom Admissions Application Form 2026-27',
            fileType: 'pdf',
            fileUrl: '/docs/prospectus-2026.pdf',
            fileSize: '1.9 MB',
            buttonText: 'Download Application'
          }
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  }
};

// ----------------------------------------------------
// CMS SERVICE IMPLEMENTATION
// ----------------------------------------------------

export const cmsService = {
  /**
   * Broadcast an event to trigger live component updates across the app
   */
  notifyUpdate(type: 'navbar' | 'footer' | 'courses' | 'pages' | 'test_series' | 'pyqs' | 'dpp' | 'results' | 'classroom' | string, id?: string): void {
    window.dispatchEvent(
      new CustomEvent(CMS_EVENT_KEY, {
        detail: { type, id, timestamp: Date.now() }
      })
    );
  },

  // ================================================================
  // 1. NAVBAR MANAGEMENT (CRUD)
  // ================================================================
  getNavbarItems(): NavbarMenuItem[] {
    try {
      const raw = localStorage.getItem(NAVBAR_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(NAVBAR_STORAGE_KEY, JSON.stringify(DEFAULT_NAVBAR_ITEMS));
        return DEFAULT_NAVBAR_ITEMS;
      }
      const parsed: NavbarMenuItem[] = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_NAVBAR_ITEMS;
      }
      return parsed;
    } catch {
      return DEFAULT_NAVBAR_ITEMS;
    }
  },

  saveNavbarItems(items: NavbarMenuItem[]): void {
    localStorage.setItem(NAVBAR_STORAGE_KEY, JSON.stringify(items));
    apiClient.post('/cms/navbar', { data: items }).catch((err) => {
      console.warn('[cmsService] saveNavbarItems API error:', err);
    });
    this.notifyUpdate('navbar');
  },

  async fetchNavbarFromAPI(): Promise<NavbarMenuItem[]> {
    try {
      const res = await apiClient.get<any>('/cms/navbar');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        localStorage.setItem(NAVBAR_STORAGE_KEY, JSON.stringify(res.data));
        this.notifyUpdate('navbar');
        return res.data;
      }
    } catch (err) {
      console.warn('[cmsService] fetchNavbarFromAPI fallback:', err);
    }
    return this.getNavbarItems();
  },

  async fetchFooterFromAPI(): Promise<FooterConfig> {
    try {
      const res = await apiClient.get<any>('/cms/footer');
      if (res && res.success && res.data && typeof res.data === 'object') {
        localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(res.data));
        this.notifyUpdate('footer');
        return res.data;
      }
    } catch (err) {
      console.warn('[cmsService] fetchFooterFromAPI fallback:', err);
    }
    return this.getFooterConfig();
  },

  async fetchPagesFromAPI(): Promise<Record<string, PageContentConfig>> {
    try {
      const res = await apiClient.get<any>('/cms/pages');
      if (res && res.success && res.data && typeof res.data === 'object') {
        const data = res.data;
        const defHome = DEFAULT_PAGE_CONFIGS['home'];
        // Ensure home has all 8 sections
        if (!data.home || !data.home.customSections || data.home.customSections.length < 6 || !data.home.customSections.some((s: any) => s.id === 'sec_home_why_us')) {
          data.home = {
            ...defHome,
            ...(data.home || {}),
            customSections: defHome.customSections
          };
        }
        // Ensure about has all 5 sections
        const defAbout = DEFAULT_PAGE_CONFIGS['about'];
        if (!data.about || !data.about.customSections || data.about.customSections.length < 4 || !data.about.customSections.some((s: any) => s.id === 'sec_about_methodology')) {
          data.about = {
            ...defAbout,
            ...(data.about || {}),
            customSections: defAbout.customSections
          };
        }
        localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(data));
        this.notifyUpdate('pages');
        return data;
      }
    } catch (err) {
      console.warn('[cmsService] fetchPagesFromAPI fallback:', err);
    }
    return this.getAllPageConfigs();
  },

  addNavbarItem(item: Omit<NavbarMenuItem, 'id'>): NavbarMenuItem {
    const items = this.getNavbarItems();
    const newItem: NavbarMenuItem = {
      ...item,
      id: `nav_${Date.now()}`,
      order: items.length + 1
    };
    items.push(newItem);
    this.saveNavbarItems(items);
    return newItem;
  },

  updateNavbarItem(id: string, updates: Partial<NavbarMenuItem>): void {
    const items = this.getNavbarItems();
    const updated = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
    this.saveNavbarItems(updated);
  },

  deleteNavbarItem(id: string): void {
    const items = this.getNavbarItems().filter((item) => item.id !== id);
    this.saveNavbarItems(items);
  },

  addDropdownItem(parentId: string, subItem: Omit<NavbarDropdownItem, 'id'>): void {
    const items = this.getNavbarItems();
    const target = items.find((item) => item.id === parentId);
    if (!target) return;

    if (!target.dropdownItems) target.dropdownItems = [];
    const newSub: NavbarDropdownItem = {
      ...subItem,
      id: `sub_${Date.now()}`,
      order: target.dropdownItems.length + 1
    };
    target.dropdownItems.push(newSub);
    target.isDropdown = true;
    this.saveNavbarItems(items);
  },

  updateDropdownItem(parentId: string, subItemId: string, updates: Partial<NavbarDropdownItem>): void {
    const items = this.getNavbarItems();
    const parent = items.find((item) => item.id === parentId);
    if (!parent || !parent.dropdownItems) return;

    parent.dropdownItems = parent.dropdownItems.map((sub) =>
      sub.id === subItemId ? { ...sub, ...updates } : sub
    );
    this.saveNavbarItems(items);
  },

  deleteDropdownItem(parentId: string, subItemId: string): void {
    const items = this.getNavbarItems();
    const parent = items.find((item) => item.id === parentId);
    if (!parent || !parent.dropdownItems) return;

    parent.dropdownItems = parent.dropdownItems.filter((sub) => sub.id !== subItemId);
    if (parent.dropdownItems.length === 0) {
      parent.isDropdown = false;
    }
    this.saveNavbarItems(items);
  },

  resetNavbarToDefault(): void {
    localStorage.setItem(NAVBAR_STORAGE_KEY, JSON.stringify(DEFAULT_NAVBAR_ITEMS));
    this.notifyUpdate('navbar');
  },

  // ================================================================
  // 2. FOOTER MANAGEMENT (CRUD)
  // ================================================================
  getFooterConfig(): FooterConfig {
    try {
      const raw = localStorage.getItem(FOOTER_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(DEFAULT_FOOTER_CONFIG));
        return DEFAULT_FOOTER_CONFIG;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FOOTER_CONFIG;
    }
  },

  saveFooterConfig(config: FooterConfig): void {
    const payload = { ...config, updatedAt: new Date().toISOString() };
    localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(payload));
    apiClient.post('/cms/footer', { data: payload }).catch(() => {});
    this.notifyUpdate('footer');
  },

  addFooterLink(category: 'learningLinks' | 'policyLinks' | 'subjectLinks', link: Omit<FooterLinkItem, 'id'>): void {
    const current = this.getFooterConfig();
    const newLink: FooterLinkItem = {
      ...link,
      id: `fl_${Date.now()}`
    };
    current[category] = [...(current[category] || []), newLink];
    this.saveFooterConfig(current);
  },

  updateFooterLink(
    category: 'learningLinks' | 'policyLinks' | 'subjectLinks',
    linkId: string,
    updates: Partial<FooterLinkItem>
  ): void {
    const current = this.getFooterConfig();
    current[category] = (current[category] || []).map((l) => (l.id === linkId ? { ...l, ...updates } : l));
    this.saveFooterConfig(current);
  },

  deleteFooterLink(category: 'learningLinks' | 'policyLinks' | 'subjectLinks', linkId: string): void {
    const current = this.getFooterConfig();
    current[category] = (current[category] || []).filter((l) => l.id !== linkId);
    this.saveFooterConfig(current);
  },

  resetFooterToDefault(): void {
    localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(DEFAULT_FOOTER_CONFIG));
    this.notifyUpdate('footer');
  },

  // ================================================================
  // ================================================================
  // 3. COURSE CATALOG MANAGEMENT (MONGODB + LOCAL CACHE + REAL-TIME)
  // ================================================================
  getCourses(): Course[] {
    try {
      const raw = localStorage.getItem(COURSES_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : COURSES_CATALOG;
      const baseList = Array.isArray(list) && list.length > 0 ? list : COURSES_CATALOG;

      const normalized: Course[] = baseList.map((c: any) => ({
        ...c,
        rating: c.rating || (c.isPopular ? 4.9 : c.badge?.includes('Free') ? 4.8 : (c.numericPrice && c.numericPrice > 50000) ? 4.9 : 4.7),
        language: c.language || 'Hinglish (Hindi + Eng)',
        subjects: Array.isArray(c.subjects) && c.subjects.length > 0
          ? c.subjects
          : c.title?.toLowerCase().includes('math')
          ? ['Mathematics']
          : c.title?.toLowerCase().includes('physics')
          ? ['Physics']
          : c.title?.toLowerCase().includes('chemistry')
          ? ['Chemistry']
          : ['Physics', 'Chemistry', 'Mathematics'],
        courseType: c.courseType || (c.mode === 'Online Test Series' ? 'test-series' : c.mode === 'Self-Paced' ? 'dlp' : 'live')
      }));

      if (!raw) {
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(normalized));
        this.fetchCoursesFromAPI().catch(() => {});
      }
      return normalized;
    } catch {
      return COURSES_CATALOG;
    }
  },

  async fetchCoursesFromAPI(): Promise<Course[]> {
    try {
      const res = await apiClient.get('/courses');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mongoCourses: Course[] = res.data.map((c: any) => {
          const numPrice = typeof c.price === 'number' ? c.price : parseInt(String(c.price || '').replace(/\D/g, '') || '0', 10);
          const origPrice = typeof c.originalPrice === 'number' ? c.originalPrice : (numPrice > 0 ? numPrice + 15000 : 0);
          
          return {
            id: c.slug || c._id,
            slug: c.slug || c.id,
            _id: c._id,
            title: c.title,
            description: c.description || 'Comprehensive JEE coaching program with DK Sir 20s speed techniques.',
            targetExam: (c.targetExam || c.category || 'JEE Main & Advanced') as any,
            category: (c.category || 'JEE Main') as any,
            targetClass: (c.targetClass || 'Class 11th') as any,
            targetYear: c.targetYear || 'Target JEE 2028',
            price: numPrice === 0 ? '₹0 Free' : `₹${numPrice.toLocaleString('en-IN')}`,
            numericPrice: numPrice,
            originalPrice: origPrice > 0 ? `₹${origPrice.toLocaleString('en-IN')}` : undefined,
            mode: (c.deliveryMode || c.mode || 'Live') as any,
            courseType: c.courseType || (c.deliveryMode === 'Online Live' ? 'live' : c.mode === 'Online Test Series' ? 'test-series' : 'dlp'),
            duration: c.duration || '2-Year Full Program',
            language: c.language || 'Hinglish (Hindi + Eng)',
            subjects: Array.isArray(c.subjects) && c.subjects.length > 0
              ? c.subjects
              : c.title?.toLowerCase().includes('math')
              ? ['Mathematics']
              : c.title?.toLowerCase().includes('physics')
              ? ['Physics']
              : c.title?.toLowerCase().includes('chemistry')
              ? ['Chemistry']
              : ['Physics', 'Chemistry', 'Mathematics'],
            level: c.level || c.targetClass,
            features: Array.isArray(c.features)
              ? c.features
              : typeof c.features === 'string'
              ? (c.features as string).split(/(?=[A-Z][a-z]+)/).filter(Boolean)
              : [
                  'DK Sir 20-30s Speed Solving Algorithms',
                  'Live Audio Doubt Counter 6 Days/Week',
                  'Printed Theory Modules & Daily DPPs'
                ],
            coverImage: c.coverImage || '/img/dk-results-banner.jpeg',
            badge: c.badge || (numPrice === 0 ? '100% Free Demo Access' : 'Flagship Batch'),
            badgeUrgency: (numPrice === 0 ? 'instant' : 'popular') as any,
            tier: numPrice === 0 ? 'Free' : 'Paid',
            curriculumSections: Array.isArray(c.curriculumSections) ? c.curriculumSections : [],
            enrolledCount: c.enrolmentCount || c.enrolledCount || 34,
            rating: c.rating || 4.9,
            isPublished: c.isPublished !== false,
            status: (c.status === 'draft' ? 'Draft' : 'Published') as any,
            instructor: c.instructor || 'Prof. R.K. Verma & DK Sir'
          };
        });

        // Merge MongoDB courses with local/catalog courses so free demo items are retained
        const localCourses = this.getCourses();
        const mergedMap = new Map<string, Course>();

        // 1. Add MongoDB courses (primary source of truth)
        mongoCourses.forEach((c) => mergedMap.set(c.id, c));

        // 2. Add local or catalog courses not yet in MongoDB
        localCourses.forEach((c) => {
          if (!mergedMap.has(c.id)) {
            mergedMap.set(c.id, c);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(mergedList));
        this.notifyUpdate('courses');
        return mergedList;
      }
    } catch (err) {
      console.warn('[cmsService] Failed to sync courses from MongoDB API:', err);
    }
    return this.getCourses();
  },

  getCourseById(id: string): Course | undefined {
    return this.getCourses().find((c) => c.id === id || (c as any)._id === id || (c as any).slug === id);
  },

  saveCourses(courses: Course[]): void {
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    apiClient.post('/cms/courses', { data: courses }).catch(() => {});
    this.notifyUpdate('courses');
  },

  createCourse(course: Omit<Course, 'id'> & { id?: string }): Course {
    const courses = this.getCourses();
    const id = course.id && course.id.trim() ? course.id.trim() : `course_${Date.now()}`;
    const slug = (course as any).slug || id;
    const numPrice = typeof course.numericPrice === 'number'
      ? course.numericPrice
      : typeof course.price === 'string'
      ? parseInt(course.price.replace(/\D/g, '') || '0', 10)
      : 0;

    const newCourse: Course = {
      ...course,
      id,
      slug,
      numericPrice: numPrice,
      price: course.price || (numPrice === 0 ? '₹0 Free' : `₹${numPrice.toLocaleString('en-IN')}`)
    };

    const updated = [newCourse, ...courses.filter((c) => c.id !== id)];
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updated));
    this.notifyUpdate('courses');

    // Persist to MongoDB backend API
    const mongoPayload = {
      title: newCourse.title,
      slug: newCourse.slug || newCourse.id,
      description: newCourse.description,
      category: newCourse.category || 'JEE Main & Advanced',
      targetClass: newCourse.targetClass || 'Class 11th',
      targetYear: newCourse.targetYear || 'Target JEE 2028',
      price: numPrice,
      originalPrice: typeof (newCourse as any).originalPrice === 'number'
        ? (newCourse as any).originalPrice
        : parseInt(String((newCourse as any).originalPrice || '').replace(/\D/g, '') || '0', 10) || numPrice + 15000,
      deliveryMode: newCourse.mode || 'Online Live',
      coverImage: newCourse.coverImage || '/img/dk-results-banner.jpeg',
      features: newCourse.features || [],
      curriculumSections: (newCourse as any).curriculumSections || [],
      isPublished: (newCourse as any).status !== 'Draft',
      status: (newCourse as any).status === 'Draft' ? 'draft' : 'published',
      level: (newCourse as any).level || (newCourse as any).courseLevel || '',
      tier: newCourse.tier || 'Paid',
      instructor: (newCourse as any).instructor || 'Prof. R.K. Verma & DK Sir'
    };

    apiClient.post('/courses', mongoPayload).catch(() => {});

    return newCourse;
  },

  updateCourse(id: string, updates: Partial<Course>): Course | null {
    const courses = this.getCourses();
    const index = courses.findIndex((c) => c.id === id || (c as any)._id === id || (c as any).slug === id);
    if (index === -1) return null;

    const updatedCourse: Course = {
      ...courses[index],
      ...updates
    };
    courses[index] = updatedCourse;
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    this.notifyUpdate('courses');

    // Sync update to MongoDB backend API
    const targetKey = (courses[index] as any)._id || courses[index].slug || courses[index].id;
    apiClient.put(`/courses/${targetKey}`, updates).catch(() => {});

    return updatedCourse;
  },

  deleteCourse(id: string): boolean {
    const courses = this.getCourses();
    const target = courses.find((c) => c.id === id || (c as any)._id === id || (c as any).slug === id);
    const filtered = courses.filter((c) => c.id !== id && (c as any)._id !== id && (c as any).slug !== id);
    if (filtered.length === courses.length) return false;

    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(filtered));
    this.notifyUpdate('courses');

    // Delete from MongoDB backend API
    const targetKey = (target as any)?._id || target?.slug || id;
    apiClient.delete(`/courses/${targetKey}`).catch(() => {});

    return true;
  },

  resetCoursesToDefault(): void {
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(COURSES_CATALOG));
    this.notifyUpdate('courses');
    this.fetchCoursesFromAPI().catch(() => {});
  },

  // ================================================================
  // 4. PAGES CONTENT CMS (FULL CRUD)
  // ================================================================
  getAllPageConfigs(): Record<string, PageContentConfig> {
    try {
      const raw = localStorage.getItem(PAGES_STORAGE_KEY);
      const def = DEFAULT_PAGE_CONFIGS;
      if (!raw) {
        localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(def));
        return def;
      }
      const parsed = JSON.parse(raw);
      const merged: Record<string, PageContentConfig> = { ...def, ...parsed };

      // Ensure home page has all 8 core visual sections
      const homeConfig = merged['home'];
      const defHome = def['home'];
      const hasCore = homeConfig?.customSections?.some((s) => s.id === 'sec_home_why_us');
      if (!homeConfig || !homeConfig.customSections || homeConfig.customSections.length < 6 || !hasCore) {
        merged['home'] = {
          ...defHome,
          ...(homeConfig || {}),
          stats: (homeConfig?.stats && homeConfig.stats.length > 0) ? homeConfig.stats : defHome.stats,
          customSections: defHome.customSections
        };
        localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(merged));
      }

      // Ensure about page has all 5 core visual sections
      const aboutConfig = merged['about'];
      const defAbout = def['about'];
      const hasAboutCore = aboutConfig?.customSections?.some((s) => s.id === 'sec_about_methodology');
      if (!aboutConfig || !aboutConfig.customSections || aboutConfig.customSections.length < 4 || !hasAboutCore) {
        merged['about'] = {
          ...defAbout,
          ...(aboutConfig || {}),
          customSections: defAbout.customSections
        };
        localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(merged));
      }

      return merged;
    } catch {
      return DEFAULT_PAGE_CONFIGS;
    }
  },

  getPageConfig(pageId: string): PageContentConfig {
    const all = this.getAllPageConfigs();
    if (all[pageId]) {
      const config = all[pageId];
      if (pageId === 'home') {
        const defHome = DEFAULT_PAGE_CONFIGS['home'];
        const hasCoreSections = config.customSections?.some((s) => s.id === 'sec_home_why_us');
        const finalSections = (hasCoreSections && config.customSections && config.customSections.length >= 6)
          ? config.customSections
          : defHome.customSections;

        return {
          ...defHome,
          ...config,
          heroBadge: config.heroBadge && config.heroBadge !== 'JEE MAIN & ADVANCED 2026-27 ADMISSIONS OPEN' && config.heroBadge !== 'FOUNDED BY DK SIR • 15+ YEARS OF EXCELLENCE' ? config.heroBadge : defHome.heroBadge,
          heroHeading: config.heroHeading && config.heroHeading !== 'IIT JEE Coaching Reimagined' ? config.heroHeading : defHome.heroHeading,
          heroSubheading: config.heroSubheading && config.heroSubheading.length > 20 ? config.heroSubheading : defHome.heroSubheading,
          stats: config.stats && config.stats.length > 0 ? config.stats : defHome.stats,
          customSections: finalSections
        };
      }
      if (pageId === 'about') {
        const defAbout = DEFAULT_PAGE_CONFIGS['about'];
        const hasAboutCore = config.customSections?.some((s) => s.id === 'sec_about_methodology');
        const finalSections = (hasAboutCore && config.customSections && config.customSections.length >= 4)
          ? config.customSections
          : defAbout.customSections;

        return {
          ...defAbout,
          ...config,
          customSections: finalSections
        };
      }
      return config;
    }

    // Fallback default structure
    const fallback: PageContentConfig = {
      pageId,
      pageTitle: pageId.toUpperCase(),
      metaTitle: `DK Academy JEE | ${pageId.toUpperCase()}`,
      metaDescription: `DK Academy JEE - Official page for ${pageId}`,
      heroHeading: `Welcome to ${pageId}`,
      heroSubheading: 'Learn with Dharmendra Kumar (DK Sir)',
      customSections: [],
      updatedAt: new Date().toISOString()
    };
    return fallback;
  },

  savePageConfig(pageId: string, updates: Partial<PageContentConfig>): void {
    const all = this.getAllPageConfigs();
    const existing = all[pageId] || this.getPageConfig(pageId);
    all[pageId] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(all));
    apiClient.post('/cms/pages', { data: all }).catch((err) => {
      console.warn('[cmsService] savePageConfig API error:', err);
    });
    this.notifyUpdate('pages', pageId);
  },

  addCustomSection(pageId: string, section: Omit<PageSectionItem, 'id'>): void {
    const current = this.getPageConfig(pageId);
    const newSection: PageSectionItem = {
      ...section,
      id: `sec_${Date.now()}`,
      order: (current.customSections?.length || 0) + 1
    };
    const sections = [...(current.customSections || []), newSection];
    this.savePageConfig(pageId, { customSections: sections });
  },

  updateCustomSection(pageId: string, sectionId: string, updates: Partial<PageSectionItem>): void {
    const current = this.getPageConfig(pageId);
    const sections = (current.customSections || []).map((sec) =>
      sec.id === sectionId ? { ...sec, ...updates } : sec
    );
    this.savePageConfig(pageId, { customSections: sections });
  },

  deleteCustomSection(pageId: string, sectionId: string): void {
    const current = this.getPageConfig(pageId);
    const sections = (current.customSections || []).filter((sec) => sec.id !== sectionId);
    this.savePageConfig(pageId, { customSections: sections });
  },

  resetPageToDefault(pageId: string): void {
    const all = this.getAllPageConfigs();
    if (DEFAULT_PAGE_CONFIGS[pageId]) {
      all[pageId] = DEFAULT_PAGE_CONFIGS[pageId];
      localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(all));
      this.notifyUpdate('pages', pageId);
    }
  },

  // --------------------------------------------------
  // TEST SERIES & CBT QUIZZES CRUD (MONGODB + LOCAL CACHE + REAL-TIME)
  // --------------------------------------------------
  async fetchTestSeriesFromAPI(): Promise<TestSeriesItem[]> {
    try {
      const response = await apiClient.get<TestSeriesItem[]>('/test-series');
      const items = Array.isArray(response) ? response : (response as any)?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        localStorage.setItem(TEST_SERIES_STORAGE_KEY, JSON.stringify(items));
        this.notifyUpdate('test_series');
        return items;
      }
    } catch (err) {
      console.warn('[cmsService] Failed to fetch test series from API, using cached data:', err);
    }
    return this.getTestSeries();
  },

  getTestSeries(): TestSeriesItem[] {
    try {
      const stored = localStorage.getItem(TEST_SERIES_STORAGE_KEY);
      if (stored) {
        const parsed: TestSeriesItem[] = JSON.parse(stored);
        const specialist = TEST_SERIES_DATA.find((t) => t.id === 'test-ja-coord-geom-01');
        if (specialist && !parsed.some((p) => p.id === 'test-ja-coord-geom-01')) {
          parsed.unshift(specialist);
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return TEST_SERIES_DATA;
  },

  getTestSeriesById(id: string): TestSeriesItem | undefined {
    return this.getTestSeries().find((t) => t.id === id);
  },

  saveTestSeries(items: TestSeriesItem[]): void {
    localStorage.setItem(TEST_SERIES_STORAGE_KEY, JSON.stringify(items));
    apiClient.post('/cms/test_series', { data: items }).catch(() => {});
    this.notifyUpdate('test_series');
  },

  async createTestSeries(item: Omit<TestSeriesItem, 'id'> & { id?: string }): Promise<TestSeriesItem> {
    const items = this.getTestSeries();
    const newItem: TestSeriesItem = {
      ...item,
      id: item.id || `ts-${Date.now()}`
    };
    items.unshift(newItem);
    this.saveTestSeries(items);

    try {
      const res = await apiClient.post<any>('/test-series', newItem);
      if (res && res.data) {
        const saved = res.data;
        const updatedItems = items.map((t) => (t.id === newItem.id ? { ...t, ...saved } : t));
        localStorage.setItem(TEST_SERIES_STORAGE_KEY, JSON.stringify(updatedItems));
        this.notifyUpdate('test_series');
        return saved;
      }
    } catch (err) {
      console.warn('[cmsService] API save failed, cached locally:', err);
    }

    return newItem;
  },

  async updateTestSeries(id: string, updates: Partial<TestSeriesItem>): Promise<TestSeriesItem> {
    const items = this.getTestSeries();
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Test series not found');
    items[idx] = { ...items[idx], ...updates };
    this.saveTestSeries(items);

    try {
      await apiClient.put(`/test-series/${id}`, updates);
    } catch (err) {
      console.warn('[cmsService] API update failed:', err);
    }

    return items[idx];
  },

  async deleteTestSeries(id: string): Promise<void> {
    const items = this.getTestSeries().filter((t) => t.id !== id);
    this.saveTestSeries(items);

    try {
      await apiClient.delete(`/test-series/${id}`);
    } catch (err) {
      console.warn('[cmsService] API delete failed:', err);
    }
  },

  resetTestSeries(): void {
    localStorage.removeItem(TEST_SERIES_STORAGE_KEY);
    this.notifyUpdate('test_series');
  },

  // --------------------------------------------------
  // PYQ BANK CRUD
  // --------------------------------------------------
  getPYQs(): PYQQuestion[] {
    try {
      const stored = localStorage.getItem(PYQ_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return PYQ_QUESTIONS;
  },

  savePYQs(items: PYQQuestion[]): void {
    localStorage.setItem(PYQ_STORAGE_KEY, JSON.stringify(items));
    apiClient.post('/cms/pyqs', { data: items }).catch(() => {});
    this.notifyUpdate('pyqs');
  },

  createPYQ(item: Omit<PYQQuestion, 'id'>): PYQQuestion {
    const items = this.getPYQs();
    const newItem: PYQQuestion = {
      ...item,
      id: `pyq_${Date.now()}`
    };
    items.unshift(newItem);
    this.savePYQs(items);
    return newItem;
  },

  updatePYQ(id: string, updates: Partial<PYQQuestion>): PYQQuestion {
    const items = this.getPYQs();
    const idx = items.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error('PYQ not found');
    items[idx] = { ...items[idx], ...updates };
    this.savePYQs(items);
    return items[idx];
  },

  deletePYQ(id: string): void {
    const items = this.getPYQs().filter((q) => q.id !== id);
    this.savePYQs(items);
  },

  resetPYQs(): void {
    localStorage.removeItem(PYQ_STORAGE_KEY);
    apiClient.post('/cms/pyqs/reset').catch(() => {});
    this.notifyUpdate('pyqs');
  },

  // --------------------------------------------------
  // DPP PRACTICE SETS CRUD
  // --------------------------------------------------
  getDPPSets(): DPPSet[] {
    try {
      const stored = localStorage.getItem(DPP_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DPP_SETS;
  },

  getDPPSetById(id: string): DPPSet | undefined {
    return this.getDPPSets().find((d) => d.id === id);
  },

  saveDPPSets(items: DPPSet[]): void {
    localStorage.setItem(DPP_STORAGE_KEY, JSON.stringify(items));
    apiClient.post('/cms/dpp', { data: items }).catch(() => {});
    this.notifyUpdate('dpp');
  },

  createDPPSet(item: Omit<DPPSet, 'id'>): DPPSet {
    const items = this.getDPPSets();
    const newItem: DPPSet = {
      ...item,
      id: `dpp_${Date.now()}`
    };
    items.unshift(newItem);
    this.saveDPPSets(items);
    return newItem;
  },

  updateDPPSet(id: string, updates: Partial<DPPSet>): DPPSet {
    const items = this.getDPPSets();
    const idx = items.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('DPP set not found');
    items[idx] = { ...items[idx], ...updates };
    this.saveDPPSets(items);
    return items[idx];
  },

  deleteDPPSet(id: string): void {
    const items = this.getDPPSets().filter((d) => d.id !== id);
    this.saveDPPSets(items);
  },

  resetDPPSets(): void {
    localStorage.removeItem(DPP_STORAGE_KEY);
    apiClient.post('/cms/dpp/reset').catch(() => {});
    this.notifyUpdate('dpp');
  },

  // --------------------------------------------------
  // RESULTS / ACHIEVERS CRUD
  // --------------------------------------------------
  getResults(): AchieverItem[] {
    try {
      localStorage.removeItem('dk_academy_cms_results_v1');
      const stored = localStorage.getItem(RESULTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return ACHIEVERS_LIST;
  },

  saveResults(items: AchieverItem[]): void {
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(items));
    apiClient.post('/cms/results', { data: items }).catch(() => {});
    this.notifyUpdate('results');
  },

  createResult(item: Omit<AchieverItem, 'id'>): AchieverItem {
    const items = this.getResults();
    const newItem: AchieverItem = {
      ...item,
      id: `ach_${Date.now()}`
    };
    items.unshift(newItem);
    this.saveResults(items);
    return newItem;
  },

  updateResult(id: string, updates: Partial<AchieverItem>): AchieverItem {
    const items = this.getResults();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Result item not found');
    items[idx] = { ...items[idx], ...updates };
    this.saveResults(items);
    return items[idx];
  },

  deleteResult(id: string): void {
    const items = this.getResults().filter((r) => r.id !== id);
    this.saveResults(items);
  },

  resetResults(): void {
    localStorage.removeItem(RESULTS_STORAGE_KEY);
    apiClient.post('/cms/results/reset').catch(() => {});
    this.notifyUpdate('results');
  },

  // --------------------------------------------------
  // CLASSROOM BATCHES CRUD
  // --------------------------------------------------
  getClassroomBatches(): ClassroomBatch[] {
    try {
      const stored = localStorage.getItem(CLASSROOM_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_CLASSROOM_BATCHES;
  },

  saveClassroomBatches(items: ClassroomBatch[]): void {
    localStorage.setItem(CLASSROOM_STORAGE_KEY, JSON.stringify(items));
    apiClient.post('/cms/classroom', { data: items }).catch(() => {});
    this.notifyUpdate('classroom');
  },

  createClassroomBatch(item: Omit<ClassroomBatch, 'id'>): ClassroomBatch {
    const items = this.getClassroomBatches();
    const newItem: ClassroomBatch = {
      ...item,
      id: `batch_${Date.now()}`
    };
    items.push(newItem);
    this.saveClassroomBatches(items);
    return newItem;
  },

  updateClassroomBatch(id: string, updates: Partial<ClassroomBatch>): ClassroomBatch {
    const items = this.getClassroomBatches();
    const idx = items.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Classroom batch not found');
    items[idx] = { ...items[idx], ...updates };
    this.saveClassroomBatches(items);
    return items[idx];
  },

  deleteClassroomBatch(id: string): void {
    const items = this.getClassroomBatches().filter((b) => b.id !== id);
    this.saveClassroomBatches(items);
  },

  resetClassroomBatches(): void {
    localStorage.removeItem(CLASSROOM_STORAGE_KEY);
    this.notifyUpdate('classroom');
  },

  // --------------------------------------------------
  // LIVE SESSIONS CRUD (TEACHER & FACULTY)
  // --------------------------------------------------
  getLiveSessions(): LiveClassSession[] {
    try {
      const stored = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_LIVE_SESSIONS;
  },

  saveLiveSessions(sessions: LiveClassSession[]): void {
    localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    this.notifyUpdate('live_sessions');
  },

  createLiveSession(session: Omit<LiveClassSession, 'id'>): LiveClassSession {
    const list = this.getLiveSessions();
    const newSession: LiveClassSession = {
      ...session,
      id: `live_${Date.now()}`
    };
    list.unshift(newSession);
    this.saveLiveSessions(list);
    return newSession;
  },

  updateLiveSession(id: string, updates: Partial<LiveClassSession>): LiveClassSession {
    const list = this.getLiveSessions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Live session not found');
    list[idx] = { ...list[idx], ...updates };
    this.saveLiveSessions(list);
    return list[idx];
  },

  deleteLiveSession(id: string): void {
    const filtered = this.getLiveSessions().filter((s) => s.id !== id);
    this.saveLiveSessions(filtered);
  },

  // --------------------------------------------------
  // DYNAMIC PAGES LIST & NAVBAR/FOOTER AUTO-LINKING
  // --------------------------------------------------
  getPagesList(): { id: string; name: string; slug: string; inNavbar?: boolean; inFooter?: boolean }[] {
    const defaultPages = [
      { id: 'home', name: 'Home Page', slug: '/' },
      { id: 'about', name: 'About DK Sir & Academy', slug: '/about' }
    ];
    try {
      const raw = localStorage.getItem(PAGES_LIST_STORAGE_KEY);
      if (raw) {
        const stored: Array<{ id: string; name: string; slug: string; inNavbar?: boolean; inFooter?: boolean }> = JSON.parse(raw);
        // Filter out unwanted built-in system pages, keep only home, about, and user-created custom pages
        const unwantedBuiltins = new Set([
          'courses', 'courses-jee-main', 'courses-jee-adv', 'bitsat', 'courses-foundation',
          'courses-repeater', 'free-lectures', 'test-series', 'pyq', 'dpp', 'classroom', 'results', 'contact'
        ]);
        const customPages = stored.filter(
          (p) => p.id !== 'home' && p.id !== 'about' && !unwantedBuiltins.has(p.id)
        );
        return [...defaultPages, ...customPages];
      }
    } catch {
      // fallback
    }
    return defaultPages;
  },

  savePagesList(pages: { id: string; name: string; slug: string; inNavbar?: boolean; inFooter?: boolean }[]): void {
    localStorage.setItem(PAGES_LIST_STORAGE_KEY, JSON.stringify(pages));
    this.notifyUpdate('pages_list');
  },

  addNewPage(pageData: {
    id: string;
    name: string;
    slug: string;
    layoutTemplate?: 'standard' | 'video-showcase' | 'cards-grid' | 'academic-syllabus';
    heroHeading?: string;
    heroSubheading?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    linkWithNavbar?: boolean;
    navbarLabel?: string;
    navbarBadge?: string;
    linkWithFooter?: boolean;
    footerColumn?: string;
  }): PageContentConfig {
    const pages = this.getPagesList();
    const pageId = pageData.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const slug = pageData.slug.startsWith('/') ? pageData.slug : `/${pageData.slug}`;

    // 1. Add to pages list
    if (!pages.some((p) => p.id === pageId)) {
      pages.push({
        id: pageId,
        name: pageData.name,
        slug,
        inNavbar: !!pageData.linkWithNavbar,
        inFooter: !!pageData.linkWithFooter
      });
      this.savePagesList(pages);
    }

    // 2. Pre-seed sections based on chosen layout template
    const template = pageData.layoutTemplate || 'standard';
    const preSeededSections: PageSectionItem[] = [];

    if (template === 'cards-grid') {
      preSeededSections.push({
        id: `sec_${Date.now()}_cards`,
        type: 'cards',
        title: 'Core Programs & Curriculum Tracks',
        subtitle: 'Explore specialized modules and interactive study tracks',
        content: 'Structured syllabus coverage with daily practice problems and mentor doubt-clearing sessions.',
        columns: 3,
        order: 1,
        isVisible: true,
        cards: [
          {
            id: 'c1',
            title: 'Concept Foundation Track',
            description: 'Master first-principles derivations and visual geometry for Class 11th & 12th.',
            badge: 'Flagship',
            icon: 'Target',
            linkText: 'Explore Track',
            linkUrl: '/courses'
          },
          {
            id: 'c2',
            title: '20-30s Speed Shortcut Drills',
            description: 'Learn DK Sir’s proprietary elimination tactics for Calculus, Algebra, and Vectors.',
            badge: 'High Yield',
            icon: 'Zap',
            linkText: 'View Schedule',
            linkUrl: '/free-lectures'
          },
          {
            id: 'c3',
            title: 'Rank Accelerator CBT Labs',
            description: 'Weekly full-syllabus CBT mock tests with percentile analysis and video solutions.',
            badge: 'Advanced',
            icon: 'Trophy',
            linkText: 'Take Test',
            linkUrl: '/test-series'
          }
        ]
      });
    } else if (template === 'video-showcase') {
      preSeededSections.push({
        id: `sec_${Date.now()}_video`,
        type: 'video',
        title: 'Featured Video Masterclass',
        subtitle: 'Watch DK Sir explain 20s calculus inspection tactics',
        content: 'Experience how Kota pedagogy simplifies complex rotational mechanics and definite integration.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoThumbnail: '/img/dk-results-banner.jpeg',
        videoCaption: 'Masterclass: 20-30s Calculus Shortcuts with DK Sir',
        order: 1,
        isVisible: true
      });
    } else if (template === 'academic-syllabus') {
      preSeededSections.push({
        id: `sec_${Date.now()}_assets`,
        type: 'assets',
        title: 'Academic Resources & Prospectus Downloads',
        subtitle: 'Download official syllabus guides, formula cheat sheets, and admission brochures',
        content: 'Verified study material curated by Kota senior faculty for Class 11, 12 & Dropper aspirants.',
        order: 1,
        isVisible: true,
        assets: [
          {
            id: 'a1',
            title: 'Official JEE Mathematics Formula Pocketbook (DK Sir)',
            fileType: 'pdf',
            fileUrl: '/docs/formula-handbook.pdf',
            fileSize: '4.2 MB',
            buttonText: 'Download PDF'
          },
          {
            id: 'a2',
            title: '2026-27 Academic Curriculum & Batch Schedule',
            fileType: 'pdf',
            fileUrl: '/docs/prospectus-2026.pdf',
            fileSize: '6.8 MB',
            buttonText: 'Download Prospectus'
          }
        ]
      });
    } else {
      // Standard template: Banner + Cards
      preSeededSections.push(
        {
          id: `sec_${Date.now()}_banner`,
          type: 'banner',
          title: 'Specialized JEE Mentorship Batch',
          subtitle: 'Limited to 25 aspirants per batch for personal guidance with DK Sir',
          content: 'Daily doubt clearance, Kota pedagogy workbooks, and continuous parent-mentor feedback loops.',
          badge: 'ADMISSIONS OPEN',
          buttonText: 'Apply for Admission',
          buttonUrl: '/contact',
          imageUrl: '/img/dk-results-banner.jpeg',
          order: 1,
          isVisible: true
        },
        {
          id: `sec_${Date.now()}_cards`,
          type: 'cards',
          title: 'Why Students Choose This Program',
          subtitle: 'Proven advantages that set DK Academy aspirants apart',
          content: '',
          columns: 3,
          order: 2,
          isVisible: true,
          cards: [
            {
              id: 'sc1',
              title: 'Strictly 25 Aspirants',
              description: 'Personal attention on homework and doubt clarification every single day.',
              badge: 'Exclusive',
              icon: 'Users',
              linkText: 'Learn More',
              linkUrl: '/about'
            },
            {
              id: 'sc2',
              title: 'Kota Pedagogy Modules',
              description: 'Exhaustive daily practice sheets with video derivations for every single question.',
              badge: 'Comprehensive',
              icon: 'BookOpen',
              linkText: 'View Modules',
              linkUrl: '/dpp'
            },
            {
              id: 'sc3',
              title: 'Real-time CBT Mock Tests',
              description: 'NTA-identical exam software with detailed speed analytics and rank prediction.',
              badge: 'NTA Exam Rigor',
              icon: 'Monitor',
              linkText: 'Explore CBT',
              linkUrl: '/test-series'
            }
          ]
        }
      );
    }

    // 3. Initialize Page Config
    const initialConfig: PageContentConfig = {
      pageId,
      pageTitle: pageData.name,
      layoutTemplate: template,
      metaTitle: pageData.metaTitle || `${pageData.name} | DK Academy JEE`,
      metaDescription: pageData.metaDescription || `Official page for ${pageData.name} at DK Academy JEE`,
      metaKeywords: pageData.metaKeywords || 'DK Academy JEE, IIT JEE Coaching Delhi, DK Sir',
      heroBadge: 'SPECIAL PROGRAM • ADMISSIONS OPEN',
      heroHeading: pageData.heroHeading || pageData.name,
      heroSubheading: pageData.heroSubheading || 'Mentored by Dharmendra Kumar (DK Sir) — 18+ Years Kota Pedagogy',
      primaryCtaText: 'Enroll Now',
      primaryCtaUrl: '/courses',
      secondaryCtaText: 'Request Callback',
      secondaryCtaUrl: '/contact',
      customSections: preSeededSections,
      updatedAt: new Date().toISOString()
    };
    this.savePageConfig(pageId, initialConfig);

    // 3. Link with Navbar automatically if requested
    if (pageData.linkWithNavbar) {
      const navItems = this.getNavbarItems();
      const existingNavIdx = navItems.findIndex((item) => item.path === slug);
      if (existingNavIdx === -1) {
        navItems.push({
          id: `nav_${pageId}`,
          label: pageData.navbarLabel || pageData.name,
          path: slug,
          isDropdown: false,
          isVisible: true,
          order: navItems.length + 1,
          badge: pageData.navbarBadge
        });
        this.saveNavbarItems(navItems);
      }
    }

    // 4. Link with Footer automatically if requested
    if (pageData.linkWithFooter) {
      const footerConfig = this.getFooterConfig();
      const targetList = pageData.footerColumn === 'policy' ? footerConfig.policyLinks : footerConfig.learningLinks;
      if (targetList && !targetList.some((l) => l.path === slug)) {
        targetList.push({
          id: `foot_${pageId}`,
          label: pageData.navbarLabel || pageData.name,
          path: slug,
          isVisible: true,
          badge: pageData.navbarBadge
        });
        this.saveFooterConfig(footerConfig);
      }
    }

    return initialConfig;
  },

  deleteCustomPage(pageId: string): void {
    const pages = this.getPagesList().filter((p) => p.id !== pageId);
    this.savePagesList(pages);

    // Clean from pages config
    const all = this.getAllPageConfigs();
    delete all[pageId];
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(all));
    this.notifyUpdate('pages', pageId);
  }
};

export const DEFAULT_CLASSROOM_BATCHES: ClassroomBatch[] = [
  {
    id: 'batch-11-2yr',
    title: 'Class 11th — 2-Year Comprehensive Classroom Program',
    targetExam: 'JEE Main & Advanced 2028',
    targetClass: 'Class 11th',
    targetYear: 'Target JEE 2028',
    badge: 'Most Popular',
    schedule: 'Monday, Wednesday, Friday',
    timings: '4:30 PM – 7:30 PM (Evening)',
    seatsLeft: 7,
    maxBatchSize: 25,
    fee: '₹84,000',
    feePeriod: 'per year (Incl. GST & Study Kit)',
    features: [
      '600+ hours in-person concept derivations with DK Sir',
      'Daily 20–30s inspection shortcuts for Calculus & Algebra',
      'Printed Kota-pedagogy theory workbooks and daily DPP sheets',
      'Weekly offline OMR mock tests & monthly NTA CBT lab mocks',
      'Daily 1-on-1 personal doubt counter after every lecture'
    ]
  },
  {
    id: 'batch-12-1yr',
    title: 'Class 12th — 1-Year Fastrack Classroom Program',
    targetExam: 'JEE Main & Advanced 2027 + Boards',
    targetClass: 'Class 12th',
    targetYear: 'Target JEE 2027',
    badge: 'Fastrack Intensive',
    schedule: 'Tuesday, Thursday, Saturday',
    timings: '5:00 PM – 8:00 PM (Evening)',
    seatsLeft: 5,
    maxBatchSize: 25,
    fee: '₹92,000',
    feePeriod: 'per year (Incl. GST & Study Kit)',
    features: [
      'Complete Class 12th Boards + JEE Advanced syllabus coverage',
      'Class 11th conceptual revision marathon series',
      'Intensive speed problem solving for 3D Geometry & Vectors',
      '30 full-syllabus all-India mock tests with percentile prediction',
      'Individual progress tracking & performance review with DK Sir'
    ]
  },
  {
    id: 'batch-dropper-sprint',
    title: 'Droppers / Repeaters — Super-30 Intensive Classroom Sprint',
    targetExam: 'JEE Main & Advanced 2027',
    targetClass: 'Dropper / 12th Passed',
    targetYear: 'Target JEE 2027',
    badge: 'Super-30 Cohort',
    schedule: 'Monday to Friday (Daily)',
    timings: '10:00 AM – 2:30 PM (Morning Sprint)',
    seatsLeft: 4,
    maxBatchSize: 25,
    fee: '₹1,05,000',
    feePeriod: 'complete session (Incl. GST)',
    features: [
      'Daily 4.5 hours rigorous offline problem inspection with DK Sir',
      'Zero-rote method: convert 15-minute calculus traps into 30s checks',
      '15+ years solved chapter-wise JEE Advanced question vault',
      'Dedicated silent study library & computer lab for CBT testing',
      'Psychological exam temperament and negative marking reduction drills'
    ]
  },
  {
    id: 'batch-foundation-8-10',
    title: 'Foundation (8th–10th) — Pre-JEE Mathematical Rigour',
    targetExam: 'Pre-JEE, Olympiads & NTSE',
    targetClass: 'Class 8th, 9th & 10th',
    targetYear: 'Target JEE 2029–31',
    badge: 'Foundation Elite',
    schedule: 'Tuesday, Thursday, Saturday',
    timings: '3:30 PM – 5:30 PM',
    seatsLeft: 9,
    maxBatchSize: 20,
    fee: '₹55,000',
    feePeriod: 'per year',
    features: [
      'Early analytical reasoning & algebraic intuition training',
      'School board syllabus + Olympiad (IOQM, NSEJS) problem depth',
      'Mental calculation tricks and geometric visualizations',
      'Weekly diagnostic tests & parents academic consultation'
    ]
  }
];

export const DEFAULT_LIVE_SESSIONS: LiveClassSession[] = [
  {
    id: 'live_01',
    title: 'Kota Mechanics Trap Problems & 30s Elimination Techniques',
    courseId: 'jee-main-advanced-2yr-ultimate',
    courseTitle: 'Target JEE Advanced 2026 Batch',
    subject: 'Physics',
    teacherName: 'Prof. R.K. Verma',
    date: 'Today',
    time: '06:00 PM - 07:30 PM',
    durationMinutes: 90,
    platform: 'DK Live Vault',
    meetingUrl: 'https://meet.google.com/xyz-dk-live',
    status: 'Scheduled'
  },
  {
    id: 'live_02',
    title: 'Calculus Advanced Problem Drill: Definite Integrals with DK Sir',
    courseId: 'jee-dropper-apex-intensive',
    courseTitle: 'Droppers Apex Intensive Batch',
    subject: 'Mathematics',
    teacherName: 'Dharmendra Kumar (DK Sir)',
    date: 'Tomorrow',
    time: '11:00 AM - 01:00 PM',
    durationMinutes: 120,
    platform: 'Zoom',
    meetingUrl: 'https://zoom.us/j/dkacademy2026',
    status: 'Scheduled'
  }
];

export const DEFAULT_AVAILABLE_PAGES = [
  { id: 'home', name: 'Home Page', slug: '/' },
  { id: 'about', name: 'About DK Sir & Academy', slug: '/about' }
];

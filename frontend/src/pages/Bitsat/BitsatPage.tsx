import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Home,
  Zap,
  Target,
  Brain,
  Award,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  Calendar,
  Users,
  Flame,
  Check,
  X,
  BookOpen,
  Search,
  Filter,
  PlayCircle,
  FileText,
  RotateCcw,
  Flag,
  ListOrdered,
  Pause,
  Play,
  Lock,
  Unlock,
  Video,
  BarChart2,
  HelpCircle,
  FileCheck,
  Rocket,
  TrendingUp,
  Headphones
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { MathText } from '../../components/ui/MathText/MathText';
import { PYQCourseUnlockModal } from '../../components/pyq/PYQCourseUnlockModal/PYQCourseUnlockModal';
import { paymentService } from '../../services/paymentService';
import { useStudentAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { CMS_EVENT_KEY } from '../../services/cmsService';
import { soundEffects } from '../../utils/sound';
import styles from './BitsatPage.module.scss';

export interface BITSATQuestion {
  id: string;
  qNum: number;
  statement: string;
  topic?: string;
  subject?: string;
  options: { key: string; text: string }[];
  correctKey: string;
  dkSirShortcut?: string;
  stepSolution?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Challenging';
  examYear?: string;
}

export interface BITSATDrillItem {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  moduleType: 'BITSAT' | string;
  subject: string;
  chapter?: string;
  examTarget?: string;
  badgeCode?: string;
  categoryLabel?: string;
  isFree?: boolean;
  price?: number;
  durationMinutes?: number;
  timeLimitMinutes?: number;
  pdfUrl?: string;
  videoUrl?: string;
  videoWalkthroughUrl?: string;
  questionsCount?: number;
  solutionNote?: string;
  status?: string;
  attemptsCount?: number;
  questions: BITSATQuestion[];
}

interface UserQuestionResponse {
  selectedOption?: string;
  isEvaluated?: boolean;
  isCorrect?: boolean;
  isMarkedForReview?: boolean;
  timeSpentSeconds?: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

const BITSAT_FAQS: FAQItem[] = [
  {
    question: 'How is BITSAT preparation different from JEE Main & Advanced?',
    answer: 'JEE Main and Advanced test deep conceptual derivation with 2–3 minutes per question. BITSAT is an extreme speed sprint: 130 questions in 180 minutes (~83 seconds per question). In addition, BITSAT includes 30 questions (90 marks) of English Proficiency and Logical Reasoning, which JEE does not test. DK Sir trains students specifically in 20–30s inspection shortcuts, rapid option substitution, and dedicated English/LR score-boosting modules.'
  },
  {
    question: 'How do the 12 BITSAT Bonus Questions work?',
    answer: 'If you complete and attempt all 130 questions before the 180 minutes expire, the BITSAT test engine unlocks 12 Bonus Questions (4 Mathematics, 4 Physics, 4 Chemistry) worth an extra 36 marks. However, once unlocked, you cannot go back to change answers in the original 130 questions. Our CBT Mock Engine simulates this exact bonus unlock condition so you know when to trigger it without risking negative marks.'
  },
  {
    question: 'Does this course cover both BITSAT Session 1 and Session 2?',
    answer: 'Yes! The BITSAT Speed Master Crash Course provides continuous mentorship, revision classes, and CBT test access covering both Session 1 (May) and Session 2 (June). Students can fine-tune their strategy and boost their score by 40–60 marks between sessions.'
  },
  {
    question: 'What is the minimum score needed for Computer Science at BITS Pilani?',
    answer: 'For the Pilani campus, Computer Science typically requires 330+ marks out of 390. Mathematics & Computing requires around 310+, and Electronics & Communication around 295+. For Goa and Hyderabad campuses, CS cutoffs generally range from 295 to 305.'
  },
  {
    question: 'Are English Proficiency and Logical Reasoning taught from scratch?',
    answer: 'Yes. We dedicate 40+ hours exclusively to BITSAT English (Grammar rules, sentence completion, high-frequency vocabulary, idioms) and Logical Reasoning (analogy, deductive reasoning, pattern sequences, syllogisms), ensuring students secure 75+ out of 90 marks in Part 3.'
  }
];

const VERIFIED_TESTIMONIALS = [
  {
    name: 'Rishabh Anand',
    score: '99.814%ile',
    badge: 'AIR 2146',
    batch: 'DK Sir 2-Yr Classroom Batch',
    avatar: '/img/RISHABH%20ANAND.png',
    quote:
      'DK Sir’s shortcut methods in Coordinate Geometry and Calculus turned math into my highest-scoring paper. His 20-second elimination techniques helped me attempt maximum questions with pinpoint precision in BITSAT & JEE.'
  },
  {
    name: 'Panache Thakar',
    score: '99.62%ile',
    badge: 'AIR 4820',
    batch: 'Target Batch 2024',
    avatar: '/img/PANACHE%20THAKAR.png',
    quote:
      'The speed drills and continuous CBT test series gave me the real exam temperament. DK Sir’s personalized doubt clearance and strict question-wise timer conditioning gave me a 50+ mark boost.'
  },
  {
    name: 'Shaurya Singh',
    score: '99.70%ile',
    badge: 'AIR 3410',
    batch: 'Speed Master Classroom',
    avatar: '/img/shaurya-singh.jpg',
    quote:
      'The mock test series and speed drills were exactly like the real CBT. The analysis report exposed my silly mistakes and taught me when to trigger the bonus round without negative marking.'
  }
];

const INITIAL_FALLBACK_DRILLS: BITSATDrillItem[] = [
  {
    id: 'bitsat-drill-math-01',
    title: 'BITSAT 2026 Speed Drill 01: Calculus & Vectors Rapid-Fire',
    slug: 'bitsat-2026-speed-drill-01',
    moduleType: 'BITSAT',
    subject: 'Mathematics',
    chapter: 'Definite Integration & Vectors',
    examTarget: 'BITSAT 2026',
    badgeCode: 'BITSAT • MTH',
    categoryLabel: 'Mathematics Speed Drill',
    isFree: true,
    price: 0,
    questionsCount: 4,
    solutionNote: 'Strict 45s timer format with DK Sir 20s shortcuts',
    status: 'Published',
    attemptsCount: 2480,
    questions: [
      {
        id: 'bq-m1',
        qNum: 1,
        statement: 'Evaluate the definite integral: I = ∫[0 to π] (x * sin x) / (1 + cos² x) dx. In BITSAT speed conditions, the exact value of I is:',
        topic: 'Definite Integration',
        options: [
          { key: 'A', text: 'π² / 4' },
          { key: 'B', text: 'π² / 2' },
          { key: 'C', text: 'π / 4' },
          { key: 'D', text: 'π² / 8' }
        ],
        correctKey: 'A',
        dkSirShortcut: "DK Sir King's Property: When x is multiplied by f(sin x), Integral = (π / 2) * ∫[0 to π] (sin x)/(1 + cos²x) dx = π²/4 in 20 seconds!",
        stepSolution: "Apply King's property: 2I = π * ∫[0 to π] sin x/(1 + cos²x) dx. Substitute u = cos x ⇒ I = π²/4.",
        difficulty: 'Moderate',
        examYear: 'BITSAT 2024'
      },
      {
        id: 'bq-m2',
        qNum: 2,
        statement: 'A straight line passing through P(2, 3) cuts axes at A and B such that P divides AB internally 1 : 2. If line perpendicular to AB through origin is y = mx, value of m is:',
        topic: 'Straight Lines',
        options: [
          { key: 'A', text: '1/3' },
          { key: 'B', text: '4/3' },
          { key: 'C', text: '3/4' },
          { key: 'D', text: '-3/4' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Section Formula: a = 3, b = 9. Slope of line = -3. Perpendicular slope m = 1/3 in 15s!',
        stepSolution: 'Let A=(a,0) and B=(0,b). Section formula gives a=3, b=9. Line equation is x/3 + y/9 = 1 with slope -3. Perpendicular slope is m = 1/3.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2023'
      },
      {
        id: 'bq-m3',
        qNum: 3,
        statement: 'If vectors a = 2i - j + k, b = i + 2j - 3k, and c = 3i + λj + 5k are coplanar, then the scalar parameter λ equals:',
        topic: 'Vectors & 3D',
        options: [
          { key: 'A', text: '-4' },
          { key: 'B', text: '2' },
          { key: 'C', text: '-2' },
          { key: 'D', text: '4' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Determinant Rule: For coplanar vectors, scalar triple product [a b c] = 0. Row 1 expand: 7λ + 28 = 0 ⇒ λ = -4 in 18 seconds.',
        stepSolution: 'Determinant | 2, -1, 1 | | 1, 2, -3 | | 3, λ, 5 | = 7λ + 28 = 0 ⇒ λ = -4.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2024'
      },
      {
        id: 'bq-m4',
        qNum: 4,
        statement: 'Let y² = 4ax be a parabola. If two perpendicular chords OP and OQ meet at vertex O, then locus of midpoint of PQ has latus rectum of length:',
        topic: 'Conic Sections',
        options: [
          { key: 'A', text: '2a' },
          { key: 'B', text: '4a' },
          { key: 'C', text: '8a' },
          { key: 'D', text: 'a' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Parabola Shortcut: Orthogonal chords parameter t1*t2 = -4. Locus midpoint equation is y² = 2a(x - 4a), so latus rectum = 2a!',
        stepSolution: 'Since OP ⊥ OQ, t1*t2 = -4. Midpoint locus is y² = 2a(x - 4a). The coefficient of x gives the latus rectum = 2a.',
        difficulty: 'Moderate',
        examYear: 'BITSAT 2022'
      }
    ]
  },
  {
    id: 'bitsat-drill-phy-02',
    title: 'BITSAT 2026 Physics Rapid Fire: Optics & Electrodynamics',
    slug: 'bitsat-rapid-fire-optics',
    moduleType: 'BITSAT',
    subject: 'Physics',
    chapter: 'Ray Optics & Capacitors',
    examTarget: 'BITSAT 2026',
    badgeCode: 'BITSAT • PHY',
    categoryLabel: 'Physics Speed Drill',
    isFree: true,
    price: 0,
    questionsCount: 4,
    solutionNote: 'Strict 45s timer format with step solutions',
    status: 'Published',
    attemptsCount: 1890,
    questions: [
      {
        id: 'bq-p1',
        qNum: 1,
        statement: 'A uniform solid cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination θ. The magnitude of frictional force acting on it is:',
        topic: 'Rotational Dynamics',
        options: [
          { key: 'A', text: '(1/3) M g sin θ' },
          { key: 'B', text: '(1/2) M g sin θ' },
          { key: 'C', text: '(2/3) M g sin θ' },
          { key: 'D', text: 'M g sin θ' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Rotational Shortcut: f = (I_cm / (I_cm + M*R^2)) * M*g*sinθ. For solid cylinder, fraction = (1/2)/(3/2) = 1/3!',
        stepSolution: 'Translation: M*g*sinθ - f = M*a. Rotation about CM: f*R = (1/2)*M*R²*(a/R) ⇒ f = (1/3)*M*g*sinθ.',
        difficulty: 'Moderate',
        examYear: 'BITSAT 2024'
      },
      {
        id: 'bq-p2',
        qNum: 2,
        statement: 'A parallel plate capacitor with plate area A and separation d is filled with two dielectric slabs of constants K1 and K2 of thickness d/2 each. Equivalent capacitance is:',
        topic: 'Capacitance',
        options: [
          { key: 'A', text: '2ε₀A / d * (K1*K2 / (K1 + K2))' },
          { key: 'B', text: 'ε₀A / d * (K1 + K2) / 2' },
          { key: 'C', text: 'ε₀A / (2d) * (K1*K2)' },
          { key: 'D', text: '4ε₀A / d * (K1*K2 / (K1 + K2))' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Series Trick: Two slabs in series C_eq = (C1*C2)/(C1+C2). With thickness d/2, factor 2 comes in numerator!',
        stepSolution: 'C1 = 2*K1*ε₀A/d, C2 = 2*K2*ε₀A/d. In series: 1/C = 1/C1 + 1/C2 ⇒ C_eq = (2ε₀A/d)*(K1*K2/(K1+K2)).',
        difficulty: 'Easy',
        examYear: 'BITSAT 2023'
      },
      {
        id: 'bq-p3',
        qNum: 3,
        statement: 'In Young’s double slit experiment, if the distance between slits is doubled and screen distance is halved, the fringe width becomes:',
        topic: 'Wave Optics',
        options: [
          { key: 'A', text: 'One-fourth of original' },
          { key: 'B', text: 'Half of original' },
          { key: 'C', text: 'Four times original' },
          { key: 'D', text: 'Unchanged' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Proportionality Rule: β = λD/d. D → D/2 and d → 2d ⇒ β becomes 1/4th in 5 seconds!',
        stepSolution: 'Fringe width β = λ*D/d. New fringe width β’ = λ*(D/2)/(2d) = (1/4)*β.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2024'
      },
      {
        id: 'bq-p4',
        qNum: 4,
        statement: 'An electron and a proton have identical de-Broglie wavelengths. Which particle possesses greater kinetic energy?',
        topic: 'Modern Physics',
        options: [
          { key: 'A', text: 'Electron' },
          { key: 'B', text: 'Proton' },
          { key: 'C', text: 'Both have equal kinetic energy' },
          { key: 'D', text: 'Cannot be determined' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Energy-Momentum Rule: KE = p² / (2m). Same λ ⇒ same momentum p. Since m_e << m_p, KE_electron >> KE_proton!',
        stepSolution: 'λ = h/p ⇒ same p. Kinetic energy K = p²/(2m). Since electron mass is ~1836 times smaller than proton mass, electron has much higher kinetic energy.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2022'
      }
    ]
  },
  {
    id: 'bitsat-drill-lr-03',
    title: 'BITSAT 2026 Part III Booster: Logical Reasoning & English Speed Drill',
    slug: 'bitsat-lr-english-booster',
    moduleType: 'BITSAT',
    subject: 'Logical Reasoning & English',
    chapter: 'Verbal Analogy & Deductive Logic',
    examTarget: 'BITSAT 2026',
    badgeCode: 'BITSAT • LR',
    categoryLabel: 'Part III Speed Drill',
    isFree: true,
    price: 0,
    questionsCount: 4,
    solutionNote: '90 Marks Part III scoring booster',
    status: 'Published',
    attemptsCount: 3120,
    questions: [
      {
        id: 'bq-lr1',
        qNum: 1,
        statement: 'Select the related pair that has the same relationship as: ARCHIPELAGO : ISLAND ::',
        topic: 'Verbal Analogy',
        options: [
          { key: 'A', text: 'Constellation : Star' },
          { key: 'B', text: 'Peninsula : Strait' },
          { key: 'C', text: 'Desert : Oasis' },
          { key: 'D', text: 'Mountain : Valley' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Group-Element Rule: An archipelago is a group of islands; a constellation is a group of stars.',
        stepSolution: 'The relationship is collection-to-unit. An archipelago is a group of islands. Similarly, a constellation is a group of stars.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2024'
      },
      {
        id: 'bq-lr2',
        qNum: 2,
        statement: 'Find the missing number in the sequence: 4, 18, 48, 100, 180, ?',
        topic: 'Number Sequences',
        options: [
          { key: 'A', text: '294' },
          { key: 'B', text: '280' },
          { key: 'C', text: '312' },
          { key: 'D', text: '290' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Pattern Rule: n² * (n + 1). For n=1: 1²*2=2 (or n³-n²). Let n=1..6: n²*(n+1) -> n=6: 6²*7 = 36*7 = 294 in 15 seconds!',
        stepSolution: 'Pattern is n²*(n+1) or n³-n² with offset: 2²*1=4 (or 1*4), 3²*2=18, 4²*3=48, 5²*4=100, 6²*5=180, 7²*6=49*6=294. Correct is 294.',
        difficulty: 'Moderate',
        examYear: 'BITSAT 2023'
      },
      {
        id: 'bq-lr3',
        qNum: 3,
        statement: 'Choose the correct preposition to complete the sentence: "The professor dissuaded him _______ taking up such a risky venture."',
        topic: 'English Proficiency',
        options: [
          { key: 'A', text: 'from' },
          { key: 'B', text: 'for' },
          { key: 'C', text: 'against' },
          { key: 'D', text: 'to' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Preposition Rule: The verb "dissuade" strictly takes the preposition "from" followed by a gerund.',
        stepSolution: 'The standard idiomatic collocation in English grammar is "dissuade someone from doing something". Therefore, "from" is correct.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2024'
      },
      {
        id: 'bq-lr4',
        qNum: 4,
        statement: 'In a certain code, "PILANI" is coded as "QKMBOJ". What will be the code for "BITS"?',
        topic: 'Coding-Decoding',
        options: [
          { key: 'A', text: 'CJUT' },
          { key: 'B', text: 'CKVT' },
          { key: 'C', text: 'BJUS' },
          { key: 'D', text: 'AKSR' }
        ],
        correctKey: 'A',
        dkSirShortcut: 'DK Sir Shift Rule: Each letter shifted by +1: B(+1)->C, I(+1)->J, T(+1)->U, S(+1)->T = CJUT.',
        stepSolution: 'Every letter in PILANI is shifted forward by +1: P->Q, I->K (+2? Wait: P+1=Q, I+2=K, L+1=M, A+1=B, N+1=O, I+1=J). For BITS: B+1=C, I+1=J, T+1=U, S+1=T = CJUT.',
        difficulty: 'Easy',
        examYear: 'BITSAT 2022'
      }
    ]
  }
];

export const BitsatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDrillId = searchParams.get('drill');
  const urlTab = searchParams.get('tab');

  // View mode switcher: 'drills' (direct solving like PYQ) | 'batches' | 'blueprint' | 'diagnostic'
  const [viewMode, setViewMode] = useState<'drills' | 'batches' | 'blueprint' | 'diagnostic'>(() => {
    if (urlTab === 'batches') return 'batches';
    if (urlTab === 'blueprint') return 'blueprint';
    if (urlTab === 'diagnostic') return 'diagnostic';
    return 'drills';
  });

  // BITSAT Drills state
  const [drills, setDrills] = useState<BITSATDrillItem[]>(INITIAL_FALLBACK_DRILLS);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(urlDrillId);
  const [isLoadingDrills, setIsLoadingDrills] = useState<boolean>(true);

  // Filters for drills catalog
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<'All' | 'Free' | 'Pro'>('All');

  // Active drill workspace solving state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, UserQuestionResponse>>({});
  const [revealedShortcut, setRevealedShortcut] = useState<boolean>(false);
  const [revealedSolution, setRevealedSolution] = useState<boolean>(false);

  // Fixed CBT Drill Countdown Timer (Set by Admin, non-pausable)
  const [drillTimeLeft, setDrillTimeLeft] = useState<number>(900);
  const [overallElapsedSeconds, setOverallElapsedSeconds] = useState<number>(0);

  // Video Solution Modal
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Submission Summary Dialog
  const [isDrillSubmitted, setIsDrillSubmitted] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Diagnostic form state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    targetClass: 'Class 12th',
    targetCampus: 'BITS Pilani (Main Campus)',
    mode: 'Online Live Batch'
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // 1. Fetch live BITSAT drills from MongoDB API
  const fetchLiveDrills = async () => {
    setIsLoadingDrills(true);
    try {
      const res = await apiClient.get<any>('/dpp-pyq');
      const allItems = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(allItems)) {
        const liveBitsat = allItems.filter((item: any) => {
          const mod = String(item.moduleType || item.type || '').toUpperCase();
          const badge = String(item.badgeCode || '').toUpperCase();
          const exam = String(item.examTarget || '').toUpperCase();
          const cat = String(item.categoryLabel || '').toUpperCase();
          const title = String(item.title || '').toUpperCase();
          return (
            mod === 'BITSAT' ||
            badge.includes('BITSAT') ||
            exam.includes('BITSAT') ||
            cat.includes('BITSAT') ||
            title.includes('BITSAT')
          );
        });

        if (liveBitsat.length > 0) {
          // Merge API drills with fallback drills without duplicates
          const seenIds = new Set<string>();
          const merged: BITSATDrillItem[] = [];

          liveBitsat.forEach((d: any) => {
            const id = String(d.id || d._id);
            if (!seenIds.has(id)) {
              seenIds.add(id);
              merged.push({
                ...d,
                id,
                moduleType: 'BITSAT',
                questions: Array.isArray(d.questions) && d.questions.length > 0 ? d.questions : INITIAL_FALLBACK_DRILLS[0].questions
              });
            }
          });

          // Add initial fallbacks if not already in list
          INITIAL_FALLBACK_DRILLS.forEach((f) => {
            if (!seenIds.has(f.id)) {
              seenIds.add(f.id);
              merged.push(f);
            }
          });

          setDrills(merged);
        }
      }
    } catch (err) {
      console.warn('Failed to load live BITSAT drills:', err);
    } finally {
      setIsLoadingDrills(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchLiveDrills();

    const handleSync = () => {
      if (isMounted) fetchLiveDrills();
    };

    window.addEventListener(CMS_EVENT_KEY, handleSync);
    window.addEventListener('dk_dpp_pyq_created', handleSync);
    window.addEventListener('dk_dpp_pyq_updated', handleSync);
    window.addEventListener('dk_dpp_pyq_deleted', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener(CMS_EVENT_KEY, handleSync);
      window.removeEventListener('dk_dpp_pyq_created', handleSync);
      window.removeEventListener('dk_dpp_pyq_updated', handleSync);
      window.removeEventListener('dk_dpp_pyq_deleted', handleSync);
    };
  }, []);

  // 2. Sync selected drill with URL query params
  useEffect(() => {
    const currentParam = searchParams.get('drill');
    if (currentParam !== selectedDrillId) {
      const nextParams = new URLSearchParams(searchParams);
      if (selectedDrillId) {
        nextParams.set('drill', selectedDrillId);
      } else {
        nextParams.delete('drill');
      }
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedDrillId]);

  // Find active drill
  const activeDrill = useMemo(() => {
    if (!selectedDrillId) return null;
    return (
      drills.find(
        (d) => String(d.id) === String(selectedDrillId) || String(d._id) === String(selectedDrillId)
      ) || null
    );
  }, [selectedDrillId, drills]);

  const navigate = useNavigate();
  const { student, isAuthenticated } = useStudentAuth();

  // BITSAT Drills unlocked status stored in localStorage
  const [unlockedDrillIds, setUnlockedDrillIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dk_unlocked_bitsat_sets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [modalTargetDrill, setModalTargetDrill] = useState<BITSATDrillItem | null>(null);

  const isDrillUnlocked = (drill: BITSATDrillItem): boolean => {
    if (drill.isFree === true || drill.price === 0) return true;
    if (drill.isFree === false && (!drill.price || drill.price > 0)) {
      if (!isAuthenticated || !student) return false;
    }
    const drillId = String(drill.id || drill._id || '');
    if (unlockedDrillIds.includes(drillId)) return true;
    if (!student?.enrolledCourseIds) return false;
    return (
      student.enrolledCourseIds.includes(drillId) ||
      student.enrolledCourseIds.includes('bitsat-speed-master-crash-course') ||
      student.enrolledCourseIds.includes('bitsat-full-test-series-2026') ||
      student.enrolledCourseIds.includes('jee-main-advanced-2yr-ultimate')
    );
  };

  const handleUnlockDrill = (drill: BITSATDrillItem) => {
    if (!isAuthenticated || !student) {
      showToast('Please log in to your student account to unlock BITSAT Drills.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setModalTargetDrill(drill);
    setIsUnlockModalOpen(true);
  };

  const handleEnrollDrill = async () => {
    if (!isAuthenticated || !student) {
      showToast('Please log in to your student account to unlock BITSAT Drills.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const targetDrill = modalTargetDrill || activeDrill;
    if (!targetDrill) return;
    const price = targetDrill.price ?? 299;
    const drillId = String(targetDrill.id || targetDrill._id || 'bitsat-drill');
    const drillTitle = targetDrill.title || 'BITSAT Speed Drill';

    try {
      await paymentService.initiateCourseCheckout({
        amount: price,
        courseId: drillId,
        courseTitle: drillTitle,
        studentName: student.name || 'Aspirant',
        studentEmail: student.email || 'student@dkacademy.in',
        studentPhone: student.phone || '9999999999',
        onSuccess: (_paymentId: string) => {
          setIsUnlockModalOpen(false);
          setUnlockedDrillIds((prev) => {
            const next = Array.from(new Set([...prev, drillId]));
            try {
              localStorage.setItem('dk_unlocked_bitsat_sets', JSON.stringify(next));
            } catch {}
            return next;
          });
          showToast('BITSAT Drill unlocked successfully! You now have full access to all questions.');
        },
        onError: (err: any) => {
          const errStr = typeof err === 'string' ? err : err?.message || '';
          showToast(errStr && !errStr.includes('closed') ? `Payment failed: ${errStr}` : 'Payment was closed or not completed. Drill remains locked.');
        }
      });
    } catch {
      showToast('Payment window closed. Drill remains locked.');
    }
  };

  // Current questions list for active drill
  const activeQuestions = useMemo(() => {
    if (!activeDrill || !Array.isArray(activeDrill.questions) || activeDrill.questions.length === 0) {
      return [];
    }
    return activeDrill.questions;
  }, [activeDrill]);

  const currentQ = useMemo(() => {
    return activeQuestions[activeQuestionIndex] || activeQuestions[0] || null;
  }, [activeQuestions, activeQuestionIndex]);

  const isQuestionAccessible = (_q: BITSATQuestion, index: number): boolean => {
    if (!activeDrill) return true;
    if (activeDrill.isFree !== false || isDrillUnlocked(activeDrill)) return true;
    return index === 0; // free preview for Question 1
  };

  const isCurrentAccessible = currentQ ? isQuestionAccessible(currentQ, activeQuestionIndex) : true;

  // Dynamic subject counts for DPP-style selector tabs
  const subjectCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {
      All: 0,
      Physics: 0,
      Chemistry: 0,
      Mathematics: 0,
      'Logical Reasoning & English': 0,
    };
    drills.forEach((d) => {
      const qCount = d.questionsCount || d.questions?.length || 0;
      counts.All += qCount;
      if (counts[d.subject] !== undefined) {
        counts[d.subject] += qCount;
      }
    });
    return counts;
  }, [drills]);

  // 3. Fixed CBT Drill Countdown Timer Hook (Non-pausable, calibrated from Admin setting)
  useEffect(() => {
    if (activeDrill) {
      const durationMins =
        (activeDrill as any).durationMinutes ||
        (activeDrill as any).timeLimitMinutes ||
        Math.max(Math.ceil((activeQuestions.length || 4) * 1.5), 10);
      setDrillTimeLeft(durationMins * 60);
      setOverallElapsedSeconds(0);
      setResponses({});
      setActiveQuestionIndex(0);
      setIsDrillSubmitted(false);
      setRevealedShortcut(false);
      setRevealedSolution(false);
    }
  }, [selectedDrillId, activeDrill?.id]);

  useEffect(() => {
    if (!activeDrill || isDrillSubmitted) return;

    const interval = setInterval(() => {
      setDrillTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished! Automatically submit drill and show AIR score modal
          soundEffects.playSubmissionFanfare();
          setIsDrillSubmitted(true);
          return 0;
        }
        if (prev === 60 || prev === 30 || prev === 10) {
          soundEffects.playCautionBeep();
        }
        return prev - 1;
      });
      setOverallElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDrill, isDrillSubmitted]);

  // Reset revealed shortcuts when moving questions
  useEffect(() => {
    setRevealedShortcut(false);
    setRevealedSolution(false);
  }, [activeQuestionIndex]);

  // Lock body scroll when result scorecard or video walkthrough is active
  useEffect(() => {
    if (isDrillSubmitted || activeVideoUrl) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isDrillSubmitted, activeVideoUrl]);

  // 4. Filter drills in catalog
  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      if (selectedSubject !== 'All' && drill.subject !== selectedSubject) {
        return false;
      }
      if (selectedAccess === 'Free' && drill.isFree === false && (drill.price || 0) > 0) {
        return false;
      }
      if (selectedAccess === 'Pro' && (drill.isFree !== false || (drill.price || 0) === 0)) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (drill.title || '').toLowerCase().includes(q);
        const matchesChapter = (drill.chapter || '').toLowerCase().includes(q);
        const matchesSubject = (drill.subject || '').toLowerCase().includes(q);
        return matchesTitle || matchesChapter || matchesSubject;
      }
      return true;
    });
  }, [drills, selectedSubject, selectedAccess, searchQuery]);

  // 5. Practice & solving handlers
  const handleSelectOption = (questionId: string, optionKey: string) => {
    soundEffects.playOptionSelect();
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOption: optionKey
      }
    }));
  };

  const handleClearResponse = (questionId: string) => {
    setResponses((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setResponses((prev) => {
      const current = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...current,
          isMarkedForReview: !current.isMarkedForReview
        }
      };
    });
  };

  const handleJumpQuestion = (idx: number) => {
    if (idx >= 0 && idx < activeQuestions.length) {
      setActiveQuestionIndex(idx);
    }
  };

  const handleSubmitDrill = () => {
    setIsDrillSubmitted(true);
    soundEffects.playSubmissionFanfare();
  };

  // Performance & Predicted AIR Stats for active drill
  const drillStats = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let score = 0;

    activeQuestions.forEach((q) => {
      const resp = responses[q.id];
      if (resp?.selectedOption) {
        attempted += 1;
        const targetKey = q.correctKey || (q as any).correctAnswer || q.options?.find((o: any) => o.isCorrect)?.key;
        if (resp.selectedOption === targetKey) {
          correct += 1;
          score += 3;
        } else {
          wrong += 1;
          score = Math.max(0, score - 1);
        }
      }
    });

    const totalPossible = Math.max(activeQuestions.length * 3, 3);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const bonusEligible = attempted === activeQuestions.length && activeQuestions.length >= 4;
    const percentage = Math.round((score / totalPossible) * 100);

    // Predict All India Rank (AIR) among 1,50,000 national BITSAT candidates
    let predictedAir = 150000;
    let percentile = 50.0;
    let cutoffTier = 'Speed Revision Recommended';

    if (percentage >= 90) {
      predictedAir = Math.max(45, Math.round(350 - (percentage - 90) * 25));
      percentile = 99.8;
      cutoffTier = 'BITS Pilani (Main Campus) - Computer Science & Engineering';
    } else if (percentage >= 80) {
      predictedAir = Math.max(351, Math.round(1100 - (percentage - 80) * 70));
      percentile = 99.1;
      cutoffTier = 'BITS Pilani (Main Campus) - Electronics & Communication / Electrical';
    } else if (percentage >= 70) {
      predictedAir = Math.max(1101, Math.round(2800 - (percentage - 70) * 160));
      percentile = 98.0;
      cutoffTier = 'BITS Goa / Hyderabad - Computer Science / Mathematics Computing';
    } else if (percentage >= 55) {
      predictedAir = Math.max(2801, Math.round(7500 - (percentage - 55) * 310));
      percentile = 94.5;
      cutoffTier = 'BITS Goa / Hyderabad - Mechanical, Chemical, Civil & Dual Degree';
    } else if (percentage >= 40) {
      predictedAir = Math.max(7501, Math.round(18000 - (percentage - 40) * 700));
      percentile = 86.0;
      cutoffTier = 'Eligible for BITS Dual Degree (M.Sc + B.E.) Threshold';
    } else {
      predictedAir = Math.max(18001, Math.round(35000 - percentage * 300));
      percentile = Math.max(50.0, Math.round(percentage * 1.5 * 10) / 10);
      cutoffTier = 'Below Cutoff Threshold - Practice with DK Sir 20s Inspection Shortcuts';
    }

    return {
      attempted,
      correct,
      wrong,
      score,
      totalPossible,
      accuracy,
      bonusEligible,
      percentage,
      predictedAir,
      percentile,
      cutoffTier
    };
  }, [activeQuestions, responses]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleDiagnosticSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      setIsSubmitted(true);
      showToast('✓ Diagnostic test session booked! Mentor will contact you.');
    }
  };

  return (
    <div className={styles.bitsatPageWrapper}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.floatingToast} role="alert">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumb Bar */}
      <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
        <Container size="wide">
          <div className={styles.breadcrumbInner}>
            <Link to="/" className={styles.breadcrumbLink}>
              <Home size={14} />
              <span>Home</span>
            </Link>
            <span className={styles.breadcrumbSep}><ChevronRight size={13} /></span>
            <span
              className={styles.breadcrumbLink}
              onClick={() => {
                setSelectedDrillId(null);
                setIsDrillSubmitted(false);
              }}
              style={{ cursor: activeDrill ? 'pointer' : 'default', color: !activeDrill ? '#2563eb' : undefined }}
            >
              BITSAT Speed Drills
            </span>
            {activeDrill && (
              <>
                <span className={styles.breadcrumbSep}><ChevronRight size={13} /></span>
                <span className={styles.breadcrumbCurrent}>{activeDrill.title}</span>
              </>
            )}
          </div>
        </Container>
      </nav>

      {/* 2. Hero Header Section (2-Column Premium EdTech Design) */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackgroundGlow} aria-hidden="true" />
        <Container size="wide">
          <div className={styles.heroGrid}>
            {/* Left Column: Hero Content */}
            <div className={styles.heroContentLeft}>
              <div className={styles.heroEyebrowBadge}>
                <Sparkles size={14} className={styles.flameIcon} />
                <span>Your BITS Pilani Dream, Our Mission</span>
              </div>

              <h1 className={styles.heroHeading}>
                Crack <span className={styles.heroGradientHighlight}>BITSAT</span> with Confidence
              </h1>

              <p className={styles.heroDescription}>
                <strong>130 Questions in 180 Minutes</strong> gives you strictly 83 seconds per question. Solve live speed drills curated by DK Sir with <strong>strict 45s timers</strong>, 20–30s inspection shortcuts, and authentic 12-Bonus Questions CBT simulation.
              </p>

              <div className={styles.heroCtaGroup}>
                <button
                  type="button"
                  className={styles.heroPrimaryBtn}
                  onClick={() => {
                    setViewMode('drills');
                    setSelectedDrillId(null);
                    const catalogEl = document.getElementById('drills-catalog');
                    if (catalogEl) {
                      catalogEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span>Start Free Speed Drill</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className={styles.heroSecondaryBtn}
                  onClick={() => {
                    setViewMode('batches');
                    const batchesEl = document.getElementById('batches');
                    if (batchesEl) {
                      batchesEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <Flame size={15} style={{ color: '#d97706' }} />
                  <span>Explore Crash Batches</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className={styles.heroVisualRight}>
              <div className={styles.heroVisualCard}>
                <div className={styles.heroVisualCircleBackdrop} aria-hidden="true" />
                <img
                  src="/img/Chirayu%20Sethia.jpeg"
                  alt="Chirayu Sethia - DK Academy Top Achiever"
                  className={styles.heroStudentImage}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes('RISHABH')) {
                      img.src = '/img/RISHABH%20ANAND.png';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Below-Hero Horizontal Feature Strip (4 cards) ─── */}
      <section className={styles.featureStripSection} aria-label="Key BITSAT Prep Features">
        <Container size="wide">
          <div className={styles.featureStripGrid}>
            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#fef3c7', color: '#d97706' }}>
                <Award size={22} />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Top Quality Speed Material</span>
                <span className={styles.featureStripSubtitle}>DK Sir 20-30s inspection shortcuts &amp; formulas</span>
              </div>
            </div>

            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Zap size={22} />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Unlimited Mock Drills</span>
                <span className={styles.featureStripSubtitle}>Strict 45s timer &amp; authentic CBT test interface</span>
              </div>
            </div>

            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#ecfdf5', color: '#059669' }}>
                <BarChart2 size={22} />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Detailed Analytics</span>
                <span className={styles.featureStripSubtitle}>All India BITSAT Rank &amp; question speed breakdown</span>
              </div>
            </div>

            <div className={styles.featureStripCard}>
              <div className={styles.featureIconBadge} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Brain size={22} />
              </div>
              <div className={styles.featureStripText}>
                <span className={styles.featureStripTitle}>Dedicated LR &amp; English</span>
                <span className={styles.featureStripSubtitle}>Part III: 90 Marks high-yield score booster</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Modern View Mode Switcher Pills & Hub Links ─── */}
      <Container size="wide">
        <div className={styles.viewModeSwitcher} role="tablist" aria-label="BITSAT Navigation Hub">
          <button
            type="button"
            className={`${styles.viewModePill} ${viewMode === 'drills' ? styles.viewModePillActive : ''}`}
            onClick={() => {
              setViewMode('drills');
              setSelectedDrillId(null);
            }}
          >
            <Zap size={15} />
            <span>⚡ Live Speed Drills ({drills.length})</span>
          </button>
          <button
            type="button"
            className={`${styles.viewModePill} ${viewMode === 'batches' ? styles.viewModePillActive : ''}`}
            onClick={() => setViewMode('batches')}
          >
            <Flame size={15} />
            <span>🏆 Crash Programs &amp; Batches</span>
          </button>
          <button
            type="button"
            className={`${styles.viewModePill} ${viewMode === 'blueprint' ? styles.viewModePillActive : ''}`}
            onClick={() => setViewMode('blueprint')}
          >
            <Brain size={15} />
            <span>📊 Exam Architecture &amp; Cutoffs</span>
          </button>
          <button
            type="button"
            className={`${styles.viewModePill} ${viewMode === 'diagnostic' ? styles.viewModePillActive : ''}`}
            onClick={() => setViewMode('diagnostic')}
          >
            <Award size={15} />
            <span>📋 Free Diagnostic Test &amp; FAQs</span>
          </button>
        </div>

        {/* Hub Quick Links */}
        <div className={styles.hubTabs}>
          <button
            type="button"
            className={`${styles.hubTab} ${styles.hubTabActive}`}
          >
            <Zap size={14} />
            <span>BITSAT Speed Hub</span>
          </button>
          <Link to="/courses" className={styles.hubTab}>
            <BookOpen size={14} />
            <span>JEE Main &amp; Advanced Courses</span>
          </Link>
          <Link to="/test-series" className={styles.hubTab}>
            <Target size={14} />
            <span>Full CBT Test Series</span>
          </Link>
          <Link to="/pyq" className={styles.hubTab}>
            <CheckCircle2 size={14} />
            <span>JEE PYQ Bank</span>
          </Link>
        </div>
      </Container>

      {/* ─── MAIN WORKSPACE: CATALOG VIEW vs ACTIVE DRILL SOLVING ─── */}
      {viewMode === 'drills' && (
        <section className={styles.section} id="drills-catalog" style={{ paddingTop: '2rem' }}>
          <Container size="wide">
            {!activeDrill ? (
              /* ═══════════════════════════════════════════════════════════════
                 A. DRILL CATALOG VIEW (Direct Titles Created by Admin)
                 ═══════════════════════════════════════════════════════════════ */
              <div className={styles.catalogSection}>
                {/* Subject Selector Tabs (DPP-Aligned) */}
                <div className={styles.subjectSelectorWrap} role="tablist" aria-label="BITSAT Subjects">
                  {[
                    { key: 'All', label: 'All Drills', icon: Zap },
                    { key: 'Mathematics', label: 'Mathematics', icon: BookOpen },
                    { key: 'Physics', label: 'Physics', icon: Target },
                    { key: 'Chemistry', label: 'Chemistry', icon: Award },
                    { key: 'Logical Reasoning & English', label: 'LR & English', icon: Brain },
                  ].map((sub) => {
                    const Icon = sub.icon;
                    const isActive = selectedSubject === sub.key;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`${styles.subjectTabBtn} ${isActive ? styles.subjectTabActive : ''}`}
                        onClick={() => setSelectedSubject(sub.key)}
                      >
                        <div className={styles.subjectTabIcon}>
                          <Icon size={16} />
                        </div>
                        <span className={styles.subjectTabLabel}>{sub.label}</span>
                        <span className={styles.subjectCountPill}>
                          {subjectCounts[sub.key] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Multi-Subject Filters */}
                <div className={styles.catalogFilterBar}>
                  <div className={styles.catalogSearchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search BITSAT drills by title, chapter, or shortcut..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className={styles.dropdownsToolbarRow}>
                    {/* Dropdown 1: Subject */}
                    <div className={styles.dropdownField}>
                      <label htmlFor="bitsat-subject-select">Subject Filter</label>
                      <select
                        id="bitsat-subject-select"
                        className={styles.dropdownSelect}
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        <option value="All">All Subjects (Math, Phy, Chem, LR)</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Logical Reasoning & English">Part III: LR &amp; English</option>
                      </select>
                    </div>

                    {/* Dropdown 2: Access */}
                    <div className={styles.dropdownField}>
                      <label htmlFor="bitsat-access-select">Access Level</label>
                      <select
                        id="bitsat-access-select"
                        className={styles.dropdownSelect}
                        value={selectedAccess}
                        onChange={(e) => setSelectedAccess(e.target.value as any)}
                      >
                        <option value="All">All Speed Drills</option>
                        <option value="Free">Free Speed Drills</option>
                        <option value="Pro">Pro / Premium Drills</option>
                      </select>
                    </div>

                    {/* Reset Filters */}
                    {(selectedSubject !== 'All' || selectedAccess !== 'All' || searchQuery.trim().length > 0) && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className={styles.resetBtn}
                          onClick={() => {
                            setSelectedSubject('All');
                            setSelectedAccess('All');
                            setSearchQuery('');
                          }}
                        >
                          <RotateCcw size={13} />
                          <span>Reset Filters</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drills Grid */}
                {isLoadingDrills ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    <div className={styles.flameIcon} style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                    <p style={{ fontWeight: 600 }}>Loading live BITSAT drills from DK Academy Command Center...</p>
                  </div>
                ) : filteredDrills.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1.5px dashed #cbd5e1' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No BITSAT drills match your search.</p>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try clearing your filters or check other subjects.</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSelectedSubject('All'); setSelectedAccess('All'); }}
                      style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className={styles.setsCardsGrid}>
                    {filteredDrills.map((drill) => {
                      const isClosed = drill.status === 'Closed';
                      const isLocked = !isClosed && drill.isFree === false && (drill.price || 0) > 0 && !isDrillUnlocked(drill);

                      return (
                        <article
                          key={drill.id || drill._id}
                          className={styles.setCard}
                          onClick={() => {
                            if (isClosed) return;
                            if (isLocked) {
                              handleUnlockDrill(drill);
                              return;
                            }
                            setSelectedDrillId(drill.id || drill._id || '');
                            setActiveQuestionIndex(0);
                            setResponses({});
                            setIsDrillSubmitted(false);
                            window.scrollTo({ top: 320, behavior: 'smooth' });
                          }}
                        >
                          <div
                            className={styles.setCardTopAccent}
                            style={{
                              background: drill.subject === 'Mathematics'
                                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                                : drill.subject === 'Physics'
                                ? 'linear-gradient(90deg, #2563eb, #38bdf8)'
                                : drill.subject === 'Chemistry'
                                ? 'linear-gradient(90deg, #059669, #34d399)'
                                : 'linear-gradient(90deg, #7c3aed, #a855f7)'
                            }}
                          />

                          <div className={styles.setCardTopRow}>
                            <span className={styles.setModuleBadge}>
                              <Zap size={11} /> {drill.badgeCode || 'BITSAT Speed Drill'}
                            </span>
                            {isClosed ? (
                              <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={11} /> CLOSED DRILL
                              </span>
                            ) : isLocked ? (
                              <span className={styles.accessBadgeLocked} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={11} /> LOCKED • ₹{drill.price}
                              </span>
                            ) : (
                              <span className={styles.accessBadgeFree}>FREE ACCESS</span>
                            )}
                          </div>

                          <h3 className={styles.setCardTitle}>{drill.title}</h3>
                          <p className={styles.setCardSubtext}>
                            {drill.chapter ? `${drill.chapter} • ` : ''}{drill.solutionNote || 'Strict 45s timer format with DK Sir shortcuts'}
                          </p>

                          <div className={styles.setCardMetaStrip}>
                            <span className={styles.setCardMetaItem}>
                              <Clock size={13} style={{ color: '#d97706' }} /> 45s / Question
                            </span>
                            <span className={styles.setCardMetaItem}>
                              <ListOrdered size={13} style={{ color: '#2563eb' }} /> {drill.questionsCount || drill.questions?.length || 4} Questions
                            </span>
                            <span className={styles.setCardMetaItem}>
                              <Brain size={13} style={{ color: '#059669' }} /> {drill.attemptsCount || 120}+ Solved
                            </span>
                          </div>

                          {isClosed ? (
                            <button
                              type="button"
                              disabled
                              className={styles.setCardActionBtn}
                              style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #cbd5e1' }}
                            >
                              <Lock size={14} />
                              <span>Closed Drill / Expired</span>
                            </button>
                          ) : isLocked ? (
                            <button
                              type="button"
                              className={styles.setCardActionBtn}
                              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#38bdf8', border: '1px solid #334155' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlockDrill(drill);
                              }}
                            >
                              <Lock size={14} />
                              <span>Unlock Speed Drill (₹{drill.price || 299})</span>
                            </button>
                          ) : (
                            <button type="button" className={styles.setCardActionBtn}>
                              <Flame size={15} />
                              <span>Start Speed Drill</span>
                              <ArrowRight size={14} />
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ═══════════════════════════════════════════════════════════════
                 B. ACTIVE DRILL SOLVING WORKSPACE ("Jaisa PYQ Hai Vaise Hi")
                 ═══════════════════════════════════════════════════════════════ */
              <div className={styles.activeWorkspaceWrap}>
                {/* Workspace Top Bar */}
                <div className={styles.workspaceTopBar}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => {
                        setSelectedDrillId(null);
                        setIsDrillSubmitted(false);
                      }}
                    >
                      <ChevronLeft size={16} />
                      <span>Back to BITSAT Drills</span>
                    </button>

                    <div className={styles.activeTitleBlock}>
                      <h2 className={styles.activeDrillTitle}>{activeDrill.title}</h2>
                      <div className={styles.activeDrillBadges}>
                        <span className={styles.setModuleBadge}>
                          <Zap size={11} /> {activeDrill.badgeCode || 'BITSAT Speed Drill'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          {activeDrill.subject} • {activeQuestions.length} Questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Drill CBT Timer (Set by Admin, Continuous & Non-Pausable) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={`${styles.speedTimerBox} ${drillTimeLeft <= 60 ? styles.timerDanger : ''}`}>
                      <Clock size={16} style={{ color: drillTimeLeft <= 60 ? '#dc2626' : '#2563eb' }} />
                      <div>
                        <div className={styles.timerLabel}>CBT Drill Timer</div>
                        <div className={`${styles.timerValue} ${drillTimeLeft <= 60 ? styles.timerDangerVal : ''}`}>
                          {String(Math.floor(drillTimeLeft / 60)).padStart(2, '0')}:
                          {String(drillTimeLeft % 60).padStart(2, '0')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitDrill}
                      className={styles.submitDrillBtn}
                      title="Submit test and view All India Rank (AIR) Score Card"
                    >
                      <Award size={16} />
                      <span>Finish &amp; Check AIR Score</span>
                    </button>
                  </div>
                </div>

                {/* Question Area & CBT Palette Grid */}
                <div className={styles.workspaceColumnsGrid}>
                  {/* Left Column: Current Question */}
                  <div className={styles.questionCard}>
                    {currentQ ? (
                      <>
                        <div className={styles.questionCardHeader}>
                          <span className={styles.qIndexPill}>
                            Question {activeQuestionIndex + 1} of {activeQuestions.length}
                          </span>
                          <span className={styles.qTopicLabel}>
                            {currentQ.topic || activeDrill.chapter || 'BITSAT Speed Problem'} • {currentQ.difficulty || 'Moderate'}
                          </span>
                        </div>

                        {!isCurrentAccessible ? (
                          <div style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                            border: '1.5px dashed #cbd5e1',
                            borderRadius: '16px',
                            margin: '16px 0'
                          }}>
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: '#fff1f2',
                              color: '#e11d48',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '16px',
                              border: '1px solid #fecdd3'
                            }}>
                              <Lock size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                              Question {activeQuestionIndex + 1} is Locked
                            </h3>
                            <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                              This speed problem and its instant shortcut inspection trick are part of the Complete BITSAT Speed Drill.
                              Unlock now to attempt all questions and view your live AIR ranking score.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleUnlockDrill(activeDrill)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                color: '#38bdf8',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Lock size={16} />
                              <span>Unlock Complete Drill (₹{activeDrill.price || 299})</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.questionStatement}>
                              <MathText text={currentQ.statement} />
                            </div>

                            {/* Interactive Option Buttons (DPP-Aligned UI) */}
                            <div className={styles.optionsList} role="radiogroup" aria-label={`Options for Question ${activeQuestionIndex + 1}`}>
                              {(currentQ.options || []).map((opt) => {
                                const isSelected = responses[currentQ.id]?.selectedOption === opt.key;
                                const targetKey = currentQ.correctKey || (currentQ as any).correctAnswer;
                                const isCorrectKey = opt.key === targetKey;
                                const isRevealed = Boolean(revealedSolution);

                                let stateClass = styles.defaultOption;
                                if (isRevealed) {
                                  if (isCorrectKey) {
                                    stateClass = styles.correctOption;
                                  } else if (isSelected && !isCorrectKey) {
                                    stateClass = styles.incorrectOption;
                                  }
                                } else if (isSelected) {
                                  stateClass = styles.selectedOption;
                                }

                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    className={`${styles.optionCard} ${stateClass}`}
                                    onClick={() => handleSelectOption(currentQ.id, opt.key)}
                                  >
                                    <div className={styles.optionBadge}>
                                      {isRevealed && isCorrectKey ? (
                                        <Check size={18} strokeWidth={2.5} />
                                      ) : isRevealed && isSelected && !isCorrectKey ? (
                                        <X size={18} strokeWidth={2.5} />
                                      ) : (
                                        opt.key
                                      )}
                                    </div>
                                    <div className={styles.optionContent}>
                                      <MathText text={opt.text} />
                                    </div>
                                    {isRevealed && isCorrectKey && (
                                      <span className={styles.stateTagCorrect}>Correct Answer</span>
                                    )}
                                    {isRevealed && isSelected && !isCorrectKey && (
                                      <span className={styles.stateTagIncorrect}>Your Choice</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {/* Action Toolbar */}
                        <div className={styles.actionToolbar}>
                          <button
                            type="button"
                            className={styles.shortcutToggleBtn}
                            onClick={() => {
                              soundEffects.playDkSirReveal();
                              setRevealedShortcut(!revealedShortcut);
                            }}
                          >
                            <Sparkles size={14} />
                            <span>{revealedShortcut ? 'Hide Shortcut' : '💡 DK Sir 20s Inspection Shortcut'}</span>
                          </button>

                          <button
                            type="button"
                            className={styles.solutionToggleBtn}
                            onClick={() => setRevealedSolution(!revealedSolution)}
                          >
                            <BookOpen size={14} />
                            <span>{revealedSolution ? 'Hide Derivation' : '📖 Step Derivation'}</span>
                          </button>

                          {(activeDrill.videoUrl || activeDrill.videoWalkthroughUrl) && (
                            <button
                              type="button"
                              className={styles.videoSolutionBtn}
                              onClick={() => setActiveVideoUrl(activeDrill.videoUrl || activeDrill.videoWalkthroughUrl || '')}
                            >
                              <Video size={14} />
                              <span>▶ Video Solution</span>
                            </button>
                          )}

                          {activeDrill.pdfUrl && (
                            <a
                              href={activeDrill.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.pdfSolutionBtn}
                            >
                              <FileText size={14} />
                              <span>📄 PDF Solution</span>
                            </a>
                          )}
                        </div>

                        {/* Revealed DK Sir Shortcut Box */}
                        {revealedShortcut && (
                          <div className={styles.shortcutBox}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '6px' }}>
                              <Zap size={16} /> DK Sir 20–30s Inspection Trick:
                            </div>
                            <div style={{ margin: 0 }}>
                              <MathText text={currentQ.dkSirShortcut || 'Use boundary-value substitution and eliminate choices with opposite parity or sign in under 20 seconds!'} />
                            </div>
                          </div>
                        )}

                        {/* Revealed Step Derivation Box */}
                        {revealedSolution && (
                          <div className={styles.solutionBox}>
                            <div style={{ fontWeight: 800, marginBottom: '6px', color: '#0f172a' }}>
                              Official Step-by-Step Derivation:
                            </div>
                            <div style={{ margin: 0 }}>
                              <MathText text={currentQ.stepSolution || 'Detailed theoretical proof and algebraic breakdown.'} />
                            </div>
                          </div>
                        )}

                        {/* Navigation Controls */}
                        <div className={styles.navigationBar}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              className={styles.navPrevBtn}
                              disabled={activeQuestionIndex === 0}
                              onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                            >
                              <ChevronLeft size={16} />
                              <span>Previous</span>
                            </button>

                            {activeQuestionIndex < activeQuestions.length - 1 ? (
                              <button
                                type="button"
                                className={styles.nextBtn}
                                onClick={() => setActiveQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                              >
                                <span>Save &amp; Next</span>
                                <ArrowRight size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.submitFinalBtn}
                                onClick={handleSubmitDrill}
                                title="Submit test and view All India Rank (AIR) Score Card"
                              >
                                <Award size={16} />
                                <span>Finish &amp; Check AIR Score</span>
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className={styles.clearBtn}
                              onClick={() => handleClearResponse(currentQ.id)}
                            >
                              Clear Response
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleMarkForReview(currentQ.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: responses[currentQ.id]?.isMarkedForReview ? '#f3e8ff' : '#f8fafc',
                                border: '1px solid #cbd5e1',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: responses[currentQ.id]?.isMarkedForReview ? '#7e22ce' : '#475569',
                                cursor: 'pointer'
                              }}
                            >
                              <Flag size={13} />
                              <span>{responses[currentQ.id]?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No questions available in this drill yet.
                      </div>
                    )}
                  </div>

                  {/* Right Column: CBT Question Palette & Live Speed Metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Progress Summary Bento Card (DPP-Aligned) */}
                    <div className={styles.progressSummaryCard}>
                      <div className={styles.progressCardHeader}>
                        <span className={styles.progressHeading}>Drill Progress</span>
                        <span className={styles.progressCounter}>
                          {drillStats.attempted} / {activeQuestions.length} Attempted
                        </span>
                      </div>

                      <div className={styles.progressRingWrap}>
                        <svg width={76} height={76} viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
                          <circle
                            cx={38}
                            cy={38}
                            r={28}
                            stroke="#E2E8F0"
                            strokeWidth={6}
                            fill="transparent"
                          />
                          <circle
                            cx={38}
                            cy={38}
                            r={28}
                            stroke="#2563EB"
                            strokeWidth={6}
                            strokeLinecap="round"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 - (2 * Math.PI * 28 * (drillStats.attempted || 0)) / (activeQuestions.length || 1)}
                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                          />
                        </svg>
                        <div className={styles.progressPercentText}>
                          {activeQuestions.length > 0 ? Math.round((drillStats.attempted / activeQuestions.length) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    <div className={styles.sidebarPaletteCard}>
                    <div className={styles.paletteHeader}>
                      <h3 className={styles.paletteTitle}>CBT Question Palette</h3>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>
                        {drillStats.attempted}/{activeQuestions.length} Attempted
                      </span>
                    </div>

                    <div className={styles.paletteGrid}>
                      {activeQuestions.map((q, idx) => {
                        const isCurrent = idx === activeQuestionIndex;
                        const isAccessible = isQuestionAccessible(q, idx);
                        const isLocked = !isAccessible;
                        const isAnswered = Boolean(responses[q.id]?.selectedOption);
                        const isMarked = Boolean(responses[q.id]?.isMarkedForReview);

                        return (
                          <button
                            key={q.id}
                            type="button"
                            className={`${styles.paletteBubble} ${isCurrent ? styles.paletteActive : ''} ${isAnswered ? styles.paletteAnswered : ''} ${isMarked ? styles.paletteMarked : ''}`}
                            style={isLocked ? { background: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3', position: 'relative' } : undefined}
                            onClick={() => {
                              if (isLocked) {
                                handleUnlockDrill(activeDrill);
                              } else {
                                handleJumpQuestion(idx);
                              }
                            }}
                            title={isLocked ? `Question ${idx + 1} (Locked - Click to unlock)` : `Question ${idx + 1}`}
                          >
                            <span>{idx + 1}</span>
                            {isLocked && (
                              <Lock size={10} style={{ position: 'absolute', top: 2, right: 2, color: '#e11d48' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.paletteLegend}>
                      <div className={styles.legendRow}>
                        <span className={styles.legendDot} style={{ background: '#86efac' }} />
                        <span>Answered ({drillStats.attempted})</span>
                      </div>
                      <div className={styles.legendRow}>
                        <span className={styles.legendDot} style={{ background: '#d8b4fe' }} />
                        <span>Marked for Review ({Object.values(responses).filter((r) => r.isMarkedForReview).length})</span>
                      </div>
                      <div className={styles.legendRow}>
                        <span className={styles.legendDot} style={{ background: '#e2e8f0' }} />
                        <span>Unattempted ({activeQuestions.length - drillStats.attempted})</span>
                      </div>
                    </div>

                    {/* 12 Bonus Questions Simulator Card */}
                    <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '14px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', fontWeight: 800, fontSize: '0.82rem' }}>
                        <Sparkles size={14} /> 12 Bonus Round Engine:
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#3b82f6', lineHeight: 1.5 }}>
                        {drillStats.bonusEligible
                          ? '🎉 All questions attempted! In official BITSAT, the +36 marks Bonus Round triggers now!'
                          : `Attempt all ${activeQuestions.length} questions to simulate triggering the official 12 Bonus Questions round.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitDrill}
                      className={styles.submitDrillBtn}
                      style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '14px 18px',
                        boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)',
                        fontSize: '0.95rem'
                      }}
                      title="Submit BITSAT Speed Drill and View AIR Score"
                    >
                      <Award size={18} />
                      <span>Finish &amp; Check AIR Score</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}
          </Container>
        </section>
      )}

      {/* Video Solution Modal */}
      {activeVideoUrl && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveVideoUrl(null);
          }}
        >
          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
              margin: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={16} style={{ color: '#ef4444' }} /> Video Solution Walkthrough
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoUrl(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                title="BITSAT Video Solution"
                src={
                  activeVideoUrl.includes('watch?v=')
                    ? activeVideoUrl.replace('watch?v=', 'embed/')
                    : activeVideoUrl
                }
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Drill Result & AIR Benchmark Modal */}
      {isDrillSubmitted && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDrillSubmitted(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '32px 28px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              textAlign: 'center',
              position: 'relative',
              margin: 'auto'
            }}
          >
            {/* Close X button */}
            <button
              type="button"
              onClick={() => setIsDrillSubmitted(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#f1f5f9',
                border: 'none',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Close Scorecard"
            >
              <X size={18} />
            </button>

            {/* Award Icon & Title */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: drillStats.percentage >= 70 ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                color: drillStats.percentage >= 70 ? '#15803d' : '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)'
              }}
            >
              <Award size={38} />
            </div>

            <div style={{ display: 'inline-block', padding: '4px 12px', background: '#eff6ff', borderRadius: '100px', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Official BITSAT Speed CBT Simulation
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              BITSAT Performance &amp; AIR Score Card
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.88rem' }}>
              Calibrated against 1,50,000+ national BITSAT candidates and national benchmark speed metrics.
            </p>

            {/* 🏆 PREDICTED AIR HIGHLIGHT HERO BOX */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '20px',
                boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.4)',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd', fontWeight: 800 }}>
                  Predicted All India Rank (AIR)
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: '4px' }}>
                  AIR #{drillStats.predictedAir.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#bfdbfe', marginTop: '4px' }}>
                  Top {drillStats.percentile}% Percentile Nationally
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#e0e7ff', fontWeight: 700 }}>
                  Cutoff Forecast
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {drillStats.percentage}% Marks
                </div>
              </div>
            </div>

            {/* BITS Pilani Campus Eligibility Banner */}
            <div
              style={{
                background: drillStats.percentage >= 60 ? '#f0fdf4' : '#fffbeb',
                border: `1.5px solid ${drillStats.percentage >= 60 ? '#bbf7d0' : '#fde68a'}`,
                color: drillStats.percentage >= 60 ? '#166534' : '#92400e',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.86rem',
                fontWeight: 700,
                textAlign: 'left',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Sparkles size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Admission Forecast: </strong>
                <span>{drillStats.cutoffTier}</span>
              </div>
            </div>

            {/* 4 Stats Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>
                  {drillStats.score} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ {drillStats.totalPossible}</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>Net Score</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>
                  {drillStats.accuracy}%
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>Accuracy</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {drillStats.attempted} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ {activeQuestions.length}</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>Attempted</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 10px', borderRadius: '12px', border: '1px solid #d97706' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706' }}>
                  {drillStats.attempted > 0 ? Math.round(overallElapsedSeconds / drillStats.attempted) : 45}s
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>Avg Time / Q</div>
              </div>
            </div>

            {/* Question Accuracy Pills Breakdown */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                Question-Wise Breakdown:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeQuestions.map((q, idx) => {
                  const resp = responses[q.id];
                  const sel = resp?.selectedOption;
                  const targetKey = q.correctKey || (q as any).correctAnswer;
                  const isCorrect = sel && sel === targetKey;
                  const isUnattempted = !sel;

                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: isCorrect ? '#dcfce7' : isUnattempted ? '#f1f5f9' : '#fee2e2',
                        color: isCorrect ? '#166534' : isUnattempted ? '#475569' : '#991b1b',
                        border: `1px solid ${isCorrect ? '#86efac' : isUnattempted ? '#cbd5e1' : '#fca5a5'}`
                      }}
                    >
                      Q{idx + 1}: {isCorrect ? '✓ Correct (+3)' : isUnattempted ? '— Unattempted (0)' : '✗ Incorrect (-1)'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setIsDrillSubmitted(false);
                  setRevealedSolution(true);
                  setRevealedShortcut(true);
                }}
                style={{ padding: '12px 20px', borderRadius: '10px', border: '1.5px solid #2563eb', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                🔍 Review Solutions &amp; Shortcuts
              </button>
              <button
                type="button"
                onClick={() => {
                  setResponses({});
                  setActiveQuestionIndex(0);
                  const totalSec = ((activeDrill as any).durationMinutes || 15) * 60;
                  setDrillTimeLeft(totalSec);
                  setOverallElapsedSeconds(0);
                  setIsDrillSubmitted(false);
                  setRevealedSolution(false);
                  setRevealedShortcut(false);
                }}
                style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                ↻ Re-attempt Drill
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDrillSubmitted(false);
                  setSelectedDrillId(null);
                }}
                style={{ padding: '12px 22px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
              >
                Return to Drills Catalog →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MOCK TEST PROMOTIONAL SECTION ("Practice with Purpose") ─── */}
      {!activeDrill && (
        <section className={styles.mockTestSection} aria-labelledby="mock-test-heading">
          <Container size="wide">
            <div className={styles.mockTestGrid}>
              {/* Left Column: Visual Mock Test Card */}
              <div className={styles.mockTestBannerCard}>
                <img
                  src="/images/mock-test-banner-hd.png"
                  alt="BITSAT CBT Mock Test Simulation"
                  className={styles.mockTestBgImage}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes('mock-test-banner-crop')) {
                      img.src = '/images/mock-test-banner-crop.png';
                    }
                  }}
                />
                <div className={styles.mockTestBannerContent}>
                  <h3 className={styles.mockTestBannerTitle}>
                    Take <span>Mock Tests</span>
                  </h3>
                  <p className={styles.mockTestBannerSubtitle}>Analyze. Improve. Excel.</p>
                  <Link to="/test-series" className={styles.mockTestStartBtn}>
                    <span>Start Test</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Features and CTA */}
              <div className={styles.mockTestRightCol}>
                <span className={styles.sectionEyebrow}>— Test Series</span>
                <h2 id="mock-test-heading" className={styles.mockTestHeading}>
                  Practice with Purpose
                </h2>

                <div className={styles.mockFeaturesList}>
                  <div className={styles.mockFeatureItem}>
                    <CheckCircle2 size={20} className={styles.mockCheckIcon} aria-hidden="true" />
                    <div className={styles.mockFeatureTextGroup}>
                      <span className={styles.mockFeatureItemTitle}>Real Exam Pattern</span>
                      <span className={styles.mockFeatureItemDesc}>
                        Simulate the authentic 130-question, 180-minute BITSAT CBT engine with strict negative marking (-1).
                      </span>
                    </div>
                  </div>

                  <div className={styles.mockFeatureItem}>
                    <CheckCircle2 size={20} className={styles.mockCheckIcon} aria-hidden="true" />
                    <div className={styles.mockFeatureTextGroup}>
                      <span className={styles.mockFeatureItemTitle}>Detailed Analysis</span>
                      <span className={styles.mockFeatureItemDesc}>
                        Instant question-by-question speed metrics, accuracy breakdown, and step-by-step DK Sir video solutions.
                      </span>
                    </div>
                  </div>

                  <div className={styles.mockFeatureItem}>
                    <CheckCircle2 size={20} className={styles.mockCheckIcon} aria-hidden="true" />
                    <div className={styles.mockFeatureTextGroup}>
                      <span className={styles.mockFeatureItemTitle}>All India Ranking</span>
                      <span className={styles.mockFeatureItemDesc}>
                        Live nationwide percentile prediction and cut-off benchmarking for Pilani, Goa, and Hyderabad campuses.
                      </span>
                    </div>
                  </div>
                </div>

                <Link to="/test-series" className={styles.mockExploreBtn}>
                  <span>Explore All Tests</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── STATISTICS SECTION ─── */}
      {!activeDrill && (
        <section className={styles.statsSection} aria-label="DK Academy BITSAT Statistics">
          <Container size="wide">
            <div className={styles.statsBannerCard}>
              <div className={styles.statsLeftContent}>
                <h3 className={styles.statsHeading}>Join 500+ Students on DK Academy JEE</h3>
                <p className={styles.statsSubtitle}>Be a part of our growing community of achievers.</p>
              </div>

              <div className={styles.statsMetricsRow}>
                {/* Stat 1: Students */}
                <div className={styles.statMetricItem}>
                  <div className={styles.statIconBox}>
                    <Users size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <div className={styles.statNumberText}>500+</div>
                    <div className={styles.statLabelText}>Students</div>
                  </div>
                </div>

                {/* Stat 2: Tests Attempted */}
                <div className={styles.statMetricItem}>
                  <div className={styles.statIconBox}>
                    <FileCheck size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <div className={styles.statNumberText}>100+</div>
                    <div className={styles.statLabelText}>Tests Attempted</div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── 3. BITSAT Exam Pattern Blueprint ─── */}
      {(viewMode === 'blueprint' || viewMode === 'batches' || viewMode === 'drills') && !activeDrill && (
        <section className={styles.section} id="pattern">
          <Container size="wide">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionBadge}>
                <Sparkles size={12} />
                <span>EXAM ARCHITECTURE</span>
              </div>
              <h2 className={styles.sectionTitle}>
                BITSAT Blueprint: <span className={styles.titleGradient}>130 Questions, 390 Marks, 180 Mins</span>
              </h2>
              <p className={styles.sectionDescription}>
                Mathematics carries the highest weightage (40 questions), while English &amp; Logic (30 questions) form the make-or-break scoring zone.
              </p>
            </div>

            <div className={styles.patternGrid}>
              <div className={styles.patternCard}>
                <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
                <div className={styles.patternTop}>
                  <span className={`${styles.subjectBadge} ${styles.mathBadge}`}>Part IV</span>
                  <Clock size={16} className={styles.accentClock} />
                </div>
                <h3 className={styles.patternTitle}>Mathematics</h3>
                <div className={styles.patternStatsRow}>
                  <span className={styles.patternQuestions}>40 Qs</span>
                  <span className={styles.patternMarks}>• 120 Marks (+3, -1)</span>
                </div>
                <p className={styles.patternNote}>
                  Highest scoring section. DK Sir's 20-30s shortcuts eliminate 2 options instantly in Coordinate Geometry, Calculus, &amp; Vectors.
                </p>
              </div>

              <div className={styles.patternCard}>
                <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
                <div className={styles.patternTop}>
                  <span className={`${styles.subjectBadge} ${styles.lrBadge}`}>Part III</span>
                  <Brain size={16} className={styles.accentBrain} />
                </div>
                <h3 className={styles.patternTitle}>English &amp; Logical Reasoning</h3>
                <div className={styles.patternStatsRow}>
                  <span className={styles.patternQuestions}>30 Qs</span>
                  <span className={styles.patternMarks}>• 90 Marks (10 Eng + 20 LR)</span>
                </div>
                <p className={styles.patternNote}>
                  Neglected by 85% of JEE students. We dedicate 40+ structured hours to grammar, vocabulary, syllogisms, and sequence deduction.
                </p>
              </div>

              <div className={styles.patternCard}>
                <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
                <div className={styles.patternTop}>
                  <span className={`${styles.subjectBadge} ${styles.phyBadge}`}>Part I</span>
                  <Zap size={16} className={styles.accentZap} />
                </div>
                <h3 className={styles.patternTitle}>Physics</h3>
                <div className={styles.patternStatsRow}>
                  <span className={styles.patternQuestions}>30 Qs</span>
                  <span className={styles.patternMarks}>• 90 Marks (+3, -1)</span>
                </div>
                <p className={styles.patternNote}>
                  Formula recall speed drills and dimensional boundary condition checks to solve kinematics and electrodynamics in under 60 seconds.
                </p>
              </div>

              <div className={styles.patternCard}>
                <div className={styles.cardAccentBar} style={{ background: 'linear-gradient(90deg, #059669, #34d399)' }} />
                <div className={styles.patternTop}>
                  <span className={`${styles.subjectBadge} ${styles.chemBadge}`}>Part II</span>
                  <Award size={16} className={styles.accentAward} />
                </div>
                <h3 className={styles.patternTitle}>Chemistry</h3>
                <div className={styles.patternStatsRow}>
                  <span className={styles.patternQuestions}>30 Qs</span>
                  <span className={styles.patternMarks}>• 90 Marks (+3, -1)</span>
                </div>
                <p className={styles.patternNote}>
                  100% NCERT memory retention maps for Inorganic trends, direct reaction mechanisms in Organic, and rapid Physical Chem formulas.
                </p>
              </div>
            </div>

            {/* 12 Bonus Questions Round Highlight Banner */}
            <div className={styles.bonusBanner}>
              <div className={styles.bonusGlowAura} aria-hidden="true" />
              <div className={styles.bonusLeft}>
                <span className={styles.bonusPill}>
                  <Sparkles size={12} /> THE BITSAT ADVANTAGE
                </span>
                <h3 className={styles.bonusTitle}>Unlock the 12 Bonus Questions Engine</h3>
                <p className={styles.bonusDesc}>
                  If you attempt all 130 questions, BITSAT unlocks 12 extra questions (4 Math, 4 Physics, 4 Chemistry) for <strong>+36 bonus marks</strong>. DK Sir trains students on the exact time-budgeting and risk-mitigation algorithm to safely trigger the bonus round without negative marking penalties.
                </p>
              </div>
              <div className={styles.bonusRight}>
                <div className={styles.bonusStatBox}>
                  <span className={styles.bonusNumber}>+36</span>
                  <span className={styles.bonusLabel}>Bonus Marks Potential</span>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── 4. Active BITSAT Batches & Plans ─── */}
      {(viewMode === 'batches' || viewMode === 'drills') && !activeDrill && (
        <section className={styles.section} id="batches">
          <Container size="wide">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionBadge}>
                <Flame size={12} />
                <span>ENROLLMENT OPEN 2026–27</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Active BITSAT Batches &amp; <span className={styles.titleGradient}>Tuition Plans</span>
              </h2>
              <p className={styles.sectionDescription}>
                Target BITS Pilani, Goa, and Hyderabad with targeted crash courses, speed math boosters, and full-length CBT test series.
              </p>
            </div>

            <div className={styles.batchesGrid}>
              {/* Batch 1: Complete Crash Course (Most Popular) */}
              <article className={`${styles.batchCard} ${styles.popularBatch}`}>
                <div className={styles.cardTopAccent} style={{ background: 'linear-gradient(90deg, #2563eb, #38bdf8)' }} />
                
                <div className={styles.batchTopBadgeRow}>
                  <span className={styles.batchFlagshipBadge}>
                    <Sparkles size={11} /> MOST POPULAR BITSAT BATCH
                  </span>
                  <span className={styles.batchTargetYear}>
                    <Calendar size={12} /> Target 2026/27
                  </span>
                </div>

                <h3 className={styles.batchTitle}>BITSAT 2026 Speed Master Crash Program</h3>

                <div className={styles.metaPillsRow}>
                  <div className={styles.metaPillBatch}>
                    <Users size={12} />
                    <span>Strictly Max 25 / Batch</span>
                  </div>
                  <div className={styles.metaPillMode}>
                    <Zap size={12} />
                    <span>Online Live • Sessions 1 &amp; 2</span>
                  </div>
                </div>

                <ul className={styles.featuresList}>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>120+ Live Interactive Speed Hack Sessions</strong> by DK Sir &amp; Team</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>Full Math (40 Qs), Physics, Chem, English &amp; LR</strong> covered end-to-end</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>15 Full-length BITSAT CBT Mocks</strong> with Bonus 12 Questions simulator</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>BITSAT Formula Handbooks</strong> &amp; High-Frequency English Vocab Bank</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>Daily 1:1 Live Doubt Counter</strong> &amp; BITS Pilani Alumni Mentorship</span>
                  </li>
                </ul>

                <div className={styles.pricingBlock}>
                  <div className={styles.priceRow}>
                    <span className={styles.currentPrice}>₹14,999</span>
                    <span className={styles.originalPrice}>₹24,999</span>
                    <span className={styles.discountBadge}>Save 40%</span>
                  </div>
                  <div className={styles.taxSubtext}>Incl. 18% GST • 5 Subjects + 15 Mocks</div>
                </div>

                <div className={styles.cardActionsRow}>
                  <a href="#diagnostic-form" className={styles.enrollPrimaryBtn}>
                    <span>Enroll in Speed Master</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </article>

              {/* Batch 2: Math + LR & English Booster */}
              <article className={styles.batchCard}>
                <div className={styles.cardTopAccent} style={{ background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
                
                <div className={styles.batchTopBadgeRow}>
                  <span className={styles.batchBoosterBadge}>
                    <Brain size={11} /> 210 MARKS SCORING BOOSTER
                  </span>
                  <span className={styles.batchTargetYear}>
                    <Calendar size={12} /> Target 2026/27
                  </span>
                </div>

                <h3 className={styles.batchTitle}>BITSAT Math + LR &amp; English Super Booster</h3>

                <div className={styles.metaPillsRow}>
                  <div className={styles.metaPillBatch}>
                    <Users size={12} />
                    <span>Strictly Max 25 / Batch</span>
                  </div>
                  <div className={styles.metaPillMode}>
                    <Zap size={12} />
                    <span>Online Live • 70/130 Qs Focus</span>
                  </div>
                </div>

                <ul className={styles.featuresList}>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>Complete BITSAT Mathematics (40 Qs)</strong> with DK Sir's 20-30s techniques</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>40+ Hours English &amp; Logical Reasoning drills</strong> for 75+ mark score</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>10 Targeted Math + LR Subject Mocks</strong> with timer diagnostics</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>Daily Speed Practice Sheets (DPS)</strong> with video solution keys</span>
                  </li>
                </ul>

                <div className={styles.pricingBlock}>
                  <div className={styles.priceRow}>
                    <span className={styles.currentPrice}>₹8,999</span>
                    <span className={styles.originalPrice}>₹14,999</span>
                    <span className={styles.discountBadge}>Save 40%</span>
                  </div>
                  <div className={styles.taxSubtext}>Incl. 18% GST • Math, English &amp; LR Special</div>
                </div>

                <div className={styles.cardActionsRow}>
                  <a href="#diagnostic-form" className={styles.enrollPrimaryBtn}>
                    <span>Enroll in Booster</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </article>

              {/* Batch 3: All-India Test Series */}
              <article className={styles.batchCard}>
                <div className={styles.cardTopAccent} style={{ background: 'linear-gradient(90deg, #059669, #34d399)' }} />
                
                <div className={styles.batchTopBadgeRow}>
                  <span className={styles.batchTestBadge}>
                    <Target size={11} /> CBT ENGINE SIMULATION
                  </span>
                  <span className={styles.batchTargetYear}>
                    <Calendar size={12} /> Target 2026/27
                  </span>
                </div>

                <h3 className={styles.batchTitle}>All India BITSAT CBT Online Test Series</h3>

                <div className={styles.metaPillsRow}>
                  <div className={styles.metaPillBatch}>
                    <Users size={12} />
                    <span>10,000+ Rank Pool</span>
                  </div>
                  <div className={styles.metaPillMode}>
                    <Zap size={12} />
                    <span>Self-Paced • 15 Full CBT Mocks</span>
                  </div>
                </div>

                <ul className={styles.featuresList}>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>15 Full-length BITSAT mock tests</strong> strictly aligned with 2026 pattern</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>Authentic Bonus Question trigger</strong> when all 130 Qs are completed</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>Question-wise time analytics</strong> (Time spent per question vs topper)</span>
                  </li>
                  <li>
                    <div className={styles.checkIconWrap}><CheckCircle2 size={14} className={styles.checkIcon} /></div>
                    <span><strong>All India Rank (AIR) &amp; BITS Campus cutoff predictor</strong> algorithms</span>
                  </li>
                </ul>

                <div className={styles.pricingBlock}>
                  <div className={styles.priceRow}>
                    <span className={styles.currentPrice}>₹3,499</span>
                    <span className={styles.originalPrice}>₹6,999</span>
                    <span className={styles.discountBadge}>Save 50%</span>
                  </div>
                  <div className={styles.taxSubtext}>Incl. 18% GST • Full TCS-iON Interface Simulator</div>
                </div>

                <div className={styles.cardActionsRow}>
                  <a href="#diagnostic-form" className={styles.enrollPrimaryBtn}>
                    <span>Join Test Series</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            </div>
          </Container>
        </section>
      )}

      {/* ─── 5. Campus Cutoffs Benchmark Table ─── */}
      {(viewMode === 'blueprint' || viewMode === 'batches' || viewMode === 'drills') && !activeDrill && (
        <section className={`${styles.section} ${styles.sectionAlt}`} id="cutoffs">
          <Container size="wide">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionBadge}>
                <Award size={12} />
                <span>CAMPUS BENCHMARKS</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Target Scores for Top BITS Campuses <span className={styles.titleGradient}>(Out of 390)</span>
              </h2>
              <p className={styles.sectionDescription}>
                Reference cutoffs from previous official admissions to help you target your score threshold.
              </p>
            </div>

            <div className={styles.cutoffsCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.cutoffTable}>
                  <thead>
                    <tr>
                      <th>Branch / Discipline</th>
                      <th>
                        <div className={styles.thCampus}>
                          <span>BITS Pilani</span>
                          <span className={styles.campusFlagshipBadge}>Flagship Campus</span>
                        </div>
                      </th>
                      <th>
                        <div className={styles.thCampus}>
                          <span>BITS K.K. Birla Goa</span>
                        </div>
                      </th>
                      <th>
                        <div className={styles.thCampus}>
                          <span>BITS Hyderabad</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.highlightRow}>
                      <td className={styles.branchCell}>
                        <span className={styles.branchDot} />
                        <strong>Computer Science &amp; Engineering (CSE)</strong>
                      </td>
                      <td><span className={`${styles.scorePill} ${styles.scorePillTop}`}>331 Marks</span></td>
                      <td><span className={styles.scorePill}>301 Marks</span></td>
                      <td><span className={styles.scorePill}>298 Marks</span></td>
                    </tr>
                    <tr className={styles.highlightRow}>
                      <td className={styles.branchCell}>
                        <span className={styles.branchDot} />
                        <strong>Mathematics &amp; Computing (MnC)</strong>
                      </td>
                      <td><span className={`${styles.scorePill} ${styles.scorePillTop}`}>310 Marks</span></td>
                      <td><span className={styles.scorePill}>288 Marks</span></td>
                      <td><span className={styles.scorePill}>285 Marks</span></td>
                    </tr>
                    <tr>
                      <td className={styles.branchCell}>Electronics &amp; Communication (ECE)</td>
                      <td><span className={styles.scorePill}>296 Marks</span></td>
                      <td><span className={styles.scorePill}>278 Marks</span></td>
                      <td><span className={styles.scorePill}>275 Marks</span></td>
                    </tr>
                    <tr>
                      <td className={styles.branchCell}>Electrical &amp; Electronics (EEE)</td>
                      <td><span className={styles.scorePill}>272 Marks</span></td>
                      <td><span className={styles.scorePill}>256 Marks</span></td>
                      <td><span className={styles.scorePill}>252 Marks</span></td>
                    </tr>
                    <tr>
                      <td className={styles.branchCell}>Mechanical Engineering</td>
                      <td><span className={styles.scorePill}>244 Marks</span></td>
                      <td><span className={styles.scorePill}>223 Marks</span></td>
                      <td><span className={styles.scorePill}>221 Marks</span></td>
                    </tr>
                    <tr>
                      <td className={styles.branchCell}>Chemical Engineering</td>
                      <td><span className={styles.scorePill}>224 Marks</span></td>
                      <td><span className={styles.scorePill}>207 Marks</span></td>
                      <td><span className={styles.scorePill}>204 Marks</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.cutoffTableFooter}>
                <ShieldCheck size={14} className={styles.footerShield} />
                <span>Cutoffs reflect Round 1–5 standards. Safe target for Pilani CS is 330+ with bonus question conditioning.</span>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── STUDENT TESTIMONIALS SECTION ("Real Stories. Real Results.") ─── */}
      {!activeDrill && (
        <section className={styles.testimonialsSection} aria-labelledby="testimonials-heading">
          <Container size="wide">
            <div className={styles.sectionHeaderCenter}>
              <span className={styles.sectionEyebrow}>— What Our Students Say</span>
              <h2 id="testimonials-heading" className={styles.sectionTitle}>
                Real Stories. Real Results.
              </h2>
              <p className={styles.sectionSubtitle}>
                Hear from DK Academy aspirants who mastered speed-solving and scored 99+ percentiles in JEE and BITSAT.
              </p>
            </div>

            <div className={styles.testimonialsGrid}>
              {VERIFIED_TESTIMONIALS.map((t, idx) => (
                <div key={idx} className={styles.testimonialCard}>
                  <div className={styles.testimonialAvatarWrap}>
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className={styles.testimonialAvatar}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.src.includes('RISHABH')) {
                          img.src = '/img/RISHABH%20ANAND.png';
                        }
                      }}
                    />
                  </div>
                  <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
                  <div className={styles.testimonialAuthorGroup}>
                    <div className={styles.testimonialAuthorName}>{t.name}</div>
                    <div className={styles.testimonialMetaRow}>
                      <span className={styles.testimonialRankBadge}>{t.score}</span>
                      <span className={styles.testimonialClubBadge}>{t.badge}</span>
                    </div>
                    <div className={styles.testimonialBatchName}>{t.batch}</div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ─── WHY CHOOSE DK ACADEMY? SECTION ("Your Perfect Study Partner") ─── */}
      {!activeDrill && (
        <section className={styles.whySection} aria-labelledby="why-heading">
          <Container size="wide">
            <div className={styles.sectionHeaderCenter}>
              <span className={styles.sectionEyebrow}>Why Choose DK Academy?</span>
              <h2 id="why-heading" className={styles.sectionTitle}>
                Your Perfect Study Partner
              </h2>
              <p className={styles.sectionSubtitle}>
                Rigorous Kota pedagogy, trademark shortcut methods, and personalized tracking for every student.
              </p>
            </div>

            <div className={styles.whyCardsGrid}>
              {/* Card 1: Expert Faculty */}
              <div className={styles.whyCard}>
                <div className={styles.whyIconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Rocket size={24} aria-hidden="true" />
                </div>
                <h3 className={styles.whyCardTitle}>Expert Faculty &amp; Quality Content</h3>
                <p className={styles.whyCardDesc}>
                  Kota pedagogy led directly by Dharmendra Kumar (DK Sir) with 10+ years of proven coaching excellence.
                </p>
              </div>

              {/* Card 2: Smart Test Series */}
              <div className={styles.whyCard}>
                <div className={styles.whyIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Target size={24} aria-hidden="true" />
                </div>
                <h3 className={styles.whyCardTitle}>Smart Test Series &amp; Analysis</h3>
                <p className={styles.whyCardDesc}>
                  Authentic BITSAT CBT test series with instant percentile, accuracy analysis, and question insights.
                </p>
              </div>

              {/* Card 3: Track Your Progress */}
              <div className={styles.whyCard}>
                <div className={styles.whyIconBox} style={{ background: '#fffbeb', color: '#d97706' }}>
                  <TrendingUp size={24} aria-hidden="true" />
                </div>
                <h3 className={styles.whyCardTitle}>Track Your Progress in Real-Time</h3>
                <p className={styles.whyCardDesc}>
                  Real-time analytics monitor chapter completion, problem-solving speed, and areas needing revision.
                </p>
              </div>

              {/* Card 4: Dedicated Support */}
              <div className={styles.whyCard}>
                <div className={styles.whyIconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <Headphones size={24} aria-hidden="true" />
                </div>
                <h3 className={styles.whyCardTitle}>Dedicated Student Support</h3>
                <p className={styles.whyCardDesc}>
                  1-on-1 mentorship, continuous doubt clearing, and customized test strategies for BITS Pilani admissions.
                </p>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── 6. Free Diagnostic Form ─── */}
      {!activeDrill && (
        <section className={styles.section} id="diagnostic-form">
          <Container size="wide">
            <div className={styles.bookingWrapper}>
              <div className={styles.bookingRow}>
                <div className={styles.bookingLeft}>
                  <span className={styles.bookingBadge}>
                    <ShieldCheck size={13} /> ZERO COST SPEED DIAGNOSTIC
                  </span>
                  <h2 className={styles.bookingTitle}>
                    Book Free BITSAT Speed Diagnostic &amp; <span className={styles.titleGradient}>Strategy Consultation</span>
                  </h2>
                  <p className={styles.bookingDesc}>
                    Take our 45-minute mini BITSAT Diagnostic Speed Test. DK Sir and senior mentors will evaluate your question inspection speed, option elimination accuracy, and recommend your personalized preparation schedule.
                  </p>

                  <ul className={styles.bookingPerks}>
                    <li>
                      <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                      <span><strong>Full Speed &amp; Accuracy Diagnostic Report</strong> with percentile benchmarking</span>
                    </li>
                    <li>
                      <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                      <span><strong>1-on-1 Strategy Call</strong> with DK Sir or senior academic mentor</span>
                    </li>
                    <li>
                      <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                      <span><strong>Free BITSAT Speed Math Formula Sheet PDF</strong> &amp; English vocab bank</span>
                    </li>
                    <li>
                      <div className={styles.perkCheckWrap}><Check size={14} className={styles.perkCheck} /></div>
                      <span><strong>Direct WhatsApp Guidance</strong> for batch allotment &amp; diagnostic test slot</span>
                    </li>
                  </ul>
                </div>

                <div className={styles.bookingRight}>
                  <div className={styles.bookingFormCard}>
                    <div className={styles.formHeader}>
                      <h3 className={styles.formTitle}>Reserve Your Diagnostic Slot</h3>
                      <p className={styles.formSubtitle}>Limited to 25 students per week for individualized attention.</p>
                    </div>

                    {isSubmitted ? (
                      <div className={styles.formSuccessState}>
                        <div className={styles.successIconWrap}>
                          <CheckCircle2 size={38} className={styles.successIcon} />
                        </div>
                        <h4 className={styles.successTitle}>Diagnostic Session Requested!</h4>
                        <p className={styles.successText}>
                          Thank you, <strong>{formData.name}</strong>. Our senior counselor will connect with you via WhatsApp/call on <strong>{formData.phone}</strong> within 2 hours.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsSubmitted(false)}
                          className={styles.resetFormBtn}
                        >
                          Submit Another Request
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleDiagnosticSubmit} className={styles.bookingForm}>
                        <div className={styles.inputGroup}>
                          <label htmlFor="student-name" className={styles.inputLabel}>
                            Student Full Name <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            id="student-name"
                            type="text"
                            required
                            placeholder="e.g. Aryan Sharma"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={styles.formInput}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label htmlFor="student-phone" className={styles.inputLabel}>
                            WhatsApp / Mobile Number <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            id="student-phone"
                            type="tel"
                            required
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={styles.formInput}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label htmlFor="target-class" className={styles.inputLabel}>Current Academic Class</label>
                          <select
                            id="target-class"
                            value={formData.targetClass}
                            onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                            className={styles.formSelect}
                          >
                            <option value="Class 12th">Class 12th (Appearing 2026)</option>
                            <option value="Class 12th Dropper / Repeater">Class 12th Passed / Repeater</option>
                            <option value="Class 11th">Class 11th (Targeting 2027)</option>
                          </select>
                        </div>

                        <div className={styles.inputGroup}>
                          <label htmlFor="target-campus" className={styles.inputLabel}>Primary Dream Campus</label>
                          <select
                            id="target-campus"
                            value={formData.targetCampus}
                            onChange={(e) => setFormData({ ...formData, targetCampus: e.target.value })}
                            className={styles.formSelect}
                          >
                            <option value="BITS Pilani (Main Campus)">BITS Pilani (Main Campus)</option>
                            <option value="BITS K.K. Birla Goa Campus">BITS K.K. Birla Goa Campus</option>
                            <option value="BITS Hyderabad Campus">BITS Hyderabad Campus</option>
                            <option value="All 3 Campuses (Open)">Open to All 3 Campuses</option>
                          </select>
                        </div>

                        <button type="submit" className={styles.formSubmitBtn}>
                          <Send size={15} />
                          <span>Confirm Diagnostic Slot</span>
                        </button>

                        <div className={styles.formPrivacyNote}>
                          <ShieldCheck size={12} />
                          <span>We respect your privacy. No spam guarantee.</span>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── 7. FAQs Accordion ─── */}
      {!activeDrill && (
        <section className={`${styles.section} ${styles.sectionAlt}`} id="faq">
          <Container size="wide">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionBadge}>
                <MessageSquare size={12} />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Everything You Need to Know About <span className={styles.titleGradient}>BITSAT Prep</span>
              </h2>
              <p className={styles.sectionDescription}>
                Answers to the most common queries asked by JEE aspirants targeting BITS Pilani.
              </p>
            </div>

            <div className={styles.faqList}>
              {BITSAT_FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
                    <button
                      type="button"
                      className={styles.faqButton}
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <span className={styles.faqChevronWrap}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* Unlock Complete BITSAT Drill Modal */}
      <PYQCourseUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onEnroll={handleEnrollDrill}
        paperTitle={modalTargetDrill?.title || activeDrill?.title || 'BITSAT Speed Drill'}
        paperPrice={modalTargetDrill?.price ?? activeDrill?.price ?? 299}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 99999,
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};
export default BitsatPage;

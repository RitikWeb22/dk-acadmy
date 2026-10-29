import type {
  BatchItem,
  KpiMetric,
  NeedsAttentionItem,
  ActivityItem,
  EngineHourlyLoad,
  MockExamPerformance,
  FunnelStep
} from './types';

// ============================================================================
// 1. RECONCILED BATCHES DATA (Total: 6 Batches, 4 Offline + 2 Online)
// ============================================================================
export const MOCK_BATCHES: BatchItem[] = [
  {
    id: 'batch-1',
    name: 'Ultimate 2-Year Live Classroom',
    targetExam: 'JEE Advanced · 2028',
    capacity: 30,
    enrolled: 26,
    mode: 'Offline · Janakpuri',
    faculty: 'DK Sir (HOD Maths)',
    status: 'Active',
    statusVariant: 'success',
    classroomSplit: 'Classroom'
  },
  {
    id: 'batch-2',
    name: 'Class 12th & Dropper Math Sprint',
    targetExam: 'JEE Main & Adv · 2027',
    capacity: 30,
    enrolled: 29,
    mode: 'Offline · Janakpuri',
    faculty: 'DK Sir',
    status: 'Near Full',
    statusVariant: 'warning',
    classroomSplit: 'Classroom'
  },
  {
    id: 'batch-3',
    name: '20-30s Speed Math & Calculus Core',
    targetExam: 'JEE Main · 2027',
    capacity: 250,
    enrolled: 184,
    mode: 'Online',
    faculty: 'DK Sir',
    status: 'Active',
    statusVariant: 'info',
    classroomSplit: 'Self-paced'
  },
  {
    id: 'batch-4',
    name: 'Class 11 Foundation Geometry & Algebra',
    targetExam: 'JEE Advanced · 2028',
    capacity: 30,
    enrolled: 28,
    mode: 'Offline · Janakpuri',
    faculty: 'Er. Amit Verma',
    status: 'Active',
    statusVariant: 'success',
    classroomSplit: 'Classroom'
  },
  {
    id: 'batch-5',
    name: 'Kota Pedagogy Dropper Speed Batch',
    targetExam: 'JEE Main · 2026',
    capacity: 200,
    enrolled: 192,
    mode: 'Online',
    faculty: 'DK Sir & Team',
    status: 'Near Full',
    statusVariant: 'warning',
    classroomSplit: 'Self-paced'
  },
  {
    id: 'batch-6',
    name: 'Super-30 Weekend Advanced Drill',
    targetExam: 'JEE Advanced · 2026',
    capacity: 30,
    enrolled: 30,
    mode: 'Offline · Janakpuri',
    faculty: 'DK Sir (HOD Maths)',
    status: 'Classroom Full',
    statusVariant: 'danger',
    classroomSplit: 'Classroom'
  }
];

// Reconciled Batch Calculation:
// Total Batches = 6
// Classroom (Offline) = 4 (26 + 29 + 28 + 30 = 113 seats)
// Self-paced (Online) = 2 (184 + 192 = 376 seats)
// Total Enrolled across batches = 489
// Total Capacity = 570 (Utilization = 85.8%)
// Batches near/at capacity (>= 95%): exactly 3 batches (Batch 2: 96.7%, Batch 5: 96.0%, Batch 6: 100%)

// ============================================================================
// 2. RECONCILED KPI RIBBON METRICS
// ============================================================================
export const MOCK_KPIS: KpiMetric[] = [
  {
    id: 'kpi-students',
    title: 'Active Students',
    value: '450',
    unit: 'Enrolled',
    delta: '+14 vs last period',
    deltaType: 'positive',
    badgeText: '+3.2%',
    badgeVariant: 'success',
    breakdown: '320 Offline · Janakpuri  |  130 Online LMS',
    sparkline: [390, 402, 415, 424, 436, 442, 450]
  },
  {
    id: 'kpi-batches',
    title: 'Live Batches',
    value: '6',
    unit: 'Batches',
    delta: '85.8% capacity util.',
    deltaType: 'neutral',
    badgeText: '3 near capacity',
    badgeVariant: 'warning',
    breakdown: '4 Classroom (113/120)  |  2 Self-paced (376/450)',
    sparkline: [4, 5, 5, 6, 6, 6, 6]
  },
  {
    id: 'kpi-engine',
    title: 'Test Engine Health',
    value: '184',
    unit: 'Active Runners',
    delta: '99.98% uptime',
    deltaType: 'positive',
    badgeText: '18ms Latency',
    badgeVariant: 'success',
    breakdown: '12% CPU load  |  AWS Mumbai Node Cluster 4/4',
    sparkline: [120, 145, 160, 152, 178, 170, 184]
  },
  {
    id: 'kpi-leads',
    title: 'New Admission Leads',
    value: '14',
    unit: 'Inquiries',
    delta: '64.1% demo conversion',
    deltaType: 'positive',
    badgeText: '4 High Priority',
    badgeVariant: 'danger',
    breakdown: '9 Demo Trials  |  5 Fee & Schedule queries',
    sparkline: [8, 9, 12, 10, 15, 11, 14]
  }
];

// ============================================================================
// 3. ROW 2: "NEEDS ATTENTION" STRIP (4 Alert Items with Single CTA)
// ============================================================================
export const MOCK_NEEDS_ATTENTION: NeedsAttentionItem[] = [
  {
    id: 'alert-1',
    type: 'batch',
    title: 'Class 12th & Dropper Sprint at 96.7% capacity',
    description: 'Only 1 seat remaining (29/30). Classroom buffer will be locked after next admission.',
    timestamp: '10m ago',
    ctaText: 'Lock Roster',
    badgeText: '1 Seat Left',
    badgeVariant: 'warning'
  },
  {
    id: 'alert-2',
    type: 'lead',
    title: 'High-Priority Lead awaiting callback',
    description: 'Kavya Patel (Class 11) requested Janakpuri classroom trial for DK Sir speed tricks.',
    timestamp: '15m ago',
    ctaText: 'Call on WhatsApp',
    badgeText: 'Lead · 15m idle',
    badgeVariant: 'danger'
  },
  {
    id: 'alert-3',
    type: 'payment',
    title: 'Payment #RZP-8921 failed (₹42,000)',
    description: 'Priya Patel · Dropper Math Sprint installment failed (bank gateway timeout).',
    timestamp: '1h ago',
    ctaText: 'Send Retry Link',
    badgeText: 'Gateway Timeout',
    badgeVariant: 'danger'
  },
  {
    id: 'alert-4',
    type: 'engine',
    title: 'NTA Mock Peak Load handled smoothly',
    description: 'AWS cluster scaled to 4 nodes at 184 concurrent runners with 0 dropped frames.',
    timestamp: '2h ago',
    ctaText: 'View Telemetry',
    badgeText: 'All Nodes Live',
    badgeVariant: 'success'
  }
];

// ============================================================================
// 4. TEST ENGINE REAL-TIME CHARTS DATA
// ============================================================================
export const MOCK_HOURLY_LOAD: EngineHourlyLoad[] = [
  { hour: '08:00', concurrentUsers: 42, avgLatencyMs: 14, attemptsCount: 65 },
  { hour: '10:00', concurrentUsers: 98, avgLatencyMs: 16, attemptsCount: 142 },
  { hour: '12:00', concurrentUsers: 145, avgLatencyMs: 19, attemptsCount: 220 },
  { hour: '14:00', concurrentUsers: 130, avgLatencyMs: 17, attemptsCount: 185 },
  { hour: '16:00', concurrentUsers: 162, avgLatencyMs: 18, attemptsCount: 240 },
  { hour: '18:00', concurrentUsers: 184, avgLatencyMs: 18, attemptsCount: 310 },
  { hour: '20:00', concurrentUsers: 170, avgLatencyMs: 16, attemptsCount: 260 }
];

export const MOCK_EXAM_PERFORMANCES: MockExamPerformance[] = [
  { mockName: 'JEE Main 2026 Full Mock 1', cohort: '2026', avgScore: 194, maxScore: 300, totalAttempts: 210 },
  { mockName: 'Calculus Speed Drill #4', cohort: '2027', avgScore: 78, maxScore: 100, totalAttempts: 184 },
  { mockName: 'JEE Adv 2027 Paper-1 Sprint', cohort: '2027', avgScore: 142, maxScore: 240, totalAttempts: 135 },
  { mockName: 'Class 11 Algebra Test Series', cohort: '2028', avgScore: 82, maxScore: 100, totalAttempts: 92 },
  { mockName: 'Full Syllabus Speed Benchmark', cohort: '2026', avgScore: 218, maxScore: 300, totalAttempts: 168 }
];

// ============================================================================
// 5. ADMISSIONS FUNNEL DATA
// ============================================================================
export const MOCK_FUNNEL_STEPS: FunnelStep[] = [
  { stage: 'Inquiries Received', count: 142, conversionPct: 100, dropoffPct: 0, color: '#3B82F6' },
  { stage: 'Counseling & WhatsApp Connect', count: 124, conversionPct: 87.3, dropoffPct: 12.7, color: '#6366F1' },
  { stage: 'Demo Class Attended', count: 91, conversionPct: 64.1, dropoffPct: 23.2, color: '#8B5CF6' },
  { stage: 'Seat Allotted & Fees Paid', count: 58, conversionPct: 40.8, dropoffPct: 23.3, color: '#10B981' }
];

// ============================================================================
// 6. RECENT ACTIVITY FEED (Grouped Today / Yesterday with Explicit States)
// ============================================================================
export const MOCK_ACTIVITY_FEED: ActivityItem[] = [
  // Today
  {
    id: 'act-1',
    group: 'Today',
    type: 'test',
    studentName: 'Aarav Sharma',
    avatarText: 'AS',
    actionText: 'attempting mock examination',
    subjectTitle: 'JEE Main 2026 Full Syllabus Mock 1',
    stateLabel: 'In Progress (Q18/30)',
    stateVariant: 'warning',
    relativeTime: '12m ago',
    exactTimestamp: 'Today at 09:48 PM IST',
    metaNote: 'NTA CBT Engine Handshake active • 0 network drops'
  },
  {
    id: 'act-2',
    group: 'Today',
    type: 'payment',
    studentName: 'Tanya Kapoor',
    avatarText: 'TK',
    actionText: 'completed admission fee payment',
    subjectTitle: 'Ultimate 2-Year Live Classroom (2028)',
    stateLabel: 'Completed (₹84,000)',
    stateVariant: 'success',
    relativeTime: '34m ago',
    exactTimestamp: 'Today at 09:26 PM IST',
    metaNote: 'Razorpay ID #pay_Px92kL1 • Janakpuri Seat #26 Locked'
  },
  {
    id: 'act-3',
    group: 'Today',
    type: 'dpp',
    studentName: 'Rahul Meena',
    avatarText: 'RM',
    actionText: 'submitted daily practice problem',
    subjectTitle: 'DPP-04: Organic Reaction Pathways',
    stateLabel: 'Completed (Score: 25/25)',
    stateVariant: 'success',
    relativeTime: '1h ago',
    exactTimestamp: 'Today at 08:55 PM IST',
    metaNote: '100% Accuracy in 19 mins (Kota Benchmark: 22 mins)'
  },
  {
    id: 'act-4',
    group: 'Today',
    type: 'lead',
    studentName: 'Sneha Nair',
    avatarText: 'SN',
    actionText: 'booked demo trial slot',
    subjectTitle: 'Class 11 Foundation Geometry & Algebra',
    stateLabel: 'Demo Scheduled',
    stateVariant: 'info',
    relativeTime: '2h ago',
    exactTimestamp: 'Today at 07:40 PM IST',
    metaNote: 'Classroom Janakpuri • Sunday 11:00 AM trial'
  },
  // Yesterday
  {
    id: 'act-5',
    group: 'Yesterday',
    type: 'test',
    studentName: 'Rohan Verma',
    avatarText: 'RV',
    actionText: 'completed timed test series',
    subjectTitle: 'JEE Advanced 2026 Speed Mock 3',
    stateLabel: 'Completed (246/360)',
    stateVariant: 'success',
    relativeTime: 'Yesterday',
    exactTimestamp: 'Yesterday at 04:45 PM IST',
    metaNote: 'Rank #4 in Academy cohort • 99.1%ile speed metric'
  },
  {
    id: 'act-6',
    group: 'Yesterday',
    type: 'payment',
    studentName: 'Priya Patel',
    avatarText: 'PP',
    actionText: 'installment checkout transaction failed',
    subjectTitle: 'Class 12th & Dropper Math Sprint',
    stateLabel: 'Payment Failed',
    stateVariant: 'danger',
    relativeTime: 'Yesterday',
    exactTimestamp: 'Yesterday at 02:10 PM IST',
    metaNote: 'Ref #RZP-8921 • Payment link sent automatically'
  },
  {
    id: 'act-7',
    group: 'Yesterday',
    type: 'dpp',
    studentName: 'Aryan Roy',
    avatarText: 'AR',
    actionText: 'submitted calculus daily assignment',
    subjectTitle: 'DPP-03: Vector & 3D Geometry Drills',
    stateLabel: 'Completed (Score: 22/25)',
    stateVariant: 'success',
    relativeTime: 'Yesterday',
    exactTimestamp: 'Yesterday at 11:30 AM IST',
    metaNote: '88% Accuracy • Solution video viewed'
  }
];

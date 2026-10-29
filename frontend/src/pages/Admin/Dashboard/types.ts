export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type ExamTarget = 'JEE Advanced · 2028' | 'JEE Main & Adv · 2027' | 'JEE Main · 2027' | 'JEE Main · 2026' | 'JEE Advanced · 2026';

export type ModeType = 'Offline · Janakpuri' | 'Online';

export interface BatchItem {
  id: string;
  name: string;
  targetExam: ExamTarget;
  capacity: number;
  enrolled: number;
  mode: ModeType;
  faculty: string;
  status: 'Active' | 'Near Full' | 'Classroom Full';
  statusVariant: BadgeVariant;
  classroomSplit: 'Classroom' | 'Self-paced';
}

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  unit: string;
  delta: string;
  deltaType: 'positive' | 'negative' | 'neutral';
  badgeText: string;
  badgeVariant: BadgeVariant;
  breakdown: string;
  sparkline: number[];
}

export interface NeedsAttentionItem {
  id: string;
  type: 'batch' | 'lead' | 'payment' | 'engine';
  title: string;
  description: string;
  timestamp: string;
  ctaText: string;
  badgeText: string;
  badgeVariant: BadgeVariant;
}

export interface ActivityItem {
  id: string;
  group: 'Today' | 'Yesterday';
  type: 'test' | 'payment' | 'dpp' | 'lead';
  studentName: string;
  avatarText: string;
  actionText: string;
  subjectTitle: string;
  stateLabel: string;
  stateVariant: BadgeVariant;
  relativeTime: string;
  exactTimestamp: string;
  metaNote?: string;
}

export interface EngineHourlyLoad {
  hour: string;
  concurrentUsers: number;
  avgLatencyMs: number;
  attemptsCount: number;
}

export interface MockExamPerformance {
  mockName: string;
  cohort: string;
  avgScore: number;
  maxScore: number;
  totalAttempts: number;
}

export interface FunnelStep {
  stage: string;
  count: number;
  conversionPct: number;
  dropoffPct: number;
  color: string;
}

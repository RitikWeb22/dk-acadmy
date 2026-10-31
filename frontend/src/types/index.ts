export interface NavItem {
  label: string;
  href: string;
  isButton?: boolean;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isExternal?: boolean;
}

export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'General';

export type CourseCategory = 'JEE Main' | 'JEE Advanced' | 'Foundation' | 'Crash Course' | string;

export interface Course {
  _id?: string;
  id: string;
  title: string;
  targetExam: 'JEE Main' | 'JEE Advanced' | 'JEE Main & Advanced' | 'Foundation' | 'Crash Course' | string;
  category?: CourseCategory;
  targetClass?: 'Class 11th' | 'Class 12th' | 'Dropper' | 'Class 10th Foundation' | string;
  targetYear: string;
  badge?: string;
  badgeUrgency?: 'urgency' | 'instant' | 'popular' | 'category';
  tags?: string[];
  tier?: 'Free' | 'Paid' | string;
  level?: string;
  courseLevel?: string;
  price?: string;
  originalPrice?: string;
  numericPrice?: number;
  discountPercentage?: number;
  includesGst?: boolean;
  emiText?: string;
  batchStartDate?: string;
  batchCloseDate?: string;
  lastBatchDate?: string;
  courseType?: 'live' | 'recorded' | 'test-series' | 'dlp' | string;
  description: string;
  features: string[];
  schedule?: string;
  mode: 'Live + Recorded' | 'Structured Recorded' | 'Self-Paced' | 'Live' | 'Online Test Series' | string;
  deliveryMode?: string;
  duration?: string;
  language?: string;
  validity?: string;
  taughtByIitians?: boolean;
  facultyAvatars?: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  enrolledCount?: number;
  rating?: number;
  ratingCount?: number;
  subjects?: ('Physics' | 'Chemistry' | 'Mathematics')[];
  coverImage?: string;
  demoVideoUrl?: string;
  syllabusPdfUrl?: string;
  testSchedulePdfUrl?: string;
  brochurePdfUrl?: string;
  curriculumSections?: CourseCurriculumSection[];
  slug?: string;
  status?: 'Published' | 'Draft' | 'Archived';
  instructor?: string;
  targetAudience?: string;
  outcomes?: string;
  prerequisites?: string;
  reviewCount?: number;
  lastUpdated?: string;
  promotionalBanner?: string;
  seoTitle?: string;
  seoDescription?: string;
  supportMaterials?: {
    id: string;
    title: string;
    type: 'notes' | 'dpp' | 'worksheet' | 'solution' | 'revision';
    fileUrl: string;
    isFree?: boolean;
    description?: string;
  }[];
}

export interface CourseLectureItem {
  id: string;
  title: string;
  duration: string;
  isPreview: boolean;
  isFree?: boolean;
  videoUrl?: string;
  youtubeId?: string;
  description?: string;
  lessonType?: 'recorded_video' | 'live_class' | 'text' | 'pdf' | 'quiz';
  videoStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
  notesPdfUrl?: string;
  notesTitle?: string;
  dppPdfUrl?: string;
  dppTitle?: string;
  externalDocLink?: string;
  externalDocTitle?: string;
  resources?: { id?: string; title: string; url: string }[];
}

export interface CourseCurriculumSection {
  id: string;
  title: string;
  description?: string;
  durationText?: string;
  lectures: CourseLectureItem[];
}

export interface Lecture {
  id: string;
  title: string;
  subject: Subject;
  chapter: string;
  duration: string;
  level: 'JEE Main' | 'JEE Advanced' | 'JEE Main & Advanced' | 'Concepts';
  instructor: string;
  videoUrl?: string;
  youtubeId?: string;
  description: string;
  isFeatured?: boolean;
  topics?: string[];
  notesAvailable?: boolean;
  dppAvailable?: boolean;
  isPaid?: boolean;
  accessType?: 'free' | 'paid';
}

export interface PracticeFeature {
  id: string;
  title: string;
  shortTag: string;
  description: string;
  bulletPoints: string[];
  route: string;
  badgeText?: string;
}

export interface LearningStep {
  stepNumber: number;
  title: string;
  description: string;
  iconName: string;
}

export interface ValueProp {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export type PYQExam = 'JEE Main' | 'JEE Advanced' | 'BITSAT';

export interface PYQOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface PYQQuestion {
  id: string;
  exam: PYQExam;
  year: number;
  subject: Subject;
  chapter: string;
  topic: string;
  type: 'Single Choice MCQ' | 'Numerical Value' | 'Multiple Choice MCQ';
  statement: string;
  options?: PYQOption[];
  correctAnswer: string;
  explanation: string;
  formulaKey?: string;
  marks: string; // e.g. '+4 / -1'
  isFree?: boolean; // First 5 questions free preview; remaining questions unlocked upon course purchase
  youtubeUrl?: string; // YouTube video solution walkthrough link
  videoUrl?: string; // Direct MP4 video walkthrough link
  pdfUrl?: string; // Solution & question paper PDF download link
  courseId?: string; // Associated course ID (e.g., 'jee-pyq-archive-mastery')
  courseName?: string; // Associated course display title
  videoDuration?: string; // e.g., '14:20'
}

export interface PYQUserResponse {
  selectedOption?: string;
  isEvaluated: boolean;
  isCorrect?: boolean;
  isMarkedForReview?: boolean;
}

export type DPPDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface DPPOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface DPPQuestion {
  id: string;
  questionNumber: number;
  statement: string;
  options: DPPOption[];
  correctAnswer: string;
  explanation: string;
  formulaKey?: string;
}

export interface DPPSet {
  id: string;
  title: string;
  subject: Subject;
  chapter: string;
  topic: string;
  difficulty: DPPDifficulty;
  estimatedMinutes: number;
  pdfUrl?: string;
  videoWalkthroughUrl?: string;
  questions: DPPQuestion[];
}

export interface DPPQuestionResponse {
  selectedOption?: string;
  isMarkedForReview: boolean;
  isEvaluated?: boolean;
}

export interface DPPAttempt {
  setId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  mode: 'practice' | 'test';
  responses: Record<string, DPPQuestionResponse>;
  isSubmitted: boolean;
}

export type TestExamType = 'JEE Main' | 'JEE Advanced' | 'BITSAT';
export type TestFormat = 'Full Mock' | 'Part Test' | 'Chapter Test';
export type TestDifficulty = 'Moderate' | 'Challenging' | 'Advanced' | 'Hard' | 'Easy';

export interface TestOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface TestQuestion {
  id: string;
  questionNumber: number;
  subject: Subject;
  chapter: string;
  statement: string;
  options: TestOption[];
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  formulaKey?: string;
}

export interface TestMarkingScheme {
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface TestSeriesItem {
  id: string;
  title: string;
  subtitle: string;
  examType: TestExamType;
  format: TestFormat;
  difficulty: TestDifficulty;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  subjects: Subject[];
  markingScheme: TestMarkingScheme;
  instructions: string[];
  questions: TestQuestion[];
}

export interface TestQuestionResponse {
  selectedOption?: string;
  isMarkedForReview: boolean;
  isVisited: boolean;
}

export interface TestAttempt {
  testId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  startTime?: number;
  timeSpentSeconds: number;
  responses: Record<string, TestQuestionResponse>;
  isSubmitted: boolean;
  submittedAt?: number;
}

export interface TestSubjectResult {
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
  accuracy: number;
}

export interface TestResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  subjectBreakdown: Partial<Record<Subject, TestSubjectResult>>;
}

export interface Testimonial {
  id: string;
  name: string;
  avatarText: string;
  image?: string;
  score: string;
  rankOrCollege: string;
  examTag: 'JEE Main' | 'JEE Advanced' | 'Foundation' | 'Boards & JEE';
  quote: string;
  highlightTopic: string;
  rating: number;
  verified: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Lectures & YouTube' | 'Batches & Courses' | 'Practice & PYQ' | 'Mentorship & Notes';
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  highlightText: string;
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; to: string };
  stats: { label: string; value: string }[];
  features: string[];
  theme: 'blue' | 'indigo' | 'emerald' | 'navy';
  visualType: 'jee-main' | 'jee-advanced' | 'dpp-pyq' | 'free-mastery';
  bannerImage?: string;
}

export interface TrendingSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  theme: 'cyan' | 'purple' | 'amber' | 'emerald';
  stat: string;
}

export interface AchieverItem {
  id: string;
  name: string;
  image: string;
  score: string;
  rankOrCollege: string;
  examTag: 'JEE Advanced' | 'JEE Main' | 'Foundation' | 'Boards & JEE';
  highlightTopic: string;
  year: string;
  verified: boolean;
  storySnippet: string;
}

export interface SuccessStoryItem {
  id: string;
  name: string;
  image: string;
  achievement: string;
  college: string;
  examTag: string;
  quote: string;
  videoDuration: string;
  keyTakeaway: string;
  rating: number;
}

export interface OnlineCategoryItem {
  id: string;
  title: string;
  targetClass: string;
  description: string;
  iconName: string;
  highlights: string[];
  categoryValue: CourseCategory;
  accentColor: string;
}

export interface LearningFeatureChip {
  id: string;
  title: string;
  description: string;
  iconName: string;
  route: string;
  badge?: string;
}

export interface CallbackFormData {
  fullName: string;
  mobile: string;
  courseInterest: string;
  preferredTime: string;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  dppReminders: boolean;
  mockTestUpdates: boolean;
  smsExamUpdates: boolean;
}

export interface StudentProfile {
  id: string;
  studentId?: string;
  name: string;
  phone: string;
  email?: string;
  targetExam?: string;
  targetClass?: string;
  targetYear?: string;
  enrolledCourseIds: string[];
  joinedDate: string;
  lastActiveTimestamp?: number;
  avatarUrl?: string;
  notificationPreferences?: NotificationPreferences;
  dob?: string;
  preferredLanguage?: 'Hinglish' | 'English';
  city?: string;
  state?: string;
  parentName?: string;
  parentPhone?: string;
  schoolName?: string;
  board?: 'CBSE' | 'ICSE' | 'State Board' | 'Other';
  token?: string;
}

export interface LearningActivityEvent {
  id: string;
  type: 'dpp_attempt' | 'test_submission' | 'course_enrolled' | 'lecture_watched';
  title: string;
  subtitle: string;
  timestamp: number;
  route: string;
  score?: string;
  badgeText?: string;
}

export type NotificationCategory = 'announcement' | 'course' | 'practice_test';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: number;
  read: boolean;
  linkText?: string;
  linkUrl?: string;
  urgency?: 'high' | 'normal' | 'low';
  tag?: string;
}

export interface ClassroomBatch {
  id: string;
  title: string;
  targetExam: string;
  targetClass: string;
  targetYear: string;
  badge: string;
  schedule: string;
  timings: string;
  seatsLeft: number;
  maxBatchSize: number;
  fee: string;
  feePeriod: string;
  features: string[];
}

export interface LiveClassSession {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  subject: Subject;
  teacherName: string;
  date: string;
  time: string;
  durationMinutes: number;
  platform: 'Zoom' | 'Google Meet' | 'YouTube Live' | 'DK Live Vault';
  meetingUrl: string;
  meetingPassword?: string;
  status: 'Scheduled' | 'Live Now' | 'Completed';
  recordingUrl?: string;
}



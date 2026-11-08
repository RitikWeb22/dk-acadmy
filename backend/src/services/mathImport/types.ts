export type ValidationStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface ValidationIssue {
  type: 'syntax_error' | 'unbalanced_brace' | 'unbalanced_delimiter' | 'empty_fraction' | 'check_marker' | 'linear_fraction' | 'unwrapped_latex';
  message: string;
  expression?: string;
  location?: string;
}

export interface ItemValidationResult {
  status: ValidationStatus;
  isValid: boolean;
  issues: ValidationIssue[];
  renderedSnippet?: string;
}

export interface QuestionValidationSummary {
  qNum?: number;
  questionNumber?: number;
  statementStatus: ValidationStatus;
  optionsStatus: Record<string, ValidationStatus>;
  overallStatus: ValidationStatus;
  canPublish: boolean;
  issues: ValidationIssue[];
}

export interface BatchValidationDashboard {
  total: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  canPublishAll: boolean;
  redItemIndices: number[];
  yellowItemIndices: number[];
}

export type ProcessingLayer = 'omml' | 'pandoc' | 'normalizer' | 'ocr' | 'ai' | 'manual';

export interface AuditLogEntry {
  id: string;
  originalInput: string;
  convertedOutput: string;
  layer: ProcessingLayer;
  status: ValidationStatus;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ExtractedQuestionItem {
  qNum: number;
  statement: string;
  options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctKey?: 'A' | 'B' | 'C' | 'D';
  numericalAnswer?: string;
  positiveMarks?: number;
  negativeMarks?: number;
  section?: 'A' | 'B';
  subject?: string;
  topic?: string;
  targetExam?: string;
  year?: string;
  shift?: string;
  stepSolution?: string;
  dkSirShortcut?: string;
  validation: QuestionValidationSummary;
  auditTrail: AuditLogEntry[];
  sourceType: 'pandoc-docx' | 'omml-native' | 'ocr-sourced' | 'web-paste' | 'plain-text';
}

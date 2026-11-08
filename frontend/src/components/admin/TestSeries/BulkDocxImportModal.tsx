import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, X, ChevronRight } from 'lucide-react';
import { ValidationBadge } from '../../ui/MathEngine/ValidationBadge';
import { apiClient } from '../../../services/apiClient';

export interface ExtractedQuestionResult {
  id: string;
  qNum: number;
  statement: string;
  options: Array<{ key: string; text: string }>;
  correctAnswer?: string;
  section: 'A' | 'B';
  type: 'SINGLE_CORRECT' | 'NUMERICAL';
  subject: string;
  marks: number;
  negativeMarks: number;
  stepSolution?: string;
  dkSirShortcut?: string;
  examTag?: string;
  validationStatus: 'GREEN' | 'YELLOW' | 'RED';
  validationIssues?: Array<{ message: string }>;
}

export interface BulkDocxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsImported: (questions: ExtractedQuestionResult[]) => void;
  defaultSubject?: string;
  targetExam?: string;
}

export const BulkDocxImportModal: React.FC<BulkDocxImportModalProps> = ({
  isOpen,
  onClose,
  onQuestionsImported,
  defaultSubject = 'Mathematics',
  targetExam = 'JEE Main'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState(defaultSubject);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<ExtractedQuestionResult[]>([]);
  const [dashboardStats, setDashboardStats] = useState<{
    total: number;
    green: number;
    yellow: number;
    red: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.name.toLowerCase().endsWith('.docx')) {
        setErrorMsg('Please select a valid Microsoft Word (.docx) file.');
        return;
      }
      setSelectedFile(f);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (!f.name.toLowerCase().endsWith('.docx')) {
        setErrorMsg('Please select a valid Microsoft Word (.docx) file.');
        return;
      }
      setSelectedFile(f);
      setErrorMsg(null);
    }
  };

  const handleProcessDocx = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const json = await apiClient.uploadBulkDocx(selectedFile, {
        subject,
        targetExam
      });

      const questions: ExtractedQuestionResult[] = (json.questions || []).map((q: any, idx: number) => ({
        id: `docx-q-${Date.now()}-${idx + 1}`,
        qNum: q.qNum || idx + 1,
        statement: q.statement,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 'A',
        section: q.section || (idx >= 20 ? 'B' : 'A'),
        type: q.type || (idx >= 20 ? 'NUMERICAL' : 'SINGLE_CORRECT'),
        subject: q.subject || subject,
        marks: q.marks || 4,
        negativeMarks: q.negativeMarks ?? 1,
        stepSolution: q.stepSolution,
        dkSirShortcut: q.dkSirShortcut,
        examTag: q.examTag,
        validationStatus: q.validationStatus || 'GREEN',
        validationIssues: q.validationIssues || []
      }));

      setPreviewQuestions(questions);
      setDashboardStats(json.dashboard ? {
        total: json.dashboard.total,
        green: json.dashboard.greenCount,
        yellow: json.dashboard.yellowCount,
        red: json.dashboard.redCount
      } : {
        total: questions.length,
        green: questions.filter(q => q.validationStatus === 'GREEN').length,
        yellow: questions.filter(q => q.validationStatus === 'YELLOW').length,
        red: questions.filter(q => q.validationStatus === 'RED').length
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse DOCX file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyAll = () => {
    if (previewQuestions.length === 0) return;
    onQuestionsImported(previewQuestions);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Bulk Import Test Questions from .DOCX
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Upload Microsoft Word document. Pandoc + OMML engine converts all questions and math into KaTeX LaTeX.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Controls: Subject */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Subject:
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Area */}
          {!dashboardStats && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #93c5fd',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <UploadCloud size={40} color="#3b82f6" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                {selectedFile ? selectedFile.name : 'Click to select or drag & drop .docx file'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Supports standard Word documents with OMML equations, tables, images, and answer keys.
              </div>
            </div>
          )}

          {/* Preview Extracted Questions */}
          {dashboardStats && (
            <div>
              {/* Stat Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  marginBottom: '14px'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Extracted {dashboardStats.total} Questions:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>
                    ✓ {dashboardStats.green} Green
                  </span>
                  <span style={{ color: '#d97706', fontSize: '12px', fontWeight: 600 }}>
                    ⚡ {dashboardStats.yellow} Yellow
                  </span>
                  <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>
                    ✕ {dashboardStats.red} Red
                  </span>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {previewQuestions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>
                        Q{q.qNum} • Section {q.section} ({q.type}) • Key: {q.correctAnswer}
                      </span>
                      <ValidationBadge status={q.validationStatus} issues={q.validationIssues} compact />
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.4' }}>
                      {q.statement}
                    </div>
                    {q.options.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '6px', fontSize: '11.5px', color: '#64748b' }}>
                        {q.options.map((opt) => (
                          <div key={opt.key}>
                            <strong>({opt.key})</strong> {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          {!dashboardStats ? (
            <button
              type="button"
              onClick={handleProcessDocx}
              disabled={!selectedFile || isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
                opacity: !selectedFile || isUploading ? 0.6 : 1
              }}
            >
              <Sparkles size={14} />
              {isUploading ? 'Parsing .DOCX with Pandoc...' : 'Process Document'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} />
              Add All {previewQuestions.length} Questions to Test Series
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

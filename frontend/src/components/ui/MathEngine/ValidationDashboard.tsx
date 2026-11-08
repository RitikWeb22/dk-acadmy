import React from 'react';
import { AlertCircle, CheckCircle2, Sparkles, Filter, ChevronRight, AlertTriangle } from 'lucide-react';
import type { ValidationStatusType } from './ValidationBadge';

export interface BatchValidationStats {
  total: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  canPublishAll: boolean;
  redIndices?: number[];
  yellowIndices?: number[];
}

export interface ValidationDashboardProps {
  stats: BatchValidationStats;
  currentFilter: 'ALL' | 'GREEN' | 'YELLOW' | 'RED';
  onFilterChange: (filter: 'ALL' | 'GREEN' | 'YELLOW' | 'RED') => void;
  onJumpToFirstRed?: () => void;
  onTriggerAiRepairAll?: () => void;
  isAiRepairing?: boolean;
}

export const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  stats,
  currentFilter,
  onFilterChange,
  onJumpToFirstRed,
  onTriggerAiRepairAll,
  isAiRepairing = false
}) => {
  const { total, greenCount, yellowCount, redCount, canPublishAll } = stats;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left: Overall Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
            Math Engine Health:
          </span>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: canPublishAll ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${canPublishAll ? '#bbf7d0' : '#fecaca'}`
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#16a34a',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={13} /> {greenCount} Green
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#d97706',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <Sparkles size={13} /> {yellowCount} Yellow
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <AlertCircle size={13} /> {redCount} Red
            </span>
          </div>
        </div>

        {/* Right: Filter Buttons & Quick Jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => onFilterChange('ALL')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: currentFilter === 'ALL' ? 700 : 500,
                color: currentFilter === 'ALL' ? '#1e293b' : '#64748b',
                background: currentFilter === 'ALL' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: currentFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              All ({total})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('GREEN')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: currentFilter === 'GREEN' ? 700 : 500,
                color: currentFilter === 'GREEN' ? '#15803d' : '#64748b',
                background: currentFilter === 'GREEN' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: currentFilter === 'GREEN' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Green ({greenCount})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('YELLOW')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: currentFilter === 'YELLOW' ? 700 : 500,
                color: currentFilter === 'YELLOW' ? '#b45309' : '#64748b',
                background: currentFilter === 'YELLOW' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: currentFilter === 'YELLOW' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Yellow ({yellowCount})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('RED')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: currentFilter === 'RED' ? 700 : 500,
                color: currentFilter === 'RED' ? '#b91c1c' : '#64748b',
                background: currentFilter === 'RED' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: currentFilter === 'RED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Red ({redCount})
            </button>
          </div>

          {redCount > 0 && onJumpToFirstRed && (
            <button
              type="button"
              onClick={onJumpToFirstRed}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Jump to Red Q <ChevronRight size={14} />
            </button>
          )}

          {redCount > 0 && onTriggerAiRepairAll && (
            <button
              type="button"
              onClick={onTriggerAiRepairAll}
              disabled={isAiRepairing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isAiRepairing ? 'not-allowed' : 'pointer',
                opacity: isAiRepairing ? 0.7 : 1
              }}
            >
              <Sparkles size={14} />
              {isAiRepairing ? 'Repairing with Gemini...' : 'AI Repair (Gemini)'}
            </button>
          )}
        </div>
      </div>

      {/* Warning Alert Banner when RED > 0 */}
      {redCount > 0 && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#991b1b'
          }}
        >
          <AlertTriangle size={15} color="#dc2626" />
          <span>
            <strong>Publishing Blocked:</strong> {redCount} question(s) contain invalid LaTeX syntax or empty formulas.
            Click <strong>"Jump to Red Q"</strong> to inspect or use <strong>"AI Repair (Gemini)"</strong> to auto-fix formatting.
          </span>
        </div>
      )}
    </div>
  );
};


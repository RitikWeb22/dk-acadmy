import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, XCircle } from 'lucide-react';

export type ValidationStatusType = 'GREEN' | 'YELLOW' | 'RED';

export interface ValidationBadgeProps {
  status: ValidationStatusType;
  issues?: Array<{ message: string; expression?: string }>;
  compact?: boolean;
  className?: string;
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({
  status,
  issues = [],
  compact = false,
  className = ''
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'GREEN':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#059669',
          icon: <CheckCircle2 size={compact ? 12 : 14} color="#059669" />,
          label: 'Valid KaTeX'
        };
      case 'YELLOW':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          color: '#d97706',
          icon: <Sparkles size={compact ? 12 : 14} color="#d97706" />,
          label: 'AI / OCR Repaired'
        };
      case 'RED':
      default:
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          color: '#dc2626',
          icon: <XCircle size={compact ? 12 : 14} color="#dc2626" />,
          label: 'KaTeX Error'
        };
    }
  };

  const config = getBadgeConfig();
  const tooltipText = issues.length > 0
    ? issues.map((i) => i.message).join('\n')
    : config.label;

  return (
    <span
      className={className}
      title={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '3px' : '5px',
        padding: compact ? '2px 6px' : '3px 8px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        borderRadius: '9999px',
        fontSize: compact ? '11px' : '12px',
        fontWeight: 600,
        userSelect: 'none',
        lineHeight: 1
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};


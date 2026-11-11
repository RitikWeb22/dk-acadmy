import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, XCircle } from 'lucide-react';
import { Button } from '../button';
import { cn } from '@/lib/utils';

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
          variantClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400',
          icon: <CheckCircle2 className={compact ? "size-3 text-emerald-600" : "size-3.5 text-emerald-600"} />,
          label: 'Valid KaTeX'
        };
      case 'YELLOW':
        return {
          variantClass: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400',
          icon: <Sparkles className={compact ? "size-3 text-amber-600" : "size-3.5 text-amber-600"} />,
          label: 'AI / OCR Repaired'
        };
      case 'RED':
      default:
        return {
          variantClass: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400',
          icon: <XCircle className={compact ? "size-3 text-red-600" : "size-3.5 text-red-600"} />,
          label: 'KaTeX Error'
        };
    }
  };

  const config = getBadgeConfig();
  const tooltipText = status === 'RED'
    ? (issues.length > 0
        ? `⚠️ Formula me error hai:\n• ${issues.map((i) => i.message).join('\n• ')}\n\nNeeche diye gaye '⚡ 1-Click Auto-Fix' button par click karke theek karein.`
        : '⚠️ Formula me error hai. Neeche diye gaye Auto-Fix button se theek karein.')
    : (issues.length > 0 ? issues.map((i) => i.message).join('\n') : config.label);

  return (
    <Button
      type="button"
      disabled
      variant="outline"
      size="sm"
      className={cn(
        "h-7 px-2.5 rounded-md text-xs font-semibold gap-1.5 shadow-none border pointer-events-auto cursor-default disabled:opacity-100",
        config.variantClass,
        className
      )}
      title={tooltipText}
    >
      {config.icon}
      <span>{config.label}</span>
    </Button>
  );
};



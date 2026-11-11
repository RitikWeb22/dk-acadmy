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
          variantClass: 'bg-emerald-50/90 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400',
          icon: <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />,
          label: 'Valid KaTeX'
        };
      case 'YELLOW':
        return {
          variantClass: 'bg-amber-50/90 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400',
          icon: <Sparkles className="size-3.5 text-amber-600 shrink-0" />,
          label: 'AI / OCR Repaired'
        };
      case 'RED':
      default:
        return {
          variantClass: 'bg-red-50/90 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400',
          icon: <XCircle className="size-3.5 text-red-600 shrink-0" />,
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
        "h-8 px-4 rounded-lg text-xs font-semibold gap-2 shadow-xs border pointer-events-auto cursor-default disabled:opacity-100 shrink-0 whitespace-nowrap",
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



import React from 'react';
import {
  Users,
  FolderKanban,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { KpiMetric } from '../types';
import { Badge } from './Badge';
import styles from './KpiRibbon.module.scss';

interface KpiRibbonProps {
  metrics: KpiMetric[];
  onCardClick?: (metricId: string) => void;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ metrics, onCardClick }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'kpi-students':
        return <Users size={16} />;
      case 'kpi-batches':
        return <FolderKanban size={16} />;
      case 'kpi-engine':
        return <Activity size={16} />;
      case 'kpi-leads':
        return <AlertCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getIconClass = (id: string) => {
    switch (id) {
      case 'kpi-students':
        return styles.iconBlue;
      case 'kpi-batches':
        return styles.iconIndigo;
      case 'kpi-engine':
        return styles.iconAmber;
      case 'kpi-leads':
        return styles.iconRose;
      default:
        return styles.iconBlue;
    }
  };

  const renderMiniSparkline = (points: number[], color: string) => {
    if (!points || points.length === 0) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${coords.join(' L ')}`;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.sparklineSvg}
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getSparklineColor = (metric: KpiMetric) => {
    if (metric.id === 'kpi-students') return '#2563EB';
    if (metric.id === 'kpi-batches') return '#D97706';
    if (metric.id === 'kpi-engine') return '#059669';
    return '#E11D48';
  };

  return (
    <section className={styles.kpiGrid} aria-label="Key Performance Indicators">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={styles.kpiCard}
          onClick={() => onCardClick?.(metric.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCardClick?.(metric.id);
            }
          }}
          title={`${metric.title}: ${metric.value} ${metric.unit}. Click to filter or inspect details.`}
        >
          {/* Top Row: Icon + Title (Left) and Badge (Right) */}
          <div className={styles.cardHeader}>
            <div className={styles.titleWrap}>
              <div className={`${styles.iconChip} ${getIconClass(metric.id)}`}>
                {getIcon(metric.id)}
              </div>
              <span className={styles.cardTitle}>{metric.title}</span>
            </div>

            <Badge
              variant={metric.badgeVariant}
              icon={
                metric.deltaType === 'positive' ? (
                  <TrendingUp size={11} />
                ) : metric.deltaType === 'negative' ? (
                  <TrendingDown size={11} />
                ) : (
                  <Minus size={11} />
                )
              }
            >
              {metric.badgeText}
            </Badge>
          </div>

          {/* Value + Sparkline Row */}
          <div className={styles.cardMiddle}>
            <div className={styles.valueRow}>
              <span className={styles.kpiValue}>{metric.value}</span>
              <span className={styles.kpiUnit}>{metric.unit}</span>
            </div>

            <div className={styles.sparklineBox}>
              {renderMiniSparkline(metric.sparkline, getSparklineColor(metric))}
            </div>
          </div>

          {/* Breakdown Subtitle */}
          <div className={styles.cardFooter}>
            <span className={styles.breakdownText} title={metric.breakdown}>
              {metric.breakdown}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
};

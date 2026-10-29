import React from 'react';
import {
  Users,
  MessageCircle,
  Video,
  CheckCircle2,
  TrendingUp,
  ArrowDownRight
} from 'lucide-react';
import type { FunnelStep } from '../types';
import styles from './AdmissionsFunnel.module.scss';

interface AdmissionsFunnelProps {
  steps: FunnelStep[];
}

export const AdmissionsFunnel: React.FC<AdmissionsFunnelProps> = ({ steps }) => {
  const getStageIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Users size={16} />;
      case 1:
        return <MessageCircle size={16} />;
      case 2:
        return <Video size={16} />;
      case 3:
        return <CheckCircle2 size={16} />;
      default:
        return <TrendingUp size={16} />;
    }
  };

  return (
    <div className={styles.funnelWrapper}>
      {/* Overview Stat Ribbon */}
      <div className={styles.funnelSummaryRow}>
        <div className={styles.summaryTile}>
          <span className={styles.summaryLabel}>Total Leads Analyzed</span>
          <span className={styles.summaryVal}>142 Inquiries</span>
        </div>
        <div className={styles.summaryTile}>
          <span className={styles.summaryLabel}>Demo Booking Rate</span>
          <span className={styles.summaryVal}>
            64.1% <span className={styles.positiveBadge}>+5.2%</span>
          </span>
        </div>
        <div className={styles.summaryTile}>
          <span className={styles.summaryLabel}>Demo to Enrolled Conversion</span>
          <span className={styles.summaryVal}>
            63.7% <span className={styles.positiveBadge}>Kota Top Decile</span>
          </span>
        </div>
        <div className={styles.summaryTile}>
          <span className={styles.summaryLabel}>Total Verified Admitted</span>
          <span className={styles.summaryVal}>58 Students</span>
        </div>
      </div>

      {/* Visual Funnel Step Bars */}
      <div className={styles.stepsContainer}>
        {steps.map((step, idx) => {
          const isFinal = idx === steps.length - 1;
          const prevStep = idx > 0 ? steps[idx - 1] : null;
          const stepConversion = prevStep
            ? Math.round((step.count / prevStep.count) * 100)
            : 100;

          return (
            <div key={step.stage} className={styles.funnelStepRow}>
              {/* Left Column: Icon + Stage Name */}
              <div className={styles.stageMeta}>
                <div className={styles.stageIconWrap}>
                  {getStageIcon(idx)}
                </div>
                <div className={styles.stageNameBlock}>
                  <span className={styles.stageTitle}>{step.stage}</span>
                  <span className={styles.stageCountText}>
                    <strong>{step.count}</strong> candidates
                  </span>
                </div>
              </div>

              {/* Middle Column: Width-proportional bar */}
              <div className={styles.barArea}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${step.conversionPct}%`,
                      backgroundColor: step.color
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Conversion & Drop-off stats */}
              <div className={styles.stepStats}>
                <span className={styles.conversionPct}>{step.conversionPct}% overall</span>
                {prevStep && (
                  <span className={styles.stepRetention}>
                    <ArrowDownRight size={11} />
                    <span>{stepConversion}% from prev stage</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight Note */}
      <div className={styles.insightNote}>
        <span className={styles.sparkleIcon}>⚡</span>
        <p className={styles.insightText}>
          <strong>Admissions Velocity Insight:</strong> Trial sessions taken personally with DK Sir on Saturday/Sunday convert at <strong>78.4%</strong>, compared to 49.2% for weekday video demo recordings.
        </p>
      </div>
    </div>
  );
};

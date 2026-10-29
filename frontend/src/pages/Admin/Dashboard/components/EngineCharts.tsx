import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Cpu
} from 'lucide-react';
import type { EngineHourlyLoad, MockExamPerformance } from '../types';
import styles from './EngineCharts.module.scss';

interface EngineChartsProps {
  hourlyLoad: EngineHourlyLoad[];
  mockPerformances: MockExamPerformance[];
}

export const EngineCharts: React.FC<EngineChartsProps> = ({
  hourlyLoad,
  mockPerformances
}) => {
  return (
    <div className={styles.engineChartsWrapper}>
      {/* Assessment Engine Metric Highlights */}
      <div className={styles.telemetryRibbon}>
        <div className={styles.telemetryCard}>
          <div className={styles.telemetryIconBox}>
            <Activity size={16} />
          </div>
          <div className={styles.telemetryText}>
            <span className={styles.telemetryLabel}>Live Test Runners</span>
            <div className={styles.telemetryValueRow}>
              <span className={styles.telemetryValue}>184</span>
              <span className={styles.telemetrySub}>Concurrent</span>
            </div>
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <div className={`${styles.telemetryIconBox} ${styles.iconEmerald}`}>
            <Zap size={16} />
          </div>
          <div className={styles.telemetryText}>
            <span className={styles.telemetryLabel}>Avg Response Latency</span>
            <div className={styles.telemetryValueRow}>
              <span className={styles.telemetryValue}>18ms</span>
              <span className={styles.telemetryBadge}>NTA Benchmark</span>
            </div>
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <div className={`${styles.telemetryIconBox} ${styles.iconIndigo}`}>
            <Server size={16} />
          </div>
          <div className={styles.telemetryText}>
            <span className={styles.telemetryLabel}>Active Question Bank</span>
            <div className={styles.telemetryValueRow}>
              <span className={styles.telemetryValue}>9 Mocks</span>
              <span className={styles.telemetrySub}>/ 24 DPP Sets</span>
            </div>
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <div className={`${styles.telemetryIconBox} ${styles.iconPurple}`}>
            <Cpu size={16} />
          </div>
          <div className={styles.telemetryText}>
            <span className={styles.telemetryLabel}>Monthly Evaluative Runs</span>
            <div className={styles.telemetryValueRow}>
              <span className={styles.telemetryValue}>1,280</span>
              <span className={styles.telemetrySub}>Evaluated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Visual Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Left Chart: Attempts Per Hour (Area Chart) */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Hourly Attempts &amp; Concurrent Load</h3>
              <span className={styles.panelSubtitle}>Live telemetry across AWS Mumbai node cluster (Today)</span>
            </div>
            <span className={styles.liveTag}>
              <span className={styles.pulseGreen} />
              <span>Live Telemetry</span>
            </span>
          </div>

          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={hourlyLoad} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                  formatter={(val: any, name: any) => [
                    val,
                    name === 'concurrentUsers' ? 'Concurrent Runners' : 'Attempts Completed'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="concurrentUsers"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#loadGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Average Score by Mock Exam (Bar Chart) */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Average Score by Mock Exam</h3>
              <span className={styles.panelSubtitle}>Cohorts 2026 – 2028 evaluative benchmarks</span>
            </div>
            <span className={styles.cohortTag}>Cohorts &apos;26–&apos;28</span>
          </div>

          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockPerformances} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="cohort" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} / ${item.payload.maxScore}`,
                    item.payload.mockName
                  ]}
                />
                <Bar dataKey="avgScore" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cluster Telemetry Logs */}
      <div className={styles.clusterStatusBar}>
        <div className={styles.clusterStatusItem}>
          <CheckCircle2 size={13} className={styles.statusSuccess} />
          <span>NTA Question Engine: 0 Dropped Packets</span>
        </div>
        <div className={styles.clusterStatusItem}>
          <CheckCircle2 size={13} className={styles.statusSuccess} />
          <span>Database Hot Replicas: 4/4 Synced</span>
        </div>
        <div className={styles.clusterStatusItem}>
          <Clock size={13} className={styles.statusMuted} />
          <span>Next Encrypted Backup: In 2 hrs 40 mins</span>
        </div>
      </div>
    </div>
  );
};

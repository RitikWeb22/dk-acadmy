import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { TrendingUp, Users } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import styles from './UsersAnalyticsCard.module.scss';

// Chronological timeline data matching IIT-JEE enrollment cycles
const USERS_GROWTH_DATA_12M = [
  { month: 'Nov 2025', enrolled: 120, classroom: 85, online: 35 },
  { month: 'Jan 2026', enrolled: 185, classroom: 130, online: 55 },
  { month: 'Mar 2026', enrolled: 260, classroom: 190, online: 70 },
  { month: 'May 2026', enrolled: 340, classroom: 245, online: 95 },
  { month: 'Jul 2026', enrolled: 410, classroom: 290, online: 120 },
  { month: 'Sep 2026', enrolled: 442, classroom: 312, online: 130 },
  { month: 'Nov 2026', enrolled: 450, classroom: 320, online: 130 }
];

const USERS_GROWTH_DATA_6M = [
  { month: 'May 2026', enrolled: 340, classroom: 245, online: 95 },
  { month: 'Jun 2026', enrolled: 380, classroom: 270, online: 110 },
  { month: 'Jul 2026', enrolled: 410, classroom: 290, online: 120 },
  { month: 'Aug 2026', enrolled: 428, classroom: 304, online: 124 },
  { month: 'Sep 2026', enrolled: 442, classroom: 312, online: 130 },
  { month: 'Oct 2026', enrolled: 450, classroom: 320, online: 130 }
];

const USERS_GROWTH_DATA_30D = [
  { month: 'Week 1', enrolled: 432, classroom: 308, online: 124 },
  { month: 'Week 2', enrolled: 438, classroom: 312, online: 126 },
  { month: 'Week 3', enrolled: 444, classroom: 316, online: 128 },
  { month: 'Week 4', enrolled: 450, classroom: 320, online: 130 }
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomUserTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.customTooltip}>
        <div className={styles.tooltipHeader}>
          <Users size={12} className={styles.tooltipIcon} />
          <span className={styles.tooltipDate}>{label}</span>
        </div>
        <div className={styles.tooltipTotalRow}>
          <span className={styles.tooltipLabel}>Total Aspirants:</span>
          <span className={styles.tooltipValue}>{data.enrolled}</span>
        </div>
        <div className={styles.tooltipDivider} />
        <div className={styles.tooltipBatchRow}>
          <span className={styles.batchDotClassroom} />
          <span className={styles.batchName}>Janakpuri Classroom:</span>
          <span className={styles.batchCount}>{data.classroom}</span>
        </div>
        <div className={styles.tooltipBatchRow}>
          <span className={styles.batchDotOnline} />
          <span className={styles.batchName}>Online LMS:</span>
          <span className={styles.batchCount}>{data.online}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const UsersAnalyticsCard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'12M' | '6M' | '30D'>('12M');
  const [liveGrowth, setLiveGrowth] = useState<Record<string, any[]> | null>(null);
  const [growthBadgeText, setGrowthBadgeText] = useState<string>('+34.2% YoY');

  const fetchUsersAnalytics = async () => {
    try {
      const res = await apiClient.get('/analytics');
      if (res.success) {
        if (res.charts?.userGrowth) {
          setLiveGrowth(res.charts.userGrowth);
        }
        if (res.summary?.comparisons?.studentsGrowth) {
          setGrowthBadgeText(res.summary.comparisons.studentsGrowth);
        }
      }
    } catch (err) {
      console.warn('[UsersAnalyticsCard] Live fetch error:', err);
    }
  };

  useEffect(() => {
    fetchUsersAnalytics();

    const handleRealtimeUpdate = () => {
      fetchUsersAnalytics();
    };

    window.addEventListener('dk_student_registered', handleRealtimeUpdate);
    window.addEventListener('dk_payment_success', handleRealtimeUpdate);
    window.addEventListener('dk_order_created', handleRealtimeUpdate);
    window.addEventListener('dk_cms_updated', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('dk_student_registered', handleRealtimeUpdate);
      window.removeEventListener('dk_payment_success', handleRealtimeUpdate);
      window.removeEventListener('dk_order_created', handleRealtimeUpdate);
      window.removeEventListener('dk_cms_updated', handleRealtimeUpdate);
    };
  }, []);

  const chartData = useMemo(() => {
    if (liveGrowth && liveGrowth[timeFilter] && liveGrowth[timeFilter].length > 0) {
      return liveGrowth[timeFilter];
    }
    return timeFilter === '12M'
      ? USERS_GROWTH_DATA_12M
      : timeFilter === '6M'
      ? USERS_GROWTH_DATA_6M
      : USERS_GROWTH_DATA_30D;
  }, [liveGrowth, timeFilter]);

  const maxVal = useMemo(() => {
    const vals = chartData.map((d: any) => d.enrolled || 0);
    return Math.max(100, ...vals);
  }, [chartData]);

  const yDomainMax = Math.ceil((maxVal * 1.15) / 50) * 50;

  return (
    <div className={styles.analyticsCard}>
      {/* Header with Title and Filter Dropdown */}
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.cardTitle}>Users Analytics</h2>
          <span className={styles.cardSubtitle}>
            (Aspirant enrollments over time)
          </span>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.growthBadge}>
            <TrendingUp size={13} />
            <span>{growthBadgeText}</span>
          </div>

          <div className={styles.selectWrapper}>
            <select
              aria-label="Filter Users Analytics timeframe"
              className={styles.timeSelect}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as '12M' | '6M' | '30D')}
            >
              <option value="12M">Last 12 Months ▾</option>
              <option value="6M">Last 6 Months ▾</option>
              <option value="30D">Last 30 Days ▾</option>
            </select>
          </div>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              domain={[0, yDomainMax]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
            />
            <Tooltip
              content={<CustomUserTooltip />}
              cursor={{ stroke: '#2563EB', strokeWidth: 1.5, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="enrolled"
              stroke="#2563EB"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#userGrowthGradient)"
              activeDot={{
                r: 6,
                fill: '#2563EB',
                stroke: '#FFFFFF',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

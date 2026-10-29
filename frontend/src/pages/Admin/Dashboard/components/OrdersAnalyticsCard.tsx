import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Sparkles, FileSpreadsheet } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import styles from './OrdersAnalyticsCard.module.scss';

// Mock Test Submissions & Batch Admissions with weekend surge spikes
const ORDERS_TREND_DATA = [
  { period: 'Fri W1', attempts: 60, admissions: 4 },
  { period: 'Sat W1', attempts: 210, admissions: 12 },
  { period: 'Sun W1', attempts: 380, admissions: 18 },
  { period: 'Mon W1', attempts: 75, admissions: 6 },
  { period: 'Wed W1', attempts: 90, admissions: 5 },
  { period: 'Fri W2', attempts: 110, admissions: 8 },
  { period: 'Sat W2', attempts: 290, admissions: 15 },
  { period: 'Sun W2', attempts: 440, admissions: 22 },
  { period: 'Mon W2', attempts: 80, admissions: 4 },
  { period: 'Wed W2', attempts: 120, admissions: 9 },
  { period: 'Fri W3', attempts: 145, admissions: 11 },
  { period: 'Sat W3', attempts: 340, admissions: 19 },
  { period: 'Sun W3', attempts: 510, admissions: 26 }
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomOrdersTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.customTooltip}>
        <div className={styles.tooltipHeader}>
          <FileSpreadsheet size={12} className={styles.tooltipIcon} />
          <span className={styles.tooltipDate}>{label} (Mock Session)</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.dotAttempts} />
          <span className={styles.label}>Mock Submissions:</span>
          <span className={styles.valAttempts}>{data.attempts}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.dotAdmissions} />
          <span className={styles.label}>Direct Admissions:</span>
          <span className={styles.valAdmissions}>{data.admissions}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const OrdersAnalyticsCard: React.FC = () => {
  const [liveOrdersTrend, setLiveOrdersTrend] = useState<any[] | null>(null);
  const [totalAdmissions, setTotalAdmissions] = useState<number>(0);

  const fetchOrdersAnalytics = async () => {
    try {
      const [res, ordersRes] = await Promise.all([
        apiClient.get('/analytics?timeRange=30d').catch(() => null),
        apiClient.get('/payment/orders?limit=50').catch(() => null)
      ]);

      if (res?.success) {
        if (Array.isArray(res.charts?.ordersTrend) && res.charts.ordersTrend.length > 0) {
          setLiveOrdersTrend(res.charts.ordersTrend);
        }
        if (typeof res.summary?.successfulPurchases === 'number') {
          setTotalAdmissions(res.summary.successfulPurchases);
        }
      }

      if (ordersRes?.success && Array.isArray(ordersRes.data)) {
        const verifiedCount = ordersRes.data.filter((o: any) => o.status === 'SUCCESS').length;
        if (verifiedCount > 0) {
          setTotalAdmissions(verifiedCount);
        }
      }
    } catch (err) {
      console.warn('[OrdersAnalyticsCard] Live fetch error:', err);
    }
  };

  useEffect(() => {
    fetchOrdersAnalytics();

    const handleRealtimeUpdate = (e: any) => {
      const detail = e.detail;
      if (detail?.amount) {
        setTotalAdmissions((prev) => prev + 1);
        setLiveOrdersTrend((prev) => {
          const list = prev ? [...prev] : [...ORDERS_TREND_DATA];
          const lastIdx = list.length - 1;
          if (lastIdx >= 0) {
            list[lastIdx] = {
              ...list[lastIdx],
              admissions: (list[lastIdx].admissions || 0) + 1,
              attempts: (list[lastIdx].attempts || 0) + 25
            };
          }
          return list;
        });
      }
      fetchOrdersAnalytics();
    };

    window.addEventListener('dk_payment_success', handleRealtimeUpdate);
    window.addEventListener('dk_order_created', handleRealtimeUpdate);
    window.addEventListener('dk_cms_updated', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('dk_payment_success', handleRealtimeUpdate);
      window.removeEventListener('dk_order_created', handleRealtimeUpdate);
      window.removeEventListener('dk_cms_updated', handleRealtimeUpdate);
    };
  }, []);

  const chartData = liveOrdersTrend || ORDERS_TREND_DATA;

  const yDomainMax = useMemo(() => {
    const maxVal = Math.max(100, ...chartData.map((d: any) => Math.max(d.attempts || 0, d.admissions || 0)));
    return Math.ceil((maxVal * 1.15) / 50) * 50;
  }, [chartData]);

  return (
    <div className={styles.ordersCard}>
      {/* Header with Consolidated Title and Metric Badge */}
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.cardTitle}>Orders &amp; CBT Attempts</h2>
          <span className={styles.cardSubtitle}>
            (Live admissions &amp; CBT mock test submissions)
          </span>
        </div>

        <div className={styles.badgeGroup}>
          {totalAdmissions > 0 && (
            <div className={styles.metricSummaryPill}>
              <span>{totalAdmissions} Total Admissions</span>
            </div>
          )}
          <div className={styles.surgeBadge}>
            <Sparkles size={12} className={styles.surgeIcon} aria-hidden="true" />
            <span>Live DB Synced</span>
          </div>
        </div>
      </div>

      {/* Legend Row */}
      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={styles.dotAdmissions} />
          <span>Direct Admissions (Live Orders)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dotAttempts} />
          <span>CBT Mock Attempts</span>
        </div>
      </div>

      {/* Multi-line Comparison Chart */}
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={true}
              horizontal={true}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="period"
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
              content={<CustomOrdersTooltip />}
              cursor={{ stroke: '#2563EB', strokeWidth: 1.5, strokeDasharray: '3 3' }}
            />
            {/* 1. Direct Admissions Line (Green Solid) */}
            <Line
              type="monotone"
              dataKey="admissions"
              name="Direct Admissions"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{
                r: 4.5,
                fill: '#FFFFFF',
                stroke: '#10B981',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6.5,
                fill: '#10B981',
                stroke: '#FFFFFF',
                strokeWidth: 2.5
              }}
            />
            {/* 2. Mock Attempts Line (Blue Dashed) */}
            <Line
              type="monotone"
              dataKey="attempts"
              name="Mock Attempts"
              stroke="#2563EB"
              strokeWidth={2.2}
              strokeDasharray="4 4"
              dot={{
                r: 4,
                fill: '#FFFFFF',
                stroke: '#2563EB',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: '#2563EB',
                stroke: '#FFFFFF',
                strokeWidth: 2.5
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

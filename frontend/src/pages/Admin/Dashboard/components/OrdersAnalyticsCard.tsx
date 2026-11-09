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
import { FileSpreadsheet, TrendingUp } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrdersAnalytics = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    const maxVal = Math.max(20, ...chartData.map((d: any) => Math.max(d.attempts || 0, d.admissions || 0)));
    return Math.ceil(maxVal * 1.2);
  }, [chartData]);

  const totalAttempts = useMemo(() => {
    return chartData.reduce((acc: number, cur: any) => acc + (cur.attempts || 0), 0);
  }, [chartData]);

  return (
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
      {/* Header with Title and Metric Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Orders &amp; CBT Attempts
            </h2>
            <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-[11px] font-medium border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Live Sync</span>
            </Badge>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Real-time correlation of paid admissions versus online CBT test submissions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300 rounded-full px-2.5 py-1">
            {totalAdmissions} Admissions · {totalAttempts} CBT Drills
          </Badge>
        </div>
      </div>

      {/* Legend Row placed below the card header with gap-4 */}
      <div className="flex items-center gap-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Direct Admissions (Live Orders)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">CBT Mock Attempts</span>
        </div>
      </div>

      {/* Multi-line Comparison Chart with Explicit Height */}
      <div className="w-full h-[280px] min-h-[280px] pt-2">
        {isLoading ? (
          <div className="w-full h-full flex flex-col justify-end gap-3 animate-pulse p-4">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
            <div className="h-48 bg-slate-100/70 dark:bg-slate-800/50 rounded-lg w-full" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No data yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Order and CBT test attempts will appear here as activity occurs.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={true}
                horizontal={true}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                domain={[0, yDomainMax]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
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
        )}
      </div>
    </Card>
  );
};

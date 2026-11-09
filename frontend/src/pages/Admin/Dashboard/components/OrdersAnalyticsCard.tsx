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
import { ClipboardList } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { Card } from '@/components/ui/card';

const ORDERS_CHART_DEFAULT = [
  { day: 'Tue, Nov 3', admissions: 1, attempts: 88 },
  { day: 'Wed, Nov 4', admissions: 0, attempts: 58 },
  { day: 'Thu, Nov 5', admissions: 0, attempts: 56 },
  { day: 'Fri, Nov 6', admissions: 0, attempts: 55 },
  { day: 'Sat, Nov 7', admissions: 1, attempts: 158 },
  { day: 'Yesterday', admissions: 0, attempts: 158 },
  { day: 'Today', admissions: 0, attempts: 52 }
];

export const OrdersAnalyticsCard: React.FC = () => {
  const [totalAdmissions, setTotalAdmissions] = useState<number>(1);
  const [totalAttempts, setTotalAttempts] = useState<number>(645);
  const [chartData, setChartData] = useState<any[]>(ORDERS_CHART_DEFAULT);

  const fetchOrdersAnalytics = async () => {
    try {
      const res = await apiClient.get('/analytics?timeRange=30d');
      if (res.success) {
        if (typeof res.summary?.successfulPurchases === 'number' && res.summary.successfulPurchases > 0) {
          setTotalAdmissions(res.summary.successfulPurchases);
        }
      }
    } catch (err) {
      console.warn('[OrdersAnalyticsCard] fetch fallback:', err);
    }
  };

  useEffect(() => {
    fetchOrdersAnalytics();

    const handleUpdate = () => fetchOrdersAnalytics();
    window.addEventListener('dk_payment_success', handleUpdate);
    window.addEventListener('dk_order_created', handleUpdate);

    return () => {
      window.removeEventListener('dk_payment_success', handleUpdate);
      window.removeEventListener('dk_order_created', handleUpdate);
    };
  }, []);

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#245BFF] flex items-center justify-center shrink-0">
              <ClipboardList size={18} />
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-[#111B34] dark:text-slate-100 tracking-tight">
                Orders &amp; CBT Attempts
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                Live Sync
              </span>
            </div>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Real-time correlation of paid admissions versus online CBT test submissions
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0 pt-1">
          {totalAdmissions} Admissions · {totalAttempts} CBT Drills
        </div>
      </div>

      {/* Legend Row */}
      <div className="flex items-center gap-5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
            Direct Admissions (Live Orders)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#245BFF] shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
            CBT Mock Attempts
          </span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="w-full h-[220px] pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={true}
              horizontal={true}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: '#F1F5F9' }}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              domain={[0, 192]}
              ticks={[0, 50, 100, 150, 192]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-md space-y-1">
                      <div className="font-semibold text-slate-200">{label}</div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <span>● Direct Admissions:</span>
                        <span className="font-bold">{payload[0]?.value}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400">
                        <span>● CBT Mock Attempts:</span>
                        <span className="font-bold">{payload[1]?.value}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Direct Admissions (Green Solid) */}
            <Line
              type="monotone"
              dataKey="admissions"
              name="Direct Admissions"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: '#FFFFFF',
                stroke: '#10B981',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: '#10B981',
                stroke: '#FFFFFF',
                strokeWidth: 2
              }}
            />
            {/* CBT Mock Attempts (Blue Dashed) */}
            <Line
              type="monotone"
              dataKey="attempts"
              name="CBT Mock Attempts"
              stroke="#245BFF"
              strokeWidth={2.2}
              strokeDasharray="4 4"
              dot={{
                r: 4,
                fill: '#FFFFFF',
                stroke: '#245BFF',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: '#245BFF',
                stroke: '#FFFFFF',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

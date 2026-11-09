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
import { Users, GraduationCap, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { Card } from '@/components/ui/card';

// Enrollment growth timeline matching the reference display
const USERS_GROWTH_DEFAULT = [
  { month: 'Nov 2025', enrolled: 3, classroom: 2, online: 1 },
  { month: 'Jan 2026', enrolled: 5.5, classroom: 4, online: 1.5 },
  { month: 'Mar 2026', enrolled: 7.5, classroom: 5, online: 2.5 },
  { month: 'May 2026', enrolled: 9, classroom: 6, online: 3 },
  { month: 'Jul 2026', enrolled: 10.5, classroom: 7, online: 3.5 },
  { month: 'Sep 2026', enrolled: 12, classroom: 8, online: 4 },
  { month: 'Today', enrolled: 13, classroom: 9, online: 4 }
];

const USERS_GROWTH_12M = [
  { month: 'Nov 2025', enrolled: 3, classroom: 2, online: 1 },
  { month: 'Jan 2026', enrolled: 5.5, classroom: 4, online: 1.5 },
  { month: 'Mar 2026', enrolled: 7.5, classroom: 5, online: 2.5 },
  { month: 'May 2026', enrolled: 9, classroom: 6, online: 3 },
  { month: 'Jul 2026', enrolled: 10.5, classroom: 7, online: 3.5 },
  { month: 'Sep 2026', enrolled: 12, classroom: 8, online: 4 },
  { month: 'Today', enrolled: 13, classroom: 9, online: 4 }
];

const USERS_GROWTH_30D = [
  { month: 'Week 1', enrolled: 10, classroom: 7, online: 3 },
  { month: 'Week 2', enrolled: 11, classroom: 8, online: 3 },
  { month: 'Week 3', enrolled: 12, classroom: 8, online: 4 },
  { month: 'Today', enrolled: 13, classroom: 9, online: 4 }
];

export const UsersAnalyticsCard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'12M' | '6M' | '30D'>('6M');
  const [liveGrowth, setLiveGrowth] = useState<Record<string, any[]> | null>(null);
  const [enrolledCount, setEnrolledCount] = useState<number>(13);
  const [classroomCount, setClassroomCount] = useState<number>(9);
  const [onlineCount, setOnlineCount] = useState<number>(4);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchUsersAnalytics = async () => {
    try {
      const res = await apiClient.get('/analytics');
      if (res.success) {
        if (res.charts?.userGrowth) {
          setLiveGrowth(res.charts.userGrowth);
        }
        if (typeof res.summary?.totalStudents === 'number') {
          setEnrolledCount(res.summary.totalStudents);
        }
      }
    } catch (err) {
      console.warn('[UsersAnalyticsCard] fetch error:', err);
    }
  };

  useEffect(() => {
    fetchUsersAnalytics();

    const handleUpdate = () => fetchUsersAnalytics();
    window.addEventListener('dk_student_registered', handleUpdate);
    window.addEventListener('dk_payment_success', handleUpdate);
    window.addEventListener('dk_order_created', handleUpdate);

    return () => {
      window.removeEventListener('dk_student_registered', handleUpdate);
      window.removeEventListener('dk_payment_success', handleUpdate);
      window.removeEventListener('dk_order_created', handleUpdate);
    };
  }, []);

  const chartData = useMemo(() => {
    if (liveGrowth && liveGrowth[timeFilter] && liveGrowth[timeFilter].length > 0) {
      return liveGrowth[timeFilter];
    }
    if (timeFilter === '12M') return USERS_GROWTH_12M;
    if (timeFilter === '30D') return USERS_GROWTH_30D;
    return USERS_GROWTH_DEFAULT;
  }, [liveGrowth, timeFilter]);

  const renderCustomDot = (props: any) => {
    const { cx, cy, index } = props;
    const isLast = index === chartData.length - 1;
    return (
      <g key={`dot-${index}`}>
        <circle cx={cx} cy={cy} r={4} fill="#245BFF" stroke="#FFFFFF" strokeWidth={2} />
        {isLast && (
          <g transform={`translate(${cx - 56}, ${cy - 36})`}>
            <rect
              width={108}
              height={26}
              rx={13}
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth={1}
              style={{ filter: 'drop-shadow(0 2px 6px rgba(16, 28, 56, 0.12))' }}
            />
            <text x={12} y={17} fontSize={11} fontWeight={600} fill="#1E293B">
              Today
            </text>
            <circle cx={48} cy={13} r={3} fill="#245BFF" />
            <text x={55} y={17} fontSize={11} fontWeight={700} fill="#1E293B">
              {enrolledCount} Aspirants
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#245BFF] flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#111B34] dark:text-slate-100 tracking-tight">
              Users Analytics
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 tabular-nums">
              <TrendingUp size={11} />
              <span>+{enrolledCount} enrolled</span>
            </span>
          </div>
        </div>

        {/* Timeframe segmented switcher */}
        <div className="inline-flex items-center bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setTimeFilter('12M')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              timeFilter === '12M'
                ? 'bg-[#245BFF] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            12 Months
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('6M')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              timeFilter === '6M'
                ? 'bg-[#245BFF] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('30D')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              timeFilter === '30D'
                ? 'bg-[#245BFF] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <span>30 Days</span>
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* 3 Metric Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        {/* Chip 1: Aspirants (Current Enrolled) */}
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-[#FBFBFF] dark:bg-slate-800/40 p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#245BFF] flex items-center justify-center shrink-0">
            <Users size={19} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-[#111B34] dark:text-slate-100 tabular-nums leading-tight">
              {enrolledCount}
            </span>
            <span className="text-xs font-semibold text-[#111B34] dark:text-slate-200 mt-0.5">
              Aspirants
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate">
              (Current Enrolled)
            </span>
          </div>
        </div>

        {/* Chip 2: Students (Classroom Batches) */}
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-[#FBFBFF] dark:bg-slate-800/40 p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7955EF] flex items-center justify-center shrink-0">
            <GraduationCap size={19} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-[#111B34] dark:text-slate-100 tabular-nums leading-tight">
              {classroomCount}
            </span>
            <span className="text-xs font-semibold text-[#111B34] dark:text-slate-200 mt-0.5">
              Students
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate">
              (Classroom Batches)
            </span>
          </div>
        </div>

        {/* Chip 3: Active (Online LMS) */}
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-[#FBFBFF] dark:bg-slate-800/40 p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] flex items-center justify-center shrink-0">
            <Zap size={19} className="fill-[#10B981]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-[#111B34] dark:text-slate-100 tabular-nums leading-tight">
              {onlineCount}
            </span>
            <span className="text-xs font-semibold text-[#111B34] dark:text-slate-200 mt-0.5">
              Active
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate">
              (Online LMS)
            </span>
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="w-full h-[230px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 38, right: 18, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="userGrowthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#245BFF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#245BFF" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#F1F5F9' }}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              domain={[0, 18]}
              ticks={[0, 5, 10, 15, 18]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-xs shadow-md">
                      <div className="font-semibold">{d.month}</div>
                      <div className="text-[11px] text-slate-300">Total: {d.enrolled} Aspirants</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="enrolled"
              stroke="#245BFF"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#userGrowthAreaGradient)"
              dot={renderCustomDot}
              activeDot={{
                r: 6,
                fill: '#245BFF',
                stroke: '#FFFFFF',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

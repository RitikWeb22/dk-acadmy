import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { Card } from '@/components/ui/card';

interface TransactionItem {
  id: string;
  studentName: string;
  amount: string;
  timestamp: string;
  batchName?: string;
  avatarBg: string;
}

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: '#1024',
    studentName: 'dharmendra kumar',
    batchName: 'DPP-05: Straight Lines & Coordination',
    amount: '₹299',
    timestamp: '2d ago',
    avatarBg: 'bg-[#101C38] text-white'
  },
  {
    id: '#1023',
    studentName: 'Rashi Goyal',
    batchName: 'JEE Main 2027 Full Syllabus Series 4 (CBT Test Series)',
    amount: '₹500',
    timestamp: '4d ago',
    avatarBg: 'bg-[#7955EF] text-white'
  },
  {
    id: '#1022',
    studentName: 'sonam',
    batchName: 'PYQ Archive: Definite Integrals (JEE Main)',
    amount: '₹10',
    timestamp: '5d ago',
    avatarBg: 'bg-[#0D9488] text-white'
  }
];

export const RecentTransactionsCard: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionItem[]>(DEFAULT_TRANSACTIONS);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get('/payment/orders?limit=10');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const bgColors = ['bg-[#101C38] text-white', 'bg-[#7955EF] text-white', 'bg-[#0D9488] text-white', 'bg-[#2563EB] text-white'];
          const mapped = res.data.slice(0, 3).map((o: any, idx: number) => {
            const dateObj = new Date(o.createdAt || Date.now());
            const diffHours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60));
            let timestamp = 'Just now';
            if (diffHours < 1) timestamp = 'Just now';
            else if (diffHours < 24) timestamp = `${diffHours}h ago`;
            else {
              const diffDays = Math.floor(diffHours / 24);
              timestamp = `${diffDays}d ago`;
            }

            // Display clean # ID
            const shortNum = 1024 - idx;
            const displayId = `#${shortNum}`;

            return {
              id: displayId,
              studentName: o.studentName || 'Student Aspirant',
              batchName: o.courseTitle || 'JEE Ultimate Classroom',
              amount: `₹${Number(o.amount || 0).toLocaleString('en-IN')}`,
              timestamp,
              avatarBg: bgColors[idx % bgColors.length]
            };
          });

          if (isMounted) {
            setTransactions(mapped);
          }
        }
      } catch (err) {
        console.warn('[RecentTransactionsCard] Fetch fallback:', err);
      }
    };

    fetchOrders();

    const handleNewPayment = () => fetchOrders();
    window.addEventListener('dk_payment_success', handleNewPayment);
    window.addEventListener('dk_order_created', handleNewPayment);

    return () => {
      isMounted = false;
      window.removeEventListener('dk_payment_success', handleNewPayment);
      window.removeEventListener('dk_order_created', handleNewPayment);
    };
  }, []);

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#245BFF] flex items-center justify-center shrink-0">
              <Receipt size={18} />
            </div>
            <h2 className="text-base font-bold text-[#111B34] dark:text-slate-100 tracking-tight">
              Recent Transactions
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Live Feed
          </span>
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Real-time student fee completions
        </p>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto my-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
              <th scope="col" className="py-2.5 pr-3 font-semibold">#</th>
              <th scope="col" className="py-2.5 px-3 font-semibold">Student</th>
              <th scope="col" className="py-2.5 px-3 text-right font-semibold">Amount</th>
              <th scope="col" className="py-2.5 pl-3 text-right font-semibold">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {transactions.map((txn, idx) => (
              <tr key={txn.id + idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 pr-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {txn.id}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-7 w-7 rounded-full ${txn.avatarBg} font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-xs`}>
                      {txn.studentName.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[#111B34] dark:text-slate-100 text-xs truncate" title={txn.studentName}>
                        {txn.studentName}
                      </span>
                      {txn.batchName && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight max-w-[170px]" title={txn.batchName}>
                          {txn.batchName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-bold text-xs text-[#111B34] dark:text-slate-100 tabular-nums whitespace-nowrap">
                  {txn.amount}
                </td>
                <td className="py-3 pl-3 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                  {txn.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Link */}
      <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => navigate('/admin/invoices')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#245BFF] hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
        >
          <span>View All Transactions</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </Card>
  );
};

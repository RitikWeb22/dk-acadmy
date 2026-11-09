import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TransactionItem {
  id: string;
  studentName: string;
  amount: string;
  timestamp: string;
  batchName?: string;
  status: 'completed' | 'processing';
}

const SAMPLE_TRANSACTIONS: TransactionItem[] = [];

const mapOrderToTxn = (o: any): TransactionItem => {
  const dateObj = new Date(o.createdAt || Date.now());
  const diffHours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60));
  let timestamp = 'Just now';
  if (diffHours < 1) timestamp = 'Just now';
  else if (diffHours < 24) timestamp = `${diffHours}h ago`;
  else {
    const diffDays = Math.floor(diffHours / 24);
    timestamp = `${diffDays}d ago`;
  }

  const shortId = o.paymentId
    ? `${o.paymentId.slice(0, 8)}...`
    : o.orderId
    ? `${o.orderId.slice(0, 8)}...`
    : `TXN_${(o._id || '').slice(-6)}...`;

  return {
    id: shortId,
    studentName: o.studentName || 'Student Aspirant',
    amount: `₹${Number(o.amount || 0).toLocaleString('en-IN')}`,
    timestamp,
    batchName: o.courseTitle || 'JEE Ultimate Classroom',
    status: o.status === 'SUCCESS' ? 'completed' : 'processing'
  };
};

export const RecentTransactionsCard: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>(SAMPLE_TRANSACTIONS);
  const [page, setPage] = useState(1);
  const rowsPerPage = 4;

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get('/payment/orders?limit=30');
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(mapOrderToTxn);
          if (isMounted) {
            setTransactions(mapped);
          }
        }
      } catch (err) {
        console.warn('[RecentTransactionsCard] Fetch fallback:', err);
      }
    };

    fetchOrders();

    const handleNewPayment = (e: any) => {
      const p = e.detail;
      if (!p) {
        fetchOrders();
        return;
      }
      const id = p.paymentId
        ? `${p.paymentId.slice(0, 8)}...`
        : p.orderId
        ? `${p.orderId.slice(0, 8)}...`
        : `TXN_${Date.now().toString().slice(-4)}...`;

      const newTxn: TransactionItem = {
        id,
        studentName: p.studentName || 'Student Aspirant',
        amount: `₹${Number(p.amount || 0).toLocaleString('en-IN')}`,
        timestamp: 'Just now',
        batchName: p.courseTitle || 'JEE Ultimate Classroom',
        status: p.status === 'SUCCESS' ? 'completed' : 'processing'
      };

      setTransactions((prev) => {
        if (prev.some((t) => t.id === newTxn.id)) return prev;
        return [newTxn, ...prev];
      });
      setPage(1);
    };

    const handleCMSUpdate = (e: any) => {
      const d = e.detail;
      if (d?.type === 'orders' || d?.type === 'enrollment' || !d?.type) {
        fetchOrders();
      }
    };

    window.addEventListener('dk_payment_success', handleNewPayment);
    window.addEventListener('dk_order_created', handleNewPayment);
    window.addEventListener('dk_cms_updated', handleCMSUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('dk_payment_success', handleNewPayment);
      window.removeEventListener('dk_order_created', handleNewPayment);
      window.removeEventListener('dk_cms_updated', handleCMSUpdate);
    };
  }, []);

  const totalRows = transactions.length;
  const startIndex = (page - 1) * rowsPerPage;
  const currentSlice = transactions.slice(startIndex, startIndex + rowsPerPage);

  return (
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Recent Transactions
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Real-time student fee completions
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          Live Feed
        </span>
      </div>

      {/* Real Table with Fixed Column Widths */}
      <div className="w-full overflow-x-auto my-2.5">
        <table className="w-full table-fixed text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
              <th scope="col" className="w-[18%] px-4 py-3">ID</th>
              <th scope="col" className="w-[42%] px-4 py-3">Student</th>
              <th scope="col" className="w-[20%] px-4 py-3 text-right">Amount</th>
              <th scope="col" className="w-[20%] px-4 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentSlice.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-28 text-center text-xs text-slate-400 dark:text-slate-500">
                  No recent fee transactions found.
                </td>
              </tr>
            ) : (
              currentSlice.map((txn, idx) => (
                <tr key={txn.id + idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="w-[18%] px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 break-all" title={txn.id}>
                    {txn.id}
                  </td>
                  <td className="w-[42%] px-4 py-3.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs break-words" title={txn.studentName}>
                        {txn.studentName}
                      </span>
                      {txn.batchName && (
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 break-words leading-snug" title={txn.batchName}>
                          {txn.batchName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="w-[20%] px-4 py-3.5 text-right font-semibold text-xs text-slate-900 dark:text-slate-100 tabular-nums">
                    {txn.amount}
                  </td>
                  <td className="w-[20%] px-4 py-3.5 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {txn.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {totalRows === 0 ? '0 of 0' : `${startIndex + 1}–${Math.min(startIndex + rowsPerPage, totalRows)} of ${totalRows}`}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            disabled={page * rowsPerPage >= totalRows}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

    // Listen to real-time payment, order creation, and CMS broadcasts
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
    <Card className="border-border/60 bg-card overflow-hidden flex flex-col flex-1">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5 space-y-0 border-b border-border/40">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Recent Transactions
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Real-time student fee completions
          </CardDescription>
        </div>
        <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-[11px] font-normal border-border/70 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Feed</span>
        </Badge>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-border/40">
          {currentSlice.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No recent fee transactions found.
            </div>
          ) : (
            currentSlice.map((txn, idx) => (
              <div
                key={txn.id + idx}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs bg-muted/80 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50 shrink-0">
                    {txn.id}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {txn.studentName}
                    </span>
                    {txn.batchName && (
                      <span className="text-xs text-muted-foreground line-clamp-1" title={txn.batchName}>
                        {txn.batchName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-foreground tabular-nums">
                    {txn.amount}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {txn.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/40 px-5 py-2.5 bg-muted/20">
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalRows === 0 ? '0 of 0' : `${startIndex + 1}–${Math.min(startIndex + rowsPerPage, totalRows)} of ${totalRows}`}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md"
            disabled={page * rowsPerPage >= totalRows}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

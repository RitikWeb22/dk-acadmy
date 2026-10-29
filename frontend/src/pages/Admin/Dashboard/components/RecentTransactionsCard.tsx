import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import styles from './RecentTransactionsCard.module.scss';

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
  const rowsPerPage = 3;

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
    <div className={styles.transactionsCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleWrap}>
          <h2 className={styles.cardTitle}>Recent Transactions</h2>
          <span className={styles.cardSubtitle}>
            Real-time student fee completions
          </span>
        </div>

        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          <span>Live Feed</span>
        </div>
      </div>

      {/* Compact Data Table with clean scroll */}
      <div className={styles.tableScrollContainer}>
        <table className={styles.transactionTable}>
          <thead>
            <tr>
              <th scope="col" className={styles.thId}>ID</th>
              <th scope="col" className={styles.thStudent}>Student Name</th>
              <th scope="col" className={styles.thAmount}>Amount</th>
              <th scope="col" className={styles.thTime}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {currentSlice.map((txn, idx) => (
              <tr key={txn.id + idx} className={styles.txnRow}>
                <td className={styles.idCell}>
                  <code className={styles.txnCode}>{txn.id}</code>
                </td>
                <td className={styles.studentCell}>
                  <div className={styles.nameBlock}>
                    <span className={styles.studentName}>{txn.studentName}</span>
                    {txn.batchName && (
                      <span className={styles.batchTag}>{txn.batchName}</span>
                    )}
                  </div>
                </td>
                <td className={styles.amountCell}>
                  <span className={styles.amountText}>{txn.amount}</span>
                </td>
                <td className={styles.timeCell}>
                  <span className={styles.timeText}>{txn.timestamp}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Streamlined Pagination */}
      <div className={styles.cardFooter}>
        <div className={styles.paginationInfo}>
          <span className={styles.paginationSummary}>
            {totalRows === 0 ? '0 of 0' : `${startIndex + 1}–${Math.min(startIndex + rowsPerPage, totalRows)} of ${totalRows}`}
          </span>
        </div>

        <div className={styles.paginationActions}>
          <button
            type="button"
            className={styles.pageArrowBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.pageArrowBtn}
            disabled={page * rowsPerPage >= totalRows}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

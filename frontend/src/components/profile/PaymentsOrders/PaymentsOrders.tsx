import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { StudentProfile } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { apiClient } from '../../../services/apiClient';
import {
  Receipt,
  Download,
  Calendar,
  CheckCircle2,
  Check,
  Copy,
  PlayCircle,
  ChevronRight,
  Headphones,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { getStudentWhatsAppUrl } from '../../../utils/whatsapp';
import styles from './PaymentsOrders.module.scss';

export interface OrderRecord {
  orderId: string;
  courseId: string;
  courseTitle: string;
  status: 'Paid in Full' | 'Verified Active';
  enrollmentStatus: string;
  paymentGateway: string;
  orderDate: string;
  campusTag: string;
  batchStartTag: string;
  validityTag: string;
  price: string;
  isFree: boolean;
  baseTuition: string;
  gstAmount: string;
  totalAmount: string;
}

interface PaymentsOrdersProps {
  student: StudentProfile;
}

export const PaymentsOrders: React.FC<PaymentsOrdersProps> = ({ student }) => {
  const { showToast } = useToast();
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedGstin, setCopiedGstin] = useState(false);

  const officialGstin = '07AABCU9603R1ZM';
  const officialSac = '999293';

  const handleCopyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(`#${orderId}`);
      setCopiedOrderId(orderId);
      showToast(`Order ID #${orderId} copied to clipboard!`, 'info');
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch {
      showToast(`Order ID #${orderId}`, 'info');
    }
  };

  const handleCopyGstin = async () => {
    try {
      await navigator.clipboard.writeText(officialGstin);
      setCopiedGstin(true);
      showToast(`Official GSTIN ${officialGstin} copied to clipboard!`, 'info');
      setTimeout(() => setCopiedGstin(false), 2000);
    } catch {
      showToast(`GSTIN: ${officialGstin}`, 'info');
    }
  };

  const handleDownloadInvoice = (order: OrderRecord) => {
    const isFree = order.isFree;
    const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - #${order.orderId}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; margin: 0; background: #ffffff; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 24px; }
    .brand-title { font-size: 26px; font-weight: 800; color: #1e3a8a; margin: 0; letter-spacing: -0.02em; }
    .brand-meta { font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 8px; }
    .status-badge { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 5px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; }
    .order-meta-box { margin-top: 10px; font-size: 13px; color: #475569; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; background: #f8fafc; border: 1px solid #e2e8f0; padding: 22px; border-radius: 12px; }
    .info-col h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    .info-col p { margin: 4px 0; font-size: 14px; font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 28px 0; }
    th { background: #f1f5f9; text-align: left; padding: 12px 14px; font-size: 13px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
    td { padding: 16px 14px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
    .total-row td { font-weight: 800; font-size: 16px; color: #1e3a8a; border-top: 2px solid #2563eb; background: #faf5ff; }
    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">DK ACADEMY JEE</h1>
      <p class="brand-meta">Premier IIT-JEE Mathematics Coaching by DK Sir (Ex-IITian)<br>
      C4F/33, Behind F Market, Janakpuri, New Delhi - 110058<br>
      <strong>GSTIN:</strong> 07AABCU9603R1ZM | <strong>SAC Code:</strong> 999293 (Educational Coaching Services)</p>
    </div>
    <div style="text-align: right;">
      <span class="status-badge">${isFree ? '100% MERIT SCHOLARSHIP' : 'PAID IN FULL'}</span>
      <div class="order-meta-box">
        <p style="margin: 6px 0;"><strong>Invoice / Order:</strong> #${order.orderId}</p>
        <p style="margin: 4px 0;"><strong>Date:</strong> ${order.orderDate.replace('Enrolled ', '')}</p>
        <p style="margin: 4px 0;"><strong>Mode:</strong> ${order.paymentGateway}</p>
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-col">
      <h4>Billed To (Student Information):</h4>
      <p><strong>Name:</strong> ${student.name}</p>
      <p><strong>Student ID:</strong> ${student.id}</p>
      <p><strong>Phone:</strong> +91 ${student.phone || '98765 43210'}</p>
      <p><strong>Email:</strong> ${student.email || 'student@dkacademyjee.com'}</p>
    </div>
    <div class="info-col">
      <h4>Course &amp; Academic Enrollment:</h4>
      <p><strong>Course Title:</strong> ${order.courseTitle}</p>
      <p><strong>Target Exam:</strong> ${student.targetExam || 'JEE Main & Advanced'}</p>
      <p><strong>Batch / Campus:</strong> ${order.campusTag}</p>
      <p><strong>Enrollment Status:</strong> ${order.enrollmentStatus} (Session 2026–2028)</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>HSN / SAC</th>
        <th>Base Tuition</th>
        <th>GST (18% IGST)</th>
        <th style="text-align: right;">Total Fee</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${order.courseTitle}</strong><br>
          <small style="color: #64748b;">${order.campusTag} • ${order.batchStartTag} • ${order.validityTag}</small>
        </td>
        <td>999293</td>
        <td>${order.baseTuition}</td>
        <td>${order.gstAmount}</td>
        <td style="text-align: right; font-weight: 700;">${isFree ? '₹0.00' : order.price}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" style="text-align: right;">TOTAL ADMISSION AMOUNT PAID (INCL. 18% GST):</td>
        <td style="text-align: right;">${isFree ? '₹0.00 (Scholarship)' : order.totalAmount}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>This is a verified computer-generated GST tax receipt and admission confirmation from DK Academy JEE.<br>
    Helpline: +91 93259 87875 | Accounts Desk: +91 97171 59062 | Janakpuri Center, New Delhi</p>
  </div>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DK_Academy_Invoice_${order.orderId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`📄 Downloaded GST Tax Invoice #${order.orderId}`, 'success');
  };

  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchStudentOrders = async () => {
      try {
        const res = await apiClient.get('/payment/my-orders');
        if (res.success && Array.isArray(res.data) && isMounted) {
          const successOnly = res.data.filter((o: any) => o.status === 'SUCCESS');
          const mapped: OrderRecord[] = successOnly.map((o: any) => {
            const gross = Number(o.amount || 0);
            const base = Math.round(gross / 1.18);
            const gst = gross - base;
            const dateObj = new Date(o.createdAt || Date.now());
            const formattedDate = `Enrolled ${dateObj.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}`;
            const isFree = gross === 0;

            return {
              orderId: o.orderId || o.paymentId || 'ORD-VERIFIED',
              courseId: o.courseId || 'jee-course',
              courseTitle: o.courseTitle || 'DK Sir JEE Mathematics Batch',
              status: 'Paid in Full',
              enrollmentStatus: 'Admission Confirmed',
              paymentGateway: o.paymentGateway ? `${o.paymentGateway} • Online Payment` : 'Razorpay • UPI / NetBanking',
              orderDate: formattedDate,
              campusTag: 'Digital LMS & Classroom',
              batchStartTag: 'Batch Start: Immediate Active',
              validityTag: 'Validity: 2 Years',
              price: isFree ? '₹0 Free' : `₹${gross.toLocaleString('en-IN')}`,
              isFree,
              baseTuition: `₹${base.toLocaleString('en-IN')}`,
              gstAmount: `₹${gst.toLocaleString('en-IN')}`,
              totalAmount: isFree ? '₹0.00 (100% Free Scholarship)' : `₹${gross.toLocaleString('en-IN')}`
            };
          });
          setOrders(mapped);
        }
      } catch (err) {
        console.warn('[PaymentsOrders] Error loading orders:', err);
      }
    };

    fetchStudentOrders();
    return () => {
      isMounted = false;
    };
  }, [student.id, student.email]);

  const whatsappAccountsUrl = getStudentWhatsAppUrl({
    studentName: student.name,
    targetBatch: 'Fee Receipts & GST Invoicing Desk',
    currentClass: student.targetClass,
    question: 'I have a query regarding my admission fee receipt, GST tax invoice, or installment schedule.'
  });

  return (
    <div className={styles.container}>
      {/* 1. Main Card Container */}
      <div className={styles.mainCard}>
        {/* Section Header & Quick Summary */}
        <div className={styles.cardHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconBox}>
              <Receipt size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Payments &amp; Order History</h2>
              <p className={styles.cardSubtitle}>
                Official admission slips, verified fee transactions, and downloadable GST tax receipts.
              </p>
            </div>
          </div>

          <div className={styles.headerRightBadge}>
            <span className={styles.metricPillBadge} role="status">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>
                {orders.length} {orders.length === 1 ? 'Enrolled Batch' : 'Enrolled Batches'} • {orders.length > 0 ? 'All Verified' : 'Clean Account'}
              </span>
            </span>
          </div>
        </div>

        {/* 2. Order History Cards (or Fresh Empty State for New Students) */}
        {orders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px' }}>
            <Receipt size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: 700 }}>
              No Orders or Fee Receipts Yet
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#64748b', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
              When you enroll in classroom coaching batches, test series, or study modules, your official GST tax invoices and admission payment records will be securely archived here.
            </p>
            <Link
              to="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>Explore Classroom Batches</span>
              <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList} role="region" aria-label="Enrolled Orders List">
            {orders.map((order) => {
            const isCopied = copiedOrderId === order.orderId;

            return (
              <article key={order.orderId} className={styles.orderCard}>
                {/* Top Meta Row */}
                <div className={styles.topMetaRow}>
                  <div className={styles.topMetaLeft}>
                    {/* Bold Order ID with One-Click Copy */}
                    <div className={styles.orderIdGroup}>
                      <span className={styles.orderIdText}>#{order.orderId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyOrderId(order.orderId)}
                        className={styles.copyIdBtn}
                        title={`Copy Order ID #${order.orderId}`}
                        aria-label={`Copy Order ID #${order.orderId}`}
                      >
                        {isCopied ? (
                          <Check size={13} className={styles.copiedCheckIcon} aria-hidden="true" />
                        ) : (
                          <Copy size={13} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {/* Transaction Badges */}
                    <div className={styles.badgesCluster}>
                      {/* Status: Solid emerald soft-badge */}
                      <span className={styles.statusBadge}>
                        <Check size={11} aria-hidden="true" />
                        <span>Paid in Full</span>
                      </span>

                      {/* Enrollment: Deep blue outline pill */}
                      <span className={styles.enrollmentPill}>
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>Admission Confirmed</span>
                      </span>

                      {/* Gateway: Subdued chip */}
                      <span className={styles.gatewayChip}>
                        <Sparkles size={11} aria-hidden="true" />
                        <span>{order.paymentGateway}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Order Date & Timestamp */}
                  <div className={styles.topMetaRight}>
                    <Calendar size={13} aria-hidden="true" />
                    <span>{order.orderDate}</span>
                  </div>
                </div>

                {/* Main Content Row */}
                <div className={styles.mainContentRow}>
                  <div className={styles.courseDetailsCol}>
                    {/* Course Title */}
                    <h3 className={styles.courseTitle}>{order.courseTitle}</h3>

                    {/* Course Meta Chips */}
                    <div className={styles.courseMetaChipsRow}>
                      <span className={styles.metaChip}>
                        <Building size={12} aria-hidden="true" />
                        <span>{order.campusTag}</span>
                      </span>
                      <span className={styles.metaChip}>
                        <Clock size={12} aria-hidden="true" />
                        <span>{order.batchStartTag}</span>
                      </span>
                      <span className={styles.metaChip}>
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>{order.validityTag}</span>
                      </span>
                    </div>

                    {/* Price Block */}
                    <div className={styles.priceBlock}>
                      {order.isFree ? (
                        <div className={styles.freeScholarshipTag}>
                          <Sparkles size={13} aria-hidden="true" />
                          <span>100% Free Scholarship / Demo</span>
                        </div>
                      ) : (
                        <div className={styles.paidPriceContainer}>
                          <span className={styles.paidPriceAmount}>{order.price}</span>
                          <span className={styles.paidPriceSubtext}>
                            Incl. 18% GST (Tax Invoice Available)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column (Right-aligned Button Group) */}
                  <div className={styles.actionsCol}>
                    {/* Primary Action: Go to Classroom / Player */}
                    <Link
                      to={`/courses/${order.courseId}/learn`}
                      className={styles.primaryPlayerBtn}
                      title={`Enrolled Course - ${order.courseTitle}`}
                    >
                      <PlayCircle size={15} aria-hidden="true" />
                      <span>Go to Classroom</span>
                    </Link>

                    {/* Secondary Action: Download GST Invoice */}
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(order)}
                      className={styles.secondaryInvoiceBtn}
                      title={`Download official GST invoice for #${order.orderId}`}
                      aria-label={`Download official GST invoice for #${order.orderId}`}
                    >
                      <Download size={14} aria-hidden="true" />
                      <span>Download GST Invoice</span>
                    </button>

                    {/* Tertiary Action: View Syllabus */}
                    <Link
                      to={`/courses/${order.courseId}`}
                      className={styles.tertiarySyllabusLink}
                      title={`View course syllabus & curriculum for ${order.courseTitle}`}
                    >
                      <span>View Syllabus</span>
                      <ChevronRight size={14} className={styles.chevronIcon} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

        {/* 3. Financial Assistance & Counselor Helpline Card */}
        <div className={styles.financialHelpCard} role="region" aria-label="Financial Assistance & Counselor Helpline">
          <div className={styles.helpIconBox}>
            <Headphones size={22} aria-hidden="true" />
          </div>

          <div className={styles.helpContent}>
            <h4 className={styles.helpTitle}>
              Need Assistance with Payments, Invoices, or Fee Receipts?
            </h4>
            <p className={styles.helpDesc}>
              Need help with fee receipts, installment schedules, or GST filing details? Janakpuri Admission Desk is active Mon–Sat (10:00 AM – 7:00 PM).
            </p>
          </div>

          <a
            href={whatsappAccountsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.chatAccountsBtn}
            title="Open WhatsApp chat with Janakpuri Accounts Desk"
          >
            <MessageCircle size={15} aria-hidden="true" />
            <span>Chat with Accounts Desk</span>
          </a>
        </div>

        {/* 4. Regulatory Compliance & Policies Footer */}
        <div className={styles.complianceFooterRow}>
          <div className={styles.complianceMeta}>
            <div className={styles.gstinChip}>
              <span className={styles.complianceLabel}>Official GSTIN:</span>
              <strong className={styles.gstinValue}>{officialGstin}</strong>
              <button
                type="button"
                onClick={handleCopyGstin}
                className={styles.copyGstinBtn}
                title="Copy Official GSTIN"
                aria-label="Copy Official GSTIN"
              >
                {copiedGstin ? (
                  <Check size={11} className={styles.copiedCheckIcon} aria-hidden="true" />
                ) : (
                  <Copy size={11} aria-hidden="true" />
                )}
              </button>
            </div>

            <span className={styles.metaDivider}>•</span>

            <div className={styles.sacMeta}>
              <span className={styles.complianceLabel}>SAC Code:</span>
              <strong className={styles.sacValue}>{officialSac}</strong>
              <span className={styles.sacDesc}>(Educational Coaching Services)</span>
            </div>
          </div>

          <div className={styles.policyLinksGroup}>
            <Link to="/terms" className={styles.policyLink}>
              <span>Refund &amp; Cancellation Policy</span>
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
            <span className={styles.linkDot}>•</span>
            <Link to="/terms" className={styles.policyLink}>
              <span>Fee Structure Terms</span>
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

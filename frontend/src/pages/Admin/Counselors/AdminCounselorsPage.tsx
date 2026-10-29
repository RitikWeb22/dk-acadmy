import React, { useState, useEffect } from 'react';
import {
  Headphones,
  PhoneCall,
  MessageCircle,
  Star,
  CheckCircle2,
  XCircle,
  UserCheck,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import type { CounselorMember } from '../../../types/admin';
import styles from './AdminCounselorsPage.module.scss';

export const AdminCounselorsPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [counselors, setCounselors] = useState<CounselorMember[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshList = () => {
    setCounselors(adminService.getCounselors());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleAvailability = (counselor: CounselorMember) => {
    adminService.toggleCounselorAvailability(counselor.id);
    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'COUNSELOR_UPDATED',
        module: 'Counselor Roster',
        details: `Toggled availability for counselor ${counselor.name} to ${!counselor.isAvailable ? 'Available' : 'Offline'}`,
        status: 'SUCCESS'
      });
    }
    refreshList();
    showToast(`${counselor.name} is now marked ${!counselor.isAvailable ? 'Online' : 'Offline'}.`);
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Academic Counselors &amp; Admissions Desk</h1>
          <p className={styles.pageSubtitle}>
            Manage mentor availability, WhatsApp desk assignments, incoming callback queues, and Janakpuri center counseling staff.
          </p>
        </div>
      </div>

      <div className={styles.counselorGrid}>
        {counselors.map((c) => (
          <div key={c.id} className={styles.counselorCard}>
            <div className={styles.cardHeader}>
              <div className={styles.avatarCircle}>{c.name.charAt(0)}</div>
              <div className={styles.infoCol}>
                <h3 className={styles.counselorName}>{c.name}</h3>
                <span className={styles.designation}>{c.designation}</span>
              </div>
              <button
                type="button"
                className={`${styles.statusToggleBtn} ${c.isAvailable ? styles.online : styles.offline}`}
                onClick={() => handleToggleAvailability(c)}
                title="Click to toggle counselor online status"
              >
                <span className={styles.statusDot} />
                <span>{c.isAvailable ? 'On Duty' : 'Away'}</span>
              </button>
            </div>

            <div className={styles.specializationBox}>
              <span className={styles.specLabel}>Focus Area:</span>
              <p className={styles.specText}>{c.specialization}</p>
            </div>

            <div className={styles.metricsRow}>
              <div className={styles.metricItem}>
                <span className={styles.metricNum}>{c.activeLeadsCount}</span>
                <span className={styles.metricTitle}>Active Inquiries</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricNum}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" /> {c.rating}
                </span>
                <span className={styles.metricTitle}>Parent Rating</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricNum}>{c.joinedDate.split(' ')[1]}</span>
                <span className={styles.metricTitle}>Tenure Since</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <a
                href={`https://wa.me/${c.whatsAppNumber}?text=Hello%20${encodeURIComponent(c.name)},%20inquiry%20routing%20test%20from%20Admin%20Portal`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waBtn}
              >
                <MessageCircle size={14} />
                <span>Test WhatsApp Trigger</span>
              </a>
              <a href={`tel:${c.phone}`} className={styles.callBtn}>
                <PhoneCall size={14} />
                <span>Direct Line</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCounselorsPage;

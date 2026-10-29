import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { INITIAL_NOTIFICATIONS } from '../../../data/notificationsData';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { adminService } from '../../../services/adminService';
import type { AppNotification } from '../../../types';
import styles from './AdminAnnouncementsPage.module.scss';

export const AdminAnnouncementsPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [announcements, setAnnouncements] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'announcement' as const,
    urgency: 'high' as const,
    linkText: 'View Details',
    linkUrl: '/classroom',
    targetBatch: 'All JEE Aspirants'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    const newNotification: AppNotification = {
      id: `ann_${Date.now()}`,
      title: form.title,
      message: form.message,
      category: form.category,
      timestamp: Date.now(),
      read: false,
      urgency: form.urgency,
      linkText: form.linkText,
      linkUrl: form.linkUrl
    };

    setAnnouncements([newNotification, ...announcements]);

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'ANNOUNCEMENT_PUBLISHED',
        module: 'Announcements',
        details: `Broadcasted announcement: "${form.title}" to ${form.targetBatch}`,
        status: 'SUCCESS'
      });
    }

    setIsModalOpen(false);
    showToast('Announcement broadcasted to all student portals!');
    setForm({
      title: '',
      message: '',
      category: 'announcement',
      urgency: 'high',
      linkText: 'View Details',
      linkUrl: '/classroom',
      targetBatch: 'All JEE Aspirants'
    });
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Student Announcements Broadcast</h1>
          <p className={styles.pageSubtitle}>
            Publish masterclass invitations, mock test releases, and academic guidelines directly to enrolled student dashboards.
          </p>
        </div>
        <button
          type="button"
          className={styles.broadcastBtn}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Broadcast Announcement</span>
        </button>
      </div>

      <div className={styles.list}>
        {announcements.map((item) => (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemHeader}>
              <div className={styles.categoryBadge}>
                <Bell size={12} />
                <span>{item.category.replace('_', ' ')}</span>
              </div>
              <time className={styles.timeTag}>
                {new Date(item.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            </div>

            <h3 className={styles.itemTitle}>{item.title}</h3>
            <p className={styles.itemBody}>{item.message}</p>

            {item.linkText && (
              <div className={styles.itemFooter}>
                <span className={styles.linkInfo}>
                  Linked Action: <strong>{item.linkText}</strong> ({item.linkUrl})
                </span>
                <span className={styles.deliveredBadge}>
                  <CheckCircle2 size={12} /> Broadcast Active
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Send size={18} color="#2563eb" />
                <h3>New Academic Announcement</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className={styles.modalForm}>
              <div className={styles.formRow}>
                <label>Announcement Headline</label>
                <input
                  type="text"
                  placeholder="e.g. DK Sir Calculus 20s Techniques Live Masterclass"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                  >
                    <option value="announcement">General Academic Notice</option>
                    <option value="course">Masterclass / Live Lecture</option>
                    <option value="practice_test">Test Series &amp; DPP</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label>Target Audience</label>
                  <select
                    value={form.targetBatch}
                    onChange={(e) => setForm({ ...form, targetBatch: e.target.value })}
                  >
                    <option value="All JEE Aspirants">All Enrolled Students</option>
                    <option value="Class 11th Batches">Class 11th Batches Only</option>
                    <option value="Class 12th & Droppers">Class 12th &amp; Droppers</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Message Content</label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive announcement details..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Action Link Label</label>
                  <input
                    type="text"
                    value={form.linkText}
                    onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Destination Route</label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsPage;

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import type { WebsiteBanner } from '../../../types/admin';
import styles from './AdminBannersPage.module.scss';

export const AdminBannersPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [banners, setBanners] = useState<WebsiteBanner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formState, setFormState] = useState<Omit<WebsiteBanner, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    tagText: 'SPECIAL ADMISSION ALERT',
    message: '',
    linkText: 'Explore Batches',
    linkUrl: '/courses',
    isActive: true,
    priority: 1,
    type: 'announcement'
  });

  const refreshBanners = () => {
    setBanners(adminService.getBanners());
  };

  useEffect(() => {
    refreshBanners();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = (banner: WebsiteBanner) => {
    const updated: WebsiteBanner = { ...banner, isActive: !banner.isActive };
    adminService.saveBanner(updated);
    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'BANNER_TOGGLED',
        module: 'Banners',
        details: `${updated.isActive ? 'Activated' : 'Deactivated'} banner: "${banner.title}"`,
        status: 'SUCCESS'
      });
    }
    refreshBanners();
    showToast(`Banner "${banner.title}" is now ${updated.isActive ? 'Live' : 'Hidden'}.`);
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return;
    adminService.deleteBanner(id);
    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'BANNER_TOGGLED',
        module: 'Banners',
        details: `Deleted banner: "${title}"`,
        status: 'WARNING'
      });
    }
    refreshBanners();
    showToast('Banner deleted successfully.');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.message.trim()) {
      alert('Please enter both title and message text.');
      return;
    }

    const newBanner: WebsiteBanner = {
      id: `ban_${Date.now()}`,
      ...formState,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    adminService.saveBanner(newBanner);
    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'BANNER_CREATED',
        module: 'Banners',
        details: `Created new ${formState.type} banner: "${formState.title}"`,
        status: 'SUCCESS'
      });
    }

    refreshBanners();
    setIsModalOpen(false);
    showToast('New promotional banner created successfully!');
    setFormState({
      title: '',
      tagText: 'SPECIAL ADMISSION ALERT',
      message: '',
      linkText: 'Explore Batches',
      linkUrl: '/courses',
      isActive: true,
      priority: 1,
      type: 'announcement'
    });
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Promotional Banner Management</h1>
          <p className={styles.pageSubtitle}>
            Configure top announcements, admission deadline warnings, and scholarship test notices
            broadcast across the student website.
          </p>
        </div>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Create Banner</span>
        </button>
      </div>

      <div className={styles.bannerGrid}>
        {banners.map((b) => (
          <div
            key={b.id}
            className={`${styles.bannerCard} ${b.isActive ? styles.bannerActive : ''}`}
          >
            <div className={styles.cardTopRow}>
              <div className={styles.tagGroup}>
                <span className={`${styles.typeBadge} ${styles[b.type]}`}>{b.type}</span>
                <span className={styles.tagText}>{b.tagText}</span>
              </div>
              <div className={styles.actionsGroup}>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${b.isActive ? styles.switchOn : ''}`}
                  onClick={() => handleToggle(b)}
                  title={b.isActive ? 'Click to hide banner' : 'Click to make live'}
                >
                  <span className={styles.switchSlider} />
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(b.id, b.title)}
                  title="Delete banner"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <h3 className={styles.bannerHeading}>{b.title}</h3>
            <p className={styles.bannerMessage}>{b.message}</p>

            <div className={styles.bannerFooter}>
              <div className={styles.targetLink}>
                <ExternalLink size={13} />
                <span>
                  CTA: <strong>{b.linkText}</strong> → {b.linkUrl}
                </span>
              </div>
              <div className={styles.statusIndicator}>
                {b.isActive ? (
                  <span className={styles.liveTag}>
                    <CheckCircle2 size={12} /> Live on Website
                  </span>
                ) : (
                  <span className={styles.inactiveTag}>
                    <Clock size={12} /> Draft / Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Banner Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Megaphone size={20} color="#2563eb" />
                <h3>Create Promotional Banner</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.formRow}>
                <label>Banner Title</label>
                <input
                  type="text"
                  placeholder="e.g. Janakpuri Offline Admissions Open"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Type / Category</label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value as any })}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="orientation">Workshop / Masterclass</option>
                    <option value="discount">Scholarship / Discount</option>
                    <option value="urgent">Urgent Deadline</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <label>Pill Tag Text</label>
                  <input
                    type="text"
                    value={formState.tagText}
                    onChange={(e) => setFormState({ ...formState, tagText: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Message Content</label>
                <textarea
                  rows={3}
                  placeholder="Detailed announcement text displayed to students..."
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  required
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>CTA Button Label</label>
                  <input
                    type="text"
                    value={formState.linkText}
                    onChange={(e) => setFormState({ ...formState, linkText: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <label>Destination Route</label>
                  <input
                    type="text"
                    value={formState.linkUrl}
                    onChange={(e) => setFormState({ ...formState, linkUrl: e.target.value })}
                    required
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
                  Publish Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBannersPage;

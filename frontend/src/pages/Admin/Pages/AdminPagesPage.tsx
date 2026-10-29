import React, { useState } from 'react';
import {
  FileCode2,
  Save,
  CheckCircle2,
  Globe,
  Layout,
  Search,
  Sparkles
} from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { adminService } from '../../../services/adminService';
import styles from './AdminPagesPage.module.scss';

export const AdminPagesPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'seo'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [homeConfig, setHomeConfig] = useState({
    heroBadge: 'JEE MAIN & ADVANCED 2026-27 ADMISSIONS',
    heroHeading: 'Prepare Smarter. Aim Higher. Crack JEE with DK Sir.',
    heroSubtext: 'Delhi’s premier coaching institute combining offline Janakpuri classroom rigor with high-speed 20s calculus techniques.',
    primaryCtaText: 'Explore Flagship Batches',
    secondaryCtaText: 'Request Callback'
  });

  const [seoConfig, setSeoConfig] = useState({
    metaTitle: 'DK Academy JEE — Prepare Smarter. Aim Higher. Crack JEE.',
    metaDescription: 'DK Academy JEE: Top JEE Main and Advanced coaching in Janakpuri, New Delhi. Master 20s speed techniques with DK Sir.',
    metaKeywords: 'JEE Main 2026, JEE Advanced 2027, IIT JEE coaching Delhi, DK Sir Math techniques'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'PAGE_CONTENT_UPDATED',
        module: 'Page Customization',
        details: `Updated ${activeTab.toUpperCase()} section configuration`,
        status: 'SUCCESS'
      });
    }
    showToast('Page customizations published successfully!');
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Website Page Customization</h1>
          <p className={styles.pageSubtitle}>
            Update public-facing page content, hero statements, call-to-actions, and search engine optimization tags.
          </p>
        </div>
      </div>

      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'home' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Layout size={15} />
          <span>Homepage Hero Section</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'seo' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          <Globe size={15} />
          <span>Global SEO &amp; Meta Tags</span>
        </button>
      </div>

      <form onSubmit={handleSave} className={styles.formCard}>
        {activeTab === 'home' && (
          <div className={styles.sectionFields}>
            <div className={styles.fieldGroup}>
              <label>Hero Announcement Tag</label>
              <input
                type="text"
                value={homeConfig.heroBadge}
                onChange={(e) => setHomeConfig({ ...homeConfig, heroBadge: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Main Headline</label>
              <input
                type="text"
                value={homeConfig.heroHeading}
                onChange={(e) => setHomeConfig({ ...homeConfig, heroHeading: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Supporting Subtext</label>
              <textarea
                rows={3}
                value={homeConfig.heroSubtext}
                onChange={(e) => setHomeConfig({ ...homeConfig, heroSubtext: e.target.value })}
              />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.fieldGroup}>
                <label>Primary CTA Label</label>
                <input
                  type="text"
                  value={homeConfig.primaryCtaText}
                  onChange={(e) => setHomeConfig({ ...homeConfig, primaryCtaText: e.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>Secondary CTA Label</label>
                <input
                  type="text"
                  value={homeConfig.secondaryCtaText}
                  onChange={(e) => setHomeConfig({ ...homeConfig, secondaryCtaText: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className={styles.sectionFields}>
            <div className={styles.fieldGroup}>
              <label>Global Browser Title Tag</label>
              <input
                type="text"
                value={seoConfig.metaTitle}
                onChange={(e) => setSeoConfig({ ...seoConfig, metaTitle: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Meta Description</label>
              <textarea
                rows={3}
                value={seoConfig.metaDescription}
                onChange={(e) => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Meta Keywords</label>
              <input
                type="text"
                value={seoConfig.metaKeywords}
                onChange={(e) => setSeoConfig({ ...seoConfig, metaKeywords: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className={styles.submitRow}>
          <button type="submit" className={styles.saveBtn}>
            <Save size={16} />
            <span>Publish Customizations</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPagesPage;

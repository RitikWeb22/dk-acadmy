import React, { useState } from 'react';
import {
  Settings,
  Save,
  PhoneCall,
  Mail,
  MapPin,
  Shield,
  RotateCcw,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { adminService } from '../../../services/adminService';
import styles from './AdminSettingsPage.module.scss';

export const AdminSettingsPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    helplinePhone: '+91 93259 87875',
    whatsappNumber: '919325987875',
    directorEmail: 'director@dkacademy.com',
    janakpuriAddress: 'B-1/48, Main Najafgarh Road, Opposite Metro Pillar 542, Janakpuri, New Delhi - 110058',
    sessionTimeoutHours: 8,
    rateLimitThreshold: 5
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
        action: 'SETTINGS_UPDATED',
        module: 'Settings',
        details: 'Updated administrative institute settings & communication channels',
        status: 'SUCCESS'
      });
    }
    showToast('Platform settings saved successfully.');
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin &amp; Platform Settings</h1>
          <p className={styles.pageSubtitle}>
            Configure institute contact points, Janakpuri center parameters, security policies, and session timeout thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className={styles.settingsForm}>
        {/* Contact & Helpline Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <PhoneCall size={18} color="#2563eb" />
            <h3>Admissions Helpline &amp; WhatsApp Desk</h3>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.formGroup}>
              <label>Official Helpline Number (Voice)</label>
              <input
                type="text"
                value={settings.helplinePhone}
                onChange={(e) => setSettings({ ...settings, helplinePhone: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Official WhatsApp Desk (wa.me target)</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Academic Directorate Email</label>
              <input
                type="email"
                value={settings.directorEmail}
                onChange={(e) => setSettings({ ...settings, directorEmail: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '16px' }}>
            <label>Janakpuri Classroom Center Address</label>
            <textarea
              rows={2}
              value={settings.janakpuriAddress}
              onChange={(e) => setSettings({ ...settings, janakpuriAddress: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <Shield size={18} color="#2563eb" />
            <h3>Administrative Security &amp; Session Policies</h3>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.formGroup}>
              <label>Admin Session Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={settings.sessionTimeoutHours}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeoutHours: parseInt(e.target.value) || 8 })
                }
              />
              <span className={styles.helperText}>Sessions automatically expire after this period.</span>
            </div>

            <div className={styles.formGroup}>
              <label>Brute-Force Lockout Threshold</label>
              <input
                type="number"
                min={3}
                max={10}
                value={settings.rateLimitThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, rateLimitThreshold: parseInt(e.target.value) || 5 })
                }
              />
              <span className={styles.helperText}>Consecutive failed logins before 3-minute lockout.</span>
            </div>
          </div>
        </div>

        <div className={styles.actionsBar}>
          <button type="submit" className={styles.saveBtn}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;

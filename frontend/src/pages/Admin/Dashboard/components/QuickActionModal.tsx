import React, { useState } from 'react';
import {
  X,
  UserPlus,
  BookOpen,
  Activity,
  UserCheck,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import styles from './QuickActionModal.module.scss';

interface QuickActionModalProps {
  actionType: string | null;
  onClose: () => void;
  onSubmitSuccess: (msg: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  actionType,
  onClose,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    target: 'JEE Advanced · 2028',
    mode: 'Offline · Janakpuri',
    amount: '',
    phone: '',
    notes: ''
  });

  if (!actionType) return null;

  const getActionTitle = () => {
    switch (actionType) {
      case 'student':
        return 'Enroll New Student';
      case 'batch':
        return 'Create Academic Batch';
      case 'test':
        return 'Schedule CBT Mock Examination';
      case 'lead':
        return 'Log Admission Lead & Callback';
      case 'payment':
        return 'Record Fee Payment';
      default:
        return 'Executive Action';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actionLabel = getActionTitle();
    onSubmitSuccess(`${actionLabel} recorded successfully.`);
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconChip}>
              {actionType === 'student' && <UserPlus size={16} />}
              {actionType === 'batch' && <BookOpen size={16} />}
              {actionType === 'test' && <Activity size={16} />}
              {actionType === 'lead' && <UserCheck size={16} />}
              {actionType === 'payment' && <CreditCard size={16} />}
            </div>
            <div>
              <h3 className={styles.modalTitle}>{getActionTitle()}</h3>
              <span className={styles.modalSubtitle}>DK Academy Janakpuri Control Center</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {actionType === 'payment' ? 'Student Full Name' : actionType === 'lead' ? 'Parent / Student Name' : 'Batch / Title'}
            </label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder={actionType === 'payment' ? 'e.g. Tanya Kapoor' : 'e.g. Ultimate 2-Year Classroom'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Target Cohort</label>
              <select
                className={styles.select}
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              >
                <option value="JEE Advanced · 2028">JEE Advanced · 2028</option>
                <option value="JEE Main & Adv · 2027">JEE Main &amp; Adv · 2027</option>
                <option value="JEE Main · 2026">JEE Main · 2026</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Delivery Mode</label>
              <select
                className={styles.select}
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              >
                <option value="Offline · Janakpuri">Offline · Janakpuri</option>
                <option value="Online">Online LMS Platform</option>
              </select>
            </div>
          </div>

          {actionType === 'payment' && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Fee Amount (₹)</label>
              <input
                type="number"
                required
                className={styles.input}
                placeholder="e.g. 42000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          )}

          {actionType === 'lead' && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>WhatsApp Phone Number</label>
              <input
                type="tel"
                required
                className={styles.input}
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Executive Remarks / Notes</label>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Internal verification notes, trial timing, or scholarship concessions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              <CheckCircle2 size={14} />
              <span>Confirm &amp; Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Trash2,
  Lock,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { apiClient } from '../../../services/apiClient';
import styles from './AdminProfileModal.module.scss';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { admin, updateAdminProfile } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(admin?.name || '');
  const [email] = useState(admin?.email || '');
  const [designation, setDesignation] = useState(admin?.designation || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [department, setDepartment] = useState(admin?.department || '');
  const [avatarUrl, setAvatarUrl] = useState(admin?.avatarUrl || '');

  // Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Upload & submission states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial state if admin changes
  React.useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setDesignation(admin.designation || '');
      setPhone(admin.phone || '');
      setDepartment(admin.department || '');
      setAvatarUrl(admin.avatarUrl || '');
    }
  }, [admin, isOpen]);

  if (!isOpen) return null;

  const initials = (name || admin?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Cloudinary Avatar File Upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 10MB.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const res = await apiClient.uploadFile(file, 'admin-avatars', (percent) => {
        setUploadProgress(percent);
      });

      if (res.success && res.url) {
        setAvatarUrl(res.url);
      } else {
        setErrorMsg(res.message || 'Image upload failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error uploading image to Cloudinary.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    if (isChangingPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updates = {
        name: name.trim(),
        designation: designation.trim() || 'Staff Administrator',
        phone: phone.trim(),
        department: department.trim() || 'Academic Administration',
        avatarUrl: avatarUrl.trim()
      };

      const result = await updateAdminProfile(
        updates,
        isChangingPassword ? newPassword.trim() : undefined
      );

      if (result.success) {
        if (onSuccess) onSuccess('Admin Profile and Avatar updated successfully!');
        onClose();
      } else {
        setErrorMsg(result.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIconWrap}>
              <User size={20} />
            </div>
            <div>
              <h2 id="modal-title" className={styles.modalTitle}>
                Edit Admin Profile
              </h2>
              <p className={styles.modalSubtitle}>
                Update your staff details, Cloudinary avatar image, and security credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formContent}>
          {errorMsg && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cloudinary Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreviewWrap}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Admin Avatar'}
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  <span>{initials || 'AD'}</span>
                </div>
              )}

              {isUploading && (
                <div className={styles.uploadingOverlay}>
                  <Loader2 size={24} className={styles.spinner} />
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>

            <div className={styles.avatarActions}>
              <div className={styles.avatarTitleRow}>
                <span className={styles.avatarLabel}>Profile Photo</span>
                <span className={styles.roleBadge}>
                  {admin?.role?.replace('_', ' ') || 'SUPER ADMIN'}
                </span>
              </div>
              <p className={styles.avatarHint}>
                Uploads directly to Cloudinary Media Vault. JPG, PNG or WebP up to 10MB.
              </p>

              <div className={styles.avatarBtnRow}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera size={14} />
                  <span>{isUploading ? `Uploading ${uploadProgress}%...` : 'Upload New Photo'}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    className={styles.removeAvatarBtn}
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                    title="Remove Photo and use initial avatar"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.sectionDivider} />

          {/* Core Info Inputs */}
          <div className={styles.fieldsGrid}>
            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="admin-name" className={styles.formLabel}>
                Full Name <span className={styles.reqStar}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="admin-name"
                  type="text"
                  className={styles.textInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dharmendra Kumar (DK Sir)"
                  required
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className={styles.formGroup}>
              <label htmlFor="admin-email" className={styles.formLabel}>
                Administrative Email
              </label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="admin-email"
                  type="email"
                  className={`${styles.textInput} ${styles.readOnlyInput}`}
                  value={email}
                  disabled
                  title="Primary login identifier"
                />
              </div>
            </div>

            {/* Designation */}
            <div className={styles.formGroup}>
              <label htmlFor="admin-designation" className={styles.formLabel}>
                Designation / Title
              </label>
              <div className={styles.inputWrap}>
                <Briefcase size={16} className={styles.inputIcon} />
                <input
                  id="admin-designation"
                  type="text"
                  className={styles.textInput}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Academic Director & Founder"
                />
              </div>
            </div>

            {/* Phone */}
            <div className={styles.formGroup}>
              <label htmlFor="admin-phone" className={styles.formLabel}>
                Contact / WhatsApp Number
              </label>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  id="admin-phone"
                  type="tel"
                  className={styles.textInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 93259 87875"
                />
              </div>
            </div>

            {/* Department */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="admin-department" className={styles.formLabel}>
                Department / Branch Location
              </label>
              <div className={styles.inputWrap}>
                <Building size={16} className={styles.inputIcon} />
                <input
                  id="admin-department"
                  type="text"
                  className={styles.textInput}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Directorate & Academic Council (Janakpuri HQ)"
                />
              </div>
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className={styles.passwordAccordion}>
            <button
              type="button"
              className={styles.passwordToggleBtn}
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              aria-expanded={isChangingPassword}
            >
              <div className={styles.passwordToggleLeft}>
                <Lock size={15} />
                <span>Security &amp; Password</span>
              </div>
              <span className={styles.passwordToggleAction}>
                {isChangingPassword ? 'Cancel Change' : 'Change Password'}
              </span>
            </button>

            {isChangingPassword && (
              <div className={styles.passwordFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="admin-new-password" className={styles.formLabel}>
                    New Password
                  </label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      id="admin-new-password"
                      type={showPassword ? 'text' : 'password'}
                      className={styles.textInput}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="admin-confirm-password" className={styles.formLabel}>
                    Confirm New Password
                  </label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      id="admin-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      className={styles.textInput}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
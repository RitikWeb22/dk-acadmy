import React, { useState, useEffect } from 'react';
import type { StudentProfile } from '../../../types';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Loader2,
  Target,
  Calendar,
  GraduationCap,
  MapPin,
  Building2,
  BookOpen,
  Languages,
  UserCheck,
  PhoneCall,
  RotateCcw,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { getTargetYear, getValidTargetYears } from '../../../utils/academicYear';
import styles from './ProfileInformationForm.module.scss';

interface ProfileInformationFormProps {
  student: StudentProfile;
  onUpdate: (updates: Partial<StudentProfile>) => Promise<{ success: boolean; error?: string }>;
  onDirtyChange?: (isDirty: boolean) => void;
}

const INDIAN_STATES = [
  'Delhi',
  'Maharashtra',
  'Uttar Pradesh',
  'Rajasthan',
  'Bihar',
  'Karnataka',
  'Haryana',
  'Telangana',
  'West Bengal',
  'Tamil Nadu',
  'Madhya Pradesh',
  'Gujarat',
  'Punjab',
  'Jharkhand',
  'Kerala',
  'Uttarakhand',
  'Other'
];

export const ProfileInformationForm: React.FC<ProfileInformationFormProps> = ({
  student,
  onUpdate,
  onDirtyChange
}) => {
  // 1. Personal Details State
  const [name, setName] = useState(student.name || '');
  const [dob, setDob] = useState(student.dob || '');
  const [preferredLanguage, setPreferredLanguage] = useState<'Hinglish' | 'English'>(
    student.preferredLanguage || 'Hinglish'
  );

  // 2. Contact State
  const [phone, setPhone] = useState(student.phone || '');
  const [city, setCity] = useState(student.city || '');
  const [state, setState] = useState(student.state || 'Delhi');
  const [parentName, setParentName] = useState(student.parentName || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');

  // 3. Academic Target State
  const [targetExam, setTargetExam] = useState(student.targetExam || 'JEE Main & Advanced');
  const [targetClass, setTargetClass] = useState(student.targetClass || 'Class 11th');
  const [targetYear, setTargetYear] = useState(
    student.targetYear || getTargetYear(student.targetClass || 'Class 11th', 2026)
  );
  const [schoolName, setSchoolName] = useState(student.schoolName || '');
  const [board, setBoard] = useState<'CBSE' | 'ICSE' | 'State Board' | 'Other'>(
    student.board || 'CBSE'
  );

  // Validation & status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Mobile number change OTP modal
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Sync state if student prop changes externally
  useEffect(() => {
    setName(student.name || '');
    setDob(student.dob || '');
    setPreferredLanguage(student.preferredLanguage || 'Hinglish');
    setPhone(student.phone || '');
    setCity(student.city || '');
    setState(student.state || 'Delhi');
    setParentName(student.parentName || '');
    setParentPhone(student.parentPhone || '');
    setTargetExam(student.targetExam || 'JEE Main & Advanced');
    setTargetClass(student.targetClass || 'Class 11th');
    setTargetYear(student.targetYear || getTargetYear(student.targetClass || 'Class 11th', 2026));
    setSchoolName(student.schoolName || '');
    setBoard(student.board || 'CBSE');
    setErrors({});
    setTouched({});
  }, [student]);

  // Derived dirty state
  const isDirty =
    name !== (student.name || '') ||
    dob !== (student.dob || '') ||
    preferredLanguage !== (student.preferredLanguage || 'Hinglish') ||
    city !== (student.city || '') ||
    state !== (student.state || 'Delhi') ||
    parentName !== (student.parentName || '') ||
    parentPhone !== (student.parentPhone || '') ||
    targetExam !== (student.targetExam || 'JEE Main & Advanced') ||
    targetClass !== (student.targetClass || 'Class 11th') ||
    targetYear !== (student.targetYear || getTargetYear(student.targetClass || 'Class 11th', 2026)) ||
    schoolName !== (student.schoolName || '') ||
    board !== (student.board || 'CBSE');

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Warn on browser navigate / close with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle class stage change: auto updates target year
  const handleClassChange = (selectedClass: string) => {
    setTargetClass(selectedClass);
    const autoYear = getTargetYear(selectedClass, 2026);
    setTargetYear(autoYear);
  };

  const validTargetYears = getValidTargetYears(targetClass, 2026);

  // Field validator
  const validateField = (field: string): boolean => {
    const newErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!name.trim()) {
          newErrors.name = 'Full name is required.';
        } else if (name.trim().length < 2) {
          newErrors.name = 'Full name must be at least 2 characters.';
        } else {
          delete newErrors.name;
        }
        break;
      case 'city':
        if (!city.trim()) {
          newErrors.city = 'City / Town is required.';
        } else {
          delete newErrors.city;
        }
        break;
      case 'parentPhone':
        if (parentPhone.trim() && parentPhone.replace(/\D/g, '').length !== 10) {
          newErrors.parentPhone = 'Parent mobile must be a valid 10-digit number.';
        } else {
          delete newErrors.parentPhone;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!city.trim()) {
      newErrors.city = 'City / Town is required.';
    }

    if (parentPhone.trim() && parentPhone.replace(/\D/g, '').length !== 10) {
      newErrors.parentPhone = 'Parent mobile must be a valid 10-digit number.';
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      city: true,
      parentPhone: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const isValid = Object.keys(errors).length === 0 && !!name.trim() && !!city.trim();

  // Reset form
  const handleReset = () => {
    setName(student.name || '');
    setDob(student.dob || '');
    setPreferredLanguage(student.preferredLanguage || 'Hinglish');
    setCity(student.city || '');
    setState(student.state || 'Delhi');
    setParentName(student.parentName || '');
    setParentPhone(student.parentPhone || '');
    setTargetExam(student.targetExam || 'JEE Main & Advanced');
    setTargetClass(student.targetClass || 'Class 11th');
    setTargetYear(student.targetYear || getTargetYear(student.targetClass || 'Class 11th', 2026));
    setSchoolName(student.schoolName || '');
    setBoard(student.board || 'CBSE');
    setErrors({});
    setTouched({});
    setGeneralError(null);
  };

  // Submit Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll() || isSaving) return;

    setIsSaving(true);
    setGeneralError(null);

    try {
      const res = await onUpdate({
        name: name.trim(),
        dob: dob.trim() || undefined,
        preferredLanguage,
        city: city.trim(),
        state,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        targetExam,
        targetClass,
        targetYear,
        schoolName: schoolName.trim() || undefined,
        board
      });

      if (res.success) {
        setSuccessToast('Profile updated successfully!');
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setGeneralError(res.error || 'Failed to update profile. Please verify your entries.');
      }
    } catch (err) {
      setGeneralError('An unexpected network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Mobile Number Change Modal Actions
  const handleSendOtp = async () => {
    setOtpError(null);
    const clean = newPhone.replace(/\D/g, '');
    if (clean.length !== 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (clean === phone) {
      setOtpError('This number is already your registered mobile number.');
      return;
    }

    setIsSendingOtp(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSendingOtp(false);
    setOtpStep('code');
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);
    if (otpCode.trim().length < 4) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSendingOtp(true);
    await new Promise((r) => setTimeout(r, 500));
    const clean = newPhone.replace(/\D/g, '');
    const res = await onUpdate({ phone: clean });
    setIsSendingOtp(false);

    if (res.success) {
      setPhone(clean);
      setIsOtpModalOpen(false);
      setNewPhone('');
      setOtpCode('');
      setOtpStep('phone');
      setSuccessToast('Mobile number verified & updated successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      setOtpError(res.error || 'Invalid OTP code. Please check your SMS and try again.');
    }
  };

  return (
    <div className={styles.formSectionContainer}>
      {/* Toast Notification */}
      {successToast && (
        <div className={styles.floatingToast} role="status" aria-live="polite">
          <CheckCircle2 size={18} className={styles.toastIcon} aria-hidden="true" />
          <span>{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className={styles.closeToastBtn}
            aria-label="Close notification"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* General Error Alert */}
      {generalError && (
        <div className={styles.errorBanner} role="alert" aria-live="assertive">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={styles.profileCardsForm}>
        {/* CARD 1: PERSONAL DETAILS */}
        <section className={styles.card} aria-labelledby="card-personal-title">
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.cardIconBox}>
                <User size={18} aria-hidden="true" />
              </div>
              <div className={styles.cardTitleWrapper}>
                <h2 id="card-personal-title" className={styles.cardTitle}>
                  1. Personal Identity &amp; Language
                </h2>
                <p className={styles.cardSubtitle}>
                  Manage your student name, birth date, and learning medium for live classes.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.twoColGrid}>
            {/* Full Name */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-name" className={styles.label}>
                Full Legal Name <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  touched.name && errors.name ? styles.hasError : ''
                }`}
              >
                <User size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) validateField('name');
                  }}
                  onBlur={() => handleBlur('name')}
                  disabled={isSaving}
                  required
                  aria-required="true"
                  aria-invalid={touched.name && !!errors.name}
                  aria-describedby={errors.name ? 'profile-name-error' : undefined}
                  className={styles.input}
                  placeholder="e.g. Aarav Sharma"
                />
              </div>
              {touched.name && errors.name && (
                <span id="profile-name-error" className={styles.errorText} role="alert" aria-live="polite">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Date of Birth */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-dob" className={styles.label}>
                Date of Birth <span className={styles.optionalTag}>(Optional)</span>
              </label>
              <div className={styles.inputWrapper}>
                <Calendar size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={isSaving}
                  max="2016-12-31"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Preferred Study Language */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-lang" className={styles.label}>
                Preferred Study Language <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <Languages size={16} className={styles.selectIcon} aria-hidden="true" />
                <select
                  id="profile-lang"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as 'Hinglish' | 'English')}
                  disabled={isSaving}
                  className={styles.select}
                >
                  <option value="Hinglish">Hinglish (Recommended for JEE)</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* CARD 2: CONTACT INFORMATION */}
        <section className={styles.card} aria-labelledby="card-contact-title">
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <div className={`${styles.cardIconBox} ${styles.cardIconContact}`}>
                <PhoneCall size={18} aria-hidden="true" />
              </div>
              <div className={styles.cardTitleWrapper}>
                <h2 id="card-contact-title" className={styles.cardTitle}>
                  2. Contact &amp; Guardian Information
                </h2>
                <p className={styles.cardSubtitle}>
                  Verified mobile, registered academic email, residential city, and parent contacts.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.twoColGrid}>
            {/* Mobile Number with Verified Badge & Update Number Action */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="profile-phone-display" className={styles.label}>
                  Registered Mobile Number
                </label>
                <div className={styles.verifiedBadge}>
                  <ShieldCheck size={13} className={styles.shieldIcon} aria-hidden="true" />
                  <span>Verified</span>
                </div>
              </div>
              <div className={styles.phoneDisplayRow}>
                <div className={styles.phoneInputLocked}>
                  <Phone size={16} className={styles.inputIcon} aria-hidden="true" />
                  <span id="profile-phone-display" className={styles.phoneValue}>
                    +91 {phone || '9876543210'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewPhone('');
                    setOtpCode('');
                    setOtpStep('phone');
                    setOtpError(null);
                    setIsOtpModalOpen(true);
                  }}
                  className={styles.changePhoneBtn}
                  aria-label="Update registered mobile number with OTP verification"
                >
                  Update Number
                </button>
              </div>
            </div>

            {/* Read-only Registered Student Email (Slate-100 surface, lock icon) */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="profile-email" className={styles.label}>
                  Registered Student Email
                </label>
                <span className={styles.securityBadge}>
                  <Lock size={12} aria-hidden="true" /> Locked
                </span>
              </div>
              <div className={`${styles.inputWrapper} ${styles.readOnlyWrapper}`}>
                <Mail size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-email"
                  type="email"
                  value={student.email || 'aarav.sharma@jee2026.in'}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className={`${styles.input} ${styles.readOnlyInput}`}
                />
              </div>
              <span className={styles.helperTextLocked}>
                Locked for exam analytics and invoice generation
              </span>
            </div>

            {/* City Dropdown / Input */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-city" className={styles.label}>
                City / Town <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  touched.city && errors.city ? styles.hasError : ''
                }`}
              >
                <MapPin size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-city"
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) validateField('city');
                  }}
                  onBlur={() => handleBlur('city')}
                  disabled={isSaving}
                  required
                  aria-required="true"
                  aria-invalid={touched.city && !!errors.city}
                  aria-describedby={errors.city ? 'profile-city-error' : undefined}
                  className={styles.input}
                  placeholder="e.g. New Delhi"
                />
              </div>
              {touched.city && errors.city && (
                <span id="profile-city-error" className={styles.errorText} role="alert" aria-live="polite">
                  {errors.city}
                </span>
              )}
            </div>

            {/* State / UT Dropdown */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-state" className={styles.label}>
                State / UT <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <MapPin size={16} className={styles.selectIcon} aria-hidden="true" />
                <select
                  id="profile-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isSaving}
                  className={styles.select}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parent / Guardian Name & Parent Mobile side by side */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-parent-name" className={styles.label}>
                Parent / Guardian Name <span className={styles.optionalTag}>(Optional)</span>
              </label>
              <div className={styles.inputWrapper}>
                <UserCheck size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-parent-name"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  disabled={isSaving}
                  className={styles.input}
                  placeholder="e.g. Rajesh Sharma"
                />
              </div>
            </div>

            {/* Parent Mobile Number with Validation Indicator */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="profile-parent-phone" className={styles.label}>
                  Parent Mobile Number <span className={styles.optionalTag}>(Optional)</span>
                </label>
                {parentPhone.replace(/\D/g, '').length === 10 && !errors.parentPhone && (
                  <span className={styles.validationSuccessTag}>
                    <CheckCircle2 size={12} aria-hidden="true" /> 10-digit valid
                  </span>
                )}
              </div>
              <div
                className={`${styles.inputWrapper} ${
                  touched.parentPhone && errors.parentPhone ? styles.hasError : ''
                }`}
              >
                <PhoneCall size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-parent-phone"
                  type="tel"
                  maxLength={10}
                  value={parentPhone}
                  onChange={(e) => {
                    setParentPhone(e.target.value);
                    if (errors.parentPhone) validateField('parentPhone');
                  }}
                  onBlur={() => handleBlur('parentPhone')}
                  disabled={isSaving}
                  className={styles.input}
                  placeholder="10-digit mobile number"
                  aria-invalid={touched.parentPhone && !!errors.parentPhone}
                  aria-describedby={errors.parentPhone ? 'profile-parent-error' : undefined}
                />
              </div>
              {touched.parentPhone && errors.parentPhone && (
                <span id="profile-parent-error" className={styles.errorText} role="alert" aria-live="polite">
                  {errors.parentPhone}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* CARD 3: ACADEMIC TARGET & SCHOOLING */}
        <section className={styles.card} aria-labelledby="card-academic-title">
          <div className={styles.cardHeader}>
            <div className={styles.headerTitleGroup}>
              <div className={`${styles.cardIconBox} ${styles.cardIconAcademic}`}>
                <GraduationCap size={18} aria-hidden="true" />
              </div>
              <div className={styles.cardTitleWrapper}>
                <h2 id="card-academic-title" className={styles.cardTitle}>
                  3. JEE Target &amp; Academic Board
                </h2>
                <p className={styles.cardSubtitle}>
                  Exam targets, target year calculation, school, and board curriculum.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.twoColGrid}>
            {/* Target Exam Preference */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-exam" className={styles.label}>
                Target Exam Preference <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <Target size={16} className={styles.selectIcon} aria-hidden="true" />
                <select
                  id="profile-exam"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  disabled={isSaving}
                  className={styles.select}
                >
                  <option value="JEE Main & Advanced">JEE Main &amp; Advanced</option>
                  <option value="BITSAT">BITSAT</option>
                  <option value="NDA">NDA</option>
                  <option value="JEE Main">JEE Main Only</option>
                  <option value="Class 8–10 Foundation">Class 8–10 Foundation</option>
                </select>
              </div>
            </div>

            {/* Current Class / Stage */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-class" className={styles.label}>
                Current Class / Stage <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <GraduationCap size={16} className={styles.selectIcon} aria-hidden="true" />
                <select
                  id="profile-class"
                  value={targetClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  disabled={isSaving}
                  className={styles.select}
                >
                  <option value="Class 11th">Class 11th</option>
                  <option value="Class 12th">Class 12th</option>
                  <option value="Dropper">Dropper</option>
                  <option value="Class 10th Foundation">Class 10th Foundation</option>
                </select>
              </div>
            </div>

            {/* Target Exam Year with Auto-calculated Informative Chip */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="profile-year" className={styles.label}>
                  Target Exam Year <span className={styles.requiredAsterisk}>*</span>
                </label>
              </div>
              <div className={styles.selectWrapper}>
                <Calendar size={16} className={styles.selectIcon} aria-hidden="true" />
                <select
                  id="profile-year"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  disabled={isSaving}
                  className={styles.select}
                >
                  {validTargetYears.map((yr) => (
                    <option key={yr} value={yr}>
                      JEE {yr}
                    </option>
                  ))}
                </select>
              </div>
              {/* Informative Chip: [Auto-calculated: JEE 2028 based on Class 11th enrollment] */}
              <div className={styles.autoCalcChip}>
                Auto-calculated: JEE {targetYear} based on {targetClass} enrollment
              </div>
            </div>

            {/* School / Junior College Name & Education Board */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-school" className={styles.label}>
                School / Junior College Name <span className={styles.optionalTag}>(Optional)</span>
              </label>
              <div className={styles.inputWrapper}>
                <Building2 size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="profile-school"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={isSaving}
                  className={styles.input}
                  placeholder="e.g. DPS R.K. Puram"
                />
              </div>
            </div>

            {/* Education Board */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-board" className={styles.label}>
                Education Board <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <BookOpen size={16} className={styles.selectIcon} aria-hidden="true" />
                <select
                  id="profile-board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value as any)}
                  disabled={isSaving}
                  className={styles.select}
                >
                  <option value="CBSE">CBSE (Central Board)</option>
                  <option value="ICSE">ICSE / ISC</option>
                  <option value="State Board">State Board</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* 6. BOTTOM STICKY ACTION BAR */}
        <aside className={styles.stickyActionBar} aria-label="Save Profile Actions">
          <div className={styles.autoSaveIndicator}>
            <span className={styles.encryptedDot} aria-hidden="true" />
            <span className={styles.indicatorText}>
              Last saved: Just now • All changes encrypted
            </span>
          </div>

          <div className={styles.ctaButtonGroup}>
            {/* Outline Neutral: Discard Changes */}
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className={styles.discardBtn}
              aria-label="Discard changes made to student profile"
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Discard Changes</span>
            </button>

            {/* Solid Electric Blue: Save Changes with Loading Spinner */}
            <button
              type="submit"
              disabled={!isDirty || !isValid || isSaving}
              className={styles.saveChangesBtn}
              aria-label="Save changes to student profile"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className={styles.spin} aria-hidden="true" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={16} aria-hidden="true" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </form>

      {/* OTP CHANGE MOBILE MODAL */}
      {isOtpModalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsOtpModalOpen(false)}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="otp-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 id="otp-modal-title" className={styles.modalTitle}>
                {otpStep === 'phone' ? 'Change Mobile Number' : 'Verify Mobile OTP'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.modalBody}>
              {otpError && (
                <div className={styles.modalErrorBanner} role="alert">
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{otpError}</span>
                </div>
              )}

              {otpStep === 'phone' ? (
                <div className={styles.modalStep}>
                  <p className={styles.modalDesc}>
                    Enter your new 10-digit Indian mobile number. A 6-digit one-time password (OTP)
                    will be sent for verification.
                  </p>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="new-phone-input" className={styles.label}>
                      New Mobile Number
                    </label>
                    <div className={styles.inputWrapper}>
                      <Phone size={16} className={styles.inputIcon} aria-hidden="true" />
                      <input
                        id="new-phone-input"
                        type="tel"
                        maxLength={10}
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                        className={styles.input}
                        placeholder="10-digit number"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setIsOtpModalOpen(false)}
                      className={styles.modalCancelBtn}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={newPhone.replace(/\D/g, '').length !== 10 || isSendingOtp}
                      className={styles.modalPrimaryBtn}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 size={15} className={styles.spin} />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.modalStep}>
                  <p className={styles.modalDesc}>
                    Enter the 6-digit OTP code dispatched to <strong>+91 {newPhone}</strong> (Hint:
                    Demo code <code>123456</code>).
                  </p>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="otp-code-input" className={styles.label}>
                      Verification Code
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="otp-code-input"
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className={`${styles.input} ${styles.otpInput}`}
                        placeholder="123456"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setOtpStep('phone')}
                      className={styles.modalCancelBtn}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpCode.length < 4 || isSendingOtp}
                      className={styles.modalPrimaryBtn}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 size={15} className={styles.spin} />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        'Verify & Update'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

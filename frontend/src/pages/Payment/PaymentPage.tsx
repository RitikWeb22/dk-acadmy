import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  Zap,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  Tag,
  Check,
  X,
  CreditCard,
  Smartphone,
  Building,
  ShieldCheck,
  Sparkles,
  Lock
} from 'lucide-react';
import { useStudentAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COURSES_CATALOG, FREE_COURSES_CATALOG } from '../../data/coursesData';
import { cmsService } from '../../services/cmsService';
import { paymentService } from '../../services/paymentService';
import { couponService } from '../../services/couponService';
import type { Course } from '../../types';
import styles from './PaymentPage.module.scss';

// ─── Configuration ───
const BRAND_NAME = 'DK Academy JEE';
const BUSINESS_STATE = 'Rajasthan'; // Kota Head Office for GST jurisdiction
const COUNSELOR_WHATSAPP_LINK =
  'https://wa.me/918826444207?text=Hi%20DK%20Academy%2C%20I%20need%20help%20with%20Class%2011th%20Self-Study%20DLP%20Checkout';

// 28 Indian States & 8 Union Territories
const INDIAN_STATES_AND_UT = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

interface CouponData {
  type: 'flat' | 'percent';
  value: number;
  label: string;
}

const VERIFIED_COUPONS: Record<string, CouponData> = {
  KOTA10: { type: 'percent', value: 10, label: '10% Kota Merit Scholarship' },
  DKSIR20: { type: 'percent', value: 20, label: '20% Direct Faculty Waiver' },
  EARLYBIRD: { type: 'flat', value: 1000, label: '₹1,000 Early Bird Batch Discount' },
  WELCOME500: { type: 'flat', value: 500, label: '₹500 Welcome Discount' }
};

export const PaymentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { student, enrollCourse, isAuthenticated, isLoading } = useStudentAuth();
  const { showToast } = useToast();

  const queryCourseId = searchParams.get('courseId') || searchParams.get('id');
  const targetId = courseId || queryCourseId || 'jee-main-advanced-2yr-ultimate';

  // Guest student notification (instead of hard redirect)
  const isGuestStudent = !isLoading && (!isAuthenticated || !student);

  // Resolve Course Data
  const course: Course = useMemo(() => {
    const cmsCourses = cmsService.getCourses();
    const foundCms = cmsCourses.find((c) => c.id === targetId || c._id === targetId || (c as any).slug === targetId);
    if (foundCms) return foundCms;

    const allStatic = [...FREE_COURSES_CATALOG, ...COURSES_CATALOG];
    const foundStatic = allStatic.find((c) => c.id === targetId || c._id === targetId || (c as any).slug === targetId);
    if (foundStatic) return foundStatic;

    return (
      COURSES_CATALOG[0] || {
        id: 'jee-class11-dlp',
        title: 'Self-Study Distance Learning Package',
        targetExam: 'JEE Main & Advanced',
        targetClass: 'Class 11th',
        numericPrice: 18500,
        price: '₹18,500',
        originalPrice: '₹36,000',
        mode: 'Self-Paced',
        description: 'Video classes + DPP + CBT Test Series · Full academic session · English & Hinglish',
        features: []
      }
    );
  }, [targetId]);

  // Form State
  const [fullName, setFullName] = useState(student?.name || '');
  const [whatsapp, setWhatsapp] = useState(student?.phone || '');
  const [email, setEmail] = useState(student?.email || '');
  const [selectedState, setSelectedState] = useState('Rajasthan');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Sync with student context
  useEffect(() => {
    if (student) {
      if (student.name && !fullName) setFullName(student.name);
      if (student.phone && !whatsapp) setWhatsapp(student.phone.replace(/\D/g, '').slice(-10));
      if (student.email && !email) setEmail(student.email);
    }
  }, [student]);

  // Coupon State
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; data: CouponData } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Validation & Processing
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validations
  const isNameValid = fullName.trim().length >= 3;
  const isWhatsappValid = /^[6-9]\d{9}$/.test(whatsapp.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid = isNameValid && isWhatsappValid && isEmailValid && agreedToTerms;

  // Base Course MRP (Default 18,500 if not specified)
  const baseMRP = useMemo(() => {
    if (course.numericPrice && course.numericPrice > 0) return course.numericPrice;
    const parsed = course.price?.replace(/\D/g, '');
    return parsed ? parseInt(parsed, 10) : 18500;
  }, [course]);

  // Coupon & GST Calculations
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.data.type === 'percent') {
      return Math.round((baseMRP * appliedCoupon.data.value) / 100);
    }
    return Math.min(appliedCoupon.data.value, baseMRP);
  }, [appliedCoupon, baseMRP]);

  const finalPayableTotal = Math.max(0, baseMRP - couponDiscount);

  // Taxable Base = Net Payable / 1.18
  const taxableBaseFee = useMemo(() => {
    return Math.round((finalPayableTotal / 1.18) * 100) / 100;
  }, [finalPayableTotal]);

  const totalGstAmount = useMemo(() => {
    return Math.round((finalPayableTotal - taxableBaseFee) * 100) / 100;
  }, [finalPayableTotal, taxableBaseFee]);

  const isIntraState = selectedState.toLowerCase() === BUSINESS_STATE.toLowerCase();
  const cgstAmount = isIntraState ? Math.round((totalGstAmount / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((totalGstAmount / 2) * 100) / 100 : 0;
  const igstAmount = !isIntraState ? totalGstAmount : 0;

  // Coupon Handlers
  const handleApplyCoupon = async () => {
    const cleanCode = couponCodeInput.trim().toUpperCase();
    setCouponError(null);
    setCouponSuccess(null);

    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    try {
      const res = await couponService.validateAndApply(cleanCode, baseMRP);
      if (res.success && res.data) {
        const discountVal = res.discountAmount || 0;
        setAppliedCoupon({
          code: cleanCode,
          data: {
            type: res.data.discountType || 'percent',
            value: res.data.discountValue || discountVal,
            label: res.label || `${cleanCode} Applied`
          }
        });
        setCouponCodeInput('');
        setCouponSuccess(`✓ ${cleanCode} applied! Saved ₹${discountVal.toLocaleString('en-IN')}`);
        showToast(`Coupon ${cleanCode} applied! Saved ₹${discountVal.toLocaleString('en-IN')}`, 'success');
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      const matched = VERIFIED_COUPONS[cleanCode];
      if (matched) {
        setAppliedCoupon({ code: cleanCode, data: matched });
        setCouponCodeInput('');
        setCouponSuccess(`✓ ${cleanCode} applied! ${matched.label}`);
        showToast(`Coupon ${cleanCode} applied successfully!`, 'success');
      } else {
        setCouponError(err.message || 'Invalid or expired coupon code.');
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponSuccess(null);
    showToast('Coupon removed.', 'info');
  };

  // Payment Handler
  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMsg(null);

    if (!isFormValid) {
      setErrorMsg('Please fill in all required fields correctly and accept the Terms & Conditions.');
      return;
    }

    setIsProcessing(true);

    try {
      await paymentService.initCourseCheckout({
        amount: finalPayableTotal,
        courseId: course.id,
        courseTitle: course.title,
        studentName: fullName.trim() || student?.name || 'Student Aspirant',
        studentEmail: email.trim() || student?.email || 'student@dkacademyjee.com',
        studentPhone: whatsapp.trim(),
        onSuccess: (paymentId: string) => {
          setIsProcessing(false);
          if (appliedCoupon?.code) {
            couponService.validateAndApply(appliedCoupon.code, baseMRP, true).catch(() => {});
          }
          localStorage.setItem(`course_paid_${course.id}`, 'true');
          enrollCourse(course.id);
          showToast(`Payment successful via Razorpay (Txn #${paymentId})! Welcome to ${course.title}`, 'success');
          navigate(`/learn/${course.id}`);
        },
        onError: (err: string) => {
          setIsProcessing(false);
          setErrorMsg(err);
          showToast(err, 'error');
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      const msg = err.message || 'Payment initialization failed. Please check internet connection.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const courseTag = `${(course.targetExam || 'JEE MAIN & ADVANCED').toUpperCase()} · ${(course.targetClass || 'CLASS 11TH').toUpperCase()}`;

  return (
    <div className={styles.checkoutPageRoot}>
      <div className={styles.container}>
        {/* ─── Top Header Bar ─── */}
        <header className={styles.topBar}>
          {/* Brand */}
          <div className={styles.brandBox}>
            <div className={styles.brandLogoSquare}>DK</div>
            <span className={styles.brandName}>{BRAND_NAME}</span>
          </div>

          {/* 3-Step Progress Indicator */}
          <nav aria-label="Checkout Progress" className={styles.progressNav}>
            <div className={styles.stepInactive}>
              <span className={styles.stepNumberInactive}>1</span>
              <span>Details</span>
            </div>
            <span className={styles.stepArrow}>›</span>
            <div className={styles.stepActive}>
              <span className={styles.stepNumberActive}>2</span>
              <span>Payment</span>
            </div>
            <span className={styles.stepArrow}>›</span>
            <div className={styles.stepInactive}>
              <span className={styles.stepNumberInactive}>3</span>
              <span>Access</span>
            </div>
          </nav>
        </header>

        {/* ─── Main Two-Column Layout ─── */}
        <div className={styles.layoutGrid}>
          {/* ════════ LEFT COLUMN ════════ */}
          <div className={styles.leftColumn}>
            {/* 1. Course Summary Card */}
            <section className={`${styles.whiteCard} ${styles.courseSummaryCard}`}>
              <div className={styles.courseSummaryHeader}>
                <div className={styles.courseIconBox}>
                  <GraduationCap size={26} />
                </div>
                <div className={styles.courseInfoBox}>
                  <div className={styles.courseTagBadge}>{courseTag}</div>
                  <h1 className={styles.courseTitleHeading}>{course.title}</h1>
                  <p className={styles.courseDescriptionLine}>
                    {course.description || 'Video classes + DPP + CBT Test Series · Full academic session · English & Hinglish'}
                  </p>
                  <div className={styles.mentorBadge}>
                    <img
                      src="/img/dk-sir.jpg"
                      alt="Dharmendra Kumar (DK Sir)"
                      className={styles.mentorAvatar}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/img/founder.jpeg';
                      }}
                    />
                    <span>Mentor: Dharmendra Kumar (DK Sir)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. "Your Details" Card */}
            <section className={`${styles.whiteCard} ${styles.detailsCard}`}>
              <div className={styles.cardHeaderStrip}>
                <h2 className={styles.cardHeading}>Your Details</h2>
                <span className={styles.cardHeadingNote}>Mandatory for invoice &amp; LMS activation</span>
              </div>

              {isGuestStudent && (
                <div className={styles.guestLoginPromptBanner}>
                  <span>💡 Already registered on DK Academy JEE?</span>
                  <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                    Sign in to auto-fill details &rarr;
                  </Link>
                </div>
              )}

              {errorMsg && (
                <div className={styles.errorAlertBox} role="alert">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className={styles.formFieldsStack}>
                {/* Full Name */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="fullName" className={styles.fieldLabel}>
                    Full Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter student full name"
                    className={`${styles.inputField} ${submitted && !isNameValid ? styles.inputFieldError : ''}`}
                    disabled={isProcessing}
                  />
                  {submitted && !isNameValid && (
                    <p className={styles.fieldErrorText}>Please enter student full name (minimum 3 characters).</p>
                  )}
                </div>

                {/* WhatsApp Number with separate +91 prefix box */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="whatsapp" className={styles.fieldLabel}>
                    WhatsApp Number <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.phoneInputRow}>
                    <div className={styles.countryCodeBox}>+91</div>
                    <input
                      id="whatsapp"
                      type="tel"
                      maxLength={10}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className={`${styles.inputField} ${styles.phoneInputField} ${
                        submitted && !isWhatsappValid ? styles.inputFieldError : ''
                      }`}
                      disabled={isProcessing}
                    />
                  </div>
                  {submitted && !isWhatsappValid ? (
                    <p className={styles.fieldErrorText}>Please enter a valid 10-digit Indian mobile number.</p>
                  ) : (
                    <p className={styles.fieldHint}>Batch updates and schedule notifications will be sent to this number.</p>
                  )}
                </div>

                {/* Email Address */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="email" className={styles.fieldLabel}>
                    Email Address <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={`${styles.inputField} ${submitted && !isEmailValid ? styles.inputFieldError : ''}`}
                    disabled={isProcessing}
                  />
                  <p className={styles.emailLmsHint}>ⓘ LMS login credentials will be sent to this email address</p>
                  {submitted && !isEmailValid && (
                    <p className={styles.fieldErrorText}>Please enter a valid email address.</p>
                  )}
                </div>

                {/* State Dropdown */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="state" className={styles.fieldLabel}>
                    State / Union Territory <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    id="state"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className={styles.selectDropdown}
                    disabled={isProcessing}
                  >
                    {INDIAN_STATES_AND_UT.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <p className={styles.fieldHint}>GST jurisdiction will be determined based on your selected state.</p>
                </div>

              </div>
            </section>

            {/* 3. Payment Confirmation */}
            <section className={`${styles.whiteCard} ${styles.paymentConfirmationCard}`}>
              <div className={styles.cardHeaderStrip}>
                <h2 className={styles.cardHeading}>Select Payment Gateway</h2>
                <span className={styles.cardHeadingNote}>Secure online payment powered by Razorpay</span>
              </div>

              {/* Razorpay Dedicated Gateway Card */}
              <div className={styles.razorpayGatewayBox}>
                <div className={styles.gatewayHeaderRow}>
                  <div className={styles.gatewayBrandInfo}>
                    <div className={styles.razorpayLogoBadge}>
                      <span>Razorpay</span>
                    </div>
                    <div>
                      <h3 className={styles.gatewayTitle}>Razorpay Trusted Payment Gateway</h3>
                      <p className={styles.gatewaySub}>Official 256-bit Encrypted Checkout • RBI Authorized</p>
                    </div>
                  </div>
                  <span className={styles.activeGatewayPill}>
                    <Check size={12} /> Active Gateway
                  </span>
                </div>

                {/* Supported Payment Channels */}
                <div className={styles.paymentMethodsOverview}>
                  <div className={styles.methodChip}>
                    <Smartphone size={16} color="#2563eb" />
                    <div>
                      <span className={styles.methodName}>UPI Instant</span>
                      <span className={styles.methodSub}>GPay, PhonePe, Paytm, QR</span>
                    </div>
                  </div>
                  <div className={styles.methodChip}>
                    <CreditCard size={16} color="#059669" />
                    <div>
                      <span className={styles.methodName}>Cards</span>
                      <span className={styles.methodSub}>Visa, Mastercard, RuPay</span>
                    </div>
                  </div>
                  <div className={styles.methodChip}>
                    <Building size={16} color="#7c3aed" />
                    <div>
                      <span className={styles.methodName}>NetBanking</span>
                      <span className={styles.methodSub}>50+ Indian Banks</span>
                    </div>
                  </div>
                  <div className={styles.methodChip}>
                    <ShieldCheck size={16} color="#d97706" />
                    <div>
                      <span className={styles.methodName}>Wallets &amp; EMI</span>
                      <span className={styles.methodSub}>PayLater &amp; No-Cost EMI</span>
                    </div>
                  </div>
                </div>

                {(course.id === 'jee-pyq-archive-mastery' || targetId.includes('pyq')) && (
                  <div className={styles.pyqUnlockFeatureAlert}>
                    <Sparkles size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      <strong>Instant PYQ Unlock:</strong> All 500+ Chapter-wise Questions, DK Sir 20-30s Shortcuts Video Solutions &amp; Downloadable Kota PDF Solutions will be unlocked immediately upon payment.
                    </span>
                  </div>
                )}
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className={styles.termsWrapper}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.termsText}>
                    I have read and agree to the <Link to="/terms" target="_blank" className={styles.termsLink}>Terms &amp; Conditions</Link>,{' '}
                    <Link to="/privacy" target="_blank" className={styles.termsLink}>Privacy Policy</Link>, and{' '}
                    <Link to="/refund" target="_blank" className={styles.termsLink}>7-Day Refund Policy</Link>.
                  </span>
                </label>
                {submitted && !agreedToTerms && (
                  <p className={styles.fieldErrorText}>Please agree to the terms and refund policy to proceed with payment.</p>
                )}
              </div>

              {/* Full-width Big Pay Button */}
              <button
                type="button"
                disabled={!agreedToTerms || isProcessing}
                onClick={handleProceedPayment}
                className={`${styles.payNowButton} ${
                  !agreedToTerms || isProcessing ? styles.payNowButtonDisabled : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className={styles.buttonSpinner} />
                    <span>Connecting to Razorpay Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Pay ₹{finalPayableTotal.toLocaleString('en-IN')} via Razorpay</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Bottom Razorpay Guarantee Line */}
              <p className={styles.razorpaySecurityNotice}>
                Powered by Razorpay · 256-bit encrypted · PCI-DSS Level 1 Certified
              </p>
            </section>
          </div>

          {/* ════════ RIGHT COLUMN (3 Sticky Cards on Desktop) ════════ */}
          <aside className={styles.rightColumn} aria-label="Order and Fee Summary">
            {/* Card 1: Order Summary with GST Breakdown */}
            <section className={`${styles.whiteCard} ${styles.orderSummaryCard}`}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryRowsList}>
                {/* Course Fee before tax */}
                <div className={styles.summaryRow}>
                  <span>Course fee (before tax)</span>
                  <span className={styles.summaryValue}>
                    ₹{taxableBaseFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Coupon Discount */}
                <div className={`${styles.summaryRow} ${styles.couponDiscountRow}`}>
                  <span>Coupon discount</span>
                  <span>− ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>

                {/* GST Tax Breakdown */}
                {isIntraState ? (
                  <>
                    <div className={styles.summaryRow}>
                      <span>CGST (9%)</span>
                      <span className={styles.summaryValue}>
                        ₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>SGST (9%)</span>
                      <span className={styles.summaryValue}>
                        ₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className={styles.summaryRow}>
                    <span>IGST (18%)</span>
                    <span className={styles.summaryValue}>
                      ₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Payable (30px Bold) */}
              <div className={styles.totalPayableContainer}>
                <div className={styles.totalPayableRow}>
                  <span className={styles.totalLabel}>Total payable</span>
                  <span className={styles.totalAmountNumber}>
                    ₹{finalPayableTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className={styles.allTaxesNote}>All taxes included</p>
              </div>

              {/* Coupon Code Section */}
              <div className={styles.couponModuleWrapper}>
                {!appliedCoupon && !isCouponOpen && (
                  <button
                    type="button"
                    onClick={() => setIsCouponOpen(true)}
                    className={styles.couponTriggerLink}
                  >
                    <Tag size={13} />
                    <span>Have a coupon code? Apply here</span>
                  </button>
                )}

                {isCouponOpen && !appliedCoupon && (
                  <div className={styles.couponFormStack}>
                    <div className={styles.couponInputBar}>
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="ENTER COUPON"
                        className={styles.couponCodeInput}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className={styles.couponSubmitBtn}
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className={styles.couponErrorText}>{couponError}</p>}
                    <p className={styles.popularCouponsHint}>
                      Popular codes: <strong>KOTA10</strong>, <strong>EARLYBIRD</strong>
                    </p>
                  </div>
                )}

                {appliedCoupon && (
                  <div className={styles.appliedCouponPill}>
                    <div className={styles.appliedCouponText}>
                      <Check size={14} />
                      <span>{appliedCoupon.code} applied ({appliedCoupon.data.label})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className={styles.removeCouponBtn}
                      title="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Card 2: "What You Will Get" Card */}
            <section className={`${styles.whiteCard} ${styles.inclusionsCard}`}>
              <h3 className={styles.inclusionsTitle}>What You Will Get</h3>

              <ul className={styles.inclusionsList}>
                <li>
                  <CheckCircle2 size={16} className={styles.inclusionCheck} />
                  <span>Complete syllabus video classes (1080p Full HD)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className={styles.inclusionCheck} />
                  <span>Handwritten notes + solved DPPs</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className={styles.inclusionCheck} />
                  <span>All India CBT Test Series</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className={styles.inclusionCheck} />
                  <span>Faculty doubt support</span>
                </li>
              </ul>

              {/* Green line: Instant LMS Access */}
              <div className={styles.instantLmsStrip}>
                <Zap size={14} />
                <span>Instant LMS access immediately upon payment</span>
              </div>
            </section>

            {/* Card 3: Help Card (Counselor WhatsApp) */}
            <section className={`${styles.whiteCard} ${styles.helpCardCenter} ${styles.helpCard}`}>
              <h3 className={styles.helpHeading}>Need help? Talk to an academic counselor</h3>
              <a
                href={COUNSELOR_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappOutlineBtn}
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp</span>
              </a>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

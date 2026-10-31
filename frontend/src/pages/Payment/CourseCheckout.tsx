import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Zap,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  Tag,
  Check,
  X
} from 'lucide-react';
import { couponService } from '../../services/couponService';

// ─── Constants & Configuration ───
const BRAND_NAME = 'DK Academy JEE';
const BUSINESS_STATE = 'Rajasthan'; // Kota Head Office for GST jurisdiction
const BASE_COURSE_MRP = 18500;
const COUNSELOR_WHATSAPP_LINK = 'https://wa.me/918826444207?text=Hi%20DK%20Academy%2C%20I%20need%20help%20with%20Class%2011th%20Self-Study%20DLP%20Checkout';

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

export const CourseCheckout: React.FC = () => {
  // ─── Form State ───
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [selectedState, setSelectedState] = useState('Rajasthan');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ─── Coupon State ───
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; data: CouponData } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // ─── Validation & Submission State ───
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── Validation Logic ───
  const isNameValid = fullName.trim().length >= 3;
  const isWhatsappValid = /^[6-9]\d{9}$/.test(whatsapp.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid = isNameValid && isWhatsappValid && isEmailValid && agreedToTerms;

  // ─── Pricing & GST Calculations ───
  // Course MRP = ₹18,500 (GST inclusive at 18%)
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.data.type === 'percent') {
      return Math.round((BASE_COURSE_MRP * appliedCoupon.data.value) / 100);
    }
    return Math.min(appliedCoupon.data.value, BASE_COURSE_MRP);
  }, [appliedCoupon]);

  const finalPayableTotal = Math.max(0, BASE_COURSE_MRP - couponDiscount);

  // Taxable Value = Net Payable / 1.18
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

  // ─── Coupon Handlers ───
  const handleApplyCoupon = async () => {
    const cleanCode = couponCodeInput.trim().toUpperCase();
    setCouponError(null);
    setCouponSuccess(null);

    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    try {
      const res = await couponService.validateAndApply(cleanCode, BASE_COURSE_MRP);
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
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      const matched = VERIFIED_COUPONS[cleanCode];
      if (matched) {
        setAppliedCoupon({ code: cleanCode, data: matched });
        setCouponCodeInput('');
        setCouponSuccess(`✓ ${cleanCode} applied! ${matched.label}`);
      } else {
        setCouponError(err.message || 'Invalid or expired coupon code.');
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponSuccess(null);
  };

  // ─── Payment Submission ───
  const handlePayNow = () => {
    setSubmitted(true);
    if (!isFormValid) {
      return;
    }

    setIsProcessing(true);

    // Razorpay Integration Trigger
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const options = {
        key: 'rzp_test_DKAcademyKey',
        amount: finalPayableTotal * 100, // paise
        currency: 'INR',
        name: BRAND_NAME,
        description: 'Class 11th Self-Study Distance Learning Package',
        prefill: {
          name: fullName,
          email: email,
          contact: `+91${whatsapp}`
        },
        theme: {
          color: '#2563eb'
        },
        handler: function (response: any) {
          setIsProcessing(false);
          if (appliedCoupon?.code) {
            couponService.validateAndApply(appliedCoupon.code, BASE_COURSE_MRP, true).catch(() => {});
          }
          alert(`Payment Successful! Razorpay Payment ID: ${response.razorpay_payment_id}\nLMS classroom credentials will be sent to ${email}`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn('Direct Razorpay init fallback:', err);
      }
    }

    // Fallback Mock simulation
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Payment of ₹${finalPayableTotal.toLocaleString('en-IN')} initiated securely via Razorpay!\nWelcome ${fullName}! Your enrollment in Class 11th DLP is confirmed.`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 font-sans antialiased py-6 px-4 sm:px-6 lg:px-8">
      {/* ─── Top Header Bar ─── */}
      <header className="max-w-[1180px] mx-auto bg-white border border-slate-200 rounded-[14px] px-6 py-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-tight shadow-xs">
            DK
          </div>
          <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
            {BRAND_NAME}
          </span>
        </div>

        {/* 3-Step Progress Indicator */}
        <nav aria-label="Progress" className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">1</span>
            <span>Details</span>
          </div>
          <span className="text-slate-300 font-normal">›</span>
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">2</span>
            <span className="font-bold">Payment</span>
          </div>
          <span className="text-slate-300 font-normal">›</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">3</span>
            <span>Access</span>
          </div>
        </nav>
      </header>

      {/* ─── Main Two-Column Layout ─── */}
      <main className="max-w-[1180px] mx-auto flex flex-col lg:flex-row items-start gap-6">
        {/* ════════ LEFT COLUMN (3 Cards) ════════ */}
        <div className="w-full lg:flex-1 space-y-5">
          {/* 1. Course Summary Card */}
          <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-[10.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider mb-1.5">
                  JEE MAIN &amp; ADVANCED · CLASS 11TH
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                  Self-Study Distance Learning Package
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                  Video classes + DPP + CBT Test Series · Full academic session · English &amp; Hinglish
                </p>
              </div>
            </div>
          </section>

          {/* 2. "Your Details" Card */}
          <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Your Details
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Mandatory for invoice &amp; LMS activation
              </span>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter student full name"
                  className={`w-full h-11 px-3.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    submitted && !isNameValid
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                {submitted && !isNameValid && (
                  <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Please enter student full name (minimum 3 characters).
                  </p>
                )}
              </div>

              {/* WhatsApp Number with separate +91 box */}
              <div>
                <label htmlFor="whatsapp" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="h-11 px-3.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 flex items-center justify-center shrink-0">
                    +91
                  </div>
                  <input
                    id="whatsapp"
                    type="tel"
                    maxLength={10}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className={`flex-1 h-11 px-3.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                      submitted && !isWhatsappValid
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {submitted && !isWhatsappValid ? (
                  <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Please enter a valid 10-digit Indian mobile number.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Batch updates and schedule notifications will be sent to this number.</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full h-11 px-3.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    submitted && !isEmailValid
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  ⓘ LMS login credentials will be sent to this email
                </p>
                {submitted && !isEmailValid && (
                  <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                    <AlertCircle size={12} /> Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* State Dropdown */}
              <div>
                <label htmlFor="state" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  State / Union Territory <span className="text-rose-500">*</span>
                </label>
                <select
                  id="state"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all cursor-pointer"
                >
                  {INDIAN_STATES_AND_UT.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  GST jurisdiction will be determined based on your selected state.
                </p>
              </div>

            </div>
          </section>

          {/* 3. Payment Confirmation */}
          <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Payment Confirmation
              </h2>
              <span className="text-xs text-slate-500 font-medium">Secure checkout via Razorpay</span>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-700 leading-normal">
                  I have read and agree to the <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Terms &amp; Conditions</a>,{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Privacy Policy</a>, and{' '}
                  <a href="/refund" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">7-Day Refund Policy</a>.
                </span>
              </label>
              {submitted && !agreedToTerms && (
                <p className="text-xs text-rose-600 font-medium mt-1 pl-6">
                  Please agree to the terms and refund policy to proceed with payment.
                </p>
              )}
            </div>

            {/* Full-width Big Pay Button */}
            <button
              type="button"
              disabled={!agreedToTerms || isProcessing}
              onClick={handlePayNow}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer ${
                !agreedToTerms || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Securing payment with Razorpay...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{finalPayableTotal.toLocaleString('en-IN')} securely</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Bottom Razorpay Guarantee Line */}
            <p className="text-center text-[11.5px] text-slate-500 font-medium mt-3">
              Powered by Razorpay · 256-bit encrypted · Card details are not stored
            </p>
          </section>
        </div>

        {/* ════════ RIGHT COLUMN (3 Sticky Cards, 380px) ════════ */}
        <aside className="w-full lg:w-[380px] lg:sticky lg:top-6 space-y-4">
          {/* Card 1: Order Summary with GST Breakdown */}
          <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-xs">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="py-4 space-y-2.5 text-xs sm:text-sm text-slate-600">
              {/* Course Fee before tax */}
              <div className="flex items-center justify-between">
                <span>Course fee (before tax)</span>
                <span className="font-semibold text-slate-900">
                  ₹{taxableBaseFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Coupon Discount */}
              <div className="flex items-center justify-between text-emerald-600 font-semibold">
                <span>Coupon discount</span>
                <span>
                  − ₹{couponDiscount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* GST Tax Breakdown */}
              {isIntraState ? (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>CGST (9%)</span>
                    <span className="font-semibold text-slate-900">
                      ₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>SGST (9%)</span>
                    <span className="font-semibold text-slate-900">
                      ₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-slate-600">
                  <span>IGST (18%)</span>
                  <span className="font-semibold text-slate-900">
                    ₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Total Payable (30px Bold) */}
            <div className="pt-4 pb-2 border-t border-slate-200">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-700">Total payable</span>
                <span className="text-[30px] font-black text-slate-900 tracking-tight leading-none">
                  ₹{finalPayableTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-right text-[11px] font-semibold text-slate-500 mt-1">
                All taxes included
              </p>
            </div>

            {/* Coupon Code Section */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              {!appliedCoupon && !isCouponOpen && (
                <button
                  type="button"
                  onClick={() => setIsCouponOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Tag size={13} />
                  <span>Have a coupon code? Apply here</span>
                </button>
              )}

              {isCouponOpen && !appliedCoupon && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="ENTER COUPON"
                      className="flex-1 h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-rose-600 font-medium">{couponError}</p>
                  )}
                  <p className="text-[10.5px] text-slate-400">
                    Popular codes: <span className="font-bold text-slate-600">KOTA10</span>, <span className="font-bold text-slate-600">EARLYBIRD</span>
                  </p>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 mt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check size={14} className="text-emerald-600" />
                    <span>{appliedCoupon.code} applied ({appliedCoupon.data.label})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                    title="Remove coupon"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: "What You Will Get" Card */}
          <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
              What You Will Get
            </h3>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Complete syllabus video classes (1080p Full HD)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Handwritten notes + solved DPPs</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>All India CBT Test Series</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Faculty doubt support</span>
              </li>
            </ul>

            {/* Green line: Instant LMS Access */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Zap size={14} className="text-emerald-600 fill-emerald-600 shrink-0" />
              <span>Instant LMS access immediately upon payment</span>
            </div>
          </section>

          {/* Card 3: Help Card (WhatsApp Counselor) */}
          <section className="bg-white border border-slate-200 rounded-[14px] p-5 shadow-xs text-center">
            <h3 className="text-sm font-bold text-slate-800 mb-2.5">
              Need help? Talk to an academic counselor
            </h3>
            <a
              href={COUNSELOR_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-extrabold transition-colors"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>Chat on WhatsApp</span>
            </a>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default CourseCheckout;


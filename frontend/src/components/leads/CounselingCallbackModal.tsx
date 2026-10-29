import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  X,
  Clock,
  MessageCircle,
  User,
  Phone,
  BookOpen,
  Sunrise,
  Sun,
  Moon,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Target,
  Flame
} from 'lucide-react';

// ─── Component Props ───
export interface CounselingCallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  instituteName?: string;
  centerName?: string;
  coursesList?: string[];
  defaultCourse?: string;
  defaultClass?: 'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper';
  whatsappLink?: string;
  responseTimeText?: string;
  onSubmitSuccess?: (leadData: CounselingLeadData) => void;
}

export interface CounselingLeadData {
  name: string;
  mobile: string;
  course: string;
  classStage: 'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper';
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  message?: string;
}

// ─── Default Configuration ───
const DEFAULT_INSTITUTE = 'DK Academy JEE';
const DEFAULT_CENTER = 'Kota Center';
const DEFAULT_COURSES = [
  'JEE Main & Advanced (2-Year Comprehensive Batch)',
  'Class 11th Self-Study Distance Learning Package (DLP)',
  'Class 12th Fast-Track Rank Booster Batch',
  'Dropper & Repeater IIT-JEE Super 30 Batch',
  'All India CBT Mock Test Series & Chapter DPPs',
  'Class 9th & 10th Foundation & Olympiad Concept Builder'
];
const DEFAULT_WHATSAPP =
  'https://wa.me/918826444207?text=Hi%20DK%20Academy%2C%20I%20would%20like%20to%20speak%20with%20an%20academic%20counselor%20regarding%20JEE%20batches.';
const DEFAULT_RESPONSE_TIME = '15 minutes';

const CLASS_OPTIONS = [
  { id: 'Class 10th' as const, label: 'Class 10th', icon: Sparkles },
  { id: 'Class 11th' as const, label: 'Class 11th', icon: BookOpen },
  { id: 'Class 12th' as const, label: 'Class 12th', icon: Target },
  { id: 'Dropper' as const, label: 'Dropper', icon: Flame }
];

const TIME_SLOTS = [
  {
    id: 'Morning' as const,
    title: 'Morning',
    range: '9 AM – 12 PM',
    icon: Sunrise,
    tintClass: 'bg-amber-50 text-amber-600 border-amber-200'
  },
  {
    id: 'Afternoon' as const,
    title: 'Afternoon',
    range: '12 PM – 4 PM',
    icon: Sun,
    tintClass: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  },
  {
    id: 'Evening' as const,
    title: 'Evening',
    range: '4 PM – 8 PM',
    icon: Moon,
    tintClass: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  }
];

export const CounselingCallbackModal: React.FC<CounselingCallbackModalProps> = ({
  isOpen,
  onClose,
  instituteName = DEFAULT_INSTITUTE,
  centerName = DEFAULT_CENTER,
  coursesList = DEFAULT_COURSES,
  defaultCourse,
  defaultClass = 'Class 11th',
  whatsappLink = DEFAULT_WHATSAPP,
  responseTimeText = DEFAULT_RESPONSE_TIME,
  onSubmitSuccess
}) => {
  // ─── Active Tab State ───
  const [activeTab, setActiveTab] = useState<'callback' | 'whatsapp'>('callback');

  // ─── Form Fields State ───
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [course, setCourse] = useState(defaultCourse || coursesList[0]);
  const [classStage, setClassStage] = useState<'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper'>(defaultClass);
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Evening');
  const [message, setMessage] = useState('');

  // ─── UI & Submission State ───
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<CounselingLeadData | null>(null);

  // ─── Field Errors State ───
  const [errors, setErrors] = useState<{
    name?: string;
    mobile?: string;
    course?: string;
  }>({});

  // ─── Element Refs for Accessibility & Focus Management ───
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const courseSelectRef = useRef<HTMLSelectElement>(null);
  const prevActiveElementRef = useRef<HTMLElement | null>(null);

  // ─── Reset helper ───
  const handleClose = () => {
    setIsSuccess(false);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // ─── Focus restoration & body scroll lock ───
  useEffect(() => {
    if (isOpen) {
      prevActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      if (prevActiveElementRef.current) {
        prevActiveElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // ─── Handle Escape Key & Focus Trap ───
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ─── Input Handlers ───
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 10 digits
    const cleanNumbers = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(cleanNumbers);
    if (errors.mobile) {
      setErrors((prev) => ({ ...prev, mobile: undefined }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  // ─── Validation Logic ───
  const validateForm = (): boolean => {
    const newErrors: { name?: string; mobile?: string; course?: string } = {};

    // Validate Student Name
    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = 'Please enter student full name (minimum 3 characters)';
    }

    // Validate Indian Mobile Number: 10 digits starting with 6, 7, 8, or 9
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required for counselor callback';
    } else if (!indianMobileRegex.test(mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number (starts with 6–9)';
    }

    // Validate Course
    if (!course) {
      newErrors.course = 'Please select a course';
    }

    setErrors(newErrors);

    // Focus first invalid element
    if (newErrors.name) {
      nameInputRef.current?.focus();
      return false;
    }
    if (newErrors.mobile) {
      mobileInputRef.current?.focus();
      return false;
    }
    if (newErrors.course) {
      courseSelectRef.current?.focus();
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  // ─── Form Submission ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const leadPayload: CounselingLeadData = {
      name: name.trim(),
      mobile: mobile.trim(),
      course,
      classStage,
      timeSlot,
      message: message.trim() || undefined
    };

    try {
      // TODO: Replace with live backend API call
      // await fetch('/api/callback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(leadPayload)
      // });

      // Simulate network request delay (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSubmittedData(leadPayload);
      setIsSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(leadPayload);
      }
    } catch (err) {
      console.error('Failed to submit callback request', err);
      setErrors((prev) => ({
        ...prev,
        mobile: 'Unable to connect to server. Please try WhatsApp or call directly.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="counseling-modal-title"
      aria-describedby="counseling-modal-desc"
    >
      {/* ─── Backdrop Overlay with Blur ─── */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ─── Modal Container (Bottom Sheet on Mobile, Centered on Desktop) ─── */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[calc(100vw-32px)] sm:max-w-[520px] bg-white rounded-t-[20px] sm:rounded-[18px] shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ─── Header ─── */}
        <div className="p-5 sm:p-6 pb-4 sm:pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            {/* 48px Rounded Icon Box */}
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-blue-100/60">
              <GraduationCap size={26} strokeWidth={1.8} />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2
                id="counseling-modal-title"
                className="text-[19px] font-bold text-slate-900 tracking-tight leading-snug"
              >
                Free Counseling Callback
              </h2>
              <p id="counseling-modal-desc" className="text-[13px] text-slate-600 font-medium mt-0.5">
                {instituteName} · {centerName} &amp; Online Batches
              </p>
            </div>
          </div>

          {/* Circular Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* ─── Scrollable Modal Body ─── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {/* ════════ SUCCESS STATE ════════ */}
          {isSuccess ? (
            <div className="text-center py-6 px-2 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 ring-8 ring-emerald-50">
                <CheckCircle2 size={36} strokeWidth={1.8} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">Request mil gayi!</h3>

              <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
                <strong className="text-slate-800 font-semibold">{responseTimeText}</strong> ke andar hamare senior
                academic counselor aapko call karenge.
              </p>

              {/* Lead Summary Card */}
              {submittedData && (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6 text-xs text-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User size={13} strokeWidth={1.8} className="text-slate-400" />
                      Student Name:
                    </span>
                    <span className="font-bold text-slate-900">{submittedData.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone size={13} strokeWidth={1.8} className="text-slate-400" />
                      Mobile Number:
                    </span>
                    <span className="font-bold text-slate-900">+91 {submittedData.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <GraduationCap size={13} strokeWidth={1.8} className="text-slate-400" />
                      Target Class:
                    </span>
                    <span className="font-bold text-slate-900">{submittedData.classStage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={1.8} className="text-slate-400" />
                      Preferred Slot:
                    </span>
                    <span className="font-bold text-blue-600">{submittedData.timeSlot}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* ─── Segmented Control Tabs ─── */}
              <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1 mb-5" role="tablist">
                {/* Tab 1: Schedule Callback */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'callback'}
                  onClick={() => setActiveTab('callback')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[42px] ${
                    activeTab === 'callback'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock size={16} strokeWidth={1.8} />
                  <span>Schedule a Callback</span>
                </button>

                {/* Tab 2: WhatsApp */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'whatsapp'}
                  onClick={() => setActiveTab('whatsapp')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[42px] ${
                    activeTab === 'whatsapp'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle size={16} strokeWidth={1.8} />
                  <span>WhatsApp</span>
                  <span className="ml-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    FASTEST
                  </span>
                </button>
              </div>

              {/* ════════ WHATSAPP TAB VIEW ════════ */}
              {activeTab === 'whatsapp' ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4 border border-emerald-100">
                    <MessageCircle size={28} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">Direct Academic WhatsApp Helpline</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto mb-6">
                    Connect directly with DK Sir’s Kota counseling team on WhatsApp for instant batch roadmaps and fee
                    details.
                  </p>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-[50px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-colors text-sm sm:text-base cursor-pointer"
                  >
                    <MessageCircle size={20} strokeWidth={1.8} />
                    <span>Chat on WhatsApp</span>
                    <ArrowRight size={18} strokeWidth={1.8} />
                  </a>

                  <p className="text-xs text-slate-500 text-center mt-3 font-medium">Aam taur par jaldi reply milta hai</p>
                </div>
              ) : (
                /* ════════ CALLBACK FORM VIEW ════════ */
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* 1. Name & Mobile Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Student Name */}
                    <div>
                      <label htmlFor="callback-student-name" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
                        Student Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <User size={18} strokeWidth={1.8} />
                        </div>
                        <input
                          ref={nameInputRef}
                          id="callback-student-name"
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          placeholder="Student full name"
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? 'name-error-text' : undefined}
                          className={`w-full h-[46px] pl-10 pr-3.5 rounded-[10px] border bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                            errors.name
                              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200 bg-rose-50/20'
                              : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500/20'
                          }`}
                        />
                      </div>
                      {errors.name && (
                        <p id="name-error-text" className="text-xs text-rose-600 font-medium mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label htmlFor="callback-mobile" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Phone size={18} strokeWidth={1.8} />
                        </div>
                        <input
                          ref={mobileInputRef}
                          id="callback-mobile"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={mobile}
                          onChange={handleMobileChange}
                          placeholder="10-digit mobile number"
                          aria-invalid={Boolean(errors.mobile)}
                          aria-describedby={errors.mobile ? 'mobile-error-text' : undefined}
                          className={`w-full h-[46px] pl-10 pr-3.5 rounded-[10px] border bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                            errors.mobile
                              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200 bg-rose-50/20'
                              : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500/20'
                          }`}
                        />
                      </div>
                      {errors.mobile && (
                        <p id="mobile-error-text" className="text-xs text-rose-600 font-medium mt-1">
                          {errors.mobile}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Course Selection */}
                  <div>
                    <label htmlFor="callback-course-select" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
                      Interested Course / Program <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <BookOpen size={18} strokeWidth={1.8} />
                      </div>
                      <select
                        ref={courseSelectRef}
                        id="callback-course-select"
                        value={course}
                        onChange={(e) => {
                          setCourse(e.target.value);
                          if (errors.course) setErrors((prev) => ({ ...prev, course: undefined }));
                        }}
                        className="w-full h-[46px] pl-10 pr-8 rounded-[10px] border border-slate-300 bg-white text-base sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer appearance-none"
                      >
                        {coursesList.map((cName) => (
                          <option key={cName} value={cName}>
                            {cName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={16} strokeWidth={1.8} />
                      </div>
                    </div>
                  </div>

                  {/* 3. Current Class Stage (4 Pill Buttons) */}
                  <div>
                    <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
                      Current Class <span className="text-rose-500">*</span>
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Current Class"
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                    >
                      {CLASS_OPTIONS.map((cls) => {
                        const isSelected = classStage === cls.id;
                        const ClassIcon = cls.icon;
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setClassStage(cls.id)}
                            className={`h-[42px] px-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <ClassIcon size={14} strokeWidth={1.8} className="shrink-0" />
                            <span>{cls.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Preferred Time Slot Cards */}
                  <div>
                    <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
                      Preferred Callback Time <span className="text-rose-500">*</span>
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Preferred Callback Time"
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    >
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = timeSlot === slot.id;
                        const SlotIcon = slot.icon;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setTimeSlot(slot.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 min-h-[44px] ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div
                              className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 border ${slot.tintClass}`}
                            >
                              <SlotIcon size={18} strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`text-xs font-bold block leading-tight ${
                                  isSelected ? 'text-blue-600' : 'text-slate-900'
                                }`}
                              >
                                {slot.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                {slot.range}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Optional Message/Goal */}
                  <div>
                    <label
                      htmlFor="callback-optional-query"
                      className="text-[13px] font-semibold text-slate-700 mb-1.5 block"
                    >
                      Questions / Academic Goals <span className="text-slate-400 font-normal ml-1">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3.5 pointer-events-none text-slate-500">
                        <MessageSquare size={18} strokeWidth={1.8} />
                      </div>
                      <textarea
                        id="callback-optional-query"
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Inquiring about scholarship test or batch starting date"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* ─── Trust Badge Box ─── */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
                    <ShieldCheck size={18} strokeWidth={1.8} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Aapka number kisi ke saath share nahi hota. Call sirf academic guidance ke liye.
                    </p>
                  </div>

                  {/* ─── Full-Width Submit CTA Button ─── */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-[52px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 text-sm sm:text-base shadow-sm transition-all cursor-pointer ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Phone size={18} strokeWidth={1.8} />
                        <span>Request Counselor Callback</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounselingCallbackModal;

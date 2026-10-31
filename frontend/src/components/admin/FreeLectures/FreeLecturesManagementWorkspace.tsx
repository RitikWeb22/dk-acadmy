import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Video,
  FileText,
  BookOpen,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  GraduationCap,
  X,
  ShieldCheck,
  Play,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ListFilter
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import styles from './FreeLecturesManagementWorkspace.module.scss';

export interface AdminLectureItem {
  id: string;
  _id?: string;
  title: string;
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed';
  trackId: string;
  trackTitle: string;
  order: number;
  duration: string;
  isFree: boolean;
  price: number;
  discountPrice?: number;
  videoUrl: string;
  thumbnailUrl?: string;
  dppName?: string;
  dppUrl?: string;
  notesPdfUrl?: string;
  facultyName?: string;
  targetExam?: string;
  targetClass?: string;
  tags?: string[];
  badge?: string;
  viewsCount?: number;
  status?: 'Published' | 'Draft';
}

export const PRESET_LECTURE_TAGS: string[] = [
  'Free Preview',
  'PYQ Solutions',
  'Concept Masterclass',
  'Important Questions',
  '20-30s Short Tricks',
  'Formula Revision',
  'Popular',
  'Trending',
  'Most Watched',
  'New'
];

interface StepMilestone {
  stepNumber: number;
  title: string;
  subtitle: string;
}

const STEPS_LIST: StepMilestone[] = [
  {
    stepNumber: 1,
    title: 'Track & Pedagogy Info',
    subtitle: 'Chapter title, subject & target exam'
  },
  {
    stepNumber: 2,
    title: '5-Free Policy & Pricing',
    subtitle: '5-free rule, individual pricing & perks'
  },
  {
    stepNumber: 3,
    title: 'Video Lessons & Curriculum',
    subtitle: 'Lectures, stream links, DPPs & PDFs'
  },
  {
    stepNumber: 4,
    title: 'Live Preview & Publish',
    subtitle: 'Student catalog preview & DB sync'
  }
];

export const FreeLecturesManagementWorkspace: React.FC = () => {
  // Mode: 'wizard' (matches Course Create 1:1) or 'directory' (live MongoDB database management)
  const [viewMode, setViewMode] = useState<'wizard' | 'directory'>('wizard');

  // Stepper state: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // ─── Step 1: Track Information ───
  const [trackTitle, setTrackTitle] = useState('Differential Calculus Shortcuts');
  const [subject, setSubject] = useState<'Mathematics' | 'Physics' | 'Chemistry' | 'Mixed'>('Mathematics');
  const [targetExam, setTargetExam] = useState('JEE Main & Advanced 2026/27');
  const [targetClass, setTargetClass] = useState('Class 12th & Dropper Sprint');
  const [facultyName, setFacultyName] = useState('Dharmendra Kumar (DK Sir) • 18+ Yrs Kota Experience');
  const [trackDescription, setTrackDescription] = useState(
    "Evaluate DK Sir's proprietary 20-30s speed inspection rule and conceptual graphical mechanics for indeterminate limits and derivatives before taking any admission decision."
  );
  const [thumbnailUrl, setThumbnailUrl] = useState('/img/founder.jpeg');
  const [selectedLectureTags, setSelectedLectureTags] = useState<string[]>(['Free Preview', 'Popular']);
  const [customLectureTag, setCustomLectureTag] = useState('');

  const handleToggleLectureTag = (tag: string) => {
    setSelectedLectureTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomLectureTag = () => {
    const trimmed = customLectureTag.trim();
    if (!trimmed) return;
    if (!selectedLectureTags.includes(trimmed)) {
      setSelectedLectureTags((prev) => [...prev, trimmed]);
    }
    setCustomLectureTag('');
  };

  // ─── Step 2: 5-Free Policy & Pricing ───
  const [defaultPaidPrice, setDefaultPaidPrice] = useState('499');
  const [defaultOrigPrice, setDefaultOrigPrice] = useState('999');

  // ─── Step 3: Video Lessons Curriculum ───
  const [lessons, setLessons] = useState<
    Array<{
      id: string;
      title: string;
      videoUrl: string;
      duration: string;
      isFree: boolean;
      price: number;
      dppName: string;
      dppUrl: string;
      notesPdfUrl: string;
      isExpanded: boolean;
    }>
  >([
    {
      id: 'lec-1',
      title: 'Lecture 1: Limits & Indeterminate Forms — 20s Inspection Rule',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '54 min',
      isFree: true,
      price: 0,
      dppName: 'DPP-01: Limits & L-Hopital Shortcuts',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: true
    },
    {
      id: 'lec-2',
      title: 'Lecture 2: Continuity & Differentiability — Graphical Edge Cases',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '58 min',
      isFree: true,
      price: 0,
      dppName: 'DPP-02: Non-Differentiable Cusps & Corners',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: false
    },
    {
      id: 'lec-3',
      title: 'Lecture 3: Definite Integration — King & Queen Property Shortcuts',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '62 min',
      isFree: true,
      price: 0,
      dppName: 'DPP-03: Definite Integral Symmetry Drills',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: false
    },
    {
      id: 'lec-4',
      title: 'Lecture 4: Leibniz Rule & Differential Equations Formation',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '51 min',
      isFree: true,
      price: 0,
      dppName: 'DPP-04: Variable Separable & Integrating Factors',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: false
    },
    {
      id: 'lec-5',
      title: 'Lecture 5: Maxima & Minima Optimization Problems without Second Derivative',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '59 min',
      isFree: true,
      price: 0,
      dppName: 'DPP-05: Optimization & Tangent Constraints',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: false
    },
    {
      id: 'lec-6',
      title: 'Lecture 6: Area Under Curves & Bounding Polygons (Full Batch)',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '65 min',
      isFree: false,
      price: 499,
      dppName: 'DPP-06: Parabola-Line Intersections',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: false
    },
    {
      id: 'lec-7',
      title: 'Lecture 7: Vector Calculus & 3D Geometry Projections (Full Batch)',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '70 min',
      isFree: false,
      price: 499,
      dppName: 'DPP-07: Coplanarity & Shortest Distance',
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: false
    }
  ]);

  // ─── Directory State (Live MongoDB Lectures) ───
  const [dbLectures, setDbLectures] = useState<AdminLectureItem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [dirSubjectFilter, setDirSubjectFilter] = useState<string>('All');
  const [dirAccessFilter, setDirAccessFilter] = useState<'All' | 'FREE' | 'PAID'>('All');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live lectures from MongoDB
  const fetchDbLectures = async () => {
    setIsLoadingDb(true);
    try {
      const res = await apiClient.get<AdminLectureItem[]>('/free-lectures');
      if (res && res.data) {
        setDbLectures(res.data);
      }
    } catch (err) {
      console.error('Error fetching live lectures:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDbLectures();
  }, []);

  // Filtered DB Lectures for Directory view
  const filteredDbLectures = useMemo(() => {
    return dbLectures.filter((l) => {
      const matchSub = dirSubjectFilter === 'All' || l.subject === dirSubjectFilter;
      const matchAcc =
        dirAccessFilter === 'All' ||
        (dirAccessFilter === 'FREE' && l.isFree) ||
        (dirAccessFilter === 'PAID' && !l.isFree);
      const q = directorySearch.toLowerCase().trim();
      const matchQ =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.trackTitle.toLowerCase().includes(q) ||
        (l.dppName && l.dppName.toLowerCase().includes(q));

      return matchSub && matchAcc && matchQ;
    });
  }, [dbLectures, dirSubjectFilter, dirAccessFilter, directorySearch]);

  // Stepper navigation handlers
  const validateStep = (step: number): boolean => {
    setValidationError(null);
    if (step === 1) {
      if (!trackTitle.trim()) {
        setValidationError('Please enter a Track / Chapter Name.');
        return false;
      }
      if (!trackDescription.trim()) {
        setValidationError('Please provide a short pedagogy description.');
        return false;
      }
    }
    if (step === 3) {
      if (lessons.length === 0) {
        setValidationError('Please add at least one video lesson to the curriculum.');
        return false;
      }
      const missingTitle = lessons.find((l) => !l.title.trim());
      if (missingTitle) {
        setValidationError('Every lecture must have a valid title.');
        return false;
      }
    }
    return true;
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const goToPrevStep = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepSelect = (stepNum: number) => {
    if (stepNum < currentStep || validateStep(currentStep)) {
      setCurrentStep(stepNum);
    }
  };

  // Add / Delete / Toggle Lessons in Step 3
  const addNewLesson = () => {
    const num = lessons.length + 1;
    const isFree = num <= 5;
    const price = isFree ? 0 : Number(defaultPaidPrice) || 499;

    const newLec = {
      id: `lec-${Date.now()}-${num}`,
      title: `Lecture ${num}: New Topic & Inspection Rules`,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '50 min',
      isFree,
      price,
      dppName: `DPP-0${num}: Kota Practice Sheet`,
      dppUrl: '/sample-dpp.pdf',
      notesPdfUrl: '/sample-notes.pdf',
      isExpanded: true
    };

    setLessons([...lessons, newLec]);
    showToast(`Added Lecture ${num} (${isFree ? '100% Free Demo' : `Paid Masterclass ₹${price}`})`);
  };

  const removeLesson = (id: string) => {
    setLessons(lessons.filter((l) => l.id !== id));
    showToast('Lesson removed from curriculum.');
  };

  const toggleLessonFreePreview = (id: string, isFree: boolean) => {
    setLessons(
      lessons.map((l) => {
        if (l.id === id) {
          const nextPrice = isFree ? 0 : Number(defaultPaidPrice) || 499;
          return { ...l, isFree, price: nextPrice };
        }
        return l;
      })
    );
  };

  const updateLessonField = (id: string, field: string, value: any) => {
    setLessons(
      lessons.map((l) => {
        if (l.id === id) {
          return { ...l, [field]: value };
        }
        return l;
      })
    );
  };

  // Publish to MongoDB backend in Step 4
  const handlePublishMasterclass = async () => {
    setIsPublishing(true);
    setValidationError(null);
    try {
      const generatedTrackId = trackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Iterate and save each lecture in MongoDB collection
      for (let i = 0; i < lessons.length; i++) {
        const lec = lessons[i];
        await apiClient.post('/free-lectures', {
          title: lec.title,
          subject,
          trackId: generatedTrackId,
          trackTitle,
          order: i + 1,
          duration: lec.duration || '45 min',
          isFree: lec.isFree,
          price: lec.price,
          discountPrice: Number(defaultOrigPrice) || 999,
          videoUrl: lec.videoUrl,
          thumbnailUrl,
          dppName: lec.dppName,
          dppUrl: lec.dppUrl,
          notesPdfUrl: lec.notesPdfUrl,
          facultyName,
          targetExam,
          targetClass,
          description: trackDescription,
          tags: selectedLectureTags,
          badge: selectedLectureTags.find((t) => ['Popular', 'Trending', 'Most Watched', 'New'].includes(t)) || 'Free Preview',
          status: 'Published'
        });
      }

      // Also register as a course in cmsService so it is synchronized across the whole website
      try {
        await cmsService.createCourse({
          id: generatedTrackId,
          slug: generatedTrackId,
          title: trackTitle,
          description: trackDescription || 'Free Kota Demo Masterclass with 20-30s speed inspection algorithms.',
          category: 'JEE Main & Advanced',
          targetClass: (targetClass || 'Class 11 & 12') as any,
          targetYear: 'Target JEE 2026/27',
          targetExam: (targetExam || 'JEE Main & Advanced') as any,
          price: '₹0 Free',
          numericPrice: 0,
          originalPrice: `₹${defaultOrigPrice || '999'}`,
          tier: 'Free',
          mode: 'Structured Recorded',
          courseType: 'recorded',
          duration: `${lessons.length} Lectures`,
          coverImage: thumbnailUrl || '/img/dk-sir.jpg',
          demoVideoUrl: lessons[0]?.videoUrl || '',
          instructor: facultyName || 'Dharmendra Kumar (DK Sir)',
          tags: selectedLectureTags,
          badge: selectedLectureTags.find((t) => ['Popular', 'Trending', 'Most Watched', 'New'].includes(t)) || '100% Free Demo',
          badgeUrgency: 'instant',
          features: [
            `${lessons.length} Kota Video Lessons`,
            'Free Downloadable DPPs & Notes',
            '20-30s Visual Inspection Shortcuts'
          ],
          curriculumSections: [
            {
              id: `sec-${generatedTrackId}`,
              title: trackTitle,
              description: trackDescription,
              durationText: `${lessons.length} lessons`,
              lectures: lessons.map((l, idx) => ({
                id: l.id || `lec-${generatedTrackId}-${idx + 1}`,
                title: l.title,
                duration: l.duration || '45 min',
                isPreview: l.isFree,
                isFreePreview: l.isFree,
                lessonType: 'recorded_video',
                videoStatus: 'ready',
                videoUrl: l.videoUrl,
                description: l.title,
                notesPdfUrl: l.notesPdfUrl,
                dppPdfUrl: l.dppUrl
              }))
            }
          ],
          status: 'Published'
        });
      } catch (cmsErr) {
        console.warn('Error syncing course object:', cmsErr);
      }

      // Dispatch global events so FreeLecturesPage, CoursesPage, and LMS update in real time
      window.dispatchEvent(new CustomEvent('dk_free_lecture_created', { detail: { trackId: generatedTrackId } }));
      window.dispatchEvent(new CustomEvent('dk_course_created', { detail: { courseId: generatedTrackId } }));
      window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { module: 'courses' } }));

      setIsPublished(true);
      showToast('✓ Masterclass track & video lectures published successfully!');
      fetchDbLectures();
    } catch (err: any) {
      console.error('Error publishing masterclass:', err);
      setValidationError('Failed to publish: ' + (err.message || 'Please check network'));
    } finally {
      setIsPublishing(false);
    }
  };

  // Directory: Quick toggle free/paid
  const handleDirectoryToggle = async (lec: AdminLectureItem) => {
    const nextIsFree = !lec.isFree;
    const nextPrice = nextIsFree ? 0 : lec.price > 0 ? lec.price : 499;

    try {
      const res = await apiClient.put(`/free-lectures/${lec.id || lec._id}`, {
        isFree: nextIsFree,
        price: nextPrice
      });
      if (res && res.success) {
        setDbLectures((prev) =>
          prev.map((item) =>
            item.id === lec.id ? { ...item, isFree: nextIsFree, price: nextPrice } : item
          )
        );
        showToast(
          nextIsFree
            ? `✅ "${lec.title}" marked as Free Demo (₹0).`
            : `🔒 "${lec.title}" marked as Paid Masterclass (₹${nextPrice}).`
        );
      }
    } catch (err) {
      showToast('❌ Error updating lecture status.');
    }
  };

  // Directory: Delete
  const handleDirectoryDelete = async (id: string) => {
    try {
      const res = await apiClient.delete(`/free-lectures/${id}`);
      if (res && res.success) {
        setDbLectures((prev) => prev.filter((l) => l.id !== id && l._id !== id));
        showToast('🗑️ Lecture removed.');
      }
    } catch (err) {
      showToast('❌ Error deleting lecture.');
    }
  };

  // Metrics
  const numPaid = parseInt(defaultPaidPrice.replace(/\D/g, '') || '499', 10);
  const numOrig = parseInt(defaultOrigPrice.replace(/\D/g, '') || '999', 10);
  const discountPercent = numOrig > numPaid ? Math.round(((numOrig - numPaid) / numOrig) * 100) : 50;

  const freeLessonsCount = lessons.filter((l) => l.isFree).length;
  const paidLessonsCount = lessons.filter((l) => !l.isFree).length;

  return (
    <div className={styles.courseBuilderShell}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toastNotice} role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs (Matches Course Create 1:1) */}
      <section className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
            <span className={styles.breadcrumbRoot}>Admin Console</span>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbRoot}>Academics</span>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbActive}>Free Lectures Creation</span>
          </nav>
          <h1 className={styles.headingTitle}>Free Lectures Creation</h1>
        </div>

        {/* View Mode Switcher */}
        <div className={styles.viewModeTabs}>
          <button
            type="button"
            className={`${styles.viewModeTab} ${viewMode === 'wizard' ? styles.viewModeTabActive : ''}`}
            onClick={() => setViewMode('wizard')}
          >
            <Plus size={14} />
            <span>Wizard Builder</span>
          </button>
          <button
            type="button"
            className={`${styles.viewModeTab} ${viewMode === 'directory' ? styles.viewModeTabActive : ''}`}
            onClick={() => {
              setViewMode('directory');
              fetchDbLectures();
            }}
          >
            <Layers size={14} />
            <span>Database Roster ({dbLectures.length})</span>
          </button>
        </div>
      </section>

      {/* Validation Banner */}
      {validationError && (
        <div className={styles.validationBanner} role="alert">
          <AlertTriangle size={16} className={styles.alertIcon} />
          <span>{validationError}</span>
          <button
            type="button"
            className={styles.dismissBannerBtn}
            onClick={() => setValidationError(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* VIEW 1: WIZARD BUILDER (Exact 2-Column Stage Architecture)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === 'wizard' ? (
        <div className={styles.builderStageGrid}>
          {/* ─── LEFT FORM STAGE CARD (~75% Width) ─── */}
          <main className={styles.formStageCard} role="region" aria-label="Free Lectures Builder Step">
            {/* Horizontal Modern Stepper Top Bar */}
            <div className={styles.modernStepperTopBar}>
              {STEPS_LIST.map((step) => {
                const isCompleted = step.stepNumber < currentStep;
                const isActive = step.stepNumber === currentStep;
                return (
                  <button
                    key={step.stepNumber}
                    type="button"
                    className={`${styles.stepNavPill} ${isActive ? styles.stepNavPillActive : ''} ${
                      isCompleted ? styles.stepNavPillCompleted : ''
                    }`}
                    onClick={() => handleStepSelect(step.stepNumber)}
                  >
                    <div className={styles.stepNumCircle}>
                      {isCompleted ? <Check size={13} /> : step.stepNumber}
                    </div>
                    <div className={styles.stepMetaText}>
                      <span className={styles.stepMiniLabel}>STEP {step.stepNumber}</span>
                      <span className={styles.stepMainTitle}>{step.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* ================================================== */}
            {/* STEP 1: TRACK & PEDAGOGY INFORMATION               */}
            {/* ================================================== */}
            {currentStep === 1 && (
              <div className={styles.stepContentBlock}>
                <div className={styles.stepCardHeader}>
                  <div className={styles.headerTitleWrap}>
                    <h2 className={styles.stepCardTitle}>Track Information &amp; Pedagogy Assets</h2>
                    <p className={styles.stepCardSubtitle}>
                      Define the masterclass track name, subject classification, target exam tier, and mentor identity.
                    </p>
                  </div>
                  <span className={styles.quickRuleBadge}>
                    <Sparkles size={13} />
                    <span>Kota Evaluation Access</span>
                  </span>
                </div>

                <div className={styles.formMatrix}>
                  {/* Track Name */}
                  <div className={`${styles.fieldCol} ${styles.colFull}`}>
                    <label className={styles.fieldLabel}>
                      Masterclass Track / Chapter Name <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g., Differential Calculus Shortcuts"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                    />
                  </div>

                  {/* Subject */}
                  <div className={styles.fieldCol}>
                    <label className={styles.fieldLabel}>Subject Classification *</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'Mathematics', label: '📐 Mathematics', color: '#2563eb', bg: '#eff6ff' },
                        { key: 'Physics', label: '⚡ Physics', color: '#7c3aed', bg: '#f5f3ff' },
                        { key: 'Chemistry', label: '🧪 Chemistry', color: '#d97706', bg: '#fffbeb' },
                        { key: 'Mixed', label: '🎯 Mixed Sprint', color: '#059669', bg: '#ecfdf5' }
                      ].map((item) => {
                        const isSelected = subject === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSubject(item.key as any)}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              border: isSelected ? `2px solid ${item.color}` : '1px solid #cbd5e1',
                              background: isSelected ? item.bg : '#ffffff',
                              color: isSelected ? item.color : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Exam */}
                  <div className={styles.fieldCol}>
                    <label className={styles.fieldLabel}>Target Exam &amp; Class *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., JEE Main & Advanced 2026/27"
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                    />
                  </div>

                  {/* Faculty Name */}
                  <div className={`${styles.fieldCol} ${styles.colFull}`}>
                    <label className={styles.fieldLabel}>Mentor / Faculty Identity *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., Dharmendra Kumar (DK Sir) • 18+ Yrs Kota Experience"
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className={`${styles.fieldCol} ${styles.colFull}`}>
                    <label className={styles.fieldLabel}>Track Pedagogy Overview &amp; Shortcuts *</label>
                    <textarea
                      rows={4}
                      className={styles.formTextarea}
                      placeholder="Detail the 20-30s speed inspection drills, graphical shortcut methods, and Kota blackboard notes..."
                      value={trackDescription}
                      onChange={(e) => setTrackDescription(e.target.value)}
                    />
                  </div>

                  {/* Thumbnail Image URL */}
                  <div className={`${styles.fieldCol} ${styles.colFull}`}>
                    <label className={styles.fieldLabel}>Blackboard Thumbnail Image URL</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="/img/founder.jpeg"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                    />
                  </div>

                  {/* Lecture Tags & Badges */}
                  <div className={`${styles.fieldCol} ${styles.colFull}`}>
                    <div className={styles.fieldLabelRow}>
                      <label className={styles.fieldLabel}>Lecture Tags &amp; Badges (e.g. Free Preview, Popular, PYQ Solutions)</label>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Tags for students to filter and identify this track
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          className={styles.formSelect}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleToggleLectureTag(e.target.value);
                            }
                          }}
                          style={{ flex: '1 1 240px', minWidth: '220px' }}
                          aria-label="Add lecture tag from dropdown"
                        >
                          <option value="">▼ Select Lecture Tag to Add...</option>
                          {PRESET_LECTURE_TAGS.map((tag) => (
                            <option key={tag} value={tag}>
                              {selectedLectureTags.includes(tag) ? '✓ ' : '+ '} {tag}
                            </option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', gap: '6px', flex: '1 1 200px' }}>
                          <input
                            type="text"
                            placeholder="Type custom tag..."
                            className={styles.formInput}
                            value={customLectureTag}
                            onChange={(e) => setCustomLectureTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomLectureTag();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={handleAddCustomLectureTag}
                            style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}
                          >
                            Add Tag
                          </button>
                        </div>
                      </div>

                      {/* Interactive clickable pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
                          Quick Select:
                        </span>
                        {PRESET_LECTURE_TAGS.map((tag) => {
                          const isSelected = selectedLectureTags.includes(tag);
                          const isPromo = ['popular', 'trending', 'most watched', 'new'].includes(tag.toLowerCase());
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleLectureTag(tag)}
                              style={{
                                border: isSelected ? '1px solid transparent' : '1px solid #cbd5e1',
                                background: isSelected
                                  ? (isPromo ? '#fef3c7' : '#0f172a')
                                  : '#f8fafc',
                                color: isSelected
                                  ? (isPromo ? '#92400e' : '#ffffff')
                                  : '#475569',
                                fontWeight: isSelected ? 700 : 500,
                                borderRadius: '9999px',
                                padding: '4px 11px',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>{tag}</span>
                              {isSelected && <span style={{ fontSize: '0.7rem' }}>✕</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Selected Tags Display */}
                      {selectedLectureTags.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                            Active Tags ({selectedLectureTags.length}):
                          </span>
                          {selectedLectureTags.map((t) => (
                            <span
                              key={t}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              {t}
                              <button
                                type="button"
                                onClick={() => handleToggleLectureTag(t)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#1d4ed8',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontSize: '0.7rem',
                                  lineHeight: 1
                                }}
                                aria-label={`Remove tag ${t}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Field: Live Free Track Card Mockup */}
                  <div className={`${styles.fieldCol} ${styles.colFull}`}>
                    <div className={styles.liveTrackMockupSection}>
                      <div className={styles.liveTrackMockupHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={16} color="#059669" />
                          <span className={styles.liveTrackMockupTitle}>
                            Live Free Track Mockup (Aspirant Library View)
                          </span>
                        </div>
                        <span className={styles.statusPillFree}>
                          <Check size={11} /> Realtime Preview
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                        <div className={styles.liveTrackMockupCard}>
                          <div className={styles.liveTrackThumbWrap}>
                            <img
                              src={thumbnailUrl || '/img/founder.jpeg'}
                              alt={trackTitle || 'Track Thumbnail'}
                              className={styles.liveTrackThumbImg}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/img/founder.jpeg';
                              }}
                            />
                            <div className={styles.liveTrackTopBadges}>
                              <span className={styles.liveTrackSubjectBadge}>
                                {subject}
                              </span>
                              {selectedLectureTags.some((t) => t.toLowerCase() === 'popular') && (
                                <span className={styles.liveTrackPopularBadge}>Popular</span>
                              )}
                            </div>
                            <span className={styles.liveTrackFreeDemoPill}>
                              <Unlock size={11} /> 5 Free Lectures Included
                            </span>
                          </div>

                          <div className={styles.liveTrackCardBody}>
                            <span className={styles.liveTrackExamTag}>{targetExam}</span>
                            <h3 className={styles.liveTrackTitle}>
                              {trackTitle || 'Differential Calculus Shortcuts & 20s Inspection'}
                            </h3>
                            <div className={styles.liveTrackFacultyRow}>
                              <GraduationCap size={14} color="#2563eb" />
                              <span>{facultyName}</span>
                            </div>

                            <div className={styles.liveTrackFreePolicyHighlight}>
                              <span>🎁 Lectures 1–5 Free</span>
                              <span>₹0 Evaluation Tier</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className={styles.bottomActionBar}>
                  <div className={styles.actionLeft}>
                    <span className={styles.stepCounterText}>Step 1 of 4</span>
                  </div>
                  <div className={styles.actionRight}>
                    <button type="button" className={styles.btnPrimaryCta} onClick={goToNextStep}>
                      <span>Next: 5-Free Policy &amp; Pricing</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/* STEP 2: 5-FREE POLICY & PRICING MATRIX             */}
            {/* ================================================== */}
            {currentStep === 2 && (
              <div className={styles.stepContentBlock}>
                <div className={styles.stepCardHeader}>
                  <div className={styles.headerTitleWrap}>
                    <h2 className={styles.stepCardTitle}>5-Free Policy &amp; Paid Unlock Pricing</h2>
                    <p className={styles.stepCardSubtitle}>
                      Configure student evaluation access. The first 5 videos are 100% Free Demo (₹0). Set unlock pricing for subsequent lessons.
                    </p>
                  </div>
                  <span className={styles.quickRuleBadge}>
                    <ShieldCheck size={13} />
                    <span>5-Free Enforcement</span>
                  </span>
                </div>

                {/* Policy Notice Box */}
                <div className={styles.policyMatrixBox}>
                  <div className={styles.policyBadgeRow}>
                    <span className={styles.policyRuleTitle}>
                      <Sparkles size={16} />
                      <span>Kota Evaluation Access Standard: 5 Videos Free</span>
                    </span>
                    <span className={styles.statusPillFree}>
                      <Check size={12} /> Auto-Enforced
                    </span>
                  </div>
                  <p className={styles.policyDescriptionText}>
                    Aspirants evaluating DK Academy JEE get unhindered 1080p access to <strong>Lectures 1 through 5</strong> in our LMS player without paying. Subsequent lectures (6 to 10) prompt students with an Amber Lock and individual unlock fee or batch enrollment.
                  </p>

                  <div className={styles.pricingFieldsGrid}>
                    <div className={styles.fieldCol}>
                      <label className={styles.fieldLabel}>
                        Paid Video Unlock Price (₹) <span className={styles.reqStar}>*</span>
                      </label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.prefixSymbol}>₹</span>
                        <input
                          type="number"
                          min="1"
                          required
                          className={styles.formInputWithPrefix}
                          value={defaultPaidPrice}
                          onChange={(e) => setDefaultPaidPrice(e.target.value)}
                        />
                      </div>
                      <span className={styles.stepCardSubtitle}>Charged per individual paid video</span>
                    </div>

                    <div className={styles.fieldCol}>
                      <label className={styles.fieldLabel}>Original / Strikethrough Price (₹)</label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.prefixSymbol}>₹</span>
                        <input
                          type="number"
                          min="0"
                          className={styles.formInputWithPrefix}
                          value={defaultOrigPrice}
                          onChange={(e) => setDefaultOrigPrice(e.target.value)}
                        />
                      </div>
                      {discountPercent > 0 && (
                        <span className={styles.savingsPill}>Save {discountPercent}% off</span>
                      )}
                    </div>

                    <div className={styles.fieldCol}>
                      <label className={styles.fieldLabel}>Free Preview Tier</label>
                      <input
                        type="text"
                        disabled
                        className={styles.formInput}
                        value="First 5 Videos: ₹0 Free"
                      />
                      <span className={styles.stepCardSubtitle}>Zero payment barrier</span>
                    </div>
                  </div>

                  {/* Visual 5-Free Distribution Meter */}
                  <div className={styles.policyVisualMeter}>
                    <div className={styles.policyMeterTitleRow}>
                      <span>Interactive 5-Free Video Timeline Meter</span>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                        Auto-governed by Pedagogy Rules
                      </span>
                    </div>
                    <div className={styles.policyMeterBar}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isFreeSegment = num <= 5;
                        return (
                          <div
                            key={num}
                            className={`${styles.policyMeterSegment} ${
                              isFreeSegment
                                ? styles.policyMeterSegmentFree
                                : styles.policyMeterSegmentPaid
                            }`}
                            title={
                              isFreeSegment
                                ? `Lecture ${num}: 100% Free Demo (₹0)`
                                : `Lecture ${num}: Paid Masterclass (₹${defaultPaidPrice})`
                            }
                          >
                            #{num}
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.policyMeterLegend}>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDotFree} />
                        <span>Lectures 1–5: 100% Free Demo for All Students (₹0)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDotPaid} />
                        <span>Lectures 6+: Paid Unlock Tier (₹{defaultPaidPrice})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className={styles.bottomActionBar}>
                  <div className={styles.actionLeft}>
                    <button type="button" className={styles.btnSecondaryOutline} onClick={goToPrevStep}>
                      <ChevronLeft size={16} />
                      <span>Prev: Track Info</span>
                    </button>
                  </div>
                  <div className={styles.actionRight}>
                    <span className={styles.stepCounterText}>Step 2 of 4</span>
                    <button type="button" className={styles.btnPrimaryCta} onClick={goToNextStep}>
                      <span>Next: Video Lessons</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/* STEP 3: VIDEO LESSONS & CURRICULUM                 */}
            {/* ================================================== */}
            {currentStep === 3 && (
              <div className={styles.stepContentBlock}>
                <div className={styles.stepCardHeader}>
                  <div className={styles.headerTitleWrap}>
                    <h2 className={styles.stepCardTitle}>Curriculum Lessons &amp; Video Streams</h2>
                    <p className={styles.stepCardSubtitle}>
                      Add video masterclasses. Configure individual free preview vs paid access, stream links, and Kota DPP sheets.
                    </p>
                  </div>
                  <div className={styles.curriculumTopBar}>
                    <span className={styles.curriculumSummaryPill}>
                      {lessons.length} Lessons ({freeLessonsCount} Free, {paidLessonsCount} Paid)
                    </span>
                    <button type="button" className={styles.addLessonBtn} onClick={addNewLesson}>
                      <Plus size={14} />
                      <span>Add Video Lesson</span>
                    </button>
                  </div>
                </div>

                <div className={styles.lessonsCardsList}>
                  {lessons.map((lec, idx) => {
                    const isExpanded = lec.isExpanded;
                    return (
                      <div key={lec.id} className={styles.lessonCardItem}>
                        {/* Accordion Header */}
                        <div
                          className={styles.lessonCardHeader}
                          onClick={() => updateLessonField(lec.id, 'isExpanded', !isExpanded)}
                        >
                          <div className={styles.lessonHeaderLeft}>
                            <span
                              className={`${styles.lessonOrderBadge} ${
                                lec.isFree ? styles.lessonOrderBadgeFree : styles.lessonOrderBadgePaid
                              }`}
                            >
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <h4 className={styles.lessonHeadingTitle}>{lec.title}</h4>
                          </div>

                          <div className={styles.lessonHeaderRight}>
                            {lec.isFree ? (
                              <span className={styles.statusPillFree}>
                                <Unlock size={11} /> 100% Free Demo
                              </span>
                            ) : (
                              <span className={styles.statusPillPaid}>
                                <Lock size={11} /> Paid Masterclass (₹{lec.price})
                              </span>
                            )}
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {lessons.length > 1 && (
                              <button
                                type="button"
                                className={styles.deleteLessonBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLesson(lec.id);
                                }}
                                title="Remove lesson"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Accordion Body */}
                        {isExpanded && (
                          <div className={styles.lessonCardBody}>
                            {/* Title & Duration */}
                            <div className={styles.formMatrix}>
                              <div className={`${styles.fieldCol} ${styles.colFull}`}>
                                <label className={styles.fieldLabel}>Lecture Title *</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={lec.title}
                                  onChange={(e) => updateLessonField(lec.id, 'title', e.target.value)}
                                />
                              </div>

                              <div className={styles.fieldCol}>
                                <label className={styles.fieldLabel}>Video Stream URL (YouTube / HLS / MP4) *</label>
                                <input
                                  type="url"
                                  className={styles.formInput}
                                  value={lec.videoUrl}
                                  onChange={(e) => updateLessonField(lec.id, 'videoUrl', e.target.value)}
                                />
                              </div>

                              <div className={styles.fieldCol}>
                                <label className={styles.fieldLabel}>Duration</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={lec.duration}
                                  onChange={(e) => updateLessonField(lec.id, 'duration', e.target.value)}
                                />
                                <div className={styles.quickDurationRow}>
                                  {['30 min', '45 min', '60 min', '90 min'].map((dur) => (
                                    <button
                                      key={dur}
                                      type="button"
                                      className={`${styles.quickDurationChip} ${
                                        lec.duration === dur ? styles.quickDurationChipActive : ''
                                      }`}
                                      onClick={() => updateLessonField(lec.id, 'duration', dur)}
                                    >
                                      {dur}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Access Policy Toggle */}
                            <div className={styles.lessonAccessConfig}>
                              <label
                                className={`${styles.accessOptionLabel} ${
                                  lec.isFree ? styles.accessOptionSelectedFree : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`access-${lec.id}`}
                                  checked={lec.isFree}
                                  onChange={() => toggleLessonFreePreview(lec.id, true)}
                                />
                                <div className={styles.accessOptionText}>
                                  <strong>100% Free Demo Lesson (₹0)</strong>
                                  <span>Free preview for students (Recommended for lessons 1 to 5)</span>
                                </div>
                              </label>

                              <label
                                className={`${styles.accessOptionLabel} ${
                                  !lec.isFree ? styles.accessOptionSelectedPaid : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`access-${lec.id}`}
                                  checked={!lec.isFree}
                                  onChange={() => toggleLessonFreePreview(lec.id, false)}
                                />
                                <div className={styles.accessOptionText}>
                                  <strong>Paid Masterclass Lesson</strong>
                                  <span>Unlock price: ₹{lec.price || defaultPaidPrice} (Requires enrollment)</span>
                                </div>
                              </label>
                            </div>

                            {/* DPP Sheet & Notes */}
                            <div className={styles.formMatrix}>
                              <div className={styles.fieldCol}>
                                <label className={styles.fieldLabel}>Attached Kota DPP Sheet Title</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={lec.dppName}
                                  onChange={(e) => updateLessonField(lec.id, 'dppName', e.target.value)}
                                />
                              </div>
                              <div className={styles.fieldCol}>
                                <label className={styles.fieldLabel}>Handwritten Notes PDF URL</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={lec.notesPdfUrl}
                                  onChange={(e) => updateLessonField(lec.id, 'notesPdfUrl', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Bar */}
                <div className={styles.bottomActionBar}>
                  <div className={styles.actionLeft}>
                    <button type="button" className={styles.btnSecondaryOutline} onClick={goToPrevStep}>
                      <ChevronLeft size={16} />
                      <span>Prev: 5-Free Policy</span>
                    </button>
                  </div>
                  <div className={styles.actionRight}>
                    <span className={styles.stepCounterText}>Step 3 of 4</span>
                    <button type="button" className={styles.btnPrimaryCta} onClick={goToNextStep}>
                      <span>Next: Preview &amp; Publish</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================== */}
            {/* STEP 4: PREVIEW & PUBLISH                          */}
            {/* ================================================== */}
            {currentStep === 4 && (
              <div className={styles.stepContentBlock}>
                <div className={styles.stepCardHeader}>
                  <div className={styles.headerTitleWrap}>
                    <h2 className={styles.stepCardTitle}>Live Catalog Preview &amp; Platform Publish</h2>
                    <p className={styles.stepCardSubtitle}>
                      Inspect how this demo track will appear on <code>/free-lectures</code> and publish all video masterclasses to MongoDB Atlas.
                    </p>
                  </div>
                  <span className={styles.quickRuleBadge}>
                    <Eye size={13} />
                    <span>Live Catalog Verification</span>
                  </span>
                </div>

                {/* 2-Column Split Preview */}
                <div className={styles.previewSplitGrid}>
                  {/* Left: LMS Student Card Mockup */}
                  <div className={styles.previewCardLeft}>
                    <div className={styles.previewCardSubheading}>
                      <span>Student Catalog Card Preview</span>
                    </div>

                    <div className={styles.lmsStudentCard}>
                      <div className={styles.cardImageContainer}>
                        <img src={thumbnailUrl} alt={trackTitle} className={styles.previewImage} />
                        <span className={styles.badgePromo}>{subject}</span>
                        <span className={styles.badgeTarget}>{freeLessonsCount} Free Lectures</span>
                      </div>

                      <div className={styles.cardInfoContainer}>
                        <div className={styles.mentorRow}>
                          <GraduationCap size={14} />
                          <span>{facultyName}</span>
                        </div>

                        <h3 className={styles.catalogTitle}>{trackTitle}</h3>
                        <p className={styles.catalogDesc}>{trackDescription}</p>

                        <div className={styles.demoLecturesPreviewBox}>
                          <span className={styles.demoTopicsHeader}>
                            <Layers size={13} /> 5 Free Demo Lessons Unlocked:
                          </span>
                          <ul className={styles.demoTopicsList}>
                            {lessons.slice(0, 5).map((l, lIdx) => (
                              <li key={l.id} className={styles.demoTopicItem}>
                                <div className={styles.topicItemLeft}>
                                  <Play size={11} fill="currentColor" />
                                  <span>{l.title}</span>
                                </div>
                                <span>{l.duration}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Checklist & Publishing Summary */}
                  <div className={styles.previewSummaryRight}>
                    <div className={styles.previewCardSubheading}>
                      <span>Curriculum &amp; Database Publishing Checklist</span>
                    </div>

                    <div className={styles.checklistMetricsGrid}>
                      <div className={styles.metricTallyCard}>
                        <span className={styles.tallyNum}>{lessons.length}</span>
                        <span className={styles.tallyLabel}>Total Video Lectures</span>
                      </div>
                      <div className={styles.metricTallyCard}>
                        <span className={styles.tallyNum}>{freeLessonsCount}</span>
                        <span className={styles.tallyLabel}>100% Free Demo (₹0)</span>
                      </div>
                      <div className={styles.metricTallyCard}>
                        <span className={styles.tallyNum}>{paidLessonsCount}</span>
                        <span className={styles.tallyLabel}>Paid Masterclasses</span>
                      </div>
                      <div className={styles.metricTallyCard}>
                        <span className={styles.tallyNum}>₹{defaultPaidPrice}</span>
                        <span className={styles.tallyLabel}>Unlock Price / Video</span>
                      </div>
                    </div>

                    {/* Syllabus Review Box */}
                    <div className={styles.syllabusReviewBox}>
                      <h4 className={styles.syllabusReviewTitle}>Curriculum Breakdown ({lessons.length} Lectures):</h4>
                      <ul className={styles.syllabusReviewList}>
                        {lessons.map((lec, idx) => (
                          <li key={lec.id} className={styles.syllabusReviewItem}>
                            <span>
                              <strong>#{idx + 1}:</strong> {lec.title} ({lec.duration})
                            </span>
                            <span className={lec.isFree ? styles.statusPillFree : styles.statusPillPaid}>
                              {lec.isFree ? '🔓 Free Demo' : `🔒 Paid • ₹${lec.price}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.publishStatusBox}>
                      <div className={styles.statusBoxHeader}>
                        <ShieldCheck size={18} />
                        <span>Ready for Live Database Sync</span>
                      </div>
                      <p className={styles.statusBoxText}>
                        Publishing persists all video masterclasses to MongoDB collection <code>freelectures</code> and triggers real-time updates across the platform.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className={styles.bottomActionBar}>
                  <div className={styles.actionLeft}>
                    <button type="button" className={styles.btnSecondaryOutline} onClick={goToPrevStep}>
                      <ChevronLeft size={16} />
                      <span>Prev: Video Lessons</span>
                    </button>
                  </div>
                  <div className={styles.actionRight}>
                    <span className={styles.stepCounterText}>Step 4 of 4</span>
                    <button
                      type="button"
                      className={styles.btnPublishCta}
                      onClick={handlePublishMasterclass}
                      disabled={isPublished || isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : isPublished ? (
                        <>
                          <Check size={18} />
                          <span>✓ Masterclass Published</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>✓ Publish Masterclass Track</span>
                        </>
                      )}
                    </button>

                    {isPublished && (
                      <Link to="/free-lectures" target="_blank" rel="noreferrer" className={styles.btnSecondaryOutline}>
                        View Live on Website ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ─── RIGHT STEPPER TRACKER (~25% Width - Matches Course Create 1:1) ─── */}
          <aside className={styles.rightStepperAside} aria-label="Creation Milestones Progress">
            <div className={styles.stepperContainer}>
              <div className={styles.stepperHeader}>
                <h3 className={styles.stepperHeading}>Creation Milestones</h3>
                <span className={styles.stepperSubheading}>
                  Step {currentStep} of {STEPS_LIST.length}
                </span>
              </div>

              <div className={styles.verticalTimeline}>
                {STEPS_LIST.map((step, idx) => {
                  const isCompleted = step.stepNumber < currentStep;
                  const isActive = step.stepNumber === currentStep;

                  return (
                    <div
                      key={step.stepNumber}
                      className={`${styles.stepTimelineItem} ${isActive ? styles.stepActive : ''} ${
                        isCompleted ? styles.stepCompleted : ''
                      }`}
                      onClick={() => handleStepSelect(step.stepNumber)}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Vertical Connector Line */}
                      {idx < STEPS_LIST.length - 1 && (
                        <div
                          className={`${styles.verticalConnector} ${
                            isCompleted ? styles.connectorCompleted : ''
                          }`}
                        />
                      )}

                      {/* Milestone Circle */}
                      <div className={styles.milestoneCircleWrap}>
                        {isCompleted ? (
                          <div className={styles.circleCompleted}>
                            <Check size={14} className={styles.checkIconWhite} />
                          </div>
                        ) : isActive ? (
                          <div className={styles.circleActive}>
                            <span>{step.stepNumber}</span>
                          </div>
                        ) : (
                          <div className={styles.circleUpcoming}>
                            <span>{step.stepNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Step Info */}
                      <div className={styles.stepInfoBlock}>
                        <span className={styles.stepNumberTitle}>Step {step.stepNumber}</span>
                        <h4 className={styles.stepMainTitle}>{step.title}</h4>
                        <p className={styles.stepSubDescription}>{step.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* VIEW 2: DATABASE ROSTER DIRECTORY (Manage Live MongoDB)       */
        /* ───────────────────────────────────────────────────────────── */
        <div className={styles.directoryContainer}>
          <div className={styles.directoryToolbar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search live lectures by title, chapter, or DPP..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterPillsRow}>
              {(['All', 'Mathematics', 'Physics', 'Chemistry'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`${styles.filterBtnPill} ${dirSubjectFilter === sub ? styles.filterBtnPillActive : ''}`}
                  onClick={() => setDirSubjectFilter(sub)}
                >
                  {sub}
                </button>
              ))}

              {[
                { id: 'All', label: 'All' },
                { id: 'FREE', label: 'Free Demo (₹0)' },
                { id: 'PAID', label: 'Paid Masterclasses' }
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={`${styles.filterBtnPill} ${dirAccessFilter === acc.id ? styles.filterBtnPillActive : ''}`}
                  onClick={() => setDirAccessFilter(acc.id as any)}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.directoryTableWrap}>
            <div className={styles.directoryTableHeader}>
              <span>Lecture &amp; Track</span>
              <span>Subject</span>
              <span>Access &amp; Pricing</span>
              <span>Attached DPP</span>
              <span>Action Controls</span>
            </div>

            <div className={styles.directoryTableBody}>
              {filteredDbLectures.map((lec) => (
                <div key={lec.id || lec._id} className={styles.directoryTableRow}>
                  <div className={styles.rowLectureInfo}>
                    <span className={styles.rowNumPill}>#{String(lec.order).padStart(2, '0')}</span>
                    <div className={styles.rowDetails}>
                      <span className={styles.rowTrackName}>{lec.trackTitle}</span>
                      <h4 className={styles.rowTitle}>{lec.title}</h4>
                      <div className={styles.rowMeta}>
                        <span>⏱️ {lec.duration}</span>
                        <span>👨‍🏫 {lec.facultyName}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={styles.statusPillFree}>{lec.subject}</span>
                  </div>

                  <div>
                    {lec.isFree ? (
                      <span className={styles.statusPillFree}>
                        <Unlock size={11} /> 100% Free Demo (₹0)
                      </span>
                    ) : (
                      <span className={styles.statusPillPaid}>
                        <Lock size={11} /> Paid Masterclass • ₹{lec.price}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className={styles.rowMeta}>{lec.dppName || 'DPP Included'}</span>
                  </div>

                  <div className={styles.rowActionButtons}>
                    <button
                      type="button"
                      className={`${styles.quickToggleFreeBtn} ${
                        lec.isFree ? styles.toggleMakePaid : styles.toggleMakeFree
                      }`}
                      onClick={() => handleDirectoryToggle(lec)}
                    >
                      {lec.isFree ? <Lock size={12} /> : <Unlock size={12} />}
                      <span>{lec.isFree ? 'Make Paid' : 'Make Free'}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.deleteLessonBtn}
                      onClick={() => handleDirectoryDelete(lec.id || (lec._id as string))}
                      title="Delete from database"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

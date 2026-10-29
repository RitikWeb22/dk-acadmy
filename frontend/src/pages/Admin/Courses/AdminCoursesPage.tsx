import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Copy,
  CheckCircle2,
  Film,
  BookOpen,
  Clock,
  ArrowLeft,
  ArrowRight,
  X,
  FileText,
  AlertCircle,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  Award,
  DollarSign,
  Users,
  Star,
  Check
} from 'lucide-react';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { adminService } from '../../../services/adminService';
import { apiClient } from '../../../services/apiClient';
import { AdminVideoUploadModal } from '../../../components/admin/AdminVideoUploadModal/AdminVideoUploadModal';
import type { Course, CourseCurriculumSection, CourseLectureItem } from '../../../types';
import styles from './AdminCoursesPage.module.scss';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type DetailTab = 'overview' | 'curriculum' | 'students' | 'sales' | 'reviews' | 'resources' | 'settings';

const STEP_LABELS = [
  '1. Basic Info',
  '2. Category',
  '3. Pricing',
  '4. Curriculum',
  '5. Videos',
  '6. Materials',
  '7. Publish'
];

export const AdminCoursesPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [courses, setCourses] = useState<Course[]>(() => cmsService.getCourses());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Upload Modal State
  const [isVideoUploadModalOpen, setIsVideoUploadModalOpen] = useState(false);
  const [selectedUploadCourseId, setSelectedUploadCourseId] = useState<string>('');

  // Course Detail Modal State
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<DetailTab>('overview');

  // 7-Step Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form State for Wizard
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    coverImage: '/img/dk-results-banner.jpeg',
    promotionalBanner: '',
    instructor: 'DK Sir (IIT Delhi Alum, 18+ Yrs Exp)',
    targetAudience: 'Class 11, 12 & Droppers targeting top 500 AIR in JEE',
    outcomes: 'Master complete JEE Advanced Mathematics with 20s inspection shortcuts',
    prerequisites: 'Basic Class 10 NCERT Mathematics concepts',
    language: 'Hinglish (Concepts in English, Explanation in Hindi)',
    duration: '2-Year Full Program',
    seoTitle: 'JEE Main & Advanced Mathematics Comprehensive Course | DK Academy',
    seoDescription: 'Join DK Sir for JEE Main & Advanced comprehensive Mathematics coaching with live classes, DPPs, and private CBT tests.',
    targetExam: 'JEE Main & Advanced' as Course['targetExam'],
    category: 'JEE Main' as Course['category'],
    targetClass: 'Class 11th' as Course['targetClass'],
    targetYear: 'Target JEE 2027',
    mode: 'Live + Recorded' as Course['mode'],
    batchStartDate: '28th May 2026',
    schedule: '4 Days / Week (MWF + Sun)',
    badge: 'Admissions Open 2026-27',
    featuresText: 'DK Sir 20s Techniques, Live Doubts Counter, Complete Study Modules, NTA CBT Mock Series',
    tier: 'Paid' as Course['tier'],
    numericPrice: 78000,
    mrpPrice: 95000,
    status: 'Published' as 'Published' | 'Draft' | 'Archived',
    syllabusPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    testSchedulePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  });

  const [curriculumSections, setCurriculumSections] = useState<CourseCurriculumSection[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mongoCourses = res.data.map((c: any) => ({
          ...c,
          id: c.slug || c._id,
          targetExam: c.category || 'JEE Main & Advanced',
          numericPrice: c.price,
          price: `₹${(c.price || 0).toLocaleString('en-IN')}`,
          mode: c.deliveryMode || 'Online Live',
          features: c.features || [],
          status: c.status || 'Published',
          enrolledCount: c.enrolledCount || Math.floor(Math.random() * 40) + 20,
          rating: c.rating || 4.9,
          lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN') : 'Recent'
        }));
        setCourses(mongoCourses);
        return;
      }
    } catch (e) {
      console.warn('Failed to fetch courses from MongoDB API, using local storage cache', e);
    }
    setCourses(cmsService.getCourses());
  };

  useEffect(() => {
    refreshCourses();
    const handleCmsUpdate = () => refreshCourses();
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);
    window.addEventListener('dk_course_created', handleCmsUpdate);
    window.addEventListener('dk_course_updated', handleCmsUpdate);
    window.addEventListener('dk_course_deleted', handleCmsUpdate);
    window.addEventListener('dk_payment_success', handleCmsUpdate);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('dk_course_created', handleCmsUpdate);
      window.removeEventListener('dk_course_updated', handleCmsUpdate);
      window.removeEventListener('dk_course_deleted', handleCmsUpdate);
      window.removeEventListener('dk_payment_success', handleCmsUpdate);
    };
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => (c.status || 'Published') === 'Published').length;
    const enrolments = courses.reduce((acc, c) => acc + (c.enrolledCount || 28), 0);
    const grossRev = courses.reduce((acc, c) => {
      const p = c.numericPrice || 48000;
      return acc + p * (c.enrolledCount || 25);
    }, 0);
    return { total, published, enrolments, grossRev };
  }, [courses]);

  // Filtering and Sorting
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q);

        const matchesExam = selectedExam === 'All' || c.targetExam.includes(selectedExam);
        const courseStatus = c.status || 'Published';
        const matchesStatus = selectedStatus === 'All' || courseStatus === selectedStatus;

        return matchesQuery && matchesExam && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') {
          return (a.numericPrice || 0) - (b.numericPrice || 0);
        }
        if (sortBy === 'price-high') {
          return (b.numericPrice || 0) - (a.numericPrice || 0);
        }
        if (sortBy === 'enrolments') {
          return (b.enrolledCount || 0) - (a.enrolledCount || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0; // Default latest
      });
  }, [courses, searchQuery, selectedExam, selectedStatus, sortBy]);

  // Open Wizard to Create
  const handleOpenCreateWizard = () => {
    setEditingCourseId(null);
    setWizardStep(1);
    setFormData({
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      coverImage: '/img/dk-results-banner.jpeg',
      promotionalBanner: '',
      instructor: 'DK Sir (IIT Delhi Alum, 18+ Yrs Exp)',
      targetAudience: 'Class 11, 12 & Droppers targeting top 500 AIR in JEE',
      outcomes: 'Master complete JEE Advanced Mathematics with 20s inspection shortcuts',
      prerequisites: 'Basic Class 10 NCERT Mathematics concepts',
      language: 'Hinglish (Concepts in English, Explanation in Hindi)',
      duration: '2-Year Full Program',
      seoTitle: 'JEE Main & Advanced Mathematics Comprehensive Course | DK Academy',
      seoDescription: 'Join DK Sir for JEE Main & Advanced comprehensive Mathematics coaching with live classes, DPPs, and private CBT tests.',
      targetExam: 'JEE Main & Advanced',
      category: 'JEE Main',
      targetClass: 'Class 11th',
      targetYear: 'Target JEE 2027',
      mode: 'Live + Recorded',
      batchStartDate: '28th May 2026',
      schedule: '4 Days / Week (MWF + Sun)',
      badge: 'Admissions Open 2026-27',
      featuresText: 'DK Sir 20s Techniques, Live Doubts Counter, Complete Study Modules, NTA CBT Mock Series',
      tier: 'Paid',
      numericPrice: 78000,
      mrpPrice: 95000,
      status: 'Published',
      syllabusPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      testSchedulePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });
    setCurriculumSections([
      {
        id: `sec-${Date.now()}-1`,
        title: 'Section 1: Orientation & Foundational Calculus Framework',
        description: 'Roadmap and 20s scoring methodology with DK Sir',
        durationText: '2 lectures • 25m',
        lectures: [
          {
            id: `lec-${Date.now()}-1`,
            title: 'Master Roadmap: Scoring 99.8%ile in Mathematics',
            duration: '15:00',
            isPreview: true,
            lessonType: 'recorded_video',
            videoStatus: 'ready',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Orientation to pedagogical pacing and inspection hacks.',
            notesPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            notesTitle: 'Orientation Handout & Formula Notebook (PDF)',
            dppPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            dppTitle: 'DPP Set #01 Foundations (PDF)'
          }
        ]
      }
    ]);
    setIsWizardOpen(true);
  };

  // Open Wizard to Edit
  const handleOpenEditWizard = (c: Course) => {
    setEditingCourseId(c.id);
    setWizardStep(1);
    setFormData({
      title: c.title,
      slug: c.slug || c.id,
      description: c.description || '',
      shortDescription: c.description?.slice(0, 150) || '',
      coverImage: c.coverImage || '/img/dk-results-banner.jpeg',
      promotionalBanner: c.promotionalBanner || '',
      instructor: c.instructor || 'DK Sir (IIT Delhi Alum, 18+ Yrs Exp)',
      targetAudience: c.targetAudience || 'Class 11, 12 & Droppers targeting top 500 AIR',
      outcomes: c.outcomes || 'Master complete JEE Advanced Mathematics',
      prerequisites: c.prerequisites || 'Basic Class 10 NCERT Mathematics concepts',
      language: c.language || 'Hinglish (Concepts in English, Hindi Explanation)',
      duration: c.duration || '2-Year Full Program',
      seoTitle: c.seoTitle || `${c.title} | DK Academy JEE`,
      seoDescription: c.seoDescription || c.description || '',
      targetExam: c.targetExam,
      category: c.category || 'JEE Main',
      targetClass: c.targetClass || 'Class 11th',
      targetYear: c.targetYear || 'Target JEE 2027',
      mode: c.mode || 'Live + Recorded',
      batchStartDate: c.batchStartDate || '28th May 2026',
      schedule: c.schedule || '4 Days / Week',
      badge: c.badge || 'Admissions Open',
      featuresText: Array.isArray(c.features) ? c.features.join(', ') : '',
      tier: c.tier || 'Paid',
      numericPrice: c.numericPrice || 78000,
      mrpPrice: parseInt(c.originalPrice?.replace(/[^0-9]/g, '') || '95000', 10),
      status: c.status || 'Published',
      syllabusPdfUrl: c.syllabusPdfUrl || '',
      testSchedulePdfUrl: c.testSchedulePdfUrl || ''
    });
    setCurriculumSections(
      c.curriculumSections && c.curriculumSections.length > 0
        ? c.curriculumSections
        : [
            {
              id: `sec-${c.id}-1`,
              title: 'Section 1: Course Overview & Foundational Framework',
              description: 'Introductory concept drills and study plan',
              durationText: '1 lecture • 15min',
              lectures: [
                {
                  id: `lec-${c.id}-1`,
                  title: 'Master Roadmap with DK Sir',
                  duration: '15:00',
                  isPreview: true,
                  lessonType: 'recorded_video',
                  videoStatus: 'ready',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  description: 'Concept walkthrough and study plan.',
                  notesPdfUrl: '',
                  dppPdfUrl: ''
                }
              ]
            }
          ]
    );
    setIsWizardOpen(true);
  };

  // Duplicate Course
  const handleDuplicateCourse = (c: Course) => {
    const dupTitle = `${c.title} (Copy)`;
    const dupSlug = `${c.id}-copy-${Date.now().toString().slice(-4)}`;
    const duplicated: Course = {
      ...c,
      id: dupSlug,
      title: dupTitle,
      slug: dupSlug,
      status: 'Draft',
      enrolledCount: 0
    };
    cmsService.createCourse(duplicated);
    showToast(`Course duplicated as "${dupTitle}" (Saved as Draft).`);
    refreshCourses();
  };

  // Toggle Publish Status
  const handleTogglePublish = (c: Course) => {
    const nextStatus: 'Published' | 'Draft' = (c.status || 'Published') === 'Published' ? 'Draft' : 'Published';
    const updated = { ...c, status: nextStatus };
    cmsService.updateCourse(c.id, updated);
    showToast(`Course "${c.title}" marked as ${nextStatus}.`);
    refreshCourses();
  };

  // Delete Course
  const handleDeleteCourse = (courseId: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete course "${title}"? This cannot be undone.`
      )
    ) {
      return;
    }
    cmsService.deleteCourse(courseId);
    showToast(`Course "${title}" deleted.`);
    refreshCourses();
  };

  // Curriculum Helpers
  const handleAddSection = () => {
    const newSection: CourseCurriculumSection = {
      id: `sec-${Date.now()}`,
      title: `Section ${curriculumSections.length + 1}: Module Title`,
      description: 'Module syllabus breakdown and concept lectures',
      durationText: '1 lecture • 30m',
      lectures: [
        {
          id: `lec-${Date.now()}-1`,
          title: 'Lecture 1: Fundamental Proofs & Formula Inspection',
          duration: '30:00',
          isPreview: false,
          lessonType: 'recorded_video',
          videoStatus: 'ready',
          videoUrl: '',
          description: '',
          notesPdfUrl: '',
          dppPdfUrl: ''
        }
      ]
    };
    setCurriculumSections([...curriculumSections, newSection]);
  };

  const handleUpdateSection = (idx: number, updates: Partial<CourseCurriculumSection>) => {
    const updated = [...curriculumSections];
    updated[idx] = { ...updated[idx], ...updates };
    setCurriculumSections(updated);
  };

  const handleDeleteSection = (idx: number) => {
    setCurriculumSections(curriculumSections.filter((_, i) => i !== idx));
  };

  const handleAddLecture = (secIdx: number) => {
    const updated = [...curriculumSections];
    const newLecture: CourseLectureItem = {
      id: `lec-${Date.now()}`,
      title: `Lecture ${updated[secIdx].lectures.length + 1}: Topic Name`,
      duration: '45:00',
      isPreview: false,
      lessonType: 'recorded_video',
      videoStatus: 'ready',
      videoUrl: '',
      description: '',
      notesPdfUrl: '',
      dppPdfUrl: ''
    };
    updated[secIdx].lectures.push(newLecture);
    updated[secIdx].durationText = `${updated[secIdx].lectures.length} lectures`;
    setCurriculumSections(updated);
  };

  const handleUpdateLecture = (
    secIdx: number,
    lecIdx: number,
    updates: Partial<CourseLectureItem>
  ) => {
    const updated = [...curriculumSections];
    updated[secIdx].lectures[lecIdx] = {
      ...updated[secIdx].lectures[lecIdx],
      ...updates
    };
    setCurriculumSections(updated);
  };

  const handleDeleteLecture = (secIdx: number, lecIdx: number) => {
    const updated = [...curriculumSections];
    updated[secIdx].lectures = updated[secIdx].lectures.filter((_, i) => i !== lecIdx);
    updated[secIdx].durationText = `${updated[secIdx].lectures.length} lectures`;
    setCurriculumSections(updated);
  };

  // Submit 7-Step Wizard Form
  const handleSaveWizardCourse = (publishDirectly: boolean = false) => {
    if (!formData.title.trim()) {
      showToast('Error: Course Title is required.');
      setWizardStep(1);
      return;
    }

    const calculatedStatus = publishDirectly ? 'Published' : formData.status;
    const featuresList = formData.featuresText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const priceFormatted =
      formData.tier === 'Free' ? 'Free Course' : `₹${formData.numericPrice.toLocaleString('en-IN')}`;
    const origPriceFormatted = `₹${formData.mrpPrice.toLocaleString('en-IN')}`;

    const coursePayload: Partial<Course> = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: formData.description.trim(),
      targetExam: formData.targetExam,
      category: formData.category,
      targetClass: formData.targetClass,
      targetYear: formData.targetYear,
      mode: formData.mode,
      badge: formData.badge,
      tier: formData.tier,
      price: priceFormatted,
      originalPrice: origPriceFormatted,
      numericPrice: formData.tier === 'Free' ? 0 : formData.numericPrice,
      duration: formData.duration,
      batchStartDate: formData.batchStartDate,
      schedule: formData.schedule,
      features: featuresList,
      coverImage: formData.coverImage,
      instructor: formData.instructor,
      targetAudience: formData.targetAudience,
      outcomes: formData.outcomes,
      prerequisites: formData.prerequisites,
      language: formData.language,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      status: calculatedStatus,
      syllabusPdfUrl: formData.syllabusPdfUrl,
      testSchedulePdfUrl: formData.testSchedulePdfUrl,
      curriculumSections
    };

    if (editingCourseId) {
      cmsService.updateCourse(editingCourseId, coursePayload);
      if (admin) {
        adminService.logAudit({
          adminId: admin.id,
          adminName: admin.name,
          adminRole: admin.role,
          action: 'COURSE_UPDATED',
          module: 'Course Management',
          details: `Updated course "${formData.title}" (Status: ${calculatedStatus})`,
          status: 'SUCCESS'
        });
      }
      showToast(`Course "${formData.title}" updated successfully!`);
    } else {
      const newCourseId =
        formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      cmsService.createCourse({
        ...coursePayload,
        id: newCourseId,
        enrolledCount: 0,
        rating: 5.0
      } as Course);

      if (admin) {
        adminService.logAudit({
          adminId: admin.id,
          adminName: admin.name,
          adminRole: admin.role,
          action: 'COURSE_CREATED',
          module: 'Course Management',
          details: `Created new course "${formData.title}" (Status: ${calculatedStatus})`,
          status: 'SUCCESS'
        });
      }
      showToast(`Course "${formData.title}" created and saved!`);
    }

    setIsWizardOpen(false);
    refreshCourses();
  };

  // Discount percentage calculation
  const discountPercentage = useMemo(() => {
    if (formData.mrpPrice <= 0 || formData.numericPrice >= formData.mrpPrice) return 0;
    return Math.round(((formData.mrpPrice - formData.numericPrice) / formData.mrpPrice) * 100);
  }, [formData.numericPrice, formData.mrpPrice]);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotice}>
          <CheckCircle2 size={16} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Course Management</h1>
          <p className={styles.pageSubtitle}>
            Create, organize, and administer JEE Main, Advanced, and BITSAT courses with full curriculum,
            HLS video vaults, DPPs, and commercial pricing.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.videoVaultBtn}
            onClick={() => {
              setSelectedUploadCourseId(courses[0]?.id || '');
              setIsVideoUploadModalOpen(true);
            }}
          >
            <Film size={15} />
            <span>Private Video Vault</span>
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleOpenCreateWizard}
          >
            <Plus size={16} />
            <span>+ Create Course (7-Step Wizard)</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className={styles.metricsBar}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Courses</span>
          <span className={styles.metricValue}>{metrics.total}</span>
          <span className={styles.metricHint}>Active in Catalog</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Published Courses</span>
          <span className={styles.metricValue}>{metrics.published}</span>
          <span className={styles.metricHint}>Live on Student Portal</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Enrolments</span>
          <span className={styles.metricValue}>{metrics.enrolments}</span>
          <span className={styles.metricHint}>Verified Students</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Gross Course Revenue</span>
          <span className={styles.metricValue}>₹{(metrics.grossRev / 100000).toFixed(1)}L</span>
          <span className={styles.metricHint}>Verified Purchases</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterControlsRow}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={15} />
            <input
              type="text"
              placeholder="Search by title, instructor, slug, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.dropdownFiltersGroup}>
            <select
              className={styles.selectInput}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            <select
              className={styles.selectInput}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">Sort: Latest Added</option>
              <option value="enrolments">Sort: Most Enrolments</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="title">Title: A to Z</option>
            </select>

            <div className={styles.viewModeToggle}>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'table' ? styles.active : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className={styles.categoryChips}>
          {['All', 'JEE Main', 'JEE Advanced', 'BITSAT', 'Foundation', 'Dropper'].map((exam) => (
            <button
              key={exam}
              type="button"
              className={`${styles.chip} ${selectedExam === exam ? styles.chipActive : ''}`}
              onClick={() => setSelectedExam(exam)}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      {/* ─── COURSES LISTING: TABLE VIEW ─── */}
      {viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <table className={styles.coursesTable}>
            <thead>
              <tr>
                <th>Course Details</th>
                <th>Category &amp; Exam</th>
                <th>Pricing</th>
                <th>Enrolments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    No courses match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const status = c.status || 'Published';
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className={styles.tableCourseCell}>
                          <img
                            src={c.coverImage || '/img/dk-results-banner.jpeg'}
                            alt={c.title}
                            className={styles.tableThumb}
                          />
                          <div>
                            <span className={styles.tableCourseTitle}>{c.title}</span>
                            <span className={styles.tableCourseSlug}>
                              ID: {c.id} • {c.curriculumSections?.length || 4} Modules
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.examTag}>{c.targetExam}</span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                          {c.targetClass || 'Class 11 & 12'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.price || 'Free'}</div>
                        {c.originalPrice && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {c.originalPrice}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <Users size={13} color="#2563eb" />
                          <span>{c.enrolledCount || 34}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#d97706', marginTop: '2px' }}>
                          <Star size={11} fill="#d97706" />
                          <span>{c.rating || 4.9}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            status === 'Published'
                              ? styles.published
                              : status === 'Draft'
                              ? styles.draft
                              : styles.archived
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.primary}`}
                            onClick={() => {
                              setDetailCourse(c);
                              setDetailActiveTab('overview');
                            }}
                            title="View Course Details"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenEditWizard(c)}
                            title="Edit with 7-Step Wizard"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleDuplicateCourse(c)}
                            title="Duplicate Course"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => handleDeleteCourse(c.id, c.title)}
                            title="Delete Course"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── COURSES LISTING: GRID VIEW ─── */
        <div className={styles.coursesGrid}>
          {filteredCourses.map((c) => {
            const status = c.status || 'Published';
            const chaptersCount = c.curriculumSections?.length || 4;
            const lecturesCount =
              c.curriculumSections?.reduce((acc, s) => acc + s.lectures.length, 0) || 18;

            return (
              <div key={c.id} className={styles.courseCard}>
                <div className={styles.cardBanner}>
                  <img src={c.coverImage || '/img/dk-results-banner.jpeg'} alt={c.title} />
                  <span className={styles.cardExamBadge}>{c.targetExam}</span>
                  <div className={styles.cardStatusBadge}>
                    <span
                      className={`${styles.statusBadge} ${
                        status === 'Published'
                          ? styles.published
                          : status === 'Draft'
                          ? styles.draft
                          : styles.archived
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeaderRow}>
                    <span className={styles.cardCategory}>{c.category || 'JEE Main'}</span>
                    {c.badge && <span className={styles.cardBadge}>{c.badge}</span>}
                  </div>

                  <h3 className={styles.courseTitle}>{c.title}</h3>
                  <p className={styles.courseDescription}>{c.description}</p>

                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <Clock size={13} />
                      <span>{c.duration || '2-Year Full Program'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <BookOpen size={13} />
                      <span>
                        {chaptersCount} Modules ({lecturesCount} Lessons)
                      </span>
                    </div>
                  </div>

                  <div className={styles.priceRow}>
                    <div className={styles.priceBox}>
                      <span className={styles.currentPrice}>{c.price || 'Free'}</span>
                      {c.originalPrice && <span className={styles.origPrice}>{c.originalPrice}</span>}
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => {
                          setSelectedUploadCourseId(c.id);
                          setIsVideoUploadModalOpen(true);
                        }}
                        title="Upload Video to LMS Vault"
                      >
                        <Film size={13} />
                        <span>+ Video</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.primary}`}
                        onClick={() => {
                          setDetailCourse(c);
                          setDetailActiveTab('overview');
                        }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleOpenEditWizard(c)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 7-STEP COURSE WIZARD MODAL ─── */}
      {isWizardOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsWizardOpen(false)}>
          <div className={styles.wizardModal} onClick={(e) => e.stopPropagation()}>
            {/* Wizard Header */}
            <div className={styles.wizardHeader}>
              <div className={styles.wizardTitleBox}>
                <h3>{editingCourseId ? `Edit Course: ${formData.title}` : 'Create New Course Wizard'}</h3>
                <p>Complete all 7 steps to configure curriculum, private video streams, DPPs, and publish safely.</p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsWizardOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Navigation Bar */}
            <div className={styles.stepIndicatorNav}>
              {STEP_LABELS.map((lbl, idx) => {
                const sNum = (idx + 1) as WizardStep;
                const isActive = wizardStep === sNum;
                const isCompleted = wizardStep > sNum;
                return (
                  <button
                    key={lbl}
                    type="button"
                    className={`${styles.stepNavBtn} ${isActive ? styles.active : ''} ${
                      isCompleted ? styles.completed : ''
                    }`}
                    onClick={() => setWizardStep(sNum)}
                  >
                    <span className={styles.stepNumber}>
                      {isCompleted ? <Check size={11} /> : sNum}
                    </span>
                    <span>{lbl}</span>
                  </button>
                );
              })}
            </div>

            {/* Wizard Body Content */}
            <div className={styles.wizardContent}>
              {/* STEP 1: BASIC INFORMATION */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Course Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. JEE Main & Advanced 2-Year Comprehensive Math"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>URL Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. jee-main-advanced-2027"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                      <small>Unique URL path on the public student portal.</small>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Short Description (Summary)</label>
                    <input
                      type="text"
                      placeholder="One-line summary for cards and search snippets..."
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Full Course Description *</label>
                    <textarea
                      rows={3}
                      placeholder="Comprehensive overview of syllabus, methodology, exam target..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Cover Image URL (Thumbnail)</label>
                      <input
                        type="text"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Instructor / Faculty Lead</label>
                      <select
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      >
                        <option value="DK Sir (IIT Delhi Alum, 18+ Yrs Exp)">DK Sir (IIT Delhi Alum, 18+ Yrs Exp)</option>
                        <option value="Prof. R.K. Verma (Senior Faculty - Physical Chemistry)">Prof. R.K. Verma (Senior Faculty)</option>
                        <option value="Er. Amit Sharma (Ex-Allen Top Faculty)">Er. Amit Sharma (Physics Lead)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Target Audience</label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Language of Delivery</label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      >
                        <option value="Hinglish (Concepts in English, Explanation in Hindi)">Hinglish</option>
                        <option value="Pure English">Pure English</option>
                        <option value="Hindi Medium">Hindi Medium</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>SEO Title</label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>SEO Meta Description</label>
                      <input
                        type="text"
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: COURSE CATEGORISATION */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Target Exam *</label>
                      <select
                        value={formData.targetExam}
                        onChange={(e) => setFormData({ ...formData, targetExam: e.target.value as any })}
                      >
                        <option value="JEE Main & Advanced">JEE Main &amp; Advanced</option>
                        <option value="JEE Main">JEE Main Only</option>
                        <option value="JEE Advanced">JEE Advanced Specialist</option>
                        <option value="Foundation">Class 8–10 Foundation</option>
                        <option value="Crash Course">BITSAT / Crash Course</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Category Tag</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      >
                        <option value="JEE Main">JEE Main</option>
                        <option value="JEE Advanced">JEE Advanced</option>
                        <option value="Foundation">Foundation</option>
                        <option value="Crash Course">Crash Course</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Target Student Class</label>
                      <select
                        value={formData.targetClass}
                        onChange={(e) => setFormData({ ...formData, targetClass: e.target.value as any })}
                      >
                        <option value="Class 11th">Class 11th</option>
                        <option value="Class 12th">Class 12th</option>
                        <option value="Dropper">Dropper / Repeater Batch</option>
                        <option value="Class 10th Foundation">Class 10th Foundation</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Target Year Badge</label>
                      <input
                        type="text"
                        value={formData.targetYear}
                        onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Delivery Mode</label>
                      <select
                        value={formData.mode}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                      >
                        <option value="Live + Recorded">Live + Recorded (Interactive)</option>
                        <option value="Structured Recorded">Structured Recorded Lectures</option>
                        <option value="Self-Paced">Self-Paced Learning</option>
                        <option value="Live">Live Interactive Only</option>
                        <option value="Online Test Series">Online Test Series + DPP</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Course Program Duration</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Batch Start Date</label>
                      <input
                        type="text"
                        value={formData.batchStartDate}
                        onChange={(e) => setFormData({ ...formData, batchStartDate: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Weekly Schedule</label>
                      <input
                        type="text"
                        value={formData.schedule}
                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Urgency / Promotion Badge</label>
                    <input
                      type="text"
                      placeholder="e.g. Admissions Open 2026-27 or Limited 40 Seats"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PRICING & COMMERCIALS */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Course Access Tier</label>
                      <select
                        value={formData.tier}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                      >
                        <option value="Paid">Paid Course (Fee-based)</option>
                        <option value="Free">100% Free Public Course</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Currency</label>
                      <input type="text" value="INR (₹ Indian Rupee)" disabled />
                    </div>
                  </div>

                  {formData.tier === 'Paid' && (
                    <>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label>Actual Price / MRP (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.mrpPrice}
                            onChange={(e) =>
                              setFormData({ ...formData, mrpPrice: Math.max(0, parseInt(e.target.value || '0', 10)) })
                            }
                          />
                          <small>Original standard fee before any promotional discounts.</small>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Discounted Selling Price (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.numericPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                numericPrice: Math.max(0, parseInt(e.target.value || '0', 10))
                              })
                            }
                          />
                          <small>Final payable amount by student at checkout.</small>
                        </div>
                      </div>

                      {/* Pricing Preview Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>
                            LIVE PRICING DISPLAY PREVIEW
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                              ₹{formData.numericPrice.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{formData.mrpPrice.toLocaleString('en-IN')}
                            </span>
                            {discountPercentage > 0 && (
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: '#16a34a',
                                  background: '#dcfce7',
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}
                              >
                                {discountPercentage}% OFF (Save ₹
                                {(formData.mrpPrice - formData.numericPrice).toLocaleString('en-IN')})
                              </span>
                            )}
                          </div>
                        </div>
                        <Sparkles size={24} color="#2563eb" />
                      </div>
                    </>
                  )}

                  <div className={styles.formGroup}>
                    <label>Highlight Features (Comma separated)</label>
                    <textarea
                      rows={2}
                      value={formData.featuresText}
                      onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: CURRICULUM BUILDER */}
              {wizardStep === 4 && (
                <div className={styles.curriculumBuilder}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                        Curriculum Sections &amp; Chapters
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Add hierarchical modules, chapters, lesson types, and free preview permissions.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={handleAddSection}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>Add Section</span>
                    </button>
                  </div>

                  {curriculumSections.map((sec, secIdx) => (
                    <div key={sec.id} className={styles.sectionItem}>
                      <div className={styles.sectionHeader}>
                        <input
                          type="text"
                          className={styles.sectionTitleInput}
                          value={sec.title}
                          onChange={(e) => handleUpdateSection(secIdx, { title: e.target.value })}
                          placeholder="Section Title..."
                        />
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => handleAddLecture(secIdx)}
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          <Plus size={12} />
                          <span>Add Lesson</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(secIdx)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.lecturesList}>
                        {sec.lectures.map((lec, lecIdx) => (
                          <div key={lec.id} className={styles.lectureCard}>
                            <div className={styles.lectureHeader}>
                              <input
                                type="text"
                                className={styles.lectureTitleInput}
                                value={lec.title}
                                onChange={(e) =>
                                  handleUpdateLecture(secIdx, lecIdx, { title: e.target.value })
                                }
                                placeholder="Lecture Title..."
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteLecture(secIdx, lecIdx)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className={styles.lectureMetaRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Type:</label>
                                <select
                                  style={{ padding: '3px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                  value={lec.lessonType || 'recorded_video'}
                                  onChange={(e) =>
                                    handleUpdateLecture(secIdx, lecIdx, { lessonType: e.target.value as any })
                                  }
                                >
                                  <option value="recorded_video">Recorded Video</option>
                                  <option value="live_class">Live Interactive Class</option>
                                  <option value="text">Concept Text Lesson</option>
                                  <option value="pdf">PDF / Notes</option>
                                  <option value="quiz">Practice Quiz / CBT</option>
                                </select>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Duration:</label>
                                <input
                                  type="text"
                                  style={{ width: '70px', padding: '3px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                  value={lec.duration}
                                  onChange={(e) =>
                                    handleUpdateLecture(secIdx, lecIdx, { duration: e.target.value })
                                  }
                                  placeholder="e.g. 35:00"
                                />
                              </div>

                              <button
                                type="button"
                                className={`${styles.chipToggle} ${lec.isPreview ? styles.active : ''}`}
                                onClick={() =>
                                  handleUpdateLecture(secIdx, lecIdx, { isPreview: !lec.isPreview })
                                }
                              >
                                <Eye size={12} />
                                <span>{lec.isPreview ? 'Free Preview Active' : 'Paid Enrolled Only'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 5: VIDEO UPLOAD & MANAGEMENT */}
              {wizardStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
                        Private Self-Hosted LMS Video Architecture
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15803d' }}>
                        Videos are processed via FFmpeg into encrypted multi-bitrate HLS streams (.m3u8).
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => {
                        setSelectedUploadCourseId(editingCourseId || 'new');
                        setIsVideoUploadModalOpen(true);
                      }}
                    >
                      <Film size={14} />
                      <span>Launch Video Uploader</span>
                    </button>
                  </div>

                  <h4 style={{ margin: '8px 0 0', fontSize: '13px', color: '#0f172a' }}>
                    Curriculum Lesson Video Linkages
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {curriculumSections.flatMap((s, sIdx) =>
                      s.lectures.map((l, lIdx) => (
                        <div
                          key={l.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                              {s.title} &rarr; {l.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Type: {l.lessonType || 'recorded_video'} • Duration: {l.duration}
                            </div>
                          </div>

                          <div style={{ width: '280px' }}>
                            <input
                              type="text"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                              placeholder="HLS / YouTube Stream URL..."
                              value={l.videoUrl || ''}
                              onChange={(e) =>
                                handleUpdateLecture(sIdx, lIdx, { videoUrl: e.target.value })
                              }
                            />
                          </div>

                          <span
                            className={`${styles.statusBadge} ${
                              l.videoUrl ? styles.published : styles.draft
                            }`}
                          >
                            {l.videoUrl ? 'Ready' : 'Pending Upload'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* STEP 6: SUPPORT MATERIALS */}
              {wizardStep === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Course Syllabus Handout (PDF URL)</label>
                      <input
                        type="text"
                        value={formData.syllabusPdfUrl}
                        onChange={(e) => setFormData({ ...formData, syllabusPdfUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Test &amp; CBT Schedule (PDF URL)</label>
                      <input
                        type="text"
                        value={formData.testSchedulePdfUrl}
                        onChange={(e) => setFormData({ ...formData, testSchedulePdfUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <h4 style={{ margin: '8px 0 0', fontSize: '13px', color: '#0f172a' }}>
                    Lesson-Specific DPPs &amp; Notes
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {curriculumSections.flatMap((s, sIdx) =>
                      s.lectures.map((l, lIdx) => (
                        <div
                          key={l.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {l.title}
                          </div>
                          <div className={styles.formGrid}>
                            <input
                              type="text"
                              placeholder="Lecture Theory Notes PDF URL..."
                              value={l.notesPdfUrl || ''}
                              onChange={(e) =>
                                handleUpdateLecture(sIdx, lIdx, { notesPdfUrl: e.target.value })
                              }
                              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                            <input
                              type="text"
                              placeholder="Daily Practice Problem (DPP) PDF URL..."
                              value={l.dppPdfUrl || ''}
                              onChange={(e) =>
                                handleUpdateLecture(sIdx, lIdx, { dppPdfUrl: e.target.value })
                              }
                              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* STEP 7: PUBLISHING & FINAL REVIEW */}
              {wizardStep === 7 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Pre-publication Audit */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px'
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#0f172a' }}>
                      Pre-Publication Validation Checklist
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: formData.title ? '#16a34a' : '#dc2626' }}>
                        <CheckCircle2 size={16} />
                        <span>Course Title and metadata verified: <strong>{formData.title || 'Missing Title'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                        <CheckCircle2 size={16} />
                        <span>
                          Pricing verified: {formData.tier === 'Free' ? 'Free Access' : `₹${formData.numericPrice.toLocaleString('en-IN')}`} (MRP: ₹{formData.mrpPrice.toLocaleString('en-IN')})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: curriculumSections.length > 0 ? '#16a34a' : '#dc2626' }}>
                        <CheckCircle2 size={16} />
                        <span>Curriculum contains {curriculumSections.length} sections and {curriculumSections.reduce((acc, s) => acc + s.lectures.length, 0)} lessons</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Publication Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Published">Published (Instantly Live on Public Portal)</option>
                      <option value="Draft">Draft (Internal Admin Preview Only)</option>
                      <option value="Archived">Archived (Retired / No New Admissions)</option>
                    </select>
                  </div>

                  {/* Live Student Preview Card */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569' }}>
                      Student Public Preview Card:
                    </h4>
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        maxWidth: '380px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                      <div style={{ position: 'relative', height: '140px', background: '#f1f5f9' }}>
                        <img
                          src={formData.coverImage || '/img/dk-results-banner.jpeg'}
                          alt={formData.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {formData.targetExam}
                        </span>
                      </div>
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                          {formData.title || 'Course Title Preview'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{formData.description}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            {formData.tier === 'Free' ? 'Free' : `₹${formData.numericPrice.toLocaleString('en-IN')}`}
                          </span>
                          {formData.tier === 'Paid' && (
                            <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{formData.mrpPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer Controls */}
            <div className={styles.wizardFooter}>
              <div className={styles.footerLeft}>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setWizardStep((prev) => (prev - 1) as WizardStep)}
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                )}
              </div>

              <div className={styles.footerRight}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsWizardOpen(false)}
                >
                  Cancel
                </button>

                {wizardStep < 7 ? (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => setWizardStep((prev) => (prev + 1) as WizardStep)}
                  >
                    <span>Next: {STEP_LABELS[wizardStep]}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => handleSaveWizardCourse(true)}
                  >
                    <CheckCircle2 size={15} />
                    <span>Save &amp; Publish Course</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── COURSE DETAIL MODAL (7 TABS) ─── */}
      {detailCourse && (
        <div className={styles.modalBackdrop} onClick={() => setDetailCourse(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {detailCourse.title}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Target: {detailCourse.targetExam} • Status: {detailCourse.status || 'Published'} • Fee:{' '}
                  {detailCourse.price}
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setDetailCourse(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* 7 Tabs Nav */}
            <div className={styles.detailTabsNav}>
              {(['overview', 'curriculum', 'students', 'sales', 'reviews', 'resources', 'settings'] as DetailTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${styles.detailTabBtn} ${detailActiveTab === tab ? styles.active : ''}`}
                    onClick={() => setDetailActiveTab(tab)}
                  >
                    {tab.toUpperCase()}
                  </button>
                )
              )}
            </div>

            {/* Detail Body */}
            <div className={styles.detailBody}>
              {detailActiveTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '18px' }}>
                    <img
                      src={detailCourse.coverImage || '/img/dk-results-banner.jpeg'}
                      alt={detailCourse.title}
                      style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>
                        {detailCourse.title}
                      </h4>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                        {detailCourse.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span className={styles.examTag}>{detailCourse.targetExam}</span>
                        <span className={styles.examTag}>{detailCourse.mode || 'Live + Recorded'}</span>
                        <span className={styles.examTag}>{detailCourse.duration || '2-Year'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <h5 style={{ margin: '0 0 8px', fontSize: '13px', color: '#0f172a' }}>Features Included:</h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#475569' }}>
                      {detailCourse.features?.map((f, i) => (
                        <li key={i}>{f}</li>
                      )) || <li>DK Sir 20s Techniques, CBT Test Series, Doubt Counter</li>}
                    </ul>
                  </div>
                </div>
              )}

              {detailActiveTab === 'curriculum' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {detailCourse.curriculumSections?.map((s, sIdx) => (
                    <div
                      key={s.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 16px'
                      }}
                    >
                      <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: '#0f172a' }}>
                        {s.title}
                      </h4>
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>
                        {s.description} • {s.durationText}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {s.lectures.map((l) => (
                          <div
                            key={l.id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12.5px'
                            }}
                          >
                            <span>{l.title}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {l.isPreview && (
                                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                                  FREE PREVIEW
                                </span>
                              )}
                              <span style={{ color: '#64748b' }}>{l.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )) || <p style={{ color: '#64748b' }}>No curriculum uploaded yet.</p>}
                </div>
              )}

              {detailActiveTab === 'students' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      Enrolled Students ({detailCourse.enrolledCount || 34})
                    </span>
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                      All Verified Purchases
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Student Name</th>
                        <th style={{ padding: '8px 12px' }}>Email</th>
                        <th style={{ padding: '8px 12px' }}>Batch</th>
                        <th style={{ padding: '8px 12px' }}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Aarav Sharma', email: 'aarav.jee2026@gmail.com', batch: 'JEE Main 2026', progress: '78%' },
                        { name: 'Priya Iyer', email: 'priya.iyer@gmail.com', batch: 'JEE Main 2026', progress: '92%' },
                        { name: 'Rohan Deshmukh', email: 'rohan.desh@gmail.com', batch: 'Droppers 2026', progress: '64%' }
                      ].map((st, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{st.name}</td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{st.email}</td>
                          <td style={{ padding: '10px 12px' }}>{st.batch}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>{st.progress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailActiveTab === 'sales' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL PURCHASES</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {detailCourse.enrolledCount || 34}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>GROSS REVENUE</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                        ₹{(((detailCourse.numericPrice || 48000) * (detailCourse.enrolledCount || 34)) / 100000).toFixed(2)}L
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>REFUNDS &amp; CHARGES</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#64748b', marginTop: '2px' }}>₹0</div>
                    </div>
                  </div>
                </div>
              )}

              {detailActiveTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} fill="#d97706" color="#d97706" />
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      {detailCourse.rating || 4.9} out of 5.0
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>({detailCourse.reviewCount || 24} student ratings)</span>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>Aarav Sharma</span>
                      <span style={{ color: '#d97706', fontSize: '12px' }}>★★★★★</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569' }}>
                      "DK Sir's 20-30s problem inspection hacks for Definite Integration boosted my mock score by 28 marks!"
                    </p>
                  </div>
                </div>
              )}

              {detailActiveTab === 'resources' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#2563eb" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>Course Syllabus Handout</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Official PDF Document</div>
                      </div>
                    </div>
                    <a
                      href={detailCourse.syllabusPdfUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
                    >
                      View Handout
                    </a>
                  </div>
                </div>
              )}

              {detailActiveTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Publication Status</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Current: {detailCourse.status || 'Published'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleTogglePublish(detailCourse)}
                    >
                      {(detailCourse.status || 'Published') === 'Published' ? 'Unpublish to Draft' : 'Publish to Portal'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>Delete Course</div>
                      <div style={{ fontSize: '11px', color: '#b91c1c' }}>
                        Permanently remove this course from catalog and database.
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => {
                        handleDeleteCourse(detailCourse.id, detailCourse.title);
                        setDetailCourse(null);
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PRIVATE LMS VIDEO UPLOAD MODAL ─── */}
      <AdminVideoUploadModal
        isOpen={isVideoUploadModalOpen}
        onClose={() => setIsVideoUploadModalOpen(false)}
        courses={courses}
        preSelectedCourseId={selectedUploadCourseId}
        onUploadSuccess={() => {
          showToast('Video successfully uploaded and queued for HLS processing!');
          refreshCourses();
        }}
      />
    </div>
  );
};
export default AdminCoursesPage;

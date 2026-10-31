import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  PlusCircle,
  Trash2,
  Upload,
  Video,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Eye,
  Sparkles,
  AlertTriangle,
  GripVertical,
  CheckCircle2,
  FolderPlus,
  Clock,
  Layers,
  GraduationCap,
  Percent,
  X,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Pencil,
  Lock,
  Unlock,
  Image as ImageIcon,
  Loader2,
  Play
} from 'lucide-react';
import styles from './CourseBuilderWorkspace.module.scss';
import { cmsService } from '../../../services/cmsService';
import { apiClient } from '../../../services/apiClient';
import type { Course, CourseCurriculumSection } from '../../../types';
import { CreatedCoursesCatalog } from './CreatedCoursesCatalog';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface LectureResource {
  id: string;
  title: string;
  url: string;
}

export interface LectureItem {
  id: string;
  title: string;
  videoUrl: string;
  durationMinutes: number;
  description: string;
  isFreePreview?: boolean;
  resources: LectureResource[];
}

export interface SectionBlock {
  id: string;
  title: string;
  isExpanded: boolean;
  isFreePreview?: boolean;
  lectures: LectureItem[];
}

const DEFAULT_CATEGORIES: string[] = [
  'Class 11th Foundation',
  'Class 12th & Dropper Sprint',
  'BITSAT Speed Drill',
  'Offline Classroom',
  'JEE Main',
  'JEE Advanced',
  'Foundation (Class 8-10)',
  'Crash Course',
  'Olympiad Specialist'
];

const DEFAULT_COURSE_LEVELS: string[] = [
  'Beginner to Advanced',
  'Advanced Rank Booster',
  'Foundation (Class 8-10 Bridge)',
  'Class 11-12 Board + JEE',
  'Dropper Intensive',
  'Elite Super 30',
  'Paid Tier (Full Program)',
  'Free / Public Demo Tier'
];

export const PRESET_COURSE_TAGS: string[] = [
  'Test Series',
  'Live Online',
  'Self-Study DLP',
  'Classroom',
  'Hybrid',
  'Popular',
  'Bestseller',
  'New Batch',
  'Trending',
  'Crash Course',
  'Video Vault',
  'Free Preview'
];

export const CourseBuilderWorkspace: React.FC = () => {
  // Current Active Wizard Step: 1, 2, 3, or 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ─── Step 1: Course Information State ───
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseTags, setCourseTags] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Live Online', 'Popular']);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setCustomTagInput('');
  };

  // Dynamic Course Categories
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dk_custom_course_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
        }
      }
    } catch (e) {
      console.warn('Error loading custom categories:', e);
    }
    return DEFAULT_CATEGORIES;
  });
  const [category, setCategory] = useState('Class 11th Foundation');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dynamic Course Levels / Tiers
  const [courseLevelsList, setCourseLevelsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dk_custom_course_levels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...DEFAULT_COURSE_LEVELS, ...parsed]));
        }
      }
    } catch (e) {
      console.warn('Error loading custom course levels:', e);
    }
    return DEFAULT_COURSE_LEVELS;
  });
  const [courseLevel, setCourseLevel] = useState('Beginner to Advanced');
  const [isCreatingLevel, setIsCreatingLevel] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categoriesList.includes(trimmed)) {
      const updated = [...categoriesList, trimmed];
      setCategoriesList(updated);
      try {
        localStorage.setItem('dk_custom_course_categories', JSON.stringify(updated));
      } catch (e) {}
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsCreatingCategory(false);
    showToast(`✓ Category "${trimmed}" created & selected!`);
  };

  const handleAddCourseLevel = () => {
    const trimmed = newLevelName.trim();
    if (!trimmed) return;
    if (!courseLevelsList.includes(trimmed)) {
      const updated = [...courseLevelsList, trimmed];
      setCourseLevelsList(updated);
      try {
        localStorage.setItem('dk_custom_course_levels', JSON.stringify(updated));
      } catch (e) {}
    }
    setCourseLevel(trimmed);
    setNewLevelName('');
    setIsCreatingLevel(false);
    showToast(`✓ Level/Tier "${trimmed}" created & selected!`);
  };

  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFileName, setThumbnailFileName] = useState<string>('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState<boolean>(false);
  const [cloudinaryCoverUrl, setCloudinaryCoverUrl] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [expandedPreviewSecId, setExpandedPreviewSecId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFileName(file.name);
      // Instant local preview
      const localUrl = URL.createObjectURL(file);
      setThumbnailPreview(localUrl);
      setIsUploadingThumbnail(true);
      showToast('Uploading thumbnail to Cloudinary Media Vault...');

      try {
        const res = await apiClient.uploadFile(file, 'dk-academy/courses');
        if (res.success && res.url) {
          setCloudinaryCoverUrl(res.url);
          setThumbnailPreview(res.url);
          showToast('✓ Thumbnail uploaded to Cloudinary successfully!');
        } else {
          showToast(res.message || '✓ Artwork preview loaded');
        }
      } catch (err: any) {
        console.warn('[Cloudinary Upload Notice]:', err.message);
        showToast('Artwork loaded in local workspace buffer');
      } finally {
        setIsUploadingThumbnail(false);
      }
    }
  };

  const triggerThumbnailUpload = () => {
    fileInputRef.current?.click();
  };

  const removeThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnailPreview('');
    setThumbnailFileName('');
    setCloudinaryCoverUrl('');
    showToast('Thumbnail artwork removed.');
  };

  // ─── Existing & Created Courses Catalog State ───
  const [activeTab, setActiveTab] = useState<'create' | 'catalog'>('create');
  const [existingCourses, setExistingCourses] = useState<Course[]>(() => cmsService.getCourses());
  const [isRefreshingCourses, setIsRefreshingCourses] = useState(false);

  const loadExistingCourses = async () => {
    setIsRefreshingCourses(true);
    try {
      const list = await cmsService.fetchCoursesFromAPI();
      if (Array.isArray(list) && list.length > 0) {
        setExistingCourses(list);
      } else {
        setExistingCourses(cmsService.getCourses());
      }
    } catch (err) {
      console.warn('[CourseBuilder] Error fetching existing courses:', err);
      setExistingCourses(cmsService.getCourses());
    } finally {
      setIsRefreshingCourses(false);
    }
  };

  useEffect(() => {
    loadExistingCourses();
    const handleCmsUpdate = (e: any) => {
      if (e?.detail?.module === 'courses' || !e?.detail?.module) {
        setExistingCourses(cmsService.getCourses());
      }
    };
    window.addEventListener('dk_cms_updated', handleCmsUpdate);
    return () => {
      window.removeEventListener('dk_cms_updated', handleCmsUpdate);
    };
  }, []);

  const handleDeleteExistingCourse = async (courseId: string) => {
    try {
      cmsService.deleteCourse(courseId);
      setExistingCourses((prev) =>
        prev.filter(
          (c) => c.id !== courseId && (c as any)._id !== courseId && (c as any).slug !== courseId
        )
      );
      showToast('✓ Course successfully deleted from database.');
    } catch (err: any) {
      showToast('⚠️ Error deleting course: ' + (err?.message || 'Check connection'));
    }
  };

  const handleUpdateExistingCourse = async (courseId: string, updates: Partial<Course>) => {
    try {
      const updated = await cmsService.updateCourse(courseId, updates);
      if (updated) {
        setExistingCourses((prev) =>
          prev.map((c) =>
            c.id === courseId || (c as any)._id === courseId || (c as any).slug === courseId
              ? updated
              : c
          )
        );
        showToast(`✓ Updated "${updated.title}" successfully.`);
      }
    } catch (err: any) {
      showToast('⚠️ Error updating course: ' + (err?.message || 'Check fields'));
    }
  };

  const handleLoadIntoWizard = (course: Course) => {
    setCourseName(course.title || '');
    setCourseDescription(course.description || '');
    setCoursePrice(course.price ? String(course.price).replace(/[^0-9]/g, '') : '');
    setOriginalPrice(
      (course as any).originalPrice
        ? String((course as any).originalPrice).replace(/[^0-9]/g, '')
        : ''
    );
    if (course.category) {
      setCategory(course.category);
    }
    if (course.level || (course as any).courseLevel) {
      setCourseLevel(course.level || (course as any).courseLevel || 'Beginner to Advanced');
    }
    if (course.coverImage) {
      setThumbnailPreview(course.coverImage);
      setCloudinaryCoverUrl(course.coverImage);
    }
    setDemoVideoUrl(course.demoVideoUrl || (course as any).videoUrl || (course.curriculumSections?.[0]?.lectures?.[0]?.videoUrl) || '');
    setEditingCourseId(course.id || (course as any)._id || null);
    if (course.tags && Array.isArray(course.tags) && course.tags.length > 0) {
      setSelectedTags(course.tags);
    } else {
      const derived: string[] = [];
      if (course.courseType === 'test-series') derived.push('Test Series');
      else if (course.courseType === 'dlp') derived.push('Self-Study DLP');
      else derived.push('Live Online');
      if (course.isPopular) derived.push('Popular');
      if (course.badge) derived.push(course.badge);
      setSelectedTags(Array.from(new Set(derived)));
    }
    if (Array.isArray(course.curriculumSections) && course.curriculumSections.length > 0) {
      const mappedSections: SectionBlock[] = course.curriculumSections.map((sec, sIdx) => ({
        id: sec.id || `sec-${sIdx + 1}`,
        title: sec.title || `Section ${sIdx + 1}`,
        isExpanded: true,
        isFreePreview: !!(sec as any).isFreePreview,
        lectures: (sec.lectures || []).map((lec, lIdx) => ({
          id: lec.id || `lec-${sIdx + 1}-${lIdx + 1}`,
          title: lec.title || `Lesson ${lIdx + 1}`,
          videoUrl: lec.videoUrl || '',
          durationMinutes:
            (lec as any).durationMinutes || parseInt(String(lec.duration || '45'), 10) || 45,
          description: lec.description || '',
          isFreePreview: !!(lec as any).isFreePreview || !!lec.isPreview,
          resources: (lec.resources || []).map((r, rIdx) => ({
            id: r.id || `res-${sIdx + 1}-${lIdx + 1}-${rIdx + 1}`,
            title: r.title || 'Handout PDF / Notes',
            url: r.url || ''
          }))
        }))
      }));
      setSections(mappedSections);
    }
    setCurrentStep(1);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`✓ Loaded "${course.title}" into wizard. Edit steps and click Publish to update.`);
  };

  // ─── Step 2: Course Options & Benefits State ───
  const [benefits, setBenefits] = useState<string[]>([
    "Master DK Sir's algorithmic 20-30s speed inspection methods for complex algebra & calculus.",
    'Complete coverage of JEE Advanced level mechanics, electrodynamics, and organic reaction pathways.',
    'Daily graded DPP problem sheets with step-by-step video solutions and doubt desk resolution.'
  ]);
  const [prerequisites, setPrerequisites] = useState<string[]>([
    'Basic Class 10th algebra, coordinate geometry, and fundamental physics mechanics.',
    'Minimum commitment of 4 hours daily self-study alongside offline/online lectures.'
  ]);

  // ─── Step 3: Course Content & Sections State ───
  const [sections, setSections] = useState<SectionBlock[]>([
    {
      id: 'sec-1',
      title: 'Section 1: Foundations of Calculus & Function Graphs',
      isExpanded: true,
      isFreePreview: true,
      lectures: [
        {
          id: 'lec-1-1',
          title: 'Lesson 1: Introduction to Limit Theorems & Instant Shortcut Rules',
          videoUrl: 'https://stream.dkacademy.com/hls/calc-lec-01.m3u8',
          durationMinutes: 45,
          description:
            "Key theoretical derivations of limits, indeterminacy forms, and DK Sir's inspection drill examples.",
          isFreePreview: true,
          resources: [
            {
              id: 'res-1-1-1',
              title: 'Classroom Handwritten Notes PDF',
              url: 'https://assets.dkacademy.com/notes/calc-lec-01.pdf'
            },
            {
              id: 'res-1-1-2',
              title: 'DPP-01 Limit Indeterminacy Problems',
              url: 'https://assets.dkacademy.com/dpp/calc-dpp-01.pdf'
            }
          ]
        },
        {
          id: 'lec-1-2',
          title: 'Lesson 2: Graphical Continuity & Asymptote Identification',
          videoUrl: 'https://stream.dkacademy.com/hls/calc-lec-02.m3u8',
          durationMinutes: 50,
          description:
            'Rapid curve sketching techniques for rational polynomials and periodic functions.',
          isFreePreview: false,
          resources: [
            {
              id: 'res-1-2-1',
              title: 'Class 11 Graphical Practice Sheet',
              url: 'https://assets.dkacademy.com/notes/calc-lec-02.pdf'
            }
          ]
        }
      ]
    },
    {
      id: 'sec-2',
      title: 'Section 2: Differential Calculus & Rate Measure Applications',
      isExpanded: false,
      isFreePreview: false,
      lectures: [
        {
          id: 'lec-2-1',
          title: 'Lesson 1: Higher Order Derivatives & Parametric Differentiation',
          videoUrl: 'https://stream.dkacademy.com/hls/diff-lec-01.m3u8',
          durationMinutes: 40,
          description:
            'Parametric equations, implicit functions, and chain rule speed evaluation shortcuts.',
          isFreePreview: false,
          resources: [
            {
              id: 'res-2-1-1',
              title: 'Differentiation Handout & Master Formula PDF',
              url: 'https://assets.dkacademy.com/notes/diff-lec-01.pdf'
            }
          ]
        }
      ]
    }
  ]);

  // Validation warning state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ─── Step Validation Engine ───
  const validateStep1 = (): string | null => {
    if (!courseName.trim()) {
      return 'Please enter the Course Name / Batch Title.';
    }
    if (courseName.trim().length < 4) {
      return 'Course Name must be at least 4 characters long.';
    }
    if (!courseDescription.trim()) {
      return 'Please provide a Course Description.';
    }
    if (!coursePrice.trim()) {
      return 'Please specify the Course Price.';
    }
    const numericPrice = parseInt(coursePrice.replace(/\D/g, ''), 10);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return 'Please enter a valid numeric Course Price.';
    }
    if (originalPrice.trim()) {
      const numOriginal = parseInt(originalPrice.replace(/\D/g, ''), 10);
      if (!isNaN(numOriginal) && numOriginal > 0 && numOriginal < numericPrice) {
        return 'Original Price (Standard fee) cannot be lower than the discounted Course Price.';
      }
    }
    if (!category.trim()) {
      return 'Please select a Course Category.';
    }
    if (!courseLevel.trim()) {
      return 'Please select a Course Level / Academic Tier.';
    }
    if (!thumbnailPreview && !cloudinaryCoverUrl) {
      return 'Please upload a Course Cover Thumbnail artwork before proceeding.';
    }
    return null;
  };

  const validateStep2 = (): string | null => {
    const validBenefits = benefits.filter((b) => b.trim().length > 0);
    if (validBenefits.length === 0) {
      return 'Please specify at least 1 Learning Outcome / Course Benefit.';
    }
    const validPrereqs = prerequisites.filter((p) => p.trim().length > 0);
    if (validPrereqs.length === 0) {
      return 'Please specify at least 1 Academic Prerequisite.';
    }
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!sections || sections.length === 0) {
      return 'Please add at least 1 Section / Chapter to the course curriculum.';
    }
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      if (!sec.title.trim()) {
        return `Section ${sIdx + 1} is missing a Chapter Title. Please enter a title.`;
      }
      if (!sec.lectures || sec.lectures.length === 0) {
        return `Section "${sec.title}" must contain at least 1 Video Lecture or Lesson.`;
      }
      for (let lIdx = 0; lIdx < sec.lectures.length; lIdx++) {
        const lec = sec.lectures[lIdx];
        if (!lec.title.trim()) {
          return `Lesson ${lIdx + 1} in Section "${sec.title}" is missing a Lesson Title.`;
        }
        if (!lec.videoUrl.trim()) {
          return `Lesson "${lec.title || `Lesson ${lIdx + 1}`}" in Section "${sec.title}" requires a Video Stream URL.`;
        }
      }
    }
    return null;
  };

  // ─── Step Navigation Handlers ───
  const goToNextStep = () => {
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setValidationError(err);
        showToast('⚠️ ' + err);
        return;
      }
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) {
        setValidationError(err);
        showToast('⚠️ ' + err);
        return;
      }
    } else if (currentStep === 3) {
      const err = validateStep3();
      if (err) {
        setValidationError(err);
        showToast('⚠️ ' + err);
        return;
      }
    }

    setValidationError(null);
    setCurrentStep((prev) => Math.min(4, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevStep = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepSelect = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setValidationError(null);
      setCurrentStep(targetStep);
      return;
    }
    if (targetStep >= 2) {
      const err1 = validateStep1();
      if (err1) {
        setValidationError(err1);
        showToast('⚠️ Complete Step 1: ' + err1);
        return;
      }
    }
    if (targetStep >= 3) {
      const err2 = validateStep2();
      if (err2) {
        setValidationError(err2);
        showToast('⚠️ Complete Step 2: ' + err2);
        return;
      }
    }
    if (targetStep >= 4) {
      const err3 = validateStep3();
      if (err3) {
        setValidationError(err3);
        showToast('⚠️ Complete Step 3: ' + err3);
        return;
      }
    }
    setValidationError(null);
    setCurrentStep(targetStep);
  };

  // ─── Benefit & Prerequisite List Actions ───
  const addBenefitItem = () => {
    setBenefits([...benefits, '']);
  };

  const updateBenefitItem = (index: number, val: string) => {
    const updated = [...benefits];
    updated[index] = val;
    setBenefits(updated);
  };

  const removeBenefitItem = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const addPrerequisiteItem = () => {
    setPrerequisites([...prerequisites, '']);
  };

  const updatePrerequisiteItem = (index: number, val: string) => {
    const updated = [...prerequisites];
    updated[index] = val;
    setPrerequisites(updated);
  };

  const removePrerequisiteItem = (index: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  // ─── Curriculum Section & Lecture Actions ───
  const toggleSectionExpand = (sectionId: string) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, isExpanded: !sec.isExpanded } : sec
      )
    );
  };

  const toggleSectionFreePreview = (sectionId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const nextState = !sec.isFreePreview;
          showToast(
            nextState
              ? 'Chapter marked as Free Demo preview.'
              : 'Chapter marked as Locked (Paid batch).'
          );
          return { ...sec, isFreePreview: nextState };
        }
        return sec;
      })
    );
  };

  const toggleLectureFreePreview = (sectionId: string, lectureId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            lectures: sec.lectures.map((lec) => {
              if (lec.id === lectureId) {
                const nextState = !lec.isFreePreview;
                showToast(
                  nextState
                    ? 'Lecture unlocked for free trial.'
                    : 'Lecture locked for enrolled students.'
                );
                return { ...lec, isFreePreview: nextState };
              }
              return lec;
            })
          };
        }
        return sec;
      })
    );
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, title: newTitle } : sec
      )
    );
  };

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((sec) => sec.id !== sectionId));
    showToast('Section removed.');
  };

  const addNewSection = () => {
    const newSecNumber = sections.length + 1;
    const newSection: SectionBlock = {
      id: `sec-${Date.now()}`,
      title: `Section ${newSecNumber}: New Academic Module`,
      isExpanded: true,
      lectures: [
        {
          id: `lec-${Date.now()}-1`,
          title: 'Lesson 1: Introduction & Topic Overview',
          videoUrl: '',
          durationMinutes: 45,
          description: '',
          resources: []
        }
      ]
    };
    setSections([...sections, newSection]);
    showToast('New section added to curriculum.');
  };

  const addNewLectureToSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const lecNumber = sec.lectures.length + 1;
          const newLecture: LectureItem = {
            id: `lec-${Date.now()}-${lecNumber}`,
            title: `Lesson ${lecNumber}: New Lecture Title`,
            videoUrl: '',
            durationMinutes: 45,
            description: '',
            resources: []
          };
          return {
            ...sec,
            lectures: [...sec.lectures, newLecture]
          };
        }
        return sec;
      })
    );
  };

  const updateLectureField = (
    sectionId: string,
    lectureId: string,
    field: keyof LectureItem,
    value: any
  ) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            lectures: sec.lectures.map((lec) =>
              lec.id === lectureId ? { ...lec, [field]: value } : lec
            )
          };
        }
        return sec;
      })
    );
  };

  const removeLecture = (sectionId: string, lectureId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            lectures: sec.lectures.filter((lec) => lec.id !== lectureId)
          };
        }
        return sec;
      })
    );
  };

  const addResourceToLecture = (sectionId: string, lectureId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            lectures: sec.lectures.map((lec) => {
              if (lec.id === lectureId) {
                const newRes: LectureResource = {
                  id: `res-${Date.now()}`,
                  title: 'Handout PDF / Practice Notes',
                  url: 'https://assets.dkacademy.com/handout.pdf'
                };
                return {
                  ...lec,
                  resources: [...lec.resources, newRes]
                };
              }
              return lec;
            })
          };
        }
        return sec;
      })
    );
  };

  const updateResourceField = (
    sectionId: string,
    lectureId: string,
    resourceId: string,
    field: keyof LectureResource,
    val: string
  ) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            lectures: sec.lectures.map((lec) => {
              if (lec.id === lectureId) {
                return {
                  ...lec,
                  resources: lec.resources.map((r) =>
                    r.id === resourceId ? { ...r, [field]: val } : r
                  )
                };
              }
              return lec;
            })
          };
        }
        return sec;
      })
    );
  };

  const removeResourceFromLecture = (
    sectionId: string,
    lectureId: string,
    resourceId: string
  ) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            lectures: sec.lectures.map((lec) => {
              if (lec.id === lectureId) {
                return {
                  ...lec,
                  resources: lec.resources.filter((r) => r.id !== resourceId)
                };
              }
              return lec;
            })
          };
        }
        return sec;
      })
    );
  };

  // ─── Computed Curriculum Tallies for Step 4 Preview ───
  const totalLecturesCount = sections.reduce(
    (acc, sec) => acc + sec.lectures.length,
    0
  );
  const totalDurationMinutes = sections.reduce(
    (acc, sec) =>
      acc + sec.lectures.reduce((lAcc, lec) => lAcc + (Number(lec.durationMinutes) || 0), 0),
    0
  );
  const totalHoursDisplay = (totalDurationMinutes / 60).toFixed(1);
  const totalResourcesCount = sections.reduce(
    (acc, sec) =>
      acc + sec.lectures.reduce((lAcc, lec) => lAcc + lec.resources.length, 0),
    0
  );

  // ─── Publish Final Action ───
  const handlePublishCourse = async () => {
    // Validate all steps before publishing
    const err1 = validateStep1();
    if (err1) {
      setValidationError(err1);
      setCurrentStep(1);
      showToast('⚠️ Step 1 incomplete: ' + err1);
      return;
    }
    const err2 = validateStep2();
    if (err2) {
      setValidationError(err2);
      setCurrentStep(2);
      showToast('⚠️ Step 2 incomplete: ' + err2);
      return;
    }
    const err3 = validateStep3();
    if (err3) {
      setValidationError(err3);
      setCurrentStep(3);
      showToast('⚠️ Step 3 incomplete: ' + err3);
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Ensure Cloudinary cover image URL
      let finalCoverImage = cloudinaryCoverUrl || thumbnailPreview;
      if (!cloudinaryCoverUrl && thumbnailPreview && thumbnailPreview.startsWith('data:')) {
        try {
          const upRes = await apiClient.uploadMedia(thumbnailPreview, 'dk-academy/courses');
          if (upRes.success && upRes.url) {
            finalCoverImage = upRes.url;
            setCloudinaryCoverUrl(upRes.url);
          }
        } catch (uploadErr) {
          console.warn('[Thumbnail Cloudinary Upload fallback]:', uploadErr);
        }
      }
      if (!finalCoverImage || finalCoverImage.startsWith('blob:')) {
        finalCoverImage = '/img/dk-results-banner.jpeg';
      }

      // 2. Map curriculum sections with all lectures, video URLs, and study resources
      const mappedCurriculum: CourseCurriculumSection[] = sections.map((sec, secIdx) => ({
        id: sec.id || `sec-${secIdx + 1}`,
        title: sec.title.trim(),
        description: 'Curriculum module syllabus breakdown and concept video lectures',
        durationText: `${sec.lectures.length} lessons`,
        isFreePreview: !!sec.isFreePreview,
        lectures: sec.lectures.map((lec, lecIdx) => ({
          id: lec.id || `lec-${secIdx + 1}-${lecIdx + 1}`,
          title: lec.title.trim(),
          duration: `${lec.durationMinutes || 45} mins`,
          durationMinutes: Number(lec.durationMinutes) || 45,
          isPreview: !!lec.isFreePreview || !!sec.isFreePreview,
          isFreePreview: !!lec.isFreePreview || !!sec.isFreePreview,
          lessonType: 'recorded_video',
          videoStatus: 'ready',
          videoUrl: lec.videoUrl.trim() || demoVideoUrl.trim(),
          description: lec.description || '',
          notesPdfUrl: lec.resources?.[0]?.url || '',
          dppPdfUrl: lec.resources?.[1]?.url || '',
          resources: (lec.resources || []).map((r, rIdx) => ({
            id: r.id || `res-${secIdx + 1}-${lecIdx + 1}-${rIdx + 1}`,
            title: r.title.trim(),
            url: r.url.trim()
          }))
        }))
      }));

      const numPrice = parseInt(coursePrice.replace(/\D/g, '') || '0', 10);
      const numOrigPrice = parseInt(originalPrice.replace(/\D/g, '') || '0', 10) || (numPrice > 0 ? numPrice + 20000 : 0);
      const generatedSlug = courseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const isFreeCourse = courseLevel.toLowerCase().includes('free') || numPrice === 0;

      const isTestSeries = selectedTags.some((t) => t.toLowerCase().includes('test series'));
      const isDlp = selectedTags.some((t) => t.toLowerCase().includes('dlp') || t.toLowerCase().includes('self-study'));
      const isLiveOnline = selectedTags.some((t) => t.toLowerCase().includes('live'));
      const isPopularTag = selectedTags.some((t) => t.toLowerCase().includes('popular'));
      const promoBadge = selectedTags.find((t) => ['Popular', 'Bestseller', 'New Batch', 'Trending'].includes(t)) || (isPopularTag ? 'Popular' : 'Newly Launched');
      const formatMode = isTestSeries ? 'Online Test Series' : isDlp ? 'Self-Paced' : isLiveOnline ? 'Live + Recorded' : 'Live';
      const calculatedCourseType = isTestSeries ? 'test-series' : isDlp ? 'dlp' : 'live';

      const targetId = editingCourseId || generatedSlug;

      const newCourse: Course = {
        id: targetId,
        slug: generatedSlug,
        title: courseName.trim(),
        description: courseDescription.trim(),
        targetExam: category.toLowerCase().includes('bitsat')
          ? 'Crash Course'
          : category.toLowerCase().includes('foundation')
          ? 'Foundation'
          : 'JEE Main & Advanced',
        category: category.trim(),
        targetClass: category.includes('11')
          ? 'Class 11th'
          : category.includes('12')
          ? 'Class 12th'
          : category.includes('Dropper')
          ? 'Dropper'
          : 'Class 11th',
        targetYear: 'Target JEE 2028',
        tags: selectedTags,
        badge: promoBadge,
        badgeUrgency: 'instant',
        tier: isFreeCourse ? 'Free' : 'Paid',
        level: courseLevel.trim(),
        courseLevel: courseLevel.trim(),
        price: numPrice === 0 ? '₹0 Free' : `₹${numPrice.toLocaleString('en-IN')}`,
        numericPrice: numPrice,
        originalPrice: `₹${numOrigPrice.toLocaleString('en-IN')}`,
        mode: formatMode,
        deliveryMode: formatMode,
        courseType: calculatedCourseType,
        schedule: '4 Days / Week (MWF + Sun)',
        duration: '2-Year Full Program',
        language: 'Hinglish (Hindi + Eng)',
        taughtByIitians: true,
        isPopular: isPopularTag,
        enrolledCount: 1,
        coverImage: finalCoverImage,
        demoVideoUrl: demoVideoUrl.trim(),
        features: benefits.filter(Boolean),
        curriculumSections: mappedCurriculum,
        status: 'Published',
        instructor: 'DK Sir (IIT Delhi Alum, 18+ Yrs Exp)'
      };

      // 3. Persist to MongoDB backend and dispatch real-time events
      let published: Course;
      if (editingCourseId) {
        const res = await cmsService.updateCourse(editingCourseId, newCourse);
        published = res || newCourse;
        showToast(`✓ Course "${published.title}" updated in MongoDB successfully!`);
      } else {
        published = await cmsService.createCourse(newCourse);
        showToast(`✓ Course "${published.title}" published & saved to MongoDB!`);
      }
      setExistingCourses((prev) => [
        published,
        ...prev.filter(
          (c) =>
            c.id !== published.id &&
            (c as any)._id !== (published as any)._id &&
            c.id !== targetId
        )
      ]);
      setIsPublished(true);
      setEditingCourseId(null);
    } catch (publishErr: any) {
      console.error('[handlePublishCourse Error]:', publishErr);
      showToast('Error publishing course: ' + (publishErr?.message || 'Check fields'));
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Stepper Milestone Definitions ───
  const stepsList = [
    {
      stepNumber: 1,
      title: 'Course Information',
      subtitle: 'Basic info, pricing & media asset'
    },
    {
      stepNumber: 2,
      title: 'Course Options / Benefits',
      subtitle: 'Target exam, outcomes & prerequisites'
    },
    {
      stepNumber: 3,
      title: 'Course Content & Sections',
      subtitle: 'Chapters, video lectures & study PDFs'
    },
    {
      stepNumber: 4,
      title: 'Course Preview & Publish',
      subtitle: 'Final catalog review & live publish'
    }
  ];

  const parsedOrigPrice = parseInt(originalPrice.replace(/\D/g, '') || '0', 10);
  const parsedCoursePrice = parseInt(coursePrice.replace(/\D/g, '') || '0', 10);
  const discountPercent =
    parsedOrigPrice > parsedCoursePrice && parsedOrigPrice > 0
      ? Math.round(((parsedOrigPrice - parsedCoursePrice) / parsedOrigPrice) * 100)
      : 0;
  const savingsAmount =
    parsedOrigPrice > parsedCoursePrice ? parsedOrigPrice - parsedCoursePrice : 0;

  return (
    <div className={styles.courseBuilderShell}>
      {/* Toast Notice */}
      {toastMessage && (
        <div className={styles.toastNotice} role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Page Subheader */}
      <section className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
            <span className={styles.breadcrumbRoot}>Admin Console</span>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbRoot}>Academics</span>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbActive}>Courses &amp; Curriculum</span>
          </nav>
          <h1 className={styles.headingTitle}>
            {activeTab === 'create' ? 'Create New Course' : 'Created Courses & Catalog'}
          </h1>
        </div>

        {/* ─── Top Segmented Tab Switcher (Usability Heuristics Fix #2) ─── */}
        <div className={styles.topTabBar} role="tablist" aria-label="Course Management Modes">
          <button
            type="button"
            role="tab"
            id="tab-create"
            aria-selected={activeTab === 'create'}
            aria-controls="panel-create"
            tabIndex={activeTab === 'create' ? 0 : -1}
            className={`${styles.tabBtn} ${activeTab === 'create' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <PlusCircle size={15} aria-hidden="true" />
            <span>Course Creation Wizard</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-catalog"
            aria-selected={activeTab === 'catalog'}
            aria-controls="panel-catalog"
            tabIndex={activeTab === 'catalog' ? 0 : -1}
            className={`${styles.tabBtn} ${activeTab === 'catalog' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <BookOpen size={15} aria-hidden="true" />
            <span>Created Batches Catalog ({existingCourses.length})</span>
          </button>
        </div>
      </section>

      {/* Validation Banner (Matches reference image_22be36) */}
      {validationError && (
        <div className={styles.validationBanner} role="alert">
          <AlertTriangle size={16} className={styles.alertIcon} />
          <span>{validationError}</span>
          <button
            type="button"
            className={styles.dismissBannerBtn}
            onClick={() => setValidationError(null)}
            aria-label="Dismiss alert"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── TAB PANEL 1: Wizard Stage (~75% Center Form + ~25% Stepper) ─── */}
      <div
        id="panel-create"
        role="tabpanel"
        aria-labelledby="tab-create"
        hidden={activeTab !== 'create'}
        className={styles.builderStageGrid}
      >
        {/* ─── CENTER FORM STAGE (~75% Width) ─── */}
        <main className={styles.formStageCard} role="region" aria-label="Wizard Form Step">
          {/* ================================================== */}
          {/* STEP 1: COURSE INFORMATION (Matches image_22b698)  */}
          {/* ================================================== */}
          {currentStep === 1 && (
            <div className={styles.stepContentBlock}>
              <div className={styles.stepCardHeader}>
                <h2 className={styles.stepCardTitle}>
                  Basic Course Information &amp; Media Asset
                </h2>
                <p className={styles.stepCardSubtitle}>
                  Define the course identity, batch pricing, category classification, and cover artwork.
                </p>
              </div>

              <div className={styles.formMatrix}>
                {/* Field 1: Course Name (Full Width) */}
                <div className={`${styles.fieldCol} ${styles.colFull}`}>
                  <label className={styles.fieldLabel}>Course Name / Batch Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="e.g., Ultimate 2-Year Live Classroom: Target JEE 2028"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </div>

                {/* Field 2: Course Description (Full Width) */}
                <div className={`${styles.fieldCol} ${styles.colFull}`}>
                  <label className={styles.fieldLabel}>Course Description *</label>
                  <textarea
                    rows={5}
                    className={styles.formTextarea}
                    placeholder="Comprehensive Kota classroom rigor covering Class 11 & 12 PCM, DK Sir's 20-30s speed inspection drills, and daily DPPs..."
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                  />
                </div>

                {/* Field 3: Estimated / Original Price (Half Width) - FIRST */}
                <div className={`${styles.fieldCol} ${styles.colHalf}`}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>
                      Original Price / MRP (₹) (Optional Strikethrough)
                    </label>
                  </div>
                  <div className={styles.inputPrefixWrapper}>
                    <span className={styles.prefixSymbol}>₹</span>
                    <input
                      type="number"
                      className={styles.formInputPrefixed}
                      placeholder="105000"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                  </div>
                  <span className={styles.pricingNote}>Standard fee before any promotional discounts</span>
                </div>

                {/* Field 4: Course Price (Half Width) - AFTER */}
                <div className={`${styles.fieldCol} ${styles.colHalf}`}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>Course Price / Offer Price (₹) *</label>
                    {discountPercent > 0 && (
                      <span className={styles.pricingDiscountTag}>
                        <Sparkles size={11} /> {discountPercent}% OFF • Saves ₹{savingsAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div className={styles.inputPrefixWrapper}>
                    <span className={styles.prefixSymbol}>₹</span>
                    <input
                      type="number"
                      required
                      className={styles.formInputPrefixed}
                      placeholder="84000"
                      value={coursePrice}
                      onChange={(e) => setCoursePrice(e.target.value)}
                    />
                  </div>
                  <span className={styles.pricingNote}>Final payable amount by student at checkout</span>
                </div>

                {/* Field 5: Course Tags & Badges (Dropdown + Quick Selector) */}
                <div className={`${styles.fieldCol} ${styles.colFull}`}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>
                      Course Tags &amp; Card Badges (e.g. Test Series, Popular, Live Online) *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Choose tags that will display on the course card
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Dropdown to select preset tags + Custom input */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        className={styles.formSelect}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleToggleTag(e.target.value);
                          }
                        }}
                        style={{ flex: '1 1 240px', minWidth: '220px' }}
                        aria-label="Add course tag from dropdown"
                      >
                        <option value="">▼ Select Tag / Badge to Add...</option>
                        {PRESET_COURSE_TAGS.map((tag) => (
                          <option key={tag} value={tag}>
                            {selectedTags.includes(tag) ? '✓ ' : '+ '} {tag}
                          </option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', gap: '6px', flex: '1 1 200px' }}>
                        <input
                          type="text"
                          placeholder="Type custom tag..."
                          className={styles.formInput}
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={handleAddCustomTag}
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
                      {PRESET_COURSE_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        const isPromo = ['popular', 'bestseller', 'new batch', 'trending'].includes(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
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
                    {selectedTags.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                          Active on Course Card ({selectedTags.length}):
                        </span>
                        {selectedTags.map((t) => (
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
                              onClick={() => handleToggleTag(t)}
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

                {/* Field 6: Course Categories (Half Width) - with Create Option */}
                <div className={`${styles.fieldCol} ${styles.colHalf}`}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>Course Category *</label>
                    {!isCreatingCategory && (
                      <button
                        type="button"
                        className={styles.inlineActionLink}
                        onClick={() => setIsCreatingCategory(true)}
                        title="Add a custom course category"
                        aria-label="Add a custom course category"
                      >
                        + New Category
                      </button>
                    )}
                  </div>

                  {isCreatingCategory ? (
                    <div className={styles.inlineCreateBox}>
                      <input
                        type="text"
                        autoFocus
                        className={styles.inlineCreateInput}
                        placeholder="Type new category (e.g. CUET Math, Olympiad)..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory();
                          } else if (e.key === 'Escape') {
                            setIsCreatingCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                      />
                      <div className={styles.inlineCreateActions}>
                        <button
                          type="button"
                          className={styles.btnSaveInline}
                          onClick={handleAddCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          <Check size={12} />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          className={styles.btnCancelInline}
                          onClick={() => {
                            setIsCreatingCategory(false);
                            setNewCategoryName('');
                          }}
                          title="Cancel"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      className={styles.formSelect}
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__CREATE_NEW_CATEGORY__') {
                          setIsCreatingCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__CREATE_NEW_CATEGORY__">Create New Category...</option>
                    </select>
                  )}
                </div>

                {/* Field 7: Course Level / Tier (Half Width) - with Create Option */}
                <div className={`${styles.fieldCol} ${styles.colHalf}`}>
                  <div className={styles.fieldLabelRow}>
                    <label className={styles.fieldLabel}>Course Level / Tier *</label>
                    {!isCreatingLevel && (
                      <button
                        type="button"
                        className={styles.inlineActionLink}
                        onClick={() => setIsCreatingLevel(true)}
                        title="Add a custom course level or tier"
                        aria-label="Add a custom course level or tier"
                      >
                        + New Level / Tier
                      </button>
                    )}
                  </div>

                  {isCreatingLevel ? (
                    <div className={styles.inlineCreateBox}>
                      <input
                        type="text"
                        autoFocus
                        className={styles.inlineCreateInput}
                        placeholder="Type new level/tier (e.g. Masterclass, Super 30)..."
                        value={newLevelName}
                        onChange={(e) => setNewLevelName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCourseLevel();
                          } else if (e.key === 'Escape') {
                            setIsCreatingLevel(false);
                            setNewLevelName('');
                          }
                        }}
                      />
                      <div className={styles.inlineCreateActions}>
                        <button
                          type="button"
                          className={styles.btnSaveInline}
                          onClick={handleAddCourseLevel}
                          disabled={!newLevelName.trim()}
                        >
                          <Check size={12} />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          className={styles.btnCancelInline}
                          onClick={() => {
                            setIsCreatingLevel(false);
                            setNewLevelName('');
                          }}
                          title="Cancel"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      className={styles.formSelect}
                      value={courseLevel}
                      onChange={(e) => {
                        if (e.target.value === '__CREATE_NEW_LEVEL__') {
                          setIsCreatingLevel(true);
                        } else {
                          setCourseLevel(e.target.value);
                        }
                      }}
                    >
                      {courseLevelsList.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                      <option value="__CREATE_NEW_LEVEL__">Create New Level / Tier...</option>
                    </select>
                  )}
                </div>

                {/* Field 8: Course Demo Video Link / Embed (Full Width) */}
                <div className={`${styles.fieldCol} ${styles.colFull}`}>
                  <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Video size={16} color="#2563eb" />
                      Course Demo Video Link / Embed URL (YouTube or Video Link)
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8' }}>
                      Plays on "Demo" Click
                    </span>
                  </label>
                  <input
                    type="url"
                    className={styles.formInput}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/... or .mp4 URL"
                    value={demoVideoUrl}
                    onChange={(e) => setDemoVideoUrl(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    💡 When visitors or students click <strong>"Demo"</strong> or <strong>"Watch Demo"</strong> on this course card or detail page, this exact video will play. Supports YouTube, Vimeo, Cloudinary, and direct MP4/video links.
                  </span>
                  {demoVideoUrl.trim() && (
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                        <Play size={14} color="#16a34a" /> Live Demo Video Preview:
                      </div>
                      {demoVideoUrl.includes('youtube.com') || demoVideoUrl.includes('youtu.be') ? (
                        <div style={{ position: 'relative', paddingBottom: '40%', height: 0, overflow: 'hidden', borderRadius: '6px' }}>
                          <iframe
                            src={
                              demoVideoUrl.includes('youtu.be/')
                                ? `https://www.youtube-nocookie.com/embed/${demoVideoUrl.split('youtu.be/')[1].split(/[?&]/)[0]}`
                                : demoVideoUrl.includes('watch?v=')
                                ? `https://www.youtube-nocookie.com/embed/${demoVideoUrl.split('watch?v=')[1].split(/[?&]/)[0]}`
                                : demoVideoUrl
                            }
                            title="Course Demo Preview"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video
                          src={demoVideoUrl}
                          controls
                          style={{ width: '100%', maxHeight: '200px', borderRadius: '6px', background: '#000' }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Field 9: Course Thumbnail Dropzone & Live Preview (Full Width) */}
                <div className={`${styles.fieldCol} ${styles.colFull}`}>
                  <label className={styles.fieldLabel}>Course Thumbnail Artwork *</label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleThumbnailFileChange}
                  />

                  {thumbnailPreview ? (
                    <div className={styles.thumbnailPreviewCard}>
                      {isUploadingThumbnail && (
                        <div className={styles.uploadingThumbnailOverlay}>
                          <Loader2 size={24} className="animate-spin" />
                          <span>Uploading to Cloudinary...</span>
                        </div>
                      )}
                      <div className={styles.previewImageContainer}>
                        <img
                          src={thumbnailPreview}
                          alt="Course thumbnail preview"
                          className={styles.previewImgReal}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/course-orientation-banner.jpg';
                          }}
                        />
                        <div className={styles.previewOverlay}>
                          <span className={styles.previewAspectRatioBadge}>16:9 HD Artwork</span>
                          <div className={styles.previewActionBtns}>
                            <button
                              type="button"
                              className={styles.btnChangeThumbnail}
                              onClick={triggerThumbnailUpload}
                              disabled={isUploadingThumbnail}
                            >
                              <Upload size={14} />
                              <span>Change Artwork</span>
                            </button>
                            <button
                              type="button"
                              className={styles.btnRemoveThumbnail}
                              onClick={removeThumbnail}
                              disabled={isUploadingThumbnail}
                            >
                              <Trash2 size={14} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={styles.thumbnailBadgeRow}>
                        <div className={styles.thumbnailFileInfo}>
                          <span className={styles.thumbnailTag}>✓ Live Artwork Loaded</span>
                          <span className={styles.thumbnailFilename}>
                            {thumbnailFileName || 'classroom-1.jpg'}
                          </span>
                        </div>
                        <span className={styles.recommendedDimensionsText}>
                          1280 × 720 (16:9 Aspect Ratio)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={styles.thumbnailDropzone}
                      onClick={triggerThumbnailUpload}
                    >
                      {isUploadingThumbnail ? (
                        <div className={styles.uploadingThumbnailOverlay}>
                          <Loader2 size={24} className="animate-spin" />
                          <span>Uploading to Cloudinary...</span>
                        </div>
                      ) : (
                        <div className={styles.dropzoneContent}>
                          <div className={styles.dropzoneIconWrap}>
                            <Upload size={22} className={styles.uploadIcon} />
                          </div>
                          <p className={styles.dropzoneMainText}>
                            Drag and drop your thumbnail image here, or{' '}
                            <span className={styles.browseLink}>Browse</span>
                          </p>
                          <span className={styles.dropzoneSubText}>
                            16:9 ratio recommended (1280x720px), max file size 5MB
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className={styles.bottomActionBar}>
                <div className={styles.actionLeft}>
                  {/* Left slot */}
                </div>
                <div className={styles.actionRight}>
                  <span className={styles.stepCounterText}>Step 1 of 4</span>
                  <button
                    type="button"
                    id="btn-next-step-1"
                    className={styles.btnPrimarySolid}
                    onClick={goToNextStep}
                  >
                    <span>Next: Course Options</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* STEP 2: COURSE OPTIONS & BENEFITS (Matches image_22b9c2) */}
          {/* ================================================== */}
          {currentStep === 2 && (
            <div className={styles.stepContentBlock}>
              <div className={styles.stepCardHeader}>
                <h2 className={styles.stepCardTitle}>
                  Student Outcomes, Pedagogy Benefits &amp; Prerequisites
                </h2>
                <p className={styles.stepCardSubtitle}>
                  Provide clear learning milestones and prerequisite requirements to maximize student enrollment conversion.
                </p>
              </div>

              {/* Section A: Benefits */}
              <div className={styles.dynamicSectionCard}>
                <div className={styles.sectionTitleRow}>
                  <h3 className={styles.sectionHeaderTitle}>
                    What are the benefits for students in this course?
                  </h3>
                  <button
                    type="button"
                    className={styles.addRepeatableBtn}
                    onClick={addBenefitItem}
                  >
                    <Plus size={13} />
                    <span>Add Learning Outcome</span>
                  </button>
                </div>

                <div className={styles.repeatableList}>
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className={styles.repeatableRow}>
                      <div className={styles.rowBulletNumber}>0{idx + 1}</div>
                      <input
                        type="text"
                        className={styles.repeatableInput}
                        placeholder="Enter course benefit or learning takeaway..."
                        value={benefit}
                        onChange={(e) => updateBenefitItem(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.rowDeleteBtn}
                        onClick={() => removeBenefitItem(idx)}
                        title="Remove benefit item"
                        aria-label="Remove benefit item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section B: Prerequisites */}
              <div className={styles.dynamicSectionCard}>
                <div className={styles.sectionTitleRow}>
                  <h3 className={styles.sectionHeaderTitle}>
                    What are the prerequisites for starting this course?
                  </h3>
                  <button
                    type="button"
                    className={styles.addRepeatableBtn}
                    onClick={addPrerequisiteItem}
                  >
                    <Plus size={13} />
                    <span>Add Prerequisite</span>
                  </button>
                </div>

                <div className={styles.repeatableList}>
                  {prerequisites.map((prereq, idx) => (
                    <div key={idx} className={styles.repeatableRow}>
                      <div className={styles.rowBulletNumber}>0{idx + 1}</div>
                      <input
                        type="text"
                        className={styles.repeatableInput}
                        placeholder="Enter academic prerequisite or time commitment..."
                        value={prereq}
                        onChange={(e) => updatePrerequisiteItem(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.rowDeleteBtn}
                        onClick={() => removePrerequisiteItem(idx)}
                        title="Remove prerequisite item"
                        aria-label="Remove prerequisite item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className={styles.bottomActionBar}>
                <div className={styles.actionLeft}>
                   <button
                     type="button"
                     id="btn-prev-step-2"
                     className={styles.btnSecondaryOutline}
                     onClick={goToPrevStep}
                   >
                     <ChevronLeft size={16} />
                     <span>Prev: Course Info</span>
                   </button>
                 </div>
                 <div className={styles.actionRight}>
                   <span className={styles.stepCounterText}>Step 2 of 4</span>
                   <button
                     type="button"
                     id="btn-next-step-2"
                     className={styles.btnPrimarySolid}
                     onClick={goToNextStep}
                   >
                    <span>Next: Course Content</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* STEP 3: COURSE CONTENT & SECTIONS (Matches image_22ba58, 22bd22, 22be36) */}
          {/* ================================================== */}
          {currentStep === 3 && (
            <div className={styles.stepContentBlock}>
              <div className={styles.stepCardHeader}>
                <div className={styles.headerTitleWrap}>
                  <h2 className={styles.stepCardTitle}>
                    Curriculum Builder: Sections, Lectures &amp; Study Resources
                  </h2>
                  <p className={styles.stepCardSubtitle}>
                    Organize your syllabus chapters, video lessons, durations, and attached PDF notes.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.btnNewChapter}
                  onClick={addNewSection}
                >
                  <FolderPlus size={15} />
                  <span>Add Section / Chapter</span>
                </button>
              </div>

              {/* Hierarchical Section Accordions */}
              <div className={styles.sectionsAccordionStack}>
                {sections.map((section, secIdx) => (
                  <div key={section.id} className={styles.sectionBlockCard}>
                    {/* Section Header Bar */}
                    <div
                      className={styles.sectionHeaderBar}
                      onClick={() => toggleSectionExpand(section.id)}
                    >
                      <div className={styles.sectionLeftMeta}>
                        <GripVertical size={16} className={styles.gripHandle} />
                        <span className={styles.sectionIndexBadge}>Sec {secIdx + 1}</span>
                        <input
                          type="text"
                          className={styles.sectionTitleInput}
                          value={section.title}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateSectionTitle(section.id, e.target.value)
                          }
                        />
                      </div>

                      <div className={styles.sectionRightMeta}>
                        {/* Free Demo vs Locked Chapter Toggle */}
                        <button
                          type="button"
                          className={`${styles.chapterAccessToggleBtn} ${
                            section.isFreePreview
                              ? styles.accessToggleFree
                              : styles.accessToggleLocked
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionFreePreview(section.id);
                          }}
                          title={
                            section.isFreePreview
                              ? 'Free Demo Chapter — Click to Lock'
                              : 'Locked Chapter — Click to Unlock for Free Preview'
                          }
                        >
                          {section.isFreePreview ? (
                            <>
                              <Unlock size={13} className={styles.unlockIcon} />
                              <span>Free Demo Chapter</span>
                            </>
                          ) : (
                            <>
                              <Lock size={13} className={styles.lockIcon} />
                              <span>Locked Chapter</span>
                            </>
                          )}
                        </button>

                        <span className={styles.lectureTallyChip}>
                          {section.lectures.length}{' '}
                          {section.lectures.length === 1 ? 'Lecture' : 'Lectures'} •{' '}
                          {section.lectures.reduce(
                            (acc, l) => acc + (Number(l.durationMinutes) || 0),
                            0
                          )}{' '}
                          mins
                        </span>

                        <button
                          type="button"
                          className={styles.sectionTrashBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.id);
                          }}
                          title="Delete section"
                        >
                          <Trash2 size={15} />
                        </button>

                        <div className={styles.expandChevron}>
                          {section.isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section Body: Nested Lectures */}
                    {section.isExpanded && (
                      <div className={styles.sectionBodyContent}>
                        {section.lectures.map((lecture, lecIdx) => (
                          <div key={lecture.id} className={styles.lectureEditorCard}>
                            <div className={styles.lectureCardTopBar}>
                              <div className={styles.lectureTitleHeading}>
                                <span className={styles.lectureNumberChip}>
                                  Lesson {lecIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  className={styles.lectureTitleInput}
                                  placeholder="Lesson title e.g., Introduction to Limit Theorems"
                                  value={lecture.title}
                                  onChange={(e) =>
                                    updateLectureField(
                                      section.id,
                                      lecture.id,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className={styles.lectureCardTopActions}>
                                {/* Free Demo Lecture Toggle */}
                                <button
                                  type="button"
                                  className={`${styles.lectureAccessToggleBtn} ${
                                    lecture.isFreePreview
                                      ? styles.lecToggleFree
                                      : styles.lecToggleLocked
                                  }`}
                                  onClick={() =>
                                    toggleLectureFreePreview(section.id, lecture.id)
                                  }
                                  title={
                                    lecture.isFreePreview
                                      ? 'Free Demo Video — Click to Lock'
                                      : 'Locked Video — Click to Unlock as Free Preview'
                                  }
                                >
                                  {lecture.isFreePreview ? (
                                    <>
                                      <Unlock size={12} />
                                      <span>Free Demo</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock size={12} />
                                      <span>Locked</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  className={styles.lectureDeleteBtn}
                                  onClick={() => removeLecture(section.id, lecture.id)}
                                  title="Delete lecture"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Stream URL & Video Length */}
                            <div className={styles.lectureTwoColRow}>
                              <div className={styles.lectureField}>
                                <label className={styles.lectureSublabel}>
                                  Video Stream URL (HLS / S3 / Vimeo)
                                </label>
                                <div className={styles.urlInputWrap}>
                                  <Video size={14} className={styles.urlPrefixIcon} />
                                  <input
                                    type="url"
                                    className={styles.lectureSubInputPrefixed}
                                    placeholder="https://stream.dkacademy.com/hls/lec-01.m3u8"
                                    value={lecture.videoUrl}
                                    onChange={(e) =>
                                      updateLectureField(
                                        section.id,
                                        lecture.id,
                                        'videoUrl',
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className={styles.lectureFieldSmall}>
                                <label className={styles.lectureSublabel}>
                                  Duration (Minutes)
                                </label>
                                <div className={styles.durationInputWrap}>
                                  <Clock size={14} className={styles.urlPrefixIcon} />
                                  <input
                                    type="number"
                                    className={styles.lectureSubInputPrefixed}
                                    placeholder="45"
                                    value={lecture.durationMinutes}
                                    onChange={(e) =>
                                      updateLectureField(
                                        section.id,
                                        lecture.id,
                                        'durationMinutes',
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Row 3: Description & Theoretical Notes */}
                            <div className={styles.lectureField}>
                              <label className={styles.lectureSublabel}>
                                Lecture Description &amp; Theoretical Concepts
                              </label>
                              <textarea
                                rows={2}
                                className={styles.lectureTextarea}
                                placeholder="Key theoretical derivations, formulas, and DK Sir's inspection drill examples..."
                                value={lecture.description}
                                onChange={(e) =>
                                  updateLectureField(
                                    section.id,
                                    lecture.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            {/* Row 4: Downloadable Resources & Links (Matches image_22bd22) */}
                            <div className={styles.resourcesWrapper}>
                              <div className={styles.resourcesHeaderRow}>
                                <span className={styles.resourcesHeading}>
                                  Study Materials, Handout PDFs &amp; Links
                                </span>
                                <button
                                  type="button"
                                  className={styles.addResourceActionLink}
                                  onClick={() =>
                                    addResourceToLecture(section.id, lecture.id)
                                  }
                                >
                                  <Plus size={12} />
                                  <span>Add Study Resource</span>
                                </button>
                              </div>

                              <div className={styles.resourceList}>
                                {lecture.resources.map((res) => (
                                  <div key={res.id} className={styles.resourceRow}>
                                    <FileText
                                      size={14}
                                      className={styles.resourceDocIcon}
                                    />
                                    <input
                                      type="text"
                                      className={styles.resourceTitleInput}
                                      placeholder="Handout PDF title e.g., Handwritten Notes"
                                      value={res.title}
                                      onChange={(e) =>
                                        updateResourceField(
                                          section.id,
                                          lecture.id,
                                          res.id,
                                          'title',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <input
                                      type="url"
                                      className={styles.resourceUrlInput}
                                      placeholder="https://assets.dkacademy.com/notes.pdf"
                                      value={res.url}
                                      onChange={(e) =>
                                        updateResourceField(
                                          section.id,
                                          lecture.id,
                                          res.id,
                                          'url',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      className={styles.resourceDeleteBtn}
                                      onClick={() =>
                                        removeResourceFromLecture(
                                          section.id,
                                          lecture.id,
                                          res.id
                                        )
                                      }
                                      title="Delete resource"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add Lecture Button inside section */}
                        <button
                          type="button"
                          className={styles.btnAddLectureToSection}
                          onClick={() => addNewLectureToSection(section.id)}
                        >
                          <Plus size={14} />
                          <span>Add Lecture to Section</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Action Bar */}
              <div className={styles.bottomActionBar}>
                <div className={styles.actionLeft}>
                  <button
                    type="button"
                    id="btn-prev-step-3"
                    className={styles.btnSecondaryOutline}
                    onClick={goToPrevStep}
                  >
                    <ChevronLeft size={16} />
                    <span>Prev: Course Options</span>
                  </button>
                </div>
                <div className={styles.actionRight}>
                  <span className={styles.stepCounterText}>Step 3 of 4</span>
                  <button
                    type="button"
                    id="btn-next-step-3"
                    className={styles.btnPrimarySolid}
                    onClick={goToNextStep}
                  >
                    <span>Next: Course Preview</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* STEP 4: COURSE PREVIEW & FINAL PUBLISH             */}
          {/* ================================================== */}
          {currentStep === 4 && (
            <div className={styles.stepContentBlock}>
              <div className={styles.stepCardHeader}>
                <h2 className={styles.stepCardTitle}>
                  Review Course Syllabus &amp; Confirm Catalog Publication
                </h2>
                <p className={styles.stepCardSubtitle}>
                  Preview how the new course card will appear to enrolled students and verify all academic syllabus metrics.
                </p>
              </div>

              {/* 2-Column Split Preview */}
              <div className={styles.previewSplitGrid}>
                {/* Left: LMS Student Card Preview */}
                <div className={styles.previewCardLeft}>
                  <div className={styles.previewCardSubheading}>
                    <span>Student Catalog Card Preview</span>
                  </div>

                  <div className={styles.lmsStudentCard}>
                    <div className={styles.cardImageContainer}>
                      <img
                        src={thumbnailPreview}
                        alt={courseName}
                        className={styles.previewImage}
                      />
                      <span className={styles.badgePromo}>{category}</span>
                      <span className={styles.badgeTarget}>{courseLevel}</span>
                    </div>

                    <div className={styles.cardInfoContainer}>
                      <div className={styles.mentorRow}>
                        <GraduationCap size={14} className={styles.mentorIcon} />
                        <span className={styles.mentorName}>
                          Dharmendra Kumar (DK Sir) • HOD Maths
                        </span>
                      </div>

                      <h3 className={styles.catalogTitle}>{courseName}</h3>
                      <p className={styles.catalogDesc}>{courseDescription}</p>

                      <div className={styles.catalogPricingRow}>
                        <div className={styles.priceGroup}>
                          <span className={styles.mainPrice}>
                            ₹{Number(coursePrice || '0').toLocaleString('en-IN')}
                          </span>
                          {originalPrice && Number(originalPrice) > Number(coursePrice) && (
                            <span className={styles.strikethroughPrice}>
                              ₹{Number(originalPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {discountPercent > 0 && (
                          <span className={styles.saveBadge}>Save {discountPercent}%</span>
                        )}
                      </div>

                      <div className={styles.metaFeaturesList}>
                        {benefits.filter((b) => b.trim().length > 0).length > 0 ? (
                          benefits
                            .filter((b) => b.trim().length > 0)
                            .map((benefit, bIdx) => (
                              <div key={bIdx} className={styles.featureItem}>
                                <CheckCircle2 size={13} className={styles.featureCheck} />
                                <span>{benefit}</span>
                              </div>
                            ))
                        ) : (
                          <div className={styles.featureItem}>
                            <CheckCircle2 size={13} className={styles.featureCheck} />
                            <span>Comprehensive Classroom Mentorship</span>
                          </div>
                        )}
                      </div>

                      {prerequisites.filter((p) => p.trim().length > 0).length > 0 && (
                        <div className={styles.previewPrereqBlock}>
                          <span className={styles.previewPrereqTitle}>Prerequisites:</span>
                          <div className={styles.previewPrereqTags}>
                            {prerequisites
                              .filter((p) => p.trim().length > 0)
                              .map((prereq, pIdx) => (
                                <span key={pIdx} className={styles.previewPrereqTag}>
                                  {prereq}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Curriculum Checklist & Publishing Summary */}
                <div className={styles.previewSummaryRight}>
                  <div className={styles.previewCardSubheading}>
                    <span>Curriculum &amp; Publishing Checklist</span>
                  </div>

                  <div className={styles.checklistMetricsGrid}>
                    <div className={styles.metricTallyCard}>
                      <span className={styles.tallyNum}>{sections.length}</span>
                      <span className={styles.tallyLabel}>Chapters / Sections</span>
                    </div>
                    <div className={styles.metricTallyCard}>
                      <span className={styles.tallyNum}>{totalLecturesCount}</span>
                      <span className={styles.tallyLabel}>Video Lectures</span>
                    </div>
                    <div className={styles.metricTallyCard}>
                      <span className={styles.tallyNum}>{totalHoursDisplay} hrs</span>
                      <span className={styles.tallyLabel}>Total Runtime</span>
                    </div>
                    <div className={styles.metricTallyCard}>
                      <span className={styles.tallyNum}>{totalResourcesCount}</span>
                      <span className={styles.tallyLabel}>Downloadable PDFs</span>
                    </div>
                  </div>

                  {/* Interactive Syllabus Review Box with accordion */}
                  <div className={styles.syllabusReviewBox}>
                    <h4 className={styles.syllabusReviewTitle}>
                      Curriculum Structure ({sections.length} Chapters):
                    </h4>
                    <p className={styles.syllabusReviewSubtext}>
                      Click any chapter to inspect included video lessons &amp; resources.
                    </p>
                    <ul className={styles.syllabusReviewList}>
                      {sections.map((sec, i) => {
                        const isExpanded = expandedPreviewSecId === sec.id;
                        return (
                          <li key={sec.id} className={styles.syllabusReviewItem}>
                            <button
                              type="button"
                              className={styles.syllabusItemHeaderBtn}
                              onClick={() =>
                                setExpandedPreviewSecId(isExpanded ? null : sec.id)
                              }
                            >
                              <div className={styles.previewSectionHeaderLeft}>
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                                <span>
                                  <strong>Sec {i + 1}:</strong> {sec.title} (
                                  {sec.lectures.length} lessons)
                                </span>
                              </div>
                              <span
                                className={
                                  sec.isFreePreview
                                    ? styles.syllabusBadgeFree
                                    : styles.syllabusBadgeLocked
                                }
                              >
                                {sec.isFreePreview ? '🔓 Free Demo' : '🔒 Paid Batch'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className={styles.previewLecturesList}>
                                {sec.lectures.length === 0 ? (
                                  <div className={styles.previewNoLectures}>
                                    No lectures added yet.
                                  </div>
                                ) : (
                                  sec.lectures.map((lec, lIdx) => (
                                    <div key={lec.id} className={styles.previewLectureRow}>
                                      <div className={styles.previewLecLeft}>
                                        <Play size={12} className={styles.previewPlayIcon} />
                                        <span className={styles.previewLecNum}>
                                          {i + 1}.{lIdx + 1}
                                        </span>
                                        <span className={styles.previewLecTitle}>
                                          {lec.title}
                                        </span>
                                      </div>
                                      <div className={styles.previewLecRight}>
                                        {lec.durationMinutes > 0 && (
                                          <span className={styles.previewLecDuration}>
                                            {lec.durationMinutes}m
                                          </span>
                                        )}
                                        {lec.videoUrl && (
                                          <span className={styles.previewBadgeStream}>
                                            Video Ready
                                          </span>
                                        )}
                                        {lec.resources && lec.resources.length > 0 && (
                                          <span className={styles.previewBadgePdf}>
                                            {lec.resources.length} PDF
                                            {lec.resources.length > 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Platform Publish Status Box */}
                  <div className={styles.publishStatusBox}>
                    <div className={styles.statusBoxHeader}>
                      <ShieldCheck size={18} className={styles.statusBoxIcon} />
                      <span className={styles.statusBoxHeading}>Ready for Public Catalog</span>
                    </div>
                    <p className={styles.statusBoxText}>
                      Real-time live WebSocket broadcast will notify enrolled students across the platform upon publishing.
                    </p>
                  </div>
                </div>
              </div>

                {/* Bottom Action Bar */}
                <div className={styles.bottomActionBar}>
                  <div className={styles.actionLeft}>
                    <button
                      type="button"
                      id="btn-prev-step-4"
                      className={styles.btnSecondaryOutline}
                      onClick={goToPrevStep}
                    >
                      <ChevronLeft size={16} />
                      <span>Prev: Course Content</span>
                    </button>
                  </div>
                  <div className={styles.actionRight}>
                    <span className={styles.stepCounterText}>Step 4 of 4</span>
                    <button
                      type="button"
                      id="btn-publish-course"
                      className={styles.btnPublishCta}
                      onClick={handlePublishCourse}
                      disabled={isPublished || isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Publishing to Catalog &amp; Live Server...</span>
                        </>
                      ) : isPublished ? (
                        <>
                          <Check size={18} />
                          <span>✓ Course Published &amp; Active</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>✓ Publish Course to Live Platform</span>
                        </>
                      )}
                    </button>

                    {isPublished && (
                      <div className={styles.publishSuccessActions}>
                        <span className={styles.publishedBadge}>Live on Web</span>
                        <Link
                          to="/courses"
                          target="_blank"
                          rel="noreferrer"
                          className={styles.btnViewLiveCourse}
                        >
                          View Live on Website ↗
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ─── RIGHT STEPPER TRACKER (~25% Width) ─── */}
          <aside className={styles.rightStepperAside} aria-label="Course Creation Progress">
            <div className={styles.stepperContainer}>
              <div className={styles.stepperHeader}>
                <h3 className={styles.stepperHeading}>Creation Milestones</h3>
                <span className={styles.stepperSubheading}>
                  Step {currentStep} of {stepsList.length}
                </span>
              </div>

              <div className={styles.verticalTimeline}>
                {stepsList.map((step, idx) => {
                  const isCompleted = step.stepNumber < currentStep;
                  const isActive = step.stepNumber === currentStep;
                  const isUpcoming = step.stepNumber > currentStep;

                  return (
                    <div
                      key={step.stepNumber}
                      id={`milestone-step-${step.stepNumber}`}
                      className={`${styles.stepTimelineItem} ${
                        isActive ? styles.stepActive : ''
                      } ${isCompleted ? styles.stepCompleted : ''}`}
                      onClick={() => {
                        handleStepSelect(step.stepNumber);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Vertical Connector Line */}
                      {idx < stepsList.length - 1 && (
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

                      {/* Step Label & Subtext */}
                      <div className={styles.stepInfoBlock}>
                        <span className={styles.stepNumberTitle}>
                          Step {step.stepNumber}
                        </span>
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

      {/* ─── TAB PANEL 2: CREATED COURSES CATALOG SECTION (Cards with Edit & Delete) ─── */}
      <div
        id="panel-catalog"
        role="tabpanel"
        aria-labelledby="tab-catalog"
        hidden={activeTab !== 'catalog'}
      >
        <CreatedCoursesCatalog
          courses={existingCourses}
          categories={categoriesList}
          onDeleteCourse={handleDeleteExistingCourse}
          onUpdateCourse={handleUpdateExistingCourse}
          onLoadIntoWizard={(c) => {
            handleLoadIntoWizard(c);
            setActiveTab('create');
          }}
          onRefresh={loadExistingCourses}
          isRefreshing={isRefreshingCourses}
        />
      </div>
    </div>
  );
};

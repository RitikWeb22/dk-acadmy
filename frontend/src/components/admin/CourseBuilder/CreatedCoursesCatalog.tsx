import React, { useState, useMemo, useEffect } from 'react';
import type { Course } from '../../../types';
import {
  BookOpen,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  X,
  Check,
  Video,
  ShieldCheck,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import styles from './CreatedCoursesCatalog.module.scss';

interface CreatedCoursesCatalogProps {
  courses: Course[];
  categories: string[];
  onDeleteCourse: (courseId: string) => Promise<void> | void;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => Promise<void> | void;
  onLoadIntoWizard: (course: Course) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const CreatedCoursesCatalog: React.FC<CreatedCoursesCatalogProps> = ({
  courses,
  categories,
  onDeleteCourse,
  onUpdateCourse,
  onLoadIntoWizard,
  onRefresh,
  isRefreshing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');

  // Pagination state: default 6 cards per page for clean 3-column rows
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Auto-reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedMode]);

  // Modals state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    targetClass: '',
    targetYear: '',
    price: '',
    originalPrice: '',
    mode: 'Live' as Course['mode'],
    description: '',
    coverImage: '',
    demoVideoUrl: '',
    badge: '',
    tier: 'Paid',
    instructor: 'Dharmendra Kumar (DK Sir)',
    status: 'Published' as Course['status']
  });

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title || '',
      category: course.category || 'Class 11th Foundation',
      targetClass: course.targetClass || 'Class 11th',
      targetYear: course.targetYear || 'Target JEE 2028',
      price: course.price ? String(course.price).replace(/[^0-9]/g, '') : '',
      originalPrice: (course as any).originalPrice
        ? String((course as any).originalPrice).replace(/[^0-9]/g, '')
        : '',
      mode: course.mode || 'Live',
      description: course.description || '',
      coverImage: course.coverImage || '',
      demoVideoUrl: course.demoVideoUrl || (course as any).videoUrl || '',
      badge: course.badge || 'Newly Launched',
      tier: course.tier || 'Paid',
      instructor: (course as any).instructor || 'Dharmendra Kumar (DK Sir)',
      status: course.status || 'Published'
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setIsSavingEdit(true);
    try {
      const numPrice = parseInt(editForm.price.replace(/\D/g, '') || '0', 10);
      const numOrig = parseInt(editForm.originalPrice.replace(/\D/g, '') || '0', 10);

      const updates: Partial<Course> = {
        title: editForm.title.trim(),
        category: editForm.category.trim(),
        targetClass: editForm.targetClass.trim(),
        targetYear: editForm.targetYear.trim(),
        description: editForm.description.trim(),
        mode: editForm.mode,
        coverImage: editForm.coverImage.trim() || editingCourse.coverImage,
        demoVideoUrl: editForm.demoVideoUrl.trim(),
        badge: editForm.badge.trim(),
        tier: (numPrice === 0 ? 'Free' : editForm.tier) as any,
        price: numPrice === 0 ? '₹0 Free' : `₹${numPrice.toLocaleString('en-IN')}`,
        numericPrice: numPrice,
        originalPrice: numOrig > 0 ? `₹${numOrig.toLocaleString('en-IN')}` : undefined,
        instructor: editForm.instructor.trim(),
        status: editForm.status
      };

      await onUpdateCourse(editingCourse.id, updates);
      setEditingCourse(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCourse(courseToDelete.id);
      setCourseToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.targetExam && c.targetExam.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'ALL' || (c.category && c.category === selectedCategory);

      const matchesMode =
        selectedMode === 'ALL' || (c.mode && c.mode.includes(selectedMode));

      return matchesSearch && matchesCat && matchesMode;
    });
  }, [courses, searchQuery, selectedCategory, selectedMode]);

  // Pagination computations
  const totalItems = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCourses = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, safeCurrentPage, itemsPerPage]);

  const paidCount = courses.filter((c) => c.tier !== 'Free' && c.numericPrice !== 0).length;
  const freeCount = courses.filter((c) => c.tier === 'Free' || c.numericPrice === 0).length;

  return (
    <section className={styles.catalogWrapper} aria-label="Created Courses Directory">
      {/* ─── 1. Header & Summary Telemetry ─── */}
      <div className={styles.sectionHeader}>
        <div className={styles.titleArea}>
          <div className={styles.iconCircle}>
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className={styles.mainHeading}>Created Courses &amp; Batch Catalog</h2>
            <p className={styles.subHeading}>
              View, edit, manage, or delete published academic batches, video modules, and fee tiers.
            </p>
          </div>
        </div>

        <div className={styles.headerPillsGroup}>
          <span className={`${styles.countPill} ${styles.bluePill}`}>
            <Layers size={14} />
            <span>{courses.length} Total Batches</span>
          </span>
          <span className={`${styles.countPill} ${styles.emeraldPill}`}>
            <ShieldCheck size={14} />
            <span>{paidCount} Premium Programs</span>
          </span>
          {freeCount > 0 && (
            <span className={styles.countPill}>
              <Sparkles size={14} />
              <span>{freeCount} Free Demo Tracks</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── 2. Filter & Search Toolbar ─── */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search created courses by title, category, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Categories ▾</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Delivery Modes ▾</option>
            <option value="Live">Live Classroom</option>
            <option value="Recorded">Recorded Video Vault</option>
            <option value="Self-Paced">Self-Paced Hybrid</option>
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            onClick={onRefresh}
            className={styles.refreshBtn}
            disabled={isRefreshing}
            title="Reload courses"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─── 3. Cards Grid ─── */}
      {filteredCourses.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <BookOpen size={40} style={{ color: '#94A3B8' }} />
          <h3 className={styles.emptyTitle}>No Courses Found</h3>
          <p className={styles.emptySubtext}>
            {searchQuery || selectedCategory !== 'ALL' || selectedMode !== 'ALL'
              ? 'Try clearing your search query or changing category filters.'
              : 'You have not created any courses yet. Use the Course Builder Wizard above to publish your first batch.'}
          </p>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
          {paginatedCourses.map((course) => {
            const sectionsCount = course.curriculumSections?.length || 0;
            const lecturesCount =
              course.curriculumSections?.reduce(
                (acc, s) => acc + (s.lectures?.length || 0),
                0
              ) || 0;
            const isFree = course.tier === 'Free' || course.numericPrice === 0;

            const DEFAULT_COVER = '/img/dk-results-banner.jpeg';
            const cover =
              course.coverImage &&
              !course.coverImage.startsWith('blob:') &&
              course.coverImage.trim().length > 3
                ? course.coverImage
                : ((course as any).thumbnail || DEFAULT_COVER);

            const numPrice =
              course.numericPrice ||
              parseInt(String(course.price || '').replace(/\D/g, '') || '0', 10);
            const numOrig = parseInt(
              String(course.originalPrice || '').replace(/\D/g, '') || '0',
              10
            );
            const discountPct =
              numOrig > numPrice && numOrig > 0
                ? Math.round(((numOrig - numPrice) / numOrig) * 100)
                : 0;

            const isBestseller = Boolean(
              course.isPopular ||
              course.isBestValue ||
              course.badge?.toLowerCase().includes('popular') ||
              course.badge?.toLowerCase().includes('bestseller') ||
              course.badge?.toLowerCase().includes('flagship')
            );
            const rating = (course as any).rating || (isBestseller ? 4.8 : 4.6);
            const ratingCount =
              (course as any).ratingCount ||
              (course.enrolledCount ? Math.floor(course.enrolledCount / 3.4) : isBestseller ? 906 : 255);
            const instructorText = (course as any).instructor || 'DK Sir (18+ Yrs Kota) & Team';

            const isPopularCard =
              (course.tags && course.tags.some((t: string) => t.toLowerCase() === 'popular')) ||
              (course as any).isPopular ||
              course.badge?.toLowerCase() === 'popular';

            const deliveryTag =
              (course.tags &&
                course.tags.find((t: string) =>
                  ['test series', 'self-study dlp', 'live online', 'classroom', 'hybrid'].includes(
                    t.toLowerCase()
                  )
                )) ||
              (course.courseType === 'dlp'
                ? 'Self-Study DLP'
                : course.courseType === 'test-series'
                ? 'Test Series'
                : course.mode === 'Live'
                ? 'Live Online'
                : course.category || course.targetExam || 'JEE Main');

            return (
              <article key={course.id || (course as any)._id} className={styles.courseCard}>
                <div className={styles.cardTopContent}>
                  {/* Inset 16:9 Thumbnail Artwork */}
                  <div className={styles.thumbnailWrap}>
                    <img
                      src={cover}
                      alt={course.title}
                      className={styles.thumbnailImage}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.src.endsWith(DEFAULT_COVER)) {
                          img.src = DEFAULT_COVER;
                        }
                      }}
                    />
                    <div className={styles.thumbnailOverlay} />

                    <div className={styles.thumbnailTopBadges}>
                      <span className={styles.categoryBadge}>{deliveryTag}</span>
                      {isPopularCard ? (
                        <span className={styles.popularGoldBadge}>Popular</span>
                      ) : (
                        <span
                          className={`${styles.tierBadge} ${
                            isFree ? styles.tierBadgeFree : styles.tierBadgePaid
                          }`}
                        >
                          {isFree ? 'Free Demo' : 'Paid Batch'}
                        </span>
                      )}
                    </div>

                    <div className={styles.thumbnailBottomBadges}>
                      <span className={styles.modeBadge}>
                        <Video size={11} aria-hidden="true" />
                        <span>{course.mode || 'Online Live'}</span>
                      </span>
                      {course.badge && (
                        <span className={styles.tagBadge}>{course.badge}</span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className={styles.courseTitle} title={course.title}>
                    {course.title}
                  </h3>
                  <p className={styles.courseDescription}>
                    {course.description || 'Kota-pedagogy structured master course with daily DPPs, video solutions, and 1-on-1 doubt clearing.'}
                  </p>

                  {/* Instructor / Faculty Row */}
                  <div className={styles.facultyRow}>
                    <img
                      src="/img/dk-sir.jpg"
                      alt="DK Sir"
                      className={styles.facultyAvatar}
                    />
                    <span className={styles.facultyName}>{instructorText}</span>
                  </div>

                  {/* Badges, Rating & Boxed Meta Tags Row */}
                  <div className={styles.metaTagsRow}>
                    {isBestseller && (
                      <span className={styles.bestsellerBadge}>Bestseller</span>
                    )}

                    <div className={styles.ratingGroup}>
                      <Star size={12} className={styles.starIcon} aria-hidden="true" />
                      <span>{rating}</span>
                    </div>

                    <span className={styles.metaPill}>{ratingCount} ratings</span>
                    <span className={styles.metaPill}>{sectionsCount} modules</span>
                    <span className={styles.metaPill}>{lecturesCount} lectures</span>
                    <span className={styles.metaPill}>{course.targetClass || 'Class 11th'}</span>
                    {course.targetYear && (
                      <span className={styles.metaPill}>{course.targetYear}</span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Pricing & Actions */}
                <div className={styles.bottomRow}>
                  <div className={styles.pricingBlock}>
                    {isFree ? (
                      <span className={styles.freePriceTag}>
                        <Sparkles size={13} aria-hidden="true" />
                        <span>100% Free Demo</span>
                      </span>
                    ) : (
                      <div className={styles.priceContainer}>
                        <span className={styles.boldPrice}>
                          {course.price || `₹${(course.numericPrice || 0).toLocaleString('en-IN')}`}
                        </span>
                        {course.originalPrice && (
                          <span className={styles.originalPrice}>
                            {course.originalPrice}
                          </span>
                        )}
                        {discountPct > 0 && (
                          <span className={styles.discountPill}>
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.adminActions}>
                    <button
                      type="button"
                      onClick={() => openEditModal(course)}
                      className={styles.editBtn}
                      title="Quick edit course title, price, and category"
                      aria-label={`Edit ${course.title}`}
                    >
                      <Edit3 size={12} aria-hidden="true" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadIntoWizard(course)}
                      className={styles.wizardBtn}
                      title="Load entire course into builder wizard to edit chapters & lectures"
                      aria-label={`Open Builder Wizard for ${course.title}`}
                    >
                      <Wrench size={12} aria-hidden="true" />
                      <span>Wizard</span>
                    </button>

                    <a
                      href={`/courses/${course.slug || course.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionIconBtn}
                      title={`Preview public course page for ${course.title}`}
                      aria-label={`Preview public course page for ${course.title} in new tab`}
                    >
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setCourseToDelete(course)}
                      className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                      title={`Delete ${course.title} permanently`}
                      aria-label={`Delete ${course.title} permanently`}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ─── 3.5 Pagination Controls ─── */}
      {totalItems > 0 && (
        <div className={styles.paginationCard} aria-label="Course list pagination">
          <div className={styles.paginationInfo}>
            <span>
              Showing <strong>{(safeCurrentPage - 1) * itemsPerPage + 1}</strong>–
              <strong>{Math.min(safeCurrentPage * itemsPerPage, totalItems)}</strong> of{' '}
              <strong>{totalItems}</strong> courses
            </span>

            <div className={styles.pageSizeSelector}>
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Cards per page"
              >
                <option value={6}>6 per page</option>
                <option value={9}>9 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
              </select>
            </div>
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageArrowBtn}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`${styles.pageNumberBtn} ${
                    safeCurrentPage === pageNum ? styles.activePage : ''
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.pageArrowBtn}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. Quick Edit Course Modal ─── */}
      {editingCourse && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <Edit3 size={18} style={{ color: '#2563EB' }} />
                <h3 className={styles.modalTitle}>Edit Course Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Course Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGrid2Col}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Academic Category *</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className={styles.formSelect}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Class *</label>
                    <select
                      value={editForm.targetClass}
                      onChange={(e) => setEditForm({ ...editForm, targetClass: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Class 11th">Class 11th</option>
                      <option value="Class 12th">Class 12th</option>
                      <option value="Dropper">Dropper / Repeater</option>
                      <option value="Class 10th Foundation">Class 10th Foundation</option>
                      <option value="Pre-JEE">Pre-JEE (8th-10th)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2Col}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tuition Fee (₹ INR) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 78000 (0 for Free Demo)"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Original MRP (₹ INR Strikethrough)</label>
                    <input
                      type="number"
                      placeholder="e.g. 98000"
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2Col}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Delivery Mode</label>
                    <select
                      value={editForm.mode}
                      onChange={(e) => setEditForm({ ...editForm, mode: e.target.value as any })}
                      className={styles.formSelect}
                    >
                      <option value="Live">Live Classroom</option>
                      <option value="Live + Recorded">Live + Recorded Vault</option>
                      <option value="Structured Recorded">Structured Recorded</option>
                      <option value="Self-Paced">Self-Paced Hybrid</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Badge / Urgency Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Newly Launched, Flagship Batch"
                      value={editForm.badge}
                      onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cover Image URL</label>
                  <input
                    type="text"
                    placeholder="https://... or /img/classroom/..."
                    value={editForm.coverImage}
                    onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Course Demo Video Link (YouTube / MP4)</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or .mp4 video URL"
                    value={editForm.demoVideoUrl}
                    onChange={(e) => setEditForm({ ...editForm, demoVideoUrl: e.target.value })}
                    className={styles.formInput}
                  />
                  <small style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                    Plays inside the masterclass modal when students click "Demo".
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Course Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className={styles.saveBtn}
                >
                  <Check size={14} />
                  <span>{isSavingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. Delete Course Confirmation Dialog ─── */}
      {courseToDelete && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.deleteModalCard}>
            <div className={styles.deleteWarningBox}>
              <div className={styles.deleteIconCircle}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className={styles.deleteTitle}>Delete Course?</h3>
                <p className={styles.deleteDesc}>
                  Are you sure you want to delete{' '}
                  <span className={styles.deleteTargetName}>"{courseToDelete.title}"</span>?
                  This action will remove the course curriculum, videos, and batch enrollment from the platform.
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className={styles.cancelBtn}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={styles.confirmDeleteBtn}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Course'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

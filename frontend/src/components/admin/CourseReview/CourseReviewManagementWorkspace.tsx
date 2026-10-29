import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Eye,
  EyeOff,
  Radio,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Check,
  X,
  User,
  ShieldCheck,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import styles from './CourseReviewManagementWorkspace.module.scss';
import { apiClient } from '../../../services/apiClient';
import { soundEffects } from '../../../utils/sound';

export interface IDoubtAnswer {
  adminId: string;
  adminName: string;
  answerText: string;
  attachmentUrl?: string;
  answeredAt: string;
}

export interface IDoubt {
  _id: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId: string;
  courseTitle: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'General';
  chapter?: string;
  topic?: string;
  question: string;
  questionImage?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ANSWERED' | 'REJECTED';
  answer?: IDoubtAnswer;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminReply {
  adminId: string;
  adminName: string;
  content: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  rating: number;
  title: string;
  content: string;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN' | 'FLAGGED';
  isVerifiedPurchase: boolean;
  adminReply?: IAdminReply;
  createdAt: string;
  updatedAt: string;
}

export const CourseReviewManagementWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'reviews' | 'doubts'>(() => {
    if (urlTab === 'reviews' || urlTab === 'doubts') return urlTab;
    return 'doubts';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'doubts' || tab === 'reviews') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const switchTab = (tab: 'reviews' | 'doubts') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Reviews State
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [searchReview, setSearchReview] = useState('');
  const [filterReviewCourse, setFilterReviewCourse] = useState('ALL');
  const [filterReviewRating, setFilterReviewRating] = useState('ALL');
  const [filterReviewStatus, setFilterReviewStatus] = useState('ALL');

  // Doubts State
  const [doubts, setDoubts] = useState<IDoubt[]>([]);
  const [searchDoubt, setSearchDoubt] = useState('');
  const [filterDoubtSubject, setFilterDoubtSubject] = useState('ALL');
  const [filterDoubtStatus, setFilterDoubtStatus] = useState('ALL');
  const [filterDoubtPriority, setFilterDoubtPriority] = useState('ALL');

  // Doubt Answering Modal
  const [answeringDoubt, setAnsweringDoubt] = useState<IDoubt | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [adminName, setAdminName] = useState('DK Sir (Director)');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Review Reply Modal
  const [replyingReview, setReplyingReview] = useState<IReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Simulating/Adding Modals
  const [isNewDoubtModalOpen, setIsNewDoubtModalOpen] = useState(false);
  const [newDoubtForm, setNewDoubtForm] = useState({
    studentName: 'Kartik Singhania',
    studentEmail: 'kartik.jee2026@gmail.com',
    studentPhone: '+91 98100 44556',
    subject: 'Physics',
    courseId: 'jee-main-advanced-2yr-ultimate',
    courseTitle: 'JEE Main & Advanced 2-Year Ultimate Pinnacle',
    chapter: 'Electrodynamics',
    topic: 'Gauss Law on Non-Uniform Charged Sphere',
    question: 'How do we calculate electric flux through a hemispherical surface when a point charge is placed right at its curved rim?',
    priority: 'HIGH'
  });

  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    studentName: 'Harsh Vardhan',
    studentEmail: 'harsh.v@gmail.com',
    courseId: 'jee-main-advanced-2yr-ultimate',
    courseTitle: 'JEE Main & Advanced 2-Year Ultimate Pinnacle',
    rating: 5,
    title: 'Flawless doubt clearance and high-velocity problem solving',
    content: 'DK Sir explains tricky questions in 20 seconds. The live doubt solving mechanism and real-time alerts helped me maintain consistent test ranks.'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  // Fetch reviews from backend
  const fetchReviews = async () => {
    try {
      const res = await apiClient.get<IReview[]>('/reviews');
      if (res && res.data) {
        setReviews(res.data);
      }
    } catch (err) {
      console.warn('[Reviews] Fetch fallback:', err);
    }
  };

  // Fetch doubts from backend
  const fetchDoubts = async () => {
    try {
      const res = await apiClient.get<IDoubt[]>('/doubts');
      if (res && res.data) {
        setDoubts(res.data);
      }
    } catch (err) {
      console.warn('[Doubts] Fetch fallback:', err);
    }
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    await Promise.all([fetchReviews(), fetchDoubts()]);
    setIsSyncing(false);
    showToast('Database synchronized successfully!');
  };

  useEffect(() => {
    fetchReviews();
    fetchDoubts();

    // Listen for real-time WebSocket events from socketClient
    const handleRealtimeDoubtAnswered = (e: any) => {
      const updatedDoubt = e.detail;
      if (updatedDoubt) {
        setDoubts((prev) =>
          prev.map((d) => (d._id === updatedDoubt.doubtId || d._id === updatedDoubt._id ? { ...d, ...updatedDoubt, status: 'ANSWERED' } : d))
        );
        showToast(`⚡ Socket.IO Alert: Doubt answered by ${updatedDoubt.answeredBy || 'DK Sir'} & dispatched to ${updatedDoubt.studentEmail}!`);
      }
    };

    const handleRealtimeDoubtNew = (e: any) => {
      const newDoubt = e.detail;
      if (newDoubt) {
        setDoubts((prev) => [newDoubt, ...prev.filter((d) => d._id !== newDoubt._id)]);
        showToast(`❓ New Doubt Received from ${newDoubt.studentName} (${newDoubt.subject})`);
      }
    };

    const handleRealtimeReviewCreated = (e: any) => {
      const newRev = e.detail;
      if (newRev) {
        setReviews((prev) => [newRev, ...prev.filter((r) => r._id !== newRev._id)]);
        showToast(`⭐ New Review Received: ${newRev.studentName} (${newRev.rating}★)`);
      }
    };

    const handleRealtimeReviewUpdated = (e: any) => {
      const updatedRev = e.detail;
      if (updatedRev) {
        setReviews((prev) =>
          prev.map((r) => (r._id === updatedRev._id ? { ...r, ...updatedRev } : r))
        );
      }
    };

    const handleRealtimeReviewDeleted = (e: any) => {
      const delData = e.detail;
      if (delData?.id) {
        setReviews((prev) => prev.filter((r) => r._id !== delData.id));
      }
    };

    window.addEventListener('dk_doubt_answered', handleRealtimeDoubtAnswered);
    window.addEventListener('dk_doubt_new', handleRealtimeDoubtNew);
    window.addEventListener('dk_review_created', handleRealtimeReviewCreated);
    window.addEventListener('dk_review_updated', handleRealtimeReviewUpdated);
    window.addEventListener('dk_review_deleted', handleRealtimeReviewDeleted);

    return () => {
      window.removeEventListener('dk_doubt_answered', handleRealtimeDoubtAnswered);
      window.removeEventListener('dk_doubt_new', handleRealtimeDoubtNew);
      window.removeEventListener('dk_review_created', handleRealtimeReviewCreated);
      window.removeEventListener('dk_review_updated', handleRealtimeReviewUpdated);
      window.removeEventListener('dk_review_deleted', handleRealtimeReviewDeleted);
    };
  }, []);

  // Answer Doubt Handler
  const handleOpenAnswerModal = (doubt: IDoubt) => {
    setAnsweringDoubt(doubt);
    setAnswerText(doubt.answer?.answerText || '');
    setAdminName(doubt.answer?.adminName || 'DK Sir (Director)');
  };

  const handleCloseAnswerModal = () => {
    setAnsweringDoubt(null);
    setAnswerText('');
  };

  const handleSubmitAnswer = async () => {
    if (!answeringDoubt || !answerText.trim()) return;

    setIsSubmittingAnswer(true);
    try {
      const res = await apiClient.put(`/doubts/${answeringDoubt._id}/answer`, {
        answerText: answerText.trim(),
        adminName: adminName.trim()
      });

      if (res && res.success) {
        soundEffects.playNotificationChime();
        // Update local list
        setDoubts((prev) =>
          prev.map((d) => (d._id === answeringDoubt._id ? res.data : d))
        );
        showToast(`✅ Answer submitted! Direct Socket.IO message dispatched to ${answeringDoubt.studentName} (${answeringDoubt.studentEmail})`);
        handleCloseAnswerModal();
      } else {
        showToast(res?.message || 'Failed to submit answer');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error communicating with doubts endpoint');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Review Status Moderation Handler
  const handleUpdateReviewStatus = async (id: string, status: 'APPROVED' | 'HIDDEN' | 'FLAGGED') => {
    try {
      const res = await apiClient.put(`/reviews/${id}/status`, { status });
      if (res && res.success) {
        setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
        showToast(`Review status updated to: ${status}`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update review status');
    }
  };

  // Review Reply Handler
  const handleOpenReplyModal = (review: IReview) => {
    setReplyingReview(review);
    setReplyText(review.adminReply?.content || '');
  };

  const handleSubmitReply = async () => {
    if (!replyingReview || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await apiClient.post(`/reviews/${replyingReview._id}/reply`, {
        content: replyText.trim()
      });
      if (res && res.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === replyingReview._id ? res.data : r))
        );
        showToast('Admin reply published successfully!');
        setReplyingReview(null);
        setReplyText('');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save admin reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course review?')) return;
    try {
      const res = await apiClient.delete(`/reviews/${id}`);
      if (res && res.success) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
        showToast('Review removed.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete review');
    }
  };

  const handleDeleteDoubt = async (id: string) => {
    if (!window.confirm('Delete this doubt query?')) return;
    try {
      const res = await apiClient.delete(`/doubts/${id}`);
      if (res && res.success) {
        setDoubts((prev) => prev.filter((d) => d._id !== id));
        showToast('Doubt removed.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete doubt');
    }
  };

  // Create Sample Doubt (Simulating Student)
  const handleCreateSampleDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/doubts', newDoubtForm);
      if (res && res.success) {
        soundEffects.playAdminAlertChime();
        setDoubts((prev) => [res.data, ...prev]);
        setIsNewDoubtModalOpen(false);
        showToast(`❓ New student doubt raised! Socket.IO event doubt:new broadcasted.`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to create student doubt');
    }
  };

  // Create Sample Review
  const handleCreateSampleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/reviews', newReviewForm);
      if (res && res.success) {
        soundEffects.playNotificationChime();
        setReviews((prev) => [res.data, ...prev]);
        setIsNewReviewModalOpen(false);
        showToast(`⭐ Course review submitted and published!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to create course review');
    }
  };

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        !searchReview ||
        r.studentName.toLowerCase().includes(searchReview.toLowerCase()) ||
        r.title.toLowerCase().includes(searchReview.toLowerCase()) ||
        r.content.toLowerCase().includes(searchReview.toLowerCase()) ||
        r.courseTitle.toLowerCase().includes(searchReview.toLowerCase());

      const matchCourse = filterReviewCourse === 'ALL' || r.courseId === filterReviewCourse;
      const matchRating = filterReviewRating === 'ALL' || r.rating === Number(filterReviewRating);
      const matchStatus = filterReviewStatus === 'ALL' || r.status === filterReviewStatus;

      return matchSearch && matchCourse && matchRating && matchStatus;
    });
  }, [reviews, searchReview, filterReviewCourse, filterReviewRating, filterReviewStatus]);

  // Filtered Doubts
  const filteredDoubts = useMemo(() => {
    return doubts.filter((d) => {
      const matchSearch =
        !searchDoubt ||
        d.studentName.toLowerCase().includes(searchDoubt.toLowerCase()) ||
        d.question.toLowerCase().includes(searchDoubt.toLowerCase()) ||
        (d.chapter && d.chapter.toLowerCase().includes(searchDoubt.toLowerCase())) ||
        (d.topic && d.topic.toLowerCase().includes(searchDoubt.toLowerCase())) ||
        d.courseTitle.toLowerCase().includes(searchDoubt.toLowerCase());

      const matchSubject = filterDoubtSubject === 'ALL' || d.subject === filterDoubtSubject;
      const matchStatus = filterDoubtStatus === 'ALL' || d.status === filterDoubtStatus;
      const matchPriority = filterDoubtPriority === 'ALL' || d.priority === filterDoubtPriority;

      return matchSearch && matchSubject && matchStatus && matchPriority;
    });
  }, [doubts, searchDoubt, filterDoubtSubject, filterDoubtStatus, filterDoubtPriority]);

  // Metrics Calculations
  const averageRating = useMemo(() => {
    if (!reviews.length) return 5.0;
    const sum = reviews.reduce((acc, cur) => acc + cur.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const pendingDoubtsCount = useMemo(() => {
    return doubts.filter((d) => d.status === 'PENDING').length;
  }, [doubts]);

  const answeredDoubtsCount = useMemo(() => {
    return doubts.filter((d) => d.status === 'ANSWERED').length;
  }, [doubts]);

  return (
    <div className={styles.workspaceShell}>
      {/* Real-time Global Toast */}
      {toastMessage && (
        <div className={styles.toastBanner} role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. PAGE TITLE & TOP ACTION STRIP ─── */}
      <div className={styles.titleActionStrip}>
        <div className={styles.titleInfo}>
          <div className={styles.titleIconBox}>
            <Star size={24} className={styles.starHeaderIcon} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Course Reviews &amp; Academic Doubt Solver</h1>
            <p className={styles.pageSubtitle}>
              Live student ratings, moderation controls, and real-time interactive Doubt Solver with direct Socket.IO student notifications.
            </p>
          </div>
        </div>

        <div className={styles.topActionsGroup}>
          {activeTab === 'reviews' && (
            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={() => setIsNewReviewModalOpen(true)}
              title="Submit a student course review"
            >
              <Plus size={15} />
              <span>Add Course Review</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. KPI METRICS STRIP ─── */}
      <div className={styles.kpiGridStrip}>
        {/* Metric 1: Average Rating */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Average Rating</span>
            <div className={styles.kpiIconWrap} style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Star size={16} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{averageRating}</span>
            <span style={{ color: '#D97706', fontSize: '13px', fontWeight: 700 }}>★</span>
          </div>
          <span className={styles.kpiSubtext}>Across {reviews.length} total verified reviews</span>
        </div>

        {/* Metric 2: Total Reviews */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Course Reviews</span>
            <div className={styles.kpiIconWrap} style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <MessageSquare size={16} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{reviews.length}</span>
          </div>
          <span className={styles.kpiSubtext}>
            {reviews.filter((r) => r.status === 'APPROVED').length} published on course pages
          </span>
        </div>

        {/* Metric 3: Total Doubts */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Doubts In Roster</span>
            <div className={styles.kpiIconWrap} style={{ background: '#FAF5FF', color: '#7E22CE' }}>
              <HelpCircle size={16} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{doubts.length}</span>
          </div>
          <span className={styles.kpiSubtext}>JEE Physics, Chemistry, Math</span>
        </div>

        {/* Metric 4: Pending Doubts (Requires Answer) */}
        <div className={`${styles.kpiCard} ${pendingDoubtsCount > 0 ? styles.kpiCardWarning : ''}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Pending Doubts</span>
            <div className={styles.kpiIconWrap} style={{ background: '#FEF3C7', color: '#B45309' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{pendingDoubtsCount}</span>
            {pendingDoubtsCount > 0 && <span className={styles.pulseDotAmber} />}
          </div>
          <span className={styles.kpiSubtext} style={{ color: pendingDoubtsCount > 0 ? '#B45309' : '#94A3B8' }}>
            {pendingDoubtsCount > 0 ? 'Requires immediate faculty answer' : 'All doubts cleared'}
          </span>
        </div>

        {/* Metric 5: Resolved Doubts */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Resolved via Socket</span>
            <div className={styles.kpiIconWrap} style={{ background: '#ECFDF5', color: '#059669' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{answeredDoubtsCount}</span>
          </div>
          <span className={styles.kpiSubtext}>Direct student alerts dispatched</span>
        </div>
      </div>

      {/* ─── 3. SEGMENTED TABS (DOUBTS SOLVER VS COURSE REVIEWS) ─── */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'doubts' ? styles.tabBtnActive : ''}`}
          onClick={() => switchTab('doubts')}
        >
          <HelpCircle size={16} />
          <span>Student Doubts &amp; Q&amp;A Solver</span>
          <span className={`${styles.tabBadge} ${pendingDoubtsCount > 0 ? styles.tabBadgeAlert : ''}`}>
            {pendingDoubtsCount} Pending
          </span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
          onClick={() => switchTab('reviews')}
        >
          <Star size={16} />
          <span>Course Reviews &amp; Moderation</span>
          <span className={styles.tabBadge}>{reviews.length}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: STUDENT ACADEMIC DOUBTS & REAL-TIME SOLVER
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'doubts' && (
        <>
          {/* Doubt Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search doubt questions, concepts, students, topics..."
                value={searchDoubt}
                onChange={(e) => setSearchDoubt(e.target.value)}
              />
            </div>

            <div className={styles.filterControls}>
              {/* Subject Filter Pills */}
              <div className={styles.pillGroup}>
                {['ALL', 'Physics', 'Chemistry', 'Mathematics'].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    className={`${styles.pillBtn} ${filterDoubtSubject === sub ? styles.pillBtnActive : ''}`}
                    onClick={() => setFilterDoubtSubject(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Status Filter Dropdown */}
              <select
                className={styles.filterSelect}
                value={filterDoubtStatus}
                onChange={(e) => setFilterDoubtStatus(e.target.value)}
              >
                <option value="ALL">All Statuses ({doubts.length})</option>
                <option value="PENDING">Pending Answer ({pendingDoubtsCount})</option>
                <option value="ANSWERED">Answered ({answeredDoubtsCount})</option>
              </select>

              {/* Priority Filter */}
              <select
                className={styles.filterSelect}
                value={filterDoubtPriority}
                onChange={(e) => setFilterDoubtPriority(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Doubt Cards List */}
          <div className={styles.doubtListStack}>
            {filteredDoubts.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <HelpCircle size={40} />
                <h3>No Doubts Found</h3>
                <p>Try clearing your search or subject filters, or click "Ask Student Doubt" to simulate one.</p>
              </div>
            ) : (
              filteredDoubts.map((doubt) => {
                const isPending = doubt.status === 'PENDING';
                return (
                  <div
                    key={doubt._id}
                    className={`${styles.doubtCard} ${
                      isPending ? styles.doubtCardPending : styles.doubtCardAnswered
                    }`}
                  >
                    {/* Doubt Header */}
                    <div className={styles.doubtCardHeader}>
                      <div className={styles.studentMetaGroup}>
                        <div className={styles.studentAvatar}>
                          {doubt.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.studentNameCol}>
                          <div className={styles.studentNameRow}>
                            <span className={styles.studentName}>{doubt.studentName}</span>
                            <span
                              className={`${styles.priorityBadge} ${
                                doubt.priority === 'HIGH'
                                  ? styles.priorityHigh
                                  : doubt.priority === 'LOW'
                                  ? styles.priorityLow
                                  : styles.priorityMedium
                              }`}
                            >
                              {doubt.priority} PRIORITY
                            </span>
                          </div>
                          <div className={styles.studentDetails}>
                            <span>{doubt.studentEmail}</span>
                            <span>•</span>
                            <span>{doubt.courseTitle}</span>
                            <span>•</span>
                            <span>{new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Badges */}
                      <div className={styles.badgeStack}>
                        <span
                          className={`${styles.subjectBadge} ${
                            doubt.subject === 'Physics'
                              ? styles.badgePhysics
                              : doubt.subject === 'Chemistry'
                              ? styles.badgeChemistry
                              : doubt.subject === 'Mathematics'
                              ? styles.badgeMaths
                              : styles.badgeGeneral
                          }`}
                        >
                          {doubt.subject}
                        </span>

                        {isPending ? (
                          <span className={styles.statusPillPending}>
                            <span className={styles.pulseDotAmber} />
                            <span>Pending Faculty Answer</span>
                          </span>
                        ) : (
                          <span className={styles.statusPillAnswered}>
                            <CheckCircle2 size={13} />
                            <span>Answered &amp; Dispatched</span>
                          </span>
                        )}

                        <button
                          type="button"
                          className={styles.deleteDoubtBtn}
                          onClick={() => handleDeleteDoubt(doubt._id)}
                          title="Delete doubt"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Question Content Block */}
                    <div className={styles.questionBlock}>
                      <div className={styles.chapterTopicStrip}>
                        <BookOpen size={14} />
                        <span>Chapter: {doubt.chapter || 'General'}</span>
                        <span>•</span>
                        <span>Topic: {doubt.topic || 'Concept Doubt'}</span>
                      </div>
                      <p className={styles.questionText}>"{doubt.question}"</p>
                    </div>

                    {/* Answer Block (If Answered) */}
                    {doubt.answer && (
                      <div className={styles.answerBlock}>
                        <div className={styles.answerHeader}>
                          <div className={styles.answeredByTag}>
                            <ShieldCheck size={16} />
                            <span>Faculty Answer by {doubt.answer.adminName}</span>
                          </div>
                          <div className={styles.socketDeliveredBadge}>
                            <Radio size={13} />
                            <span>Delivered to Student via Socket.IO ✓</span>
                          </div>
                        </div>

                        <p className={styles.answerText}>{doubt.answer.answerText}</p>

                        <div className={styles.answerFooterRow}>
                          <span>
                            Answered on {new Date(doubt.answer.answeredAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            className={styles.editAnswerBtn}
                            onClick={() => handleOpenAnswerModal(doubt)}
                          >
                            <span>Edit Answer</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Row if Pending */}
                    {isPending && (
                      <div className={styles.doubtActionRow}>
                        <button
                          type="button"
                          className={styles.answerCTAButton}
                          onClick={() => handleOpenAnswerModal(doubt)}
                        >
                          <Send size={14} />
                          <span>Answer Doubt &amp; Send Real-Time Alert</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: COURSE REVIEWS & MODERATION
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <>
          {/* Review Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search reviews, student names, courses, keywords..."
                value={searchReview}
                onChange={(e) => setSearchReview(e.target.value)}
              />
            </div>

            <div className={styles.filterControls}>
              {/* Rating Filter */}
              <select
                className={styles.filterSelect}
                value={filterReviewRating}
                onChange={(e) => setFilterReviewRating(e.target.value)}
              >
                <option value="ALL">All Star Ratings</option>
                <option value="5">5 Stars ★★★★★</option>
                <option value="4">4 Stars ★★★★</option>
                <option value="3">3 Stars ★★★</option>
                <option value="2">2 Stars ★★</option>
                <option value="1">1 Star ★</option>
              </select>

              {/* Status Filter */}
              <select
                className={styles.filterSelect}
                value={filterReviewStatus}
                onChange={(e) => setFilterReviewStatus(e.target.value)}
              >
                <option value="ALL">All Moderation Status</option>
                <option value="APPROVED">Approved &amp; Live</option>
                <option value="PENDING">Pending Approval</option>
                <option value="HIDDEN">Hidden</option>
                <option value="FLAGGED">Flagged / Spam</option>
              </select>
            </div>
          </div>

          {/* Review Cards List */}
          <div className={styles.reviewsListStack}>
            {filteredReviews.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <Star size={40} />
                <h3>No Reviews Found</h3>
                <p>Try adjusting your search filters or click "Add Course Review".</p>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div key={rev._id} className={styles.reviewCard}>
                  <div className={styles.reviewCardHeader}>
                    <div className={styles.studentMetaGroup}>
                      <div className={styles.studentAvatar}>
                        {rev.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.studentNameCol}>
                        <div className={styles.studentNameRow}>
                          <span className={styles.studentName}>{rev.studentName}</span>
                          {rev.isVerifiedPurchase && (
                            <span
                              style={{
                                background: '#ECFDF5',
                                color: '#047857',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '6px'
                              }}
                            >
                              ✓ Verified Student
                            </span>
                          )}
                        </div>
                        <div className={styles.studentDetails}>
                          <span>{rev.studentEmail}</span>
                          <span>•</span>
                          <span>{rev.courseTitle}</span>
                          <span>•</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.badgeStack}>
                      <div className={styles.starsRow}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < rev.rating ? '#F59E0B' : 'none'}
                            color={i < rev.rating ? '#F59E0B' : '#CBD5E1'}
                          />
                        ))}
                      </div>

                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background:
                            rev.status === 'APPROVED'
                              ? '#ECFDF5'
                              : rev.status === 'PENDING'
                              ? '#FFFBEB'
                              : rev.status === 'FLAGGED'
                              ? '#FEF2F2'
                              : '#F1F5F9',
                          color:
                            rev.status === 'APPROVED'
                              ? '#047857'
                              : rev.status === 'PENDING'
                              ? '#B45309'
                              : rev.status === 'FLAGGED'
                              ? '#B91C1C'
                              : '#64748B'
                        }}
                      >
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  <h3 className={styles.reviewTitle}>{rev.title}</h3>
                  <p className={styles.reviewContent}>{rev.content}</p>

                  {/* Admin Reply Block */}
                  {rev.adminReply && (
                    <div className={styles.adminReplyBox}>
                      <div className={styles.adminReplyHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={15} />
                          <span>Admin Reply by {rev.adminReply.adminName}</span>
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#3B82F6' }}>
                          {new Date(rev.adminReply.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className={styles.adminReplyContent}>{rev.adminReply.content}</p>
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className={styles.reviewActionButtons}>
                    {rev.status !== 'APPROVED' && (
                      <button
                        type="button"
                        className={`${styles.actionBtnOutline} ${styles.actionBtnApprove}`}
                        onClick={() => handleUpdateReviewStatus(rev._id, 'APPROVED')}
                      >
                        <Check size={13} />
                        <span>Approve &amp; Show</span>
                      </button>
                    )}

                    {rev.status !== 'HIDDEN' && (
                      <button
                        type="button"
                        className={styles.actionBtnOutline}
                        onClick={() => handleUpdateReviewStatus(rev._id, 'HIDDEN')}
                      >
                        <EyeOff size={13} />
                        <span>Hide</span>
                      </button>
                    )}

                    {rev.status !== 'FLAGGED' && (
                      <button
                        type="button"
                        className={`${styles.actionBtnOutline} ${styles.actionBtnFlag}`}
                        onClick={() => handleUpdateReviewStatus(rev._id, 'FLAGGED')}
                      >
                        <AlertTriangle size={13} />
                        <span>Flag</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.actionBtnOutline}
                      onClick={() => handleOpenReplyModal(rev)}
                    >
                      <MessageSquare size={13} />
                      <span>{rev.adminReply ? 'Edit Reply' : 'Admin Reply'}</span>
                    </button>

                    <button
                      type="button"
                      className={styles.deleteDoubtBtn}
                      onClick={() => handleDeleteReview(rev._id)}
                      title="Delete review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: ANSWER DOUBT COMPOSER (DISPATCHES SOCKET.IO MESSAGE)
          ══════════════════════════════════════════════════════════════════ */}
      {answeringDoubt && (
        <div className={styles.modalOverlay} onClick={handleCloseAnswerModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalHeaderTitle}>Faculty Doubt Solver</h2>
                <p className={styles.modalHeaderSubtitle}>
                  Submitting will broadcast over Socket.IO to notify the student in real-time.
                </p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={handleCloseAnswerModal}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Question Preview */}
              <div className={styles.doubtQuestionPreviewBox}>
                <div className={styles.previewStudentStrip}>
                  <span>
                    Student: <strong>{answeringDoubt.studentName}</strong> ({answeringDoubt.studentEmail})
                  </span>
                  <span>
                    Subject: <strong>{answeringDoubt.subject}</strong> • {answeringDoubt.chapter || 'General'}
                  </span>
                </div>
                <p className={styles.previewQuestionText}>"{answeringDoubt.question}"</p>
              </div>

              {/* Quick Formula / Shortcut Templates */}
              <div className={styles.quickTemplatesWrap}>
                <span className={styles.quickTemplatesLabel}>Quick Shortcut Insert:</span>
                <div className={styles.quickChipsRow}>
                  <button
                    type="button"
                    className={styles.quickChip}
                    onClick={() =>
                      setAnswerText((prev) =>
                        prev +
                        (prev ? '\n\n' : '') +
                        'Apply King’s Rule: ∫[a to b] f(x)dx = ∫[a to b] f(a+b-x)dx. Adding equations eliminates the non-symmetric term in 15 seconds!'
                      )
                    }
                  >
                    + King's Property (Integration)
                  </button>
                  <button
                    type="button"
                    className={styles.quickChip}
                    onClick={() =>
                      setAnswerText((prev) =>
                        prev +
                        (prev ? '\n\n' : '') +
                        'Conserve Angular Momentum about the contact point: L_initial = L_final. Torque of friction is zero about instantaneous center!'
                      )
                    }
                  >
                    + Angular Momentum Conservation
                  </button>
                  <button
                    type="button"
                    className={styles.quickChip}
                    onClick={() =>
                      setAnswerText((prev) =>
                        prev +
                        (prev ? '\n\n' : '') +
                        'Spectrochemical Splitting: Strong field ligand CN- produces Δo > P (Pairing Energy), yielding a diamagnetic low-spin complex.'
                      )
                    }
                  >
                    + Crystal Field & Pairing Rule
                  </button>
                </div>
              </div>

              {/* Answering Faculty Name */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Answering Faculty / Admin</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. DK Sir (Director)"
                />
              </div>

              {/* Detailed Answer Textarea */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Detailed Answer &amp; Conceptual Explanation</label>
                <textarea
                  className={styles.formTextarea}
                  rows={6}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type clear step-by-step mathematical reasoning, shortcuts, and key formula references for the student..."
                />
              </div>

              {/* Live Socket.IO Broadcast Notice */}
              <div className={styles.socketNoticeBox}>
                <Radio size={16} />
                <span>
                  <strong>Socket.IO Live Delivery:</strong> Event <code>doubt:answered</code> will be emitted to <em>{answeringDoubt.studentEmail}</em> and show up in their student portal instantly.
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={handleCloseAnswerModal}
                disabled={isSubmittingAnswer}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitAnswerBtn}
                onClick={handleSubmitAnswer}
                disabled={isSubmittingAnswer || !answerText.trim()}
              >
                <Send size={15} />
                <span>{isSubmittingAnswer ? 'Broadcasting...' : '⚡ Submit Answer & Notify Student'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: ADMIN REPLY TO REVIEW
          ══════════════════════════════════════════════════════════════════ */}
      {replyingReview && (
        <div className={styles.modalOverlay} onClick={() => setReplyingReview(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalHeaderTitle}>Reply to Student Review</h2>
                <p className={styles.modalHeaderSubtitle}>
                  Reply to {replyingReview.studentName} on "{replyingReview.courseTitle}"
                </p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setReplyingReview(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.doubtQuestionPreviewBox}>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#334155' }}>
                  <strong>Review:</strong> "{replyingReview.content}"
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Admin Reply Content</label>
                <textarea
                  className={styles.formTextarea}
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the student for their feedback or share coaching encouragement..."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setReplyingReview(null)}
                disabled={isSubmittingReply}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryActionBtn}
                onClick={handleSubmitReply}
                disabled={isSubmittingReply || !replyText.trim()}
              >
                <Check size={15} />
                <span>{isSubmittingReply ? 'Saving...' : 'Publish Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: ASK STUDENT DOUBT (SIMULATION)
          ══════════════════════════════════════════════════════════════════ */}
      {isNewDoubtModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewDoubtModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalHeaderTitle}>Simulate Student Asking a Doubt</h2>
                <p className={styles.modalHeaderSubtitle}>
                  Test real-time Socket.IO doubt dispatch and answering flow
                </p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setIsNewDoubtModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSampleDoubt}>
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Student Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newDoubtForm.studentName}
                      onChange={(e) => setNewDoubtForm({ ...newDoubtForm, studentName: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Student Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={newDoubtForm.studentEmail}
                      onChange={(e) => setNewDoubtForm({ ...newDoubtForm, studentEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Subject</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newDoubtForm.subject}
                      onChange={(e) => setNewDoubtForm({ ...newDoubtForm, subject: e.target.value })}
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chapter</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newDoubtForm.chapter}
                      onChange={(e) => setNewDoubtForm({ ...newDoubtForm, chapter: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newDoubtForm.priority}
                      onChange={(e) => setNewDoubtForm({ ...newDoubtForm, priority: e.target.value })}
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Topic</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newDoubtForm.topic}
                    onChange={(e) => setNewDoubtForm({ ...newDoubtForm, topic: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Question Text</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={4}
                    value={newDoubtForm.question}
                    onChange={(e) => setNewDoubtForm({ ...newDoubtForm, question: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsNewDoubtModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryActionBtn}>
                  <Send size={15} />
                  <span>Submit Doubt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 4: ADD COURSE REVIEW
          ══════════════════════════════════════════════════════════════════ */}
      {isNewReviewModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewReviewModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalHeaderTitle}>Add Student Course Review</h2>
                <p className={styles.modalHeaderSubtitle}>
                  Publish authentic student feedback to course landing pages
                </p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setIsNewReviewModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSampleReview}>
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Student Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newReviewForm.studentName}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, studentName: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Student Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={newReviewForm.studentEmail}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, studentEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Course Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={newReviewForm.courseTitle}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, courseTitle: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Rating (1 - 5 Stars)</label>
                    <select
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                      value={newReviewForm.rating}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })}
                    >
                      <option value="5">5 Stars ★★★★★</option>
                      <option value="4">4 Stars ★★★★</option>
                      <option value="3">3 Stars ★★★</option>
                      <option value="2">2 Stars ★★</option>
                      <option value="1">1 Star ★</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Review Headline</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newReviewForm.title}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Review Content</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={4}
                    value={newReviewForm.content}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsNewReviewModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryActionBtn}>
                  <Star size={15} />
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReviewManagementWorkspace;

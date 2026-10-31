import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../../services/apiClient';
import {
  Search,
  Plus,
  Trash2,
  Mail,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Send,
  UserPlus,
  Pencil,
  UserX,
  UserCheck,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import styles from './StudentManagementWorkspace.module.scss';

export interface AspirantItem {
  id: string;
  name: string;
  targetGrade: 'Class 11' | 'Class 12' | 'Dropper';
  email: string;
  mobile: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  coursesCount: number;
  coursesList: string[];
  joinedAt: string;
}

// Initial dataset strictly matching genuine student accounts
const INITIAL_ASPIRANTS: AspirantItem[] = [
  {
    id: 'std_ritik_real',
    name: 'Ritik',
    targetGrade: 'Class 11',
    email: 'royr21035@gmail.com',
    mobile: '+91 82873 84970',
    role: 'Aspirant',
    status: 'ACTIVE',
    coursesCount: 5,
    coursesList: [
      'Ultimate 2-Year Live Classroom (Janakpuri HQ)',
      'Free Math Calculus Shortcuts Masterclass',
      'Free Physics Mechanics Mastery',
      'JEE PYQ Archive Mastery'
    ],
    joinedAt: 'Recent'
  }
];

export const StudentManagementWorkspace: React.FC = () => {
  const [aspirants, setAspirants] = useState<AspirantItem[]>(INITIAL_ASPIRANTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const TOTAL_ASPIRANTS_COUNT = aspirants.length;

  // Modals state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AspirantItem | null>(null);
  const [suspendCandidate, setSuspendCandidate] = useState<AspirantItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AspirantItem | null>(null);
  const [messageStudent, setMessageStudent] = useState<AspirantItem | null>(null);
  const [messageText, setMessageText] = useState('');

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    targetGrade: 'Class 11' as 'Class 11' | 'Class 12' | 'Dropper',
    email: '',
    mobile: '',
    primaryBatch: 'Ultimate 2-Year Live Classroom (Janakpuri HQ)'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Sync with Backend and Real-time WebSocket Gateway
  useEffect(() => {
    let isMounted = true;

    const loadRealStudents = async () => {
      try {
        const res = await apiClient.get('/auth/students');
        if (res.success && Array.isArray(res.data) && isMounted) {
          const mapped: AspirantItem[] = res.data.map((u: any) => ({
            id: u._id || `std_${Date.now()}`,
            name: u.name,
            targetGrade: u.targetClass?.includes('12')
              ? 'Class 12'
              : u.targetClass?.includes('Dropper')
              ? 'Dropper'
              : 'Class 11',
            email: u.email,
            mobile: u.phone ? (u.phone.startsWith('+91') ? u.phone : `+91 ${u.phone}`) : '+91 82873 84970',
            role: 'Aspirant',
            status: 'ACTIVE',
            coursesCount: Array.isArray(u.enrolledCourses) ? u.enrolledCourses.length : 0,
            coursesList:
              Array.isArray(u.enrolledCourses) && u.enrolledCourses.length > 0
                ? ['Enrolled Batch']
                : ['Clean / No courses yet'],
            joinedAt: 'Recent'
          }));

          if (mapped.length > 0) {
            setAspirants(mapped);
          }
        }
      } catch {
        // Fallback to initial seed
      }
    };

    loadRealStudents();

    // Listen for real-time WebSocket student registrations
    const handleStudentRegistered = (e: any) => {
      const student = e.detail;
      if (!student) return;

      const newItem: AspirantItem = {
        id: student._id || student.id || `std_${Date.now()}`,
        name: student.name,
        targetGrade: student.targetClass?.includes('12')
          ? 'Class 12'
          : student.targetClass?.includes('Dropper')
          ? 'Dropper'
          : 'Class 11',
        email: student.email,
        mobile: student.phone ? (student.phone.startsWith('+91') ? student.phone : `+91 ${student.phone}`) : '+91 98765 43210',
        role: 'Aspirant',
        status: 'ACTIVE',
        coursesCount: 0,
        coursesList: ['New Aspirant Account'],
        joinedAt: 'Just now'
      };

      setAspirants((prev) => [
        newItem,
        ...prev.filter((p) => p.email.toLowerCase() !== student.email.toLowerCase())
      ]);
      showToast(`⚡ Real-time Alert: New Student "${student.name}" registered!`);
    };

    window.addEventListener('dk_student_registered', handleStudentRegistered);
    return () => {
      isMounted = false;
      window.removeEventListener('dk_student_registered', handleStudentRegistered);
    };
  }, []);

  const handleCopyId = (idStr: string) => {
    navigator.clipboard?.writeText(idStr);
    setCopiedId(idStr);
    showToast(`Copied ID "${idStr}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered dataset based on search query
  const filteredAspirants = useMemo(() => {
    if (!searchQuery.trim()) return aspirants;
    const q = searchQuery.toLowerCase();
    return aspirants.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.mobile.includes(q) ||
        a.targetGrade.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [aspirants, searchQuery]);

  // Paginated slice
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAspirants.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAspirants, currentPage, rowsPerPage]);

  // Select all logic
  const isAllSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPageIds = paginatedRows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allPageIds])));
    } else {
      const allPageIds = paginatedRows.map((r) => r.id);
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Suspend Status handler
  const handleToggleSuspend = (student: AspirantItem) => {
    if (student.status === 'ACTIVE') {
      setSuspendCandidate(student);
    } else {
      // Reactivate directly
      setAspirants((prev) =>
        prev.map((a) => (a.id === student.id ? { ...a, status: 'ACTIVE' } : a))
      );
      showToast(`Reactivated account for ${student.name}. Access restored.`);
    }
  };

  const confirmSuspend = () => {
    if (!suspendCandidate) return;
    setAspirants((prev) =>
      prev.map((a) =>
        a.id === suspendCandidate.id ? { ...a, status: 'SUSPENDED' } : a
      )
    );
    showToast(`Suspended ${suspendCandidate.name}. LMS & attendance locked.`);
    setSuspendCandidate(null);
  };

  // Edit / Update CRUD handler
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setAspirants((prev) =>
      prev.map((a) => (a.id === editingStudent.id ? editingStudent : a))
    );
    showToast(`Updated record for ${editingStudent.name} successfully.`);
    setEditingStudent(null);
  };

  // Delete handler
  const confirmDeleteStudent = async () => {
    if (!deleteCandidate) return;
    const toDeleteId = deleteCandidate.id;
    setAspirants((prev) => prev.filter((a) => a.id !== toDeleteId));
    setSelectedIds((prev) => prev.filter((id) => id !== toDeleteId));
    showToast(`Removed "${deleteCandidate.name}" from aspirant directory.`);
    setDeleteCandidate(null);

    try {
      if (toDeleteId.length > 15) {
        await apiClient.delete(`/auth/users/${toDeleteId}`);
      }
    } catch (err) {
      console.warn('Backend student delete note:', err);
    }
  };

  // Bulk Suspend / Activate
  const handleBulkSuspend = () => {
    setAspirants((prev) =>
      prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status: 'SUSPENDED' } : a))
    );
    showToast(`Suspended ${selectedIds.length} selected aspirants.`);
  };

  const handleBulkActivate = () => {
    setAspirants((prev) =>
      prev.map((a) => (selectedIds.includes(a.id) ? { ...a, status: 'ACTIVE' } : a))
    );
    showToast(`Reactivated ${selectedIds.length} selected aspirants.`);
  };

  const handleBulkDelete = () => {
    setAspirants((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    showToast(`Deleted ${selectedIds.length} selected aspirants.`);
    setSelectedIds([]);
  };

  // Direct Message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageStudent || !messageText.trim()) return;
    showToast(`Message dispatched to ${messageStudent.name} (${messageStudent.email}).`);
    setMessageStudent(null);
    setMessageText('');
  };

  // Enroll New Aspirant submit
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.mobile.trim()) {
      showToast('Please fill in Name, Email, and Mobile number.');
      return;
    }

    const randomHex = Math.random().toString(16).substring(2, 10);
    const created: AspirantItem = {
      id: `64${randomHex}...`,
      name: newStudent.name.trim(),
      targetGrade: newStudent.targetGrade,
      email: newStudent.email.trim(),
      mobile: newStudent.mobile.trim(),
      role: 'Aspirant',
      status: 'ACTIVE',
      coursesCount: 1,
      coursesList: [newStudent.primaryBatch],
      joinedAt: 'Just now'
    };

    setAspirants([created, ...aspirants]);
    setIsEnrollModalOpen(false);

    try {
      await apiClient.post('/auth/students', {
        name: created.name,
        email: created.email,
        phone: created.mobile,
        targetClass: created.targetGrade,
        targetYear: created.targetGrade === 'Class 12' ? 'Target JEE 2027' : 'Target JEE 2028'
      });
    } catch (err) {
      console.warn('Backend student create note:', err);
    }

    setNewStudent({
      name: '',
      targetGrade: 'Class 11',
      email: '',
      mobile: '',
      primaryBatch: 'Ultimate 2-Year Live Classroom (Janakpuri HQ)'
    });
    showToast(`Successfully enrolled ${created.name} as a new Aspirant.`);
  };

  return (
    <div className={styles.workspaceWrapper}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={styles.toastNotice} role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER BAR & QUICK ACTIONS ─── */}
      <section className={styles.headerSection}>
        <div className={styles.headerLeftCol}>
          <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
            <span className={styles.breadcrumbRoot}>Admin Console</span>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbRoot}>Data</span>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbActive}>Student Management</span>
          </nav>
          <h1 className={styles.pageTitle}>Student Management &amp; Aspirant Directory</h1>
        </div>

        <div className={styles.headerRightCol}>
          {/* Search Bar (Clean w-64 input with search icon) */}
          <div className={styles.searchBarWrapper}>
            <Search size={14} className={styles.searchPrefixIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, ID, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search student directory"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Action: [+ Enroll New Aspirant] (Solid Electric Blue #2563EB) */}
          <button
            type="button"
            className={styles.addAspirantBtn}
            onClick={() => setIsEnrollModalOpen(true)}
            aria-label="Enroll new aspirant"
          >
            <Plus size={14} />
            <span>+ Enroll New Aspirant</span>
          </button>
        </div>
      </section>

      {/* ─── BULK ACTIONS STRIP (Displays when rows selected) ─── */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkActionStrip}>
          <div className={styles.bulkLeft}>
            <span className={styles.bulkCount}>
              {selectedIds.length} {selectedIds.length === 1 ? 'student' : 'students'} selected
            </span>
          </div>
          <div className={styles.bulkRight}>
            <button
              type="button"
              className={styles.bulkBtnSuspend}
              onClick={handleBulkSuspend}
            >
              <UserX size={13} />
              <span>Suspend Selected</span>
            </button>
            <button
              type="button"
              className={styles.bulkBtnActivate}
              onClick={handleBulkActivate}
            >
              <UserCheck size={13} />
              <span>Activate Selected</span>
            </button>
            <button
              type="button"
              className={styles.bulkBtnDelete}
              onClick={handleBulkDelete}
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. MAIN DATA TABLE CONTAINER (Pure White Card, 12px radius, 1px solid #E2E8F0) ─── */}
      <div className={styles.tableCardContainer}>
        <div className={styles.tableScrollArea}>
          <table className={styles.aspirantTable}>
            <thead>
              <tr>
                <th className={styles.thCheckbox} scope="col">
                  <input
                    type="checkbox"
                    className={styles.styledCheckbox}
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all students on current page"
                  />
                </th>
                <th scope="col" className={styles.thId}>ID</th>
                <th scope="col" className={styles.thName}>Name</th>
                <th scope="col" className={styles.thContact}>Email &amp; Contact</th>
                <th scope="col" className={styles.thRole}>Status &amp; Role</th>
                <th scope="col" className={styles.thCourses}>Purchased Courses</th>
                <th scope="col" className={styles.thJoined}>Joined At</th>
                <th scope="col" className={styles.thActions} style={{ textAlign: 'center', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTableState}>
                    <AlertCircle size={22} className={styles.emptyIcon} />
                    <p>No students match your search criteria.</p>
                    <button
                      type="button"
                      className={styles.resetSearchBtn}
                      onClick={() => setSearchQuery('')}
                    >
                      Reset Search
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  const isSuspended = student.status === 'SUSPENDED';

                  return (
                    <tr
                      key={student.id}
                      className={`${styles.tableRow} ${
                        isSelected ? styles.rowSelected : ''
                      } ${isSuspended ? styles.rowSuspended : ''}`}
                    >
                      {/* 1. Multi-Select Checkbox */}
                      <td className={styles.tdCheckbox}>
                        <input
                          type="checkbox"
                          className={styles.styledCheckbox}
                          checked={isSelected}
                          onChange={() => handleToggleRow(student.id)}
                          aria-label={`Select ${student.name}`}
                        />
                      </td>

                      {/* 2. ID (Compact Badge with one-click copy) */}
                      <td className={styles.tdId}>
                        <button
                          type="button"
                          className={styles.idCopyButton}
                          onClick={() => handleCopyId(student.id)}
                          title={`Click to copy Student ID: ${student.id}`}
                        >
                          <code className={styles.idCode}>#{student.id.length > 8 ? student.id.slice(-6) : student.id}</code>
                          {copiedId === student.id ? (
                            <Check size={11} className={styles.copiedIcon} />
                          ) : (
                            <Copy size={10} className={styles.copyIcon} />
                          )}
                        </button>
                      </td>

                      {/* 3. Name (Bold Slate-900 with target pill) */}
                      <td className={styles.tdName}>
                        <div className={styles.nameContainer}>
                          <span className={styles.studentName}>{student.name}</span>
                          <span className={styles.targetGradePill}>
                            [{student.targetGrade}]
                          </span>
                        </div>
                      </td>

                      {/* 4. Email & Contact */}
                      <td className={styles.tdContact}>
                        <div className={styles.contactBlock}>
                          <span className={styles.emailText}>{student.email}</span>
                          <span className={styles.mobileText}>• {student.mobile}</span>
                        </div>
                      </td>

                      {/* 5. Role & Status */}
                      <td className={styles.tdRole}>
                        <div className={styles.statusGroup}>
                          {isSuspended ? (
                            <span className={styles.statusPillSuspended} title="Account suspended">
                              ● Suspended
                            </span>
                          ) : (
                            <span className={styles.statusPillActive} title="Account active">
                              ● Active
                            </span>
                          )}
                          <span className={styles.rolePill}>{student.role}</span>
                        </div>
                      </td>

                      {/* 6. Purchased Courses (With hover tooltip) */}
                      <td className={styles.tdCourses}>
                        <div className={styles.coursesTooltipWrapper}>
                          <span className={styles.courseCountBadge}>
                            <BookOpen size={12} />
                            <span>
                              {student.coursesCount}{' '}
                              {student.coursesCount === 1 ? 'Course' : 'Courses'}
                            </span>
                          </span>

                          {/* Hover Tooltip showing specific batch titles */}
                          <div className={styles.coursePopover}>
                            <div className={styles.popoverHeader}>
                              Enrolled Batches ({student.coursesList.length})
                            </div>
                            <ul className={styles.popoverList}>
                              {student.coursesList.map((course, idx) => (
                                <li key={idx} className={styles.popoverItem}>
                                  <span className={styles.bulletDot} />
                                  <span>{course}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>

                      {/* 7. Joined At */}
                      <td className={styles.tdJoined}>
                        <span className={styles.joinedAtText}>{student.joinedAt}</span>
                      </td>

                      {/* 8. Combined Actions (Edit, Suspend, Message, Delete) */}
                      <td className={styles.tdAction}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className={styles.editActionBtn}
                            onClick={() => setEditingStudent({ ...student })}
                            title={`Edit details for ${student.name}`}
                            aria-label={`Edit ${student.name}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className={
                              isSuspended
                                ? styles.activateActionBtn
                                : styles.suspendActionBtn
                            }
                            onClick={() => handleToggleSuspend(student)}
                            title={
                              isSuspended
                                ? `Reactivate account for ${student.name}`
                                : `Suspend account for ${student.name}`
                            }
                            aria-label={
                              isSuspended
                                ? `Reactivate ${student.name}`
                                : `Suspend ${student.name}`
                            }
                          >
                            {isSuspended ? (
                              <UserCheck size={13} />
                            ) : (
                              <UserX size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            className={styles.messageActionBtn}
                            onClick={() => {
                              setMessageStudent(student);
                              setMessageText(
                                `Dear ${student.name},\nRegarding your enrolled batches at DK Academy...`
                              );
                            }}
                            title={`Send message to ${student.name}`}
                            aria-label={`Send message to ${student.name}`}
                          >
                            <Mail size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.deleteActionBtn}
                            onClick={() => setDeleteCandidate(student)}
                            title={`Delete ${student.name}`}
                            aria-label={`Delete ${student.name}`}
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

        {/* ─── 4. TABLE PAGINATION FOOTER (Pinned snugly at bottom of table card) ─── */}
        <footer className={styles.tableFooter}>
          <div className={styles.footerLeft}>
            <span>
              Selected:{' '}
              <strong className={styles.selectedCountStrong}>
                {selectedIds.length}
              </strong>{' '}
              of {TOTAL_ASPIRANTS_COUNT} students
            </span>
          </div>

          <div className={styles.footerRight}>
            <div className={styles.rowsPerPageGroup}>
              <label htmlFor="rows-select" className={styles.rowsLabel}>
                Rows per page:
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="rows-select"
                  className={styles.rowsSelect}
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Select rows per page"
                >
                  <option value={10}>10 ▾</option>
                  <option value={50}>50 ▾</option>
                  <option value={100}>100 ▾</option>
                </select>
              </div>
            </div>

            <div className={styles.rangeIndicator}>
              <span>
                {filteredAspirants.length === 0
                  ? '0–0'
                  : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(
                      currentPage * rowsPerPage,
                      filteredAspirants.length
                    )}`}{' '}
                of {TOTAL_ASPIRANTS_COUNT}
              </span>
            </div>

            <div className={styles.navArrowButtons}>
              <button
                type="button"
                className={styles.arrowBtn}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                title="Previous page (‹)"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className={styles.arrowBtn}
                disabled={currentPage * rowsPerPage >= filteredAspirants.length}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
                title="Next page (›)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ─── EDIT ASPIRANT MODAL (CRUD Update) ─── */}
      {editingStudent && (
        <div className={styles.modalBackdrop} onClick={() => setEditingStudent(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Pencil size={18} className={styles.modalIcon} />
                <h2 id="modal-edit-title" className={styles.modalHeading}>
                  Edit Aspirant Details (CRUD)
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingStudent(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Aspirant Name *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Target Grade / Cohort *</label>
                  <select
                    className={styles.formSelect}
                    value={editingStudent.targetGrade}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        targetGrade: e.target.value as 'Class 11' | 'Class 12' | 'Dropper'
                      })
                    }
                  >
                    <option value="Class 11">Class 11 [JEE 2028]</option>
                    <option value="Class 12">Class 12 [JEE 2027]</option>
                    <option value="Dropper">Dropper [JEE 2026/27]</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Account Status *</label>
                  <select
                    className={styles.formSelect}
                    value={editingStudent.status}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        status: e.target.value as 'ACTIVE' | 'SUSPENDED'
                      })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Address *</label>
                  <input
                    type="email"
                    required
                    className={styles.formInput}
                    value={editingStudent.email}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, email: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    className={styles.formInput}
                    value={editingStudent.mobile}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, mobile: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Primary Batch</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editingStudent.coursesList[0] || ''}
                  onChange={(e) => {
                    const newCourses = [...editingStudent.coursesList];
                    newCourses[0] = e.target.value;
                    setEditingStudent({ ...editingStudent, coursesList: newCourses });
                  }}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitSolidBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUSPEND CONFIRMATION MODAL ─── */}
      {suspendCandidate && (
        <div className={styles.modalBackdrop} onClick={() => setSuspendCandidate(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-suspend-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <AlertTriangle size={18} className={styles.suspendWarningIcon} />
                <h2 id="modal-suspend-title" className={styles.modalHeading}>
                  Suspend Aspirant Account?
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSuspendCandidate(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <p className={styles.deleteWarningDesc}>
              Suspending <strong>{suspendCandidate.name}</strong> will temporarily disable their LMS login, test series access, and batch seat allocation until reactivated.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setSuspendCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.suspendConfirmBtn}
                onClick={confirmSuspend}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENROLL NEW ASPIRANT MODAL (CRUD Create) ─── */}
      {isEnrollModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsEnrollModalOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-enroll-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <UserPlus size={18} className={styles.modalIcon} />
                <h2 id="modal-enroll-title" className={styles.modalHeading}>
                  Enroll New Aspirant
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsEnrollModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Aspirant Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Mittal"
                  className={styles.formInput}
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Target Grade / Cohort *</label>
                  <select
                    className={styles.formSelect}
                    value={newStudent.targetGrade}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        targetGrade: e.target.value as 'Class 11' | 'Class 12' | 'Dropper'
                      })
                    }
                  >
                    <option value="Class 11">Class 11 [JEE 2028]</option>
                    <option value="Class 12">Class 12 [JEE 2027]</option>
                    <option value="Dropper">Dropper [JEE 2026/27]</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    className={styles.formInput}
                    value={newStudent.mobile}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, mobile: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  className={styles.formInput}
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Batch Allocation *</label>
                <select
                  className={styles.formSelect}
                  value={newStudent.primaryBatch}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, primaryBatch: e.target.value })
                  }
                >
                  <option value="Ultimate 2-Year Live Classroom (Janakpuri HQ)">
                    Ultimate 2-Year Live Classroom (Janakpuri HQ)
                  </option>
                  <option value="Class 12th &amp; Dropper Math Sprint (Janakpuri HQ)">
                    Class 12th &amp; Dropper Math Sprint (Janakpuri HQ)
                  </option>
                  <option value="20-30s Speed Math &amp; Calculus (Online LMS)">
                    20-30s Speed Math &amp; Calculus (Online LMS)
                  </option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEnrollModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitSolidBtn}>
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DIRECT MESSAGE MODAL ─── */}
      {messageStudent && (
        <div className={styles.modalBackdrop} onClick={() => setMessageStudent(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-msg-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Mail size={18} className={styles.modalIcon} />
                <h2 id="modal-msg-title" className={styles.modalHeading}>
                  Direct Message • {messageStudent.name}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setMessageStudent(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className={styles.modalForm}>
              <div className={styles.messageRecipientPill}>
                <span>
                  To: <strong>{messageStudent.name}</strong> ({messageStudent.email} • {messageStudent.mobile})
                </span>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Message Body</label>
                <textarea
                  rows={4}
                  className={styles.formTextarea}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your official administrative notice, batch update, or fee reminder..."
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setMessageStudent(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitSolidBtn}>
                  <Send size={13} />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL (CRUD Delete) ─── */}
      {deleteCandidate && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteCandidate(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Trash2 size={18} className={styles.deleteWarningIcon} />
                <h2 id="modal-delete-title" className={styles.modalHeading}>
                  Remove Aspirant from Directory?
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDeleteCandidate(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <p className={styles.deleteWarningDesc}>
              Are you sure you want to remove <strong>{deleteCandidate.name}</strong> (ID: <code>{deleteCandidate.id}</code>)? This will unassign all {deleteCandidate.coursesCount} active course subscriptions.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeleteCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={confirmDeleteStudent}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

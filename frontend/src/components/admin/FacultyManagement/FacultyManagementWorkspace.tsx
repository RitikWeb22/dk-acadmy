import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../../services/apiClient';
import { generateTeacherId } from '../../../utils/uuid';
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
  AlertTriangle,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import styles from './FacultyManagementWorkspace.module.scss';

export interface FacultyItem {
  id: string;
  name: string;
  department: string;
  specialization: string;
  email: string;
  mobile: string;
  role: 'Super Admin' | 'Faculty' | 'Admin' | 'Lead HOD';
  status: 'ACTIVE' | 'SUSPENDED';
  batchesCount: number;
  batchesList: string[];
  joinedAt: string;
}

const INITIAL_FACULTY: FacultyItem[] = [
  {
    id: 'fac_dk_sir',
    name: 'Dharmendra Kumar (DK Sir)',
    department: 'Mathematics',
    specialization: 'Director & HOD Mathematics',
    email: 'director@dkacademy.com',
    mobile: '+91 93259 87875',
    role: 'Super Admin',
    status: 'ACTIVE',
    batchesCount: 3,
    batchesList: [
      'Ultimate 2-Year Live Classroom (Janakpuri HQ)',
      'Class 12th & Dropper Math Sprint',
      'JEE Advanced Rankers Batch'
    ],
    joinedAt: 'Jan 2012'
  },
  {
    id: 'adm_super_01',
    name: 'Ritik (Super Admin)',
    department: 'Directorate & Academic Council',
    specialization: 'Super Administrator & Founder',
    email: 'ritikweb30@gmail.com',
    mobile: '+91 82873 84970',
    role: 'Super Admin',
    status: 'ACTIVE',
    batchesCount: 4,
    batchesList: [
      'Ultimate 2-Year Live Classroom (Janakpuri HQ)',
      'All Online LMS & CBT Batches'
    ],
    joinedAt: 'Oct 2026'
  }
];

export const FacultyManagementWorkspace: React.FC = () => {
  const [facultyList, setFacultyList] = useState<FacultyItem[]>(INITIAL_FACULTY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const TOTAL_FACULTY_COUNT = facultyList.length;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [suspendCandidate, setSuspendCandidate] = useState<FacultyItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<FacultyItem | null>(null);
  const [messageStaff, setMessageStaff] = useState<FacultyItem | null>(null);
  const [messageText, setMessageText] = useState('');

  // New Faculty Form State
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    department: 'Mathematics',
    specialization: 'JEE Advanced Mentor',
    email: '',
    mobile: '',
    role: 'Faculty' as 'Super Admin' | 'Faculty' | 'Admin' | 'Lead HOD',
    primaryBatch: 'Ultimate 2-Year Live Classroom (Janakpuri HQ)'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleCopyId = (idStr: string) => {
    navigator.clipboard?.writeText(idStr);
    setCopiedId(idStr);
    showToast(`Copied ID "${idStr}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sync staff members from backend MongoDB
  useEffect(() => {
    let isMounted = true;
    const loadStaff = async () => {
      try {
        const res = await apiClient.get('/auth/staff');
        if (res.success && Array.isArray(res.data) && res.data.length > 0 && isMounted) {
          const mapped: FacultyItem[] = res.data.map((u: any) => ({
            id: u.teacherId || u._id || generateTeacherId(),
            name: u.name,
            department: u.role === 'SUPER_ADMIN' ? 'Administration' : 'Faculty Department',
            specialization: u.role === 'SUPER_ADMIN' ? 'Executive Director' : 'Academic Faculty',
            email: u.email,
            mobile: u.phone || '+91 98112 34567',
            role: (u.role === 'SUPER_ADMIN' ? 'Super Admin' : u.role === 'ADMIN' ? 'Admin' : 'Faculty') as any,
            status: 'ACTIVE',
            batchesCount: 2,
            batchesList: ['JEE Rankers Batch'],
            joinedAt: 'Recent'
          }));

          setFacultyList((prev) => {
            const existingEmails = new Set(prev.map((f) => f.email.toLowerCase()));
            const newOnes = mapped.filter((f) => !existingEmails.has(f.email.toLowerCase()));
            return [...newOnes, ...prev];
          });
        }
      } catch (err) {
        console.warn('[FacultyManagement] Staff sync note:', err);
      }
    };

    loadStaff();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered dataset based on search query
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return facultyList;
    const q = searchQuery.toLowerCase();
    return facultyList.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        f.mobile.includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.specialization.toLowerCase().includes(q) ||
        f.role.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q)
    );
  }, [facultyList, searchQuery]);

  // Paginated slice
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredFaculty.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredFaculty, currentPage, rowsPerPage]);

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
  const handleToggleSuspend = (faculty: FacultyItem) => {
    if (faculty.status === 'ACTIVE') {
      setSuspendCandidate(faculty);
    } else {
      // Reactivate directly
      setFacultyList((prev) =>
        prev.map((f) => (f.id === faculty.id ? { ...f, status: 'ACTIVE' } : f))
      );
      showToast(`Reactivated faculty access for ${faculty.name}.`);
    }
  };

  const confirmSuspend = () => {
    if (!suspendCandidate) return;
    setFacultyList((prev) =>
      prev.map((f) =>
        f.id === suspendCandidate.id ? { ...f, status: 'SUSPENDED' } : f
      )
    );
    showToast(`Suspended administrative privileges for ${suspendCandidate.name}.`);
    setSuspendCandidate(null);
  };

  // Edit / Update CRUD handler
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setFacultyList((prev) =>
      prev.map((f) => (f.id === editingFaculty.id ? editingFaculty : f))
    );
    showToast(`Updated record for ${editingFaculty.name} successfully.`);
    setEditingFaculty(null);
  };

  // Delete handler
  const confirmDeleteFaculty = async () => {
    if (!deleteCandidate) return;
    const toDeleteId = deleteCandidate.id;
    setFacultyList((prev) => prev.filter((f) => f.id !== toDeleteId));
    setSelectedIds((prev) => prev.filter((id) => id !== toDeleteId));
    showToast(`Removed "${deleteCandidate.name}" from faculty directory.`);
    setDeleteCandidate(null);

    try {
      if (toDeleteId.length > 15) {
        await apiClient.delete(`/auth/users/${toDeleteId}`);
      }
    } catch (err) {
      console.warn('Backend delete note:', err);
    }
  };

  // Bulk Suspend / Activate / Delete
  const handleBulkSuspend = () => {
    setFacultyList((prev) =>
      prev.map((f) => (selectedIds.includes(f.id) ? { ...f, status: 'SUSPENDED' } : f))
    );
    showToast(`Suspended ${selectedIds.length} selected staff members.`);
  };

  const handleBulkActivate = () => {
    setFacultyList((prev) =>
      prev.map((f) => (selectedIds.includes(f.id) ? { ...f, status: 'ACTIVE' } : f))
    );
    showToast(`Reactivated ${selectedIds.length} selected staff members.`);
  };

  const handleBulkDelete = () => {
    setFacultyList((prev) => prev.filter((f) => !selectedIds.includes(f.id)));
    showToast(`Deleted ${selectedIds.length} selected staff members.`);
    setSelectedIds([]);
  };

  // Direct Message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageStaff || !messageText.trim()) return;
    showToast(`Official communication sent to ${messageStaff.name} (${messageStaff.email}).`);
    setMessageStaff(null);
    setMessageText('');
  };

  // Add New Faculty submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name.trim() || !newFaculty.email.trim() || !newFaculty.mobile.trim()) {
      showToast('Please provide Name, Email, and Mobile number.');
      return;
    }

    const uniqueTeacherId = generateTeacherId();
    const created: FacultyItem = {
      id: uniqueTeacherId,
      name: newFaculty.name.trim(),
      department: newFaculty.department,
      specialization: newFaculty.specialization.trim(),
      email: newFaculty.email.trim(),
      mobile: newFaculty.mobile.trim(),
      role: newFaculty.role,
      status: 'ACTIVE',
      batchesCount: 1,
      batchesList: [newFaculty.primaryBatch],
      joinedAt: 'Just now'
    };

    setFacultyList([created, ...facultyList]);
    setIsAddModalOpen(false);

    try {
      await apiClient.post('/auth/staff', {
        name: created.name,
        email: created.email,
        phone: created.mobile,
        role: created.role === 'Super Admin' ? 'SUPER_ADMIN' : created.role === 'Admin' ? 'ADMIN' : 'TEACHER',
        department: created.department,
        specialization: created.specialization
      });
    } catch (err) {
      console.warn('Backend staff create note:', err);
    }

    setNewFaculty({
      name: '',
      department: 'Mathematics',
      specialization: 'JEE Advanced Mentor',
      email: '',
      mobile: '',
      role: 'Faculty',
      primaryBatch: 'Ultimate 2-Year Live Classroom (Janakpuri HQ)'
    });
    showToast(`Successfully onboarded ${created.name} into Faculty directory.`);
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
            <span className={styles.breadcrumbActive}>Teachers &amp; Admin</span>
          </nav>
          <h1 className={styles.pageTitle}>Teachers &amp; Administrative Directory</h1>
        </div>

        <div className={styles.headerRightCol}>
          {/* Search Bar (Clean w-64 input with search icon) */}
          <div className={styles.searchBarWrapper}>
            <Search size={14} className={styles.searchPrefixIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by faculty name, subject, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search faculty directory"
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

          {/* Action: [+ Add Faculty / Admin] (Solid Electric Blue #2563EB) */}
          <button
            type="button"
            className={styles.addAspirantBtn}
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add new faculty or admin"
          >
            <Plus size={14} />
            <span>+ Add Faculty / Admin</span>
          </button>
        </div>
      </section>

      {/* ─── BULK ACTIONS STRIP (Displays when rows selected) ─── */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkActionStrip}>
          <div className={styles.bulkLeft}>
            <span className={styles.bulkCount}>
              {selectedIds.length} {selectedIds.length === 1 ? 'member' : 'members'} selected
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
                    aria-label="Select all faculty on current page"
                  />
                </th>
                <th scope="col" className={styles.thId}>ID</th>
                <th scope="col" className={styles.thName}>Faculty Name &amp; Subject</th>
                <th scope="col" className={styles.thContact}>Email &amp; Contact</th>
                <th scope="col" className={styles.thRole}>Status &amp; Role</th>
                <th scope="col" className={styles.thCourses}>Assigned Batches</th>
                <th scope="col" className={styles.thJoined}>Joined At</th>
                <th scope="col" className={styles.thActions}>Edit</th>
                <th scope="col" className={styles.thActions}>Suspend</th>
                <th scope="col" className={styles.thActions}>Delete</th>
                <th scope="col" className={styles.thActions}>Direct Message</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className={styles.emptyTableState}>
                    <AlertCircle size={22} className={styles.emptyIcon} />
                    <p>No faculty members match your search criteria.</p>
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
                paginatedRows.map((faculty) => {
                  const isSelected = selectedIds.includes(faculty.id);
                  const isSuspended = faculty.status === 'SUSPENDED';

                  return (
                    <tr
                      key={faculty.id}
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
                          onChange={() => handleToggleRow(faculty.id)}
                          aria-label={`Select ${faculty.name}`}
                        />
                      </td>

                      {/* 2. ID (Monospace font with one-click copy) */}
                      <td className={styles.tdId}>
                        <button
                          type="button"
                          className={styles.idCopyButton}
                          onClick={() => handleCopyId(faculty.id)}
                          title="Click to copy Faculty ID"
                        >
                          <code className={styles.idCode}>{faculty.id}</code>
                          {copiedId === faculty.id ? (
                            <Check size={12} className={styles.copiedIcon} />
                          ) : (
                            <Copy size={11} className={styles.copyIcon} />
                          )}
                        </button>
                      </td>

                      {/* 3. Name (Bold Slate-900 with specialization pill) */}
                      <td className={styles.tdName}>
                        <div className={styles.nameContainer}>
                          <span className={styles.studentName}>{faculty.name}</span>
                          <span className={styles.targetGradePill}>
                            [{faculty.specialization}]
                          </span>
                        </div>
                      </td>

                      {/* 4. Email & Contact */}
                      <td className={styles.tdContact}>
                        <div className={styles.contactBlock}>
                          <span className={styles.emailText}>{faculty.email}</span>
                          <span className={styles.mobileText}>• {faculty.mobile}</span>
                        </div>
                      </td>

                      {/* 5. Role & Status */}
                      <td className={styles.tdRole}>
                        <div className={styles.statusGroup}>
                          {isSuspended ? (
                            <span className={styles.statusPillSuspended} title="Access suspended">
                              ● Suspended
                            </span>
                          ) : (
                            <span className={styles.statusPillActive} title="Active staff member">
                              ● Active
                            </span>
                          )}
                          <span className={styles.rolePill}>{faculty.role}</span>
                        </div>
                      </td>

                      {/* 6. Assigned Batches (With hover tooltip) */}
                      <td className={styles.tdCourses}>
                        <div className={styles.coursesTooltipWrapper}>
                          <span className={styles.courseCountBadge}>
                            <BookOpen size={12} />
                            <span>
                              {faculty.batchesCount}{' '}
                              {faculty.batchesCount === 1 ? 'Batch' : 'Batches'}
                            </span>
                          </span>

                          {/* Hover Tooltip showing specific batch titles */}
                          <div className={styles.coursePopover}>
                            <div className={styles.popoverHeader}>
                              Assigned Batches ({faculty.batchesList.length})
                            </div>
                            <ul className={styles.popoverList}>
                              {faculty.batchesList.map((batch, idx) => (
                                <li key={idx} className={styles.popoverItem}>
                                  <span className={styles.bulletDot} />
                                  <span>{batch}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>

                      {/* 7. Joined At */}
                      <td className={styles.tdJoined}>
                        <span className={styles.joinedAtText}>{faculty.joinedAt}</span>
                      </td>

                      {/* 8. Edit Action (CRUD Option) */}
                      <td className={styles.tdAction}>
                        <button
                          type="button"
                          className={styles.editActionBtn}
                          onClick={() => setEditingFaculty({ ...faculty })}
                          title={`Edit record for ${faculty.name}`}
                          aria-label={`Edit ${faculty.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>

                      {/* 9. Suspend / Activate Action */}
                      <td className={styles.tdAction}>
                        <button
                          type="button"
                          className={
                            isSuspended
                              ? styles.activateActionBtn
                              : styles.suspendActionBtn
                          }
                          onClick={() => handleToggleSuspend(faculty)}
                          title={
                            isSuspended
                              ? `Reactivate privileges for ${faculty.name}`
                              : `Suspend privileges for ${faculty.name}`
                          }
                          aria-label={
                            isSuspended
                              ? `Reactivate ${faculty.name}`
                              : `Suspend ${faculty.name}`
                          }
                        >
                          {isSuspended ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserX size={14} />
                          )}
                        </button>
                      </td>

                      {/* 10. Delete (Trash icon) */}
                      <td className={styles.tdAction}>
                        <button
                          type="button"
                          className={styles.deleteActionBtn}
                          onClick={() => setDeleteCandidate(faculty)}
                          title={`Delete ${faculty.name}`}
                          aria-label={`Delete ${faculty.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>

                      {/* 11. Email / Direct Message */}
                      <td className={styles.tdAction}>
                        <button
                          type="button"
                          className={styles.messageActionBtn}
                          onClick={() => {
                            setMessageStaff(faculty);
                            setMessageText(
                              `Dear ${faculty.name},\nRegarding your academic schedules and batch assignments at DK Academy...`
                            );
                          }}
                          title={`Send administrative notice to ${faculty.name}`}
                          aria-label={`Send message to ${faculty.name}`}
                        >
                          <Mail size={14} />
                        </button>
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
              of {TOTAL_FACULTY_COUNT} staff members
            </span>
          </div>

          <div className={styles.footerRight}>
            <div className={styles.rowsPerPageGroup}>
              <label htmlFor="rows-select-faculty" className={styles.rowsLabel}>
                Rows per page:
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="rows-select-faculty"
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
                {filteredFaculty.length === 0
                  ? '0–0'
                  : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(
                      currentPage * rowsPerPage,
                      filteredFaculty.length
                    )}`}{' '}
                of {TOTAL_FACULTY_COUNT}
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
                disabled={currentPage * rowsPerPage >= filteredFaculty.length}
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

      {/* ─── EDIT FACULTY MODAL (CRUD Update) ─── */}
      {editingFaculty && (
        <div className={styles.modalBackdrop} onClick={() => setEditingFaculty(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-faculty-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Pencil size={18} className={styles.modalIcon} />
                <h2 id="modal-edit-faculty-title" className={styles.modalHeading}>
                  Edit Faculty Details (CRUD)
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingFaculty(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Faculty / Staff Full Name *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={editingFaculty.name}
                  onChange={(e) =>
                    setEditingFaculty({ ...editingFaculty, name: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Department *</label>
                  <select
                    className={styles.formSelect}
                    value={editingFaculty.department}
                    onChange={(e) =>
                      setEditingFaculty({ ...editingFaculty, department: e.target.value })
                    }
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Operations">Operations</option>
                    <option value="IT Systems">IT Systems</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Specialization / Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={editingFaculty.specialization}
                    onChange={(e) =>
                      setEditingFaculty({
                        ...editingFaculty,
                        specialization: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>System Role *</label>
                  <select
                    className={styles.formSelect}
                    value={editingFaculty.role}
                    onChange={(e) =>
                      setEditingFaculty({
                        ...editingFaculty,
                        role: e.target.value as 'Super Admin' | 'Faculty' | 'Admin' | 'Lead HOD'
                      })
                    }
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Lead HOD">Lead HOD</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Account Status *</label>
                  <select
                    className={styles.formSelect}
                    value={editingFaculty.status}
                    onChange={(e) =>
                      setEditingFaculty({
                        ...editingFaculty,
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
                    value={editingFaculty.email}
                    onChange={(e) =>
                      setEditingFaculty({ ...editingFaculty, email: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    className={styles.formInput}
                    value={editingFaculty.mobile}
                    onChange={(e) =>
                      setEditingFaculty({ ...editingFaculty, mobile: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Primary Assigned Batch</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editingFaculty.batchesList[0] || ''}
                  onChange={(e) => {
                    const newBatches = [...editingFaculty.batchesList];
                    newBatches[0] = e.target.value;
                    setEditingFaculty({ ...editingFaculty, batchesList: newBatches });
                  }}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditingFaculty(null)}
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
            aria-labelledby="modal-suspend-fac-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <AlertTriangle size={18} className={styles.suspendWarningIcon} />
                <h2 id="modal-suspend-fac-title" className={styles.modalHeading}>
                  Suspend Staff Access?
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
              Suspending <strong>{suspendCandidate.name}</strong> ({suspendCandidate.role}) will temporarily revoke administrative console access, student test review abilities, and classroom schedule management.
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

      {/* ─── ADD FACULTY MODAL (CRUD Create) ─── */}
      {isAddModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsAddModalOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-faculty-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <UserPlus size={18} className={styles.modalIcon} />
                <h2 id="modal-add-faculty-title" className={styles.modalHeading}>
                  Onboard Faculty / Admin
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Faculty / Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. R.K. Verma"
                  className={styles.formInput}
                  value={newFaculty.name}
                  onChange={(e) =>
                    setNewFaculty({ ...newFaculty, name: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Department *</label>
                  <select
                    className={styles.formSelect}
                    value={newFaculty.department}
                    onChange={(e) =>
                      setNewFaculty({ ...newFaculty, department: e.target.value })
                    }
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Operations">Operations</option>
                    <option value="IT Systems">IT Systems</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Specialization / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanics HOD"
                    className={styles.formInput}
                    value={newFaculty.specialization}
                    onChange={(e) =>
                      setNewFaculty({ ...newFaculty, specialization: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formGridTwo}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>System Role *</label>
                  <select
                    className={styles.formSelect}
                    value={newFaculty.role}
                    onChange={(e) =>
                      setNewFaculty({
                        ...newFaculty,
                        role: e.target.value as 'Super Admin' | 'Faculty' | 'Admin' | 'Lead HOD'
                      })
                    }
                  >
                    <option value="Faculty">Faculty</option>
                    <option value="Lead HOD">Lead HOD</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    className={styles.formInput}
                    value={newFaculty.mobile}
                    onChange={(e) =>
                      setNewFaculty({ ...newFaculty, mobile: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="faculty@dkacademyjee.com"
                  className={styles.formInput}
                  value={newFaculty.email}
                  onChange={(e) =>
                    setNewFaculty({ ...newFaculty, email: e.target.value })
                  }
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Primary Batch Allocation *</label>
                <select
                  className={styles.formSelect}
                  value={newFaculty.primaryBatch}
                  onChange={(e) =>
                    setNewFaculty({ ...newFaculty, primaryBatch: e.target.value })
                  }
                >
                  <option value="Ultimate 2-Year Live Classroom (Janakpuri HQ)">
                    Ultimate 2-Year Live Classroom (Janakpuri HQ)
                  </option>
                  <option value="Class 12th &amp; Dropper Math Sprint">
                    Class 12th &amp; Dropper Math Sprint
                  </option>
                  <option value="JEE Advanced Concept Drill Batch">
                    JEE Advanced Concept Drill Batch
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
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitSolidBtn}>
                  Confirm Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DIRECT MESSAGE MODAL ─── */}
      {messageStaff && (
        <div className={styles.modalBackdrop} onClick={() => setMessageStaff(null)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-staff-msg-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Mail size={18} className={styles.modalIcon} />
                <h2 id="modal-staff-msg-title" className={styles.modalHeading}>
                  Send Communication • {messageStaff.name}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setMessageStaff(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className={styles.modalForm}>
              <div className={styles.messageRecipientPill}>
                <span>
                  To: <strong>{messageStaff.name}</strong> ({messageStaff.email} • {messageStaff.mobile})
                </span>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Message Body</label>
                <textarea
                  rows={4}
                  className={styles.formTextarea}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type official administrative circular, classroom timetable change, or doubt desk update..."
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setMessageStaff(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitSolidBtn}>
                  <Send size={13} />
                  <span>Send Communication</span>
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
            aria-labelledby="modal-del-fac-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Trash2 size={18} className={styles.deleteWarningIcon} />
                <h2 id="modal-del-fac-title" className={styles.modalHeading}>
                  Remove Faculty / Admin?
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
              Are you sure you want to remove <strong>{deleteCandidate.name}</strong> ({deleteCandidate.specialization})? This will unassign them from {deleteCandidate.batchesCount} active academic batches.
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
                onClick={confirmDeleteFaculty}
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

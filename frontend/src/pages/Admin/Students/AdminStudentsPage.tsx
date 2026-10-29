import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import styles from './AdminStudentsPage.module.scss';

interface StudentAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  targetExam?: string;
  targetClass?: string;
  targetYear?: string;
  enrolledCourseIds: string[];
  joinedDate: string;
  isActive?: boolean;
}

export const AdminStudentsPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshList = () => {
    const raw = adminService.getStudentAccounts();
    // Normalize active state
    setStudents(
      raw.map((s) => ({
        ...s,
        isActive: s.isActive !== false
      }))
    );
  };

  useEffect(() => {
    refreshList();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleStatus = (student: StudentAccount) => {
    const updatedStatus = !student.isActive;
    const raw = adminService.getStudentAccounts();
    const updated = raw.map((s) => (s.id === student.id ? { ...s, isActive: updatedStatus } : s));
    localStorage.setItem('dk_academy_user_accounts', JSON.stringify(updated));

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'STUDENT_STATUS_TOGGLED',
        module: 'Student Management',
        details: `${updatedStatus ? 'Activated' : 'Suspended'} student account: ${student.name} (${student.email})`,
        status: updatedStatus ? 'SUCCESS' : 'WARNING'
      });
    }

    refreshList();
    showToast(`Student ${student.name} is now ${updatedStatus ? 'Active' : 'Suspended'}.`);
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q));

    const matchesExam = examFilter === 'ALL' || (s.targetExam && s.targetExam.includes(examFilter));
    return matchesSearch && matchesExam;
  });

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Student Account Management</h1>
          <p className={styles.pageSubtitle}>
            Review registered student profiles, enrolled course batches, exam targets, and access permissions.
          </p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search students by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.examChips}>
          {['ALL', 'JEE Main', 'JEE Advanced', 'Foundation'].map((exam) => (
            <button
              key={exam}
              type="button"
              className={`${styles.chip} ${examFilter === exam ? styles.chipActive : ''}`}
              onClick={() => setExamFilter(exam)}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Target Exam &amp; Class</th>
                <th>Enrolled Courses</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatarMini}>{s.name.charAt(0)}</div>
                      <div className={styles.nameMeta}>
                        <strong>{s.name}</strong>
                        <div className={styles.subMeta}>
                          <span>
                            <Mail size={11} /> {s.email}
                          </span>
                          {s.phone && (
                            <span>
                              <Phone size={11} /> {s.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.examBadge}>
                      {s.targetExam || 'JEE Main & Advanced'}
                    </div>
                    <span className={styles.classText}>{s.targetClass || 'Class 11th'} ({s.targetYear || '2026'})</span>
                  </td>
                  <td>
                    <div className={styles.enrolledCell}>
                      <BookOpen size={13} color="#2563eb" />
                      <span>{s.enrolledCourseIds?.length || 1} Batch Enrolled</span>
                    </div>
                  </td>
                  <td className={styles.joinedCell}>
                    <Calendar size={12} />
                    <span>{s.joinedDate || 'May 2024'}</span>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${s.isActive ? styles.active : styles.suspended}`}
                    >
                      {s.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${s.isActive ? styles.btnSuspend : styles.btnActivate}`}
                      onClick={() => handleToggleStatus(s)}
                    >
                      {s.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    No student accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentsPage;

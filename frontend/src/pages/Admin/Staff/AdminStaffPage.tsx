import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Mail,
  Phone,
  Calendar,
  X,
  AlertCircle,
  KeyRound,
  Lock,
  Unlock,
  Key
} from 'lucide-react';
import { adminService, ROLE_DEFINITIONS } from '../../../services/adminService';
import { apiClient } from '../../../services/apiClient';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import type { AdminUser, AdminRole } from '../../../types/admin';
import styles from './AdminStaffPage.module.scss';

export const AdminStaffPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'COUNSELOR' as AdminRole,
    designation: '',
    department: 'Academic Support',
    phone: '',
    password: ''
  });

  const [passwordModalMember, setPasswordModalMember] = useState<AdminUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const refreshList = async () => {
    try {
      const res = await apiClient.get('/auth/staff');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: AdminUser[] = res.data.map((u: any) => ({
          id: u._id || u.teacherId || `staff_${Date.now()}`,
          name: u.name,
          email: u.email,
          role: u.role as AdminRole,
          designation: u.designation || (u.role === 'SUPER_ADMIN' ? 'Executive Director' : 'Academic Faculty'),
          department: u.department || 'Academic Department',
          phone: u.phone,
          avatarUrl: u.avatarUrl || '',
          isActive: u.isActive !== false,
          isLocked: Boolean(u.isLocked || (u.lockUntil && new Date(u.lockUntil).getTime() > Date.now())),
          failedLoginAttempts: u.failedLoginAttempts || 0,
          remainingLockMinutes: u.remainingLockMinutes || 0,
          permissions: ROLE_DEFINITIONS[u.role as AdminRole]?.defaultPermissions || [],
          lastLoginTimestamp: Date.now(),
          createdAt: u.createdAt ? new Date(u.createdAt).getTime() : Date.now()
        }));
        setStaff(mapped);
        return;
      }
    } catch {}

    setStaff(adminService.getStaffAccounts());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUnlockAccount = async (member: AdminUser) => {
    if (admin?.role !== 'SUPER_ADMIN') {
      alert('Only a Super Administrator has the privilege to unlock administrative accounts.');
      return;
    }

    try {
      const res = await adminService.unlockStaffAccount(member.id);
      if (res.success) {
        showToast(res.message || `Account for ${member.name} has been immediately unlocked.`);
        await refreshList();
      } else {
        alert(res.error || 'Failed to unlock staff account');
      }
    } catch {
      alert('Network error while unlocking account');
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalMember || !newPasswordValue.trim() || newPasswordValue.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await adminService.resetStaffPasswordByAdmin(passwordModalMember.id, newPasswordValue.trim());
      if (res.success) {
        showToast(res.message || `Password successfully updated and account unlocked for ${passwordModalMember.name}.`);
        setPasswordModalMember(null);
        setNewPasswordValue('');
        await refreshList();
      } else {
        alert(res.error || 'Failed to update password');
      }
    } catch {
      alert('Network error while updating password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleToggleStatus = (member: AdminUser) => {
    const res = adminService.toggleStaffStatus(member.id);
    if (!res.success) {
      alert(res.error || 'Failed to toggle account status');
      return;
    }

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'STAFF_STATUS_TOGGLED',
        module: 'Staff Access Control',
        details: `${!member.isActive ? 'Activated' : 'Suspended'} staff account: ${member.name} (${member.role})`,
        status: !member.isActive ? 'SUCCESS' : 'WARNING'
      });
    }

    refreshList();
    showToast(`Staff member ${member.name} is now ${!member.isActive ? 'Active' : 'Suspended'}.`);
  };

  const handleRoleChange = (member: AdminUser, newRole: AdminRole) => {
    if (admin?.role !== 'SUPER_ADMIN' && newRole === 'SUPER_ADMIN') {
      alert('Only a Super Administrator can assign Super Administrator privileges.');
      return;
    }

    const res = adminService.updateStaffRole(member.id, newRole);
    if (!res.success) {
      alert(res.error || 'Failed to update role');
      return;
    }

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'ROLE_UPDATED',
        module: 'Staff Access Control',
        details: `Updated role for ${member.name} from ${member.role} to ${newRole}`,
        status: 'SUCCESS'
      });
    }

    refreshList();
    showToast(`Role for ${member.name} updated to ${newRole}.`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    if (admin?.role !== 'SUPER_ADMIN' && form.role === 'SUPER_ADMIN') {
      alert('Only Super Administrators can create Super Administrator accounts.');
      return;
    }

    const created = adminService.createStaffAccount(form);

    if (admin) {
      adminService.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'STAFF_CREATED',
        module: 'Staff Access Control',
        details: `Provisioned new staff account: ${created.name} (${created.role})`,
        status: 'SUCCESS'
      });
    }

    refreshList();
    setIsModalOpen(false);
    showToast(`Staff account for ${created.name} provisioned successfully!`);
    setForm({
      name: '',
      email: '',
      role: 'COUNSELOR',
      designation: '',
      department: 'Academic Support',
      phone: '',
      password: ''
    });
  };

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Staff Accounts &amp; Permissions</h1>
          <p className={styles.pageSubtitle}>
            Provision administrative accounts, assign RBAC roles, grant module scopes, and enforce session security.
          </p>
        </div>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Provision Staff Member</span>
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search staff by name, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.roleChips}>
          {['ALL', 'SUPER_ADMIN', 'ADMIN', 'CMS_MANAGER', 'LEAD_MANAGER', 'COUNSELOR'].map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.chip} ${roleFilter === r ? styles.chipActive : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role &amp; Permissions</th>
                <th>Department</th>
                <th>Status</th>
                <th>Role Assignment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.staffInfo}>
                      <div className={styles.avatarMini}>{member.name.charAt(0)}</div>
                      <div className={styles.nameMeta}>
                        <strong>{member.name}</strong>
                        <span className={styles.designationText}>{member.designation}</span>
                        <div className={styles.subMeta}>
                          <span>
                            <Mail size={11} /> {member.email}
                          </span>
                          {member.phone && (
                            <span>
                              <Phone size={11} /> {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={styles.roleTag}
                      style={{ color: ROLE_DEFINITIONS[member.role]?.badgeColor || '#2563eb' }}
                    >
                      {ROLE_DEFINITIONS[member.role]?.label || member.role}
                    </span>
                    <span className={styles.permCount}>
                      {member.permissions?.length || 0} Permissions Granted
                    </span>
                  </td>
                  <td>
                    <span className={styles.deptText}>{member.department || 'Academic Support'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span
                        className={`${styles.statusBadge} ${member.isActive ? styles.active : styles.suspended}`}
                      >
                        {member.isActive ? 'Active' : 'Suspended'}
                      </span>
                      {member.isLocked && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5'
                          }}
                          title={`Account locked due to ${member.failedLoginAttempts || 5} failed login attempts`}
                        >
                          <Lock size={11} /> Locked (Attempts)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      className={styles.roleSelect}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as AdminRole)}
                      disabled={admin?.role !== 'SUPER_ADMIN' && member.role === 'SUPER_ADMIN'}
                    >
                      <option value="SUPER_ADMIN" disabled={admin?.role !== 'SUPER_ADMIN'}>
                        SUPER ADMIN
                      </option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="AUTHOR">AUTHOR / CURRICULUM</option>
                      <option value="TEACHER">TEACHER / FACULTY</option>
                      <option value="CMS_MANAGER">CMS MANAGER</option>
                      <option value="LEAD_MANAGER">LEAD MANAGER</option>
                      <option value="COUNSELOR">COUNSELOR</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {admin?.role === 'SUPER_ADMIN' && (
                        <>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: member.isLocked ? '#dc2626' : '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => handleUnlockAccount(member)}
                            title={`Unlock and reactivate ${member.name} immediately`}
                          >
                            <KeyRound size={12} />
                            <span>{member.isLocked ? 'Unlock Now' : 'Unlock'}</span>
                          </button>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setPasswordModalMember(member);
                              setNewPasswordValue('');
                            }}
                            title={`Reset password for ${member.name}`}
                          >
                            <Key size={12} />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${member.isActive ? styles.btnSuspend : styles.btnActivate}`}
                        onClick={() => handleToggleStatus(member)}
                      >
                        {member.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Staff Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Shield size={18} color="#2563eb" />
                <h3>Provision New Staff Member</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.formRow}>
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Meenakshi Sundaram"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Staff Email</label>
                  <input
                    type="email"
                    placeholder="name@dkacademy.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.formRow}>
                  <label>Role Assignment</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                  >
                    {admin?.role === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">SUPER ADMIN (Full Ownership)</option>
                    )}
                    <option value="ADMIN">ADMIN (Operations &amp; Student Management)</option>
                    <option value="AUTHOR">AUTHOR (Curriculum &amp; Test Series Creator)</option>
                    <option value="TEACHER">TEACHER (Faculty &amp; Video LMS)</option>
                    <option value="CMS_MANAGER">CMS MANAGER (Content &amp; Media Only)</option>
                    <option value="LEAD_MANAGER">LEAD MANAGER (Pipelines &amp; Assignment)</option>
                    <option value="COUNSELOR">COUNSELOR (Assigned Leads Only)</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label>Designation Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Academic Counselor"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Temporary Password</label>
                <input
                  type="text"
                  placeholder="Leave blank for default (e.g. counselor2026)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Quick Password Reset & Unlock Modal */}
      {passwordModalMember && (
        <div className={styles.modalBackdrop} onClick={() => setPasswordModalMember(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <KeyRound size={18} color="#2563eb" />
                <h3>Reset Password &amp; Unlock Account</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setPasswordModalMember(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className={styles.modalForm}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                  Member: <strong>{passwordModalMember.name}</strong> ({passwordModalMember.email})
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Role: <strong>{passwordModalMember.role}</strong> • Status: {passwordModalMember.isLocked ? 'Locked' : 'Active'}
                </p>
              </div>

              <div className={styles.formRow}>
                <label>New Password (min 6 characters) *</label>
                <input
                  type="text"
                  placeholder="e.g. DkSir@2026 or admin123"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  minLength={6}
                  required
                  autoFocus
                />
              </div>

              <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: '#16a34a' }}>
                ✓ Submitting will immediately clear any login lockout, reset failed attempts counter to 0, and activate this password instantly.
              </p>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setPasswordModalMember(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isResettingPassword}>
                  {isResettingPassword ? 'Updating...' : 'Set Password & Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;

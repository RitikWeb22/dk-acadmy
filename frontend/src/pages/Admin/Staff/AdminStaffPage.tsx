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
  AlertCircle
} from 'lucide-react';
import { adminService, ROLE_DEFINITIONS } from '../../../services/adminService';
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

  const refreshList = () => {
    setStaff(adminService.getStaffAccounts());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
                    <span
                      className={`${styles.statusBadge} ${member.isActive ? styles.active : styles.suspended}`}
                    >
                      {member.isActive ? 'Active' : 'Suspended'}
                    </span>
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
                      <option value="CMS_MANAGER">CMS MANAGER</option>
                      <option value="LEAD_MANAGER">LEAD MANAGER</option>
                      <option value="COUNSELOR">COUNSELOR</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${member.isActive ? styles.btnSuspend : styles.btnActivate}`}
                      onClick={() => handleToggleStatus(member)}
                    >
                      {member.isActive ? 'Suspend' : 'Activate'}
                    </button>
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
    </div>
  );
};

export default AdminStaffPage;

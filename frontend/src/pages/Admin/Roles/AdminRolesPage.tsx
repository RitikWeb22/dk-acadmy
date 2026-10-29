import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Check,
  X,
  Users,
  Info,
  Layers,
  Lock
} from 'lucide-react';
import { adminService, ROLE_DEFINITIONS } from '../../../services/adminService';
import type { AdminRole, PermissionId, RoleDefinition } from '../../../types/admin';
import styles from './AdminRolesPage.module.scss';

const ALL_PERMISSIONS: { id: PermissionId; label: string; category: string }[] = [
  { id: 'students.view', label: 'View student accounts & profiles', category: 'Students' },
  { id: 'students.manage', label: 'Suspend / activate student accounts', category: 'Students' },
  { id: 'staff.view', label: 'View internal staff rosters', category: 'Staff' },
  { id: 'staff.manage', label: 'Provision, assign roles & suspend staff', category: 'Staff' },
  { id: 'roles.manage', label: 'Manage RBAC permissions matrix', category: 'Staff' },
  { id: 'cms.pages.view', label: 'Preview draft & live website pages', category: 'CMS' },
  { id: 'cms.pages.edit', label: 'Edit hero copy, headlines & CTAs', category: 'CMS' },
  { id: 'cms.pages.publish', label: 'Publish live website content', category: 'CMS' },
  { id: 'cms.courses.manage', label: 'Edit course catalog, pricing & seats', category: 'CMS' },
  { id: 'cms.media.manage', label: 'Upload & manage media repository', category: 'CMS' },
  { id: 'cms.announcements.manage', label: 'Broadcast notices to students', category: 'CMS' },
  { id: 'leads.view_all', label: 'Access all incoming prospective leads', category: 'Leads' },
  { id: 'leads.view_assigned', label: 'Access only assigned counselor leads', category: 'Leads' },
  { id: 'leads.update', label: 'Update lead status & interaction notes', category: 'Leads' },
  { id: 'leads.assign', label: 'Assign leads to academic counselors', category: 'Leads' },
  { id: 'leads.contact', label: 'Execute 1-click WhatsApp & call outreach', category: 'Leads' },
  { id: 'reports.view', label: 'Access conversion & inquiry reports', category: 'Reports' },
  { id: 'settings.manage', label: 'Update center address & helpline desk', category: 'Settings' },
  { id: 'audit_logs.view', label: 'Inspect administrative audit log trail', category: 'Audit' }
];

export const AdminRolesPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<AdminRole>('SUPER_ADMIN');
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const staff = adminService.getStaffAccounts();
    const counts: Record<string, number> = {};
    staff.forEach((s) => {
      counts[s.role] = (counts[s.role] || 0) + 1;
    });
    setUserCounts(counts);
  }, []);

  const rolesList: RoleDefinition[] = [
    ROLE_DEFINITIONS.SUPER_ADMIN,
    ROLE_DEFINITIONS.ADMIN,
    ROLE_DEFINITIONS.CMS_MANAGER,
    ROLE_DEFINITIONS.LEAD_MANAGER,
    ROLE_DEFINITIONS.COUNSELOR
  ];

  const currentRoleDef = ROLE_DEFINITIONS[selectedRole];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Role &amp; Permission Architecture</h1>
          <p className={styles.pageSubtitle}>
            Discrete role hierarchies, granular permission scopes, and data ownership boundaries enforced across staff operations.
          </p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className={styles.rolesGrid}>
        {rolesList.map((r) => {
          const isSelected = selectedRole === r.role;
          const count = userCounts[r.role] || 0;

          return (
            <div
              key={r.role}
              className={`${styles.roleCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => setSelectedRole(r.role)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.roleCardHeader}>
                <span className={styles.roleTag} style={{ color: r.badgeColor }}>
                  {r.role.replace('_', ' ')}
                </span>
                <span className={styles.userBadge}>
                  <Users size={12} /> {count} Staff
                </span>
              </div>

              <h3 className={styles.roleTitle}>{r.label}</h3>
              <p className={styles.roleDesc}>{r.description}</p>

              <div className={styles.roleFooter}>
                <span>{r.defaultPermissions.length} Permissions Active</span>
                <span className={styles.inspectHint}>
                  {isSelected ? 'Viewing' : 'Inspect'} →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix Inspection Table */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixHeader}>
          <div className={styles.matrixTitleGroup}>
            <Shield size={20} color={currentRoleDef.badgeColor} />
            <div>
              <h3>Effective Permissions for: {currentRoleDef.label}</h3>
              <p>
                {selectedRole === 'COUNSELOR'
                  ? 'Strictly scoped: Counselors can ONLY view inquiries explicitly assigned to their name.'
                  : selectedRole === 'CMS_MANAGER'
                  ? 'Content scoped: CMS Managers cannot access student accounts, staff rosters, or lead databases.'
                  : currentRoleDef.description}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Permission Identifier</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((perm) => {
                const isGranted =
                  selectedRole === 'SUPER_ADMIN' ||
                  currentRoleDef.defaultPermissions.includes(perm.id);

                return (
                  <tr key={perm.id} className={isGranted ? styles.rowGranted : styles.rowDenied}>
                    <td className={styles.categoryCell}>{perm.category}</td>
                    <td>
                      <code className={styles.permCode}>{perm.id}</code>
                    </td>
                    <td className={styles.descCell}>{perm.label}</td>
                    <td>
                      {isGranted ? (
                        <span className={styles.grantedBadge}>
                          <Check size={12} /> Granted
                        </span>
                      ) : (
                        <span className={styles.deniedBadge}>
                          <X size={12} /> Denied
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRolesPage;

/**
 * DK Academy JEE - Admin & Management Portal Service
 * Handles admin authentication, RBAC authorization, audit logs, and core back-office state.
 */

import type {
  AdminUser,
  AdminSession,
  AdminAuditLog,
  AuditActionType,
  AdminRole,
  WebsiteBanner,
  CounselorMember,
  RoleDefinition
} from '../types/admin';
import { apiClient } from './apiClient';
import { generateStudentId } from '../utils/uuid';

const ADMIN_SESSION_KEY = 'dk_academy_admin_session_v1';
const ADMIN_ACCOUNTS_KEY = 'dk_academy_admin_accounts_v1';
const ADMIN_AUDIT_LOGS_KEY = 'dk_academy_admin_audit_logs_v1';
const BANNERS_KEY = 'dk_academy_admin_banners_v1';
const COUNSELORS_KEY = 'dk_academy_admin_counselors_v1';
const FAILED_ATTEMPTS_KEY = 'dk_academy_admin_failed_logins_v1';
const ACCOUNTS_STORAGE_KEY = 'dk_academy_user_accounts';

export const ROLE_DEFINITIONS: Record<AdminRole, RoleDefinition> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    label: 'Admin',
    description: 'Full system ownership, student management, staff controls, audit logs, and settings.',
    badgeColor: '#7c3aed',
    defaultPermissions: [
      'students.view',
      'students.manage',
      'staff.view',
      'staff.manage',
      'roles.manage',
      'cms.pages.view',
      'cms.pages.edit',
      'cms.pages.publish',
      'cms.courses.manage',
      'cms.media.manage',
      'cms.announcements.manage',
      'leads.view_all',
      'leads.view_assigned',
      'leads.update',
      'leads.assign',
      'leads.contact',
      'reports.view',
      'settings.manage',
      'audit_logs.view'
    ]
  },
  ADMIN: {
    role: 'ADMIN',
    label: 'Academic Operations Admin',
    description: 'Operational control of student accounts, staff rosters, CMS modules, and lead intake.',
    badgeColor: '#2563eb',
    defaultPermissions: [
      'students.view',
      'students.manage',
      'staff.view',
      'staff.manage',
      'cms.pages.view',
      'cms.pages.edit',
      'cms.pages.publish',
      'cms.courses.manage',
      'cms.media.manage',
      'cms.announcements.manage',
      'leads.view_all',
      'leads.update',
      'leads.assign',
      'leads.contact',
      'reports.view',
      'settings.manage'
    ]
  },
  CMS_MANAGER: {
    role: 'CMS_MANAGER',
    label: 'CMS & Content Manager',
    description: 'Exclusively manages website pages, announcement banners, course catalog details, and media library.',
    badgeColor: '#0284c7',
    defaultPermissions: [
      'cms.pages.view',
      'cms.pages.edit',
      'cms.pages.publish',
      'cms.courses.manage',
      'cms.media.manage',
      'cms.announcements.manage'
    ]
  },
  LEAD_MANAGER: {
    role: 'LEAD_MANAGER',
    label: 'Lead Pipeline Manager',
    description: 'Oversees prospective inquiries, time-slot scheduling, counselor assignment, and conversion metrics.',
    badgeColor: '#d97706',
    defaultPermissions: [
      'leads.view_all',
      'leads.update',
      'leads.assign',
      'leads.contact',
      'reports.view'
    ]
  },
  COUNSELOR: {
    role: 'COUNSELOR',
    label: 'Academic Counselor',
    description: 'Restricted strictly to personal assigned student leads, follow-up notes, and 1-click WhatsApp outreach.',
    badgeColor: '#059669',
    defaultPermissions: [
      'leads.view_assigned',
      'leads.update',
      'leads.contact'
    ]
  },
  TEACHER: {
    role: 'TEACHER',
    label: 'Teacher',
    description: 'Directly upload lecture videos, manage chapter curriculum, attach notes PDFs & DPPs, and track watch analytics.',
    badgeColor: '#0284c7',
    defaultPermissions: [
      'cms.courses.manage',
      'cms.media.manage',
      'reports.view'
    ]
  },
  STUDENT: {
    role: 'STUDENT',
    label: 'Enrolled Student',
    description: 'Student-facing access to lectures, DPPs, test series, and notifications.',
    badgeColor: '#64748b',
    defaultPermissions: []
  }
};

// Pre-seeded authorized staff accounts: Strictly ONLY Real Super Admin Ritik
const INITIAL_ADMIN_ACCOUNTS: (AdminUser & { passwordHash: string })[] = [
  {
    id: 'adm_super_01',
    name: 'Ritik (Super Admin)',
    email: 'ritikweb30@gmail.com',
    role: 'SUPER_ADMIN',
    designation: 'Super Administrator & Founder',
    department: 'Directorate & Academic Council',
    phone: '+91 98765 43210',
    avatarUrl: '/img/logo.jpeg',
    isActive: true,
    permissions: ROLE_DEFINITIONS.SUPER_ADMIN.defaultPermissions,
    lastLoginTimestamp: Date.now() - 1000 * 60 * 30,
    createdAt: Date.now() - 86400000 * 365,
    passwordHash: 'ritik@123'
  }
];

// Pre-seeded website banners
const INITIAL_BANNERS: WebsiteBanner[] = [
  {
    id: 'ban_01',
    title: 'Janakpuri Center Admissions Open',
    tagText: 'ADMISSIONS 2026-27',
    message: 'JEE 2026 & 2027 Comprehensive Offline + Online Batches starting May 28th. Early seat reservation closing soon.',
    linkText: 'Explore Batches',
    linkUrl: '/courses',
    isActive: true,
    priority: 1,
    type: 'announcement',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ban_02',
    title: 'DK Sir 20s Techniques Masterclass',
    tagText: 'FREE WORKSHOP',
    message: 'Special Problem Solving Masterclass with DK Sir on Calculus & Coordinate Geometry this Sunday 11 AM.',
    linkText: 'Register Free',
    linkUrl: '/free-lectures',
    isActive: true,
    priority: 2,
    type: 'orientation',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'ban_03',
    title: 'Merit Scholarship Test (DK-MST)',
    tagText: 'UP TO 90% SCHOLARSHIP',
    message: 'National Talent Hunt & Scholarship Examination for Class 10th to 12th moving students.',
    linkText: 'Take Scholarship Test',
    linkUrl: '/test-series',
    isActive: false,
    priority: 3,
    type: 'discount',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

// Pre-seeded counselors list
const INITIAL_COUNSELORS: CounselorMember[] = [
  {
    id: 'cns_01',
    name: 'Dharmendra Kumar (DK Sir)',
    email: 'director@dkacademy.com',
    phone: '+91 93259 87875',
    whatsAppNumber: '919325987875',
    designation: 'Founder & Senior Academic Mentor',
    specialization: 'Class 11-12 Advanced Math Strategy & Mentorship',
    activeLeadsCount: 14,
    isAvailable: true,
    rating: 4.95,
    joinedDate: 'Jan 2020'
  },
  {
    id: 'cns_02',
    name: 'Rajesh Verma',
    email: 'counselor@dkacademy.com',
    phone: '+91 98201 45678',
    whatsAppNumber: '919325987875',
    designation: 'Senior Admissions Counselor',
    specialization: 'Classroom & Hybrid Batch Admissions (Janakpuri)',
    activeLeadsCount: 22,
    isAvailable: true,
    rating: 4.88,
    joinedDate: 'Mar 2022'
  },
  {
    id: 'cns_03',
    name: 'Dr. Yashwant Kumar',
    email: 'admissions@dkacademy.com',
    phone: '+91 97171 59062',
    whatsAppNumber: '919717159062',
    designation: 'Academic Operations Head',
    specialization: 'DLP, Test Series & Dropper Academic Mapping',
    activeLeadsCount: 9,
    isAvailable: true,
    rating: 4.92,
    joinedDate: 'Aug 2021'
  },
  {
    id: 'cns_04',
    name: 'Priyanka Sharma',
    email: 'priyanka.counseling@dkacademy.com',
    phone: '+91 94123 56789',
    whatsAppNumber: '919325987875',
    designation: 'Foundation & Class 10th Counselor',
    specialization: 'Early Starter 2-Year Program & Parent Orientation',
    activeLeadsCount: 18,
    isAvailable: false,
    rating: 4.82,
    joinedDate: 'Nov 2023'
  }
];

// Pre-seeded initial audit logs
const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    adminId: 'adm_super_01',
    adminName: 'Dharmendra Kumar (DK Sir)',
    adminRole: 'SUPER_ADMIN',
    action: 'LOGIN_SUCCESS',
    module: 'Authentication',
    details: 'Authenticated via Admin Portal from official terminal',
    ipAddress: '192.168.1.10',
    status: 'SUCCESS'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    adminId: 'adm_super_01',
    adminName: 'Dharmendra Kumar (DK Sir)',
    adminRole: 'SUPER_ADMIN',
    action: 'LEAD_STATUS_UPDATED',
    module: 'Lead Pipeline',
    details: 'Updated lead DK-INQ-1081 status to "Contacted"',
    ipAddress: '192.168.1.10',
    status: 'SUCCESS'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    adminId: 'adm_ops_02',
    adminName: 'Dr. Yashwant Kumar',
    adminRole: 'ADMIN',
    action: 'BANNER_TOGGLED',
    module: 'Banners',
    details: 'Activated announcement banner "Janakpuri Center Admissions Open"',
    ipAddress: '192.168.1.14',
    status: 'SUCCESS'
  }
];

export const adminService = {
  /**
   * Initialize local storage if not already seeded
   */
  initStorage(): void {
    const rawAccounts = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (!rawAccounts) {
      localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(INITIAL_ADMIN_ACCOUNTS));
    } else {
      try {
        const parsed: any[] = JSON.parse(rawAccounts);
        const filtered = parsed.filter((a) => a.email !== 'teacher@dkacademy.com');
        const hasRitik = filtered.some((a) => a.email === 'ritikweb30@gmail.com');
        if (!hasRitik) {
          localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(INITIAL_ADMIN_ACCOUNTS));
          localStorage.removeItem(ADMIN_SESSION_KEY);
        } else {
          localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(filtered));
        }
      } catch {
        localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(INITIAL_ADMIN_ACCOUNTS));
      }
    }

    if (!localStorage.getItem(ADMIN_AUDIT_LOGS_KEY)) {
      localStorage.setItem(ADMIN_AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(BANNERS_KEY)) {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(INITIAL_BANNERS));
    }
    if (!localStorage.getItem(COUNSELORS_KEY)) {
      localStorage.setItem(COUNSELORS_KEY, JSON.stringify(INITIAL_COUNSELORS));
    }

    const currentSessionRaw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (currentSessionRaw) {
      try {
        const parsed = JSON.parse(currentSessionRaw);
        if (parsed.user?.email !== 'ritikweb30@gmail.com') {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
  },

  /**
   * Check rate-limiting / brute-force delay
   */
  checkRateLimit(email: string): { isLocked: boolean; remainingSeconds: number } {
    try {
      const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
      if (!raw) return { isLocked: false, remainingSeconds: 0 };
      const failedMap: Record<string, { count: number; lockUntil: number }> = JSON.parse(raw);
      const record = failedMap[email.toLowerCase().trim()];
      if (record && record.lockUntil > Date.now()) {
        const remainingSeconds = Math.ceil((record.lockUntil - Date.now()) / 1000);
        return { isLocked: true, remainingSeconds };
      }
      return { isLocked: false, remainingSeconds: 0 };
    } catch {
      return { isLocked: false, remainingSeconds: 0 };
    }
  },

  /**
   * Record a failed login attempt for rate-limiting
   */
  recordFailedAttempt(email: string): void {
    try {
      const key = email.toLowerCase().trim();
      const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
      const failedMap: Record<string, { count: number; lockUntil: number }> = raw ? JSON.parse(raw) : {};
      const record = failedMap[key] || { count: 0, lockUntil: 0 };
      record.count += 1;
      if (record.count >= 5) {
        record.lockUntil = Date.now() + 180 * 1000;
      }
      failedMap[key] = record;
      localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(failedMap));
    } catch {
      // ignore
    }
  },

  /**
   * Reset failed attempts on success
   */
  resetFailedAttempts(email: string): void {
    try {
      const key = email.toLowerCase().trim();
      const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
      if (!raw) return;
      const failedMap = JSON.parse(raw);
      delete failedMap[key];
      localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(failedMap));
    } catch {
      // ignore
    }
  },

  /**
   * Admin Login Authentication
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; session?: AdminSession; error?: string }> {
    this.initStorage();
    const cleanEmail = email.toLowerCase().trim();

    // Check rate limiting
    const { isLocked, remainingSeconds } = this.checkRateLimit(cleanEmail);
    if (isLocked) {
      this.logAudit({
        adminId: 'system',
        adminName: cleanEmail,
        adminRole: 'COUNSELOR',
        action: 'LOGIN_FAILED',
        module: 'Security Guard',
        details: `Login attempt blocked due to rate-limit lockout (${remainingSeconds}s remaining)`,
        status: 'WARNING'
      });
      return {
        success: false,
        error: `Too many failed attempts. Security lockout active. Please try again in ${remainingSeconds} seconds.`
      };
    }

    // Small simulated network verification delay
    await new Promise((r) => setTimeout(r, 400));

    // 1. Try Backend Admin Login API
    try {
      const backendRes = await apiClient.post('/auth/admin-login', {
        email: cleanEmail,
        password
      });

      if (backendRes.success && backendRes.data) {
        const u = backendRes.data.user;
        const permissions = ROLE_DEFINITIONS[u.role as AdminRole]?.defaultPermissions || [];
        const adminUser: AdminUser = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as AdminRole,
          designation:
            u.role === 'SUPER_ADMIN'
              ? 'Academic Director & Founder'
              : u.role === 'TEACHER'
              ? 'Senior Faculty & Academic Mentor'
              : 'Staff Admin',
          phone: u.phone || '+91 93259 87875',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          department: 'Academic Administration',
          isActive: true,
          permissions,
          lastLoginTimestamp: Date.now(),
          createdAt: Date.now() - 86400000 * 90
        };

        const session: AdminSession = {
          token: backendRes.data.token,
          user: adminUser,
          createdAt: Date.now(),
          expiresAt: Date.now() + 8 * 60 * 60 * 1000
        };

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        this.resetFailedAttempts(cleanEmail);
        this.logAudit({
          adminId: adminUser.id,
          adminName: adminUser.name,
          adminRole: adminUser.role,
          action: 'LOGIN_SUCCESS',
          module: 'Authentication',
          details: `Administrator logged in via API gateway`,
          status: 'SUCCESS'
        });

        return { success: true, session };
      }
    } catch {
      // Fallback seamlessly to local accounts
    }

    const accountsRaw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts: (AdminUser & { passwordHash: string })[] = accountsRaw
      ? JSON.parse(accountsRaw)
      : INITIAL_ADMIN_ACCOUNTS;

    const matched = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

    if (!matched || matched.passwordHash !== password) {
      this.recordFailedAttempt(cleanEmail);
      this.logAudit({
        adminId: matched ? matched.id : 'unknown',
        adminName: cleanEmail,
        adminRole: matched ? matched.role : 'COUNSELOR',
        action: 'LOGIN_FAILED',
        module: 'Authentication',
        details: `Failed authentication attempt for staff email: ${cleanEmail}`,
        status: 'FAILED'
      });

      return {
        success: false,
        error: 'Invalid administrator credentials. Access restricted to authorized personnel.'
      };
    }

    if (!matched.isActive) {
      return {
        success: false,
        error: 'This administrator account has been deactivated. Please contact the Academic Director.'
      };
    }

    this.resetFailedAttempts(cleanEmail);

    // Update lastLogin
    matched.lastLoginTimestamp = Date.now();
    const updatedAccounts = accounts.map((a) => (a.id === matched.id ? matched : a));
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

    const permissions = matched.permissions || ROLE_DEFINITIONS[matched.role]?.defaultPermissions || [];

    const userWithoutPassword: AdminUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      designation: matched.designation,
      phone: matched.phone,
      avatarUrl: matched.avatarUrl,
      department: matched.department,
      isActive: matched.isActive,
      permissions,
      lastLoginTimestamp: matched.lastLoginTimestamp,
      createdAt: matched.createdAt
    };

    const session: AdminSession = {
      token: `dka_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      user: userWithoutPassword,
      createdAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 hours
    };

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

    this.logAudit({
      adminId: matched.id,
      adminName: matched.name,
      adminRole: matched.role,
      action: 'LOGIN_SUCCESS',
      module: 'Authentication',
      details: `Successful sign-in to Staff Portal (${matched.role})`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      session
    };
  },

  /**
   * Get Active Admin Session
   */
  getCurrentSession(): AdminSession | null {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return null;
      const session: AdminSession = JSON.parse(raw);

      // Verify expiration
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  },

  /**
   * Terminate active admin session
   */
  logout(): void {
    const current = this.getCurrentSession();
    if (current) {
      this.logAudit({
        adminId: current.user.id,
        adminName: current.user.name,
        adminRole: current.user.role,
        action: 'LOGOUT',
        module: 'Authentication',
        details: 'Staff user logged out and session revoked',
        status: 'SUCCESS'
      });
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
  },

  /**
   * Log administrative audit event
   */
  logAudit(data: {
    adminId: string;
    adminName: string;
    adminRole: AdminRole;
    action: AuditActionType;
    module: string;
    details: string;
    status: 'SUCCESS' | 'WARNING' | 'FAILED';
  }): void {
    this.initStorage();
    try {
      const raw = localStorage.getItem(ADMIN_AUDIT_LOGS_KEY);
      const logs: AdminAuditLog[] = raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;

      const newLog: AdminAuditLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        adminId: data.adminId,
        adminName: data.adminName,
        adminRole: data.adminRole,
        action: data.action,
        module: data.module,
        details: data.details,
        ipAddress: '127.0.0.1 (Local Session)',
        status: data.status
      };

      const updated = [newLog, ...logs].slice(0, 300);
      localStorage.setItem(ADMIN_AUDIT_LOGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /**
   * Get all Audit Logs
   */
  getAuditLogs(): AdminAuditLog[] {
    this.initStorage();
    try {
      const raw = localStorage.getItem(ADMIN_AUDIT_LOGS_KEY);
      return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  /**
   * Staff Account Management
   */
  getStaffAccounts(): AdminUser[] {
    this.initStorage();
    try {
      const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
      const accounts: (AdminUser & { passwordHash?: string })[] = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;
      return accounts.map(({ passwordHash: _, ...user }) => ({
        ...user,
        permissions: user.permissions || ROLE_DEFINITIONS[user.role]?.defaultPermissions || []
      }));
    } catch {
      return [];
    }
  },

  createStaffAccount(data: {
    name: string;
    email: string;
    role: AdminRole;
    designation: string;
    department?: string;
    phone?: string;
    password?: string;
  }): AdminUser {
    this.initStorage();
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;

    const newAccount = {
      id: `staff_${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      role: data.role,
      designation: data.designation,
      department: data.department || 'Academic Support',
      phone: data.phone || '+91 93259 87875',
      isActive: true,
      permissions: ROLE_DEFINITIONS[data.role]?.defaultPermissions || [],
      createdAt: Date.now(),
      passwordHash: data.password || `${data.role.toLowerCase()}2026`
    };

    accounts.push(newAccount);
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
    return newAccount;
  },

  toggleStaffStatus(id: string): { success: boolean; error?: string } {
    this.initStorage();
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts: (AdminUser & { passwordHash: string })[] = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;

    const target = accounts.find((a) => a.id === id);
    if (!target) return { success: false, error: 'Staff account not found' };

    // Prevent deactivating the last active SUPER_ADMIN
    if (target.role === 'SUPER_ADMIN' && target.isActive) {
      const activeSuperAdmins = accounts.filter((a) => a.role === 'SUPER_ADMIN' && a.isActive);
      if (activeSuperAdmins.length <= 1) {
        return {
          success: false,
          error: 'Cannot deactivate the last active Super Administrator.'
        };
      }
    }

    target.isActive = !target.isActive;
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
    return { success: true };
  },

  updateStaffRole(id: string, newRole: AdminRole): { success: boolean; error?: string } {
    this.initStorage();
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts: (AdminUser & { passwordHash: string })[] = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;

    const target = accounts.find((a) => a.id === id);
    if (!target) return { success: false, error: 'Staff account not found' };

    // Prevent demoting the last active SUPER_ADMIN
    if (target.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
      const activeSuperAdmins = accounts.filter((a) => a.role === 'SUPER_ADMIN' && a.isActive);
      if (activeSuperAdmins.length <= 1) {
        return {
          success: false,
          error: 'Cannot change the role of the last active Super Administrator.'
        };
      }
    }

    target.role = newRole;
    target.permissions = ROLE_DEFINITIONS[newRole]?.defaultPermissions || [];
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
    return { success: true };
  },

  updateStaffAccount(id: string, updates: Partial<AdminUser> & { password?: string }): { success: boolean; error?: string } {
    this.initStorage();
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts: (AdminUser & { passwordHash: string })[] = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;

    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return { success: false, error: 'Staff account not found' };

    const existing = accounts[index];
    const passwordHash = updates.password ? updates.password : existing.passwordHash;

    accounts[index] = {
      ...existing,
      ...updates,
      passwordHash
    };

    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
    return { success: true };
  },

  updateStaffPermissions(id: string, permissions: any[]): { success: boolean; error?: string } {
    this.initStorage();
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts: (AdminUser & { passwordHash: string })[] = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;

    const target = accounts.find((a) => a.id === id);
    if (!target) return { success: false, error: 'Staff account not found' };

    target.permissions = permissions;
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
    return { success: true };
  },

  deleteStaffAccount(id: string): { success: boolean; error?: string } {
    this.initStorage();
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts: (AdminUser & { passwordHash: string })[] = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;

    const target = accounts.find((a) => a.id === id);
    if (!target) return { success: false, error: 'Staff account not found' };

    if (target.role === 'SUPER_ADMIN') {
      const activeSuperAdmins = accounts.filter((a) => a.role === 'SUPER_ADMIN');
      if (activeSuperAdmins.length <= 1) {
        return { success: false, error: 'Cannot delete the only Super Administrator account.' };
      }
    }

    const filtered = accounts.filter((a) => a.id !== id);
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(filtered));
    return { success: true };
  },

  /**
   * Student Accounts Inspection & Full CRUD Management
   */
  getStudentAccounts(): any[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts: any[] = raw ? JSON.parse(raw) : [];
      return accounts.filter((a) => {
        const em = (a.email || '').toLowerCase();
        return !em.includes('aarav') && !em.includes('tanya') && !em.includes('rohan.v') && !em.includes('test@');
      });
    } catch {
      return [];
    }
  },

  createStudentAccount(data: {
    name: string;
    email: string;
    phone?: string;
    targetExam?: string;
    targetClass?: string;
    targetYear?: string;
    enrolledCourseIds?: string[];
    password?: string;
  }): { success: boolean; student?: any; error?: string } {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = raw ? JSON.parse(raw) : [];

      const cleanEmail = data.email.toLowerCase().trim();
      if (accounts.some((a: any) => a.email && a.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'A student with this email address already exists.' };
      }

      const uniqueStudentId = generateStudentId();
      const newStudent = {
        id: uniqueStudentId,
        studentId: uniqueStudentId,
        name: data.name.trim(),
        email: cleanEmail,
        phone: data.phone || '',
        targetExam: data.targetExam || 'JEE Main & Advanced',
        targetClass: data.targetClass || 'Class 11th',
        targetYear: data.targetYear || '2028',
        enrolledCourseIds: data.enrolledCourseIds || ['jee-main-advanced-2yr-ultimate'],
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        createdAt: Date.now(),
        isActive: true,
        passwordHash: data.password || 'password123'
      };

      accounts.unshift(newStudent);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return { success: true, student: newStudent };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create student account' };
    }
  },

  updateStudentAccount(id: string, updates: any): { success: boolean; error?: string } {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = raw ? JSON.parse(raw) : [];
      const index = accounts.findIndex((a: any) => a.id === id);
      if (index === -1) return { success: false, error: 'Student not found' };

      accounts[index] = {
        ...accounts[index],
        ...updates
      };

      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update student account' };
    }
  },

  deleteStudentAccount(id: string): { success: boolean; error?: string } {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = raw ? JSON.parse(raw) : [];
      const filtered = accounts.filter((a: any) => a.id !== id);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete student account' };
    }
  },

  resetStudentPassword(id: string, newPassword: string): { success: boolean; error?: string } {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = raw ? JSON.parse(raw) : [];
      const target = accounts.find((a: any) => a.id === id);
      if (!target) return { success: false, error: 'Student not found' };

      target.passwordHash = newPassword;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reset password' };
    }
  },

  toggleStudentStatus(id: string): { success: boolean; isActive?: boolean; error?: string } {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = raw ? JSON.parse(raw) : [];
      const target = accounts.find((a: any) => a.id === id);
      if (!target) return { success: false, error: 'Student not found' };

      target.isActive = target.isActive === false ? true : false;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return { success: true, isActive: target.isActive };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to toggle status' };
    }
  },

  assignTeacherToStudent(studentId: string, teacherId: string, teacherName: string): { success: boolean; error?: string } {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const accounts = raw ? JSON.parse(raw) : [];
      const target = accounts.find((a: any) => a.id === studentId || a._id === studentId);
      if (!target) return { success: false, error: 'Student not found' };

      target.assignedTeacherId = teacherId;
      target.assignedTeacherName = teacherName;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to assign teacher' };
    }
  },


  /**
   * Get all Banners
   */
  getBanners(): WebsiteBanner[] {
    this.initStorage();
    try {
      const raw = localStorage.getItem(BANNERS_KEY);
      return raw ? JSON.parse(raw) : INITIAL_BANNERS;
    } catch {
      return INITIAL_BANNERS;
    }
  },

  saveBanner(banner: WebsiteBanner): void {
    const banners = this.getBanners();
    const existingIndex = banners.findIndex((b) => b.id === banner.id);
    let updated: WebsiteBanner[];
    if (existingIndex >= 0) {
      updated = [...banners];
      updated[existingIndex] = { ...banner, updatedAt: new Date().toISOString() };
    } else {
      updated = [banner, ...banners];
    }
    localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
  },

  deleteBanner(id: string): void {
    const banners = this.getBanners().filter((b) => b.id !== id);
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
  },

  /**
   * Get Counselors list
   */
  getCounselors(): CounselorMember[] {
    this.initStorage();
    try {
      const raw = localStorage.getItem(COUNSELORS_KEY);
      return raw ? JSON.parse(raw) : INITIAL_COUNSELORS;
    } catch {
      return INITIAL_COUNSELORS;
    }
  },

  toggleCounselorAvailability(id: string): void {
    const list = this.getCounselors().map((c) =>
      c.id === id ? { ...c, isAvailable: !c.isAvailable } : c
    );
    localStorage.setItem(COUNSELORS_KEY, JSON.stringify(list));
  }
};

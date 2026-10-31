import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AdminUser, AdminSession, AdminRole, AdminAuditLog, PermissionId } from '../types/admin';
import { adminService } from '../services/adminService';

interface AdminAuthContextType {
  admin: AdminUser | null;
  session: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAdminProfile: (updates: Partial<AdminUser>, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (roles: AdminRole | AdminRole[]) => boolean;
  hasPermission: (permissions: PermissionId | PermissionId[]) => boolean;
  auditLogs: AdminAuditLog[];
  refreshAuditLogs: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous session initialization ensures zero unauthenticated flash/redirection on page reload
  const [session, setSession] = useState<AdminSession | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      adminService.initStorage();
      return adminService.getCurrentSession();
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const refreshAuditLogs = useCallback(() => {
    setAuditLogs(adminService.getAuditLogs());
  }, []);

  // Sync session & audit logs on mount & listen to profile updates
  useEffect(() => {
    const existing = adminService.getCurrentSession();
    if (existing) {
      setSession(existing);
    } else {
      setSession(null);
    }
    refreshAuditLogs();
    setIsLoading(false);

    const handleProfileUpdated = (e: any) => {
      const updatedUser = e.detail;
      if (updatedUser) {
        setSession((prev) => (prev ? { ...prev, user: { ...prev.user, ...updatedUser } } : null));
      }
    };

    window.addEventListener('dk_admin_profile_updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('dk_admin_profile_updated', handleProfileUpdated);
    };
  }, [refreshAuditLogs]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await adminService.login(email, password);
      if (result.success && result.session) {
        setSession(result.session);
        refreshAuditLogs();
        return { success: true };
      }
      return { success: false, error: result.error || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    adminService.logout();
    setSession(null);
    refreshAuditLogs();
  }, [refreshAuditLogs]);

  const updateAdminProfile = useCallback(
    async (
      updates: Partial<AdminUser>,
      newPassword?: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const result = await adminService.updateCurrentAdminProfile(updates, newPassword);
        if (result.success && result.user) {
          setSession((prev) => (prev ? { ...prev, user: result.user! } : null));
          refreshAuditLogs();
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update profile' };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAuditLogs]
  );

  const hasRole = useCallback(
    (required: AdminRole | AdminRole[]): boolean => {
      if (!session?.user) return false;
      const userRole = session.user.role;
      if (Array.isArray(required)) {
        return required.includes(userRole);
      }
      return userRole === required;
    },
    [session]
  );

  const hasPermission = useCallback(
    (required: PermissionId | PermissionId[]): boolean => {
      if (!session?.user) return false;
      if (session.user.role === 'SUPER_ADMIN') return true;
      const userPermissions = session.user.permissions || [];
      if (Array.isArray(required)) {
        return required.some((perm) => userPermissions.includes(perm));
      }
      return userPermissions.includes(required);
    },
    [session]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        admin: session?.user || null,
        session,
        isAuthenticated: !!session?.user,
        isLoading,
        login,
        logout,
        updateAdminProfile,
        hasRole,
        hasPermission,
        auditLogs,
        refreshAuditLogs
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

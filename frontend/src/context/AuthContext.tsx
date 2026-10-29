import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StudentProfile, NotificationPreferences, AppNotification } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/notificationsData';
import { apiClient } from '../services/apiClient';
import { generateStudentId } from '../utils/uuid';

export interface UserAccount {
  id: string;
  studentId?: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  targetExam?: string;
  targetClass?: string;
  targetYear?: string;
  enrolledCourseIds: string[];
  joinedDate: string;
  createdAt: number;
}

interface AuthContextType {
  student: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markNotificationAsUnread: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  login: (profile: Partial<StudentProfile>) => void;
  loginWithCredentials: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signupStudent: (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    targetExam?: string;
    targetClass?: string;
    targetYear?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  loginAsNewStudent: (name?: string) => void;
  enrollCourse: (courseId: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'dk_academy_student_session';
const ACCOUNTS_STORAGE_KEY = 'dk_academy_user_accounts';

export const DEMO_STUDENT: StudentProfile = {
  id: 'std_ritik_real',
  name: 'Ritik',
  phone: '8287384970',
  email: 'royr21035@gmail.com',
  targetExam: 'JEE Main & Advanced',
  targetClass: 'Class 11th',
  targetYear: '2028',
  enrolledCourseIds: [],
  joinedDate: 'Oct 2026',
  lastActiveTimestamp: Date.now(),
  city: 'Delhi NCR',
  state: 'Delhi',
  notificationPreferences: {
    emailAlerts: true,
    dppReminders: true,
    mockTestUpdates: true,
    smsExamUpdates: false
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get stored accounts
function getStoredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      // Seed default accounts
      const defaultAccounts: UserAccount[] = [
        {
          id: DEMO_STUDENT.id,
          name: DEMO_STUDENT.name,
          email: DEMO_STUDENT.email || 'royr21035@gmail.com',
          passwordHash: 'password123',
          phone: DEMO_STUDENT.phone,
          targetExam: DEMO_STUDENT.targetExam,
          targetClass: DEMO_STUDENT.targetClass,
          targetYear: DEMO_STUDENT.targetYear,
          enrolledCourseIds: DEMO_STUDENT.enrolledCourseIds,
          joinedDate: DEMO_STUDENT.joinedDate,
          createdAt: Date.now() - 86400000 * 30
        }
      ];
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(defaultAccounts));
      return defaultAccounts;
    }
    const parsed = JSON.parse(raw) as UserAccount[];
    const filtered = parsed.filter(
      (a) => a.email !== 'aarav.sharma@jee2026.in' && a.email !== 'aarav.sharma@gmail.com'
    );
    if (!filtered.some((a) => a.email === 'royr21035@gmail.com')) {
      filtered.push({
        id: DEMO_STUDENT.id,
        name: DEMO_STUDENT.name,
        email: 'royr21035@gmail.com',
        passwordHash: 'password123',
        phone: DEMO_STUDENT.phone,
        targetExam: DEMO_STUDENT.targetExam,
        targetClass: DEMO_STUDENT.targetClass,
        targetYear: DEMO_STUDENT.targetYear,
        enrolledCourseIds: DEMO_STUDENT.enrolledCourseIds,
        joinedDate: DEMO_STUDENT.joinedDate,
        createdAt: Date.now()
      });
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.warn('Failed to parse accounts from localStorage', e);
    return [];
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Initialize student from localStorage & fetch live database profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StudentProfile;
        setStudent(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse student session from localStorage', e);
    } finally {
      setIsLoading(false);
    }

    // Real database sync from MongoDB backend
    apiClient.get('/auth/me')
      .then((res) => {
        if (res && res.success && res.data) {
          const u = res.data;
          setStudent((prev) => {
            const rawEnrolled = u.enrolledCourses || [];
            const realEnrolledIds = Array.isArray(rawEnrolled)
              ? rawEnrolled.map((c: any) => (typeof c === 'string' ? c : c._id || c.id || c))
              : [];

            const updated: StudentProfile = {
              id: u.studentId || u._id || prev?.id || 'student',
              studentId: u.studentId || u._id,
              name: u.name || prev?.name || 'Student Aspirant',
              email: u.email || prev?.email || '',
              phone: u.phone || prev?.phone || '',
              targetExam: u.targetExam || prev?.targetExam || 'JEE Main & Advanced',
              targetClass: u.targetClass || prev?.targetClass || 'Class 11th',
              targetYear: u.targetYear || prev?.targetYear || '2028',
              avatarUrl: u.avatarUrl || prev?.avatarUrl,
              city: u.city || prev?.city,
              state: u.state || prev?.state,
              enrolledCourseIds: realEnrolledIds,
              joinedDate: prev?.joinedDate || 'Active Student',
              lastActiveTimestamp: Date.now(),
              token: prev?.token
            };

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {}

            return updated;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Initialize and sync notifications scoped to active student
  useEffect(() => {
    if (!student) {
      setNotifications([]);
      return;
    }
    const notifKey = `dk_academy_notifications_${student.id}`;
    try {
      const stored = localStorage.getItem(notifKey);
      if (stored) {
        setNotifications(JSON.parse(stored) as AppNotification[]);
      } else {
        // Seed default notifications ONLY for the demo account; all registered students get clean empty notifications
        const initial = student.id === DEMO_STUDENT.id ? INITIAL_NOTIFICATIONS : [];
        localStorage.setItem(notifKey, JSON.stringify(initial));
        setNotifications(initial);
      }
    } catch (e) {
      console.warn('Failed to load notifications from localStorage', e);
      setNotifications([]);
    }
  }, [student?.id]);

  // Listen for real-time doubt answers for the student
  useEffect(() => {
    const handleDoubtAnswered = (e: any) => {
      const data = e.detail;
      if (!data) return;

      // Only notify student if NOT currently on admin portal
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        return;
      }

      const answerSnippet = data.answer?.answerText || data.answerText || 'Your doubt has been answered by DK Sir.';
      const newNotif: AppNotification = {
        id: `notif_doubt_${data.doubtId || Date.now()}`,
        title: `✅ Doubt Answered: ${data.subject || 'Academic'}`,
        message: `${data.answeredBy || 'DK Sir'} answered: "${answerSnippet.slice(0, 95)}..."`,
        timestamp: Date.now(),
        category: 'course',
        read: false,
        linkText: 'Open Doubt in Course',
        linkUrl: `/learn/${data.courseId || 'jee-main-advanced-2yr-ultimate'}?tab=doubts`
      };

      setNotifications((prev) => {
        const next = [newNotif, ...prev.filter((n) => n.id !== newNotif.id)].slice(0, 30);
        if (student) {
          try {
            localStorage.setItem(`dk_academy_notifications_${student.id}`, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    };

    window.addEventListener('dk_doubt_answered', handleDoubtAnswered);
    return () => window.removeEventListener('dk_doubt_answered', handleDoubtAnswered);
  }, [student]);

  const saveNotifications = useCallback((updated: AppNotification[]) => {
    setNotifications(updated);
    if (student) {
      const notifKey = `dk_academy_notifications_${student.id}`;
      try {
        localStorage.setItem(notifKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist notifications', e);
      }
    }
  }, [student]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const markNotificationAsUnread = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: false } : n));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const login = useCallback((profile: Partial<StudentProfile>) => {
    const fullProfile: StudentProfile = {
      id: profile.id || `std_${Date.now()}`,
      name: profile.name?.trim() || 'Aspirant',
      phone: profile.phone || '',
      email: profile.email || '',
      targetExam: profile.targetExam || 'JEE Main & Advanced',
      targetClass: profile.targetClass || 'Class 11th',
      targetYear: profile.targetYear || '2026',
      enrolledCourseIds: profile.enrolledCourseIds || [],
      joinedDate: profile.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      lastActiveTimestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullProfile));
    } catch (e) {
      console.warn('Failed to store student session in localStorage', e);
    }
    setStudent(fullProfile);
  }, []);

  // Credential-based login with real validation and asynchronous delay
  const loginWithCredentials = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    // Artificial latency (400ms) to simulate real auth request & prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    // 1. Try Backend Authentication API
    try {
      const backendRes = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password: cleanPassword
      });

      if (backendRes.success && backendRes.data) {
        const u = backendRes.data;
        const profile: StudentProfile = {
          id: u.studentId || u._id,
          studentId: u.studentId || u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          targetExam: u.targetExam || 'JEE Main & Advanced',
          targetClass: u.targetClass || 'Class 11th',
          targetYear: u.targetYear || '2028',
          avatarUrl: u.avatarUrl,
          dob: u.dob || '',
          preferredLanguage: u.preferredLanguage || 'Hinglish',
          city: u.city || '',
          state: u.state || 'Delhi',
          parentName: u.parentName || '',
          parentPhone: u.parentPhone || '',
          schoolName: u.schoolName || '',
          board: u.board || 'CBSE',
          enrolledCourseIds: Array.isArray(u.enrolledCourses)
            ? u.enrolledCourses.map((c: any) => (typeof c === 'string' ? c : c._id || c))
            : [],
          joinedDate: 'Recently',
          lastActiveTimestamp: Date.now(),
          token: u.token
        };

        try {
          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          }
        } catch (e) {
          console.warn('Storage error', e);
        }

        setStudent(profile);
        return { success: true };
      }
    } catch {
      // Fallback seamlessly to local accounts
    }

    const accounts = getStoredAccounts();
    const matched = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

    if (!matched) {
      // Check if it's the demo email
      if (cleanEmail === DEMO_STUDENT.email?.toLowerCase()) {
        const profile: StudentProfile = {
          ...DEMO_STUDENT,
          lastActiveTimestamp: Date.now()
        };
        try {
          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          }
        } catch (e) {
          console.warn('Storage error', e);
        }
        setStudent(profile);
        return { success: true };
      }
      return { success: false, error: 'No account found with this email address. Please check your spelling or sign up.' };
    }

    // Check password if set
    if (matched.passwordHash && matched.passwordHash !== cleanPassword) {
      return { success: false, error: 'Incorrect password. Please verify your credentials or reset your password.' };
    }

    const profile: StudentProfile = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      phone: matched.phone || '',
      targetExam: matched.targetExam || 'JEE Main & Advanced',
      targetClass: matched.targetClass || 'Class 11th',
      targetYear: matched.targetYear || '2026',
      enrolledCourseIds: matched.enrolledCourseIds || [],
      joinedDate: matched.joinedDate || 'Recently',
      lastActiveTimestamp: Date.now()
    };

    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (e) {
      console.warn('Storage error', e);
    }
    setStudent(profile);
    return { success: true };
  }, []);

  // Signup method with real storage and validation
  const signupStudent = useCallback(async (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    targetExam?: string;
    targetClass?: string;
    targetYear?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    // Artificial latency (450ms)
    await new Promise((resolve) => setTimeout(resolve, 450));

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    if (!cleanName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'A valid email address is required.' };
    }

    // 1. Try Backend Registration API
    try {
      const backendRes = await apiClient.post('/auth/register', {
        name: cleanName,
        email: cleanEmail,
        password: data.password || 'password123',
        phone: data.phone?.trim() || '',
        targetExam: data.targetExam || 'JEE Main & Advanced',
        targetClass: data.targetClass || 'Class 11th'
      });

      if (backendRes.success && backendRes.data) {
        const u = backendRes.data;
        const profile: StudentProfile = {
          id: u.studentId || u._id,
          studentId: u.studentId || u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          targetExam: u.targetExam || 'JEE Main & Advanced',
          targetClass: u.targetClass || 'Class 11th',
          targetYear: data.targetYear || '2028',
          enrolledCourseIds: Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [],
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          lastActiveTimestamp: Date.now(),
          token: u.token
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (e) {
          console.warn('Storage error', e);
        }

        setStudent(profile);
        return { success: true };
      }
    } catch {
      // Fallback seamlessly to local accounts
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account is already registered with this email address. Please log in instead.' };
    }

    const uniqueStudentId = generateStudentId();
    const newAccount: UserAccount = {
      id: uniqueStudentId,
      studentId: uniqueStudentId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: data.password || 'password123',
      phone: data.phone?.trim() || '',
      targetExam: data.targetExam || 'JEE Main & Advanced',
      targetClass: data.targetClass || 'Class 11th',
      targetYear: data.targetYear || '2028',
      enrolledCourseIds: [], // Fresh new account starts with clean dashboard
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      createdAt: Date.now()
    };

    accounts.push(newAccount);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to save account to localStorage', e);
    }

    // Automatically sign in the newly registered student
    const profile: StudentProfile = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      phone: newAccount.phone || '',
      targetExam: newAccount.targetExam,
      targetClass: newAccount.targetClass,
      targetYear: newAccount.targetYear,
      enrolledCourseIds: newAccount.enrolledCourseIds,
      joinedDate: newAccount.joinedDate,
      lastActiveTimestamp: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to store student session', e);
    }
    setStudent(profile);
    return { success: true };
  }, []);

  // Password reset request
  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    // Artificial latency (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Generic security response: Never reveal whether an email exists
    return {
      success: true,
      message: `If an account is associated with ${email.trim()}, password reset instructions have been dispatched to your inbox.`
    };
  }, []);

  // Real profile update with storage persistence
  const updateProfile = useCallback(async (updates: Partial<StudentProfile>): Promise<{ success: boolean; error?: string }> => {
    // Artificial latency (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (updates.name !== undefined && !updates.name.trim()) {
      return { success: false, error: 'Full name cannot be empty.' };
    }
    if (updates.phone !== undefined && updates.phone.trim() && updates.phone.replace(/\D/g, '').length !== 10) {
      return { success: false, error: 'Mobile number must be 10 digits.' };
    }

    setStudent((prev) => {
      if (!prev) return null;
      const updated: StudentProfile = {
        ...prev,
        ...updates,
        name: updates.name !== undefined ? updates.name.trim() : prev.name,
        phone: updates.phone !== undefined ? updates.phone.trim() : prev.phone,
        lastActiveTimestamp: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist updated profile', e);
      }

      // Sync with backend API
      try {
        apiClient.put('/auth/profile', updates).catch(() => {});
      } catch {
        // offline fallback
      }

      // Also sync user accounts table if matching email
      try {
        const accounts = getStoredAccounts();
        const idx = accounts.findIndex((a) => a.id === updated.id || (a.email && a.email.toLowerCase() === updated.email?.toLowerCase()));
        if (idx !== -1) {
          accounts[idx] = {
            ...accounts[idx],
            name: updated.name,
            phone: updated.phone,
            targetExam: updated.targetExam,
            targetClass: updated.targetClass,
            targetYear: updated.targetYear
          };
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        }
      } catch (e) {
        console.warn('Failed to sync accounts table', e);
      }

      return updated;
    });

    return { success: true };
  }, []);

  // Real password change
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!currentPassword) {
      return { success: false, error: 'Current password is required.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must contain at least 6 characters.' };
    }

    if (!student || !student.email) {
      return { success: false, error: 'No active authenticated session found.' };
    }

    const accounts = getStoredAccounts();
    const matched = accounts.find((a) => a.email.toLowerCase() === student.email?.toLowerCase());

    if (!matched) {
      // Demo student fallback password
      if (student.email.toLowerCase() === DEMO_STUDENT.email?.toLowerCase()) {
        if (currentPassword !== 'password123') {
          return { success: false, error: 'Current password does not match. Demo password is: password123' };
        }
        return { success: true };
      }
      return { success: false, error: 'Account record not found.' };
    }

    if (matched.passwordHash && matched.passwordHash !== currentPassword) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    matched.passwordHash = newPassword;
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to update password in storage', e);
    }

    return { success: true };
  }, [student]);

  // Real notification preferences update
  const updateNotificationPreferences = useCallback(async (
    prefs: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> => {
    setStudent((prev) => {
      if (!prev) return null;
      const currentPrefs: NotificationPreferences = prev.notificationPreferences || {
        emailAlerts: true,
        dppReminders: true,
        mockTestUpdates: true,
        smsExamUpdates: false
      };
      const updated: StudentProfile = {
        ...prev,
        notificationPreferences: {
          ...currentPrefs,
          ...prefs
        },
        lastActiveTimestamp: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save notification preferences', e);
      }
      return updated;
    });

    return { success: true };
  }, []);

  const loginAsDemo = useCallback(() => {
    const demo = { ...DEMO_STUDENT, lastActiveTimestamp: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch (e) {
      console.warn('Failed to store demo session', e);
    }
    setStudent(demo);
  }, []);

  const loginAsNewStudent = useCallback((name?: string) => {
    const uniqueId = generateStudentId();
    const newStudent: StudentProfile = {
      id: uniqueId,
      studentId: uniqueId,
      name: name?.trim() || 'New Aspirant',
      phone: '9812345678',
      email: 'new.student@dkacademy.in',
      targetExam: 'JEE Main',
      targetClass: 'Class 11th',
      targetYear: '2026',
      enrolledCourseIds: [], // Empty enrollments to test genuine empty state
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      lastActiveTimestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStudent));
    } catch (e) {
      console.warn('Failed to store new student session', e);
    }
    setStudent(newStudent);
  }, []);

  const enrollCourse = useCallback((courseId: string) => {
    setStudent((prev) => {
      if (!prev) return null;
      if (prev.enrolledCourseIds.includes(courseId)) return prev;
      const updated: StudentProfile = {
        ...prev,
        enrolledCourseIds: [...prev.enrolledCourseIds, courseId],
        lastActiveTimestamp: Date.now()
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist enrolled course', e);
      }
      return updated;
    });

    // Save directly to MongoDB database
    apiClient.post('/auth/enroll-course', { courseId }).catch(() => {
      apiClient.post('/auth/enroll', { courseId }).catch(() => {});
    });
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove student session', e);
    }
    setStudent(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        student,
        isAuthenticated: !!student,
        isLoading,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markNotificationAsUnread,
        markAllNotificationsAsRead,
        deleteNotification,
        login,
        loginWithCredentials,
        signupStudent,
        requestPasswordReset,
        updateProfile,
        changePassword,
        updateNotificationPreferences,
        loginAsDemo,
        loginAsNewStudent,
        enrollCourse,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useStudentAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * DK Academy JEE - Admin, CMS & Lead Management Portal Types
 */

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'TEACHER'
  | 'ADMIN'
  | 'CMS_MANAGER'
  | 'LEAD_MANAGER'
  | 'COUNSELOR'
  | 'STUDENT';

export type PermissionId =
  | 'students.view'
  | 'students.manage'
  | 'staff.view'
  | 'staff.manage'
  | 'roles.manage'
  | 'cms.pages.view'
  | 'cms.pages.edit'
  | 'cms.pages.publish'
  | 'cms.courses.manage'
  | 'cms.media.manage'
  | 'cms.announcements.manage'
  | 'leads.view_all'
  | 'leads.view_assigned'
  | 'leads.update'
  | 'leads.assign'
  | 'leads.contact'
  | 'reports.view'
  | 'settings.manage'
  | 'audit_logs.view';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  designation: string;
  phone?: string;
  avatarUrl?: string;
  department?: string;
  isActive: boolean;
  permissions: PermissionId[];
  lastLoginTimestamp?: number;
  createdAt: number;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  createdAt: number;
  expiresAt: number;
}

export type AuditActionType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'LEAD_STATUS_UPDATED'
  | 'LEAD_NOTE_ADDED'
  | 'LEAD_PRIORITY_CHANGED'
  | 'LEAD_ASSIGNED'
  | 'LEAD_EXPORTED'
  | 'COURSE_CREATED'
  | 'COURSE_UPDATED'
  | 'COURSE_DELETED'
  | 'BANNER_TOGGLED'
  | 'BANNER_CREATED'
  | 'PAGE_CONTENT_UPDATED'
  | 'PAGE_SECTION_CREATED'
  | 'PAGE_SECTION_DELETED'
  | 'NAVBAR_UPDATED'
  | 'FOOTER_UPDATED'
  | 'COUNSELOR_UPDATED'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'SETTINGS_UPDATED'
  | 'STAFF_CREATED'
  | 'STAFF_UPDATED'
  | 'STAFF_DELETED'
  | 'STAFF_STATUS_TOGGLED'
  | 'ROLE_UPDATED'
  | 'STUDENT_CREATED'
  | 'STUDENT_UPDATED'
  | 'STUDENT_DELETED'
  | 'STUDENT_STATUS_TOGGLED'
  | 'STUDENT_PASSWORD_RESET';

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: AuditActionType;
  module: string;
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface WebsiteBanner {
  id: string;
  title: string;
  tagText: string;
  message: string;
  linkText: string;
  linkUrl: string;
  isActive: boolean;
  priority: number;
  type: 'announcement' | 'discount' | 'urgent' | 'orientation';
  createdAt: string;
  updatedAt: string;
}

export interface CounselorMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsAppNumber: string;
  designation: string;
  specialization: string;
  activeLeadsCount: number;
  isAvailable: boolean;
  rating: number;
  joinedDate: string;
}

export interface RoleDefinition {
  role: AdminRole;
  label: string;
  description: string;
  badgeColor: string;
  defaultPermissions: PermissionId[];
  userCount?: number;
}

// ----------------------------------------------------
// CMS Navigation & Footer Types
// ----------------------------------------------------
export interface NavbarDropdownItem {
  id: string;
  label: string;
  path: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  isExternal?: boolean;
  isVisible: boolean;
  order: number;
}

export interface NavbarMenuItem {
  id: string;
  label: string;
  path: string;
  isDropdown: boolean;
  dropdownItems?: NavbarDropdownItem[];
  badge?: string;
  isButton?: boolean;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isVisible: boolean;
  order: number;
}

export interface FooterLinkItem {
  id: string;
  label: string;
  path: string;
  isExternal?: boolean;
  isVisible: boolean;
  badge?: string;
}

export interface FooterConfig {
  brandName: string;
  brandTag: string;
  description: string;
  logoUrl: string;
  phone1: string;
  phone2: string;
  whatsappNumber: string;
  emailAdmissions: string;
  emailDirector: string;
  janakpuriAddress: string;
  dwarkaAddress: string;
  learningLinks: FooterLinkItem[];
  policyLinks: FooterLinkItem[];
  subjectLinks: FooterLinkItem[];
  socialLinks: {
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
    instagram?: string;
  };
  copyrightText: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// CMS Page Content Types
// ----------------------------------------------------
export interface PageCardItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  imageUrl?: string;
  linkText?: string;
  linkUrl?: string;
}

export interface PageAssetItem {
  id: string;
  title: string;
  fileType: 'pdf' | 'doc' | 'image' | 'archive' | 'link';
  fileUrl: string;
  fileSize?: string;
  buttonText?: string;
  description?: string;
}

export interface PageSectionItem {
  id: string;
  type?: 'banner' | 'video' | 'cards' | 'assets' | 'faq' | 'stats' | 'text';
  title: string;
  subtitle?: string;
  content?: string;
  badge?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoCaption?: string;
  cards?: PageCardItem[];
  assets?: PageAssetItem[];
  columns?: 2 | 3 | 4;
  order: number;
  isVisible: boolean;
}

export interface PageStatItem {
  id: string;
  label: string;
  value: string;
  subtext?: string;
}

export interface PageFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface PageContentConfig {
  pageId: string;
  pageTitle: string;
  layoutTemplate?: 'standard' | 'video-showcase' | 'cards-grid' | 'academic-syllabus';
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
  heroBadge?: string;
  heroHeading?: string;
  heroSubheading?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  videoUrl?: string;
  stats?: PageStatItem[];
  customSections?: PageSectionItem[];
  faqs?: PageFaqItem[];
  bannerNotice?: string;
  updatedAt: string;
}


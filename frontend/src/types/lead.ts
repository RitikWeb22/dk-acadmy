export type TimeSlot =
  | 'Morning (9:00 AM – 12:00 PM)'
  | 'Afternoon (12:00 PM – 4:00 PM)'
  | 'Evening (4:00 PM – 8:00 PM)';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up required'
  | 'Demo Scheduled'
  | 'Converted'
  | 'Enrolled'
  | 'Closed'
  | 'Dropped'
  | 'Spam'
  | 'Not Interested';

export type LeadPriority = 'High' | 'Medium' | 'Low';

export type LeadSource =
  | 'Contact Us Portal'
  | 'Home Callback Form'
  | 'Floating Callback Widget'
  | 'Course Detail Page'
  | 'WhatsApp Direct Trigger'
  | 'Classroom Center Inquiry'
  | 'Admissions Helpline (Phone)'
  | 'Offline Walk-in (Janakpuri)';

export interface CounselorNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface ProspectiveLead {
  id: string; // e.g. "DK-INQ-1042"
  fullName: string;
  mobile: string;
  email?: string;
  subject?: string;
  message?: string;
  relatedCourse?: string;
  currentClass: 'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper';
  targetBatch: string;
  preferredTime: TimeSlot;
  city?: string;
  queryNotes?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  leadScore: number; // 0-100 calculated from grade, batch urgency, questions
  counselorNotes: CounselorNote[];
  assignedCounselor: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  followUpDate?: string;
}

export interface CreateLeadInput {
  fullName: string;
  mobile: string;
  email?: string;
  subject?: string;
  message?: string;
  relatedCourse?: string;
  currentClass: 'Class 10th' | 'Class 11th' | 'Class 12th' | 'Dropper';
  targetBatch: string;
  preferredTime: TimeSlot;
  city?: string;
  queryNotes?: string;
  source?: LeadSource;
  priority?: LeadPriority;
}

export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  demoScheduled: number;
  enrolledLeads: number;
  slotBreakdown: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  conversionRate: number;
}

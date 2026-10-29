/**
 * DK Academy JEE - Lead Aggregation Pipeline
 * Centralized retention and management of prospective student inquiries.
 */

import type {
  ProspectiveLead,
  CreateLeadInput,
  LeadStatus,
  LeadPriority,
  LeadStats
} from '../types/lead';
import { apiClient } from './apiClient';
import { generateInquiryId } from '../utils/uuid';

const STORAGE_KEY = 'dk_academy_leads_pipeline_v1';
const EVENT_NAME = 'dk_leads_updated';

// Realistic initial pre-seeded inquiries for counselor portal demonstration
const INITIAL_LEADS: ProspectiveLead[] = [
  {
    id: 'DK-INQ-1081',
    fullName: 'Rohan Deshmukh',
    mobile: '9820145678',
    email: 'rohan.deshmukh28@gmail.com',
    currentClass: 'Class 11th',
    targetBatch: 'Class 11th & 12th Math Special (DK Sir 20s Techniques)',
    preferredTime: 'Evening (4:00 PM – 8:00 PM)',
    city: 'New Delhi (Rohini)',
    queryNotes: 'Interested in offline classroom + online live hybrid at Janakpuri. Wants demo session for calculus.',
    source: 'Home Callback Form',
    status: 'New',
    priority: 'High',
    leadScore: 88,
    assignedCounselor: 'Dharmendra Kumar (DK Sir)',
    counselorNotes: [
      {
        id: 'note-1',
        author: 'Admissions Desk',
        text: 'Inquiry received via website. Student specifically asked for DK Sir 20s speed techniques batch.',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'DK-INQ-1079',
    fullName: 'Ananya Singhal',
    mobile: '9412356789',
    email: 'ananya.singhal@yahoo.com',
    currentClass: 'Class 12th',
    targetBatch: 'JEE Main & Advanced 2-Year Comprehensive Batch',
    preferredTime: 'Morning (9:00 AM – 12:00 PM)',
    city: 'Jaipur, Rajasthan',
    queryNotes: 'Father called regarding scholarship test score and printed DLP modules dispatch.',
    source: 'Course Detail Page',
    status: 'Contacted',
    priority: 'High',
    leadScore: 92,
    assignedCounselor: 'Senior Counselor Rajesh',
    counselorNotes: [
      {
        id: 'note-2',
        author: 'Senior Counselor Rajesh',
        text: 'Spoke with parent. Explained 90% scholarship test criteria. Demo CBT test scheduled for Saturday 11 AM.',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'DK-INQ-1076',
    fullName: 'Vikramaditya Roy',
    mobile: '9711823456',
    email: 'vikram.roy.jee@outlook.com',
    currentClass: 'Dropper',
    targetBatch: 'Dropper & Repeater Rank Booster (Target 2026/2027)',
    preferredTime: 'Afternoon (12:00 PM – 4:00 PM)',
    city: 'Patna, Bihar',
    queryNotes: 'Scored 94 percentile in first attempt. Wants intensive negative-marking reduction CBT series.',
    source: 'Floating Callback Widget',
    status: 'Demo Scheduled',
    priority: 'High',
    leadScore: 95,
    assignedCounselor: 'Dr. Devendra Verma (Physics Faculty)',
    counselorNotes: [
      {
        id: 'note-3',
        author: 'Dr. Devendra Verma',
        text: 'Conducted 10-minute strategy call. Sent mock CBT access link. Target: 99.5+ percentile.',
        timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString()
  },
  {
    id: 'DK-INQ-1072',
    fullName: 'Harsh Vardhan Gupta',
    mobile: '9810567890',
    email: 'harsh.gupta.delhi@gmail.com',
    currentClass: 'Class 10th',
    targetBatch: 'Class 9th & 10th IIT Foundation Concept Builder',
    preferredTime: 'Morning (9:00 AM – 12:00 PM)',
    city: 'New Delhi (Janakpuri)',
    queryNotes: 'Walk-in parent inquiry at Janakpuri center. Looking for weekend mathematics foundation.',
    source: 'Offline Walk-in (Janakpuri)',
    status: 'Enrolled',
    priority: 'Medium',
    leadScore: 90,
    assignedCounselor: 'Admissions Desk Janakpuri',
    counselorNotes: [
      {
        id: 'note-4',
        author: 'Admissions Desk',
        text: 'Completed in-person counseling at center. Enrolled in Foundation Batch. Receipt #REC-2026-904.',
        timestamp: new Date(Date.now() - 1000 * 60 * 700).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 700).toISOString()
  },
  {
    id: 'DK-INQ-1068',
    fullName: 'Pooja Agarwal',
    mobile: '9315678901',
    email: 'pooja.agarwal2027@gmail.com',
    currentClass: 'Class 11th',
    targetBatch: 'All India Online CBT Test Series (Class 11 & 12)',
    preferredTime: 'Evening (4:00 PM – 8:00 PM)',
    city: 'Lucknow, Uttar Pradesh',
    queryNotes: 'Wants chapter-wise PYQ archive access and DK Sir short video algorithmic keys.',
    source: 'WhatsApp Direct Trigger',
    status: 'New',
    priority: 'Medium',
    leadScore: 78,
    assignedCounselor: 'Senior Counselor Rajesh',
    counselorNotes: [
      {
        id: 'note-5',
        author: 'System',
        text: 'Initiated WhatsApp inquiry directly from CBT Mock Test series page.',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  }
];

function calculateLeadScore(data: CreateLeadInput): number {
  let score = 60; // base score

  // Class readiness
  if (data.currentClass === 'Dropper') score += 15;
  if (data.currentClass === 'Class 12th') score += 12;
  if (data.currentClass === 'Class 11th') score += 10;

  // Batch commitment
  if (data.targetBatch.includes('Comprehensive') || data.targetBatch.includes('Math Special')) {
    score += 10;
  }

  // Provided query detail
  if (data.queryNotes && data.queryNotes.length > 15) {
    score += 8;
  }

  // Email provided
  if (data.email && data.email.includes('@')) {
    score += 5;
  }

  return Math.min(100, score);
}

class LeadService {
  private getStorage(): ProspectiveLead[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
        return INITIAL_LEADS;
      }
      return JSON.parse(raw) as ProspectiveLead[];
    } catch (e) {
      console.warn('Failed to parse leads from storage', e);
      return INITIAL_LEADS;
    }
  }

  private setStorage(leads: ProspectiveLead[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: leads }));
    } catch (e) {
      console.warn('Failed to write leads to storage', e);
    }
  }

  public getAllLeads(): ProspectiveLead[] {
    // Asynchronously sync with backend leads repository
    this.fetchLeadsFromApi().catch(() => {});
    return this.getStorage().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async fetchLeadsFromApi(filters?: { search?: string; status?: string; priority?: string }): Promise<{ leads: ProspectiveLead[]; stats?: LeadStats }> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters?.priority && filters.priority !== 'All') params.append('priority', filters.priority);

      const res = await apiClient.get(`/leads?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        const mapped: ProspectiveLead[] = res.data.map((l: any) => ({
          id: l.leadId || l._id,
          fullName: l.fullName,
          mobile: l.mobile,
          email: l.email,
          subject: l.subject,
          message: l.message,
          relatedCourse: l.relatedCourse,
          currentClass: l.currentClass,
          targetBatch: l.targetBatch,
          preferredTime: l.preferredTime,
          city: l.city,
          queryNotes: l.queryNotes,
          source: l.source,
          status: l.status,
          priority: l.priority,
          leadScore: l.leadScore ?? 70,
          assignedCounselor: l.assignedCounselor || 'Admissions Desk Janakpuri',
          counselorNotes: l.counselorNotes || [],
          followUpDate: l.followUpDate,
          createdAt: l.createdAt || new Date().toISOString(),
          updatedAt: l.updatedAt || new Date().toISOString()
        }));

        this.setStorage(mapped);
        return { leads: mapped, stats: res.stats };
      }
    } catch (err) {
      console.warn('Failed to fetch leads from backend API, using cached data', err);
    }

    const cached = this.getStorage();
    return { leads: cached, stats: this.getLeadStats() };
  }

  public submitLead(input: CreateLeadInput): ProspectiveLead {
    const leads = this.getStorage();
    // Generate unique Inquiry ID using UUID
    const newLeadId = generateInquiryId();

    const priority: LeadPriority = input.priority || (
      input.currentClass === 'Dropper' || input.targetBatch.includes('Math Special')
        ? 'High'
        : 'Medium'
    );

    const newLead: ProspectiveLead = {
      id: newLeadId,
      fullName: input.fullName.trim(),
      mobile: input.mobile.replace(/\D/g, ''),
      email: input.email?.trim() || undefined,
      subject: input.subject?.trim() || 'General Admissions & JEE Guidance',
      message: input.message?.trim() || input.queryNotes?.trim() || undefined,
      relatedCourse: input.relatedCourse,
      currentClass: input.currentClass,
      targetBatch: input.targetBatch,
      preferredTime: input.preferredTime,
      city: input.city?.trim() || 'Online / Delhi NCR',
      queryNotes: input.queryNotes?.trim() || input.message?.trim() || undefined,
      source: input.source || 'Contact Us Portal',
      status: 'New',
      priority,
      leadScore: calculateLeadScore(input),
      assignedCounselor: 'Admissions Desk Janakpuri',
      counselorNotes: [
        {
          id: `note-${Date.now()}`,
          author: 'Automated Pipeline Intake',
          text: `Inquiry submitted for ${input.targetBatch}. Subject: "${input.subject || 'General Inquiry'}". Preferred slot: ${input.preferredTime}.`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newLead, ...leads];
    this.setStorage(updated);

    // Sync to backend API in background
    apiClient.post('/leads', {
      fullName: newLead.fullName,
      mobile: newLead.mobile,
      email: newLead.email,
      subject: newLead.subject,
      message: newLead.message,
      relatedCourse: newLead.relatedCourse,
      currentClass: newLead.currentClass,
      targetBatch: newLead.targetBatch,
      preferredTime: newLead.preferredTime,
      city: newLead.city,
      queryNotes: newLead.queryNotes,
      source: newLead.source,
      priority: newLead.priority
    }).then((res) => {
      if (res.success && res.data) {
        newLead.id = res.data.leadId || newLead.id;
        this.setStorage([newLead, ...this.getStorage().filter(l => l.id !== newLeadId)]);
      }
    }).catch((e) => {
      console.warn('Failed to sync lead to backend API, cached locally', e);
    });

    return newLead;
  }

  public async createLeadAdmin(data: Partial<ProspectiveLead>): Promise<ProspectiveLead> {
    const input: CreateLeadInput = {
      fullName: data.fullName || 'Prospective Aspirant',
      mobile: data.mobile || '9999999999',
      email: data.email,
      subject: data.subject || 'Admin Desk Registered Lead',
      message: data.message,
      currentClass: data.currentClass || 'Class 11th',
      targetBatch: data.targetBatch || 'JEE Main & Advanced Complete',
      preferredTime: data.preferredTime || 'Evening (4:00 PM – 8:00 PM)',
      city: data.city || 'Janakpuri, New Delhi',
      queryNotes: data.queryNotes,
      source: data.source || 'Offline Walk-in (Janakpuri)',
      priority: data.priority || 'High'
    };

    return this.submitLead(input);
  }

  public async updateLead(id: string, updates: Partial<ProspectiveLead>): Promise<ProspectiveLead | null> {
    const leads = this.getStorage();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    leads[index] = {
      ...leads[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.setStorage(leads);

    // Call backend API
    try {
      await apiClient.put(`/leads/${id}`, updates);
    } catch (e) {
      console.warn(`Failed to sync update for lead ${id} to backend`, e);
    }

    return leads[index];
  }

  public async updateLeadStatus(id: string, status: LeadStatus): Promise<ProspectiveLead | null> {
    const leads = this.getStorage();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const newNote = {
      id: `note-${Date.now()}`,
      author: 'Counselor Action',
      text: `Status updated to "${status}".`,
      timestamp: new Date().toISOString()
    };

    leads[index] = {
      ...leads[index],
      status,
      updatedAt: new Date().toISOString(),
      counselorNotes: [...leads[index].counselorNotes, newNote]
    };

    this.setStorage(leads);

    // Sync to backend API
    apiClient.put(`/leads/${id}`, { status, newNote }).catch(() => {});

    return leads[index];
  }

  public async updateLeadPriority(id: string, priority: LeadPriority): Promise<ProspectiveLead | null> {
    return await this.updateLead(id, { priority });
  }

  public async assignCounselor(id: string, counselor: string): Promise<ProspectiveLead | null> {
    const leads = this.getStorage();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const newNote = {
      id: `note-${Date.now()}`,
      author: 'Lead Management',
      text: `Assigned to counselor ${counselor}.`,
      timestamp: new Date().toISOString()
    };

    leads[index] = {
      ...leads[index],
      assignedCounselor: counselor,
      updatedAt: new Date().toISOString(),
      counselorNotes: [...leads[index].counselorNotes, newNote]
    };

    this.setStorage(leads);
    apiClient.put(`/leads/${id}`, { assignedCounselor: counselor, newNote }).catch(() => {});

    return leads[index];
  }

  public addCounselorNote(id: string, text: string, author: string = 'Senior Counselor'): ProspectiveLead | null {
    const leads = this.getStorage();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const note = {
      id: `note-${Date.now()}`,
      author,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    leads[index] = {
      ...leads[index],
      updatedAt: new Date().toISOString(),
      counselorNotes: [...leads[index].counselorNotes, note]
    };

    this.setStorage(leads);

    apiClient.put(`/leads/${id}`, { newNote: note }).catch(() => {});

    return leads[index];
  }

  public async updateFollowUpDate(id: string, followUpDate: string): Promise<ProspectiveLead | null> {
    return await this.updateLead(id, { followUpDate });
  }

  public async deleteLead(id: string): Promise<boolean> {
    const leads = this.getStorage();
    const filtered = leads.filter((l) => l.id !== id);
    this.setStorage(filtered);

    try {
      await apiClient.delete(`/leads/${id}`);
      return true;
    } catch (e) {
      console.warn(`Failed to delete lead ${id} on backend API`, e);
      return false;
    }
  }

  public getLeadStats(): LeadStats {
    const leads = this.getStorage();
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === 'New').length;
    const contactedLeads = leads.filter((l) => l.status === 'Contacted').length;
    const demoScheduled = leads.filter((l) => l.status === 'Demo Scheduled').length;
    const enrolledLeads = leads.filter((l) => l.status === 'Enrolled').length;

    const morning = leads.filter((l) => l.preferredTime.includes('Morning')).length;
    const afternoon = leads.filter((l) => l.preferredTime.includes('Afternoon')).length;
    const evening = leads.filter((l) => l.preferredTime.includes('Evening')).length;

    const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      demoScheduled,
      enrolledLeads,
      slotBreakdown: {
        morning,
        afternoon,
        evening
      },
      conversionRate
    };
  }

  public exportLeadsToCSV(leadsToExport?: ProspectiveLead[]): void {
    const leads = leadsToExport || this.getStorage();
    const headers = [
      'Inquiry ID',
      'Full Name',
      'Mobile',
      'Email',
      'Subject',
      'Current Class',
      'Target Batch',
      'Preferred Contact Time',
      'City',
      'Customer Query / Message',
      'Source',
      'Status',
      'Priority',
      'Lead Score',
      'Assigned Counselor',
      'Follow-up Date',
      'Created Date'
    ];

    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.mobile}"`,
      `"${l.email || ''}"`,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      `"${l.currentClass}"`,
      `"${l.targetBatch.replace(/"/g, '""')}"`,
      `"${l.preferredTime}"`,
      `"${l.city || ''}"`,
      `"${(l.message || l.queryNotes || '').replace(/"/g, '""')}"`,
      `"${l.source}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      l.leadScore,
      `"${l.assignedCounselor}"`,
      `"${l.followUpDate || ''}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DK_Academy_Inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public resetToDemo(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: INITIAL_LEADS }));
  }
}

export const leadService = new LeadService();


import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  AlertCircle,
  Check,
  Copy,
  Calendar,
  Send,
  Building2,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { leadService } from '../../../services/leadService';
import type { ProspectiveLead, LeadStatus, LeadPriority, LeadStats } from '../../../types/lead';
import { useToast } from '../../../context/ToastContext';
import styles from './ContactManagementWorkspace.module.scss';

export const ContactManagementWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [leads, setLeads] = useState<ProspectiveLead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [counselorFilter, setCounselorFilter] = useState<string>('All');

  // Modals & Drawer State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ProspectiveLead | null>(null);
  const [viewingLead, setViewingLead] = useState<ProspectiveLead | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [leadFormData, setLeadFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    subject: 'Admissions & Batch Seat Inquiries',
    message: '',
    currentClass: 'Class 11th' as ProspectiveLead['currentClass'],
    targetBatch: '2-Year Ultimate JEE Main & Advanced Mastery Program',
    preferredTime: 'Evening (4:00 PM – 8:00 PM)' as ProspectiveLead['preferredTime'],
    city: 'New Delhi',
    source: 'Contact Us Portal' as ProspectiveLead['source'],
    status: 'New' as LeadStatus,
    priority: 'Medium' as LeadPriority,
    assignedCounselor: 'Admissions Desk Janakpuri'
  });

  // Drawer Quick Note State
  const [drawerNote, setDrawerNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load leads from API
  const loadLeadsData = async () => {
    setIsSyncing(true);
    try {
      const result = await leadService.fetchLeadsFromApi();
      setLeads(result.leads);
      if (result.stats) setStats(result.stats);
    } catch {
      showToast('Error syncing with live inquiries database', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial sync
    loadLeadsData();

    // Listen for WebSocket / local custom events
    const handleLeadsUpdated = () => {
      loadLeadsData();
    };

    window.addEventListener('dk_leads_updated', handleLeadsUpdated);
    return () => {
      window.removeEventListener('dk_leads_updated', handleLeadsUpdated);
    };
  }, []);

  // Compute live filtered roster
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          lead.fullName.toLowerCase().includes(q) ||
          lead.mobile.includes(q) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          lead.id.toLowerCase().includes(q) ||
          (lead.subject && lead.subject.toLowerCase().includes(q)) ||
          lead.targetBatch.toLowerCase().includes(q) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.queryNotes && lead.queryNotes.toLowerCase().includes(q)) ||
          (lead.message && lead.message.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Status Tab
      if (selectedStatusTab !== 'All' && lead.status !== selectedStatusTab) {
        return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== 'All' && lead.priority !== priorityFilter) {
        return false;
      }

      // 4. Source Filter
      if (sourceFilter !== 'All' && lead.source !== sourceFilter) {
        return false;
      }

      // 5. Counselor Filter
      if (counselorFilter !== 'All' && lead.assignedCounselor !== counselorFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedStatusTab, priorityFilter, sourceFilter, counselorFilter]);

  // Compute stats if not available from API
  const computedStats = useMemo(() => {
    if (stats) return stats;
    return leadService.getLeadStats();
  }, [stats, leads]);

  // Copy Lead ID to clipboard
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied ${id}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Change Handler (Immediate CRUD Update)
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadService.updateLeadStatus(leadId, newStatus);
      showToast(`Inquiry #${leadId} marked as "${newStatus}"`, 'success');
      loadLeadsData();
      if (viewingLead && viewingLead.id === leadId) {
        setViewingLead({ ...viewingLead, status: newStatus });
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  // Priority Change Handler
  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    try {
      await leadService.updateLeadPriority(leadId, newPriority);
      showToast(`Priority updated to ${newPriority}`, 'success');
      loadLeadsData();
    } catch {
      showToast('Failed to update priority', 'error');
    }
  };

  // Reassign Counselor Handler
  const handleCounselorChange = async (leadId: string, newCounselor: string) => {
    try {
      await leadService.assignCounselor(leadId, newCounselor);
      showToast(`Reassigned to ${newCounselor}`, 'success');
      loadLeadsData();
    } catch {
      showToast('Failed to reassign counselor', 'error');
    }
  };

  // Delete Lead Handler
  const handleDeleteConfirm = async () => {
    if (!deletingLeadId) return;
    try {
      await leadService.deleteLead(deletingLeadId);
      showToast(`Inquiry #${deletingLeadId} permanently deleted`, 'info');
      setDeletingLeadId(null);
      if (viewingLead?.id === deletingLeadId) setViewingLead(null);
      loadLeadsData();
    } catch {
      showToast('Failed to delete lead from database', 'error');
    }
  };

  // Add Counselor Note from Drawer
  const handleAddDrawerNote = async () => {
    if (!viewingLead || !drawerNote.trim()) return;
    try {
      const updated = await leadService.addCounselorNote(
        viewingLead.id,
        drawerNote.trim(),
        'Counselor Desk'
      );
      setDrawerNote('');
      if (updated) setViewingLead(updated);
      showToast('Follow-up note logged', 'success');
      loadLeadsData();
    } catch {
      showToast('Failed to log counselor note', 'error');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setLeadFormData({
      fullName: '',
      mobile: '',
      email: '',
      subject: 'Admissions & Batch Seat Inquiries',
      message: '',
      currentClass: 'Class 11th',
      targetBatch: '2-Year Ultimate JEE Main & Advanced Mastery Program',
      preferredTime: 'Evening (4:00 PM – 8:00 PM)',
      city: 'Janakpuri, New Delhi',
      source: 'Offline Walk-in (Janakpuri)',
      status: 'New',
      priority: 'High',
      assignedCounselor: 'Admissions Desk Janakpuri'
    });
    setEditingLead(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (lead: ProspectiveLead) => {
    setEditingLead(lead);
    setLeadFormData({
      fullName: lead.fullName,
      mobile: lead.mobile,
      email: lead.email || '',
      subject: lead.subject || 'General Admissions & JEE Guidance',
      message: lead.message || lead.queryNotes || '',
      currentClass: lead.currentClass,
      targetBatch: lead.targetBatch,
      preferredTime: lead.preferredTime,
      city: lead.city || '',
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      assignedCounselor: lead.assignedCounselor
    });
    setIsCreateModalOpen(true);
  };

  // Save (Create / Edit) Form Submission
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormData.fullName.trim() || !leadFormData.mobile.trim()) {
      showToast('Full name and mobile number are required', 'error');
      return;
    }

    try {
      if (editingLead) {
        await leadService.updateLead(editingLead.id, {
          fullName: leadFormData.fullName.trim(),
          mobile: leadFormData.mobile.trim(),
          email: leadFormData.email.trim() || undefined,
          subject: leadFormData.subject,
          message: leadFormData.message.trim(),
          currentClass: leadFormData.currentClass,
          targetBatch: leadFormData.targetBatch,
          preferredTime: leadFormData.preferredTime,
          city: leadFormData.city.trim(),
          source: leadFormData.source,
          status: leadFormData.status,
          priority: leadFormData.priority,
          assignedCounselor: leadFormData.assignedCounselor
        });
        showToast(`Inquiry #${editingLead.id} updated successfully`, 'success');
      } else {
        await leadService.createLeadAdmin(leadFormData);
        showToast('New student inquiry logged successfully', 'success');
      }
      setIsCreateModalOpen(false);
      loadLeadsData();
    } catch {
      showToast('Error saving inquiry. Please check connection.', 'error');
    }
  };

  // 1-Click WhatsApp Trigger
  const handleWhatsAppClick = (lead: ProspectiveLead, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanNum = lead.mobile.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${lead.fullName}, this is DK Academy admissions team. We received your inquiry #${lead.id} regarding ${lead.targetBatch}. Are you available for a 5-minute academic discussion?`
    );
    window.open(`https://wa.me/91${cleanNum}?text=${text}`, '_blank');
  };

  const counselorsList = [
    'Admissions Desk Janakpuri',
    'Dharmendra Kumar (DK Sir)',
    'Prof. R.K. Verma (Senior Faculty)',
    'Senior Counselor Rajesh',
    'Admissions Counselor Priya'
  ];

  return (
    <div className={styles.workspaceContainer}>
      {/* ─── 1. EXECUTIVE HEADER ─── */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircle}>
            <Mail size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Contact Us &amp; Customer Inquiries Desk</h1>
            <p className={styles.pageSubtitle}>
              Live student callbacks, demo session requests, website queries, and counseling pipeline across DK Academy.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={loadLeadsData}
            disabled={isSyncing}
            title="Sync latest inquiries"
          >
            <RefreshCw size={15} className={isSyncing ? styles.spinIcon : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => {
              leadService.exportLeadsToCSV(filteredLeads);
              showToast(`Exported ${filteredLeads.length} inquiries to CSV!`, 'success');
            }}
            title="Download CSV spreadsheet"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            <span>Log New Inquiry</span>
          </button>
        </div>
      </div>

      {/* ─── 2. 5-METRIC BENTO KPI STRIP ─── */}
      <div className={styles.metricsGrid}>
        {/* Metric 1: Total Leads */}
        <div className={`${styles.metricCard} ${styles.blueCard}`}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <Mail size={18} />
            </div>
            <span className={styles.badgePill}>Total Inquiries</span>
          </div>
          <span className={styles.metricValue}>{computedStats.totalLeads}</span>
          <span className={styles.metricLabel}>All Registered Inquiries</span>
          <span className={styles.metricSubText}>Across public portal &amp; desk</span>
        </div>

        {/* Metric 2: New Unread */}
        <div className={`${styles.metricCard} ${styles.amberCard}`}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <AlertCircle size={18} />
            </div>
            <span className={styles.badgePill}>Action Required</span>
          </div>
          <span className={styles.metricValue}>{computedStats.newLeads}</span>
          <span className={styles.metricLabel}>New / Pending Callback</span>
          <span className={styles.metricSubText}>Requires immediate outreach</span>
        </div>

        {/* Metric 3: In Follow-up */}
        <div className={`${styles.metricCard} ${styles.purpleCard}`}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <Clock size={18} />
            </div>
            <span className={styles.badgePill}>Active Pipeline</span>
          </div>
          <span className={styles.metricValue}>
            {computedStats.contactedLeads + (computedStats.demoScheduled || 0)}
          </span>
          <span className={styles.metricLabel}>Contacted &amp; Demos</span>
          <span className={styles.metricSubText}>Demos: {computedStats.demoScheduled || 0} scheduled</span>
        </div>

        {/* Metric 4: Enrolled */}
        <div className={`${styles.metricCard} ${styles.emeraldCard}`}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <CheckCircle2 size={18} />
            </div>
            <span className={styles.badgePill}>Converted</span>
          </div>
          <span className={styles.metricValue}>{computedStats.enrolledLeads}</span>
          <span className={styles.metricLabel}>Successfully Enrolled</span>
          <span className={styles.metricSubText}>Conversion Rate: {computedStats.conversionRate}%</span>
        </div>

        {/* Metric 5: High Priority */}
        <div className={`${styles.metricCard} ${styles.cyanCard}`}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <Flame size={18} />
            </div>
            <span className={styles.badgePill}>High Urgency</span>
          </div>
          <span className={styles.metricValue}>
            {leads.filter((l) => l.priority === 'High').length}
          </span>
          <span className={styles.metricLabel}>High Priority Leads</span>
          <span className={styles.metricSubText}>Droppers &amp; Kota Speed Batches</span>
        </div>
      </div>

      {/* ─── 3. TOOLBAR & QUICK FILTER PILLS ─── */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchAndFiltersRow}>
          {/* Search Box */}
          <div className={styles.searchBoxWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by student name, mobile, email, ticket ID, city, or query notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className={styles.filterGroup}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              title="Filter by Priority"
            >
              <option value="All">All Priorities</option>
              <option value="High">🔥 High Priority</option>
              <option value="Medium">⚡ Medium Priority</option>
              <option value="Low">💤 Low Priority</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              title="Filter by Source Channel"
            >
              <option value="All">All Sources</option>
              <option value="Contact Us Portal">Contact Us Portal</option>
              <option value="Home Callback Form">Home Callback Form</option>
              <option value="Floating Callback Widget">Floating Callback Widget</option>
              <option value="Course Detail Page">Course Detail Page</option>
              <option value="Offline Walk-in (Janakpuri)">Offline Walk-in</option>
            </select>

            {/* Counselor Filter */}
            <select
              value={counselorFilter}
              onChange={(e) => setCounselorFilter(e.target.value)}
              title="Filter by Counselor"
            >
              <option value="All">All Counselors</option>
              {counselorsList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className={styles.statusTabsRow}>
          {[
            { id: 'All', label: 'All Inquiries', count: leads.length },
            { id: 'New', label: 'New Inquiries', count: leads.filter((l) => l.status === 'New').length },
            { id: 'Contacted', label: 'Contacted', count: leads.filter((l) => l.status === 'Contacted').length },
            { id: 'Follow-up required', label: 'Follow-up Required', count: leads.filter((l) => l.status === 'Follow-up required').length },
            { id: 'Demo Scheduled', label: 'Demo Scheduled', count: leads.filter((l) => l.status === 'Demo Scheduled').length },
            { id: 'Enrolled', label: 'Enrolled', count: leads.filter((l) => l.status === 'Enrolled').length },
            { id: 'Closed', label: 'Closed / Inactive', count: leads.filter((l) => l.status === 'Closed').length },
            { id: 'Dropped', label: 'Dropped', count: leads.filter((l) => l.status === 'Dropped').length }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabPill} ${selectedStatusTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setSelectedStatusTab(tab.id)}
            >
              <span>{tab.label}</span>
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. DATA TABLE / ROSTER ─── */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.rosterTable}>
            <thead>
              <tr>
                <th>Inquiry ID &amp; Time</th>
                <th>Student / Contact Details</th>
                <th>Subject &amp; Query</th>
                <th>Academic Target</th>
                <th>Score &amp; Urgency</th>
                <th>Status (1-Click Change)</th>
                <th>Counselor</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <Search size={28} />
                      </div>
                      <h3>No inquiries found matching your filters</h3>
                      <p>Try resetting the search bar or changing status tabs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const statusClass =
                    lead.status === 'New'
                      ? styles.statusNew
                      : lead.status === 'Contacted'
                      ? styles.statusContacted
                      : lead.status === 'Follow-up required'
                      ? styles.statusFollowUp
                      : lead.status === 'Demo Scheduled'
                      ? styles.statusDemo
                      : lead.status === 'Enrolled'
                      ? styles.statusEnrolled
                      : lead.status === 'Closed'
                      ? styles.statusClosed
                      : styles.statusDropped;

                  return (
                    <tr key={lead.id}>
                      {/* 1. Inquiry ID */}
                      <td>
                        <div className={styles.leadIdBadge}>
                          <span>{lead.id}</span>
                          <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={(e) => handleCopyId(lead.id, e)}
                            title="Copy Inquiry ID"
                          >
                            {copiedId === lead.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <span className={styles.timestampText}>
                          {new Date(lead.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })} • {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* 2. Student & Contact */}
                      <td className={styles.studentCell}>
                        <span className={styles.studentName}>{lead.fullName}</span>
                        <div className={styles.contactRow}>
                          <a href={`tel:${lead.mobile}`} className={styles.phoneLink}>
                            <Phone size={12} />
                            <span>{lead.mobile}</span>
                          </a>
                        </div>
                        {lead.email && <div className={styles.emailText}>{lead.email}</div>}
                        {lead.city && <div className={styles.cityText}>{lead.city}</div>}
                      </td>

                      {/* 3. Subject & Query */}
                      <td className={styles.queryCell}>
                        <span className={styles.subjectPill}>{lead.subject || 'General Inquiry'}</span>
                        <p className={styles.messagePreview} title={lead.message || lead.queryNotes}>
                          {lead.message || lead.queryNotes || 'No specific remark recorded'}
                        </p>
                        <span className={styles.sourceTag}>via {lead.source}</span>
                      </td>

                      {/* 4. Academic Target */}
                      <td className={styles.targetCell}>
                        <span className={styles.classPill}>{lead.currentClass}</span>
                        <span className={styles.batchName}>{lead.targetBatch}</span>
                        <span className={styles.timeSlot}>{lead.preferredTime}</span>
                      </td>

                      {/* 5. Priority & Score */}
                      <td className={styles.priorityScoreCell}>
                        <div
                          className={`${styles.priorityBadge} ${
                            lead.priority === 'High'
                              ? styles.highPriority
                              : lead.priority === 'Medium'
                              ? styles.mediumPriority
                              : styles.lowPriority
                          }`}
                        >
                          {lead.priority === 'High' && <Flame size={12} />}
                          <span>{lead.priority} Priority</span>
                        </div>
                        <div className={styles.scoreBarWrapper}>
                          <div className={styles.scoreProgress}>
                            <div
                              className={styles.scoreFill}
                              style={{ width: `${lead.leadScore || 70}%` }}
                            />
                          </div>
                          <span>{lead.leadScore || 70}pts</span>
                        </div>
                      </td>

                      {/* 6. Interactive Status Pill */}
                      <td>
                        <select
                          className={`${styles.statusSelectPill} ${statusClass}`}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        >
                          <option value="New">● New Inquiry</option>
                          <option value="Contacted">● Contacted</option>
                          <option value="Follow-up required">● Follow-up Required</option>
                          <option value="Demo Scheduled">● Demo Scheduled</option>
                          <option value="Enrolled">● Enrolled</option>
                          <option value="Closed">● Closed</option>
                          <option value="Dropped">● Dropped</option>
                        </select>
                      </td>

                      {/* 7. Assigned Counselor */}
                      <td>
                        <select
                          className={styles.counselorSelect}
                          value={lead.assignedCounselor || 'Admissions Desk Janakpuri'}
                          onChange={(e) => handleCounselorChange(lead.id, e.target.value)}
                        >
                          {counselorsList.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* 8. Action Buttons */}
                      <td>
                        <div className={styles.actionBtnGroup}>
                          {/* 1-Click WhatsApp Direct Chat */}
                          <button
                            type="button"
                            className={`${styles.tableActionBtn} ${styles.whatsappBtn}`}
                            onClick={(e) => handleWhatsAppClick(lead, e)}
                            title="Open Direct WhatsApp Chat with Student"
                          >
                            <MessageCircle size={15} />
                          </button>

                          {/* View Details Drawer */}
                          <button
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => setViewingLead(lead)}
                            title="View Complete Inquiry & Follow-up Timeline"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Lead */}
                          <button
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => handleOpenEditModal(lead)}
                            title="Edit Inquiry Details"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete Lead */}
                          <button
                            type="button"
                            className={`${styles.tableActionBtn} ${styles.deleteBtn}`}
                            onClick={() => setDeletingLeadId(lead.id)}
                            title="Delete Inquiry from Database"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. CREATE / EDIT MODAL ─── */}
      {isCreateModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingLead ? `Edit Inquiry #${editingLead.id}` : 'Log New Student Inquiry / Lead'}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLead}>
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  {/* Full Name */}
                  <div className={styles.inputGroup}>
                    <label>Student / Parent Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryan Sharma"
                      value={leadFormData.fullName}
                      onChange={(e) =>
                        setLeadFormData({ ...leadFormData, fullName: e.target.value })
                      }
                    />
                  </div>

                  {/* Mobile */}
                  <div className={styles.inputGroup}>
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={leadFormData.mobile}
                      onChange={(e) =>
                        setLeadFormData({ ...leadFormData, mobile: e.target.value })
                      }
                    />
                  </div>

                  {/* Email */}
                  <div className={styles.inputGroup}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. aryan.sharma@gmail.com"
                      value={leadFormData.email}
                      onChange={(e) =>
                        setLeadFormData({ ...leadFormData, email: e.target.value })
                      }
                    />
                  </div>

                  {/* City */}
                  <div className={styles.inputGroup}>
                    <label>City / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, Patna"
                      value={leadFormData.city}
                      onChange={(e) =>
                        setLeadFormData({ ...leadFormData, city: e.target.value })
                      }
                    />
                  </div>

                  {/* Current Class */}
                  <div className={styles.inputGroup}>
                    <label>Current Academic Grade</label>
                    <select
                      value={leadFormData.currentClass}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          currentClass: e.target.value as any
                        })
                      }
                    >
                      <option value="Class 10th">Class 10th (Foundation Phase)</option>
                      <option value="Class 11th">Class 11th (Target JEE 2028)</option>
                      <option value="Class 12th">Class 12th (Target JEE 2027)</option>
                      <option value="Dropper">Dropper / Repeater (Target 2026/27)</option>
                    </select>
                  </div>

                  {/* Target Batch */}
                  <div className={styles.inputGroup}>
                    <label>Target Academic Batch</label>
                    <select
                      value={leadFormData.targetBatch}
                      onChange={(e) =>
                        setLeadFormData({ ...leadFormData, targetBatch: e.target.value })
                      }
                    >
                      <option value="2-Year Ultimate JEE Main & Advanced Mastery Program">
                        2-Year Ultimate JEE Main &amp; Advanced Mastery Program
                      </option>
                      <option value="DK Sir Chapter-wise Math PYQ Video Vault & Short Tricks">
                        DK Sir Chapter-wise Math PYQ Video Vault &amp; Short Tricks
                      </option>
                      <option value="BITSAT Speed, Accuracy & Logic Mastery Crash Program">
                        BITSAT Speed, Accuracy &amp; Logic Mastery Crash Program
                      </option>
                      <option value="Class 11th & 12th Math Special (DK Sir 20s Techniques)">
                        Class 11th &amp; 12th Math Special (DK Sir 20s Techniques)
                      </option>
                      <option value="Offline Classroom Hybrid (Janakpuri Center)">
                        Offline Classroom Hybrid (Janakpuri Center)
                      </option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className={styles.inputGroup}>
                    <label>Inquiry Category / Subject</label>
                    <select
                      value={leadFormData.subject}
                      onChange={(e) =>
                        setLeadFormData({ ...leadFormData, subject: e.target.value })
                      }
                    >
                      <option value="Admissions & Batch Seat Inquiries">Admissions &amp; Batch Seat Inquiries</option>
                      <option value="Classroom Demo Session Booking">Classroom Demo Session Booking</option>
                      <option value="Scholarship Test & Diagnostic Score">Scholarship Test &amp; Diagnostic Score</option>
                      <option value="Fee Structure & Installment Plans">Fee Structure &amp; Installment Plans</option>
                      <option value="DK Sir 20s Speed Technique Guidance">DK Sir 20s Speed Technique Guidance</option>
                      <option value="Technical or Portal App Assistance">Technical or Portal App Assistance</option>
                    </select>
                  </div>

                  {/* Preferred Time Slot */}
                  <div className={styles.inputGroup}>
                    <label>Preferred Contact Slot</label>
                    <select
                      value={leadFormData.preferredTime}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          preferredTime: e.target.value as any
                        })
                      }
                    >
                      <option value="Morning (9:00 AM – 12:00 PM)">Morning (9:00 AM – 12:00 PM)</option>
                      <option value="Afternoon (12:00 PM – 4:00 PM)">Afternoon (12:00 PM – 4:00 PM)</option>
                      <option value="Evening (4:00 PM – 8:00 PM)">Evening (4:00 PM – 8:00 PM)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className={styles.inputGroup}>
                    <label>Priority</label>
                    <select
                      value={leadFormData.priority}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          priority: e.target.value as LeadPriority
                        })
                      }
                    >
                      <option value="High">🔥 High Urgency</option>
                      <option value="Medium">⚡ Medium</option>
                      <option value="Low">💤 Low</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className={styles.inputGroup}>
                    <label>Initial Status</label>
                    <select
                      value={leadFormData.status}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          status: e.target.value as LeadStatus
                        })
                      }
                    >
                      <option value="New">New Inquiry</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow-up required">Follow-up Required</option>
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Enrolled">Enrolled</option>
                    </select>
                  </div>

                  {/* Assigned Counselor */}
                  <div className={styles.inputGroup}>
                    <label>Assigned Counselor</label>
                    <select
                      value={leadFormData.assignedCounselor}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          assignedCounselor: e.target.value
                        })
                      }
                    >
                      {counselorsList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Source */}
                  <div className={styles.inputGroup}>
                    <label>Inquiry Source</label>
                    <select
                      value={leadFormData.source}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          source: e.target.value as any
                        })
                      }
                    >
                      <option value="Contact Us Portal">Contact Us Portal</option>
                      <option value="Home Callback Form">Home Callback Form</option>
                      <option value="Floating Callback Widget">Floating Callback Widget</option>
                      <option value="Course Detail Page">Course Detail Page</option>
                      <option value="Offline Walk-in (Janakpuri)">Offline Walk-in (Janakpuri)</option>
                      <option value="Admissions Helpline (Phone)">Admissions Helpline (Phone)</option>
                    </select>
                  </div>
                </div>

                {/* Specific Message */}
                <div className={styles.inputGroup} style={{ marginTop: '0.5rem' }}>
                  <label>Customer Query / Remarks</label>
                  <textarea
                    placeholder="Specific remarks, student goals, scholarship score, or parent requirements..."
                    value={leadFormData.message}
                    onChange={(e) =>
                      setLeadFormData({ ...leadFormData, message: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  {editingLead ? 'Update Inquiry' : 'Save & Register Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. SLIDE-OUT DETAILS & NOTES DRAWER ─── */}
      {viewingLead && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setViewingLead(null)} />
          <div className={styles.drawerPanel}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Inquiry Details &amp; History</h3>
                <span className={styles.leadIdBadge}>{viewingLead.id}</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setViewingLead(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.drawerContent}>
              {/* Quick Actions Bar */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    background: '#16a34a',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => handleWhatsAppClick(viewingLead, e)}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Chat</span>
                </button>

                <a
                  href={`tel:${viewingLead.mobile}`}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={16} />
                  <span>Call Student</span>
                </a>
              </div>

              {/* Student Overview */}
              <div className={styles.drawerSection}>
                <h4>Student Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Full Name:</span>
                  <span className={styles.detailVal}>{viewingLead.fullName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Mobile:</span>
                  <span className={styles.detailVal}>{viewingLead.mobile}</span>
                </div>
                {viewingLead.email && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailVal}>{viewingLead.email}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>City / Location:</span>
                  <span className={styles.detailVal}>{viewingLead.city || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Current Grade:</span>
                  <span className={styles.detailVal}>{viewingLead.currentClass}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Lead Priority:</span>
                  <span className={styles.detailVal}>{viewingLead.priority}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Lead Score:</span>
                  <span className={styles.detailVal}>{viewingLead.leadScore}/100</span>
                </div>
              </div>

              {/* Inquiry Message */}
              <div className={styles.drawerSection}>
                <h4>Customer Query &amp; Request</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Category:</span>
                  <span className={styles.detailVal}>{viewingLead.subject || 'General Guidance'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Batch Desired:</span>
                  <span className={styles.detailVal}>{viewingLead.targetBatch}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Slot:</span>
                  <span className={styles.detailVal}>{viewingLead.preferredTime}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Lead Source:</span>
                  <span className={styles.detailVal}>{viewingLead.source}</span>
                </div>
                <div style={{ marginTop: '0.85rem' }}>
                  <span className={styles.detailLabel} style={{ display: 'block', marginBottom: '0.35rem' }}>
                    Customer Query Message:
                  </span>
                  <p
                    style={{
                      background: 'rgba(2, 6, 23, 0.6)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {viewingLead.message || viewingLead.queryNotes || 'No specific remarks entered.'}
                  </p>
                </div>
              </div>

              {/* Counselor Timeline & Notes */}
              <div className={styles.drawerSection}>
                <h4>Counselor Activity Logs ({viewingLead.counselorNotes?.length || 0})</h4>

                <div className={styles.notesTimeline}>
                  {viewingLead.counselorNotes?.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>No notes logged yet.</p>
                  ) : (
                    viewingLead.counselorNotes?.map((note) => (
                      <div key={note.id} className={styles.noteItem}>
                        <div className={styles.noteHeader}>
                          <span className={styles.noteAuthor}>{note.author}</span>
                          <span className={styles.noteTime}>
                            {new Date(note.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric'
                            })} • {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={styles.noteText}>{note.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.addNoteBox}>
                  <textarea
                    placeholder="Log a call outcome, student target percentile, demo status..."
                    value={drawerNote}
                    onChange={(e) => setDrawerNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.addNoteBtn}
                    onClick={handleAddDrawerNote}
                  >
                    Add Follow-up Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── 7. DELETE CONFIRMATION DIALOG ─── */}
      {deletingLeadId && (
        <div className={styles.modalBackdrop} onClick={() => setDeletingLeadId(null)}>
          <div className={styles.deleteDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteIconBox}>
              <Trash2 size={24} />
            </div>
            <h3>Delete Inquiry #{deletingLeadId}?</h3>
            <p>
              Are you sure you want to permanently delete this customer inquiry from the database? This action cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.cancelDialogBtn}
                onClick={() => setDeletingLeadId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteConfirm}
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagementWorkspace;

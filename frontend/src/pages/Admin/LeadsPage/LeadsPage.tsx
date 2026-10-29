import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PhoneCall,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { leadService } from '../../../services/leadService';
import type { ProspectiveLead, LeadStatus } from '../../../types/lead';
import { useToast } from '../../../context/ToastContext';
import styles from './LeadsPage.module.scss';

export const LeadsPage: React.FC = () => {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<ProspectiveLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<ProspectiveLead | null>(null);
  const [newNote, setNewNote] = useState('');

  const loadLeads = () => {
    setLeads(leadService.getAllLeads());
  };

  useEffect(() => {
    loadLeads();
    const handleUpdate = () => loadLeads();
    window.addEventListener('dk_leads_updated', handleUpdate);
    return () => window.removeEventListener('dk_leads_updated', handleUpdate);
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobile.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.targetBatch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    leadService.updateLeadStatus(leadId, newStatus);
    showToast(`Lead status updated to ${newStatus}`, 'success');
    loadLeads();
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleAddNote = () => {
    if (!selectedLead || !newNote.trim()) return;
    const updated = leadService.addCounselorNote(selectedLead.id, newNote.trim(), 'Admin Desk');
    setNewNote('');
    showToast('Note added successfully', 'success');
    loadLeads();
    if (updated) setSelectedLead(updated);
  };

  const handleExportCsv = () => {
    leadService.exportLeadsToCSV();
    showToast('Leads CSV exported successfully!', 'success');
  };

  return (
    <div className={styles.leadsContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Student Inquiries &amp; Leads</h1>
          <p className={styles.pageSubtitle}>
            Track callbacks, demo bookings, and counseling requests across all touchpoints.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.exportBtn} onClick={handleExportCsv}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by student name, phone, email, or target course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <Filter size={16} className={styles.filterIcon} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="All">All Statuses ({leads.length})</option>
            <option value="New">New Inquiry</option>
            <option value="Contacted">Contacted</option>
            <option value="Demo Scheduled">Demo Scheduled</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Closed / Not Interested">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student / Contact</th>
                <th>Target Program</th>
                <th>City / Class</th>
                <th>Status</th>
                <th>Assigned Counselor</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No leads matching your current criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.studentCell}>
                        <span className={styles.studentName}>{lead.fullName}</span>
                        <div className={styles.studentMeta}>
                          <a href={`tel:${lead.mobile}`} className={styles.metaLink}>
                            <PhoneCall size={12} /> {lead.mobile}
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className={styles.metaLink}>
                              <Mail size={12} /> {lead.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.batchBadge}>{lead.targetBatch}</span>
                      {lead.source && <span className={styles.sourceTag}>via {lead.source}</span>}
                    </td>
                    <td>
                      <div className={styles.locationCell}>
                        <span>{lead.currentClass || 'Class 12'}</span>
                        <small>{lead.city || 'Delhi NCR'}</small>
                      </div>
                    </td>
                    <td>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`${styles.statusSelect} ${styles[`status_${lead.status.replace(/\s+/g, '')}`] || ''}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Demo Scheduled">Demo Scheduled</option>
                        <option value="Enrolled">Enrolled</option>
                        <option value="Closed / Not Interested">Closed</option>
                      </select>
                    </td>
                    <td>
                      <span className={styles.counselorName}>
                        {lead.assignedCounselor || 'Admissions Desk'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateCell}>
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewDetailsBtn}
                        onClick={() => setSelectedLead(lead)}
                        title="View Full Lead Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out details modal/drawer */}
      {selectedLead && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedLead(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>{selectedLead.fullName}</h3>
                <span className={styles.modalId}>{selectedLead.id}</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedLead(null)}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <label>Mobile Number</label>
                  <span>{selectedLead.mobile}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Email Address</label>
                  <span>{selectedLead.email || 'Not provided'}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Target Course</label>
                  <span>{selectedLead.targetBatch}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Current Class</label>
                  <span>{selectedLead.currentClass || 'Class 12'}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>City / Location</label>
                  <span>{selectedLead.city || 'India'}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Preferred Contact Slot</label>
                  <span>{selectedLead.preferredTime || 'Anytime'}</span>
                </div>
              </div>

              {selectedLead.queryNotes && (
                <div className={styles.notesSection}>
                  <label>Student Query / Message</label>
                  <p className={styles.queryBox}>{selectedLead.queryNotes}</p>
                </div>
              )}

              <div className={styles.counselorNotesSection}>
                <label>Counselor Logs &amp; Activity</label>
                <div className={styles.notesList}>
                  {selectedLead.counselorNotes?.map((note) => (
                    <div key={note.id} className={styles.noteItem}>
                      <div className={styles.noteMeta}>
                        <strong>{note.author}</strong>
                        <small>{new Date(note.timestamp).toLocaleString('en-IN')}</small>
                      </div>
                      <p>{note.text}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.addNoteForm}>
                  <input
                    type="text"
                    placeholder="Add follow-up notes from call..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button type="button" onClick={handleAddNote}>
                    Post Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

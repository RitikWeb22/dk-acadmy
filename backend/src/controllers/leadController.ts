import type { Request, Response } from 'express';
import { Lead } from '../models/Lead.js';
import { broadcastNewLead, broadcastLeadUpdated, broadcastLeadDeleted } from '../sockets/socket.js';
import { generateInquiryId } from '../utils/uuid.js';

// Public submission or Admin creation
export const submitLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const fullName = req.body.fullName || req.body.name;
    const mobile = req.body.mobile || req.body.phone;
    const email = req.body.email;
    const subject = req.body.subject || req.body.category || 'Admissions & Course Inquiry';
    const message = req.body.message || req.body.queryNotes || '';
    const relatedCourse = req.body.relatedCourse || req.body.targetBatch || req.body.targetExam || '';
    const currentClass = req.body.currentClass || 'Class 12th';
    const targetBatch = req.body.targetBatch || relatedCourse || 'DK Sir JEE Flagship';
    const preferredTime = req.body.preferredTime || 'Anytime';
    const city = req.body.city || 'Delhi NCR';
    const queryNotes = req.body.queryNotes || message;
    const source = req.body.source || 'Contact Us Portal';
    const priority = req.body.priority || 'Medium';
    const assignedCounselor = req.body.assignedCounselor || 'DK Sir Academic Desk';
    const followUpDate = req.body.followUpDate;

    if (!fullName || !mobile) {
      res.status(400).json({ success: false, message: 'Please provide applicant name and mobile number' });
      return;
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
      return;
    }

    // Generate unique Inquiry ID using UUID
    const leadId = generateInquiryId();

    let leadScore = 70;
    if (currentClass === 'Dropper') leadScore += 15;
    if (currentClass === 'Class 12th') leadScore += 10;
    if (targetBatch && targetBatch.includes('Math Special')) leadScore += 10;
    if (email && email.includes('@')) leadScore += 5;
    leadScore = Math.min(100, leadScore);

    const initialNoteText = message 
      ? `Query submitted via ${source || 'Website'}: "${message.slice(0, 150)}${message.length > 150 ? '...' : ''}"`
      : `Inquiry submitted via ${source || 'Website'}. Lead priority auto-assigned: ${leadScore >= 80 ? 'High' : 'Medium'}.`;

    const lead = await Lead.create({
      leadId,
      fullName: fullName.trim(),
      mobile: cleanMobile,
      email: email ? email.trim().toLowerCase() : undefined,
      subject: subject ? subject.trim() : 'General Admissions & JEE Guidance',
      message: message ? message.trim() : undefined,
      relatedCourse: relatedCourse ? relatedCourse.trim() : undefined,
      currentClass: currentClass || 'Class 11th',
      targetBatch: targetBatch || 'JEE Main & Advanced Complete',
      preferredTime: preferredTime || 'Evening',
      city: city || 'New Delhi',
      queryNotes: queryNotes || message,
      source: source || 'Contact Us Portal',
      status: 'New',
      priority: priority || (leadScore >= 80 ? 'High' : 'Medium'),
      leadScore,
      assignedCounselor: assignedCounselor || 'Admissions Desk Janakpuri',
      followUpDate: followUpDate || undefined,
      counselorNotes: [
        {
          id: `note-${Date.now()}`,
          author: 'System Admissions Bot',
          text: initialNoteText,
          timestamp: new Date().toISOString()
        }
      ]
    });

    // Real-time broadcast to connected admin desks
    broadcastNewLead(lead);

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. A senior counselor will contact you shortly.',
      data: lead
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin & Counselor: Get all leads with search, filter, and stats
export const getAllLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, priority, source, limit = 200 } = req.query;

    const queryFilter: any = {};

    if (status && status !== 'All') {
      queryFilter.status = status;
    }

    if (priority && priority !== 'All') {
      queryFilter.priority = priority;
    }

    if (source && source !== 'All') {
      queryFilter.source = source;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      queryFilter.$or = [
        { fullName: regex },
        { mobile: regex },
        { email: regex },
        { leadId: regex },
        { targetBatch: regex },
        { city: regex },
        { subject: regex },
        { queryNotes: regex },
        { message: regex }
      ];
    }

    const leads = await Lead.find(queryFilter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Calculate aggregated metrics
    const allLeadsSummary = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap: Record<string, number> = {};
    allLeadsSummary.forEach((item) => {
      statsMap[item._id] = item.count;
    });

    const totalLeads = await Lead.countDocuments();
    const highPriorityCount = await Lead.countDocuments({ priority: 'High' });

    const stats = {
      totalLeads,
      newLeads: statsMap['New'] || 0,
      contactedLeads: statsMap['Contacted'] || 0,
      followUpRequired: statsMap['Follow-up required'] || 0,
      demoScheduled: statsMap['Demo Scheduled'] || 0,
      enrolledLeads: statsMap['Enrolled'] || 0,
      closedLeads: statsMap['Closed'] || 0,
      droppedLeads: statsMap['Dropped'] || 0,
      highPriorityLeads: highPriorityCount,
      conversionRate: totalLeads > 0 ? Math.round(((statsMap['Enrolled'] || 0) / totalLeads) * 100) : 0
    };

    res.status(200).json({
      success: true,
      count: leads.length,
      stats,
      data: leads
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single lead details
export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const lead = await Lead.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { leadId: id }]
    });

    if (!lead) {
      res.status(404).json({ success: false, message: 'Inquiry / Lead record not found' });
      return;
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update lead
export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const updates = req.body;

    const lead = await Lead.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { leadId: id }]
    });

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    // Editable fields
    if (updates.fullName !== undefined) lead.fullName = updates.fullName.trim();
    if (updates.mobile !== undefined) lead.mobile = updates.mobile.trim().replace(/\D/g, '');
    if (updates.email !== undefined) lead.email = updates.email ? updates.email.trim().toLowerCase() : undefined;
    if (updates.subject !== undefined) lead.subject = updates.subject.trim();
    if (updates.message !== undefined) lead.message = updates.message.trim();
    if (updates.currentClass !== undefined) lead.currentClass = updates.currentClass;
    if (updates.targetBatch !== undefined) lead.targetBatch = updates.targetBatch;
    if (updates.preferredTime !== undefined) lead.preferredTime = updates.preferredTime;
    if (updates.city !== undefined) lead.city = updates.city;
    if (updates.queryNotes !== undefined) lead.queryNotes = updates.queryNotes;
    if (updates.status !== undefined) lead.status = updates.status;
    if (updates.priority !== undefined) lead.priority = updates.priority;
    if (updates.leadScore !== undefined) lead.leadScore = updates.leadScore;
    if (updates.assignedCounselor !== undefined) lead.assignedCounselor = updates.assignedCounselor;
    if (updates.followUpDate !== undefined) lead.followUpDate = updates.followUpDate;

    // Push new counselor note
    if (updates.newNote && updates.newNote.text) {
      lead.counselorNotes.push({
        id: `note-${Date.now()}`,
        author: updates.newNote.author || (req as any).user?.name || 'Academic Counselor',
        text: updates.newNote.text.trim(),
        timestamp: new Date().toISOString()
      });
    }

    await lead.save();

    // Real-time broadcast
    broadcastLeadUpdated(lead);

    res.status(200).json({ success: true, message: 'Lead updated successfully', data: lead });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete lead
export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const deleted = await Lead.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { leadId: id }]
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Lead not found or already deleted' });
      return;
    }

    broadcastLeadDeleted(deleted.leadId || id);

    res.status(200).json({
      success: true,
      message: `Lead ${deleted.leadId || id} deleted successfully`,
      deletedId: deleted.leadId || id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


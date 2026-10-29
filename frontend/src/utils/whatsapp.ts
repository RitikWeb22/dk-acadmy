/**
 * DK Academy JEE - WhatsApp Direct Integration Utility
 * Single-click WhatsApp API triggers for immediate counselor connectivity.
 */

export const COUNSELOR_WHATSAPP_NUMBER = '919325987875'; // Primary Admission Desk
export const JANAKPURI_OFFICE_WHATSAPP = '919717159062'; // Center Counselor

interface InquiryWhatsAppOptions {
  studentName?: string;
  targetBatch?: string;
  currentClass?: string;
  preferredTime?: string;
  question?: string;
  inquiryId?: string;
}

/**
 * Build a pre-formatted WhatsApp chat URL for prospective students contacting counselors
 */
export function getStudentWhatsAppUrl(options: InquiryWhatsAppOptions = {}): string {
  const {
    studentName,
    targetBatch,
    currentClass,
    preferredTime,
    question,
    inquiryId
  } = options;

  const parts: string[] = ['*Hello DK Sir & Academic Counseling Team,*'];

  if (studentName?.trim()) {
    parts.push(`My name is *${studentName.trim()}*.`);
  }

  if (targetBatch?.trim()) {
    parts.push(`I am inquiring about admission in *${targetBatch.trim()}*${currentClass ? ` for (${currentClass})` : ''}.`);
  } else if (currentClass) {
    parts.push(`I am currently in *${currentClass}* preparing for IIT JEE.`);
  }

  if (preferredTime?.trim()) {
    parts.push(`My preferred time for discussion is *${preferredTime.trim()}*.`);
  }

  if (question?.trim()) {
    parts.push(`Question / Note: "${question.trim()}"`);
  }

  if (inquiryId?.trim()) {
    parts.push(`(Reference ID: ${inquiryId.trim()})`);
  } else {
    parts.push('Please guide me regarding batch schedules, test series, and DK Sir 20s speed techniques.');
  }

  const encodedMessage = encodeURIComponent(parts.join('\n\n'));
  return `https://wa.me/${COUNSELOR_WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Build a pre-formatted WhatsApp outreach URL for counselors contacting students
 */
export function getCounselorOutreachWhatsAppUrl(
  studentMobile: string,
  studentName: string,
  targetBatch: string,
  counselorName: string = 'Senior Academic Counselor'
): string {
  // Format mobile number to international format with 91 prefix
  const cleanNumber = studentMobile.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;

  const message = [
    `*Hello ${studentName.trim()},*`,
    `This is *${counselorName}* from *DK Academy JEE (Janakpuri Center)*.`,
    `I am reaching out regarding your callback inquiry for the *${targetBatch}*.`,
    'I would be happy to walk you through our batch structure, syllabus milestones, and DK Sir\'s classroom schedule.',
    'Are you available for a brief 5-minute academic discussion now, or shall I call during your preferred slot?'
  ].join('\n\n');

  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}

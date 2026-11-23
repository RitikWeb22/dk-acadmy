import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const formatIndianWhatsAppNumber = (phone: string): string => {
  const digitsOnly = phone.toString().replace(/\D/g, '');
  const tenDigit = digitsOnly.slice(-10);
  return `91${tenDigit}`;
};

export interface WhatsAppSendResult {
  success: boolean;
  deliveredVia: 'whatsapp' | 'console';
  messageId?: string;
  error?: string;
}

/**
 * Sends a 6-digit verification / recovery OTP to a student via WhatsApp
 * Uses Meta WhatsApp Cloud API (Free Tier 1,000 conversations/month)
 */
export const sendWhatsAppOtp = async (
  phone: string,
  studentName: string,
  otp: string
): Promise<WhatsAppSendResult> => {
  const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) {
    logger.warn({ phone }, '[WhatsAppService] Invalid 10-digit phone number provided');
    return { success: false, deliveredVia: 'console', error: 'Invalid 10-digit phone number' };
  }

  const recipient = formatIndianWhatsAppNumber(cleanPhone);
  const displayName = studentName?.trim() || 'Aspirant';

  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  // If Meta API credentials are not yet configured in .env, log OTP to console for seamless dev testing
  if (!token || !phoneId) {
    console.log('\n======================================================');
    console.log(`[DEV WHATSAPP OTP DISPATCH] DK Academy JEE`);
    console.log(`Recipient : +${recipient} (${displayName})`);
    console.log(`OTP Code  : >>> ${otp} <<< (Valid for 10 minutes)`);
    console.log('======================================================\n');
    return { success: true, deliveredVia: 'console' };
  }

  const messageBody = `*DK ACADEMY JEE — Account Recovery*\n\nHello *${displayName}*,\n\nYour 6-digit password recovery code is:\n\n👉 *${otp}*\n\n⏱ This code is valid for *10 minutes*.\nPlease do not share this code with anyone.\n\n— Team DK Academy JEE`;

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody
        }
      })
    });

    const data: any = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status} from WhatsApp API`;
      logger.error({ error: data, phone: recipient }, '[WhatsAppService] Meta API error');
      return { success: false, deliveredVia: 'whatsapp', error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    logger.info({ messageId, recipient }, '[WhatsAppService] WhatsApp OTP delivered successfully');
    return { success: true, deliveredVia: 'whatsapp', messageId };
  } catch (err: any) {
    logger.error({ error: err.message, recipient }, '[WhatsAppService] Network error sending WhatsApp message');
    return { success: false, deliveredVia: 'whatsapp', error: err.message };
  }
};

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter: Transporter | null = null;

export const getEmailTransporter = (): Transporter | null => {
  if (transporter) return transporter;

  const host = env.SMTP_HOST || 'smtp.hostinger.com';
  const port = env.SMTP_PORT || 465;
  const user = env.SMTP_USER || 'info@dkacademyjee.com';
  const pass = env.SMTP_PASS;

  if (!pass || pass.trim() === '') {
    logger.warn('[EmailService] SMTP_PASS is empty in backend/.env. OTPs will be displayed in server logs for testing.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: env.SMTP_SECURE ?? (Number(port) === 465),
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    return transporter;
  } catch (err: any) {
    logger.error({ err: err.message }, '[EmailService] Failed to initialize Nodemailer transporter');
    return null;
  }
};

/**
 * Dispatches 6-digit OTP email to student for account password reset
 */
export const sendPasswordResetOtpEmail = async (
  toEmail: string,
  studentName: string,
  otp: string
): Promise<{ success: boolean; deliveredVia: 'smtp' | 'console'; error?: string }> => {
  const mailer = getEmailTransporter();
  const cleanEmail = toEmail.trim().toLowerCase();
  const displayName = studentName?.trim() || 'Aspirant';

  if (!mailer) {
    console.log('\n======================================================');
    console.log(`[DEV OTP DISPATCH] DK Academy JEE Account Recovery`);
    console.log(`Recipient : ${cleanEmail} (${displayName})`);
    console.log(`OTP Code  : >>> ${otp} <<< (Valid for 10 minutes)`);
    console.log('======================================================\n');
    return { success: true, deliveredVia: 'console' };
  }

  try {
    const fromName = env.SMTP_FROM_NAME || 'DK Academy JEE';
    const fromEmail = env.SMTP_FROM || env.SMTP_USER || 'info@dkacademyjee.com';

    await mailer.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: cleanEmail,
      subject: `${otp} is your DK Academy JEE password recovery code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
            .card { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
            .brand-sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
            .content { padding: 32px 28px; }
            .otp-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #15803d; margin: 0; }
            .expiry-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-top: 8px; }
            .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1 class="brand">DK ACADEMY JEE</h1>
              <div class="brand-sub">Premier JEE Main, Advanced & BITSAT Coaching</div>
            </div>
            <div class="content">
              <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${displayName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                We received a request to reset your password for your student account linked to <strong>${cleanEmail}</strong>. Enter the 6-digit recovery code below on the portal:
              </p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry-badge">⏱ Expires in 10 minutes</div>
              </div>
              <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
                If you did not request this, please disregard this email or notify administration immediately. Your password remains safe and unchanged.
              </p>
            </div>
            <div class="footer">
              This is an automated notification from DK Academy Student Portal. Please do not reply to this email.<br>
              Support: info@dkacademyjee.com
            </div>
          </div>
        </body>
        </html>
      `
    });

    logger.info({ to: cleanEmail }, '[EmailService] Password reset OTP sent successfully via Hostinger SMTP');
    return { success: true, deliveredVia: 'smtp' };
  } catch (err: any) {
    logger.error({ err: err.message, to: cleanEmail }, '[EmailService] Nodemailer dispatch failed');
    return { success: false, deliveredVia: 'smtp', error: err.message };
  }
};

/**
 * Modular SMS OTP placeholder (ready for Fast2SMS / MSG91 / Twilio)
 */
export const sendSmsOtp = async (phone: string, otp: string): Promise<boolean> => {
  // When SMS pack credentials are provided, integrate SMS provider API here
  console.log(`[DEV SMS OTP] To: +91-${phone} | OTP: ${otp}`);
  return true;
};

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

    const currentYear = new Date().getFullYear();
    const portalUrl = 'https://dkacademyjee.com';

    await mailer.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: cleanEmail,
      subject: `${otp} is your DK Academy JEE Verification Code`,
      text: `Hello ${displayName},\n\nYour 6-digit verification code to reset your DK Academy student account password is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email. Your account remains secure.\n\nDK Academy JEE — Premier Engineering Entrance Institute\nSupport: info@dkacademyjee.com`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${otp} — DK Academy Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 40px 16px;">
            <tr>
              <td align="center">
                <!-- Main Container Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border: 1px solid #1e293b;">
                  
                  <!-- Premium Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #090d16 0%, #0f172a 40%, #1e3a8a 100%); padding: 40px 32px 36px; text-align: center; border-bottom: 3px solid #3b82f6;">
                      <!-- Security Badge Pill -->
                      <div style="display: inline-block; padding: 6px 16px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(147, 197, 253, 0.35); border-radius: 9999px; margin-bottom: 16px;">
                        <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #93c5fd;">
                          &#128274; Security Verification
                        </span>
                      </div>
                      
                      <!-- Brand Title -->
                      <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase;">
                        DK ACADEMY
                      </h1>
                      
                      <!-- Brand Subtitle / Specialties -->
                      <div style="margin-top: 8px; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #fbbf24;">
                        JEE MAIN &bull; ADVANCED &bull; BITSAT
                      </div>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 36px 36px 28px; background-color: #ffffff;">
                      <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                        Password Reset Verification
                      </h2>

                      <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.65; color: #475569;">
                        Hello <strong style="color: #0f172a;">${displayName}</strong>,
                      </p>

                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.65; color: #475569;">
                        We received a request to reset the password for your DK Academy student account associated with <strong style="color: #1e3a8a; text-decoration: underline;">${cleanEmail}</strong>.
                      </p>

                      <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                        Enter the 6-digit one-time password (OTP) below:
                      </p>

                      <!-- High-Impact OTP Box -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #2563eb; border-radius: 14px;">
                        <tr>
                          <td style="padding: 24px 16px; text-align: center;">
                            <div style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1e3a8a; margin-left: 12px;">
                              ${otp}
                            </div>
                            <div style="margin-top: 12px;">
                              <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #fde68a;">
                                &#9201; Valid for 10 minutes only
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Action Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
                        <tr>
                          <td align="center">
                            <a href="${portalUrl}/forgot-password" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                              Complete Password Reset &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Security Shield Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; margin: 0 0 16px;">
                        <tr>
                          <td style="padding: 14px 16px;">
                            <div style="font-size: 12px; font-weight: 700; color: #15803d; margin-bottom: 4px;">
                              &#128737; Security Guarantee
                            </div>
                            <div style="font-size: 12px; line-height: 1.55; color: #166534;">
                              Never share this OTP with anyone. DK Academy educators and staff will <strong>never</strong> contact you asking for your password or verification code.
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Disclaimer -->
                      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
                        If you did not initiate this request, you can safely ignore this email. Your account password remains strictly confidential and secure.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #475569;">
                        DK ACADEMY JEE &bull; BITSAT PREPARATION
                      </p>
                      <p style="margin: 0 0 12px; font-size: 12px; color: #64748b; line-height: 1.5;">
                        Need assistance? Contact our student helpline at <a href="mailto:info@dkacademyjee.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">info@dkacademyjee.com</a>
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                        &copy; ${currentYear} DK Academy JEE. All rights reserved. &bull; This is an automated security notification.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
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

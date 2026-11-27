import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
let transporter = null;
export const getEmailTransporter = () => {
    if (transporter)
        return transporter;
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
    }
    catch (err) {
        logger.error({ err: err.message }, '[EmailService] Failed to initialize Nodemailer transporter');
        return null;
    }
};
/**
 * Dispatches 6-digit OTP email to student for account password reset
 */
export const sendPasswordResetOtpEmail = async (toEmail, studentName, otp) => {
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
        await mailer.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: cleanEmail,
            subject: `${otp} is your DK Academy verification code`,
            text: `Hello ${displayName},\n\nYour 6-digit verification code to reset your DK Academy password is: ${otp}\n\nThis code will expire in 10 minutes.\n\nFor security reasons, never share this OTP with anyone. If you did not request this, please ignore this email.\n\nDK Academy JEE\nSupport: info@dkacademyjee.com`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${otp} — Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 16px;">
            <tr>
              <td align="center">
                <!-- Main Clean Light Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; border-top: 4px solid #1e3a8a; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); overflow: hidden;">
                  
                  <!-- Clean Header -->
                  <tr>
                    <td style="padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9;">
                      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                        DK ACADEMY
                      </h1>
                      <div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">
                        JEE MAIN &bull; ADVANCED &bull; BITSAT
                      </div>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 28px 32px 24px;">
                      <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.6; color: #334155;">
                        Hello <strong>${displayName}</strong>,
                      </p>

                      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
                        We received a request to reset your password. Use the verification code below on the portal to proceed:
                      </p>

                      <!-- Clean Light OTP Box -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 0 0 22px;">
                        <tr>
                          <td style="padding: 22px 16px; text-align: center;">
                            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">
                              One-Time Password (OTP)
                            </div>
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; margin: 4px 0 8px; margin-left: 8px;">
                              ${otp}
                            </div>
                            <div style="font-size: 12px; color: #64748b;">
                              ⏱ Valid for <strong>10 minutes</strong>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Security Advisory Notice -->
                      <div style="background-color: #f8fafc; border-left: 3px solid #94a3b8; padding: 12px 14px; border-radius: 4px; font-size: 12px; line-height: 1.55; color: #475569; margin: 0 0 16px;">
                        <strong>Security Notice:</strong> Never share this code with anyone. DK Academy will never ask for your verification code. If you did not make this request, you can safely ignore this email.
                      </div>
                    </td>
                  </tr>

                  <!-- Clean Minimal Footer -->
                  <tr>
                    <td style="padding: 18px 32px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                      <div>DK Academy JEE &bull; Support: <a href="mailto:info@dkacademyjee.com" style="color: #64748b; text-decoration: underline;">info@dkacademyjee.com</a></div>
                      <div style="margin-top: 4px;">&copy; ${currentYear} DK Academy. All rights reserved.</div>
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
    }
    catch (err) {
        logger.error({ err: err.message, to: cleanEmail }, '[EmailService] Nodemailer dispatch failed');
        return { success: false, deliveredVia: 'smtp', error: err.message };
    }
};
import { sendFast2SmsOtp } from './smsService.js';
/**
 * Dispatches SMS OTP via Fast2SMS
 */
export const sendSmsOtp = async (phone, otp) => {
    const res = await sendFast2SmsOtp(phone, otp);
    return res.success;
};

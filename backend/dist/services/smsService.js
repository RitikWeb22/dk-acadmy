import { logger } from '../config/logger.js';
/**
 * Normalizes an Indian mobile number to 10 digits (e.g. "+91 98765-43210" -> "9876543210").
 * Returns empty string if invalid.
 */
export const normalizeIndianPhone = (rawPhone) => {
    if (!rawPhone)
        return '';
    const digits = String(rawPhone).replace(/\D/g, '');
    let tenDigits = digits;
    if (digits.length === 12 && digits.startsWith('91')) {
        tenDigits = digits.slice(2);
    }
    else if (digits.length === 11 && digits.startsWith('0')) {
        tenDigits = digits.slice(1);
    }
    return /^[6-9]\d{9}$/.test(tenDigits) ? tenDigits : '';
};
/**
 * Masks a 10-digit phone number for UI display (e.g. "9876543210" -> "+91 ******3210").
 */
export const maskIndianPhone = (phone10) => {
    const clean = normalizeIndianPhone(phone10) || String(phone10).replace(/\D/g, '').slice(-10);
    if (clean.length < 4)
        return '+91 **********';
    return `+91 ${'*'.repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
};
const postFast2Sms = async (apiKey, payload) => {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
            authorization: apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(payload)
    });
    let data = null;
    try {
        data = await response.json();
    }
    catch {
        data = { message: await response.text().catch(() => 'Invalid Fast2SMS response') };
    }
    return {
        ok: response.ok && Boolean(data?.return),
        data,
        status: response.status
    };
};
/**
 * Dispatches a 6-digit OTP SMS via Fast2SMS Bulk V2 API.
 * Uses `otp` route first (or FAST2SMS_ROUTE), and automatically falls back to `q` (Quick SMS)
 * if the account uses Quick SMS instead of the OTP route.
 */
export const sendFast2SmsOtp = async (rawPhone, otp) => {
    const clean10 = normalizeIndianPhone(rawPhone);
    if (!clean10) {
        return {
            success: false,
            provider: 'fast2sms',
            error: 'Invalid 10-digit Indian mobile number.'
        };
    }
    const apiKey = (process.env.FAST2SMS_API_KEY || '').trim();
    if (!apiKey) {
        logger.warn({ phone: maskIndianPhone(clean10) }, '[SmsService] FAST2SMS_API_KEY is not configured');
        return {
            success: false,
            provider: 'fast2sms',
            error: 'SMS service is not configured (FAST2SMS_API_KEY missing).'
        };
    }
    const preferredRoute = (process.env.FAST2SMS_ROUTE || 'otp').trim().toLowerCase();
    try {
        const primaryPayload = preferredRoute === 'q'
            ? {
                route: 'q',
                message: `Your DK Academy JEE password reset OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
                language: 'english',
                flash: 0,
                numbers: clean10
            }
            : {
                route: 'otp',
                variables_values: otp,
                numbers: clean10
            };
        const primaryRes = await postFast2Sms(apiKey, primaryPayload);
        if (primaryRes.ok) {
            logger.info({ phone: maskIndianPhone(clean10), route: preferredRoute, requestId: primaryRes.data?.request_id }, '[SmsService] Fast2SMS OTP dispatched successfully');
            return {
                success: true,
                provider: 'fast2sms',
                routeUsed: preferredRoute,
                messageId: primaryRes.data?.request_id
            };
        }
        // If 'otp' route failed (e.g. DLT/OTP route disabled on Fast2SMS account), try Quick SMS ('q') fallback
        if (preferredRoute !== 'q') {
            logger.warn({ phone: maskIndianPhone(clean10), primaryError: primaryRes.data?.message }, '[SmsService] Fast2SMS primary otp route rejected; attempting Quick SMS (q) fallback');
            const fallbackRes = await postFast2Sms(apiKey, {
                route: 'q',
                message: `Your DK Academy JEE password reset OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
                language: 'english',
                flash: 0,
                numbers: clean10
            });
            if (fallbackRes.ok) {
                logger.info({ phone: maskIndianPhone(clean10), route: 'q', requestId: fallbackRes.data?.request_id }, '[SmsService] Fast2SMS Quick SMS OTP dispatched successfully');
                return {
                    success: true,
                    provider: 'fast2sms',
                    routeUsed: 'q',
                    messageId: fallbackRes.data?.request_id
                };
            }
            const errMsg = Array.isArray(fallbackRes.data?.message)
                ? fallbackRes.data.message.join(', ')
                : String(fallbackRes.data?.message || primaryRes.data?.message || 'Fast2SMS dispatch failed');
            logger.error({ phone: maskIndianPhone(clean10), err: errMsg }, '[SmsService] Fast2SMS dispatch failed');
            return { success: false, provider: 'fast2sms', error: errMsg };
        }
        const errMsg = Array.isArray(primaryRes.data?.message)
            ? primaryRes.data.message.join(', ')
            : String(primaryRes.data?.message || 'Fast2SMS dispatch failed');
        logger.error({ phone: maskIndianPhone(clean10), err: errMsg }, '[SmsService] Fast2SMS dispatch failed');
        return { success: false, provider: 'fast2sms', error: errMsg };
    }
    catch (err) {
        logger.error({ err: err?.message, phone: maskIndianPhone(clean10) }, '[SmsService] Fast2SMS network/request error');
        return {
            success: false,
            provider: 'fast2sms',
            error: err?.message || 'Network error contacting Fast2SMS'
        };
    }
};

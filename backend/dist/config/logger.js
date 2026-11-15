import pino from 'pino';
import { env } from './env.js';
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';
export const logger = pino({
    level: isTest ? 'silent' : (isProduction ? 'info' : 'debug'),
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'token',
            'refreshToken',
            'secret',
            'key_secret',
            'razorpay_signature',
            'razorpay_payment_id',
            'jwt_secret',
            'credential'
        ],
        censor: '[REDACTED]'
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: isProduction ? { pid: process.pid } : undefined,
    formatters: {
        level: (label) => ({ level: label })
    }
});

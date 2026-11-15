import crypto from 'crypto';
import { logger } from '../config/logger.js';
/**
 * High-performance Structured HTTP Request Logger powered by Pino.
 * Attaches unique correlation ID and logs duration, status code, and IP.
 */
export const requestLogger = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    const startTime = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const url = req.originalUrl || req.url;
        // Skip verbose logs for health checks
        if (url.startsWith('/health') || url.startsWith('/api/v1/health')) {
            return;
        }
        const logData = {
            requestId,
            method: req.method,
            url,
            statusCode: res.statusCode,
            durationMs,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        if (res.statusCode >= 500) {
            logger.error(logData, `[HTTP ${res.statusCode}] ${req.method} ${url} failed in ${durationMs}ms`);
        }
        else if (res.statusCode >= 400) {
            logger.warn(logData, `[HTTP ${res.statusCode}] ${req.method} ${url} in ${durationMs}ms`);
        }
        else {
            logger.info(logData, `[HTTP ${res.statusCode}] ${req.method} ${url} completed in ${durationMs}ms`);
        }
    });
    next();
};

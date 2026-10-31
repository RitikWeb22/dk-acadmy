import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Global API Rate Limiter
 * Restricts excessive automated traffic, API scanning, and brute force flooding.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded: Too many requests from this IP address. Please try again later.'
  }
});

/**
 * Strict Auth Limiter for sensitive endpoints like login & password reset
 */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. For your security, access has been temporarily delayed. Please retry in 15 minutes.'
  }
});

/**
 * NoSQL & Parameter Pollution Sanitizer
 * Recursively removes MongoDB operator keys (e.g. $gt, $ne, $regex) and dotted keys
 * to stop NoSQL injection attacks dead in their tracks.
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // Basic XSS mitigation: neutralize blatant executable script tags
      return obj.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  for (const key of Object.keys(obj)) {
    // Check for MongoDB injection operators or dot notation path traversal
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      obj[key] = sanitizeObject(obj[key]);
    }
  }

  return obj;
}

export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
};

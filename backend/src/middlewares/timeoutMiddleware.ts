import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export interface TimeoutOptions {
  defaultTimeoutMs?: number;
  extendedTimeoutMs?: number;
}

/**
 * Request Timeout Middleware
 * Automatically terminates hanging requests after the designated threshold (default 30s; 120s for bulk/uploads).
 * Prevents hung database connections and stale worker memory locks.
 */
export const requestTimeout = (options: TimeoutOptions = {}) => {
  const defaultTimeoutMs = options.defaultTimeoutMs || 30000;
  const extendedTimeoutMs = options.extendedTimeoutMs || 120000;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine timeout threshold based on route workload
    const isHeavyRoute =
      req.path.includes('/upload') ||
      req.path.includes('/math-import') ||
      req.path.includes('/video') ||
      req.path.includes('/import');

    const timeoutLimit = isHeavyRoute ? extendedTimeoutMs : defaultTimeoutMs;

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(
          {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            timeoutLimit
          },
          `[Request Timeout] Request exceeded ${timeoutLimit}ms threshold`
        );

        res.status(408).json({
          success: false,
          error: 'REQUEST_TIMEOUT',
          message: `The request took longer than ${timeoutLimit / 1000} seconds to process and was terminated.`
        });
      }
    }, timeoutLimit);

    // Cancel timer when response finishes or closes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

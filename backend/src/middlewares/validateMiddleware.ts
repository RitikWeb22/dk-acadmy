import type { Request, Response, NextFunction } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError.js';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format (must be 24 hex characters)');

export const idParamSchema = z
  .object({
    id: objectIdSchema
  })
  .strict();

export const idOrSlugParamSchema = z
  .object({
    id: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_\-\.]+$/, 'Invalid identifier format')
  })
  .strict();

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().max(100).optional()
  })
  .passthrough();

export const leadSubmissionSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    mobile: z.string().trim().regex(/^\+?[0-9\s\-]{10,15}$/, 'Please provide a valid 10-digit phone number'),
    email: z.string().trim().email('Invalid email format').optional().or(z.literal('')),
    subject: z.string().trim().max(120).optional(),
    message: z.string().trim().max(1000).optional()
  })
  .passthrough();

/**
 * Universal Zod Request Validator Middleware
 * Safely parses and sanitizes req.body, req.query, and req.params against designated Zod schemas.
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const errors = result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return next(new AppError('Invalid path parameters', 400, errors));
        }
        req.params = result.data as any;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const errors = result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return next(new AppError('Invalid query string parameters', 400, errors));
        }
        req.query = result.data as any;
      }

      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const errors = result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return next(new AppError('Invalid request body schema', 400, errors));
        }
        req.body = result.data as any;
      }

      next();
    } catch (err: any) {
      next(err);
    }
  };
};

import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Higher-order async handler wrapper.
 * Catches unhandled Promise rejections and passes them directly to Express next(err)
 * for centralized error handling without repetitive try/catch boilerplate.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Operational Application Error with HTTP status codes and optional structured details.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, details?: any): AppError {
    return new AppError(msg, 400, details);
  }

  static unauthorized(msg = 'Authentication required'): AppError {
    return new AppError(msg, 401);
  }

  static forbidden(msg = 'Access denied'): AppError {
    return new AppError(msg, 403);
  }

  static notFound(msg = 'Resource not found'): AppError {
    return new AppError(msg, 404);
  }

  static conflict(msg: string, details?: any): AppError {
    return new AppError(msg, 409, details);
  }

  static internal(msg = 'An unexpected internal error occurred'): AppError {
    return new AppError(msg, 500);
  }
}

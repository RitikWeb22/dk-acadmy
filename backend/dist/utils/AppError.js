/**
 * Operational Application Error with HTTP status codes and optional structured details.
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(msg, details) {
        return new AppError(msg, 400, details);
    }
    static unauthorized(msg = 'Authentication required') {
        return new AppError(msg, 401);
    }
    static forbidden(msg = 'Access denied') {
        return new AppError(msg, 403);
    }
    static notFound(msg = 'Resource not found') {
        return new AppError(msg, 404);
    }
    static conflict(msg, details) {
        return new AppError(msg, 409, details);
    }
    static internal(msg = 'An unexpected internal error occurred') {
        return new AppError(msg, 500);
    }
}

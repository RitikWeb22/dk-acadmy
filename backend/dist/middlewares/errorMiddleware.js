import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
export const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Not Found - ${req.originalUrl}`
    });
};
/**
 * Centralized Production Error Handler
 * Standardizes responses across AppError, Zod validation, Mongoose, and JWT failures.
 * Employs structured Pino logging and protects stack traces in production.
 */
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    let message = err.message || 'Internal Server Error';
    let errors = err.details || undefined;
    // 1. Handle Custom Operational AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.details;
    }
    // 2. Handle Zod Validation Error
    else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation failed';
        errors = err.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message
        }));
    }
    // 3. Handle Mongoose CastError (e.g. malformed ObjectId)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid resource identifier format: ${err.value}`;
    }
    // 4. Handle Mongoose duplicate key error (code 11000)
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `Duplicate entry: A record with that ${field} already exists.`;
    }
    // 5. Handle Mongoose Validation Error
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        const validationErrors = Object.values(err.errors || {}).map((e) => e.message);
        message = `Validation failed: ${validationErrors.join(', ')}`;
        errors = validationErrors;
    }
    // 6. Handle JWT Authentication & Expiry Errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token signature.';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired. Please sign in again.';
    }
    // Log error using Pino with correlation ID
    if (env.NODE_ENV !== 'test') {
        const errorDetails = {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode,
            message,
            ...(statusCode >= 500 ? { stack: err.stack } : {})
        };
        if (statusCode >= 500) {
            logger.error(errorDetails, `[Centralized Error] ${req.method} ${req.originalUrl} failed`);
        }
        else {
            logger.warn(errorDetails, `[Client Warning] ${req.method} ${req.originalUrl} -> ${statusCode}`);
        }
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors ? { errors } : {}),
        ...(env.NODE_ENV === 'production' ? {} : { stack: err.stack })
    });
};

import { z } from 'zod';
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
export const validate = (schemas) => {
    return async (req, res, next) => {
        try {
            if (schemas.params) {
                const result = schemas.params.safeParse(req.params);
                if (!result.success) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid path parameters',
                        errors: result.error.issues.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message
                        }))
                    });
                    return;
                }
                req.params = result.data;
            }
            if (schemas.query) {
                const result = schemas.query.safeParse(req.query);
                if (!result.success) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid query string parameters',
                        errors: result.error.issues.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message
                        }))
                    });
                    return;
                }
                req.query = result.data;
            }
            if (schemas.body) {
                const result = schemas.body.safeParse(req.body);
                if (!result.success) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid request body schema',
                        errors: result.error.issues.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message
                        }))
                    });
                    return;
                }
                req.body = result.data;
            }
            next();
        }
        catch (err) {
            res.status(400).json({
                success: false,
                message: 'Request validation failed',
                error: err.message
            });
        }
    };
};
